import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam

# Load and preprocess the data
def load_data(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    return df

# Preprocess text
def preprocess_text(text):
    # Add more preprocessing steps as needed
    return text.lower()

# Prepare data for training
def prepare_data(df, max_words=10000, max_len=100):
    df['processed_text'] = df['text'].apply(preprocess_text)
    
    tokenizer = Tokenizer(num_words=max_words)
    tokenizer.fit_on_texts(df['processed_text'])
    sequences = tokenizer.texts_to_sequences(df['processed_text'])
    X = pad_sequences(sequences, maxlen=max_len)
    
    # Convert ratings to sentiment labels (positive: 4-5, neutral: 3, negative: 1-2)
    df['sentiment'] = df['rating'].apply(lambda x: 'positive' if x >= 4 else ('negative' if x <= 2 else 'neutral'))
    
    le = LabelEncoder()
    y = le.fit_transform(df['sentiment'])
    
    return X, y, tokenizer, le

# Build the model
def build_model(max_words, max_len, embedding_dim=100):
    model = Sequential([
        Embedding(max_words, embedding_dim, input_length=max_len),
        LSTM(128, return_sequences=True),
        LSTM(64),
        Dense(64, activation='relu'),
        Dropout(0.5),
        Dense(3, activation='softmax')
    ])
    model.compile(optimizer=Adam(learning_rate=0.001), loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model

# Train the model
def train_model(model, X_train, y_train, X_val, y_val, epochs=60, batch_size=32):
    history = model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=epochs, batch_size=batch_size)
    return history

# Main function
def main():
    # Load data
    df = load_data('gourmet_food_data/gourmet_food_reviews.json')
    
    # Prepare data
    X, y, tokenizer, le = prepare_data(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42)
    
    # Build and train model
    model = build_model(max_words=10000, max_len=100)
    history = train_model(model, X_train, y_train, X_val, y_val)
    
    # Evaluate model
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Test accuracy: {accuracy:.4f}")
    
    # Save model
    model.save('sentiment_analysis_model.h5')
    
    print("Model training complete and saved.")

if __name__ == "__main__":
    main()