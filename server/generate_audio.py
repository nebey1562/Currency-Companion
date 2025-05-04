import os
from gtts import gTTS

AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'audio'))

if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)
    print(f'Created audio directory at {AUDIO_DIR}')

audio_content = {
    '/': 'Welcome to the Voice Authentication page. Press Spacebar to start the authentication process.',
    '/prompt': 'Do you want me to read the content on this page, including quick links, promotional banners, recent activity, and more?',
    '/home': 'Welcome to the MyBank home page. You can say account, transfer, balance, support, faq, or contact us to navigate. The page includes a hero section with an advertisement to protect your savings. The Insta Customer Services section offers quick actions like setting your debit card PIN, changing your address, transferring your account between branches, and updating your KYC digitally. The Latest Offers section highlights a personal loan with the best interest rates, an investment platform for stocks and mutual funds, attractive home loan offers, and a special savings account for home loan customers. The Ways to Bank section lists options like WhatsApp Banking, Mobile Banking, PayZapp, and Premier Banking. The High Networth Banking section offers exclusive Premier Banking services and personalized Wealth Management solutions. At the bottom, the footer includes Contact Us with a phone number and email, Quick Links to FAQ, Contact Us, and Support, Legal links for Privacy Policy and Terms of Service, and Follow Us links for social media. Check the quick links in the navbar for more options.',
    '/account': 'This is the Account Overview page. On the left, you have quick links to pay bills or apply for a loan. In the center, there is an account summary card and a recent transactions table. On the right, see a promotional banner and recent activity. The footer at the bottom includes Contact Us with a phone number and email, Quick Links to FAQ, Contact Us, and Support, Legal links for Privacy Policy and Terms of Service, and Follow Us links for social media. Say yes to hear more or go home to navigate.',
    '/transfer': 'This is the Transfer Funds page. On the left, you have quick links to other actions. In the center, there is a transfer details card with action buttons and instructions below. On the right, check out a promotional banner and recent activity. The footer at the bottom includes Contact Us with a phone number and email, Quick Links to FAQ, Contact Us, and Support, Legal links for Privacy Policy and Terms of Service, and Follow Us links for social media. Say yes to proceed with the transfer process.',
    '/balance': 'This is the Balance Inquiry page. On the left, you have quick links to additional services. In the center, there is a balance card with your account summary and a last transaction card below. On the right, view a promotional banner and recent activity. The footer at the bottom includes Contact Us with a phone number and email, Quick Links to FAQ, Contact Us, and Support, Legal links for Privacy Policy and Terms of Service, and Follow Us links for social media. Say yes to hear more or go home to navigate.',
    '/support': 'This is the Customer Support page. It includes contact information with a phone number and email, FAQ links to find answers to common questions, and support hours for Monday to Saturday. The footer at the bottom includes Contact Us with a phone number and email, Quick Links to FAQ, Contact Us, and Support, Legal links for Privacy Policy and Terms of Service, and Follow Us links for social media. Say go to faq or go to contact us to navigate, or go home to return to the main page. Say yes to hear more.',
    '/faq': 'This is the FAQ page, providing answers to common questions. The footer includes Contact Us, Quick Links, Legal, and Follow Us sections.',
    '/contact-us': 'This is the Contact Us page, with information to reach our support team. The footer includes Contact Us, Quick Links, Legal, and Follow Us sections.',
    '/privacy-policy': 'This is the Privacy Policy page, detailing how we protect your data. The footer includes Contact Us, Quick Links, Legal, and Follow Us sections.',
    '/terms-of-service': 'This is the Terms of Service page, outlining the usage terms for our services. The footer includes Contact Us, Quick Links, Legal, and Follow Us sections.',
    'Do you want to proceed with the transfer process using the transfer details card?': 'Do you want to proceed with the transfer process using the transfer details card? Please use the confirm transfer button in the center section.',
    'Please specify the transfer amount in the transfer details card.': 'Please specify the transfer amount in the transfer details card. Use the set amount button in the center section to confirm.',
    'Please provide the account number in the transfer details card.': 'Please provide the account number in the transfer details card. Use the set account button in the center section to proceed.',
    'Please say your user ID.': 'Please say your user ID.',
    'Please say your verification phrase.': 'Please say your verification phrase.',
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