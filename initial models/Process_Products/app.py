import streamlit as st
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
import json
import re
import time
import random
import os
from dotenv import load_dotenv
from io import StringIO # To read uploaded file content as text

# --- Configuration ---
# Load .env file for local development (optional, st.secrets is preferred for deployment)
load_dotenv()

# Try to get API key from Streamlit secrets first, then environment variable
API_KEY = st.secrets.get("GOOGLE_API_KEY", os.getenv("GOOGLE_API_KEY"))

# --- Model & API Configuration (Keep these from the previous script) ---
CLASSIFICATION_MODEL = "gemini-1.5-flash"
GENERATION_MODELS_FALLBACK = ["gemini-1.5-flash", "gemini-1.0-pro"]
MAX_RETRIES = 3
INITIAL_BACKOFF_SECS = 3
MAX_BACKOFF_SECS = 60
BACKOFF_FACTOR = 2
generation_config_structured = {
  "temperature": 0.6, "top_p": 1, "top_k": 1, "max_output_tokens": 300,
}
generation_config_food = {
  "temperature": 0.4, "top_p": 1, "top_k": 1, "max_output_tokens": 200,
}
generation_config_classify = {
  "temperature": 0.2, "top_p": 1, "top_k": 1, "max_output_tokens": 10,
}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

# --- Helper Functions (Mostly identical to previous script) ---

# @st.cache_data # Optional: Cache results of normalization if needed, but likely fast enough
def normalize_filename(filename):
    """Cleans filename for duplicate checking."""
    name = filename.lower()
    # Remove .json extension safely
    if name.lower().endswith('.json'):
        name = name[:-5]
    name = re.sub(r'\s*\(\d+\)$', '', name)
    name = re.sub(r'pack_of_\d+', '', name)
    name = re.sub(r'__pack_of_\d+', '', name)
    name = re.sub(r'[_ ]+', ' ', name).strip()
    return name

# --- Gemini API Functions (Should remain largely the same, ensure genai is configured) ---
# Note: These functions now assume genai is configured globally in the Streamlit app run

def classify_product_type(product_name, main_image_url):
    """Calls Gemini to classify product type."""
    prompt = f"""
    Based on the product name and main image URL, classify this product.
    Product Name: {product_name}
    Main Image URL: {main_image_url}

    Is this primarily a FOOD product intended for consumption?
    Respond ONLY with the single word: Food, Non-Food, or Unknown.
    """
    # (Retry/fallback logic omitted for brevity - assume it's the same as previous script)
    # In a real app, keep the full retry logic here.
    try:
        model = genai.GenerativeModel(model_name=CLASSIFICATION_MODEL,
                                      generation_config=generation_config_classify,
                                      safety_settings=safety_settings)
        response = model.generate_content(prompt, request_options={"timeout": 60}) # Add timeout
        if response.parts:
            classification = response.text.strip().capitalize()
            if classification in ["Food", "Non-food", "Unknown"]:
                 if classification == "Non-food": classification = "Non-Food"
                 st.write(f"    - Classification attempt: Success ({classification})") # Use st.write for status in Streamlit
                 return classification
            else:
                 st.warning(f"    - Classification Warning: Unexpected response '{response.text.strip()}'. Treating as Unknown.")
                 return "Unknown"
        else:
            st.warning(f"    - Classification Warning: Empty/blocked response.")
            # Add more detail from response.candidates/prompt_feedback if needed
            return "Unknown"
    except Exception as e:
        st.error(f"    - Classification Error: {e}")
        return "Unknown" # Default if call fails

def generate_food_details(product_name, main_image, last_three_thumbnails):
    """Generates description for food items."""
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
    # (Retry/fallback logic omitted for brevity - keep full logic from previous script)
    st.write(f"    - Generating food details...")
    try:
        # Use the first model in the fallback list for simplicity here
        # In production, implement the full fallback loop
        model = genai.GenerativeModel(model_name=GENERATION_MODELS_FALLBACK[0],
                                      generation_config=generation_config_food,
                                      safety_settings=safety_settings)
        response = model.generate_content(prompt, request_options={"timeout": 120}) # Longer timeout for generation
        if response.parts:
            details = response.text.strip()
            st.write(f"    - Food details generation: Success")
            return details
        else:
            st.warning(f"    - Food details generation Warning: Empty/blocked response.")
            return "Error: Could not generate food details (API response empty/blocked)."
    except Exception as e:
        st.error(f"    - Food details generation Error: {e}")
        return f"Error: Could not generate food details (API call failed: {e})"

