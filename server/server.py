from flask import Flask, send_file, request
from flask_cors import CORS
import os
from gtts import gTTS
import hashlib

app = Flask(__name__)
CORS(app)

# Absolute path to audio directory
AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audio'))

# Validate audio directory
if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)
    print(f'Server: Created audio directory at {AUDIO_DIR}')
else:
    print(f'Server: Audio directory exists at {AUDIO_DIR}')

@app.route('/audio/<filename>')
def serve_audio(filename):
    file_path = os.path.join(AUDIO_DIR, filename)
    print(f'Server: Serving audio file {file_path}, exists: {os.path.exists(file_path)}')
    if os.path.exists(file_path):
        return send_file(file_path)
    return {'error': 'File not found'}, 404

@app.route('/tts', methods=['GET'])
def tts():
    text = request.args.get('text')
    if not text:
        return {'error': 'No text provided'}, 400

    print(f'Server: Received text: "{text}"')

    # Map specific text to pre-generated audio files
    audio_mapping = {
        '/': 'audio_root.mp3',
        '/prompt': 'audio_prompt.mp3',
        '/home': 'audio_home.mp3',
        '/account': 'audio_account.mp3',
        '/transfer': 'audio_transfer.mp3',
        '/balance': 'audio_balance.mp3',
        '/faq': 'audio_faq.mp3',
        '/contact-us': 'audio_contact-us.mp3',
        '/privacy-policy': 'audio_privacy-policy.mp3',
        '/terms-of-service': 'audio_terms-of-service.mp3',
        'Do you want to transfer funds?': 'audio_transfer_confirm.mp3',
        'Please say the amount to transfer.': 'audio_transfer_amount.mp3',
        'Please say the account number.': 'audio_transfer_account.mp3',
    }

    # Check if pre-generated audio exists
    filename = audio_mapping.get(text)
    if filename:
        file_path = os.path.join(AUDIO_DIR, filename)
        print(f'Server: Checking file {file_path} for text "{text}", exists: {os.path.exists(file_path)}')
        if os.path.exists(file_path):
            print(f'Server: Returning pre-generated audio URL for "{text}": http://localhost:5000/audio/{filename}')
            return {'audioUrl': f'http://localhost:5000/audio/{filename}'}
        else:
            print(f'Server: Warning: Expected file {file_path} for text "{text}" does not exist, generating dynamically')

    # Generate audio dynamically for unmapped or missing files
    try:
        text_hash = hashlib.md5(text.encode()).hexdigest()
        filename = f'audio_{text_hash}.mp3'
        file_path = os.path.join(AUDIO_DIR, filename)

        if not os.path.exists(file_path):
            print(f'Server: Generating audio for "{text}" at {file_path}')
            tts = gTTS(text=text, lang='en')
            tts.save(file_path)
        else:
            print(f'Server: Using cached audio for "{text}" at {file_path}')

        print(f'Server: Returning dynamic audio URL for "{text}": http://localhost:5000/audio/{filename}')
        return {'audioUrl': f'http://localhost:5000/audio/{filename}'}
    except Exception as e:
        print(f'Server: Error generating audio for "{text}": {str(e)}')
        return {'error': 'Failed to generate audio'}, 500

if __name__ == '__main__':
    print(f'Server: Starting with AUDIO_DIR={AUDIO_DIR}')
    audio_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith('.mp3')]
    print(f'Server: Audio files found in {AUDIO_DIR}: {audio_files}')
    app.run(debug=True)