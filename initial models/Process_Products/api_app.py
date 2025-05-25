# backend_gemini_server.py (running on port 5001)
from flask import Flask, request, jsonify
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
import json
import os
import re
import time
import random
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")

try:
    genai.configure(api_key=API_KEY)
    print("Gemini API configured successfully.")
except Exception as e:
    raise RuntimeError(f"Failed to configure Gemini API: {e}")


CLASSIFICATION_MODEL = "gemini-1.5-flash"
GENERATION_MODELS_FALLBACK = ["gemini-1.5-flash", "gemini-1.0-pro"]
MAX_RETRIES = 3
INITIAL_BACKOFF_SECS = 3
MAX_BACKOFF_SECS = 60
BACKOFF_FACTOR = 2
GENERATION_CONFIG_SENTIMENT = {"temperature": 0.1, "top_p": 1, "top_k": 1, "max_output_tokens": 50}
SENTIMENT_ANALYSIS_MODEL = "gemini-1.5-flash"
SENTIMENT_TIMEOUT = 90 # secs

generation_config_structured = { "temperature": 0.6, "top_p": 1, "top_k": 1, "max_output_tokens": 300 }
generation_config_food = { "temperature": 0.4, "top_p": 1, "top_k": 1, "max_output_tokens": 200 }
generation_config_classify = { "temperature": 0.2, "top_p": 1, "top_k": 1, "max_output_tokens": 10 }
# NEW: Config for product aspects analysis
generation_config_aspects = { "temperature": 0.5, "top_p": 1, "top_k": 1, "max_output_tokens": 250, "response_mime_type": "application/json"}


safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
CLASSIFICATION_TIMEOUT = 60
GENERATION_TIMEOUT = 120
# NEW: Timeout for aspects analysis
ASPECTS_ANALYSIS_TIMEOUT = 120
ASPECTS_ANALYSIS_MODEL = "gemini-1.5-flash" # Using flash for speed, can be 1.0-pro for more detail


# --- Helper Functions (classify_product_type, _call_gemini_api_with_retry, analyze_review_sentiment, generate_food_details, generate_structured_description) ---
# ... (Keep all existing helper functions as they are) ...
def classify_product_type(product_name, main_image_url):
    """Calls Gemini to classify product type. Returns classification or error string."""
    prompt = f"""
    Based on the product name and main image URL, classify this product.
    Product Name: {product_name}
    Main Image URL: {main_image_url}
    Is this primarily a FOOD product intended for consumption?
    Respond ONLY with the single word: Food, Non-Food, or Unknown.
    """
    print(f"   Classifying product type for: {product_name}")
    last_exception = None
    try:
        model = genai.GenerativeModel(model_name=CLASSIFICATION_MODEL,
                                      generation_config=generation_config_classify,
                                      safety_settings=safety_settings)
        current_backoff = INITIAL_BACKOFF_SECS
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = model.generate_content(prompt, request_options={"timeout": CLASSIFICATION_TIMEOUT})
                if response.parts:
                    classification = response.text.strip().capitalize()
                    if classification in ["Food", "Non-food", "Unknown"]:
                         if classification == "Non-food": classification = "Non-Food"
                         print(f"   Classification result: {classification}")
                         return classification
                    else:
                         print(f"   WARN: Unexpected classification response: '{response.text.strip()}'. Treating as Unknown.")
                         return "Unknown" 
                else:
                    print(f"   WARN (Classify, Attempt {attempt+1}): Empty/blocked response.")
                    last_exception = Exception("Classification Blocked/Empty Response")
                    break 

            except (google_exceptions.ResourceExhausted, google_exceptions.DeadlineExceeded,
                    google_exceptions.ServiceUnavailable, google_exceptions.InternalServerError) as e:
                 last_exception = e
                 print(f"   WARN (Classify, Attempt {attempt+1}): API Error: {type(e).__name__}. Retrying in {current_backoff:.2f}s...")
                 if attempt < MAX_RETRIES:
                    time.sleep(current_backoff + random.uniform(0, 1))
                    current_backoff = min(current_backoff * BACKOFF_FACTOR, MAX_BACKOFF_SECS)
                 else:
                    print(f"   ERROR (Classify): Max retries reached.")
                    break 
            except Exception as e: 
                 last_exception = e
                 print(f"   ERROR (Classify, Attempt {attempt+1}): Unexpected error during generation: {e}")
                 break

    except Exception as e: 
         last_exception = e
         print(f"   ERROR: Could not instantiate or use classification model {CLASSIFICATION_MODEL}: {e}")

    error_msg = f"Error: Classification failed. Last error: {type(last_exception).__name__}: {last_exception}" if last_exception else "Error: Classification failed."
    print(f"   Classification failed for {product_name}. Error: {error_msg}")
    return error_msg 

