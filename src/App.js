import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, NavDropdown, Container, Row, Col, Card } from 'react-bootstrap';
import './App.css';

// Voice Navigation Component
const VoiceBack = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript.toLowerCase().includes('go back')) {
      navigate(-1);
      resetTranscript();
    }
  }, [transcript, navigate, resetTranscript]);

  return null;
};

// Navbar Component
const CustomNavbar = () => (
  <Navbar bg="dark" variant="dark" expand="lg" style={{ height: '50px' }}>
    <Container>
      <Navbar.Brand href="/home">MyBank</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <NavDropdown title="Accounts" id="accounts-dropdown">
            <NavDropdown.Item>Savings Account</NavDropdown.Item>
            <NavDropdown.Item>Current Account</NavDropdown.Item>
          </NavDropdown>
          <NavDropdown title="Loans" id="loans-dropdown">
            <NavDropdown.Item>Home Loan</NavDropdown.Item>
            <NavDropdown.Item>Personal Loan</NavDropdown.Item>
          </NavDropdown>
          <Nav.Link href="/faq">FAQ</Nav.Link>
          <Nav.Link href="/contact-us">Contact Us</Nav.Link>
        </Nav>
        <Nav className="ms-auto">
          <NavDropdown title="Profile" id="profile-dropdown" align="end">
            <NavDropdown.Item>Settings</NavDropdown.Item>
            <NavDropdown.Item style={{ color: 'red' }}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

// TTS Player Component with Retry Logic
const TTSPlayer = () => {
  const location = useLocation();
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchAndPlayAudio = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const ttsResponse = await axios.get('http://localhost:5000/tts', {
            params: { text: location.pathname },
          });
          const audioUrl = ttsResponse.data.audioUrl;
          if (audioUrl && audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play().catch((err) => console.error("Audio playback error:", err));
          }
          break;
        } catch (error) {
          console.error(`TTS fetch error for ${location.pathname} (attempt ${i + 1}):`, error);
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
    fetchAndPlayAudio();
  }, [location.pathname]);

  return <audio ref={audioRef} autoPlay style={{ display: 'none' }} />;
};

// Hero Section with Spacebar Activation
const HeroSection = ({ handleStartListening, isListening }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log('Key pressed:', event.code); // Debug key press
      if (event.code === 'Space' && !isListening) {
        event.preventDefault();
        console.log('Spacebar detected, starting listening');
        handleStartListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('Cleaned up keydown listener in HeroSection');
    };
  }, [handleStartListening, isListening]);

  return (
    <header className="bg-primary text-white text-center py-5">
      <Container>
        <p>Voice Commands: "Account" | "Transfer" | "Balance" | "Go Back"</p>
        {!isListening ? (
          <button ref={buttonRef} className="btn btn-light mt-3" onClick={() => {
            console.log('Button clicked, starting listening');
            handleStartListening();
          }}>
            Activate Voice Navigation (Press Spacebar)
          </button>
        ) : (
          <p className="text-success">Listening... Say "Account", "Transfer", or "Balance"</p>
        )}
      </Container>
    </header>
  );
};

// Features Section
const Features = () => (
  <section className="container my-5">
    <h2 className="text-center mb-4">Our Services</h2>
    <Row className="text-center">
      <Col md={3}>
        <Card className="p-3 shadow"><h4>Online Banking</h4><p>Manage your accounts anytime, anywhere.</p></Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow"><h4>Secure Transactions</h4><p>Top-notch security for safe transactions.</p></Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow"><h4>Instant Loans</h4><p>Quick loan approvals with minimal paperwork.</p></Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow"><h4>Voice Navigation</h4><p>Navigate with voice commands.</p></Card>
      </Col>
    </Row>
  </section>
);

// Footer Component
const Footer = () => (
  <footer className="bg-dark text-white text-center py-3">
    <p>© 2025 MyBank. All Rights Reserved.</p>
    <p>
      <button className="btn btn-link text-light p-0" onClick={() => window.location.href = '/privacy-policy'}>Privacy Policy</button> |{' '}
      <button className="btn btn-link text-light p-0" onClick={() => window.location.href = '/terms-of-service'}>Terms of Service</button>
    </p>
  </footer>
);

