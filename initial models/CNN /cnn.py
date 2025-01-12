import pandas as pd
import warnings
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from roboflow import Roboflow
import supervision as sv
import logging
import matplotlib.pyplot as plt

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize NLTK
nltk.download('vader_lexicon', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)

class IntegratedAnalyzer:
    def __init__(self, reviews_file: str, roboflow_api_key: str, project_name: str, model_version: int):
        self.reviews_file = reviews_file
        self.reviews_df = None
        self.roboflow = Roboflow(api_key=roboflow_api_key)
        self.project = self.roboflow.workspace().project(project_name)
        self.model = self.project.version(model_version).model
        self.sentiment_model = SentimentIntensityAnalyzer()
        self.stop_words = set(stopwords.words('english'))

    def load_reviews(self) -> None:
        """Load and clean reviews dataset."""
        try:
            self.reviews_df = pd.read_csv(self.reviews_file)
            self.reviews_df.drop(columns=['Unnamed: 5'], errors='ignore', inplace=True)
            self.reviews_df.dropna(inplace=True)
            self.reviews_df.reset_index(drop=True, inplace=True)
            logger.info(f"Loaded {len(self.reviews_df)} reviews.")
        except Exception as e:
            logger.error(f"Error loading reviews: {str(e)}")
            raise

    def clean_text(self, text: str) -> str:
        """Clean text by removing special characters and stopwords."""
        text = re.sub(r'[^A-Za-z0-9]+', ' ', text).lower().strip()
        return ' '.join([word for word in text.split() if word not in self.stop_words])

    def preprocess_reviews(self) -> None:
        """Preprocess review text."""
        self.reviews_df['clean_review_text'] = self.reviews_df['review'].apply(self.clean_text)

    def detect_products(self, image_path: str) -> list:
        """Detect products in an image using Roboflow."""
        try:
            result = self.model.predict(image_path, confidence=40, overlap=30).json()
            labels = [item['class'] for item in result['predictions']]
            logger.info(f"Detected products: {labels}")
            return labels
        except Exception as e:
            logger.error(f"Error detecting products: {str(e)}")
            raise

    def filter_reviews(self, detected_products: list) -> pd.DataFrame:
        """Filter reviews for the detected products."""
        filtered_reviews = self.reviews_df[self.reviews_df['name'].str.contains('|'.join(detected_products), case=False)]
        logger.info(f"Filtered reviews for {len(detected_products)} products. Found {len(filtered_reviews)} reviews.")
        return filtered_reviews

    def analyze_sentiment(self, reviews: pd.DataFrame) -> pd.DataFrame:
        """Perform sentiment analysis on filtered reviews."""
        def get_sentiment_scores(text: str):
            scores = self.sentiment_model.polarity_scores(text)
            compound = scores['compound']
            sentiment = 'positive' if compound >= 0.05 else 'negative' if compound <= -0.05 else 'neutral'
            return pd.Series([compound, sentiment])

        reviews[['sentiment_score', 'sentiment']] = reviews['clean_review_text'].apply(get_sentiment_scores)
        return reviews

    def visualize_sentiments(self, reviews: pd.DataFrame, output_path: str = 'sentiment_analysis.png') -> None:
        """Visualize sentiment distribution."""
        try:
            sentiment_counts = reviews['sentiment'].value_counts(normalize=True) * 100
            sentiment_counts.plot(kind='bar', color=['green', 'orange', 'red'], figsize=(10, 6))
            plt.title('Sentiment Distribution for Detected Products')
            plt.ylabel('Percentage')
            plt.xlabel('Sentiment')
            plt.tight_layout()
            plt.savefig(output_path)
            logger.info(f"Visualization saved to {output_path}.")
        except Exception as e:
            logger.error(f"Error creating visualization: {str(e)}")
            raise

def main(image_path: str):
    analyzer = IntegratedAnalyzer(
        reviews_file='Dataset/amazon_vfl_reviews.csv',
        roboflow_api_key="VGissXjBwyUyl8hctJsS",
        project_name="s-mart",
        model_version=2
    )

    # Load reviews
    analyzer.load_reviews()
    analyzer.preprocess_reviews()

    # Detect products in the image
    detected_products = analyzer.detect_products(image_path)

    if not detected_products:
        logger.warning("No products detected in the image.")
        return

    # Filter reviews for detected products
    filtered_reviews = analyzer.filter_reviews(detected_products)

    if filtered_reviews.empty:
        logger.warning("No reviews found for detected products.")
        return

    # Analyze sentiment
    analyzed_reviews = analyzer.analyze_sentiment(filtered_reviews)

    # Display results
    for product in detected_products:
        product_reviews = analyzed_reviews[analyzed_reviews['name'].str.contains(product, case=False)]
        if not product_reviews.empty:
            print(f"\nProduct: {product}")
            sentiment_summary = product_reviews['sentiment'].value_counts(normalize=True) * 100
            for sentiment, percentage in sentiment_summary.items():
                print(f"{sentiment.title()}: {percentage:.1f}%")

    # Visualize sentiment distribution
    analyzer.visualize_sentiments(analyzed_reviews)

if __name__ == "__main__":
    main("Dataset/parleg.jpg")
