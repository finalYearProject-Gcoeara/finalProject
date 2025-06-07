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
import requests

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY") # <<< NEW: Get Perplexity API Key

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")
if not PERPLEXITY_API_KEY: # <<< NEW: Check for Perplexity API Key
    raise ValueError("PERPLEXITY_API_KEY environment variable not set.")

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
ALLOWED_PRODUCT_CATEGORIES = [
    "Auto products",
    "Medical goods",
    "Health and beauty products",
    "Appliances and electronics",
    "Household goods",
    "Furniture",
    "Souvenirs and presents",
    "Media (books, disks and concert tickets)", # Corrected "disks"
    "Jewelry and clocks", # Corrected "jewelry"
    "Technical and industrial equipment",
    "Food and kindred products",
    "Pet supplies",
    "Sport equipment and hobbies",
    "Clothing and footwear",
    "General stores",
    "Other" # Added an "Other" category as a fallback for the model
]

PERPLEXITY_API_ENDPOINT = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_EXTRACTION_MODEL = "sonar-pro" 
PERPLEXITY_USER_SEGMENTATION_MODEL = "sonar-pro"
PERPLEXITY_TIMEOUT = 120

def classify_product_type(product_name, main_image_url):
    """Calls Gemini to classify product type into a predefined category.
    Returns the classified category or 'Unknown' if classification fails or is ambiguous."""

    # Create a numbered list string for the prompt
    category_list_str = "\n".join([f"{i+1}. {cat}" for i, cat in enumerate(ALLOWED_PRODUCT_CATEGORIES)])

    prompt = f"""
    Based on the product name and main image URL, classify this product into ONE of the following categories.
    Choose the single BEST fitting category from the list.

    Product Name: {product_name}
    Main Image URL: {main_image_url}

    Categories:
    {category_list_str}

    Respond ONLY with the exact name of the chosen category from the list provided above (e.g., "Clothing and footwear", "Appliances and electronics", "Other").
    If none of the categories fit well, respond with "Other".
    If the product is completely unidentifiable or the information is insufficient, respond with "Unknown".
    """
    print(f"   Classifying product type for: {product_name} into detailed categories.")
    last_exception = None
    
    # Slightly increased max_output_tokens as category names can be longer
    current_generation_config = {**generation_config_classify, "max_output_tokens": 50}

    try:
        model = genai.GenerativeModel(model_name=CLASSIFICATION_MODEL,
                                      generation_config=current_generation_config,
                                      safety_settings=safety_settings)
        current_backoff = INITIAL_BACKOFF_SECS
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = model.generate_content(prompt, request_options={"timeout": CLASSIFICATION_TIMEOUT})
                if response.parts:
                    # The model might return the category with or without the number, or with slight variations.
                    # We'll try to match it robustly.
                    raw_classification_text = response.text.strip()
                    print(f"   Raw classification response (Attempt {attempt+1}): '{raw_classification_text}'")

                    # Attempt to find an exact match first (case-insensitive for robustness)
                    best_match = None
                    for category in ALLOWED_PRODUCT_CATEGORIES + ["Unknown"]: # Include "Unknown" as a valid direct response
                        if category.lower() == raw_classification_text.lower():
                            best_match = category
                            break
                    
                    if best_match:
                        if best_match == "Food and kindred products":
                            print(f"   Classification result: {best_match} (Normalized to 'Food' for some systems if needed)")
                        else:
                            print(f"   Classification result: {best_match}")
                        return best_match
                    else:
                        print(f"   WARN: Unexpected classification response: '{raw_classification_text}'. Does not exactly match allowed categories. Treating as 'Other' or 'Unknown'.")
                        # If the model says "Other" or "Unknown", respect that.
                        if "other" in raw_classification_text.lower():
                             print(f"   Classification result: Other (inferred from '{raw_classification_text}')")
                             return "Other"
                        # If it's a short, unidentifiable response, or contains "unknown"
                        if len(raw_classification_text) < 5 or "unknown" in raw_classification_text.lower():
                            print(f"   Classification result: Unknown (inferred from '{raw_classification_text}')")
                            return "Unknown"
                        # Fallback to Other if it's a longer response but not matching
                        print(f"   Classification result: Other (defaulted from '{raw_classification_text}')")
                        return "Other"

                else: # No parts in response (e.g., blocked)
                    prompt_feedback_msg = ""
                    if response.prompt_feedback and response.prompt_feedback.block_reason:
                        prompt_feedback_msg = f" (Block Reason: {response.prompt_feedback.block_reason})"
                    print(f"   WARN (Classify, Attempt {attempt+1}): Empty/blocked response.{prompt_feedback_msg}")
                    last_exception = Exception(f"Classification Blocked/Empty Response.{prompt_feedback_msg}")
                    # Let retry logic handle it or break if it's a hard block
                    if response.prompt_feedback and response.prompt_feedback.block_reason:
                        break # Don't retry if API explicitly blocked it.

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

    error_msg_detail = f"Last error: {type(last_exception).__name__}: {last_exception}" if last_exception else "No specific error."
    print(f"   Classification failed for {product_name}. {error_msg_detail}")
    return "Unknown" # Default to "Unknown" on any significant failure

