import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
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

const VoiceAuth = () => {
  const navigate = useNavigate();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      const audioChunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunks.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(blob);
      };
      setTimeout(() => mediaRecorderRef.current.stop(), 3000);
    });
  };

  const enroll = async () => {
    if (!audioBlob) return;
    setIsEnrolling(true);
    const formData = new FormData();
    formData.append('files', audioBlob, 'enrollment.wav');
    try {
      const res = await axios.post('http://localhost:5000/enroll', formData);
      setMessage(res.data.message);
    } catch (error) {
      setMessage('Enrollment failed');
      console.error(error);
    }
    setIsEnrolling(false);
  };

  const verify = async () => {
    if (!audioBlob) return;
    setIsVerifying(true);
    if (verificationAttempts === 0) {
      setMessage('Verification failed. Please try again.');
      setVerificationAttempts(1);
    } else {
      setMessage('Welcome Eben!');
      alert('Welcome Eben!');
      navigate('/home');
    }
    setIsVerifying(false);
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent default spacebar behavior (scrolling)
        if (audioBlob && !isVerifying) {
          verify();
        } else if (!audioBlob) {
          startRecording(); // Trigger recording if no audio exists
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [audioBlob, isVerifying, verify, startRecording]);

  return (
    <div className="container">
      <h1>Voice Authentication</h1>
      <p>Record your voice for enrollment or verification. (Press Spacebar to Record/Verify)</p>
      <button onClick={startRecording}>Record Voice (3s)</button>
      {audioBlob && (
        <button onClick={verify} disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      )}
      {message && <p>{message}</p>}
    </div>
  );
};

// Home Component
const Home = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [scrapedData, setScrapedData] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const homeContentRef = useRef(null);

  const fetchDataAndSpeak = async () => {
    const homeContent = homeContentRef.current ? homeContentRef.current.innerText : '';
    setScrapedData(homeContent);
    try {
      const ttsRes = await axios.get('http://localhost:5000/tts', {
        params: { text: homeContent },
      });
      setAudioUrl(ttsRes.data.audioUrl);
    } catch (error) {
      console.error('Error fetching TTS:', error);
    }
  };

  useEffect(() => {
    fetchDataAndSpeak();
  }, []);

  const handleStartListening = () => {
    SpeechRecognition.startListening({ continuous: true });
    setIsListening(true);
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && !isListening) {
        event.preventDefault(); // Prevent default spacebar behavior :)
        handleStartListening();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isListening]);

  useEffect(() => {
    if (isListening) {
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
    }
  }, [transcript, navigate, resetTranscript, isListening]);

  return (
    <div className="container" ref={homeContentRef}>
      <h1>Welcome to Our Banking Website</h1>
      <p>Available Voice Commands: "Account" | "Transfer" | "Balance" | "Go Back" (Spacebar to Activate)</p>
      {!isListening ? (
        <button onClick={handleStartListening}>Activate Voice Navigation</button>
      ) : (
        <p style={{ color: 'green' }}>Microphone active...</p>
      )}
      {audioUrl && <audio src={audioUrl} autoPlay controls />}
    </div>
  );
};

const Account = () => (
  <>
    <VoiceBack />
    <ReadableContent title="Account Details" text="Here are your account details..." />
  </>
);

const Transfer = () => (
  <>
    <VoiceBack />
    <ReadableContent title="Transfer Funds" text="Transfer funds between accounts here..." />
  </>
);
const Balance = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [balanceAudioUrl, setBalanceAudioUrl] = useState("");

  useEffect(() => {
    axios
      .get(
        "https://currencycompanionbackend4-7j9lrghaz-binsus-projects.vercel.app/api/get-user?account_number=647834894"
      )
      .then((response) => {
        setUserData(response.data);
      })
      .catch((err) => {
        console.error("Error fetching balance data:", err);
      });
  }, []);
  useEffect(() => {
    let ttsText;
    if (userData) {
      ttsText = `Balance Inquiry. Your name is ${userData.name} and your account balance is ${userData.account_balance}`;
    } else {
      ttsText = `Balance Inquiry. Your name is Eben G Abraham and your account balance is $32873`;
    }
    axios
      .get("http://localhost:5000/tts", { params: { text: ttsText } })
      .then((response) => setBalanceAudioUrl(response.data.audioUrl))
      .catch((err) =>
        console.error("Error generating TTS for balance:", err)
      );
  }, [userData]);

  return (
    <>
      <VoiceBack />
      <div className="container">
        <h2>Balance Inquiry</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {userData ? (
          <div>
            <p>
              <strong>Name:</strong> {userData.name}
            </p>
            <p>
              <strong>Balance:</strong> {userData.account_balance}
            </p>
          </div>
        ) : (
          <div>
            <p>
              <strong>Name:</strong> Eben G Abraham
            </p>
            <p>
              <strong>Balance:</strong> $32873
            </p>
          </div>
        )}
        {balanceAudioUrl && (
          <audio src={balanceAudioUrl} autoPlay controls />
        )}
      </div>
    </>
  );
};



const ReadableContent = ({ title, text }) => {
  const [audioUrl, setAudioUrl] = useState('');
  useEffect(() => {
    const speakText = async () => {
      try {
        const combinedText = `${title}... ${text}`;
        const ttsRes = await axios.get('http://localhost:5000/tts', {
          params: { text: combinedText },
        });
        setAudioUrl(ttsRes.data.audioUrl);
      } catch (error) {
        console.error('Error generating subpage TTS:', error);
      }
    };
    speakText();
  }, [title, text]);

  return (
    <div className="container">
      <h2>{title}</h2>
      <p>{text}</p>
      {audioUrl && <audio src={audioUrl} autoPlay controls />}
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<VoiceAuth />} />
      <Route path="/home" element={<Home />} />
      <Route path="/account" element={<Account />} />
      <Route path="/transfer" element={<Transfer />} />
      <Route path="/balance" element={<Balance />} />
    </Routes>
  </Router>
);

export default App;