def _call_gemini_api_with_retry(model_name, prompt, generation_config, safety_settings, timeout, operation_name="Generation"):
    """
    Helper function to call the Gemini API with retry and backoff.
    Returns the response text or an error string.
    """
    last_exception = None
    try:
        model = genai.GenerativeModel(model_name=model_name,
                                      generation_config=generation_config,
                                      safety_settings=safety_settings)
        current_backoff = INITIAL_BACKOFF_SECS
        for attempt in range(MAX_RETRIES + 1):
            try:
                print(f"      {operation_name} (Attempt {attempt+1}) on {model_name} for prompt: '{str(prompt)[:150]}...'")
                response = model.generate_content(prompt, request_options={"timeout": timeout})
                
                if response.parts:
                    text_response = response.text.strip()
                    # If JSON is expected, try to parse it to validate early
                    if generation_config.get("response_mime_type") == "application/json":
                        try:
                            json.loads(text_response) # Validate JSON
                        except json.JSONDecodeError as je:
                            print(f"      WARN ({operation_name}, Attempt {attempt+1}): Invalid JSON response from {model_name}: {je}. Response: '{text_response}'")
                            last_exception = je # Treat as a failure for this attempt
                            # Potentially retry or break depending on strategy. For now, let retry logic handle it.
                            if attempt < MAX_RETRIES:
                                time.sleep(current_backoff + random.uniform(0, 1))
                                current_backoff = min(current_backoff * BACKOFF_FACTOR, MAX_BACKOFF_SECS)
                                continue # Skip to next retry
                            else: # Max retries reached for JSON error
                                break 
                    print(f"      SUCCESS with {model_name} (Attempt {attempt+1}), Response: '{text_response}'")
                    return text_response
                else:
                    prompt_feedback_msg = ""
                    if response.prompt_feedback and response.prompt_feedback.block_reason:
                        prompt_feedback_msg = f" (Block Reason: {response.prompt_feedback.block_reason})"
                    
                    print(f"      WARN ({operation_name}, Attempt {attempt+1}): Empty/blocked response on {model_name}.{prompt_feedback_msg}")
                    last_exception = Exception(f"{operation_name} Blocked/Empty Response from {model_name}.{prompt_feedback_msg}")
            
            except (google_exceptions.ResourceExhausted, google_exceptions.DeadlineExceeded,
                    google_exceptions.ServiceUnavailable, google_exceptions.InternalServerError) as e:
                last_exception = e
                print(f"      WARN ({operation_name}, Attempt {attempt+1}): API Error: {type(e).__name__}: {str(e)}. Retrying in {current_backoff:.2f}s...")
                if attempt < MAX_RETRIES:
                    time.sleep(current_backoff + random.uniform(0, 1))
                    current_backoff = min(current_backoff * BACKOFF_FACTOR, MAX_BACKOFF_SECS)
                else:
                    print(f"      ERROR ({operation_name}): Max retries reached on {model_name} due to API errors.")
                    break 
            except Exception as e:
                last_exception = e
                print(f"      ERROR ({operation_name}, Attempt {attempt+1}): Unexpected error on {model_name}: {type(e).__name__}: {str(e)}")
                break 
        
        if last_exception:
            error_msg = f"Error: {operation_name} failed on {model_name}. Last error: {type(last_exception).__name__}: {str(last_exception)}"
            print(f"      Final error for {operation_name} on {model_name}: {error_msg}")
            return error_msg
        
        final_error_msg = f"Error: {operation_name} failed on {model_name} after all retries (likely due to repeated empty/blocked responses without explicit API errors)."
        print(f"      Final error for {operation_name} on {model_name}: {final_error_msg}")
        return final_error_msg

    except Exception as e: 
         last_exception = e 
         error_msg = f"Error: Could not instantiate or use model {model_name} for {operation_name}. Error: {type(e).__name__}: {str(e)}"
         print(f"      {error_msg}")
         return error_msg