def clean_structured_description(text):
    if not text: return ""
    # Remove '**What it is:**' heading (case-insensitive)
    text = re.sub(r'\*\*What it is:\*\*', '', text, flags=re.IGNORECASE).strip()
    
    # Remove '**Potential Pros:**' section including its content up to the next section or end of string
    # Uses a non-greedy match '.*?' and a positive lookahead '(?=...)'
    text = re.sub(r'\*\*Potential Pros:\*\*.*?(?=(\*\*Potential Cons(?:/Considerations)?:\*\*|\*\*\w+:\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL).strip()
    
    # Remove '**Potential Cons(?:/Considerations)?:\*\*' section including its content up to the next section or end of string
    text = re.sub(r'\*\*Potential Cons(?:/Considerations)?:\*\*.*?(?=(\*\*\w+:\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL).strip()
    
    # Remove any remaining asterisks used for bullet points
    text = text.replace('*', '').strip()
    
    # Remove leading/trailing newlines and multiple consecutive newlines, replace with a single space if they separate words
    text = re.sub(r'\s*\n\s*', ' ', text).strip() # Replace newlines surrounded by spaces with a single space
    text = re.sub(r'\n+', '\n', text).strip() # Collapse multiple newlines to one (if any remain after above)
        
    return text

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

def _call_perplexity_api(messages, max_tokens=200, temperature=0.2, model=PERPLEXITY_EXTRACTION_MODEL):
    """Helper function to make a call to Perplexity API."""
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    try:
        print(f"   Sending request to Perplexity AI with model {model}. Messages: {str(messages)[:200]}...")
        response = requests.post(PERPLEXITY_API_ENDPOINT, headers=headers, json=payload, timeout=PERPLEXITY_TIMEOUT)
        response.raise_for_status()
        response_data = response.json()
        print(f"   Perplexity AI raw API response: {str(response_data)[:300]}...")
        if response_data.get("choices") and len(response_data["choices"]) > 0:
            content = response_data["choices"][0].get("message", {}).get("content", "")
            return content, None # content, error
        else:
            return None, f"No choices in Perplexity response: {response_data}"
    except requests.exceptions.HTTPError as http_err:
        error_detail = http_err.response.text if hasattr(http_err, 'response') and http_err.response is not None else str(http_err)
        print(f"   HTTP error calling Perplexity AI: {http_err}. Details: {error_detail}")
        return None, f"API HTTP Error: {http_err} - {error_detail}"
    except requests.exceptions.RequestException as e:
        print(f"   Request error calling Perplexity AI: {e}")
        return None, f"API Request Error: {e}"
    except Exception as e:
        print(f"   Unexpected error during Perplexity AI call: {e}")
        return None, f"Unexpected error: {e}"
    
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
    Analyze the potential product information below, focusing ONLY on ingredients and FSSAI number potentially visible in the thumbnail images if the product is a FOOD item.
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


def extract_fssai_with_perplexity(product_name, context_text=""):
    """Extracts FSSAI number using Perplexity."""
    print(f"   Attempting to extract FSSAI for '{product_name}' using Perplexity.")
    messages = [
        {"role": "system", "content": "You are an AI assistant. Your sole task is to find and return the 14-digit FSSAI license number for the given Indian food product. Use web search if necessary. If found, return ONLY the 14-digit FSSAI number and nothing else. If not found or not applicable, return 'Not clearly visible'."},
        {"role": "user", "content": f"Product: {product_name}\nContext: {context_text}\nWhat is the FSSAI number?"}
    ]
    content, error = _call_perplexity_api(messages, max_tokens=30, temperature=0.1)
    if error:
        return "Error finding FSSAI", error
    if content:
        # Try to find a 14-digit number
        fssai_match = re.search(r'\b(\d{14})\b', content)
        if fssai_match:
            print(f"   Perplexity found FSSAI: {fssai_match.group(1)}")
            return fssai_match.group(1), None
        elif "not clearly visible" in content.lower() or "not found" in content.lower() or "n/a" in content.lower():
             print(f"   Perplexity indicated FSSAI not visible/found. Raw: {content}")
             return "Not clearly visible", None
        else: # Model returned something else
            print(f"   Perplexity returned non-FSSAI for FSSAI query: {content}")
            return "Not clearly visible", f"Unexpected FSSAI response: {content}" # Or more specific error
    return "Not clearly visible", "No content from Perplexity for FSSAI."


def extract_ingredients_with_perplexity(product_name, context_text=""):
    """Extracts ingredients using Perplexity."""
    print(f"   Attempting to extract Ingredients for '{product_name}' using Perplexity.")
    messages = [
        {"role": "system", "content": "You are an AI assistant. Your task is to list the potential ingredients for the given food product. Use web search if necessary. If ingredients are found, list them clearly. If not found, return 'Not clearly visible'. Respond only with the ingredients list or 'Not clearly visible'."},
        {"role": "user", "content": f"Product: {product_name}\nContext: {context_text}\nWhat are the potential ingredients?"}
    ]
    content, error = _call_perplexity_api(messages, max_tokens=200, temperature=0.2) # Allow more tokens for ingredients
    if error:
        return "Error finding ingredients", error
    if content:
        if "not clearly visible" in content.lower() or "not found" in content.lower() or "n/a" in content.lower() and len(content) < 30: # Check length for brief "not found"
            print(f"   Perplexity indicated Ingredients not visible/found. Raw: {content}")
            return "Not clearly visible", None
        print(f"   Perplexity found Ingredients: {content[:100]}...") # Log snippet
        return content.strip(), None
    return "Not clearly visible", "No content from Perplexity for ingredients."


def extract_food_details_with_perplexity_combined(product_name, description_text, highlights_text):
    """
    Uses Perplexity AI to extract FSSAI number and potential ingredients by making targeted calls.
    Returns a dictionary: {"ingredients": "...", "fssai": "...", "error_ingredients": "...", "error_fssai": "..."}
    """
    print(f"   Extracting food details for '{product_name}' using Perplexity AI (Combined approach).")
    
    # Combine available text for context
    context_parts = [f"Product Name: {product_name}"]
    if description_text: context_parts.append(f"Description: {description_text}")
    if highlights_text: context_parts.append(f"Highlights: {highlights_text}")
    full_context = "\n".join(context_parts)

    ingredients, ingredients_error = extract_ingredients_with_perplexity(product_name, full_context)
    fssai, fssai_error = extract_fssai_with_perplexity(product_name, full_context)

    # Consolidate errors if any
    final_error = None
    errors = []
    if ingredients_error: errors.append(f"Ingredients: {ingredients_error}")
    if fssai_error: errors.append(f"FSSAI: {fssai_error}")
    if errors: final_error = "; ".join(errors)

    return {
        "ingredients": ingredients if not ingredients_error else "Error retrieving ingredients",
        "fssai": fssai if not fssai_error else "Error retrieving FSSAI",
        "error": final_error 
    }
    
def generate_general_food_description(product_name, existing_description, highlights):
    print(f"   Generating general food description for '{product_name}' using Gemini.")
    context_parts = [f"Product Name: {product_name}"]
    if existing_description: context_parts.append(f"Existing Description: {existing_description}")
    if highlights: context_parts.append(f"Highlights: {', '.join(highlights)}")
    
    full_context = "\n".join(context_parts)

    prompt = f"""
    Based on the following information for a food product, provide a brief, user-friendly description (1-2 sentences) 
    suitable for an overview. Focus on what the product is, its main characteristics, or type. 
    Avoid just listing ingredients or FSSAI numbers here.

    {full_context}

    Brief Description:
    """
    config = {**generation_config_structured, "max_output_tokens": 100} # Borrowing structured config

    description_text = _call_gemini_api_with_retry(
        model_name=GENERATION_MODELS_FALLBACK[0], # Use a suitable Gemini model
        prompt=prompt,
        generation_config=config,
        safety_settings=safety_settings,
        timeout=GENERATION_TIMEOUT,
        operation_name="GeneralFoodDescription"
    )
    if isinstance(description_text, str) and description_text.startswith("Error:"):
        print(f"   Error generating general food description: {description_text}")
        return f"A food product: {product_name}. Further details could not be generated by AI." # Fallback
    return description_text if description_text else f"A food product: {product_name}."

def analyze_user_categories_with_perplexity(product_name_query, product_description="", product_highlights=""):
    """
    Analyzes a product to identify user categories based on likelihood to purchase.
    Uses Perplexity AI.
    Returns a dictionary with user categories or an error.
    """
    print(f"   Analyzing user categories for '{product_name_query}' using Perplexity.")

    # Construct the user prompt based on your working script
    user_prompt_content = f"""
Analyze the product "{product_name_query}" and identify 6 user categories based on their likelihood to purchase and use this product.
Product Description (if available): {product_description}
Product Highlights (if available): {product_highlights}

Divide them into three groups: "More Likely" (2 categories), "Likely" (2 categories), and "Less Likely" (2 categories).
Format your response as:
More Likely Users:
- Category 1
- Category 2

Likely Users:
- Category 3
- Category 4

Less Likely Users:
- Category 5
- Category 6
"""
    # System prompt as per your script (modified slightly for clarity of task)
    system_prompt_content = "You are an expert market research analyst specializing in consumer behavior and product segmentation. Your task is to analyze products and identify different user categories based on their likelihood to use the product, Just give the name of the users and dont give any explanation or description of the users."

    messages = [
        {"role": "system", "content": system_prompt_content},
        {"role": "user", "content": user_prompt_content}
    ]

    # Using the _call_perplexity_api helper
    content, error = _call_perplexity_api(
        messages,
        max_tokens=400,  # As in your script
        temperature=0.3, # As in your script
        model=PERPLEXITY_USER_SEGMENTATION_MODEL # Use a specific model if needed, or the general one
    )

    if error:
        print(f"   Error during user category analysis for '{product_name_query}': {error}")
        return {"error": error, "segmentation_text": None}
    
    if content:
        print(f"   User category analysis successful for '{product_name_query}'. Raw content length: {len(content)}")
        # The content is expected to be a formatted string. We'll pass it as is.
        # Further parsing into a structured dict can be done here or on the frontend Flask server.
        # For now, let's return the raw text.
        return {"segmentation_text": content.strip(), "error": None}
    
    return {"error": "No content from Perplexity for user categories.", "segmentation_text": None}


# --- Flask App Initialization ---
app = Flask(__name__)

@app.route('/process_product', methods=['POST'])
def process_product_endpoint():
    print(f"\nReceived request on /process_product")
    if not request.is_json: return jsonify({"error": "Request body must be JSON"}), 400
    data = request.get_json(); print(f"   Received JSON data: {str(data)[:200]}...")
    try:
        images_data = data.get("images"); product_name = images_data.get("product_name")
        main_image = images_data.get("main_image"); thumbnails = images_data.get("thumbnails", [])
        original_description = data.get("description", "") 
        original_highlights = data.get("highlights", [])   

        if not isinstance(images_data, dict) or not product_name or not main_image or not isinstance(thumbnails, list):
            raise ValueError("Invalid 'images' structure or missing fields")
    except Exception as e: return jsonify({"error": f"Invalid input: {e}"}), 400

    product_type = classify_product_type(product_name, main_image)

    if isinstance(product_type, str) and product_type.startswith("Error:"): # From classify_product_type
        return jsonify({"product_name": product_name, "main_image": main_image, "error": product_type, "determined_product_type": "Unknown" }), 500

    output_data = {
        "product_name": product_name, "main_image": main_image,
        "determined_product_type": product_type, "used_thumbnails_count": 0,
        "food_specific_details": None, # For ingredients & FSSAI
        "ai_generated_description": None, # For the general readable description
        "structured_description_raw": None, # For non-food raw **What it is:** output
        "error": None
    }
    
    try:
        if product_type == "Food and kindred products":
            print(f"   Product '{product_name}' classified as FOOD.")
            highlights_str = "\n".join(original_highlights)
            
            # 1. Get Ingredients and FSSAI using Perplexity
            perplexity_food_details = extract_food_details_with_perplexity_combined(
                product_name, original_description, highlights_str
            )
            output_data["food_specific_details"] = perplexity_food_details # Store the dict
            if perplexity_food_details.get("error"):
                output_data["error"] = (output_data["error"] + "; " if output_data["error"] else "") + f"FoodDetailsExtraction: {perplexity_food_details.get('error')}"

            # 2. Generate a general readable description for food (e.g., using Gemini)
            general_desc = generate_general_food_description(product_name, original_description, original_highlights)
            if isinstance(general_desc, str) and general_desc.startswith("Error:"):
                 output_data["error"] = (output_data["error"] + "; " if output_data["error"] else "") + f"GeneralFoodDesc: {general_desc}"
                 output_data["ai_generated_description"] = original_description or f"{product_name} - A food item." # Fallback
            else:
                output_data["ai_generated_description"] = general_desc

        else: # Non-Food products or Other/Unknown
            print(f"   Product '{product_name}' classified as {product_type}. Generating structured description with Gemini.")
            last_two_thumbnails = thumbnails[-2:] 
            output_data["used_thumbnails_count"] = len(last_two_thumbnails)
            
            gemini_structured_desc_raw = generate_structured_description( # This returns the "What it is..." string
                product_name, main_image, last_two_thumbnails
            )
            if isinstance(gemini_structured_desc_raw, str) and gemini_structured_desc_raw.startswith("Error:"):
                output_data["error"] = (output_data["error"] + "; " if output_data["error"] else "") + f"StructuredDesc: {gemini_structured_desc_raw}"
                output_data["ai_generated_description"] = original_description or f"Details for {product_name} could not be generated by AI." # Fallback
            else:
                output_data["structured_description_raw"] = gemini_structured_desc_raw # Store raw for potential full display
                output_data["ai_generated_description"] = clean_structured_description(gemini_structured_desc_raw) # Cleaned for main display
        
        status_code = 500 if output_data.get("error") and ("API" in output_data["error"] or "Failed" in output_data["error"]) else 200

    except Exception as e:
        print(f"   Critical Error during content generation for '{product_name}' - {e}")
        output_data["error"] = f"Unexpected server error: {str(e)}"
        status_code = 500
        # Ensure description fields are somewhat populated on critical error
        if "ai_generated_description" not in output_data or not output_data["ai_generated_description"]:
            output_data["ai_generated_description"] = "Error during AI processing."
        if product_type == "Food and kindred products" and "food_specific_details" not in output_data:
            output_data["food_specific_details"] = {"ingredients": "Error", "fssai": "Error", "error": "Processing error"}

    print(f"   Final Output for {product_name} (status {status_code}): {str(output_data)[:400]}...")
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

@app.route('/analyze_user_categories', methods=['POST'])
def analyze_user_categories_endpoint():
    """
    API endpoint to analyze user categories for a given product.
    Expects JSON: {"product_name": "...", "highlights": "...", "description": "..."}
    """
    print(f"\nReceived request on /analyze_user_categories")
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400

    data = request.get_json()
    product_name = data.get("product_name")
    description = data.get("description", "")  
    highlights = data.get("highlights", "")  

    if not product_name:
        print("   Error: Missing 'product_name' in request for user category analysis.")
        return jsonify({"error": "Missing 'product_name'"}), 400
    
    # Ensure highlights is a string if it was passed as a list
    highlights_str = ""
    if isinstance(highlights, list):
        highlights_str = "\n".join(highlights)
    elif isinstance(highlights, str):
        highlights_str = highlights

    segmentation_result = analyze_user_categories_with_perplexity(
        product_name,
        description,
        highlights_str
    )

    if segmentation_result.get("error"):
        # Decide if this is a 500 or still a 200 with an error message inside
        # For now, let's return 200 but with the error in the payload
        return jsonify(segmentation_result), 200 # Or 500 if error is critical
    
    return jsonify(segmentation_result), 200

if __name__ == '__main__':
    print("Starting Flask development server...")
    app.run(debug=True, host='0.0.0.0', port=5001)