import React, { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, NavDropdown, Container, Row, Col, Card, Button, Table, ListGroup, Form, FormControl, Spinner } from 'react-bootstrap';
import './App.css';
import heroAdImage from './assests/hero_ad.jpg';
import header from './assests/promo_banner.jpg'

const PROMO_BANNER = 'https://picsum.photos/600/200';
const ACCOUNT_HEADER = header;
const TRANSFER_HEADER = header;
const BALANCE_HEADER = header;
const HERO_AD = heroAdImage; 
const BalanceContext = createContext();

const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

const VoiceBack = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    const lowerTranscript = transcript.toLowerCase();
    if (lowerTranscript.includes('go back') || lowerTranscript.includes('go home') || lowerTranscript.includes('go to home')) {
      console.log('VoiceBack: Navigating to /home');
      navigate('/home');
      resetTranscript();
    }
  }, [transcript, navigate, resetTranscript]);

  return null;
};

const CustomNavbar = () => (
  <Navbar bg="dark" variant="dark" expand="lg" style={{ height: '60px' }}>
    <Container fluid>
      <Navbar.Brand href="/home">MyBank</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto" style={{ fontSize: '14px' }}>
          <Nav.Link href="/home" className="d-flex align-items-center mx-2">
            <i className="fas fa-home me-1"></i> Home
          </Nav.Link>
          <Nav.Link href="/account" className="d-flex align-items-center mx-2">
            <i className="fas fa-user me-1"></i> Account
          </Nav.Link>
          <Nav.Link href="/transfer" className="d-flex align-items-center mx-2">
            <i className="fas fa-exchange-alt me-1"></i> Transfer
          </Nav.Link>
          <Nav.Link href="/balance" className="d-flex align-items-center mx-2">
            <i className="fas fa-wallet me-1"></i> Balance
          </Nav.Link>
          <NavDropdown
            title={
              <span className="d-flex align-items-center">
                <i className="fas fa-chart-line me-1"></i> Investments
              </span>
            }
            id="investments-dropdown"
            className="mx-2"
          >
            <NavDropdown.Item>Mutual Funds</NavDropdown.Item>
            <NavDropdown.Item>Stocks</NavDropdown.Item>
          </NavDropdown>
          <Nav.Link href="/support" className="d-flex align-items-center mx-2">
            <i className="fas fa-headset me-1"></i> Support
          </Nav.Link>
          <Nav.Link href="/faq" className="d-flex align-items-center mx-2">
            <i className="fas fa-question-circle me-1"></i> FAQ
          </Nav.Link>
          <Nav.Link href="/contact-us" className="d-flex align-items-center mx-2">
            <i className="fas fa-envelope me-1"></i> Contact Us
          </Nav.Link>
        </Nav>
        <Form className="d-flex ms-auto" style={{ maxWidth: '300px' }}>
          <FormControl
            type="search"
            placeholder="Search"
            className="me-2"
            aria-label="Search"
            style={{ fontSize: '14px' }}
          />
          <Button variant="outline-light" style={{ fontSize: '14px' }}>Search</Button>
        </Form>
        <Nav className="ms-3">
          <NavDropdown
            title={
              <span className="d-flex align-items-center">
                <i className="fas fa-user-circle me-1"></i> Profile
              </span>
            }
            id="profile-dropdown"
            align="end"
          >
            <NavDropdown.Item>Settings</NavDropdown.Item>
            <NavDropdown.Item style={{ color: 'red' }}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

const TTSPlayer = ({ startAudio, setStartAudio, ttsText, onPromptAnswered, onCommand, onYes, playContent, setPlayContent }) => {
  const location = useLocation();
  const audioRef = useRef(null);
  const { transcript, interimTranscript, finalTranscript, resetTranscript, listening } = useSpeechRecognition();
  const [isPrompting, setIsPrompting] = useState(false);
  const [shouldPlayContent, setShouldPlayContent] = useState(false);
  const [promptTimeout, setPromptTimeout] = useState(null);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isMounted, setIsMounted] = useState(true);
  const commandTimeoutRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  const [lastProcessedCommand, setLastProcessedCommand] = useState('');

  const resetAudio = (audioElement) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement.load();
      console.log('TTSPlayer: Audio reset');
      setIsPlaying(false);
    }
  };

  const playAudio = async (text) => {
    if (!isMounted) {
      console.log('TTSPlayer: Component unmounted, skipping audio playback');
      return;
    }
    if (isPlaying) {
      console.log('TTSPlayer: Audio already playing, adding to queue:', text);
      setAudioQueue((prevQueue) => [...prevQueue, text]);
      return;
    }
    try {
      setIsPlaying(true);
      const audioElement = audioRef.current;
      resetAudio(audioElement);
      const response = await axios.get('http://localhost:5000/tts', {
        params: { text },
      });
      const audioUrl = response.data.audioUrl;
      if (audioUrl && audioElement && isMounted) {
        audioElement.src = audioUrl;
        console.log('TTSPlayer: Audio source set to', audioUrl);
        audioElement.onended = () => {
          console.log('TTSPlayer: Audio ended for', text);
          setIsPlaying(false);
          if (text === '/prompt') {
            onPromptAnswered?.();
          }
          setAudioQueue((prevQueue) => {
            if (prevQueue.length > 0) {
              const nextText = prevQueue[0];
              playAudio(nextText);
              return prevQueue.slice(1);
            }
            return [];
          });
        };
        setTimeout(async () => {
          try {
            await audioElement.play();
            console.log('TTSPlayer: Audio playing for', text);
          } catch (err) {
            console.error('TTSPlayer: Audio playback error:', err);
            setIsPlaying(false);
            if (text === '/prompt') {
              onPromptAnswered?.();
            }
            setAudioQueue((prevQueue) => {
              if (prevQueue.length > 0) {
                const nextText = prevQueue[0];
                playAudio(nextText);
                return prevQueue.slice(1);
              }
              return [];
            });
          }
        }, 100);
      } else {
        setIsPlaying(false);
        setAudioQueue((prevQueue) => {
          if (prevQueue.length > 0) {
            const nextText = prevQueue[0];
            playAudio(nextText);
            return prevQueue.slice(1);
          }
          return [];
        });
      }
    } catch (error) {
      console.error('TTSPlayer: Error fetching audio:', error);
      setIsPlaying(false);
      if (text === '/prompt') {
        onPromptAnswered?.();
      } else if (['Do you want to proceed with the transfer process using the transfer details card?', 'Please specify the transfer amount in the transfer details card.', 'Please provide the account number in the transfer details card.'].includes(text)) {
        console.log('TTSPlayer: Skipping failed audio for transfer flow, proceeding with state');
        onPromptAnswered?.();
      }
      setAudioQueue((prevQueue) => {
        if (prevQueue.length > 0) {
          const nextText = prevQueue[0];
          playAudio(nextText);
          return prevQueue.slice(1);
        }
        return [];
      });
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      console.error('TTSPlayer: Browser does not support speech recognition.');
      return;
    }
    if (!listening) {
      console.log('TTSPlayer: Starting speech recognition');
      try {
        SpeechRecognition.startListening({ continuous: true, interimResults: true, lang: 'en-US' });
      } catch (err) {
        console.error('TTSPlayer: Speech recognition start error:', err);
      }
    }
    return () => {
      console.log('TTSPlayer: Stopping speech recognition listener setup');
    };
  }, [listening, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (startAudio && !isPrompting && !shouldPlayContent && !ttsText) {
      console.log('TTSPlayer: Starting prompt phase for', location.pathname);
      setIsPrompting(true);
      playAudio('/prompt');
      const timeout = setTimeout(() => {
        console.log('TTSPlayer: Prompt timeout, stopping prompt phase');
        setIsPrompting(false);
        setStartAudio(false);
        resetTranscript();
        onPromptAnswered?.();
      }, 15000);
      setPromptTimeout(timeout);
    }
    return () => {
      if (promptTimeout) clearTimeout(promptTimeout);
    };
  }, [startAudio, isPrompting, shouldPlayContent, ttsText, location.pathname, onPromptAnswered, setStartAudio, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (listening) {
      console.log('TTSPlayer: Speech recognition state - Listening:', listening, 'Interim:', interimTranscript, 'Final:', finalTranscript);
      if (interimTranscript) {
        setCurrentCommand(interimTranscript.toLowerCase().trim());
      }
      if (finalTranscript) {
        const command = finalTranscript.toLowerCase().trim();
        console.log('TTSPlayer: Processing final command:', command);
        if (command === lastProcessedCommand) {
          console.log('TTSPlayer: Ignoring repeated command:', command);
          resetTranscript();
          return;
        }
        setLastProcessedCommand(command);
        if (isPrompting) {
          if (command === 'yes' || (location.pathname === '/transfer' && command === 'transfer funds')) {
            console.log('TTSPlayer: User said yes or transfer funds, enabling content playback');
            setShouldPlayContent(true);
            setIsPrompting(false);
            setStartAudio(false);
            resetTranscript();
            if (promptTimeout) clearTimeout(promptTimeout);
            onPromptAnswered?.();
            onYes?.();
          } else if (command === 'no') {
            console.log('TTSPlayer: User said no, skipping content playback');
            setIsPrompting(false);
            setStartAudio(false);
            resetTranscript();
            if (promptTimeout) clearTimeout(promptTimeout);
            onPromptAnswered?.();
          }
        } else {
          onCommand?.(command);
          resetTranscript();
        }
        setCurrentCommand('');
      }
    }
  }, [interimTranscript, finalTranscript, listening, isPrompting, resetTranscript, promptTimeout, onCommand, setStartAudio, onYes, isMounted, location.pathname]);

  useEffect(() => {
    if (!isMounted) return;
    if (currentCommand && !isPrompting) {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = setTimeout(() => {
        console.log('TTSPlayer: Processing interim command:', currentCommand);
        onCommand?.(currentCommand);
        setCurrentCommand('');
        resetTranscript();
      }, 2000);
    }
    return () => {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
  }, [currentCommand, onCommand, resetTranscript, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (shouldPlayContent || playContent) {
      console.log('TTSPlayer: Fetching content audio for', location.pathname);
      playAudio(location.pathname);
      if (playContent) setPlayContent(false);
    }
  }, [shouldPlayContent, playContent, location.pathname, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (ttsText) {
      console.log('TTSPlayer: Playing custom TTS for', ttsText);
      playAudio(ttsText);
    }
  }, [ttsText, isMounted]);

  useEffect(() => {
    setIsMounted(true);
    const audioElement = audioRef.current;
    return () => {
      console.log('TTSPlayer: Cleaning up for', location.pathname);
      setIsMounted(false);
      resetAudio(audioElement);
      try {
        SpeechRecognition.stopListening();
      } catch (err) {
        console.error('TTSPlayer: Error stopping speech recognition:', err);
      }
      resetTranscript();
      if (promptTimeout) clearTimeout(promptTimeout);
      setIsPrompting(false);
      setShouldPlayContent(false);
      setCurrentCommand('');
      setAudioQueue([]);
    };
  }, [location.pathname, resetTranscript]);

  return <audio ref={audioRef} style={{ display: 'none' }} />;
};

