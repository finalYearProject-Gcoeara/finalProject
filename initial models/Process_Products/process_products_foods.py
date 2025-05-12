import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
import json
import os
import re
import time
import random
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
INPUT_DIR = "Dataset/kissan"
OUTPUT_DIR = "output_classified_structured"
DUPLICATES_DIR = "output_duplicates"

# --- Model & API Configuration ---
# Using Flash for potentially faster classification, fallback for generation
CLASSIFICATION_MODEL = "gemini-1.5-flash"
GENERATION_MODELS_FALLBACK = ["gemini-1.5-flash", "gemini-1.0-pro"]

MAX_RETRIES = 3
INITIAL_BACKOFF_SECS = 3
MAX_BACKOFF_SECS = 60
BACKOFF_FACTOR = 2

# Generation config for standard descriptions
generation_config_structured = {
  "temperature": 0.6, "top_p": 1, "top_k": 1, "max_output_tokens": 300,
}
# Generation config for food details (might need fewer tokens)
generation_config_food = {
  "temperature": 0.4, "top_p": 1, "top_k": 1, "max_output_tokens": 200,
}
# Generation config for classification (very few tokens needed)
generation_config_classify = {
  "temperature": 0.2, "top_p": 1, "top_k": 1, "max_output_tokens": 10,
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    # Add others as needed, potentially relax slightly if classification is blocked often
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

# --- Error Handling & Setup ---
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env file.")
if not os.path.exists(INPUT_DIR):
    raise FileNotFoundError(f"Input directory '{INPUT_DIR}' not found.")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DUPLICATES_DIR, exist_ok=True)

genai.configure(api_key=API_KEY)

# --- Helper Functions ---

def normalize_filename(filename):
    # (Same function as before)
    name = filename.lower()
    if name.endswith('.json'): name = name[:-5]
    name = re.sub(r'\s*\(\d+\)$', '', name)
    name = re.sub(r'pack_of_\d+', '', name)
    name = re.sub(r'__pack_of_\d+', '', name)
    name = re.sub(r'[_ ]+', ' ', name).strip()
    return name

# --- NEW: Function to Classify Product Type ---
def classify_product_type(product_name, main_image_url):
    """Calls Gemini to classify product as 'Food' or 'Non-Food'."""
    prompt = f"""
    Based on the product name and main image URL, classify this product.
    Product Name: {product_name}
    Main Image URL: {main_image_url}

    Is this primarily a FOOD product intended for consumption?
    Respond ONLY with the single word: Food, Non-Food, or Unknown.
    """
    print(f"   Classifying product type...")
    last_exception = None
    try:
        # Use the designated classification model
        model = genai.GenerativeModel(model_name=CLASSIFICATION_MODEL,
                                      generation_config=generation_config_classify,
                                      safety_settings=safety_settings)
        current_backoff = INITIAL_BACKOFF_SECS
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = model.generate_content(prompt)
                if response.parts:
                    classification = response.text.strip().capitalize()
                    if classification in ["Food", "Non-food", "Unknown"]:
                        # Standardize "Non-food"
                        if classification == "Non-food": classification = "Non-Food"
                        print(f"   Classification result: {classification} (Attempt {attempt+1})")
                        return classification
                    else:
                        print(f"   WARN: Unexpected classification response: '{response.text.strip()}'. Treating as Unknown.")
                        return "Unknown" # Treat unexpected responses as Unknown
                else:
                    # Handle blocked/empty (similar logic as before)
                    block_reason = "Unknown"
                    finish_reason = "Unknown"
                    if response.candidates:
                        block_reason = response.prompt_feedback.block_reason if response.prompt_feedback else "N/A"
                        finish_reason = response.candidates[0].finish_reason
                    print(f"   WARN (Classify, Attempt {attempt+1}): Empty/blocked response. Finish: {finish_reason}, Block: {block_reason}")
                    if finish_reason != 'STOP': # Break if blocked by safety etc.
                        last_exception = Exception(f"Classification Blocked/Empty (Finish: {finish_reason}, Block: {block_reason})")
                        break
                    last_exception = Exception("Empty classification response despite STOP.")
                    break # Break if empty but finished normally

            except (google_exceptions.ResourceExhausted, google_exceptions.DeadlineExceeded,
                    google_exceptions.ServiceUnavailable, google_exceptions.InternalServerError) as e:
                last_exception = e
                print(f"   WARN (Classify, Attempt {attempt+1}): API Error: {type(e).__name__}. Retrying in {current_backoff:.2f}s...")
                if attempt < MAX_RETRIES:
                    time.sleep(current_backoff + random.uniform(0, 1))
                    current_backoff = min(current_backoff * BACKOFF_FACTOR, MAX_BACKOFF_SECS)
                else:
                    print(f"   ERROR (Classify): Max retries reached.")
                    break # Exit retry loop
            except Exception as e:
                last_exception = e
                print(f"   ERROR (Classify, Attempt {attempt+1}): Unexpected error: {e}")
                break # Exit retry loop

    except Exception as e:
        last_exception = e
        print(f"   ERROR: Could not use classification model {CLASSIFICATION_MODEL}: {e}")

    print(f"   Classification failed. Defaulting to Unknown.")
    return "Unknown" # Default if all retries/models fail

