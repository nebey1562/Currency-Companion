from gtts import gTTS
import os

pages = {
    "/": "MyBank Accounts Loans FAQ Contact Us Profile Voice Authentication Click Verify or press Spacebar to proceed. © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/home": "MyBank Accounts Loans FAQ Contact Us Profile Voice Commands: Account Transfer Balance Go Back Our Services Online Banking Manage your accounts anytime anywhere. Secure Transactions Top-notch security for safe transactions. Instant Loans Quick loan approvals with minimal paperwork. Voice Navigation Navigate with voice commands. © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/account": "MyBank Accounts Loans FAQ Contact Us Profile Account Details © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/transfer": "MyBank Accounts Loans FAQ Contact Us Profile Transfer Funds © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/balance": "MyBank Accounts Loans FAQ Contact Us Profile Balance Inquiry © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/faq": "MyBank Accounts Loans FAQ Contact Us Profile FAQ © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/contact-us": "MyBank Accounts Loans FAQ Contact Us Profile Contact Us © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/privacy-policy": "MyBank Accounts Loans FAQ Contact Us Profile Privacy Policy © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service",
    "/terms-of-service": "MyBank Accounts Loans FAQ Contact Us Profile Terms of Service © 2025 MyBank. All Rights Reserved. Privacy Policy Terms of Service"
}

os.makedirs("../audio", exist_ok=True)

for path, text in pages.items():
    tts = gTTS(text, lang="en")
    filename = f"audio{path.replace('/', '_') or '_root'}.mp3"
    tts.save(f"../audio/{filename}")
    print(f"Saved ../audio/{filename}")