const HeroSection = ({ toggleListening, isListening, startAudio, setStartAudio }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('HeroSection: Spacebar pressed');
        if (!startAudio) {
          console.log('HeroSection: Starting audio');
          setStartAudio(true);
        } else {
          console.log('HeroSection: Toggling listening');
          toggleListening();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening, startAudio, setStartAudio]);

  return (
    <header className="bg-primary text-white text-center py-5">
      <Container>
        <Row>
          <Col md={6}>
            <h1>Welcome to MyBank</h1>
            <p>Voice Commands: "Account" | "Transfer" | "Balance" | "Support" | "FAQ" | "Contact Us" | "Go Back" | "Go Home"</p>
            {!isListening ? (
              <button ref={buttonRef} className="btn btn-light mt-3" onClick={() => {
                console.log('HeroSection: Button clicked, toggling listening');
                toggleListening();
              }}>
                Activate Voice Navigation (Press Spacebar)
              </button>
            ) : (
              <p className="text-success">Listening... Say "Account", "Transfer", "Balance", "Support", "FAQ", "Contact Us", or "Go Home"</p>
            )}
          </Col>
          <Col md={6}>
            <Card className="shadow-lg hero-ad">
              <img src={HERO_AD} alt="Protect Your Savings" className="hero-ad-image" />
              <Card.Body>
                <Card.Title>Protect Your Savings!</Card.Title>
                <Button variant="primary">Join Now</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </header>
  );
};

