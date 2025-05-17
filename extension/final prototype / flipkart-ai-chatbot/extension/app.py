from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
 


app = Flask(__name__, template_folder='templates')
CORS(app)
# Global variables to store the data
product_info = {}
reviews = []
images = {}

# Ensure 'specifications' and 'images' keys exist in product_info before rendering the template
@app.route('/')
def index():
    merged_product_info = product_info.copy()
    merged_product_info['images'] = images if images else {'thumbnails': []}  # Ensure 'images' key exists
    if 'specifications' not in merged_product_info:
        merged_product_info['specifications'] = {}
    return render_template('index.html', product_info=merged_product_info, reviews=reviews)

@app.route('/receive_data', methods=['POST'])
def receive_data():
    global product_info, reviews
    data = request.get_json()
    print("Received product/reviews data:", data)
    # Revert to original logic for product_info
    product_info = data.get('product_info', {})
    # Ensure 'specifications' key exists in product_info
    if 'specifications' not in product_info:
        product_info['specifications'] = {}
    reviews = data.get('reviews', [])
    print("Product Info:", product_info)
    print("Images:", images)
    return jsonify({"message": "Data received successfully!"})

@app.route('/receive_images', methods=['POST'])
def receive_images():
    global images
    data = request.get_json()
    print("Received images data:", data)
    images = data.get('images', {})
    return jsonify({"message": "Images received successfully!"})

@app.route('/retrieve_data', methods=['GET'])
def retrieve_data():
    return jsonify({
        "product_info": product_info,
        "reviews": reviews,
        "images": images
    })

if __name__ == '__main__':
    app.run(debug=True)
