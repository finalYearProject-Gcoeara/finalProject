# app.py (frontend server on port 5000)
import re
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests 
import json
from collections import Counter 

app = Flask(__name__)
CORS(app)

# Global variables
product_info = {}
reviews_data = []
images = {}
gemini_api_result = {}
sentiment_summary = {
    "positive": 0, "negative": 0, "neutral": 0, "unknown": 0, "total": 0, "error": None
}
table_of_contents_data = []
product_aspects_data = {
    "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": [], "error": None
}
product_user_categories_data = {"segmentation_text": None, "error": None}

GEMINI_API_BASE_URL = 'http://127.0.0.1:5001'
GEMINI_PRODUCT_URL = f'{GEMINI_API_BASE_URL}/process_product'
GEMINI_SENTIMENT_URL = f'{GEMINI_API_BASE_URL}/analyze_sentiments'
GEMINI_ASPECTS_URL = f'{GEMINI_API_BASE_URL}/analyze_product_aspects'
GEMINI_USER_CATEGORIES_URL = f'{GEMINI_API_BASE_URL}/analyze_user_categories'
PERPLEXITY_TIMEOUT_USER_SEGMENTATION=120

# In app.py (frontend Flask server on port 5000)

def parse_food_details(details_text):
    parsed = {"ingredients": "Not clearly visible", "fssai": "Not clearly visible"}
    if not details_text or not isinstance(details_text, str):
        print("[parse_food_details] Input details_text is empty or not a string.")
        return parsed

    print(f"[parse_food_details] Processing text: '{details_text}'")

    # Attempt to extract Ingredients
    # Regex: Capture text after "Potential Ingredients: " (and variations)
    # up to either ". FSSAI Number" or the end of the string if FSSAI part is missing.
    # Using re.DOTALL so '.' matches newlines if ingredients span multiple lines.
    # Making the " (brief summary, if visible)" part optional and non-capturing.
    ing_pattern = r"Potential Ingredients(?: \(brief summary, if visible\))?:\s*(.*?)(?:\.\s*FSSAI Number|\.$|$)"
    ingredients_match = re.search(ing_pattern, details_text, re.IGNORECASE | re.DOTALL)
    
    if ingredients_match:
        ingredients_text = ingredients_match.group(1).strip()
        print(f"[parse_food_details] Raw ingredients matched: '{ingredients_text}'")
        if ingredients_text and "not clearly visible" not in ingredients_text.lower() and ingredients_text != "[]":
            parsed["ingredients"] = ingredients_text
        else:
            parsed["ingredients"] = "Not clearly visible" # If explicitly stated or empty after match
            print(f"[parse_food_details] Ingredients set to 'Not clearly visible' based on content: '{ingredients_text}'")
    else:
        print("[parse_food_details] No match for ingredients pattern.")
        # Fallback: if the specific prefix isn't there, but the text *might* just be ingredients
        # This is a bit risky and depends on backend formatting.
        # For now, if the pattern fails, we assume ingredients are not clearly specified in the expected format.
        pass # parsed["ingredients"] remains "Not clearly visible"

    # Attempt to extract FSSAI Number
    # Regex: Capture text after "FSSAI Number: " (and variations) up to a period or end of string.
    fssai_pattern = r"FSSAI Number(?: \(if visible\))?:\s*(.*?)(?:\.$|$)"
    fssai_match = re.search(fssai_pattern, details_text, re.IGNORECASE | re.DOTALL)

    if fssai_match:
        fssai_text = fssai_match.group(1).strip()
        print(f"[parse_food_details] Raw FSSAI matched: '{fssai_text}'")
        if fssai_text and "not clearly visible" not in fssai_text.lower() and fssai_text != "[]":
            parsed["fssai"] = fssai_text
        else:
            parsed["fssai"] = "Not clearly visible" # If explicitly stated or empty after match
            print(f"[parse_food_details] FSSAI set to 'Not clearly visible' based on content: '{fssai_text}'")
    else:
        print("[parse_food_details] No match for FSSAI pattern.")
        # parsed["fssai"] remains "Not clearly visible"

    # If initial regexes failed, but the details_text itself is exactly what Perplexity sent
    # (which is a JSON string that your backend wrapped)
    # This part is only if the backend directly passes Perplexity's JSON-like string output
    # into food_product_details without formatting it into "Potential Ingredients: ... FSSAI: ..."
    # Based on your backend code, this fallback might not be strictly necessary if the backend
    # always formats the string.
    if parsed["ingredients"] == "Not clearly visible" and parsed["fssai"] == "Not clearly visible":
        try:
            # Check if details_text could be the JSON from Perplexity
            # This assumes the backend might sometimes pass the raw JSON string if formatting fails
            data_maybe_json = json.loads(details_text) # This will fail if details_text is the formatted string
            if isinstance(data_maybe_json, dict):
                ing = data_maybe_json.get("ingredients", "Not clearly visible")
                fss = data_maybe_json.get("fssai", "Not clearly visible")
                if ing and "not clearly visible" not in str(ing).lower():
                    parsed["ingredients"] = str(ing)
                if fss and "not clearly visible" not in str(fss).lower():
                    parsed["fssai"] = str(fss)
                print(f"[parse_food_details] Fallback JSON parse attempted: Ingredients='{parsed['ingredients']}', FSSAI='{parsed['fssai']}'")
        except json.JSONDecodeError:
            print("[parse_food_details] Fallback JSON parse failed, details_text was not valid JSON.")
            pass # Not a JSON string, rely on regex

    print(f"[parse_food_details] Final parsed: {parsed}")
    return parsed