def generate_structured_description(product_name, main_image, last_two_thumbnails):
    """Generates structured description for non-food items."""
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
    # (Retry/fallback logic omitted for brevity - keep full logic from previous script)
    st.write(f"    - Generating non-food description...")
    try:
        # Use the first model in the fallback list for simplicity here
        model = genai.GenerativeModel(model_name=GENERATION_MODELS_FALLBACK[0],
                                      generation_config=generation_config_structured,
                                      safety_settings=safety_settings)
        response = model.generate_content(prompt, request_options={"timeout": 120})
        if response.parts:
            description = response.text.strip()
            st.write(f"    - Non-food description generation: Success")
            return description
        else:
            st.warning(f"    - Non-food description generation Warning: Empty/blocked response.")
            return "Error: Could not generate description (API response empty/blocked)."
    except Exception as e:
        st.error(f"    - Non-food description generation Error: {e}")
        return f"Error: Could not generate description (API call failed: {e})"


# --- Streamlit App UI and Logic ---

st.set_page_config(layout="wide")
st.title("📦 Product JSON Processor with Gemini AI")

st.sidebar.header("Configuration")
# Allow API Key override via sidebar input (useful if secrets aren't set)
api_key_input = st.sidebar.text_input(
    "Enter Google API Key (optional, uses secrets/env first)",
    type="password",
    help="Needed to use the Gemini API. Best practice is to set GOOGLE_API_KEY in Streamlit secrets."
)

# Determine the final API key to use
final_api_key = api_key_input if api_key_input else API_KEY

if not final_api_key:
    st.error("🚫 Google API Key not found. Please enter it in the sidebar or set it in Streamlit secrets (`.streamlit/secrets.toml`) or a local `.env` file.")
    st.stop() # Stop execution if no API key
else:
    try:
        genai.configure(api_key=final_api_key)
        st.sidebar.success("API Key configured.")
    except Exception as e:
        st.error(f"🚫 Error configuring Gemini API: {e}")
        st.stop()

st.header("1. Upload Product JSON Files")
uploaded_files = st.file_uploader(
    "Choose JSON files...",
    type=['json'],
    accept_multiple_files=True,
    help="Upload one or more JSON files structured like the example."
)

# Placeholder for results - use session state to persist across reruns if needed
if 'results' not in st.session_state:
    st.session_state.results = []
if 'processed_filenames' not in st.session_state:
    st.session_state.processed_filenames = set()

