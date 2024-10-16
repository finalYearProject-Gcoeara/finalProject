from datasets import load_dataset
import json
import os

def load_gourmet_food_data():
    # Load the review dataset
    review_dataset = load_dataset("McAuley-Lab/Amazon-Reviews-2023", "raw_review_Grocery_and_Gourmet_Food", trust_remote_code=True, split="full")
    
    # Load the metadata dataset
    meta_dataset = load_dataset("McAuley-Lab/Amazon-Reviews-2023", "raw_meta_Grocery_and_Gourmet_Food", trust_remote_code=True, split="full")
    
    return review_dataset, meta_dataset

def extract_images(meta_dataset, output_dir,max_images = 200):
    os.makedirs(output_dir, exist_ok=True)
    
    image_data = []
    for item in meta_dataset:
        if len(image_data) >= max_images:
            break 
        parent_asin = item['parent_asin']
        images = item['images']
        
        if images and 'large' in images:
            image_urls = images['large']
            image_data.append({
                'parent_asin': parent_asin,
                'image_urls': image_urls
            })
    
    with open(os.path.join(output_dir, 'gourmet_food_images.json'), 'w') as f:
        json.dump(image_data, f, indent=2)
    
    print(f"Extracted {len(image_data)} image entries to {output_dir}/gourmet_food_images.json")

def extract_reviews(review_dataset, output_dir,max_review = 300):
    os.makedirs(output_dir, exist_ok=True)
    
    reviews = []
    for review in review_dataset:
        if len(reviews) >= max_review:
            break
        reviews.append({
            'parent_asin': review['parent_asin'],
            'rating': review['rating'],
            'title': review['title'],
            'text': review['text'],
            'user_id': review['user_id'],
            'timestamp': review['timestamp'],
            'helpful_vote': review['helpful_vote']
        })
    
    with open(os.path.join(output_dir, 'gourmet_food_reviews.json'), 'w') as f:
        json.dump(reviews, f, indent=2)
    
    print(f"Extracted {len(reviews)} reviews to {output_dir}/gourmet_food_reviews.json")

def main():
    output_dir = 'gourmet_food_data'
    
    print("Loading Grocery and Gourmet Food datasets...")
    review_dataset, meta_dataset = load_gourmet_food_data()
    
    print("Extracting images...")
    extract_images(meta_dataset, output_dir,max_images=200)
    
    print("Extracting reviews...")
    extract_reviews(review_dataset, output_dir,max_review=300)
    
    print("Extraction complete!")

if __name__ == "__main__":
    main()