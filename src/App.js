import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [scrapedData, setScrapedData] = useState('');


  const fetchAndSpeakData = async () => { 
    try {
      const response = await axios.get('http://localhost:5000/scrape');  //This is not working Kez can u look into it
      const { scrapedData } = response.data;
      setScrapedData(scrapedData);

      const utterance = new SpeechSynthesisUtterance(scrapedData);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error fetching scraped data:', error);
    }
  };

  useEffect(() => {
    if (isListening) {
      fetchAndSpeakData();
    }
  }, [isListening]);

  useEffect(() => {
    const lowerTranscript = transcript.toLowerCase();
    if (lowerTranscript.includes('account')) {
      navigate('/account');
      resetTranscript();
    } else if (lowerTranscript.includes('transfer')) {
      navigate('/transfer');
      resetTranscript();
    } else if (lowerTranscript.includes('balance')) {
      navigate('/balance');
      resetTranscript();
    }
  }, [transcript, navigate, resetTranscript]);

  const handleStartListening = () => {
    SpeechRecognition.startListening({ continuous: true });
    setIsListening(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-6">Welcome to Our Banking Website</h1>
      <p className="text-lg mb-4">
        Available commands: "account", "transfer", "balance".
      </p>
      {!isListening ? (
        <button
          onClick={handleStartListening}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-lg transition duration-200"
        >
          Activate Voice Navigation
        </button>
      ) : (
        <p className="text-green-600 text-lg font-medium mt-4">
          Microphone is active and listening for your commands...
        </p>
      )}
      {scrapedData && (
        <p className="mt-4 text-gray-700">
          <strong>Scraped Data:</strong> {scrapedData}
        </p>
      )}
    </div>
  );
};

const Account = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
    <h2 className="text-3xl font-semibold mb-4">Account Details</h2>
    <p className="text-gray-600">View your account information here.</p>
  </div>
);

const Transfer = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
    <h2 className="text-3xl font-semibold mb-4">Transfer Funds</h2>
    <p className="text-gray-600">Transfer money between accounts on this page.</p>
  </div>
);

const Balance = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
    <h2 className="text-3xl font-semibold mb-4">Balance Inquiry</h2>
    <p className="text-gray-600">Check your current balance here.</p>
  </div>
);

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<Account />} />
      <Route path="/transfer" element={<Transfer />} />
      <Route path="/balance" element={<Balance />} />
    </Routes>
  </Router>
);

export default App;
