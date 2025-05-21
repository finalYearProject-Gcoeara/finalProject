# app.py (the one serving index.html on port 5000)

import re
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests
from collections import Counter

app = Flask(__name__)
CORS(app)

# Global variables
product_info = {}
reviews_data = []
images = {}
gemini_api_result = {}
sentiment_summary = {}
table_of_contents_data = [] # MODIFIED: Ensure this is initialized globally

GEMINI_API_BASE_URL = 'http://127.0.0.1:5001'
GEMINI_PRODUCT_URL = f'{GEMINI_API_BASE_URL}/process_product'
GEMINI_SENTIMENT_URL = f'{GEMINI_API_BASE_URL}/analyze_sentiments'


def clean_structured_description(text):
    if not text:
        return ""
    text = re.sub(r'\*\*What it is:\*\*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\*\*Potential Pros:\*\*.*?(?=(\*\*Potential Cons|\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'\*\*Potential Cons(?:/Considerations)?:\*\*.*?(?=(\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = text.replace('*', '').strip()
    return text

# HELPER FUNCTION to parse food details (from previous correct answer)
def parse_food_details(details_text):
    parsed = {"ingredients": "Not specified", "fssai": "Not specified"}
    if not details_text or not isinstance(details_text, str):
        return parsed

    ingredients_match = re.search(
        r"Potential Ingredients(?: \(brief summary, if visible\))?:\s*(.*)",
        details_text,
        re.IGNORECASE
    )
    if ingredients_match:
        ingredients_text = ingredients_match.group(1).strip()
        if "not clearly visible" in ingredients_text.lower() or not ingredients_text or ingredients_text == "[]":
            parsed["ingredients"] = "Not clearly visible"
        else:
            parsed["ingredients"] = ingredients_text.replace("Potential Ingredients (brief summary, if visible):", "").strip()

    fssai_match = re.search(
        r"FSSAI Number(?: \(if visible\))?:\s*(.*)",
        details_text,
        re.IGNORECASE
    )
    if fssai_match:
        fssai_text = fssai_match.group(1).strip()
        if "not clearly visible" in fssai_text.lower() or not fssai_text or fssai_text == "[]":
            parsed["fssai"] = "Not clearly visible"
        else:
            parsed["fssai"] = fssai_text.replace("FSSAI Number (if visible):", "").strip()
            
    if parsed["ingredients"] == "Not specified" and "\n" in details_text:
        lines = details_text.split('\n')
        for line in lines:
            if "ingredient" in line.lower():
                ing_val = line.split(":", 1)[-1].strip()
                if ing_val and "not clearly visible" not in ing_val.lower():
                    parsed["ingredients"] = ing_val
                elif "not clearly visible" in ing_val.lower():
                    parsed["ingredients"] = "Not clearly visible"
            elif "fssai" in line.lower():
                fssai_val = line.split(":", 1)[-1].strip()
                if fssai_val and "not clearly visible" not in fssai_val.lower():
                    parsed["fssai"] = fssai_val
                elif "not clearly visible" in fssai_val.lower():
                    parsed["fssai"] = "Not clearly visible"
    return parsed


@app.route('/')
def index():
    return render_template('index.html',
                           product_info=product_info,
                           images=images,
                           reviews_data=reviews_data,
                           gemini_data=gemini_api_result,
                           sentiment_summary=sentiment_summary,
                           table_of_contents_data=table_of_contents_data) # MODIFIED: Pass ToC data

@app.route('/receive_data', methods=['POST'])
def receive_data():
    # MODIFIED: Add table_of_contents_data to global
    global product_info, reviews_data, gemini_api_result, sentiment_summary, table_of_contents_data
    data = request.get_json()
    print("Received product/reviews data (full):", data)

    product_info = data.get('product_info', {})
    raw_review_objects = data.get('reviews', [])
    print("Received raw review objects:", raw_review_objects)

    # --- Reset for new data ---
    reviews_data = []
    gemini_api_result = {}
    sentiment_summary = {"error": None}
    table_of_contents_data = [] # MODIFIED: Reset ToC data

    # 1. Prepare payload for Gemini Product Processing
    # Using main_image from product_info for consistency in payload for Gemini
    main_image_for_gemini = product_info.get('main_image', images.get('main_image', ''))
    
    # Thumbnails: Prefer images.thumbnails, fallback to product_info.main_image if images.thumbnails is empty
    actual_thumbnails_for_gemini = images.get('thumbnails', [])
    if not actual_thumbnails_for_gemini and main_image_for_gemini:
        actual_thumbnails_for_gemini = [main_image_for_gemini]


    gemini_payload = {
        "images": {
            "product_name": product_info.get('product_name', ''),
            "main_image": main_image_for_gemini, # Use consistent main image
            "thumbnails": actual_thumbnails_for_gemini # Use consistent thumbnails
        }
    }
    print("Gemini Product Payload:", gemini_payload)


    try:
        # Increased timeout as Gemini can take time
        response = requests.post(GEMINI_PRODUCT_URL, json=gemini_payload, timeout=130)
        response.raise_for_status()
        gemini_api_result = response.json()
        print("Gemini Product API Response:", gemini_api_result)

        # --- Build Table of Contents Data ---
        product_type = gemini_api_result.get("determined_product_type", "Unknown")
        table_of_contents_data.append({"label": "Product Type", "value": product_type})

        if product_type == "Food":
            food_details_text = gemini_api_result.get("food_product_details", "")
            parsed_food_info = parse_food_details(food_details_text)
            table_of_contents_data.append({"label": "Potential Ingredients", "value": parsed_food_info["ingredients"]})
            table_of_contents_data.append({"label": "FSSAI Number", "value": parsed_food_info["fssai"]})
            gemini_api_result["cleaned_description"] = f"Ingredients: {parsed_food_info['ingredients']}. FSSAI: {parsed_food_info['fssai']}."
        elif "structured_description" in gemini_api_result:
            # For Non-Food/Unknown, add the raw structured description to ToC for now
            # You can parse this further if needed for specific fields.
            desc_text = gemini_api_result["structured_description"]
            table_of_contents_data.append({"label": "AI Description", "value": desc_text})
            gemini_api_result["cleaned_description"] = clean_structured_description(desc_text)

        if gemini_api_result.get("error"):
            table_of_contents_data.append({"label": "Processing Error", "value": gemini_api_result.get("error")})
            if "cleaned_description" not in gemini_api_result : # ensure cleaned_description exists
                 gemini_api_result["cleaned_description"] = ""


    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to get product details from Gemini server: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg, "cleaned_description": ""}
        table_of_contents_data.append({"label": "API Error", "value": error_msg})
    except Exception as e:
        error_msg = f"Error processing product details: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg, "cleaned_description": ""}
        table_of_contents_data.append({"label": "Processing Error", "value": error_msg})


    # 2. Analyze sentiment of reviews
    if raw_review_objects:
        review_texts_for_api = []
        for r_obj in raw_review_objects:
            if isinstance(r_obj, dict):
                review_text = r_obj.get('review_desc')
                if review_text and isinstance(review_text, str) and review_text.strip(): # Check if not just whitespace
                    review_texts_for_api.append(review_text)
                else:
                    # If review_desc is empty or missing, still log it but don't send for API if it's truly empty
                    print(f"Info: Review object has empty or missing 'review_desc': {r_obj}")
                    review_texts_for_api.append("") # Add empty string to keep counts aligned for now
            else:
                review_texts_for_api.append("")
                print(f"Warning: Encountered non-dictionary item in raw_review_objects: {r_obj}")

        print(f"Extracted review texts for sentiment API (pre-filter): {review_texts_for_api}")

        # Filter out empty strings before sending to API, but keep original count for UI mapping
        valid_review_texts_for_api = [text for text in review_texts_for_api if text.strip()]

        if not valid_review_texts_for_api: # If all texts are empty or whitespace after filtering
            print("No valid (non-empty) review texts found to send for sentiment analysis.")
            sentiment_summary = {"positive":0,"negative":0,"neutral":0,"unknown":len(raw_review_objects),"total":len(raw_review_objects), "error": "No review texts found"}
            reviews_data = []
            for i, r_obj in enumerate(raw_review_objects):
                text_to_display = review_texts_for_api[i] if review_texts_for_api[i].strip() else "Review text not provided"
                if not isinstance(r_obj, dict): # if original object was not a dict
                    text_to_display = "Invalid review object"
                reviews_data.append({"text": text_to_display, "sentiment": "Unknown"})
        else:
            try:
                print(f"Sending {len(valid_review_texts_for_api)} valid review texts for sentiment analysis.")
                sentiment_payload = {"reviews": valid_review_texts_for_api}
                s_response = requests.post(GEMINI_SENTIMENT_URL, json=sentiment_payload, timeout=100) # Increased timeout
                s_response.raise_for_status()
                sentiment_results_api = s_response.json().get("sentiments", []) # These are for valid_review_texts_for_api

                # Map API results back to the original raw_review_objects structure
                # This requires careful indexing if we skipped empty reviews
                full_sentiment_results = []
                api_result_idx = 0
                for original_text in review_texts_for_api: # Iterate through the list that matches raw_review_objects
                    if original_text.strip(): # If this review was sent to the API
                        if api_result_idx < len(sentiment_results_api):
                            full_sentiment_results.append(sentiment_results_api[api_result_idx])
                            api_result_idx += 1
                        else:
                            full_sentiment_results.append("Error") # Should not happen if API behaved
                            print("Error: API returned fewer sentiments than expected.")
                    else: # This review was empty and not sent
                        full_sentiment_results.append("Unknown")
                
                # Now full_sentiment_results should have the same length as raw_review_objects
                if len(full_sentiment_results) == len(raw_review_objects):
                    temp_reviews_data = []
                    for i, r_obj in enumerate(raw_review_objects):
                        text_to_display = review_texts_for_api[i] if review_texts_for_api[i].strip() else "Review text not provided"
                        if not isinstance(r_obj, dict):
                             text_to_display = "Invalid review object"
                        temp_reviews_data.append({
                            "text": text_to_display,
                            "sentiment": full_sentiment_results[i]
                        })
                    reviews_data = temp_reviews_data
                    
                    sentiment_counts = Counter(full_sentiment_results)
                    sentiment_summary.update({
                        "positive": sentiment_counts.get("Positive", 0),
                        "negative": sentiment_counts.get("Negative", 0),
                        "neutral": sentiment_counts.get("Neutral", 0),
                        "unknown": sentiment_counts.get("Unknown", 0) + sentiment_counts.get("Error", 0),
                        "total": len(raw_review_objects) # Total is based on all original reviews
                    })
                    print("Sentiment Analysis Summary:", sentiment_summary)
                else:
                    # This case should be less likely with the new mapping logic
                    error_msg = "Critical error: Mismatch in number of reviews and mapped sentiments."
                    print(error_msg)
                    sentiment_summary["error"] = error_msg
                    reviews_data = [] # Fallback
                    for r_obj_idx, r_obj_val in enumerate(raw_review_objects):
                        text_to_display = review_texts_for_api[r_obj_idx] if review_texts_for_api[r_obj_idx].strip() else "Review text not provided"
                        if not isinstance(r_obj_val, dict):
                             text_to_display = "Invalid review object"
                        reviews_data.append({"text": text_to_display, "sentiment": "Error"})

            except requests.exceptions.RequestException as e:
                error_msg = f"Failed to get sentiments from Gemini server: {e}"
                print(error_msg)
                sentiment_summary["error"] = error_msg
                reviews_data = []
                for r_obj_idx, r_obj_val in enumerate(raw_review_objects):
                    text_to_display = review_texts_for_api[r_obj_idx] if review_texts_for_api[r_obj_idx].strip() else "Review text not provided"
                    if not isinstance(r_obj_val, dict):
                         text_to_display = "Invalid review object"
                    reviews_data.append({"text": text_to_display, "sentiment": "Error"})
            except Exception as e:
                error_msg = f"Error processing sentiments: {e}"
                print(error_msg)
                sentiment_summary["error"] = error_msg
                reviews_data = []
                for r_obj_idx, r_obj_val in enumerate(raw_review_objects):
                    text_to_display = review_texts_for_api[r_obj_idx] if review_texts_for_api[r_obj_idx].strip() else "Review text not provided"
                    if not isinstance(r_obj_val, dict):
                         text_to_display = "Invalid review object"
                    reviews_data.append({"text": text_to_display, "sentiment": "Error"})
    else:
        reviews_data = []
        sentiment_summary = {"positive":0,"negative":0,"neutral":0,"unknown":0,"total":0}

    print("Final table_of_contents_data:", table_of_contents_data)
    return jsonify({
        "message": "Data received and processed!",
        "product_status": "ok" if "error" not in gemini_api_result else "error",
        "sentiment_status": "ok" if "error" not in sentiment_summary and raw_review_objects else "no_reviews_or_error"
    })


@app.route('/receive_images', methods=['POST'])
def receive_images():
    global images
    data = request.get_json()
    # MODIFICATION: Handle nested 'images' key if present
    if 'images' in data and isinstance(data['images'], dict) and 'images' in data['images']:
        print("Received images data (nested structure):", data)
        images_data_actual = data['images'].get('images', {})
    elif 'images' in data and isinstance(data['images'], dict): # If it's already the correct structure
        print("Received images data (direct structure):", data)
        images_data_actual = data.get('images', {})
    else:
        print("Received images data (unexpected structure or missing 'images' key):", data)
        images_data_actual = {}

    # Ensure `images` global variable gets the final correct structure
    if 'main_image' in images_data_actual or 'thumbnails' in images_data_actual:
        images = images_data_actual
    else: # Fallback if parsing fails, try to get it from data directly
        images = data.get('images', {}) if isinstance(data.get('images'), dict) else {}

    print("Processed images global:", images)
    return jsonify({"message": "Images received successfully!"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)