def analyze_review_sentiment(review_text):
    """Analyzes sentiment of a single review. Returns 'Positive', 'Negative', 'Neutral', or 'Unknown'."""
    prompt = f"""
    Analyze the sentiment of the following customer review.
    Classify it as 'Positive', 'Negative', or 'Neutral'.
    Respond with ONLY one of these three words. Do not add any other explanatory text.

    Review: "{review_text}"

    Sentiment:""" 
    
    print(f"   Analyzing sentiment for review: '{review_text[:100]}...'")

    response_text = _call_gemini_api_with_retry(
        model_name=SENTIMENT_ANALYSIS_MODEL,
        prompt=prompt,
        generation_config=GENERATION_CONFIG_SENTIMENT,
        safety_settings=safety_settings,
        timeout=SENTIMENT_TIMEOUT,
        operation_name="SentimentAnalysis"
    )

    print(f"   DEBUG: Raw response_text from _call_gemini_api_with_retry for sentiment: '{response_text}' for review: '{review_text[:50]}...'")

    if isinstance(response_text, str) and response_text.startswith("Error:"):
        return "Unknown"

    cleaned_response = response_text.strip().capitalize().replace("*", "")

    if cleaned_response in ["Positive", "Negative", "Neutral"]:
        print(f"   Sentiment classified as: {cleaned_response} for review: '{review_text[:50]}...'")
        return cleaned_response
    else:
        print(f"   WARN: Unexpected sentiment response: '{response_text}'. Treating as Unknown for review: '{review_text[:50]}...'")
        return "Unknown"


def generate_food_details(product_name, main_image, last_three_thumbnails):
    """Generates food details. Returns details string or error string."""
    thumbnail_str = "\n".join(last_three_thumbnails) if last_three_thumbnails else "None provided"
    prompt = f"""
    Analyze the potential FOOD product information below, focusing ONLY on ingredients and FSSAI number potentially visible in the thumbnail images.
    Product Name: {product_name}
    Main Image URL: {main_image}
    Last Three Thumbnail URLs (check these for back-of-pack info):
    {thumbnail_str}
    Extract the following, keeping it very brief. State if information is not visible.
    Potential Ingredients (brief summary, if visible): [Summarize key ingredients seen OR state 'Not clearly visible']
    FSSAI Number (if visible): [State number found OR 'Not clearly visible']
    IMPORTANT: - ONLY report information potentially visible... - Be concise... - If details aren't visible, explicitly state that.
    """
    print(f"   Generating food details for: {product_name}")
    last_exception = None
    for model_name in GENERATION_MODELS_FALLBACK:
        print(f"      Trying model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name=model_name,
                                          generation_config=generation_config_food,
                                          safety_settings=safety_settings)
            current_backoff = INITIAL_BACKOFF_SECS
            for attempt in range(MAX_RETRIES + 1):
                try:
                    response = model.generate_content(prompt, request_options={"timeout": GENERATION_TIMEOUT})
                    if response.parts:
                        details = response.text.strip()
                        print(f"      SUCCESS with {model_name} (Attempt {attempt+1})")
                        return details 
                    else: 
                         print(f"      WARN (Food Gen, Attempt {attempt+1}): Empty/blocked response.")
                         last_exception = Exception("Food Gen Blocked/Empty Response")
                         break 

                except (google_exceptions.ResourceExhausted, google_exceptions.DeadlineExceeded,
                        google_exceptions.ServiceUnavailable, google_exceptions.InternalServerError) as e:
                     last_exception = e
                     print(f"      WARN (Food Gen, Attempt {attempt+1}): API Error: {type(e).__name__}. Retrying in {current_backoff:.2f}s...")
                     if attempt < MAX_RETRIES:
                        time.sleep(current_backoff + random.uniform(0, 1))
                        current_backoff = min(current_backoff * BACKOFF_FACTOR, MAX_BACKOFF_SECS)
                     else:
                        print(f"      ERROR (Food Gen): Max retries reached on {model_name}.")
                        break
                except Exception as e:
                     last_exception = e
                     print(f"      ERROR (Food Gen, Attempt {attempt+1}): Unexpected error: {e}")
                     break

        except Exception as e:
             last_exception = e
             print(f"      ERROR: Could not use generation model {model_name}: {e}")
            
    error_msg = f"Error: Could not generate food details. Last error: {type(last_exception).__name__}" if last_exception else "Error: Generation failed."
    print(f"   Food detail generation failed for {product_name}. Error: {error_msg}")
    return error_msg


