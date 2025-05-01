import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, NavDropdown, Container, Row, Col, Card, Table } from 'react-bootstrap';
import './App.css';

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

// TTS Player Component with Unified Voice Input
const TTSPlayer = ({ startAudio, setStartAudio, ttsText, onPromptAnswered, onCommand, onYes }) => {
  const location = useLocation();
  const audioRef = useRef(null);
  const { transcript, interimTranscript, finalTranscript, resetTranscript, listening } = useSpeechRecognition();
  const [isPrompting, setIsPrompting] = useState(false);
  const [shouldPlayContent, setShouldPlayContent] = useState(false);
  const [promptTimeout, setPromptTimeout] = useState(null);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isMounted, setIsMounted] = useState(true);
  const commandTimeoutRef = useRef(null);

  // Reset audio element
  const resetAudio = (audioElement) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement.load();
      console.log('TTSPlayer: Audio reset');
    }
  };

  // Play audio (prompt, content, or custom text)
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
        }, 100); // Slight delay to avoid AbortError
      }
    } catch (error) {
      console.error('TTSPlayer: Error fetching audio:', error);
      if (text === '/prompt') {
        onPromptAnswered?.();
      }
    }
  };

  // Start continuous listening with interim results
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

  // Handle prompt phase
  useEffect(() => {
    if (!isMounted) return;
    if (startAudio && !isPrompting && !shouldPlayContent && !ttsText) {
      console.log('TTSPlayer: Starting prompt phase for', location.pathname);
      setIsPrompting(true);
      playAudio('/prompt');
      // Set timeout for no response
      const timeout = setTimeout(() => {
        console.log('TTSPlayer: Prompt timeout, stopping prompt phase');
        setIsPrompting(false);
        setStartAudio(false);
        resetTranscript();
        onPromptAnswered?.();
      }, 15000); // 15 seconds
      setPromptTimeout(timeout);
    } else if (startAudio && ttsText) {
      console.log('TTSPlayer: Playing custom TTS for', ttsText);
      playAudio(ttsText);
    }
    return () => {
      if (promptTimeout) clearTimeout(promptTimeout);
    };
  }, [startAudio, isPrompting, shouldPlayContent, ttsText, location.pathname, onPromptAnswered, setStartAudio, isMounted]);

  // Handle voice input
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

  // Process interim commands with timeout
  useEffect(() => {
    if (!isMounted) return;
    if (currentCommand && !isPrompting) {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = setTimeout(() => {
        console.log('TTSPlayer: Processing interim command:', currentCommand);
        onCommand?.(currentCommand);
        setCurrentCommand('');
        resetTranscript();
      }, 2000); // Wait 2 seconds for full phrase
    }
    return () => {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
  }, [currentCommand, onCommand, resetTranscript, isMounted]);

  // Play content audio if user said "yes"
  useEffect(() => {
    if (!isMounted) return;
    if (shouldPlayContent) {
      console.log('TTSPlayer: Fetching content audio for', location.pathname);
      playAudio(location.pathname);
    }
  }, [shouldPlayContent, location.pathname, isMounted]);

  // Cleanup on unmount or page change
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('HeroSection: Cleaned up keydown listener');
    };
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

// Footer Component
const Footer = () => (
  <footer className="bg-dark text-white text-center py-3">
    <p>© 2025 MyBank. All Rights Reserved.</p>
    <p>
      <a href="/privacy-policy" className="text-light">Privacy Policy</a> |{' '}
      <a href="/terms-of-service" className="text-light">Terms of Service</a>
    </p>
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('VoiceAuth: Cleaned up keydown listener');
    };
  }, [handleVerify, startAudio, playContent]);

  // Debug button to simulate voice commands
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

// Account Page with Static Data
const Account = () => {
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    // Static account details
    setAccountDetails({
      account_number: '647834894',
      account_type: 'Savings',
      balance: 5000.0,
    });

    // Static transaction data
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('Account: Cleaned up keydown listener');
    };
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
      <Container className="my-4">
        <h2 className="text-center mb-4">Account Details</h2>
        {accountDetails ? (
          <Card className="p-4 mb-4 shadow">
            <h4>Account Information</h4>
            <p><strong>Account Number:</strong> {accountDetails.account_number}</p>
            <p><strong>Account Type:</strong> {accountDetails.account_type}</p>
            <p><strong>Current Balance:</strong> ${accountDetails.balance.toFixed(2)}</p>
          </Card>
        ) : (
          <p>Loading account details...</p>
        )}
        <h3 className="mb-3">Recent Transactions</h3>
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
      </Container>
      <Footer />
    </>
  );
};

