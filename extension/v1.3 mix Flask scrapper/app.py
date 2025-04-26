from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
 


app = Flask(__name__)
CORS(app)
# Global variables to store the data
product_info = {}
reviews = []
images = {}

@app.route('/')
def index():
    return render_template('index.html', product_info=product_info, reviews=reviews, images=images)

@app.route('/receive_data', methods=['POST'])
def receive_data():
    global product_info, reviews
    data = request.get_json()
    print("Received product/reviews data:", data)
    product_info = data.get('product_info', {})
    reviews = data.get('reviews', [])
    return jsonify({"message": "Data received successfully!"})

@app.route('/receive_images', methods=['POST'])
def receive_images():
    global images
    data = request.get_json()
    print("Received images data:", data)
    images = data.get('images', {})
    return jsonify({"message": "Images received successfully!"})

if __name__ == '__main__':
    app.run(debug=True)