def generate_structured_description(product_name, main_image, last_two_thumbnails):
    """Generates non-food description. Returns description string or error string."""
    thumbnail_str = ", ".join(last_two_thumbnails) if last_two_thumbnails else "None"
    prompt = f"""
    Analyze the following product information and generate a concise description with potential pros and cons:
    Product Name: {product_name}
    Main Image URL: {main_image}
    Key Thumbnail URLs: {thumbnail_str}
    Structure the output EXACTLY like this:
    **What it is:** [Brief 1-2 sentence description...]
    **Potential Pros:**
    * [Infer benefit...]
    * [Infer another benefit...]
    **Potential Cons/Considerations:**
    * [General consideration...]
    * [Another consideration...]
    IMPORTANT: - Keep brief... - Base ONLY on provided info... - Use cautious language... - Output ONLY the structured text...
    """
    print(f"   Generating structured non-food description for: {product_name}")
    last_exception = None
    for model_name in GENERATION_MODELS_FALLBACK:
        print(f"      Trying model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name=model_name,
                                          generation_config=generation_config_structured,
                                          safety_settings=safety_settings)
            current_backoff = INITIAL_BACKOFF_SECS
            for attempt in range(MAX_RETRIES + 1):
                try:
                    response = model.generate_content(prompt, request_options={"timeout": GENERATION_TIMEOUT})
                    if response.parts:
                        description = response.text.strip()
                        print(f"      SUCCESS with {model_name} (Attempt {attempt+1})")
                        return description 
                    else: 
                         print(f"      WARN (Struct Gen, Attempt {attempt+1}): Empty/blocked response.")
                         last_exception = Exception("Struct Gen Blocked/Empty Response")
                         break 

                except (google_exceptions.ResourceExhausted, google_exceptions.DeadlineExceeded,
                        google_exceptions.ServiceUnavailable, google_exceptions.InternalServerError) as e:
                     last_exception = e
                     print(f"      WARN (Struct Gen, Attempt {attempt+1}): API Error: {type(e).__name__}. Retrying in {current_backoff:.2f}s...")
                     if attempt < MAX_RETRIES:
                        time.sleep(current_backoff + random.uniform(0, 1))
                        current_backoff = min(current_backoff * BACKOFF_FACTOR, MAX_BACKOFF_SECS)
                     else:
                        print(f"      ERROR (Struct Gen): Max retries reached on {model_name}.")
                        break 
                except Exception as e:
                     last_exception = e
                     print(f"      ERROR (Struct Gen, Attempt {attempt+1}): Unexpected error: {e}")
                     break 

        except Exception as e: 
             last_exception = e
             print(f"      ERROR: Could not use generation model {model_name}: {e}")

    error_msg = f"Error: Could not generate structured description. Last error: {type(last_exception).__name__}" if last_exception else "Error: Generation failed."
    print(f"   Structured description generation failed for {product_name}. Error: {error_msg}")
    return error_msg

