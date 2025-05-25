import re
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests
from collections import Counter

app = Flask(__name__)
CORS(app)

# Global variables
product_info = {}
reviews_data = []  # Will store original review dicts, each augmented with a 'sentiment' key
images = {}
gemini_api_result = {}

# Initialize sentiment_summary completely to prevent UndefinedError in Jinja
sentiment_summary = {
    "positive": 0,
    "negative": 0,
    "neutral": 0,
    "unknown": 0,
    "total": 0,
    "error": None  # Can be a string if an error occurs
}

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


@app.route('/')
def index():
    # Ensure global sentiment_summary is passed, which is now initialized with all keys
    return render_template('index.html',
                           product_info=product_info,
                           images=images,
                           reviews_data=reviews_data,
                           gemini_data=gemini_api_result,
                           sentiment_summary=sentiment_summary)

@app.route('/receive_data', methods=['POST'])
def receive_data():
    global product_info, reviews_data, gemini_api_result, sentiment_summary
    data = request.get_json()
    print("Received product/reviews data (full):", data)

    product_info = data.get('product_info', {})
    raw_review_objects = data.get('reviews', [])
    print("Received raw review objects:", raw_review_objects)

    # --- Reset for new data processing ---
    # reviews_data will be rebuilt.
    # gemini_api_result is reset here.
    gemini_api_result = {}
    # Reset sentiment_summary with default structure for the new request
    sentiment_summary = {
        "positive": 0, "negative": 0, "neutral": 0, "unknown": 0, "total": 0, "error": None
    }
    
    processed_reviews_list = [] # Temporary list to build up reviews with sentiment

    # 1. Prepare payload for Gemini Product Processing
    actual_thumbnails = images.get('thumbnails', [])
    if not actual_thumbnails and product_info.get('main_image'):
        actual_thumbnails = [product_info.get('main_image')]

    gemini_payload = {
        "images": {
            "product_name": product_info.get('product_name', ''),
            "main_image": product_info.get('main_image', ''),
            "thumbnails": actual_thumbnails
        }
    }

    try:
        response = requests.post(GEMINI_PRODUCT_URL, json=gemini_payload, timeout=20)
        response.raise_for_status()
        gemini_api_result = response.json()
        print("Gemini Product API Response:", gemini_api_result)

        if "structured_description" in gemini_api_result:
            gemini_api_result["cleaned_description"] = clean_structured_description(gemini_api_result["structured_description"])
        elif "food_product_details" in gemini_api_result:
             gemini_api_result["cleaned_description"] = gemini_api_result["food_product_details"]

    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to get product details from Gemini server: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg}
    except Exception as e: # Catch other potential errors
        error_msg = f"Error processing product details: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg}


    # 2. Analyze sentiment of reviews
    if raw_review_objects:
        review_texts_for_api = []
        for r_obj in raw_review_objects:
            if isinstance(r_obj, dict):
                review_text = r_obj.get('review_desc')
                if review_text and isinstance(review_text, str):
                    review_texts_for_api.append(review_text)
                else:
                    review_texts_for_api.append("")
                    print(f"Warning: Review object missing 'review_desc' or it's not a string: {r_obj}")
            else:
                review_texts_for_api.append("")
                print(f"Warning: Encountered non-dictionary item in raw_review_objects: {r_obj}")

        print(f"Extracted review texts for sentiment API: {review_texts_for_api}")

        if not any(review_texts_for_api): # If all texts are empty
            print("No valid review texts found to send for sentiment analysis.")
            sentiment_summary.update({"error": "No review texts found", "total": 0})
            for r_obj in raw_review_objects: # Populate with original data + Unknown sentiment
                if isinstance(r_obj, dict):
                    r_obj_copy = r_obj.copy()
                    r_obj_copy['sentiment'] = "Unknown"
                    processed_reviews_list.append(r_obj_copy)
        else:
            try:
                sentiment_payload = {"reviews": review_texts_for_api}
                s_response = requests.post(GEMINI_SENTIMENT_URL, json=sentiment_payload, timeout=45)
                s_response.raise_for_status()
                sentiment_results = s_response.json().get("sentiments", [])

                if len(sentiment_results) == len(raw_review_objects):
                    for i, r_obj in enumerate(raw_review_objects):
                        if isinstance(r_obj, dict):
                            r_obj_copy = r_obj.copy() # Keep original review data
                            r_obj_copy['sentiment'] = sentiment_results[i] # Add sentiment
                            processed_reviews_list.append(r_obj_copy)
                        # else: Malformed original review object, skip or add placeholder
                    
                    sentiment_counts = Counter(sentiment_results)
                    sentiment_summary.update({
                        "positive": sentiment_counts.get("Positive", 0),
                        "negative": sentiment_counts.get("Negative", 0),
                        "neutral": sentiment_counts.get("Neutral", 0),
                        "unknown": sentiment_counts.get("Unknown", 0) + sentiment_counts.get("Error", 0),
                        "total": len(review_texts_for_api), # Total reviews analyzed
                        "error": None # Clear any previous error
                    })
                    print("Sentiment Analysis Summary:", sentiment_summary)
                else:
                    error_msg = "Mismatch in number of reviews processed and sentiments received."
                    print(error_msg)
                    sentiment_summary.update({"error": error_msg, "total": 0})
                    for r_obj in raw_review_objects: # Fallback: add original data + Error sentiment
                        if isinstance(r_obj, dict):
                            r_obj_copy = r_obj.copy()
                            r_obj_copy['sentiment'] = "Error (Mismatch)"
                            processed_reviews_list.append(r_obj_copy)

            except requests.exceptions.RequestException as e:
                error_msg = f"Failed to get sentiments from Gemini server: {e}"
                print(error_msg) # This will show the timeout error if it occurs
                sentiment_summary.update({"error": error_msg, "total": 0})
                for r_obj in raw_review_objects: # Fallback
                    if isinstance(r_obj, dict):
                        r_obj_copy = r_obj.copy()
                        r_obj_copy['sentiment'] = "Error (API Failure)"
                        processed_reviews_list.append(r_obj_copy)
            except Exception as e: # Catch other potential errors during sentiment processing
                error_msg = f"Error processing sentiments: {e}"
                print(error_msg)
                sentiment_summary.update({"error": error_msg, "total": 0})
                for r_obj in raw_review_objects: # Fallback
                    if isinstance(r_obj, dict):
                        r_obj_copy = r_obj.copy()
                        r_obj_copy['sentiment'] = "Error (Processing)"
                        processed_reviews_list.append(r_obj_copy)
    else: # No raw_review_objects
        sentiment_summary.update({"error": "No reviews provided for analysis", "total": 0})
        # processed_reviews_list remains empty

    reviews_data = processed_reviews_list # Update global reviews_data

    return jsonify({
        "message": "Data received and processed!",
        "product_status": "ok" if "error" not in gemini_api_result else "error",
        "sentiment_status": "ok" if not sentiment_summary.get("error") and raw_review_objects else "no_reviews_or_error"
    })


@app.route('/receive_images', methods=['POST'])
def receive_images():
    global images
    data = request.get_json()
    print("Received images data:", data)
    images = data.get('images', {})
    return jsonify({"message": "Images received successfully!"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)