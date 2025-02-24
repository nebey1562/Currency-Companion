import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

const VoiceBack = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    const lowerTranscript = transcript.toLowerCase();
    if (lowerTranscript.includes('go back')) {
      navigate(-1);
      resetTranscript();
    }
  }, [transcript, navigate, resetTranscript]);

  return null;
};

const Home = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [scrapedData, setScrapedData] = useState('');

  const fetchAndSpeakData = async () => { 
    try {
      const response = await axios.get('http://localhost:5000/scrape');  
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
    <>
      <h1 className="header">Welcome to Our Banking Website</h1>
      <div className="container">
        <p>Available Commands: Account | Transfer | Balance | Go Back</p>
        
        {!isListening ? (
          <button onClick={handleStartListening}>Activate Voice Navigation</button>
        ) : (
          <p className="mic-status">Microphone is active and listening for your commands...</p>
        )}
        
        {scrapedData && <p className="scraped-data">Scraped Data: {scrapedData}</p>}
      </div>
    </>
  );
}  

const Account = () => (
  <>
    <VoiceBack />
    <div className="container">
      <h2>Account Details</h2>
      <p>View your account information here.</p>
    </div>
  </>
);

const Transfer = () => (
  <>
    <VoiceBack />
    <div className="container">
      <h2>Transfer Funds</h2>
      <p>Transfer money between accounts on this page.</p>
    </div>
  </>
);

const Balance = () => (
  <>
    <VoiceBack />
    <div className="container">
      <h2>Balance Inquiry</h2>
      <p>Check your current balance here.</p>
    </div>
  </>
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