# NEW: Function to analyze product aspects for bar graph
def analyze_product_aspects(product_name, highlights, description, specifications):
    """
    Analyzes product information to identify positive and negative aspects and assign scores.
    Returns a dictionary with scores and keywords, or an error dictionary.
    """
    highlights_str = "\n".join(highlights) if highlights else "Not available"
    # Truncate description and specifications if too long to avoid overly long prompts
    description_str = (description[:500] + '...') if description and len(description) > 500 else (description or "Not available")
    
    # Create a string from specifications dictionary
    specs_list = []
    if isinstance(specifications, dict):
        for key, value in list(specifications.items())[:10]: # Limit to first 10 specs
            specs_list.append(f"{key}: {value}")
    specs_str = "\n".join(specs_list) if specs_list else "Not available"

    prompt = f"""
    Analyze the following product information to identify its key positive and negative aspects.
    Provide a score from 0 to 10 for the overall positive content (0 being not positive, 10 being extremely positive) 
    and a score from 0 to 10 for the overall negative content (0 being not negative, 10 being extremely negative).
    Also, list up to 5 keywords or short phrases summarizing the main positive aspects and up to 5 for negative aspects.

    Product Name: {product_name}
    Highlights:
    {highlights_str}
    Description:
    {description_str}
    Specifications:
    {specs_str}

    Your response MUST be a valid JSON object with the following exact structure:
    {{
      "positive_score": <integer_score_0_to_10>,
      "negative_score": <integer_score_0_to_10>,
      "positive_keywords": ["keyword1", "keyword2", ...],
      "negative_keywords": ["keyword1", "keyword2", ...]
    }}
    Ensure keywords are concise. If no clear negative aspects are found, "negative_keywords" can be an empty list and "negative_score" should be low (0-2).
    Similarly for positive aspects. Focus on inherent product qualities, features, or common perceptions.
    """
    print(f"   Analyzing product aspects for: {product_name}")

    response_text = _call_gemini_api_with_retry(
        model_name=ASPECTS_ANALYSIS_MODEL,
        prompt=prompt,
        generation_config=generation_config_aspects, # Uses response_mime_type: application/json
        safety_settings=safety_settings,
        timeout=ASPECTS_ANALYSIS_TIMEOUT,
        operation_name="ProductAspectsAnalysis"
    )

    if isinstance(response_text, str) and response_text.startswith("Error:"):
        print(f"   Error during product aspects analysis: {response_text}")
        return {"error": response_text, "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": []}

    try:
        # The response should already be JSON because of response_mime_type
        # However, if the model fails to produce valid JSON despite the instruction, this will catch it.
        # Remove potential markdown code block delimiters if present
        cleaned_json_text = re.sub(r"```json\s*|\s*```", "", response_text, flags=re.DOTALL).strip()
        aspects_data = json.loads(cleaned_json_text)
        
        # Validate structure
        if not all(k in aspects_data for k in ["positive_score", "negative_score", "positive_keywords", "negative_keywords"]):
            raise ValueError("Missing required keys in aspects_data JSON.")
        if not isinstance(aspects_data["positive_score"], int) or not isinstance(aspects_data["negative_score"], int):
            raise ValueError("Scores must be integers.")
        if not isinstance(aspects_data["positive_keywords"], list) or not isinstance(aspects_data["negative_keywords"], list):
            raise ValueError("Keywords must be lists.")
            
        print(f"   Product aspects analysis successful: {aspects_data}")
        return aspects_data
    except json.JSONDecodeError as e:
        print(f"   Error decoding JSON from product aspects analysis: {e}. Response was: {response_text}")
        return {"error": "Invalid JSON response from aspects analysis.", "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": []}
    except ValueError as e:
        print(f"   Error validating JSON structure from product aspects analysis: {e}. Response was: {response_text}")
        return {"error": f"Invalid JSON structure: {e}", "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": []}


# --- Flask App Initialization ---
app = Flask(__name__)

