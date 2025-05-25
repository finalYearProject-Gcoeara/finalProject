# app.py (frontend server on port 5000)
import re
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests # Make sure this is imported
from collections import Counter # Make sure this is imported

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
# NEW: Global variable for product aspects analysis
product_aspects_data = { # Initialize with default structure
    "positive_score": 0,
    "negative_score": 0,
    "positive_keywords": [],
    "negative_keywords": [],
    "error": None
}


GEMINI_API_BASE_URL = 'http://127.0.0.1:5001' # Backend Gemini server
GEMINI_PRODUCT_URL = f'{GEMINI_API_BASE_URL}/process_product'
GEMINI_SENTIMENT_URL = f'{GEMINI_API_BASE_URL}/analyze_sentiments'
# NEW: URL for product aspects analysis
GEMINI_ASPECTS_URL = f'{GEMINI_API_BASE_URL}/analyze_product_aspects'


def clean_structured_description(text):
    if not text: return ""
    text = re.sub(r'\*\*What it is:\*\*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\*\*Potential Pros:\*\*.*?(?=(\*\*Potential Cons|\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'\*\*Potential Cons(?:/Considerations)?:\*\*.*?(?=(\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = text.replace('*', '').strip()
    return text

def parse_food_details(details_text):
    parsed = {"ingredients": "Not specified", "fssai": "Not specified"}
    if not details_text or not isinstance(details_text, str): return parsed
    ingredients_match = re.search(r"Potential Ingredients(?: \(brief summary, if visible\))?:\s*(.*)", details_text, re.IGNORECASE)
    if ingredients_match:
        ingredients_text = ingredients_match.group(1).strip()
        if "not clearly visible" in ingredients_text.lower() or not ingredients_text or ingredients_text == "[]":
            parsed["ingredients"] = "Not clearly visible"
        else:
            parsed["ingredients"] = ingredients_text.replace("Potential Ingredients (brief summary, if visible):", "").strip()
    fssai_match = re.search(r"FSSAI Number(?: \(if visible\))?:\s*(.*)", details_text, re.IGNORECASE)
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
                if ing_val and "not clearly visible" not in ing_val.lower(): parsed["ingredients"] = ing_val
                elif "not clearly visible" in ing_val.lower(): parsed["ingredients"] = "Not clearly visible"
            elif "fssai" in line.lower():
                fssai_val = line.split(":", 1)[-1].strip()
                if fssai_val and "not clearly visible" not in fssai_val.lower(): parsed["fssai"] = fssai_val
                elif "not clearly visible" in fssai_val.lower(): parsed["fssai"] = "Not clearly visible"
    return parsed

@app.route('/')
def dashboard():
    return render_template('dashboard.html',
                           product_info=product_info,
                           images=images,
                           reviews_data=reviews_data,
                           gemini_data=gemini_api_result,
                           sentiment_summary=sentiment_summary,
                           table_of_contents_data=table_of_contents_data,
                           product_aspects_data=product_aspects_data) # Pass aspects data

@app.route('/Landing_page/index.html')
def landing_page():
    return render_template('Landing_page/index.html')

@app.route('/receive_data', methods=['POST'])
def receive_data():
    global product_info, reviews_data, gemini_api_result, sentiment_summary, table_of_contents_data, product_aspects_data # Add product_aspects_data
    data = request.get_json()
    print("Received product/reviews data (full):", data)

    product_info = data.get('product_info', {})
    raw_review_objects = data.get('reviews', [])
    print("Received raw review objects:", raw_review_objects)

    reviews_data = []
    gemini_api_result = {}
    sentiment_summary = {"positive": 0, "negative": 0, "neutral": 0, "unknown": 0, "total": 0, "error": None}
    table_of_contents_data = []
    product_aspects_data = {"positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": [], "error": None} # Reset aspects data
    processed_reviews_list = []

    main_image_for_gemini = product_info.get('main_image', images.get('main_image', ''))
    actual_thumbnails_for_gemini = images.get('thumbnails', [])
    if not actual_thumbnails_for_gemini and main_image_for_gemini:
        actual_thumbnails_for_gemini = [main_image_for_gemini]

    gemini_payload_product = { # Renamed for clarity
        "images": {
            "product_name": product_info.get('product_name', ''),
            "main_image": main_image_for_gemini,
            "thumbnails": actual_thumbnails_for_gemini
        }
    }
    print("Gemini Product Payload:", gemini_payload_product)

    try:
        response_product = requests.post(GEMINI_PRODUCT_URL, json=gemini_payload_product, timeout=130) # Renamed for clarity
        response_product.raise_for_status()
        gemini_api_result = response_product.json()
        print("Gemini Product API Response:", gemini_api_result)

        product_type = gemini_api_result.get("determined_product_type", "Unknown")
        table_of_contents_data.append({"label": "Product Type", "value": product_type})

        if product_type == "Food":
            food_details_text = gemini_api_result.get("food_product_details", "")
            parsed_food_info = parse_food_details(food_details_text)
            table_of_contents_data.append({"label": "Potential Ingredients", "value": parsed_food_info["ingredients"]})
            table_of_contents_data.append({"label": "FSSAI Number", "value": parsed_food_info["fssai"]})
            # Set a combined cleaned_description for food products for the main description area
            gemini_api_result["cleaned_description"] = f"Ingredients: {parsed_food_info['ingredients']}. FSSAI: {parsed_food_info['fssai']}."

        elif "structured_description" in gemini_api_result: # For Non-Food/Unknown
            raw_desc_text = gemini_api_result["structured_description"]
            # Clean the description ONCE
            cleaned_description_for_all_uses = clean_structured_description(raw_desc_text)
            
            # Use the CLEANED description for the Table of Contents
            table_of_contents_data.append({"label": "Description", "value": cleaned_description_for_all_uses}) # <<<< CHANGED TO USE CLEANED TEXT
            
            # Also use this same cleaned description for the main description section
            gemini_api_result["cleaned_description"] = cleaned_description_for_all_uses
        else: # If no specific description fields but product type determined (e.g., only "Food" type, no details string)
            # We already set cleaned_description for food. For others, if no structured_description:
            if "cleaned_description" not in gemini_api_result: # Avoid overwriting food's cleaned_description
                 gemini_api_result["cleaned_description"] = f"Product type: {product_type}. AI could not generate further details."
            # Optionally add a generic entry to ToC if desired when structured_description is missing
            # table_of_contents_data.append({"label": "AI Summary", "value": f"Product type: {product_type}. No detailed AI description."})

        if gemini_api_result.get("error"):
            table_of_contents_data.append({"label": "Gemini Processing Error", "value": gemini_api_result.get("error")})
            if "cleaned_description" not in gemini_api_result: # ensure cleaned_description exists
                 gemini_api_result["cleaned_description"] = "Error retrieving product details."
        else:
            gemini_api_result["cleaned_description"] = f"Product type determined as: {product_type}. Further details not extracted."
        if gemini_api_result.get("error"):
            table_of_contents_data.append({"label": "Gemini Processing Error", "value": gemini_api_result.get("error")})
            if "cleaned_description" not in gemini_api_result:
                 gemini_api_result["cleaned_description"] = "Error retrieving product details."
    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to get product details from Gemini server: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg, "cleaned_description": "Could not connect to AI service for product details."}
        table_of_contents_data.append({"label": "API Connection Error", "value": error_msg})
    except Exception as e:
        error_msg = f"Error processing product details: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg, "cleaned_description": "An internal error occurred while processing product details."}
        table_of_contents_data.append({"label": "Internal Processing Error", "value": error_msg})
    if "cleaned_description" not in gemini_api_result:
        gemini_api_result["cleaned_description"] = product_info.get("description", "Description not available.")

    if product_info.get("product_name"): # Only call if we have product info
        aspects_payload = {
            "product_name": product_info.get("product_name"),
            "highlights": product_info.get("highlights", []),
            "description": product_info.get("description", gemini_api_result.get("cleaned_description", "")), # Use scraped or AI description
            "specifications": product_info.get("specifications", {})
        }
        try:
            print("Sending payload for Product Aspects Analysis:", aspects_payload)
            response_aspects = requests.post(GEMINI_ASPECTS_URL, json=aspects_payload, timeout=130)
            response_aspects.raise_for_status()
            product_aspects_data = response_aspects.json()
            print("Product Aspects API Response:", product_aspects_data)
        except requests.exceptions.RequestException as e:
            error_msg_aspects = f"Failed to get product aspects from Gemini server: {e}"
            print(error_msg_aspects)
            product_aspects_data = {"error": error_msg_aspects, "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": []}
        except Exception as e:
            error_msg_aspects = f"Error processing product aspects: {e}"
            print(error_msg_aspects)
            product_aspects_data = {"error": error_msg_aspects, "positive_score": 0, "negative_score": 0, "positive_keywords": [], "negative_keywords": []}


    if raw_review_objects:
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
                else:
                    error_msg = "Critical error: Mismatch in number of reviews and mapped sentiments."
                    print(error_msg)
                    sentiment_summary.update({"error": error_msg, "total": len(raw_review_objects)})
                    for r_obj in raw_review_objects:
                        if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = "Error (Mapping)"
                        else: review_item = {"review_desc": "Invalid review object", "sentiment": "Error (Mapping)"}
                        processed_reviews_list.append(review_item)
            except requests.exceptions.RequestException as e:
                error_msg = f"Failed to get sentiments from Gemini server: {e}"; print(error_msg)
                sentiment_summary.update({"error": error_msg, "total": len(raw_review_objects)})
                for r_obj in raw_review_objects:
                    if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = "Error (API Failure)"
                    else: review_item = {"review_desc": "Invalid review object", "sentiment": "Error (API Failure)"}
                    processed_reviews_list.append(review_item)
            except Exception as e:
                error_msg = f"Error processing sentiments: {e}"; print(error_msg)
                sentiment_summary.update({"error": error_msg, "total": len(raw_review_objects)})
                for r_obj in raw_review_objects:
                    if isinstance(r_obj, dict): review_item = r_obj.copy(); review_item['sentiment'] = "Error (Processing)"
                    else: review_item = {"review_desc": "Invalid review object", "sentiment": "Error (Processing)"}
                    processed_reviews_list.append(review_item)
    else:
        sentiment_summary.update({"total": 0, "error": "No reviews provided."})
    reviews_data = processed_reviews_list
    print("Final table_of_contents_data:", table_of_contents_data)
    print("Final product_aspects_data:", product_aspects_data) # Log aspects data
    return jsonify({"message": "Data received and processed!", "product_status": "ok" if "error" not in gemini_api_result else "error", "sentiment_status": "ok" if not sentiment_summary.get("error") and raw_review_objects else "no_reviews_or_error"})

@app.route('/receive_images', methods=['POST'])
def receive_images():
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