@app.route('/')
def dashboard():
    # ... (your route)
    return render_template('dashboard.html',
                           product_info=product_info,
                           images=images,
                           reviews_data=reviews_data,
                           gemini_data=gemini_api_result,
                           sentiment_summary=sentiment_summary,
                           table_of_contents_data=table_of_contents_data,
                           product_aspects_data=product_aspects_data)

@app.route('/api/dashboard_data')
def get_dashboard_api_data():
    if not product_info.get("product_name"):
        return jsonify({
            "error": "No product data available...",
            "product_info": {}, "images": {}, "gemini_data": {}, "table_of_contents_data": [],
            "reviews_data": [], 
            "sentiment_summary": {"positive": 0, "negative": 0, "neutral": 0, "unknown": 0, "total": 0, "error": "No data"},
            "product_aspects_data": {"positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": [], "error": "No data"},
            "product_user_categories_data": {"segmentation_text": None, "error": "No data"} # Add default
        }), 404
    return jsonify({
        "product_info": product_info, "images": images, "gemini_data": gemini_api_result,
        "table_of_contents_data": table_of_contents_data, "reviews_data": reviews_data,
        "sentiment_summary": sentiment_summary, "product_aspects_data": product_aspects_data,
        "product_user_categories_data": product_user_categories_data # Pass to React frontend
    })

@app.route('/Landing_page/index.html')
def landing_page():
    return render_template('Landing_page/index.html')

