import google.generativeai as genai
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file
API_KEY = os.getenv("GOOGLE_API_KEY")
INPUT_DIR = "Dataset/Ayuothveda"  
OUTPUT_DIR = "output_processed_1" 
MODEL_NAME = "gemini-2.5-pro-exp-03-25"

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY not found. Please set it in the .env file.")
if not os.path.exists(INPUT_DIR):
    raise FileNotFoundError(f"Input directory '{INPUT_DIR}' not found.")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Configure Gemini API ---
genai.configure(api_key=API_KEY)
generation_config = {
  "temperature": 0.7, #reativity (0=deterministic, 1=max creative)
  "top_p": 1,
  "top_k": 1,
  "max_output_tokens": 2048, # Max length of generated description
}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
model = genai.GenerativeModel(model_name=MODEL_NAME,
                              generation_config=generation_config,
                              safety_settings=safety_settings)

# --- Helper Function to Generate Description ---
def generate_product_description(product_name, main_image, last_two_thumbnails):
    """Generates a product description using the Gemini API."""
    thumbnail_str = ", ".join(last_two_thumbnails) if last_two_thumbnails else "None"

    prompt = f"""
    Generate a brief, engaging product description (around 2-4 sentences) suitable for an e-commerce listing based on the following information:

    Product Name: {product_name}
    Main Image URL: {main_image}
    Key Thumbnail URLs: {thumbnail_str}

    Focus on highlighting the likely key features or benefits suggested by the name and images.
    Keep it concise and appealing to potential customers.
    Avoid making up specific ingredients or technical details not explicitly suggested.
    Do not include the image URLs in the description itself.
    """

    print(f"--- Generating description for: {product_name} ---")
    try:
        response = model.generate_content(prompt)
        # Basic check if response contains text
        if response.parts:
             # Remove potential markdown like "***" if present
             description = response.text.strip().replace('***', '').replace('**', '')
             print(f"   Generated Description: {description[:100]}...") # Print snippet
             return description
        else:
            # Handle cases where the response might be blocked or empty
            print(f"   WARN: Received empty or blocked response for {product_name}.")
            # Check candidate details if available
            if response.candidates and response.candidates[0].finish_reason != 'STOP':
                 print(f"   Reason: {response.candidates[0].finish_reason}")
                 # You might want to inspect response.prompt_feedback here too
            return "Error: Could not generate description (API response empty or blocked)."

    except Exception as e:
        print(f"   ERROR generating description for {product_name}: {e}")
        return f"Error: API call failed - {e}"
    finally:
        # Add a small delay to avoid hitting API rate limits too quickly
        time.sleep(1) # Sleep for 1 second between API calls


# --- Main Processing Loop ---
print(f"Starting product processing from '{INPUT_DIR}'...")

for filename in os.listdir(INPUT_DIR):
    if filename.lower().endswith(".json"):
        input_filepath = os.path.join(INPUT_DIR, filename)
        output_filename = f"processed_{filename}"
        output_filepath = os.path.join(OUTPUT_DIR, output_filename)

        print(f"\nProcessing file: {filename}")

        try:
            with open(input_filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # --- Data Extraction ---
            images_data = data.get("images")
            if not images_data or not isinstance(images_data, dict):
                print(f"  Skipping {filename}: 'images' key missing or not a dictionary.")
                continue

            product_name = images_data.get("product_name")
            main_image = images_data.get("main_image")
            thumbnails = images_data.get("thumbnails")

            if not product_name or not main_image:
                print(f"  Skipping {filename}: Missing 'product_name' or 'main_image'.")
                continue

            # Ensure thumbnails is a list before slicing
            if not isinstance(thumbnails, list):
                 print(f"  WARN in {filename}: 'thumbnails' is not a list. Setting to empty.")
                 thumbnails = []

            # Get last two thumbnails, handling lists shorter than 2
            last_two_thumbnails = thumbnails[-2:]

            # --- Generate Description ---
            generated_description = generate_product_description(
                product_name, main_image, last_two_thumbnails
            )

            # --- Prepare Output Data ---
            output_data = {
                "product_name": product_name,
                "main_image": main_image,
                "last_two_thumbnails": last_two_thumbnails,
                "generated_description": generated_description
            }

            # --- Save Output JSON ---
            with open(output_filepath, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=4, ensure_ascii=False)

            print(f"  Successfully processed and saved to {output_filepath}")

        except json.JSONDecodeError:
            print(f"  Skipping {filename}: Invalid JSON format.")
        except KeyError as e:
            print(f"  Skipping {filename}: Missing expected key {e}.")
        except Exception as e:
            print(f"  An unexpected error occurred processing {filename}: {e}")

print("\nProcessing complete.")