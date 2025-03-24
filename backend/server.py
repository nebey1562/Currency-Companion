from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from gtts import gTTS
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import os
import uuid
import numpy as np
import torch
import torch.nn.functional as F
import torchaudio
import soundfile as sf
import logging
import requests  # For pre-checking the URL

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Directories
AUDIO_DIR = "audio"
UPLOAD_FOLDER = "uploads"
for directory in [AUDIO_DIR, UPLOAD_FOLDER]:
    if not os.path.exists(directory):
        os.makedirs(directory)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Speaker Verification Model (unchanged)
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

model = SpeakerVerificationModel()
model.load_state_dict(torch.load('../siamese_speaker_model.pth', map_location=torch.device('cpu'), weights_only=True))
model.eval()

# Helper functions for voice authentication (unchanged)
def load_mel_spec(file_path, sr=16000, n_mels=40):
    try:
        waveform, orig_sr = torchaudio.load(file_path)
        if orig_sr != sr:
            waveform = torchaudio.functional.resample(waveform, orig_sr, sr)
        mel_transform = torchaudio.transforms.MelSpectrogram(sample_rate=sr, n_mels=n_mels)
        to_db = torchaudio.transforms.AmplitudeToDB()
        mel_spec = to_db(mel_transform(waveform))
        if mel_spec.dim() == 2:
            mel_spec = mel_spec.unsqueeze(0)
        return mel_spec
    except Exception as e:
        raise Exception(f"Failed to load mel spectrogram from {file_path}: {str(e)}")

def enroll_speaker(file_paths):
    embeddings = []
    for fp in file_paths:
        try:
            mel_spec = load_mel_spec(fp).unsqueeze(0)
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

enrolled_embedding = None

# Updated Scrape Endpoint
@app.route('/scrape', methods=['GET'])
def scrape():
    path = request.args.get('path', '')
    url = f"http://localhost:3000{path}"
    
    # Pre-check if the URL is accessible
    try:
        response = requests.get(url, timeout=5)  # Quick 5-second check
        if response.status_code != 200:
            logger.warning(f"Frontend not ready at {url}: Status {response.status_code}")
            return jsonify({"scrapedData": "Frontend not ready yet, please wait"}), 503
    except requests.RequestException as e:
        logger.error(f"Pre-check failed for {url}: {str(e)}")
        return jsonify({"scrapedData": "Frontend not accessible, please ensure it’s running"}), 503

    # Attempt scraping with Playwright
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--disable-gpu', '--no-sandbox'])  # Optimize for stability
            page = browser.new_page()
            page.goto(url, timeout=30000)  # Reduced timeout to 30s to avoid hanging
            page.wait_for_load_state('domcontentloaded', timeout=30000)  # Wait for DOM, not full network
            content = page.evaluate('''() => {
                const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, a');
                return Array.from(elements).map(el => el.innerText.trim()).filter(text => text).join(' ');
            }''')
            browser.close()
        logger.debug(f"Scraped content from {url}: {content[:200]}...")
        if not content.strip():
            logger.warning(f"No content scraped from {url}")
            return jsonify({"scrapedData": "No content available on this page"})
        return jsonify({"scrapedData": content})
    except PlaywrightTimeoutError as e:
        logger.error(f"Timeout scraping {url}: {str(e)}")
        return jsonify({"scrapedData": "Page took too long to load, try again later"}), 504
    except Exception as e:
        logger.error(f"Failed to scrape {url}: {str(e)}")
        return jsonify({"error": f"Failed to scrape {url}: {str(e)}"}), 500

@app.route('/tts', methods=['GET'])
def text_to_speech():
    try:
        text = request.args.get('text', '')
        logger.debug(f"Received text for TTS: {text[:200]}...")
        if not text:
            logger.warning("No text provided for TTS")
            return jsonify({"error": "No text provided"}), 400
        audio_filename = f"{uuid.uuid4()}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(audio_path)
        audio_url = f"http://localhost:5000/audio/{audio_filename}"
        logger.debug(f"Generated audio URL: {audio_url}")
        return jsonify({"audioUrl": audio_url})
    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        return jsonify({"error": f"TTS generation failed: {str(e)}"}), 500

@app.route('/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    audio_path = os.path.join(AUDIO_DIR, filename)
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype='audio/mpeg')
    else:
        logger.error(f"Audio file not found: {audio_path}")
        return "File not found", 404

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
        logger.debug("Speaker enrolled successfully")
        return jsonify({'message': 'Enrollment successful'})
    except Exception as e:
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)
        logger.error(f"Enrollment failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    global enrolled_embedding
    if enrolled_embedding is None:
        logger.warning("No enrolled speaker found")
        return jsonify({'error': 'No enrolled speaker found'}), 400
    if 'file' not in request.files:
        logger.warning("No file provided for verification")
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    try:
        result, distance = verify_speaker(enrolled_embedding, file_path)
        os.remove(file_path)
        logger.debug(f"Verification result: {result}, distance: {distance}")
        return jsonify({'result': result, 'distance': distance})
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Verification failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=False)