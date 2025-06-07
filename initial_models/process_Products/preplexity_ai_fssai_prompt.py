import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
# Set your Perplexity API key here or use an environment variable for security
API_KEY = os.environ.get("PERPLEXITY_API_KEY")  # Recommended for security
# API_KEY = "YOUR_PERPLEXITY_API_KEY"  # Uncomment to hardcode (not recommended)

if not API_KEY:
    print("Error: PERPLEXITY_API_KEY environment variable not set.")
    exit(1)

# Perplexity API endpoint
url = "https://api.perplexity.ai/chat/completions"

# The product you want to query
product_query = "Chaayos Chai Time Snack Premium Coconut Cookies Cookies Biscuit  (18 x 25 g)"

# Prompt for user category segmentation
user_prompt = f"""
Analyze the product "{product_query}" and identify 6 user categories based on their likelihood to purchase and use this product.
Divide them into three groups: "More Likely" (2 categories), "Likely" (2 categories), and "Less Likely" (2 categories).
For each, provide a brief explanation (1-2 sentences) of why they fit that likelihood level.
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

payload = {
    "model": "sonar-pro",
    "messages": [
        {
            "role": "system",
            "content": "You are an expert market research analyst specializing in consumer behavior and product segmentation. Your task is to analyze products and identify different user categories based on their likelihood to use the product. Just give the name of the users and dont give any explanation or description of the users."
        },
        {
            "role": "user",
            "content": user_prompt
        }
    ],
    "max_tokens": 400,
    "temperature": 0.3
}

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()
    # Extract and print the assistant's reply
    if data.get("choices"):
        assistant_reply = data["choices"][0]["message"]["content"]
        print(f"User Category Segmentation for '{product_query}':\n")
        print(assistant_reply)
    else:
        print("No response from API.")
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
    if hasattr(e, 'response') and e.response is not None:
        print("Error details:", e.response.text)