@app.route('/receive_data', methods=['POST'])
def receive_data():
    global product_info, reviews_data, gemini_api_result, sentiment_summary, table_of_contents_data, product_aspects_data, product_user_categories_data
    data = request.get_json()
    print("Received product/reviews data (full):", data)

    product_info = data.get('product_info', {})
    raw_review_objects = data.get('reviews', [])
    print("Received raw review objects:", raw_review_objects)

    # Reset global data stores
    reviews_data = []
    gemini_api_result = {} # Will store response from backend AI server
    sentiment_summary = {"positive": 0, "negative": 0, "neutral": 0, "unknown": 0, "total": 0, "error": None}
    table_of_contents_data = []
    product_aspects_data = {"positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": [], "error": None}
    processed_reviews_list = []
    product_user_categories_data = {"segmentation_text": None, "error": None}

    # Prepare payload for backend AI server's /process_product endpoint
    main_image_for_gemini = product_info.get('main_image', images.get('main_image', ''))
    actual_thumbnails_for_gemini = images.get('thumbnails', [])
    if not actual_thumbnails_for_gemini and main_image_for_gemini:
        actual_thumbnails_for_gemini = [main_image_for_gemini]

    gemini_payload_product = {
        "images": {
            "product_name": product_info.get('product_name', ''),
            "main_image": main_image_for_gemini,
            "thumbnails": actual_thumbnails_for_gemini
        },
        "description": product_info.get("description", ""),
        "highlights": product_info.get("highlights", [])
    }
    print("Payload to Backend AI Server (/process_product):", gemini_payload_product)

    # --- Call Backend AI Server for Product Details ---
    try:
        response_product = requests.post(GEMINI_PRODUCT_URL, json=gemini_payload_product, timeout=130)
        response_product.raise_for_status()
        gemini_api_result = response_product.json() # This is the full response from backend AI server
        print("Backend AI Server Response (/process_product):", gemini_api_result)

        product_type = gemini_api_result.get("determined_product_type", "Unknown")
        table_of_contents_data.append({"label": "Product Type", "value": product_type})

        # --- Populate Table of Contents and Main Description ---
        if product_type == "Food and kindred products":
            food_details = gemini_api_result.get("food_specific_details") # This should be a dict
            if food_details and isinstance(food_details, dict):
                table_of_contents_data.append({"label": "Potential Ingredients", "value": food_details.get("ingredients", "Not provided by AI")})
                table_of_contents_data.append({"label": "FSSAI Number", "value": food_details.get("fssai", "Not provided by AI")})
                if food_details.get("error"): # If Perplexity had an error extracting specific food details
                     table_of_contents_data.append({"label": "Food Detail Error", "value": food_details.get("error")})
            else:
                table_of_contents_data.append({"label": "Food Details", "value": "Not processed by AI"})

            # For the main description card, use the general AI description for food
            gemini_api_result["cleaned_description"] = gemini_api_result.get("ai_generated_description", 
                                                                            product_info.get("description", "General description not available."))
        
        else: # Non-Food, Other, Unknown
            # The backend now sends 'ai_generated_description' (cleaned) and 'structured_description_raw'
            # For ToC, we show the cleaned, more concise general description
            ai_desc_for_toc = gemini_api_result.get("ai_generated_description", "AI description not available.")
            table_of_contents_data.append({"label": "Description", "value": ai_desc_for_toc})
            
            # For the main description card, we can also use this ai_generated_description.
            # If you want the option to show the raw "What it is..." text, you could add another field to gemini_api_result
            # or use gemini_api_result.get("structured_description_raw") in the template.
            gemini_api_result["cleaned_description"] = ai_desc_for_toc

        # Handle overall errors from the backend AI server processing
        if gemini_api_result.get("error") and not any(item["label"] == "Backend Processing Error" for item in table_of_contents_data):
            table_of_contents_data.append({"label": "Backend Processing Error", "value": gemini_api_result.get("error")})
            if not gemini_api_result.get("cleaned_description"): # If error wiped out description
                 gemini_api_result["cleaned_description"] = product_info.get("description", "Error retrieving full details from AI.")
    
    except requests.exceptions.RequestException as e:
        # ... (your existing exception handling for requests) ...
        # Ensure cleaned_description is set
        gemini_api_result["cleaned_description"] = product_info.get("description", "Could not connect to AI services.")
    except Exception as e:
        # ... (your existing general exception handling) ...
        # Ensure cleaned_description is set
        gemini_api_result["cleaned_description"] = product_info.get("description", "An internal error occurred processing data.")

    # Final fallback for cleaned_description if it's still missing
    if "cleaned_description" not in gemini_api_result or not gemini_api_result.get("cleaned_description"):
        gemini_api_result["cleaned_description"] = product_info.get("description", "Description not available.")


    # --- Call Product Aspects Analysis ---
    if product_info.get("product_name"):
        aspects_payload = {
            "product_name": product_info.get("product_name"),
            "highlights": product_info.get("highlights", []),
            "description": product_info.get("description", gemini_api_result.get("cleaned_description", "")),
            "specifications": product_info.get("specifications", {})
        }
        try:
            print("Sending payload for Product Aspects Analysis:", aspects_payload)
            response_aspects = requests.post(GEMINI_ASPECTS_URL, json=aspects_payload, timeout=130)
            response_aspects.raise_for_status()
            product_aspects_data = response_aspects.json()
            print("Product Aspects API Response:", product_aspects_data)
        except requests.exceptions.RequestException as e:
            error_msg_aspects = f"Failed to get product aspects from AI backend: {e}"
            print(error_msg_aspects)
            product_aspects_data = {"error": error_msg_aspects, "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": []}
        except Exception as e:
            error_msg_aspects = f"Error processing product aspects: {e}"
            print(error_msg_aspects)
            product_aspects_data = {"error": error_msg_aspects, "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": []}
    # --- End of Product Aspects Analysis Call ---

    # --- NEW: Call User Category Segmentation ---
    if product_info.get("product_name"):
        user_cat_payload = {
            "product_name": product_info.get("product_name"),
            "highlights": product_info.get("highlights", []),
            "description": product_info.get("description", gemini_api_result.get("cleaned_description", "")),
        }
        try:
            print("Sending payload for User Category Analysis:", user_cat_payload)
            response_user_cat = requests.post(GEMINI_USER_CATEGORIES_URL, json=user_cat_payload, timeout=PERPLEXITY_TIMEOUT_USER_SEGMENTATION) # Use appropriate timeout
            response_user_cat.raise_for_status()
            product_user_categories_data = response_user_cat.json()
            print("User Category API Response:", product_user_categories_data)
        except requests.exceptions.RequestException as e:
            err_msg = f"Failed to get user categories from AI backend: {e}"
            print(err_msg)
            product_user_categories_data = {"segmentation_text": None, "error": err_msg}
        except Exception as e:
            err_msg = f"Error processing user categories: {e}"
            print(err_msg)
            product_user_categories_data = {"segmentation_text": None, "error": err_msg}
    # --- End of User Category Segmentation Call ---


    # --- Sentiment Analysis of Reviews ---
    if raw_review_objects:
        # ... (Your existing sentiment analysis logic - seems okay) ...
        review_texts_for_api = []
        for r_obj in raw_review_objects:
            if isinstance(r_obj, dict):
                review_text = r_obj.get('review_desc')
                if review_text and isinstance(review_text, str) and review_text.strip():
                    review_texts_for_api.append(review_text)
                else:
                    review_texts_for_api.append("") 
            else:
                review_texts_for_api.append("")
        valid_review_texts_for_api = [text for text in review_texts_for_api if text.strip()]
        if not valid_review_texts_for_api:
            sentiment_summary.update({"error": "No valid review texts found", "total": len(raw_review_objects), "unknown": len(raw_review_objects)})
            for i, r_obj in enumerate(raw_review_objects):
                if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = "Unknown"
                else: review_item = {"review_desc": "Invalid review object", "sentiment": "Unknown"}
                processed_reviews_list.append(review_item)
        else:
            try:
                sentiment_payload = {"reviews": valid_review_texts_for_api}
                s_response = requests.post(GEMINI_SENTIMENT_URL, json=sentiment_payload, timeout=100)
                s_response.raise_for_status()
                sentiment_results_api = s_response.json().get("sentiments", [])
                full_sentiment_results = []
                api_result_idx = 0
                for original_text in review_texts_for_api:
                    if original_text.strip():
                        if api_result_idx < len(sentiment_results_api): full_sentiment_results.append(sentiment_results_api[api_result_idx]); api_result_idx += 1
                        else: full_sentiment_results.append("Error (API Mismatch)"); print("Error: API returned fewer sentiments than expected.")
                    else: full_sentiment_results.append("Unknown (No Text)")
                if len(full_sentiment_results) == len(raw_review_objects):
                    for i, r_obj in enumerate(raw_review_objects):
                        if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = full_sentiment_results[i]
                        else: review_item = {"review_desc": "Invalid review object", "sentiment": full_sentiment_results[i]}
                        processed_reviews_list.append(review_item)
                    sentiment_counts = Counter(full_sentiment_results)
                    sentiment_summary.update({
                        "positive": sentiment_counts.get("Positive", 0), "negative": sentiment_counts.get("Negative", 0),
                        "neutral": sentiment_counts.get("Neutral", 0),
                        "unknown": sentiment_counts.get("Unknown (No Text)", 0) + sentiment_counts.get("Error (API Mismatch)", 0) + sentiment_counts.get("Unknown", 0) + sentiment_counts.get("Error",0),
                        "total": len(raw_review_objects), "error": None
                    })
                else: # Mismatch case
                    error_msg_sent = "Critical error: Mismatch in number of reviews and mapped sentiments."
                    print(error_msg_sent)
                    sentiment_summary.update({"error": error_msg_sent, "total": len(raw_review_objects)})
                    for r_obj in raw_review_objects: # Fallback
                        if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = "Error (Mapping)"
                        else: review_item = {"review_desc": "Invalid review object", "sentiment": "Error (Mapping)"}
                        processed_reviews_list.append(review_item)
            except requests.exceptions.RequestException as e_sent:
                error_msg_sent = f"Failed to get sentiments from AI backend: {e_sent}"; print(error_msg_sent)
                sentiment_summary.update({"error": error_msg_sent, "total": len(raw_review_objects)})
                for r_obj in raw_review_objects: # Fallback
                    if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = "Error (API Failure)"
                    else: review_item = {"review_desc": "Invalid review object", "sentiment": "Error (API Failure)"}
                    processed_reviews_list.append(review_item)
            except Exception as e_sent:
                error_msg_sent = f"Error processing sentiments: {e_sent}"; print(error_msg_sent)
                sentiment_summary.update({"error": error_msg_sent, "total": len(raw_review_objects)})
                for r_obj in raw_review_objects: # Fallback
                    if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = "Error (Processing)"
                    else: review_item = {"review_desc": "Invalid review object", "sentiment": "Error (Processing)"}
                    processed_reviews_list.append(review_item)
    else:
        sentiment_summary.update({"total": 0, "error": "No reviews provided."})
    reviews_data = processed_reviews_list
    # --- End of Sentiment Analysis ---

    print("Final table_of_contents_data:", table_of_contents_data)
    print("Final product_aspects_data:", product_aspects_data)
    return jsonify({
        "message": "Data received and processed!",
        "product_status": "ok" if "error" not in gemini_api_result else "error",
        "sentiment_status": "ok" if not sentiment_summary.get("error") and raw_review_objects else "no_reviews_or_error"
    })

@app.route('/receive_images', methods=['POST'])
def receive_images():
    # ... (your route)
    global images
    data = request.get_json()
    if 'images' in data and isinstance(data['images'], dict) and 'images' in data['images']:
        images_data_actual = data['images'].get('images', {})
    elif 'images' in data and isinstance(data['images'], dict):
        images_data_actual = data.get('images', {})
    else:
        images_data_actual = {}
    if 'main_image' in images_data_actual or 'thumbnails' in images_data_actual:
        images = images_data_actual
    else: 
        images = data.get('images', {}) if isinstance(data.get('images'), dict) else {}
    print("Processed global images variable:", images)
    return jsonify({"message": "Images received successfully!"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)