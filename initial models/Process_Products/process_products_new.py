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
INPUT_DIR = "Dataset/Ayuothveda"
OUTPUT_DIR = "output_unique_structured"
DUPLICATES_DIR = "output_duplicates"

MODEL_FALLBACK_LIST = ["gemini-1.5-flash", "gemini-1.0-pro" , "gemini-2.5-pro-exp-03-25" , "gemini-2.5-pro-exp-03-25-v2"]
MAX_RETRIES = 2
INITIAL_BACKOFF_SECS = 2
MAX_BACKOFF_SECS = 60
BACKOFF_FACTOR = 2
generation_config = {
  "temperature": 0.6, # Creativity (0=deterministic, 1=max creative)
  "top_p": 1,
  "top_k": 1,
  "max_output_tokens": 300,
}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY not found. Please set it in the .env file.")
if not os.path.exists(INPUT_DIR):
    raise FileNotFoundError(f"Input directory '{INPUT_DIR}' not found.")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DUPLICATES_DIR, exist_ok=True) 

genai.configure(api_key=API_KEY)


def normalize_filename(filename):
    """
    Cleans the filename to get a base product name for comparison.
    Removes .json, variant numbers like (1), pack info, and standardizes spaces/case.
    """
    name = filename.lower()
    if name.endswith('.json'):
        name = name[:-5]
    name = re.sub(r'\s*\(\d+\)$', '', name)
    name = re.sub(r'pack_of_\d+', '', name)
    name = re.sub(r'__pack_of_\d+', '', name) # Handle double underscore cases
    # Optional: Remove simple size indicators (be careful not to remove part of name)
    # name = re.sub(r'_\d+ml$', '', name)
    # name = re.sub(r'_\d+g$', '', name)
    # Replace underscores/multiple spaces with single space, strip whitespace
    name = re.sub(r'[_ ]+', ' ', name).strip()
    return name

def generate_structured_description(product_name, main_image, last_two_thumbnails):
    """
    Generates a structured product description (What/Pros/Cons) using Gemini.
    Includes retry logic and model fallback.
    """
    thumbnail_str = ", ".join(last_two_thumbnails) if last_two_thumbnails else "None"
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

    print(f"--- Generating structured description for: {product_name} ---")
    last_exception = None

    for model_name in MODEL_FALLBACK_LIST:
        print(f"   Trying model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name=model_name,
                                          generation_config=generation_config,
                                          safety_settings=safety_settings)
            current_backoff = INITIAL_BACKOFF_SECS
            for attempt in range(MAX_RETRIES + 1):
                try:
                    response = model.generate_content(prompt)

                    if response.parts:
                        description = response.text.strip()
                        if description.startswith("**What it is:**"):
                             print(f"   SUCCESS with {model_name} (Attempt {attempt+1})")
                             print(f"   Generated Description:\n{description[:150]}...") 
                             return description # Success!
                        else:
                            print(f"   WARN ({model_name}, Attempt {attempt+1}): Output format unexpected. Trying to use.")
                            return description.strip()
                    else:
                        block_reason = "Unknown"
                        finish_reason = "Unknown"
                        if response.candidates:
                             block_reason = response.prompt_feedback.block_reason if response.prompt_feedback else "N/A"
                             finish_reason = response.candidates[0].finish_reason
                        print(f"   WARN ({model_name}, Attempt {attempt+1}): Received empty/blocked response. Finish Reason: {finish_reason}, Block Reason: {block_reason}")
                        if finish_reason != 'STOP':
                             last_exception = Exception(f"Blocked/Empty Response (Finish: {finish_reason}, Block: {block_reason})")
                             break
                        last_exception = Exception("Empty response content despite STOP finish reason.")
                        break

                except (google_exceptions.ResourceExhausted, google_exceptions.DeadlineExceeded,
                        google_exceptions.ServiceUnavailable, google_exceptions.InternalServerError) as e:
                    last_exception = e
                    print(f"   WARN ({model_name}, Attempt {attempt+1}): API Error: {type(e).__name__}. Retrying in {current_backoff:.2f}s...")
                    if attempt < MAX_RETRIES:
                        wait_time = current_backoff + random.uniform(0, 1)
                        time.sleep(wait_time)
                        current_backoff = min(current_backoff * BACKOFF_FACTOR, MAX_BACKOFF_SECS)
                    else:
                        print(f"   ERROR ({model_name}): Max retries reached.")
                        break
                except Exception as e:
                    last_exception = e
                    print(f"   ERROR ({model_name}, Attempt {attempt+1}): Unexpected error: {e}")
                    break 

        except Exception as e:
             last_exception = e
             print(f"   ERROR: Could not use model {model_name}: {e}")

    print(f"   FAILURE: All models failed for {product_name}.")
    error_msg = f"Error: Could not generate structured description. Last error: {type(last_exception).__name__}: {last_exception}" if last_exception else "Error: Generation failed."
    return error_msg



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

