import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [accountInfo, setAccountInfo] = useState({});
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Updated fetchAccountInfo to point to the scraped account info endpoint
  const fetchAccountInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/scraped-account-info'); // Updated endpoint
      setAccountInfo(response.data);
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const startListening = () => {
    setIsListening(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = async (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setMessage(`You said: "${command}"`);
      
      if (command.includes('account')) {
        speak(`Your account number is ${accountInfo.account_number}. Your name is ${accountInfo.name}. Your balance is ${accountInfo.balance} dollars.`);
      } else if (command.includes('balance')) {
        speak(`Your current balance is ${accountInfo.balance} dollars.`);
      } else if (command.includes('transfer')) {
        speak('How much would you like to transfer?');
        // Handle money transfer logic here
      } else {
        speak('Sorry, I did not understand. Please try again.');
      }
      setIsListening(false);
    };
  };

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  };

  return (
    <div className="App">
      <h1>Voice Banking Assistant</h1>
      <p>{message}</p>
      <button onClick={startListening} disabled={isListening}>
        {isListening ? 'Listening...' : 'Start Listening'}
      </button>
    </div>
  );
};

export default App;