const InstaServices = () => (
  <section className="container my-5">
    <h2 className="text-center mb-4">Insta Customer Services</h2>
    <Row className="text-center">
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fas fa-credit-card fa-2x mb-2"></i>
          <h5>Set Debit Card PIN</h5>
          <p>Set Debit Card PIN Instantly</p>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fas fa-map-marker-alt fa-2x mb-2"></i>
          <h5>Address Change</h5>
          <p>Update mailing or permanent address</p>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fas fa-university fa-2x mb-2"></i>
          <h5>Account Transfer</h5>
          <p>Bank Account Transfer from one Branch to another</p>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fas fa-user-check fa-2x mb-2"></i>
          <h5>Update KYC</h5>
          <p>Update KYC digitally with ease</p>
        </Card>
      </Col>
    </Row>
  </section>
);

const LatestOffers = () => (
  <section className="container my-5">
    <h2 className="text-center mb-4">Latest Offers</h2>
    <Row className="text-center">
      <Col md={3}>
        <Card className="p-3 shadow">
          <Card.Title>Personal Loan</Card.Title>
          <p>Get quick funds at best interest rates. Hurry up!</p>
          <Button variant="primary">Apply Now</Button>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <Card.Title>Investment Platform</Card.Title>
          <p>Invest in Stocks, Mutual Funds, IPOs, ETFs, F&O & more...</p>
          <Button variant="primary">Explore</Button>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <Card.Title>Home Loan</Card.Title>
          <p>Attractive offers on Home Loans. Hurry! Limited Period Offer</p>
          <Button variant="primary">Apply Now</Button>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <Card.Title>Special Savings Account</Card.Title>
          <p>Tailormade offering for MyBank Home Loan customers</p>
          <Button variant="primary">Learn More</Button>
        </Card>
      </Col>
    </Row>
  </section>
);

const WaysToBank = () => (
  <section className="container my-5">
    <h2 className="text-center mb-4">Ways to Bank</h2>
    <Row className="text-center">
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fab fa-whatsapp fa-2x mb-2"></i>
          <h5>WhatsApp Banking</h5>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fas fa-mobile-alt fa-2x mb-2"></i>
          <h5>Mobile Banking</h5>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fas fa-credit-card fa-2x mb-2"></i>
          <h5>PayZapp</h5>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="p-3 shadow">
          <i className="fas fa-user-tie fa-2x mb-2"></i>
          <h5>Premier Banking</h5>
        </Card>
      </Col>
    </Row>
  </section>
);

