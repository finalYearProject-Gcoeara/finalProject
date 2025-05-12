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
GENERATION_CONFIG_SENTIMENT = {"temperature": 0.1, "top_p": 1, "top_k": 1, "max_output_tokens": 50} # For short classifications
SENTIMENT_ANALYSIS_MODEL = "gemini-1.5-flash" # Or another suitable model
SENTIMENT_TIMEOUT = 90 # secs

generation_config_structured = { "temperature": 0.6, "top_p": 1, "top_k": 1, "max_output_tokens": 300 }
generation_config_food = { "temperature": 0.4, "top_p": 1, "top_k": 1, "max_output_tokens": 200 }
generation_config_classify = { "temperature": 0.2, "top_p": 1, "top_k": 1, "max_output_tokens": 10 }
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
CLASSIFICATION_TIMEOUT = 60  # sec
GENERATION_TIMEOUT = 120 # sec

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
                print(f"      {operation_name} (Attempt {attempt+1}) on {model_name} for prompt: '{str(prompt)[:150]}...'") # Increased prompt log
                response = model.generate_content(prompt, request_options={"timeout": timeout})
                
                # DEBUG: Print the full response object to inspect it thoroughly
                # print(f"      DEBUG Full Response Object (Attempt {attempt+1}): {response}")

                if response.parts:
                    text_response = response.text.strip()
                    print(f"      SUCCESS with {model_name} (Attempt {attempt+1}), Response: '{text_response}'")
                    return text_response
                else:
                    # Check for prompt feedback if available
                    prompt_feedback_msg = ""
                    if response.prompt_feedback and response.prompt_feedback.block_reason:
                        prompt_feedback_msg = f" (Block Reason: {response.prompt_feedback.block_reason})"
                    
                    print(f"      WARN ({operation_name}, Attempt {attempt+1}): Empty/blocked response on {model_name}.{prompt_feedback_msg}")
                    last_exception = Exception(f"{operation_name} Blocked/Empty Response from {model_name}.{prompt_feedback_msg}")
                    # If it's blocked, retrying immediately with the same model and prompt might not help.
                    # For single model operations (like sentiment, classification), we let retry happen.
                    # For fallback operations, we'd break here to try the next model.
                    # Since sentiment uses a single model strategy for now, we continue retrying.
            
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
        
        # If loop finishes without success for this model
        if last_exception:
            error_msg = f"Error: {operation_name} failed on {model_name}. Last error: {type(last_exception).__name__}: {str(last_exception)}"
            print(f"      Final error for {operation_name} on {model_name}: {error_msg}")
            return error_msg
        
        # This case means MAX_RETRIES were exhausted likely due to repeated empty/blocked responses not throwing specific API errors
        final_error_msg = f"Error: {operation_name} failed on {model_name} after all retries (likely due to repeated empty/blocked responses without explicit API errors)."
        print(f"      Final error for {operation_name} on {model_name}: {final_error_msg}")
        return final_error_msg

    except Exception as e: # Catch errors during model instantiation
         last_exception = e # Assign to last_exception so it's not None
         error_msg = f"Error: Could not instantiate or use model {model_name} for {operation_name}. Error: {type(e).__name__}: {str(e)}"
         print(f"      {error_msg}") # Print the error here
         return error_msg


def analyze_review_sentiment(review_text):
    """Analyzes sentiment of a single review. Returns 'Positive', 'Negative', 'Neutral', or 'Unknown'."""
    prompt = f"""
    Analyze the sentiment of the following customer review.
    Classify it as 'Positive', 'Negative', or 'Neutral'.
    Respond with ONLY one of these three words. Do not add any other explanatory text.

    Review: "{review_text}"

    Sentiment:""" # Removed trailing newline in prompt, just in case
    
    print(f"   Analyzing sentiment for review: '{review_text[:100]}...'") # Log which review

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
        # Error already logged by _call_gemini_api_with_retry
        return "Unknown"

    cleaned_response = response_text.strip().capitalize()
    # Remove potential markdown like "**Positive**" -> "Positive"
    cleaned_response = cleaned_response.replace("*", "")

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
    # --- Add Retry & Fallback Logic Here (identical to previous script) ---
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
                        return details # Success!
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

        except Exception as e: # Catch errors during model instantiation
             last_exception = e
             print(f"      ERROR: Could not use generation model {model_name}: {e}")

    error_msg = f"Error: Could not generate structured description. Last error: {type(last_exception).__name__}" if last_exception else "Error: Generation failed."
    print(f"   Structured description generation failed for {product_name}. Error: {error_msg}")
    return error_msg


# --- Flask App Initialization ---
app = Flask(__name__)

@app.route('/process_product', methods=['POST'])
def process_product_endpoint():
    """
    API endpoint to process product JSON data.
    Expects JSON payload in the request body matching the input structure.
    Returns JSON response with classification and description/details.
    """
    print(f"\nReceived request on /process_product")

    if not request.is_json:
        print("   Error: Request body is not JSON")
        return jsonify({"error": "Request body must be JSON"}), 400

    data = request.get_json()
    print(f"   Received JSON data: {str(data)[:200]}...") # Log snippet

    try:
        images_data = data.get("images")
        if not isinstance(images_data, dict):
            raise ValueError("'images' key missing or not a dictionary")

        product_name = images_data.get("product_name")
        main_image = images_data.get("main_image")
        thumbnails = images_data.get("thumbnails", []) # Default to empty list

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
        # Return 500 for API errors, maybe 503 Service Unavailable if appropriate
        return jsonify({
            "product_name": product_name,
            "main_image": main_image,
            "error": product_type 
        }), 500


    generated_content = None
    generation_error = None
    used_thumbnails_count = 0

    try:
        if product_type == "Food":
            print("   Product classified as FOOD. Generating food details.")
            last_three_thumbnails = thumbnails[-3:]
            used_thumbnails_count = len(last_three_thumbnails)
            generated_content = generate_food_details(
                product_name, main_image, last_three_thumbnails
            )
        else:
            if product_type == "Unknown":
                 print("   Product type UNKNOWN, generating standard description.")
            else:
                 print(f"   Product classified as NON-FOOD. Generating structured description.")
            last_two_thumbnails = thumbnails[-2:]
            used_thumbnails_count = len(last_two_thumbnails)
            generated_content = generate_structured_description(
                product_name, main_image, last_two_thumbnails
            )

        if isinstance(generated_content, str) and generated_content.startswith("Error:"):
            generation_error = generated_content
            generated_content = None # Clear content if it's an error message
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
    """
    API endpoint to analyze sentiment of a list of reviews.
    Expects JSON payload: {"reviews": ["review text 1", "review text 2", ...]}
    Returns JSON response: {"sentiments": ["Positive", "Negative", ...]}
    """
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
            sentiments.append("Unknown") # Handle empty or invalid review strings

    print(f"   Analyzed sentiments: {sentiments}")
    return jsonify({"sentiments": sentiments}), 200


if __name__ == '__main__':
    print("Starting Flask development server...")
    app.run(debug=True, host='0.0.0.0', port=5001)