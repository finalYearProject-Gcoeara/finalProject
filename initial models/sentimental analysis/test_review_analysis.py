import json
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder

# Load the trained model
model = load_model('sentiment_analysis_model.h5')

# Load the tokenizer and label encoder
def load_tokenizer_and_encoder(file_path, max_words=10000):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    texts = [review['text'].lower() for review in data]
    
    tokenizer = Tokenizer(num_words=max_words)
    tokenizer.fit_on_texts(texts)
    
    ratings = [review['rating'] for review in data]
    sentiments = ['positive' if r >= 4 else ('negative' if r <= 2 else 'neutral') for r in ratings]
    
    le = LabelEncoder()
    le.fit(sentiments)
    
    return tokenizer, le

# Preprocess a single review
def preprocess_review(review, tokenizer, max_len=100):
    sequence = tokenizer.texts_to_sequences([review.lower()])
    padded = pad_sequences(sequence, maxlen=max_len)
    return padded

# Predict sentiment
def predict_sentiment(review, tokenizer, le):
    processed_review = preprocess_review(review, tokenizer)
    prediction = model.predict(processed_review)
    sentiment_index = np.argmax(prediction)
    sentiment = le.inverse_transform([sentiment_index])[0]
    confidence = prediction[0][sentiment_index]
    return sentiment, confidence

# Main function
def main():
    # Load tokenizer and label encoder
    tokenizer, le = load_tokenizer_and_encoder('gourmet_food_data/gourmet_food_reviews.json')
    
    print("Sentiment Analysis Tester")
    print("Enter a review to analyze its sentiment. Type 'quit' to exit.")
    
    while True:
        review = input("\nEnter a review: ")
        if review.lower() == 'quit':
            break
        
        sentiment, confidence = predict_sentiment(review, tokenizer, le)
        print(f"Predicted sentiment: {sentiment}")
        print(f"Confidence: {confidence:.2f}")

if __name__ == "__main__":
    main()