if uploaded_files:
    st.header("2. Process Files")
    if st.button("✨ Process Uploaded Files"):
        st.session_state.results = [] # Clear previous results
        st.session_state.processed_filenames = set()
        unique_products_data = {} # {normalized_name: {'filename': original_filename, 'data': content_dict}}
        skipped_duplicates = []

        # --- Step 1: Read and Filter Duplicates ---
        st.subheader("Filtering Duplicates...")
        with st.spinner("Reading and checking for duplicate products..."):
            for uploaded_file in uploaded_files:
                filename = uploaded_file.name
                if filename in st.session_state.processed_filenames:
                    st.write(f"- Skipping already processed file: {filename}")
                    continue

                normalized_name = normalize_filename(filename)

                # Read file content
                try:
                    # Read content as string
                    stringio = StringIO(uploaded_file.getvalue().decode("utf-8"))
                    content_str = stringio.read()
                    content_dict = json.loads(content_str) # Parse JSON string
                except json.JSONDecodeError:
                    st.warning(f"- Skipping invalid JSON: {filename}")
                    skipped_duplicates.append({"filename": filename, "reason": "Invalid JSON"})
                    st.session_state.processed_filenames.add(filename)
                    continue
                except Exception as e:
                    st.warning(f"- Skipping file due to read error: {filename} ({e})")
                    skipped_duplicates.append({"filename": filename, "reason": f"Read error: {e}"})
                    st.session_state.processed_filenames.add(filename)
                    continue

                # Check for duplicates based on normalized name
                if normalized_name not in unique_products_data:
                    unique_products_data[normalized_name] = {'filename': filename, 'data': content_dict}
                    st.write(f"- Keeping unique: {filename} (Base: '{normalized_name}')")
                else:
                    st.write(f"- Found duplicate: {filename} (Base: '{normalized_name}') - Skipping.")
                    skipped_duplicates.append({"filename": filename, "reason": "Duplicate product"})
                    # No need to add filename to processed_filenames here, as it wasn't processed

            st.success(f"Identified {len(unique_products_data)} unique products to process.")
            if skipped_duplicates:
                 with st.expander("Skipped Files"):
                      st.json(skipped_duplicates)


        # --- Step 2: Process Unique Files ---
        st.subheader("Processing Unique Products with Gemini AI...")
        if not unique_products_data:
            st.warning("No unique products found to process.")
        else:
            progress_bar = st.progress(0)
            total_unique = len(unique_products_data)

            for i, (norm_name, product_info) in enumerate(unique_products_data.items()):
                filename = product_info['filename']
                data = product_info['data']
                st.markdown(f"--- \n**Processing: {filename}**")

                # Add to processed list *before* starting API calls for this file
                st.session_state.processed_filenames.add(filename)

                # Extract data (with error handling)
                try:
                    images_data = data.get("images")
                    if not isinstance(images_data, dict):
                        st.warning(f"  - Invalid 'images' section in {filename}. Skipping.")
                        st.session_state.results.append({
                             "original_filename": filename, "error": "Invalid 'images' section"})
                        continue # Skip to next file

                    product_name = images_data.get("product_name")
                    main_image = images_data.get("main_image")
                    thumbnails = images_data.get("thumbnails", [])

                    if not product_name or not main_image:
                        st.warning(f"  - Missing 'product_name' or 'main_image' in {filename}. Skipping.")
                        st.session_state.results.append({
                            "original_filename": filename, "error": "Missing name or main image"})
                        continue
                    if not isinstance(thumbnails, list): thumbnails = []

                except Exception as e:
                     st.error(f"  - Error extracting data from {filename}: {e}")
                     st.session_state.results.append({
                         "original_filename": filename, "error": f"Data extraction error: {e}"})
                     continue


                # Classification Step
                product_type = "Unknown" # Default
                if product_name and main_image:
                    product_type = classify_product_type(product_name, main_image)
                else:
                    st.warning("  - Cannot classify product type due to missing name/image.")

                # Conditional Generation
                generated_content = None
                used_thumbnails = []
                if product_type == "Food":
                    st.write("  - Product classified as FOOD.")
                    last_three_thumbnails = thumbnails[-3:]
                    used_thumbnails = last_three_thumbnails
                    generated_content = generate_food_details(
                        product_name, main_image, last_three_thumbnails
                    )
                else: # Non-Food or Unknown
                    if product_type == "Unknown":
                        st.write("  - Product type UNKNOWN, generating standard description.")
                    else:
                         st.write(f"  - Product classified as NON-FOOD.")

                    last_two_thumbnails = thumbnails[-2:]
                    used_thumbnails = last_two_thumbnails
                    generated_content = generate_structured_description(
                        product_name, main_image, last_two_thumbnails
                    )

                # Store Result
                result_data = {
                    "original_filename": filename,
                    "product_name": product_name,
                    "main_image": main_image,
                    "all_thumbnails": thumbnails,
                    "determined_product_type": product_type,
                    "used_thumbnails_for_details": used_thumbnails
                }
                if product_type == "Food":
                    result_data["food_product_details"] = generated_content
                else:
                    result_data["structured_description"] = generated_content

                st.session_state.results.append(result_data)
                progress_bar.progress((i + 1) / total_unique)
                time.sleep(0.5) # Small delay between products

            st.success("✅ Processing complete!")


# --- Step 3: Display Results ---
if st.session_state.results:
    st.header("3. Results")

    # Provide download for all results
    results_json_string = json.dumps(st.session_state.results, indent=4, ensure_ascii=False)
    st.download_button(
        label="📥 Download All Results as JSON",
        data=results_json_string,
        file_name="processed_products_results.json",
        mime="application/json",
    )

    st.markdown("---") # Separator

    for result in st.session_state.results:
        with st.expander(f"📄 {result.get('product_name', result.get('original_filename'))}"):
            st.subheader("Product Information")
            st.markdown(f"**Original Filename:** `{result.get('original_filename', 'N/A')}`")
            st.markdown(f"**Product Name:** {result.get('product_name', 'N/A')}")
            if result.get('main_image'):
                st.image(result['main_image'], caption="Main Image", width=150)

            st.subheader("Classification & Description")
            st.info(f"**Determined Type:** {result.get('determined_product_type', 'Error')}")

            if result.get('error'):
                 st.error(f"**Processing Error:** {result['error']}")
            elif result.get('determined_product_type') == "Food":
                st.markdown("**Generated Food Details:**")
                st.text(result.get('food_product_details', 'N/A')) # Use st.text for preformatted-like output
            else:
                st.markdown("**Generated Structured Description:**")
                st.markdown(result.get('structured_description', 'N/A')) # Use st.markdown for potential formatting

            with st.popover("View Raw Data"):
                 st.json(result) # Show the full JSON for this result

else:
     st.info("Upload JSON files and click 'Process Uploaded Files' to see results.")