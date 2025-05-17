from flask import Flask, request, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Global variables to store the data
product_info = {}
reviews = []
images = {}

@app.route('/')
def index():
    # Debug log to confirm data passed to the template
    print("Debug: Passing images data to template:", images)
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
    images = data.get('images', {})
    print("Debug: Received images data:", images)  # Debug log
    return jsonify({"message": "Images received successfully!"})

@app.route('/retrieve_data', methods=['GET'])
def retrieve_data():
    return jsonify({
        "product_info": product_info,
        "reviews": reviews,
        "images": images
    })

@app.after_request
def add_header(response):
    # Disable caching for all responses, including static files
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "-1"
    return response

if __name__ == '__main__':
    app.run(port=5000, debug=True)
