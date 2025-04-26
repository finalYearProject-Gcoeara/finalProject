from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/receive_images', methods=['POST'])
def receive_images():
    data = request.json
    print("Received images and specs:", data)
    return jsonify({"status": "Images received successfully"})

@app.route('/receive_reviews', methods=['POST'])
def receive_reviews():
    data = request.json
    print("Received reviews:", data)
    return jsonify({"status": "Reviews received successfully"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