const HighNetworthBanking = () => (
  <section className="container my-5">
    <h2 className="text-center mb-4">High Networth Banking</h2>
    <Row className="text-center">
      <Col md={6}>
        <Card className="p-3 shadow">
          <h5>Premier Banking</h5>
          <p>Exclusive services for high networth individuals</p>
          <Button variant="primary">Learn More</Button>
        </Card>
      </Col>
      <Col md={6}>
        <Card className="p-3 shadow">
          <h5>Wealth Management</h5>
          <p>Personalized investment solutions for wealth growth</p>
          <Button variant="primary">Explore</Button>
        </Card>
      </Col>
    </Row>
  </section>
);

const QuickLinks = () => (
  <Card className="shadow-lg p-3 mb-4 quick-links">
    <Card.Title><h4>Quick Links</h4></Card.Title>
    <ListGroup variant="flush">
      <ListGroup.Item><i className="fas fa-file-invoice me-2"></i> Pay Bills</ListGroup.Item>
      <ListGroup.Item><i className="fas fa-hand-holding-usd me-2"></i> Apply for Loan</ListGroup.Item>
      <ListGroup.Item><i className="fas fa-headset me-2"></i> Customer Support</ListGroup.Item>
      <ListGroup.Item><i className="fas fa-lock me-2"></i> Security Settings</ListGroup.Item>
    </ListGroup>
  </Card>
);

const PromoBanner = () => (
  <Card className="shadow-lg mb-4 promo-banner">
    <img src={PROMO_BANNER} alt="Credit Card Offer" className="promo-image" />
    <Card.Body>
      <Card.Title>Get 5% Cashback with Our Credit Card!</Card.Title>
      <Button variant="primary">Apply Now</Button>
    </Card.Body>
  </Card>
);