// Voice Authentication Page
const VoiceAuth = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleVerify = useCallback(() => {
    setMessage('Verifying... Please wait.');
    setTimeout(() => {
      if (attempts === 0) {
        setMessage('Voice not recognized.');
        setAttempts(1);
      } else {
        setMessage('Welcome Eben!');
        console.log('Navigating to /home');
        navigate('/home');
      }
    }, 4000);
  }, [navigate, attempts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleVerify();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleVerify]);

  return (
    <div>
      <CustomNavbar />
      <TTSPlayer />
      <Container className="text-center my-5">
        <h1>Voice Authentication</h1>
        <p>Click Verify or press Spacebar to proceed.</p>
        <button className="btn btn-info m-2" onClick={handleVerify}>
          Verify (Spacebar)
        </button>
        {message && <p>{message}</p>}
      </Container>
      <Footer />
    </div>
  );
};

// Home Page
const Home = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript, listening } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);

  const handleStartListening = () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      console.error('Browser does not support speech recognition.');
      return;
    }
    SpeechRecognition.startListening({ continuous: true });
    setIsListening(true);
    console.log('Started listening for voice commands');
  };

  useEffect(() => {
    if (isListening && listening) {
      console.log('Current transcript:', transcript);
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.includes('account')) {
        console.log('Navigating to /account');
        navigate('/account');
        resetTranscript();
        setIsListening(false);
      } else if (lowerTranscript.includes('transfer')) {
        console.log('Navigating to /transfer');
        navigate('/transfer');
        resetTranscript();
        setIsListening(false);
      } else if (lowerTranscript.includes('balance')) {
        console.log('Navigating to /balance');
        navigate('/balance');
        resetTranscript();
        setIsListening(false);
      }
    }
  }, [transcript, navigate, resetTranscript, isListening, listening]);

  return (
    <div>
      <CustomNavbar />
      <TTSPlayer />
      <HeroSection handleStartListening={handleStartListening} isListening={isListening} />
      <Features />
      {isListening && <p>Transcript: {transcript}</p>}
      <Footer />
    </div>
  );
};

// Other Pages
const Account = () => (
  <>
    <CustomNavbar />
    <VoiceBack />
    <TTSPlayer />
    <h2 className="text-center my-4">Account Details</h2>
    <Footer />
  </>
);

const Transfer = () => (
  <>
    <CustomNavbar />
    <VoiceBack />
    <TTSPlayer />
    <h2 className="text-center my-4">Transfer Funds</h2>
    <Footer />
  </>
);

const Balance = () => {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    axios.get("https://currencycompanionbackend4-7j9lrghaz-binsus-projects.vercel.app/api/get-user?account_number=647834894")
      .then((response) => setBalance(response.data.account_balance))
      .catch((err) => console.error("Error fetching balance:", err));
  }, []);

  return (
    <>
      <CustomNavbar />
      <VoiceBack />
      <TTSPlayer />
      <Container className="text-center">
        <h2>Balance Inquiry</h2>
        <p><strong>Balance:</strong> {balance !== null ? balance : "Loading..."}</p>
      </Container>
      <Footer />
    </>
  );
};

// Main App Component
const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<VoiceAuth />} />
      <Route path="/home" element={<Home />} />
      <Route path="/account" element={<Account />} />
      <Route path="/transfer" element={<Transfer />} />
      <Route path="/balance" element={<Balance />} />
      <Route path="/faq" element={<div><CustomNavbar /><TTSPlayer /><h2 className="text-center my-4">FAQ</h2><Footer /></div>} />
      <Route path="/contact-us" element={<div><CustomNavbar /><TTSPlayer /><h2 className="text-center my-4">Contact Us</h2><Footer /></div>} />
      <Route path="/privacy-policy" element={<div><CustomNavbar /><TTSPlayer /><h2 className="text-center my-4">Privacy Policy</h2><Footer /></div>} />
      <Route path="/terms-of-service" element={<div><CustomNavbar /><TTSPlayer /><h2 className="text-center my-4">Terms of Service</h2><Footer /></div>} />
    </Routes>
  </Router>
);

export default App;