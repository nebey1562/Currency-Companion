import speech_recognition as sr
import pyttsx3
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify
from flask_cors import CORS
from threading import Thread

# Initialize speech recognition and text-to-speech engine
listener = sr.Recognizer()
engine = pyttsx3.init()
voices = engine.getProperty('voices')
engine.setProperty('voice', voices[0].id)

# Flask app setup
app = Flask(__name__)
CORS(app)  # To handle cross-origin requests from frontend

# Web scraping version of get_account_info
def get_account_info():
    url = 'https://localhost:5000/account-info'  # Replace with actual banking website URL
    headers = {'User-Agent': 'Mozilla/5.0'}

    session = requests.Session()
    login_url = 'https://localhost:5000/login'  # Replace with actual login URL
    login_payload = {'username': 'your_username', 'password': 'your_password'}  # Replace with actual credentials
    session.post(login_url, data=login_payload, headers=headers)

    response = session.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    account_number = soup.find('span', class_='account-number').text.strip()
    name = soup.find('span', class_='account-holder-name').text.strip()
    balance = soup.find('span', class_='balance-amount').text.strip()

    return {
        'account_number': account_number,
        'name': name,
        'balance': balance
    }

# Updated transfer_money function
def transfer_money(amount, to_account):
    url = 'https://localhost:5000/transfer'  # Replace with actual transfer URL
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    payload = {
        'amount': amount,
        'to_account': to_account,  # Modify based on site requirements
        'account_id': '123456'  # Add any other necessary fields
    }
    
    response = requests.post(url, data=payload, headers=headers)

    if response.status_code == 200:
        return {'success': True, 'new_balance': get_account_info()['balance']}
    else:
        return {'success': False, 'message': response.text}

# Flask route to fetch scraped account info
@app.route('/scraped-account-info', methods=['GET'])
def get_scraped_account_info():
    account_info = get_account_info()  # Call the scraping function
    return jsonify(account_info)

# Text-to-speech function
def talk(text):
    engine.say(text)
    engine.runAndWait()

# Speech-to-text function
def take_command():
    try:
        with sr.Microphone() as source:
            print('Listening...')
            voice = listener.listen(source)
            command = listener.recognize_google(voice)
            command = command.lower()
    except:
        command = ""
    return command

# Additional assistant functions for checking balance, transferring money, etc.
def check_balance():
    data = get_account_info()
    balance = data.get('balance', 'Unknown')
    talk(f'Your current balance is {balance} dollars.')

def navigate_to_account():
    data = get_account_info()
    account_number = data.get('account_number', 'Unknown')
    name = data.get('name', 'Unknown')
    balance = data.get('balance', 'Unknown')
    talk(f'Your account number is {account_number}. Your name is {name}. Your balance is {balance} dollars.')

def process_transfer():
    talk('How much would you like to transfer?')
    amount_command = take_command()
    talk('Please say the account number of the recipient.')
    to_account_command = take_command()
    
    try:
        amount = float(amount_command)
        response = transfer_money(amount, to_account_command)
        if response.get('success'):
            talk(f'Transfer of {amount} dollars to {to_account_command} was successful. Your new balance is {response.get("new_balance", "Unknown")} dollars.')
        else:
            talk(f'Transfer failed. Error: {response.get("message")}')
    except ValueError:
        talk('Invalid amount. Please try again.')

def go_home():
    talk('Returning to the home page.')

def run_banking_assistant():
    command = take_command()
    if 'account' in command:
        navigate_to_account()
    elif 'transfer' in command:
        process_transfer()
    elif 'balance' in command:
        check_balance()
    elif 'go back' in command:
        go_home()
    else:
        talk('Please say the command again.')

# Running the Flask app in a separate thread
def run_flask_app():
    app.run(debug=True, port=5000)

# Starting Flask app in a separate thread
thread = Thread(target=run_flask_app)
thread.daemon = True
thread.start()

# Running the banking assistant in the main thread
talk('Hi, I am your banking assistant. How can I assist you today?')
while True:
    run_banking_assistant()
