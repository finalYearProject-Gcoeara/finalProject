# app.py (the one serving index.html)

import re
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests
from collections import Counter # For counting sentiments

app = Flask(__name__)
CORS(app)

# Global variables
product_info = {}
reviews_data = [] # Store reviews with their sentiments
images = {}
# structured_description = "" # No longer needed if gemini_api_result is used
gemini_api_result = {} # To store product description/details
sentiment_summary = {} # To store sentiment counts and other summary data

GEMINI_API_BASE_URL = 'http://127.0.0.1:5001' # Define base URL
GEMINI_PRODUCT_URL = f'{GEMINI_API_BASE_URL}/process_product'
GEMINI_SENTIMENT_URL = f'{GEMINI_API_BASE_URL}/analyze_sentiments'


def clean_structured_description(text):
    # ... (your existing clean_structured_description function)
    if not text:
        return ""
    # Remove '**What it is:**' section
    text = re.sub(r'\*\*What it is:\*\*', '', text, flags=re.IGNORECASE)
    # Remove '**Potential Pros:**' and following bullet points
    text = re.sub(r'\*\*Potential Pros:\*\*.*?(?=(\*\*Potential Cons|\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Remove '**Potential Cons/Considerations:**' and following bullet points
    text = re.sub(r'\*\*Potential Cons(?:/Considerations)?:\*\*.*?(?=(\*\*|$))', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = text.replace('*', '').strip()
    return text


@app.route('/')
def index():
    return render_template('index.html',
                           product_info=product_info,
                           images=images,
                           reviews_data=reviews_data, # Pass reviews with sentiments
                           gemini_data=gemini_api_result,
                           sentiment_summary=sentiment_summary) # Pass sentiment summary

@app.route('/receive_data', methods=['POST'])
def receive_data():
    global product_info, reviews_data, gemini_api_result, sentiment_summary
    data = request.get_json()
    print("Received product/reviews data (full):", data) # Log the whole thing initially

    product_info = data.get('product_info', {})
    # raw_review_objects is a list of dictionaries like {'rating': ..., 'review_desc': 'text...', ...}
    raw_review_objects = data.get('reviews', [])
    print("Received raw review objects:", raw_review_objects) # Log to see structure

    # --- Reset for new data ---
    reviews_data = []
    gemini_api_result = {}
    sentiment_summary = {"error": None}

    # 1. Prepare payload for Gemini Product Processing
    # ... (this part seems okay) ...
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
        response = requests.post(GEMINI_PRODUCT_URL, json=gemini_payload, timeout=20) # Increased timeout
        response.raise_for_status()
        gemini_api_result = response.json()
        print("Gemini Product API Response:", gemini_api_result)

        if "structured_description" in gemini_api_result:
            gemini_api_result["cleaned_description"] = clean_structured_description(gemini_api_result["structured_description"])
        elif "food_product_details" in gemini_api_result: # Use elif
             gemini_api_result["cleaned_description"] = gemini_api_result["food_product_details"]

    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to get product details from Gemini server: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg}
    except Exception as e:
        error_msg = f"Error processing product details: {e}"
        print(error_msg)
        gemini_api_result = {"error": error_msg}


    # 2. Analyze sentiment of reviews
    if raw_review_objects:
        # ---- MODIFICATION START ----
        # Extract just the review text strings for the sentiment API
        # Assuming the review text is in a field named 'review_desc'
        # If it's a different field, change 'review_desc' accordingly.
        review_texts_for_api = []
        for r_obj in raw_review_objects:
            # Ensure r_obj is a dictionary and has the review description key
            if isinstance(r_obj, dict):
                review_text = r_obj.get('review_desc') # Change 'review_desc' if your key is different
                if review_text and isinstance(review_text, str):
                    review_texts_for_api.append(review_text)
                else:
                    review_texts_for_api.append("") # Add empty string if no text, API will handle it
                    print(f"Warning: Review object missing 'review_desc' or it's not a string: {r_obj}")
            else:
                review_texts_for_api.append("") # If r_obj is not a dict
                print(f"Warning: Encountered non-dictionary item in raw_review_objects: {r_obj}")

        print(f"Extracted review texts for sentiment API: {review_texts_for_api}")

        if not any(review_texts_for_api): # If all texts are empty
            print("No valid review texts found to send for sentiment analysis.")
            sentiment_summary = {"positive":0,"negative":0,"neutral":0,"unknown":0,"total":0, "error": "No review texts found"}
            # Populate reviews_data with original objects but "Unknown" sentiment
            reviews_data = []
            for r_obj in raw_review_objects:
                # Add the original review text (or an empty string) and mark sentiment as Unknown
                text_to_display = r_obj.get('review_desc', 'Review text not available') if isinstance(r_obj, dict) else 'Invalid review object'
                reviews_data.append({"text": text_to_display, "sentiment": "Unknown"})

        else:
            try:
                sentiment_payload = {"reviews": review_texts_for_api} # Send only the text strings
                s_response = requests.post(GEMINI_SENTIMENT_URL, json=sentiment_payload, timeout=45) # Increased timeout
                s_response.raise_for_status()
                sentiment_results = s_response.json().get("sentiments", [])

                # The sentiment_results should now correspond to review_texts_for_api
                # We need to map these back to the original raw_review_objects for full display data
                if len(sentiment_results) == len(raw_review_objects): # Match with original object count
                    temp_reviews_data = []
                    for i, r_obj in enumerate(raw_review_objects):
                        # Get the actual review text for display (handle if r_obj is not a dict)
                        text_to_display = r_obj.get('review_desc', 'Review text not available') if isinstance(r_obj, dict) else 'Invalid review object'
                        temp_reviews_data.append({
                            "text": text_to_display, # This is for display in index.html {{ review.text }}
                            "sentiment": sentiment_results[i]
                            # You can add other original fields from r_obj here if index.html needs them
                            # e.g., "rating": r_obj.get('rating') if isinstance(r_obj, dict) else None
                        })
                    reviews_data = temp_reviews_data
                    
                    sentiment_counts = Counter(sentiment_results)
                    sentiment_summary.update({
                        "positive": sentiment_counts.get("Positive", 0),
                        "negative": sentiment_counts.get("Negative", 0),
                        "neutral": sentiment_counts.get("Neutral", 0),
                        "unknown": sentiment_counts.get("Unknown", 0) + sentiment_counts.get("Error", 0), # Combine unknown and error from API
                        "total": len(review_texts_for_api) # Total is based on texts sent to API
                    })
                    print("Sentiment Analysis Summary:", sentiment_summary)
                else:
                    error_msg = "Mismatch in number of reviews processed and sentiments received."
                    print(error_msg)
                    sentiment_summary["error"] = error_msg
                    # Fallback: mark all original reviews with Error sentiment
                    reviews_data = []
                    for r_obj in raw_review_objects:
                        text_to_display = r_obj.get('review_desc', 'Review text not available') if isinstance(r_obj, dict) else 'Invalid review object'
                        reviews_data.append({"text": text_to_display, "sentiment": "Error"})


            except requests.exceptions.RequestException as e:
                error_msg = f"Failed to get sentiments from Gemini server: {e}"
                print(error_msg)
                sentiment_summary["error"] = error_msg
                reviews_data = []
                for r_obj in raw_review_objects: # Fallback
                    text_to_display = r_obj.get('review_desc', 'Review text not available') if isinstance(r_obj, dict) else 'Invalid review object'
                    reviews_data.append({"text": text_to_display, "sentiment": "Error"})
            except Exception as e:
                error_msg = f"Error processing sentiments: {e}"
                print(error_msg)
                sentiment_summary["error"] = error_msg
                reviews_data = []
                for r_obj in raw_review_objects: # Fallback
                    text_to_display = r_obj.get('review_desc', 'Review text not available') if isinstance(r_obj, dict) else 'Invalid review object'
                    reviews_data.append({"text": text_to_display, "sentiment": "Error"})
        # ---- MODIFICATION END ----
    else: # No raw_review_objects
        reviews_data = []
        sentiment_summary = {"positive":0,"negative":0,"neutral":0,"unknown":0,"total":0}

    return jsonify({
        "message": "Data received and processed!",
        "product_status": "ok" if "error" not in gemini_api_result else "error",
        "sentiment_status": "ok" if "error" not in sentiment_summary and raw_review_objects else "no_reviews_or_error"
    })

# ... (rest of your app.py) ...

@app.route('/receive_images', methods=['POST'])
def receive_images():
    global images
    data = request.get_json()
    print("Received images data:", data)
    images = data.get('images', {}) # Assuming 'images' key contains a dict like {"main_image": "url", "thumbnails": ["url1", ...]}
    return jsonify({"message": "Images received successfully!"})


if __name__ == '__main__':
    app.run(debug=True, port=5000) # Default port is 5000