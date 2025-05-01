import os
from gtts import gTTS

# Directory to store audio files
AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audio'))

# Ensure audio directory exists
if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)
    print(f'Created audio directory at {AUDIO_DIR}')

# Audio content mapping
audio_content = {
    '/': 'Welcome to the Voice Authentication page. Please say your verification phrase or press Spacebar to proceed.',
    '/prompt': 'Do you want me to read the content on this page?',
    '/home': 'Welcome to the MyBank home page. You can say account, transfer, balance, or go home to navigate.',
    '/account': 'This is the Account Details page, showing your account information and recent transactions.',
    '/transfer': 'This is the Transfer Funds page. Follow the prompts to transfer money.',
    '/balance': 'This is the Balance Inquiry page, showing your current account balance and last transaction.',
    '/faq': 'This is the FAQ page, providing answers to common questions.',
    '/contact-us': 'This is the Contact Us page, with information to reach our support team.',
    '/privacy-policy': 'This is the Privacy Policy page, detailing how we protect your data.',
    '/terms-of-service': 'This is the Terms of Service page, outlining the usage terms for our services.',
    'Do you want to transfer funds?': 'Do you want to transfer funds?',
    'Please say the amount to transfer.': 'Please say the amount to transfer.',
    'Please say the account number.': 'Please say the account number.',
}

# Generate audio files
for text, content in audio_content.items():
    # Generate filename based on text
    if text == '/':
        filename = 'audio_root.mp3'
    elif text == '/prompt':
        filename = 'audio_prompt.mp3'
    elif text.startswith('/'):
        filename = f'audio_{text[1:]}.mp3'
    else:
        # Sanitize text for filename
        sanitized = text.lower().replace(' ', '_').replace('?', '').replace('.', '')
        filename = f'audio_{sanitized}.mp3'

    file_path = os.path.join(AUDIO_DIR, filename)
    
    if os.path.exists(file_path):
        print(f'Skipping {file_path}, already exists')
        continue
    
    print(f'Saving {file_path}')
    tts = gTTS(text=content, lang='en')
    tts.save(file_path)