const RecentActivity = () => {
  const [activities, setActivities] = useState([
    { id: 1, description: 'Deposited $500', date: '2025-04-29' },
    { id: 2, description: 'Bill Payment $50', date: '2025-04-28' },
    { id: 3, description: 'Transfer $200', date: '2025-04-27' },
  ]);

  return (
    <Card className="shadow-lg p-3 mb-4 recent-activity">
      <Card.Title><h4>Recent Activity</h4></Card.Title>
      <ListGroup variant="flush">
        {activities.map((activity) => (
          <ListGroup.Item key={activity.id}>
            {activity.description} - {activity.date}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

const Footer = () => (
  <footer className="footer">
    <Container>
      <Row>
        <Col md={3}>
          <h5>Contact Us</h5>
          <p><i className="fas fa-phone-alt me-2"></i> 1-800-555-1234</p>
          <p><i className="fas fa-envelope me-2"></i> support@mybank.com</p>
        </Col>
        <Col md={3}>
          <h5>Quick Links</h5>
          <p><a href="/faq">FAQ</a></p>
          <p><a href="/contact-us">Contact Us</a></p>
          <p><a href="/support">Support</a></p>
        </Col>
        <Col md={3}>
          <h5>Legal</h5>
          <p><a href="/privacy-policy">Privacy Policy</a></p>
          <p><a href="/terms-of-service">Terms of Service</a></p>
        </Col>
        <Col md={3}>
          <h5>Follow Us</h5>
          <p>
            <a href="#"><i className="fab fa-facebook-f me-2"></i></a>
            <a href="#"><i className="fab fa-twitter me-2"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
          </p>
        </Col>
      </Row>
      <p className="mt-3">© 2025 MyBank. All Rights Reserved.</p>
    </Container>
  </footer>
);

const VoiceAuth = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState('initial'); 
  const [userId, setUserId] = useState('');
  const [phrase, setPhrase] = useState('');
  const [message, setMessage] = useState('');
  const [startAudio, setStartAudio] = useState(false);
  const [ttsText, setTtsText] = useState('');
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('VoiceAuth: Spacebar pressed');
        if (authState === 'initial' && !startAudio) {
          console.log('VoiceAuth: Starting audio for user ID');
          setAuthState('userId');
          setTtsText('Please say your user ID.');
          setStartAudio(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authState, startAudio]);

  useEffect(() => {
    if (authState === 'userId' && userId) {
      console.log('VoiceAuth: User ID set, moving to phrase');
      setAuthState('phrase');
      setTtsText('Please say your verification phrase.');
      setMessage('Please say your verification phrase.');
    } else if (authState === 'phrase' && phrase) {
      console.log('VoiceAuth: Phrase set, moving to confirm');
      setAuthState('confirm');
      setTtsText(`You said user ID ${userId} and phrase ${phrase}. Do you wish to confirm these details?`);
      setMessage(`User ID: ${userId}, Phrase: ${phrase}. Do you wish to confirm these details?`);
    } else if (authState === 'verifying') {
      setMessage('Verifying...');
      setTimeout(() => {
        console.log('VoiceAuth: Verification complete, navigating to /home');
        setAuthState('done');
        navigate('/home');
      }, 3500); // 3.5 seconds delay for verification
    }
  }, [authState, userId, phrase, navigate]);

  const handleCommand = useCallback((command) => {
    console.log('VoiceAuth: Received command:', command);
    if (authState === 'userId') {
      setUserId(command);
      setMessage(`User ID captured: ${command}`);
    } else if (authState === 'phrase') {
      setPhrase(command);
      setMessage(`Phrase captured: ${command}`);
    } else if (authState === 'confirm' && command === 'yes') {
      setAuthState('verifying');
    } else if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
      console.log('VoiceAuth: Navigating to /home');
      navigate('/home');
    }
  }, [authState, navigate]);

  const handleYes = useCallback(() => {
    console.log('VoiceAuth: Handling yes command');
    setPlayContent(true);
  }, []);

  return (
    <div>
      <CustomNavbar />
      <TTSPlayer
        startAudio={startAudio}
        setStartAudio={setStartAudio}
        ttsText={ttsText}
        onCommand={handleCommand}
        onYes={handleYes}
        playContent={playContent}
        setPlayContent={setPlayContent}
      />
      <Container className="my-5" style={{ maxWidth: '600px' }}>
        <h1 className="mb-4" style={{ fontSize: '24px', fontWeight: 'bold' }}>Login to NetBanking</h1>
        {(authState === 'initial' || authState === 'userId' || authState === 'phrase' || authState === 'confirm') && (
          <>
            <Form.Group className="mb-3" controlId="userIdInput">
              <Form.Label style={{ fontSize: '14px', fontWeight: 'bold' }}>Customer ID / User ID</Form.Label>
              <Form.Control
                type="text"
                value={userId}
                readOnly
                placeholder=""
                style={{ borderRadius: '5px', padding: '8px', fontSize: '14px' }}
              />
              <a href="#" style={{ fontSize: '12px', color: '#007bff', textDecoration: 'none', float: 'right', marginTop: '5px' }}>
                Forgot Customer ID
              </a>
            </Form.Group>
            <Form.Group className="mb-4" controlId="phraseInput">
              <Form.Label style={{ fontSize: '14px', fontWeight: 'bold' }}>Verification Phrase</Form.Label>
              <Form.Control
                type="text"
                value={phrase}
                readOnly
                placeholder=""
                style={{ borderRadius: '5px', padding: '8px', fontSize: '14px' }}
              />
            </Form.Group>
            <Button
              className="w-100 mb-4"
              style={{
                backgroundColor: '#007bff',
                border: 'none',
                padding: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '5px',
              }}
              onClick={() => {
                console.log('VoiceAuth: Continue button clicked');
                if (authState === 'initial') {
                  setAuthState('userId');
                  setTtsText('Please say your user ID.');
                  setStartAudio(true);
                }
              }}
            >
              CONTINUE
            </Button>
            <div
              className="p-3 mb-4"
              style={{
                backgroundColor: '#e6f0fa',
                border: '1px solid #b3d7ff',
                borderRadius: '5px',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              <p>
                <strong>Dear Customer,</strong><br />
                Welcome to the new login page of MyBank NetBanking. Its lighter look and feel is designed to give you the best possible user experience. Please continue to login using your customer ID and password.
              </p>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>
              Don't have a MyBank Savings Account?
            </div>
            <Row>
              <Col md={6}>
                <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#007bff', textDecoration: 'none' }}>Credit Card only? Login here</a>
                </p>
                <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#007bff', textDecoration: 'none' }}>Prepaid Card only? Login here</a>
                </p>
                <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#007bff', textDecoration: 'none' }}>Retail Loan only? Login here</a>
                </p>
              </Col>
              <Col md={6}>
                <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#007bff', textDecoration: 'none' }}>HDFC Ltd. Home Loans? Login here</a>
                </p>
                <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#007bff', textDecoration: 'none' }}>HDFC Ltd. Deposits? Login here</a>
                </p>
              </Col>
            </Row>
          </>
        )}
        {authState === 'verifying' && (
          <div className="my-4 text-center">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Verifying...</span>
            </Spinner>
            <p className="mt-2">Verifying...</p>
          </div>
        )}
        {message && <p className="text-center" style={{ fontSize: '14px' }}>{message}</p>}
      </Container>
      <Footer />
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  const toggleListening = useCallback(() => {
    setIsListening((prev) => {
      console.log('Home: Toggling listening to', !prev);
      return !prev;
    });
  }, []);

  const handleCommand = useCallback(
    (command) => {
      console.log('Home: Received command:', command);
      if (isListening) {
        if (command.includes('account')) {
          console.log('Home: Navigating to /account');
          navigate('/account');
        } else if (command.includes('transfer')) {
          console.log('Home: Navigating to /transfer');
          navigate('/transfer');
        } else if (command.includes('balance')) {
          console.log('Home: Navigating to /balance');
          navigate('/balance');
        } else if (command.includes('support')) {
          console.log('Home: Navigating to /support');
          navigate('/support');
        } else if (command.includes('faq')) {
          console.log('Home: Navigating to /faq');
          navigate('/faq');
        } else if (command.includes('contact us') || command.includes('contact')) {
          console.log('Home: Navigating to /contact-us');
          navigate('/contact-us');
        }
      }
      if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
        console.log('Home: Navigating to /home');
        navigate('/home');
      }
    },
    [navigate, isListening]
  );

  const handleYes = useCallback(() => {
    console.log('Home: Handling yes command');
    setPlayContent(true);
    setStartAudio(false);
  }, []);

  return (
    <div>
      <CustomNavbar />
      <TTSPlayer
        startAudio={startAudio}
        setStartAudio={setStartAudio}
        onCommand={handleCommand}
        onYes={handleYes}
        playContent={playContent}
        setPlayContent={setPlayContent}
      />
      <HeroSection
        toggleListening={toggleListening}
        isListening={isListening}
        startAudio={startAudio}
        setStartAudio={setStartAudio}
      />
      <InstaServices />
      <LatestOffers />
      <WaysToBank />
      <HighNetworthBanking />
      <Footer />
    </div>
  );
};

const Account = () => {
  const navigate = useNavigate();
  const { balance } = useBalance();
  const [accountDetails, setAccountDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    setAccountDetails({
      account_number: '647834894',
      account_type: 'Savings',
    });
    setTransactions([
      { id: 1, date: '2025-04-28', description: 'Grocery Purchase', amount: -150.0, type: 'Debit' },
      { id: 2, date: '2025-04-27', description: 'Salary Deposit', amount: 2000.0, type: 'Credit' },
      { id: 3, date: '2025-04-26', description: 'Utility Bill', amount: -75.5, type: 'Debit' },
    ]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('Account: Spacebar pressed');
        if (!startAudio && !playContent) {
          console.log('Account: Starting audio');
          setStartAudio(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startAudio, playContent]);

  const handleCommand = useCallback((command) => {
    if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
      console.log('Account: Navigating to /home');
      navigate('/home');
    }
  }, [navigate]);

  const handleYes = useCallback(() => {
    console.log('Account: Handling yes command');
    setPlayContent(true);
    setStartAudio(false);
  }, []);

  return (
    <>
      <CustomNavbar />
      <VoiceBack />
      <TTSPlayer
        startAudio={startAudio}
        setStartAudio={setStartAudio}
        onCommand={handleCommand}
        onYes={handleYes}
        playContent={playContent}
        setPlayContent={setPlayContent}
      />
      <div className="header-image" style={{ backgroundImage: `url(${ACCOUNT_HEADER})` }}>
        <h1 className="header-title">Account Overview</h1>
      </div>
      <Container className="my-5">
        <Row>
          <Col md={3}>
            <QuickLinks />
          </Col>
          <Col md={6}>
            <Card className="shadow-lg p-4 mb-4">
              <Card.Title><h3><i className="fas fa-user me-2"></i> Account Summary</h3></Card.Title>
              {accountDetails && (
                <>
                  <p><strong>Account Number:</strong> {accountDetails.account_number}</p>
                  <p><strong>Account Type:</strong> {accountDetails.account_type}</p>
                  <p><strong>Current Balance:</strong> <span className="highlight">${balance.toFixed(2)}</span></p>
                  <Button variant="primary" className="mt-3">View Details</Button>
                  <Button variant="secondary" className="mt-3 ms-2">Download Statement</Button>
                </>
              )}
            </Card>
            <Card className="shadow-lg p-4 mb-4">
              <Card.Title><h3>Recent Transactions</h3></Card.Title>
              {transactions.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{txn.date}</td>
                        <td>{txn.description}</td>
                        <td style={{ color: txn.type === 'Debit' ? 'red' : 'green' }}>
                          {txn.type === 'Debit' ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
                        </td>
                        <td>{txn.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No transactions available.</p>
              )}
            </Card>
          </Col>
          <Col md={3}>
            <PromoBanner />
            <RecentActivity />
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

const Transfer = () => {
  const navigate = useNavigate();
  const { balance, setBalance } = useBalance();
  const [startAudio, setStartAudio] = useState(false);
  const [isPromptAnswered, setIsPromptAnswered] = useState(false);
  const [transferState, setTransferState] = useState('initial'); 
  const [transferAmount, setTransferAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [verificationPhrase, setVerificationPhrase] = useState('');
  const [message, setMessage] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [playContent, setPlayContent] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('Transfer: Spacebar pressed');
        if (!startAudio && !playContent && !isAudioPlaying) {
          console.log('Transfer: Starting audio');
          setStartAudio(true);
        } else {
          console.log('Transfer: Audio already in progress, ignoring spacebar');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startAudio, playContent, isAudioPlaying]);

  useEffect(() => {
    if (isPromptAnswered && transferState === 'initial') {
      setTransferState('confirm');
      setTtsText('Do you want to proceed with the transfer process using the transfer details card?');
      setMessage('Do you want to proceed with the transfer process?');
    }
  }, [isPromptAnswered, transferState]);

  useEffect(() => {
    if (transferState === 'amount') {
      setTtsText('Please specify the transfer amount in the transfer details card.');
      setMessage('Please specify the transfer amount.');
    } else if (transferState === 'account') {
      setTtsText('Please provide the account number in the transfer details card.');
      setMessage('Please provide the account number.');
    } else if (transferState === 'confirmPayment') {
      setTtsText('Do you wish to confirm this payment?');
      setMessage('Do you wish to confirm this payment?');
    } else if (transferState === 'verifyPhrase') {
      setTtsText('Please say your verification phrase.');
      setMessage('Please say your verification phrase.');
    } else if (transferState === 'processing') {
      setMessage('Processing your transfer...');
      setTimeout(() => {
        const amount = parseFloat(transferAmount);
        if (!isNaN(amount) && amount > 0 && amount <= balance) {
          setBalance((prevBalance) => prevBalance - amount);
          setTransferState('completed');
        } else {
          setMessage('Insufficient balance or invalid amount. Please try again.');
          setTransferState('initial');
          setTtsText('Insufficient balance or invalid amount. Please try again.');
        }
      }, 4500);
    } else if (transferState === 'completed') {
      const confirmation = `Transfer of ${transferAmount} to account ${accountNumber} completed. Check the recent activity on the right for details.`;
      setTtsText(confirmation);
      setMessage(confirmation);
    }
  }, [transferState, transferAmount, accountNumber, balance, setBalance]);

  const handleCommand = useCallback(
    (command) => {
      console.log('Transfer: Received command:', command);
      if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
        navigate('/home');
        setTransferState('initial');
        setTtsText('');
        return;
      }
      if (command === 'skip') {
        console.log('Transfer: Skipping current step');
        if (transferState === 'confirm') {
          setTransferState('amount');
        } else if (transferState === 'amount') {
          setTransferAmount('0');
          setTransferState('account');
        } else if (transferState === 'account') {
          setAccountNumber('Not specified');
          setTransferState('confirmPayment');
        } else if (transferState === 'confirmPayment') {
          setTransferState('verifyPhrase');
        } else if (transferState === 'verifyPhrase') {
          setVerificationPhrase('Not specified');
          setTransferState('processing');
        }
        return;
      }
      if (transferState === 'confirm' && command === 'yes') {
        setTransferState('amount');
      } else if (transferState === 'amount') {
        const amount = command.match(/\d+(\.\d+)?/)?.[0] || command;
        setTransferAmount(amount);
        setTransferState('account');
      } else if (transferState === 'account') {
        setAccountNumber(command);
        setTransferState('confirmPayment');
      } else if (transferState === 'confirmPayment' && command === 'yes') {
        setTransferState('verifyPhrase');
      } else if (transferState === 'verifyPhrase') {
        setVerificationPhrase(command);
        setTransferState('processing');
      }
    },
    [navigate, transferState]
  );

  const handleYes = useCallback(() => {
    setIsPromptAnswered(true);
    setPlayContent(true);
    setStartAudio(false);
  }, []);

  return (
    <>
      <CustomNavbar />
      <VoiceBack />
      <TTSPlayer
        startAudio={startAudio || transferState !== 'initial'}
        setStartAudio={setStartAudio}
        ttsText={ttsText}
        onPromptAnswered={() => setIsPromptAnswered(true)}
        onCommand={handleCommand}
        onYes={handleYes}
        playContent={playContent}
        setPlayContent={setPlayContent}
      />
      <div className="header-image" style={{ backgroundImage: `url(${TRANSFER_HEADER})` }}>
        <h1 className="header-title">Transfer Funds</h1>
      </div>
      <Container className="my-5">
        <Row>
          <Col md={3}>
            <QuickLinks />
          </Col>
          <Col md={6}>
            <Card className="shadow-lg p-4 mb-4">
              <Card.Title><h3><i className="fas fa-exchange-alt me-2"></i> Transfer Details</h3></Card.Title>
              <p><strong>Status:</strong> {transferState === 'completed' ? 'Completed' : transferState === 'processing' ? 'Processing' : 'In Progress'}</p>
              {transferState !== 'initial' && (
                <>
                  <p><strong>Amount:</strong> ${transferAmount || 'Not specified'}</p>
                  <p><strong>Account Number:</strong> {accountNumber || 'Not specified'}</p>
                  {transferState === 'verifyPhrase' && (
                    <p><strong>Verification Phrase:</strong> {verificationPhrase || 'Not specified'}</p>
                  )}
                  {transferState === 'confirm' && <Button variant="primary" className="mt-3">Confirm Transfer</Button>}
                  {transferState === 'amount' && <Button variant="primary" className="mt-3">Set Amount</Button>}
                  {transferState === 'account' && <Button variant="primary" className="mt-3">Set Account</Button>}
                  {transferState === 'confirmPayment' && <Button variant="primary" className="mt-3">Confirm Payment</Button>}
                  {transferState === 'verifyPhrase' && <Button variant="primary" className="mt-3">Provide Verification Phrase</Button>}
                </>
              )}
              {transferState === 'processing' && (
                <div className="text-center mt-3">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Processing...</span>
                  </Spinner>
                </div>
              )}
            </Card>
            <Card className="shadow-lg p-4 mb-4">
              <Card.Title><h4>Instructions</h4></Card.Title>
              <p>{message}</p>
            </Card>
          </Col>
          <Col md={3}>
            <PromoBanner />
            <RecentActivity />
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

const Balance = () => {
  const navigate = useNavigate();
  const { balance } = useBalance();
  const [accountDetails, setAccountDetails] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);
  const [ttsText, setTtsText] = useState('');

  useEffect(() => {
    setAccountDetails({
      account_holder: 'Eben Smith',
      account_number: '647834894',
    });
    setLastTransaction({
      date: '2025-04-28',
      description: 'Grocery Purchase',
      amount: -150.0,
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('Balance: Spacebar pressed');
        if (!startAudio && !playContent) {
          console.log('Balance: Starting audio');
          setStartAudio(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startAudio, playContent]);

  const handleCommand = useCallback((command) => {
    if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
      console.log('Balance: Navigating to /home');
      navigate('/home');
    }
  }, [navigate]);

  const handleYes = useCallback(() => {
    console.log('Balance: Handling yes command');
    setPlayContent(true);
    setStartAudio(false);
    if (accountDetails) {
      const details = `Account Holder: ${accountDetails.account_holder}. Account Number: ${accountDetails.account_number}. Available Balance: ${balance.toFixed(2)} dollars.`;
      setTtsText(details);
    }
  }, [accountDetails, balance]);

  return (
    <>
      <CustomNavbar />
      <VoiceBack />
      <TTSPlayer
        startAudio={startAudio}
        setStartAudio={setStartAudio}
        ttsText={ttsText}
        onCommand={handleCommand}
        onYes={handleYes}
        playContent={playContent}
        setPlayContent={setPlayContent}
      />
      <div className="header-image" style={{ backgroundImage: `url(${BALANCE_HEADER})` }}>
        <h1 className="header-title">Balance Inquiry</h1>
      </div>
      <Container className="my-5">
        <Row>
          <Col md={3}>
            <QuickLinks />
          </Col>
          <Col md={6}>
            <Card className="shadow-lg p-4 mb-4">
              <Card.Title><h3><i className="fas fa-wallet me-2"></i> Account Balance</h3></Card.Title>
              {accountDetails && (
                <>
                  <p><strong>Account Holder:</strong> {accountDetails.account_holder}</p>
                  <p><strong>Account Number:</strong> {accountDetails.account_number}</p>
                  <p><strong>Available Balance:</strong> <span className="highlight">${balance.toFixed(2)}</span></p>
                  <Button variant="primary" className="mt-3">View History</Button>
                  <Button variant="secondary" className="mt-3 ms-2">Set Budget</Button>
                </>
              )}
            </Card>
            <Card className="shadow-lg p-4 mb-4">
              <Card.Title><h4>Last Transaction</h4></Card.Title>
              {lastTransaction ? (
                <p><strong>Description:</strong> {lastTransaction.description} (${lastTransaction.amount.toFixed(2)}) on {lastTransaction.date}</p>
              ) : (
                <p>No recent transactions.</p>
              )}
            </Card>
          </Col>
          <Col md={3}>
            <PromoBanner />
            <RecentActivity />
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

const Support = () => {
  const navigate = useNavigate();
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('Support: Spacebar pressed');
        if (!startAudio && !playContent) {
          console.log('Support: Starting audio');
          setStartAudio(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startAudio, playContent]);

  const handleCommand = useCallback((command) => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('go home') || lowerCommand.includes('go to home') || lowerCommand.includes('go back')) {
      console.log('Support: Navigating to /home');
      navigate('/home');
    } else if (lowerCommand.includes('faq') || lowerCommand.includes('go to faq')) {
      console.log('Support: Navigating to /faq');
      navigate('/faq');
    } else if (lowerCommand.includes('contact us') || lowerCommand.includes('contact') || lowerCommand.includes('go to contact us')) {
      console.log('Support: Navigating to /contact-us');
      navigate('/contact-us');
    }
  }, [navigate]);

  const handleYes = useCallback(() => {
    console.log('Support: Handling yes command');
    setPlayContent(true);
    setStartAudio(false);
  }, []);

  return (
    <div>
      <CustomNavbar />
      <VoiceBack />
      <TTSPlayer
        startAudio={startAudio}
        setStartAudio={setStartAudio}
        onCommand={handleCommand}
        onYes={handleYes}
        playContent={playContent}
        setPlayContent={setPlayContent}
      />
      <Container className="my-5">
        <h1 className="text-center mb-4">Customer Support</h1>
        <Row>
          <Col md={4}>
            <Card className="shadow-lg p-4">
              <Card.Title><h3>Contact Us</h3></Card.Title>
              <p><strong>Phone:</strong> 1-800-555-1234</p>
              <p><strong>Email:</strong> support@mybank.com</p>
              <Button variant="primary">Live Chat</Button>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-lg p-4">
              <Card.Title><h3>FAQs</h3></Card.Title>
              <p>Find answers to common questions in our FAQ section.</p>
              <Button variant="primary" href="/faq">Visit FAQs</Button>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-lg p-4">
              <Card.Title><h3>Support Hours</h3></Card.Title>
              <p><strong>Monday - Friday:</strong> 9 AM - 6 PM</p>
              <p><strong>Saturday:</strong> 10 AM - 4 PM</p>
              <p><strong>Sunday:</strong> Closed</p>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

const App = () => {
  const [balance, setBalance] = useState(5000.0); // Initial balance

  return (
    <BalanceContext.Provider value={{ balance, setBalance }}>
      <Router>
        <Routes>
          <Route path="/" element={<VoiceAuth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/account" element={<Account />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">FAQ</h2><Footer /></div>} />
          <Route path="/contact-us" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">Contact Us</h2><Footer /></div>} />
          <Route path="/privacy-policy" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">Privacy Policy</h2><Footer /></div>} />
          <Route path="/terms-of-service" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">Terms of Service</h2><Footer /></div>} />
        </Routes>
      </Router>
    </BalanceContext.Provider>
  );
};

export default App;