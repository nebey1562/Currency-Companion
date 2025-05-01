import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, NavDropdown, Container, Row, Col, Card, Button, Table, ListGroup } from 'react-bootstrap';
import './App.css';

// Placeholder image paths (replace with actual paths after sourcing images)
const PROMO_BANNER = '/assets/promo-banner.jpg'; // 600x200px credit card offer
const ACCOUNT_HEADER = '/assets/account-header.jpg'; // 1200x300px financial chart
const TRANSFER_HEADER = '/assets/transfer-header.jpg'; // 1200x300px money transfer
const BALANCE_HEADER = '/assets/balance-header.jpg'; // 1200x300px wallet or piggy bank

// Voice Navigation Component
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

// Navbar Component with More Options
const CustomNavbar = () => (
  <Navbar bg="dark" variant="dark" expand="lg" style={{ height: '60px' }}>
    <Container>
      <Navbar.Brand href="/home">MyBank</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link href="/account"><i className="fas fa-user me-1"></i> Account</Nav.Link>
          <Nav.Link href="/transfer"><i className="fas fa-exchange-alt me-1"></i> Transfer</Nav.Link>
          <Nav.Link href="/balance"><i className="fas fa-wallet me-1"></i> Balance</Nav.Link>
          <NavDropdown title="Investments" id="investments-dropdown">
            <NavDropdown.Item>Mutual Funds</NavDropdown.Item>
            <NavDropdown.Item>Stocks</NavDropdown.Item>
          </NavDropdown>
          <Nav.Link href="/support">Support</Nav.Link>
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

// TTS Player Component with Updated Audio Prompts
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

  const resetAudio = (audioElement) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement.load();
      console.log('TTSPlayer: Audio reset');
    }
  };

  const playAudio = async (text) => {
    if (!isMounted) return;
    try {
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
          if (text === '/prompt') {
            onPromptAnswered?.();
          }
        };
        setTimeout(async () => {
          try {
            await audioElement.play();
            console.log('TTSPlayer: Audio playing for', text);
          } catch (err) {
            console.error('TTSPlayer: Audio playback error:', err);
            if (text === '/prompt') {
              onPromptAnswered?.();
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('TTSPlayer: Error fetching audio:', error);
      if (text === '/prompt') {
        onPromptAnswered?.();
      } else if (['Do you want to proceed with the transfer process using the transfer details card?', 'Please specify the transfer amount in the transfer details card.', 'Please provide the account number in the transfer details card.'].includes(text)) {
        console.log('TTSPlayer: Skipping failed audio for transfer flow, proceeding with state');
        onPromptAnswered?.();
      }
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
    } else if (startAudio && ttsText) {
      console.log('TTSPlayer: Playing custom TTS for', ttsText);
      playAudio(ttsText);
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
        setCurrentCommand(interimTranscript.toLowerCase());
      }
      if (finalTranscript) {
        const command = finalTranscript.toLowerCase();
        console.log('TTSPlayer: Processing final command:', command);
        if (isPrompting) {
          if (command.includes('yes')) {
            console.log('TTSPlayer: User said yes, enabling content playback');
            setShouldPlayContent(true);
            setIsPrompting(false);
            setStartAudio(false);
            resetTranscript();
            if (promptTimeout) clearTimeout(promptTimeout);
            onPromptAnswered?.();
            onYes?.();
          } else if (command.includes('no')) {
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
  }, [interimTranscript, finalTranscript, listening, isPrompting, resetTranscript, promptTimeout, onCommand, setStartAudio, onYes, isMounted]);

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
    };
  }, [location.pathname, resetTranscript]);

  return <audio ref={audioRef} style={{ display: 'none' }} />;
};

// Hero Section with Spacebar Activation
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
        <p>Voice Commands: "Account" | "Transfer" | "Balance" | "Go Back" | "Go Home"</p>
        {!isListening ? (
          <button ref={buttonRef} className="btn btn-light mt-3" onClick={() => {
            console.log('HeroSection: Button clicked, toggling listening');
            toggleListening();
          }}>
            Activate Voice Navigation (Press Spacebar)
          </button>
        ) : (
          <p className="text-success">Listening... Say "Account", "Transfer", "Balance", or "Go Home"</p>
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

// Quick Links Sidebar Component
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

// Promotional Banner Component
const PromoBanner = () => (
  <Card className="shadow-lg mb-4 promo-banner">
    <img src={PROMO_BANNER} alt="Credit Card Offer" className="promo-image" />
    <Card.Body>
      <Card.Title>Get 5% Cashback with Our Credit Card!</Card.Title>
      <Button variant="primary">Apply Now</Button>
    </Card.Body>
  </Card>
);

// Recent Activity Widget Component
const RecentActivity = () => (
  <Card className="shadow-lg p-3 mb-4 recent-activity">
    <Card.Title><h4>Recent Activity</h4></Card.Title>
    <ListGroup variant="flush">
      <ListGroup.Item>Deposited $500 - 2025-04-29</ListGroup.Item>
      <ListGroup.Item>Bill Payment $50 - 2025-04-28</ListGroup.Item>
      <ListGroup.Item>Transfer $200 - 2025-04-27</ListGroup.Item>
    </ListGroup>
  </Card>
);

// Footer Component with More Links
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

// Voice Authentication Page
const VoiceAuth = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  const handleVerify = useCallback(() => {
    setMessage('Verifying... Please wait.');
    setTimeout(() => {
      if (attempts === 0) {
        setMessage('Voice not recognized.');
        setAttempts(1);
      } else {
        setMessage('Welcome Eben!');
        console.log('VoiceAuth: Navigating to /home');
        navigate('/home');
      }
    }, 4000);
  }, [navigate, attempts]);

  const handleCommand = useCallback((command) => {
    console.log('VoiceAuth: Received command:', command);
    if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
      console.log('VoiceAuth: Navigating to /home');
      navigate('/home');
    }
  }, [navigate]);

  const handleYes = useCallback(() => {
    console.log('VoiceAuth: Handling yes command');
    setPlayContent(true);
    setStartAudio(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('VoiceAuth: Spacebar pressed');
        if (!startAudio && !playContent) {
          console.log('VoiceAuth: Starting audio');
          setStartAudio(true);
        } else {
          console.log('VoiceAuth: Triggering verification');
          handleVerify();
          setStartAudio(false);
          setPlayContent(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleVerify, startAudio, playContent]);

  const simulateCommand = (command) => {
    console.log('VoiceAuth: Simulating command:', command);
    if (command === 'yes') {
      handleYes();
    } else {
      handleCommand(command);
    }
  };

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
      <Container className="text-center my-5">
        <h1>Voice Authentication</h1>
        <p>Say your verification phrase or press Spacebar to proceed.</p>
        <button
          className="btn btn-info m-2"
          onClick={() => {
            console.log('VoiceAuth: Verify button clicked');
            handleVerify();
            setStartAudio(false);
            setPlayContent(false);
          }}
        >
          Verify (Spacebar)
        </button>
        <button
          className="btn btn-warning m-2"
          onClick={() => simulateCommand('yes')}
        >
          Simulate "Yes"
        </button>
        <button
          className="btn btn-warning m-2"
          onClick={() => simulateCommand('go to home')}
        >
          Simulate "Go to Home"
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
      <Features />
      <Footer />
    </div>
  );
};

// Account Page with Cluttered UI
const Account = () => {
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    setAccountDetails({
      account_number: '647834894',
      account_type: 'Savings',
      balance: 5000.0,
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
                  <p><strong>Current Balance:</strong> <span className="highlight">${accountDetails.balance.toFixed(2)}</span></p>
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

// Transfer Page with Cluttered UI
const Transfer = () => {
  const navigate = useNavigate();
  const [startAudio, setStartAudio] = useState(false);
  const [isPromptAnswered, setIsPromptAnswered] = useState(false);
  const [transferState, setTransferState] = useState('initial');
  const [transferAmount, setTransferAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [message, setMessage] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('Transfer: Spacebar pressed');
        if (!startAudio && !playContent) {
          console.log('Transfer: Starting audio');
          setStartAudio(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startAudio, playContent]);

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
    } else if (transferState === 'completed') {
      const confirmation = `Transfer of ${transferAmount} to account ${accountNumber} completed. Check the recent activity on the right for details.`;
      setTtsText(confirmation);
      setMessage(confirmation);
    }
  }, [transferState, transferAmount, accountNumber]);

  const handleCommand = useCallback(
    (command) => {
      console.log('Transfer: Received command:', command);
      if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
        navigate('/home');
        setTransferState('initial');
        setTtsText('');
        return;
      }
      if (transferState === 'confirm' && command.includes('yes')) {
        setTransferState('amount');
      } else if (transferState === 'amount') {
        const amount = command.match(/\d+(\.\d+)?/)?.[0] || command;
        setTransferAmount(amount);
        setTransferState('account');
      } else if (transferState === 'account') {
        setAccountNumber(command);
        setTransferState('completed');
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
            <Card className="shadow-lg p-4 mb subida al repositorio-4">
              <Card.Title><h3><i className="fas fa-exchange-alt me-2"></i> Transfer Details</h3></Card.Title>
              <p><strong>Status:</strong> {transferState === 'completed' ? 'Completed' : 'In Progress'}</p>
              {transferState !== 'initial' && (
                <>
                  <p><strong>Amount:</strong> ${transferAmount || 'Not specified'}</p>
                  <p><strong>Account Number:</strong> {accountNumber || 'Not specified'}</p>
                  {transferState === 'confirm' && <Button variant="primary" className="mt-3">Confirm Transfer</Button>}
                  {transferState === 'amount' && <Button variant="primary" className="mt-3">Set Amount</Button>}
                  {transferState === 'account' && <Button variant="primary" className="mt-3">Set Account</Button>}
                </>
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

// Balance Page with Cluttered UI
const Balance = () => {
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    setAccountDetails({
      account_holder: 'Eben Smith',
      account_number: '647834894',
      balance: 5000.0,
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
                  <p><strong>Available Balance:</strong> <span className="highlight">${accountDetails.balance.toFixed(2)}</span></p>
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

// Support Page (New)
const Support = () => (
  <div>
    <CustomNavbar />
    <TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} />
    <Container className="my-5">
      <h1 className="text-center mb-4">Customer Support</h1>
      <Row>
        <Col md={6}>
          <Card className="shadow-lg p-4">
            <Card.Title><h3>Contact Us</h3></Card.Title>
            <p><strong>Phone:</strong> 1-800-555-1234</p>
            <p><strong>Email:</strong> support@mybank.com</p>
            <Button variant="primary">Live Chat</Button>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-lg p-4">
            <Card.Title><h3>FAQs</h3></Card.Title>
            <p>Find answers to common questions in our FAQ section.</p>
            <Button variant="primary" href="/faq">Visit FAQs</Button>
          </Card>
        </Col>
      </Row>
    </Container>
    <Footer />
  </div>
);

// Main App Component
const App = () => (
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
);

export default App;