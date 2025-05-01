import os
from gtts import gTTS

AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audio'))

if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)
    print(f'Created audio directory at {AUDIO_DIR}')

audio_content = {
    '/': 'Welcome to the Voice Authentication page. Please say your verification phrase or press Spacebar to proceed.',
    '/prompt': 'Do you want me to read the content on this page, including quick links, promotional banners, and recent activity?',
    '/home': 'Welcome to the MyBank home page. You can say account, transfer, balance, or go home to navigate through our featured services. Check the quick links on the left for more options.',
    '/account': 'This is the Account Overview page. On the left, you have quick links to pay bills or apply for a loan. In the center, there is an account summary card and a recent transactions table. On the right, see a promotional banner and recent activity. Say yes to hear more or go home to navigate.',
    '/transfer': 'This is the Transfer Funds page. On the left, you have quick links to other actions. In the center, there is a transfer details card with action buttons and instructions below. On the right, check out a promotional banner and recent activity. Say yes to proceed with the transfer process.',
    '/balance': 'This is the Balance Inquiry page. On the left, you have quick links to additional services. In the center, there is a balance card with your account summary and a last transaction card below. On the right, view a promotional banner and recent activity. Say yes to hear more or go home to navigate.',
    '/support': 'This is the Customer Support page, with contact information and FAQ links.',
    '/faq': 'This is the FAQ page, providing answers to common questions.',
    '/contact-us': 'This is the Contact Us page, with information to reach our support team.',
    '/privacy-policy': 'This is the Privacy Policy page, detailing how we protect your data.',
    '/terms-of-service': 'This is the Terms of Service page, outlining the usage terms for our services.',
    'Do you want to proceed with the transfer process using the transfer details card?': 'Do you want to proceed with the transfer process using the transfer details card? Please use the confirm transfer button in the center section.',
    'Please specify the transfer amount in the transfer details card.': 'Please specify the transfer amount in the transfer details card. Use the set amount button in the center section to confirm.',
    'Please provide the account number in the transfer details card.': 'Please provide the account number in the transfer details card. Use the set account button in the center section to proceed.',
}

for text, content in audio_content.items():
    if text == '/':
        filename = 'audio_root.mp3'
    elif text == '/prompt':
        filename = 'audio_prompt.mp3'
    elif text.startswith('/'):
        filename = f'audio_{text[1:]}.mp3'
    else:
        sanitized = text.lower().replace(' ', '_').replace('?', '').replace('.', '')
        filename = f'audio_{sanitized}.mp3'

    file_path = os.path.join(AUDIO_DIR, filename)
    
    if os.path.exists(file_path):
        print(f'Skipping {file_path}, already exists')
        continue
    
    print(f'Saving {file_path}')
    tts = gTTS(text=content, lang='en')
    tts.save(file_path)