# --- NEW: Function for Food Product Details ---
def generate_food_details(product_name, main_image, last_three_thumbnails):
    """Generates description focusing on ingredients and FSSAI for food items."""
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

    IMPORTANT:
    - ONLY report information potentially visible in the provided URLs. Do NOT guess or use external knowledge.
    - Be concise.
    - If details aren't visible in the thumbnails, explicitly state that.
    """
    print(f"   Generating food details...")
    last_exception = None
    # Use fallback list for generation
    for model_name in GENERATION_MODELS_FALLBACK:
        print(f"      Trying model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name=model_name,
                                          generation_config=generation_config_food,
                                          safety_settings=safety_settings)
            current_backoff = INITIAL_BACKOFF_SECS
            for attempt in range(MAX_RETRIES + 1):
                try:
                    response = model.generate_content(prompt)
                    if response.parts:
                        details = response.text.strip()
                        # Basic check if it contains expected keywords
                        if "Ingredients" in details or "FSSAI" in details:
                            print(f"      SUCCESS with {model_name} (Attempt {attempt+1})")
                            print(f"      Generated Details:\n{details[:150]}...")
                            return details # Success!
                        else:
                            # Received some text, but not in expected format
                            print(f"      WARN ({model_name}, Attempt {attempt+1}): Unexpected format for food details. Using raw output.")
                            return details # Return whatever was generated
                    else:
                        # Handle blocked/empty (similar logic)
                        block_reason = "Unknown"; finish_reason = "Unknown"
                        if response.candidates:
                            block_reason = response.prompt_feedback.block_reason if response.prompt_feedback else "N/A"
                            finish_reason = response.candidates[0].finish_reason
                        print(f"      WARN (Food Gen, Attempt {attempt+1}): Empty/blocked response. Finish: {finish_reason}, Block: {block_reason}")
                        if finish_reason != 'STOP':
                            last_exception = Exception(f"Food Gen Blocked/Empty (Finish: {finish_reason}, Block: {block_reason})")
                            break
                        last_exception = Exception("Empty food gen response despite STOP.")
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
                    break # Don't retry unexpected errors

        except Exception as e:
             last_exception = e
             print(f"      ERROR: Could not use generation model {model_name}: {e}")

    # If loop finishes without returning
    print(f"   FAILURE: Food detail generation failed for {product_name}.")
    error_msg = f"Error: Could not generate food details. Last error: {type(last_exception).__name__}" if last_exception else "Error: Generation failed."
    return error_msg

# --- Function for Structured Non-Food Description (Mostly same as before) ---
def generate_structured_description(product_name, main_image, last_two_thumbnails):
    """Generates structured description (What/Pros/Cons) for non-food items."""
    thumbnail_str = ", ".join(last_two_thumbnails) if last_two_thumbnails else "None"
    # Using the same prompt as in the previous version for What/Pros/Cons
    prompt = f"""
    Analyze the following product information and generate a concise description with potential pros and cons:

    Product Name: {product_name}
    Main Image URL: {main_image}
    Key Thumbnail URLs: {thumbnail_str}

    Structure the output EXACTLY like this:

    **What it is:** [Provide a brief, 1-2 sentence description of the product based ONLY on the name and images.]

    **Potential Pros:**
    * [Infer a likely benefit based on product type/name, e.g., 'May help cleanse skin', 'Likely hydrating'. Use cautious language.]
    * [Infer another likely benefit.]
    * [Infer a third likely benefit if obvious.]

    **Potential Cons/Considerations:**
    * [Mention a general consideration, e.g., 'Patch test recommended for sensitive skin', 'Results may vary'.]
    * [Mention another potential consideration, e.g., 'Scent might not appeal to everyone' (if applicable like floral), 'May not be suitable for very dry/oily skin' (if product seems targeted).]

    IMPORTANT:
    - Keep each point very brief.
    - Base the description ONLY on the provided product name and image URLs. Do NOT invent ingredients or specific technical details.
    - Use cautious language like "potential," "likely," "may help," "might" for pros and cons, as they are inferred.
    - Do NOT include conversational text, introductory sentences, or multiple options. Output only the structured text starting with '**What it is:**'.
    """
    print(f"   Generating structured non-food description...")
    last_exception = None
    # Use fallback list for generation
    for model_name in GENERATION_MODELS_FALLBACK:
        print(f"      Trying model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name=model_name,
                                          generation_config=generation_config_structured,
                                          safety_settings=safety_settings)
            # (Retry logic identical to generate_food_details, just change print context)
            current_backoff = INITIAL_BACKOFF_SECS
            for attempt in range(MAX_RETRIES + 1):
                try:
                    response = model.generate_content(prompt)
                    if response.parts:
                        description = response.text.strip()
                        if description.startswith("**What it is:**"):
                             print(f"      SUCCESS with {model_name} (Attempt {attempt+1})")
                             print(f"      Generated Description:\n{description[:150]}...")
                             return description
                        else:
                            print(f"      WARN ({model_name}, Attempt {attempt+1}): Output format unexpected. Using raw output.")
                            return description.strip()
                    else:
                        block_reason = "Unknown"; finish_reason = "Unknown"
                        if response.candidates:
                            block_reason = response.prompt_feedback.block_reason if response.prompt_feedback else "N/A"
                            finish_reason = response.candidates[0].finish_reason
                        print(f"      WARN (Struct Gen, Attempt {attempt+1}): Empty/blocked. Finish: {finish_reason}, Block: {block_reason}")
                        if finish_reason != 'STOP':
                            last_exception = Exception(f"Struct Gen Blocked/Empty (Finish: {finish_reason}, Block: {block_reason})")
                            break
                        last_exception = Exception("Empty struct gen response despite STOP.")
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

    # If loop finishes without returning
    print(f"   FAILURE: Structured description generation failed for {product_name}.")
    error_msg = f"Error: Could not generate structured description. Last error: {type(last_exception).__name__}" if last_exception else "Error: Generation failed."
    return error_msg


# --- Main Execution ---

# 1. Filter Files
print("--- Step 1: Filtering input files ---")
unique_products = {}
duplicate_files = []
all_files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(".json")]

for filename in all_files:
    normalized_name = normalize_filename(filename)
    if normalized_name not in unique_products:
        unique_products[normalized_name] = filename
        print(f"  Keeping: {filename} (Base: '{normalized_name}')")
    else:
        duplicate_files.append(filename)
        print(f"  Skipping (Duplicate): {filename} (Base: '{normalized_name}')")

print(f"\nFound {len(unique_products)} unique products out of {len(all_files)} files.")

# Optional: Move duplicates
if duplicate_files:
    print(f"\nMoving {len(duplicate_files)} duplicate files to '{DUPLICATES_DIR}'...")
    # (Moving logic same as before)
    for dup_file in duplicate_files:
        try:
            os.rename(os.path.join(INPUT_DIR, dup_file), os.path.join(DUPLICATES_DIR, dup_file))
        except OSError as e: print(f"  Error moving file {dup_file}: {e}")


# 2. Process Unique Files
print(f"\n--- Step 2: Processing {len(unique_products)} unique products ---")
processed_count = 0
error_count = 0
files_to_process = list(unique_products.values())

for filename in files_to_process:
    input_filepath = os.path.join(INPUT_DIR, filename)
    output_filename = f"classified_{filename}" # New naming convention
    output_filepath = os.path.join(OUTPUT_DIR, output_filename)

    print(f"\nProcessing unique file: {filename} ({processed_count + error_count + 1}/{len(files_to_process)})")

    if not os.path.exists(input_filepath):
         print(f"  ERROR: Input file not found: {input_filepath}")
         error_count += 1
         continue

    try:
        with open(input_filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # --- Data Extraction ---
        images_data = data.get("images")
        if not isinstance(images_data, dict):
            print(f"  Skipping {filename}: Invalid 'images' data.")
            error_count += 1
            continue

        product_name = images_data.get("product_name")
        main_image = images_data.get("main_image")
        thumbnails = images_data.get("thumbnails", [])

        if not product_name or not main_image:
            print(f"  Skipping {filename}: Missing name or main image.")
            error_count += 1
            continue
        if not isinstance(thumbnails, list): thumbnails = []

        # --- Classification Step ---
        product_type = classify_product_type(product_name, main_image)

        # --- Conditional Generation ---
        generated_content = None
        if product_type == "Food":
            last_three_thumbnails = thumbnails[-3:] # Get last THREE for food
            generated_content = generate_food_details(
                product_name, main_image, last_three_thumbnails
            )
        else: # Non-Food or Unknown
            if product_type == "Unknown":
                 print("   Proceeding with Non-Food description format for Unknown type.")
            last_two_thumbnails = thumbnails[-2:] # Get last TWO for non-food
            generated_content = generate_structured_description(
                product_name, main_image, last_two_thumbnails
            )

        # --- Prepare Output Data ---
        output_data = {
            "original_filename": filename,
            "product_name": product_name,
            "main_image": main_image,
            "all_thumbnails": thumbnails, # Store all thumbnails for reference
            "determined_product_type": product_type,
        }
        # Add the generated content under the appropriate key
        if product_type == "Food":
            output_data["food_product_details"] = generated_content
            output_data["used_thumbnails_for_details"] = last_three_thumbnails
        else:
            output_data["structured_description"] = generated_content
            output_data["used_thumbnails_for_details"] = last_two_thumbnails


        # --- Save Output JSON ---
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)

        if isinstance(generated_content, str) and generated_content.startswith("Error:"):
             print(f"  Partially processed (generation failed) and saved to {output_filepath}")
             error_count += 1
        else:
             print(f"  Successfully classified and processed. Saved to {output_filepath}")
             processed_count += 1

    except json.JSONDecodeError:
        print(f"  Skipping {filename}: Invalid JSON format.")
        error_count += 1
    except KeyError as e:
        print(f"  Skipping {filename}: Missing key {e}.")
        error_count += 1
    except Exception as e:
        print(f"  An unexpected error occurred processing {filename}: {e}")
        error_count += 1
    finally:
         time.sleep(1.0) # Slightly longer delay between files due to potential double API call

print(f"\nProcessing complete. Processed: {processed_count}, Errors/Skipped: {error_count}")