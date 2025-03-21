import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { Navbar, Nav, NavDropdown, Container, Button, Row, Col, Card } from 'react-bootstrap';
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
const CustomNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="custom-navbar" style={{ height: '50px' }}>
      <Container>
        <Navbar.Brand href="/home" style={{ fontSize: '1.2rem' }}>MyBank</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="Accounts" id="accounts-dropdown">
              <NavDropdown.Item style={{ color: 'black' }}>Savings Account</NavDropdown.Item>
              <NavDropdown.Item style={{ color: 'black' }}>Current Account</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Loans" id="loans-dropdown">
              <NavDropdown.Item style={{ color: 'black' }}>Home Loan</NavDropdown.Item>
              <NavDropdown.Item style={{ color: 'black' }}>Personal Loan</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Cards" id="cards-dropdown">
              <NavDropdown.Item style={{ color: 'black' }}>Credit Cards</NavDropdown.Item>
              <NavDropdown.Item style={{ color: 'black' }}>Debit Cards</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link href="/faq">FAQ</Nav.Link>
            <Nav.Link href="/contact-us">Contact Us</Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            <NavDropdown title="Profile" id="profile-dropdown" align="end">
              <NavDropdown.Item style={{ color: 'black' }}>Settings</NavDropdown.Item>
              <NavDropdown.Item style={{ color: 'red' }}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};


// Hero Section Component
const HeroSection = () => (
  <header className="bg-primary text-white text-center py-5">
    <div className="container">
      <h1>Welcome to MyBank</h1>
      <p>Your Trusted Banking Partner</p>
      <a href="/home" className="btn btn-light mt-3">Explore Services</a>
    </div>
  </header>
);

// Promotional Banner
const PromotionalBanner = () => (
  <div className="alert alert-info text-center" role="alert">
    Get 10% cashback on all online transactions this month!
  </div>
);

// Features Section
const Features = () => (
  <section className="container my-5">
    <h2 className="text-center mb-4">Our Services</h2>
    <div className="row text-center">
      <div className="col-md-4">
        <div className="card p-3 shadow">
          <h4>Online Banking</h4>
          <p>Manage your accounts anytime, anywhere.</p>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card p-3 shadow">
          <h4>Secure Transactions</h4>
          <p>Top-notch security for safe transactions.</p>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card p-3 shadow">
          <h4>Instant Loans</h4>
          <p>Quick loan approvals with minimal paperwork.</p>
        </div>
      </div>
    </div>
  </section>
);
const AdditionalSections = () => {
  return (
    <Container className="my-5">
      <Row>
        <Col md={4}>
          <h4>Offers for You</h4>
          <Card className="p-3 shadow">
            <h5>Best in Class</h5>
            <p>Credit Cards with exclusive rewards.</p>
          </Card>
          <Card className="p-3 shadow mt-3">
            <h5>NRI Forex Rates</h5>
            <p>Best exchange rates for NRI customers.</p>
          </Card>
        </Col>
        <Col md={4}>
          <h4>Need Help?</h4>
          <Card className="p-3 shadow">
            <p>Customer Services</p>
            <p>Interest Rates</p>
            <p>Fraud Awareness</p>
            <p>Credit Card Services</p>
            <p>Report Disputed Transactions</p>
          </Card>
        </Col>
        <Col md={4}>
          <h4>Insta Services</h4>
          <Card className="p-3 shadow">
            <h5>Debit Card Instant Pin</h5>
            <p>Set your debit card PIN instantly.</p>
          </Card>
          <Card className="p-3 shadow mt-3">
            <h5>Address Change</h5>
            <p>Update your mailing or permanent address.</p>
          </Card>
          <Card className="p-3 shadow mt-3">
            <h5>Account Transfer</h5>
            <p>Transfer your bank account to another branch.</p>
          </Card>
        </Col>
      </Row>
      <Row className="mt-5">
        <Col>
          <h4>Calculators For Your Needs</h4>
          <Card className="p-3 shadow">
            <h5>Personal Loan EMI Calculator</h5>
            <p>Calculate your monthly loan outgo.</p>
          </Card>
          <Card className="p-3 shadow mt-3">
            <h5>Home Loan EMI Calculator</h5>
            <p>Calculate your monthly expense for a home loan.</p>
          </Card>
          <Card className="p-3 shadow mt-3">
            <h5>RD Calculator</h5>
            <p>Start small, save regularly with great interest rates.</p>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Footer Component
const Footer = () => (
  <footer className="bg-dark text-white text-center py-3">
    <p>&copy; 2025 MyBank. All Rights Reserved.</p>
    <p><a href="#" className="text-light">Privacy Policy</a> | <a href="#" className="text-light">Terms of Service</a></p>
  </footer>
);

// Home Component with Voice Navigation
const Home = () => {
  const navigate = useNavigate();
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const homeContentRef = useRef(null);

  const handleStartListening = () => {
    SpeechRecognition.startListening({ continuous: true });
    setIsListening(true);
  };

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
      <CustomNavbar />
      <HeroSection />
      <Features />
      <AdditionalSections />
      <p className="text-center">Voice Commands: "Account" | "Transfer" | "Balance" | "Go Back"</p>
      {!isListening ? (
        <button className="btn btn-primary" onClick={handleStartListening}>Activate Voice Navigation</button>
      ) : (
        <p className="text-center text-success">Listening...</p>
      )}
      <Footer />
    </div>
  );
};

// Account, Transfer, and Balance Pages
const Account = () => (
  <>
    <CustomNavbar />
    <VoiceBack />
    <h2 className="text-center my-4">Account Details</h2>
  </>
);

const Transfer = () => (
  <>
    <CustomNavbar />
    <VoiceBack />
    <h2 className="text-center my-4">Transfer Funds</h2>
  </>
);

const Balance = () => {
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    axios.get("https://currencycompanionbackend4-7j9lrghaz-binsus-projects.vercel.app/api/get-user?account_number=647834894")
      .then((response) => setUserData(response.data))
      .catch((err) => console.error("Error fetching balance:", err));
  }, []);

  return (
    <>
      <CustomNavbar />
      <VoiceBack />
      <div className="container text-center">
        <h2>Balance Inquiry</h2>
        {userData ? (
          <p><strong>Balance:</strong> {userData.account_balance}</p>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </>
  );
};

// Voice Authentication Component
const VoiceAuth = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const handleVerify = () => {
    setMessage('Verification successful! Redirecting...');
    setTimeout(() => navigate('/home'), 1500);
  };

  return (
    <div className="container text-center">
      <CustomNavbar />
      <HeroSection />
      <PromotionalBanner />
      <Features />
      <AdditionalSections />
      <h1>Voice Authentication</h1>
      <p>Press Verify to authenticate.</p>
      <button className="btn btn-primary" onClick={handleVerify}>Verify</button>
      {message && <p>{message}</p>}
    </div>
  );
};

// App Component with Routing
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