@app.route('/process_product', methods=['POST'])
def process_product_endpoint():
    print(f"\nReceived request on /process_product")
    if not request.is_json:
        print("   Error: Request body is not JSON")
        return jsonify({"error": "Request body must be JSON"}), 400
    data = request.get_json()
    print(f"   Received JSON data: {str(data)[:200]}...")
    try:
        images_data = data.get("images")
        if not isinstance(images_data, dict):
            raise ValueError("'images' key missing or not a dictionary")
        product_name = images_data.get("product_name")
        main_image = images_data.get("main_image")
        thumbnails = images_data.get("thumbnails", [])
        if not product_name or not isinstance(product_name, str):
            raise ValueError("Missing or invalid 'product_name'")
        if not main_image or not isinstance(main_image, str):
            raise ValueError("Missing or invalid 'main_image'")
        if not isinstance(thumbnails, list):
            print("   Warning: 'thumbnails' is not a list, treating as empty.")
            thumbnails = []
    except (KeyError, ValueError, TypeError) as e:
        print(f"   Error: Invalid input JSON structure - {e}")
        return jsonify({"error": f"Invalid input JSON structure: {e}"}), 400
    except Exception as e:
        print(f"   Error: Unexpected error during input processing - {e}")
        return jsonify({"error": f"Unexpected error processing input: {e}"}), 500

    product_type = classify_product_type(product_name, main_image)
    if isinstance(product_type, str) and product_type.startswith("Error:"):
        print(f"   Classification failed, returning error.")
        return jsonify({"product_name": product_name, "main_image": main_image, "error": product_type }), 500

    generated_content = None
    generation_error = None
    used_thumbnails_count = 0
    try:
        if product_type == "Food":
            print("   Product classified as FOOD. Generating food details.")
            last_three_thumbnails = thumbnails[-3:]
            used_thumbnails_count = len(last_three_thumbnails)
            generated_content = generate_food_details(product_name, main_image, last_three_thumbnails)
        else:
            if product_type == "Unknown": print("   Product type UNKNOWN, generating standard description.")
            else: print(f"   Product classified as NON-FOOD. Generating structured description.")
            last_two_thumbnails = thumbnails[-2:]
            used_thumbnails_count = len(last_two_thumbnails)
            generated_content = generate_structured_description(product_name, main_image, last_two_thumbnails)
        if isinstance(generated_content, str) and generated_content.startswith("Error:"):
            generation_error = generated_content
            generated_content = None
            print(f"   Generation failed: {generation_error}")
    except Exception as e:
        print(f"   Error: Unexpected error during generation step - {e}")
        generation_error = f"Unexpected error during generation: {e}"
        generated_content = None

    output_data = {
        "product_name": product_name,
        "main_image": main_image,
        "determined_product_type": product_type,
        "used_thumbnails_count": used_thumbnails_count
    }
    if generation_error:
        output_data["error"] = generation_error
        status_code = 500 
    elif product_type == "Food":
        output_data["food_product_details"] = generated_content
        status_code = 200
    else: 
        output_data["structured_description"] = generated_content
        status_code = 200
    print(f"   Responding with status code {status_code}.")
    return jsonify(output_data), status_code


@app.route('/analyze_sentiments', methods=['POST'])
def analyze_sentiments_endpoint():
    print(f"\nReceived request on /analyze_sentiments")
    if not request.is_json:
        print("   Error: Request body is not JSON")
        return jsonify({"error": "Request body must be JSON"}), 400
    data = request.get_json()
    reviews_list = data.get("reviews")
    if not reviews_list or not isinstance(reviews_list, list):
        print("   Error: Missing or invalid 'reviews' list in JSON payload")
        return jsonify({"error": "Missing or invalid 'reviews' list"}), 400
    sentiments = []
    for review_text in reviews_list:
        if isinstance(review_text, str) and review_text.strip():
            sentiment = analyze_review_sentiment(review_text)
            sentiments.append(sentiment)
        else:
            sentiments.append("Unknown")
    print(f"   Analyzed sentiments: {sentiments}")
    return jsonify({"sentiments": sentiments}), 200

# NEW: Endpoint for product aspects analysis
@app.route('/analyze_product_aspects', methods=['POST'])
def analyze_product_aspects_endpoint():
    """
    API endpoint to analyze product aspects for bar graph.
    Expects JSON: {"product_name": "...", "highlights": [...], "description": "...", "specifications": {...}}
    """
    print(f"\nReceived request on /analyze_product_aspects")
    if not request.is_json:
        print("   Error: Request body is not JSON")
        return jsonify({"error": "Request body must be JSON"}), 400

    data = request.get_json()
    product_name = data.get("product_name")
    highlights = data.get("highlights", [])
    description = data.get("description", "")
    specifications = data.get("specifications", {}) # Scraped specifications

    if not product_name:
        print("   Error: Missing 'product_name' in request for aspects analysis.")
        return jsonify({"error": "Missing 'product_name'"}), 400

    aspect_analysis_result = analyze_product_aspects(product_name, highlights, description, specifications)

    if "error" in aspect_analysis_result and aspect_analysis_result.get("positive_score") == 0 : # Check if it's a significant error
        return jsonify(aspect_analysis_result), 500
    
    return jsonify(aspect_analysis_result), 200


if __name__ == '__main__':
    print("Starting Flask development server...")
    app.run(debug=True, host='0.0.0.0', port=5001)