// Transfer Page with Voice Command Flow
const Transfer = () => {
  const navigate = useNavigate();
  const [startAudio, setStartAudio] = useState(false);
  const [isPromptAnswered, setIsPromptAnswered] = useState(false);
  const [transferState, setTransferState] = useState('initial'); // initial, confirm, amount, account, completed
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('Transfer: Cleaned up keydown listener');
    };
  }, [startAudio, playContent]);

  // Trigger transfer flow after TTS prompt
  useEffect(() => {
    if (isPromptAnswered && transferState === 'initial') {
      setTransferState('confirm');
      setTtsText('Do you want to transfer funds?');
      setMessage('Do you want to transfer funds?');
    }
  }, [isPromptAnswered, transferState]);

  // Handle transfer flow
  useEffect(() => {
    if (transferState === 'amount') {
      setTtsText('Please say the amount to transfer.');
      setMessage('Please say the amount to transfer.');
    } else if (transferState === 'account') {
      setTtsText('Please say the account number.');
      setMessage('Please say the account number.');
    } else if (transferState === 'completed') {
      const confirmation = `Transfer of ${transferAmount} to account ${accountNumber} completed.`;
      setTtsText(confirmation);
      setMessage(confirmation);
    }
  }, [transferState, transferAmount, accountNumber]);

  const handleCommand = useCallback(
    (command) => {
      console.log('Transfer: Received command:', command);
      if (command.includes('go home') || command.includes('go to home') || command.includes('go back')) {
        console.log('Transfer: Navigating to /home');
        navigate('/home');
        setTransferState('initial');
        setTtsText('');
        return;
      }
      if (transferState === 'confirm' && command.includes('yes')) {
        console.log('Transfer: User confirmed, asking for amount');
        setTransferState('amount');
      } else if (transferState === 'amount') {
        const amount = command.match(/\d+(\.\d+)?/)?.[0] || command;
        console.log('Transfer: Amount captured:', amount);
        setTransferAmount(amount);
        setTransferState('account');
      } else if (transferState === 'account') {
        console.log('Transfer: Account number captured:', command);
        setAccountNumber(command);
        setTransferState('completed');
      }
    },
    [navigate, transferState]
  );

  const handleYes = useCallback(() => {
    console.log('Transfer: Handling yes command');
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
      <Container className="text-center my-4">
        <h2>Transfer Funds</h2>
        <p>{message}</p>
      </Container>
      <Footer />
    </>
  );
};

// Balance Page with Static Data
const Balance = () => {
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [startAudio, setStartAudio] = useState(false);
  const [playContent, setPlayContent] = useState(false);

  useEffect(() => {
    // Static account details
    setAccountDetails({
      account_holder: 'Eben Smith',
      account_number: '647834894',
      balance: 5000.0,
    });

    // Static last transaction
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('Balance: Cleaned up keydown listener');
    };
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
      <Container className="text-center my-4">
        <h2>Balance Inquiry</h2>
        {accountDetails ? (
          <Card className="p-4 shadow">
            <h4>Account Summary</h4>
            <p><strong>Account Holder:</strong> {accountDetails.account_holder}</p>
            <p><strong>Account Number:</strong> {accountDetails.account_number}</p>
            <p><strong>Available Balance:</strong> ${accountDetails.balance.toFixed(2)}</p>
            {lastTransaction && (
              <p><strong>Last Transaction:</strong> {lastTransaction.description} (${lastTransaction.amount.toFixed(2)}) on {lastTransaction.date}</p>
            )}
          </Card>
        ) : (
          <p>Loading account details...</p>
        )}
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
      <Route path="/faq" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">FAQ</h2><Footer /></div>} />
      <Route path="/contact-us" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">Contact Us</h2><Footer /></div>} />
      <Route path="/privacy-policy" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">Privacy Policy</h2><Footer /></div>} />
      <Route path="/terms-of-service" element={<div><CustomNavbar /><TTSPlayer startAudio={false} setStartAudio={() => {}} onCommand={() => {}} onYes={() => {}} /><h2 className="text-center my-4">Terms of Service</h2><Footer /></div>} />
    </Routes>
  </Router>
);

export default App;