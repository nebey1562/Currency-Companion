from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import requests
from bs4 import BeautifulSoup
from gtts import gTTS
import os
import uuid
import numpy as np
import torch
import torch.nn.functional as F
import torchaudio
import soundfile as sf

app = Flask(__name__)
CORS(app)

# Directories
AUDIO_DIR = "audio"
UPLOAD_FOLDER = "uploads"  # We'll create this dynamically
for directory in [AUDIO_DIR, UPLOAD_FOLDER]:
    if not os.path.exists(directory):
        os.makedirs(directory)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
BASE_URL = "http://localhost:3000"

# Speaker Verification Model
class SpeakerVerificationModel(torch.nn.Module):
    def __init__(self, embed_dim=128):
        super(SpeakerVerificationModel, self).__init__()
        self.conv1 = torch.nn.Conv2d(1, 16, kernel_size=3, stride=1, padding=1)
        self.conv2 = torch.nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=1)
        self.pool = torch.nn.MaxPool2d(2)
        self.conv3 = torch.nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.global_pool = torch.nn.AdaptiveAvgPool2d((1, 1))
        self.fc = torch.nn.Linear(64, embed_dim)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = self.pool(x)
        x = F.relu(self.conv2(x))
        x = self.pool(x)
        x = F.relu(self.conv3(x))
        x = self.global_pool(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        x = F.normalize(x, p=2, dim=1)
        return x

# Load the model
model = SpeakerVerificationModel()
model.load_state_dict(torch.load('../siamese_speaker_model.pth', map_location=torch.device('cpu')))
model.eval()

# Helper functions for voice authentication
def load_mel_spec(file_path, sr=16000, n_mels=40):
    try:
        # Try loading with torchaudio first to bypass soundfile issues
        waveform, orig_sr = torchaudio.load(file_path)
        if orig_sr != sr:
            waveform = torchaudio.functional.resample(waveform, orig_sr, sr)
        mel_transform = torchaudio.transforms.MelSpectrogram(sample_rate=sr, n_mels=n_mels)
        to_db = torchaudio.transforms.AmplitudeToDB()
        mel_spec = to_db(mel_transform(waveform))
        # Ensure proper shape (add channel dimension if needed)
        if mel_spec.dim() == 2:
            mel_spec = mel_spec.unsqueeze(0)  # Add channel dimension
        return mel_spec
    except Exception as e:
        raise Exception(f"Failed to load mel spectrogram from {file_path}: {str(e)}")

def enroll_speaker(file_paths):
    embeddings = []
    for fp in file_paths:
        try:
            mel_spec = load_mel_spec(fp).unsqueeze(0)  # Add batch dimension
            with torch.no_grad():
                emb = model(mel_spec)
            embeddings.append(emb.cpu().numpy())
        except Exception as e:
            raise Exception(f"Error processing file {fp}: {str(e)}")
    if not embeddings:
        raise Exception("No valid embeddings generated")
    avg_emb = np.mean(embeddings, axis=0)
    return torch.from_numpy(avg_emb).float()

def verify_speaker(enrolled_embedding, test_wav, threshold=0.7):
    try:
        mel_spec = load_mel_spec(test_wav).unsqueeze(0)
        with torch.no_grad():
            test_emb = model(mel_spec)
        test_emb = F.normalize(test_emb, p=2, dim=1)
        dist = torch.norm(test_emb - enrolled_embedding, p=2).item()
        return "ACCEPT" if dist < threshold else "REJECT", dist
    except Exception as e:
        raise Exception(f"Verification failed for {test_wav}: {str(e)}")

# Global variable for enrolled embedding (simplified; use a DB in production)
enrolled_embedding = None

# Existing Endpoints
@app.route('/scrape', methods=['GET'])
def scrape():
    try:
        response = requests.get(BASE_URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        content = []
        for tag in soup.find_all(['h1', 'h2', 'p']):
            text = tag.get_text(strip=True)
            if text:
                content.append(text)
        scraped_data = " ".join(content)
        return jsonify({"scrapedData": scraped_data})
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to scrape: {str(e)}"}), 500

@app.route('/tts', methods=['GET'])
def text_to_speech():
    try:
        text = request.args.get('text', '')
        if not text:
            return jsonify({"error": "No text provided"}), 400
        audio_filename = f"{uuid.uuid4()}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(audio_path)
        audio_url = f"http://localhost:5000/audio/{audio_filename}"
        return jsonify({"audioUrl": audio_url})
    except Exception as e:
        return jsonify({"error": f"TTS generation failed: {str(e)}"}), 500

@app.route('/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    audio_path = os.path.join(AUDIO_DIR, filename)
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype='audio/mpeg')
    else:
        return "File not found", 404

# New Voice Authentication Endpoints
@app.route('/enroll', methods=['POST'])
def enroll():
    global enrolled_embedding
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    files = request.files.getlist('files')
    file_paths = []
    for file in files:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        file_paths.append(file_path)
    try:
        enrolled_embedding = enroll_speaker(file_paths)
        for file_path in file_paths:
            os.remove(file_path)
        return jsonify({'message': 'Enrollment successful'})
    except Exception as e:
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)
        return jsonify({'error': str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    global enrolled_embedding
    if enrolled_embedding is None:
        return jsonify({'error': 'No enrolled speaker found'}), 400
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    try:
        result, distance = verify_speaker(enrolled_embedding, file_path)
        os.remove(file_path)
        return jsonify({'result': result, 'distance': distance})
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)