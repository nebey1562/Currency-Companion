from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS  # Add this
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simulated user database for enroll/verify
users = {}

@app.route('/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory('../audio', filename, mimetype='audio/mpeg')

@app.route('/scrape')
def scrape():
    path = request.args.get('path', '/')
    filename = f"audio{path.replace('/', '_') or '_root'}.mp3"
    if os.path.exists(f"../audio/{filename}"):
        return jsonify({"scrapedData": f"Pre-generated content for {path}"})
    return jsonify({"scrapedData": "Content not available"}), 404

@app.route('/tts')
def tts():
    path = request.args.get('text', '/').split()[0]
    filename = f"audio{path.replace('/', '_') or '_root'}.mp3"
    if os.path.exists(f"../audio/{filename}"):
        return jsonify({"audioUrl": f"http://localhost:5000/audio/{filename}"})
    return jsonify({"audioUrl": ""}), 404

@app.route('/enroll', methods=['POST'])
def enroll():
    data = request.get_json()
    user_id = data.get('userId')
    voice_sample = data.get('voiceSample')
    if not user_id or not voice_sample:
        return jsonify({"error": "Missing userId or voiceSample"}), 400
    users[user_id] = {"voiceSample": voice_sample, "enrolled": True}
    return jsonify({"message": f"User {user_id} enrolled successfully"}), 200

@app.route('/verify', methods=['POST'])
def verify():
    data = request.get_json()
    user_id = data.get('userId')
    voice_sample = data.get('voiceSample')
    if not user_id or not voice_sample:
        return jsonify({"error": "Missing userId or voiceSample"}), 400
    if user_id in users and users[user_id]["voiceSample"] == voice_sample:
        return jsonify({"message": "Verification successful", "verified": True}), 200
    return jsonify({"message": "Verification failed", "verified": False}), 403

if __name__ == '__main__':
    from waitress import serve
    print("Starting server on http://localhost:5000...")
    try:
        serve(app, host="127.0.0.1", port=5000)
    except Exception as e:
        print(f"Server failed to start: {e}")