if duplicate_files:
    print(f"\nMoving {len(duplicate_files)} duplicate files to '{DUPLICATES_DIR}'...")
    for dup_file in duplicate_files:
        try:
            os.rename(os.path.join(INPUT_DIR, dup_file), os.path.join(DUPLICATES_DIR, dup_file))
        except OSError as e:
            print(f"  Error moving file {dup_file}: {e}")


print(f"\n--- Step 2: Processing {len(unique_products)} unique products ---")
processed_count = 0
error_count = 0

files_to_process = list(unique_products.values()) 

for filename in files_to_process:
    input_filepath = os.path.join(INPUT_DIR, filename)
    output_filename = f"structured_{filename}"
    output_filepath = os.path.join(OUTPUT_DIR, output_filename)

    print(f"\nProcessing unique file: {filename} ({processed_count + error_count + 1}/{len(files_to_process)})")

    if not os.path.exists(input_filepath):
         print(f"  ERROR: Input file not found (was it moved accidentally?): {input_filepath}")
         error_count += 1
         continue

    try:
        with open(input_filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # --- Data Extraction ---
        images_data = data.get("images")
        if not isinstance(images_data, dict):
            print(f"  Skipping {filename}: 'images' key missing or invalid.")
            error_count += 1
            continue

        product_name = images_data.get("product_name")
        main_image = images_data.get("main_image")
        thumbnails = images_data.get("thumbnails", []) # Default to empty list

        if not product_name or not main_image:
            print(f"  Skipping {filename}: Missing 'product_name' or 'main_image'.")
            error_count += 1
            continue
        if not isinstance(thumbnails, list):
             print(f"  WARN in {filename}: 'thumbnails' is not a list. Using empty list.")
             thumbnails = []

        last_two_thumbnails = thumbnails[-2:]

        structured_description = generate_structured_description(
            product_name, main_image, last_two_thumbnails
        )

        output_data = {
            "original_filename": filename,
            "product_name": product_name,
            "main_image": main_image,
            "last_two_thumbnails": last_two_thumbnails,
            "structured_description": structured_description 
        }

        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)

        if structured_description.startswith("Error:"):
             print(f"  Partially processed (generation failed) and saved to {output_filepath}")
             error_count += 1
        else:
             print(f"  Successfully processed and saved to {output_filepath}")
             processed_count += 1

    except json.JSONDecodeError:
        print(f"  Skipping {filename}: Invalid JSON format.")
        error_count += 1
    except KeyError as e:
        print(f"  Skipping {filename}: Missing expected key {e}.")
        error_count += 1
    except Exception as e:
        print(f"  An unexpected error occurred processing {filename}: {e}")
        error_count += 1
    finally:
         time.sleep(0.5) 

print(f"\nProcessing complete. Unique products processed: {processed_count}, Errors/Skipped: {error_count}")