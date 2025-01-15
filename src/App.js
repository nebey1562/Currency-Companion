// Import necessary dependencies
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

const users = {
  user1: 'password1',
  user2: 'password2',
};

const userBalances = {
  user1: 1000,
  user2: 1500,
};

function Login({ setLoggedIn, setUsername, setBalance }) {
  const navigate = useNavigate();
  const [username, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (users[username] === password) {
      setLoggedIn(true);
      setUsername(username);
      setBalance(userBalances[username]);
      navigate('/home');
    } else {
      alert('Invalid username or password!');
    }
  };

  return (
    <div className="login-container">
      <h1 className="title">Currency Companion</h1>
      <h2 className="subtitle">Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setLocalUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

function Home({ username }) {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1 className="title">Welcome, {username}!</h1>
      <div className="nav-buttons">
        <button className="nav-button" onClick={() => navigate('/balance')}>Balance</button>
        <button className="nav-button" onClick={() => navigate('/payment')}>Payments</button>
        <button className="nav-button" onClick={() => navigate('/accounts')}>Accounts</button>
        <button className="nav-button" onClick={() => navigate('/deposits')}>Deposits</button>
      </div>
    </div>
  );
}

function Balance({ balance }) {
  const navigate = useNavigate();

  return (
    <div className="balance-container">
      <h1 className="title">Current Balance</h1>
      <p className="balance-text">Your balance is: ${balance}</p>
      <button className="back-button" onClick={() => navigate('/home')}>Back to Home</button>
    </div>
  );
}

function Payment({ balance, setBalance }) {
  const navigate = useNavigate();
  const [transactionAmount, setTransactionAmount] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');

  const handlePayment = () => {
    if (!recipient.trim()) {
      alert('Recipient name cannot be empty!');
    } else if (transactionAmount > 0 && transactionAmount <= balance) {
      setBalance(balance - transactionAmount);
      const message = `Transferred $${transactionAmount} to ${recipient}.`;
      setTransactionMessage(message);
      alert(message);
    } else {
      alert('Insufficient balance or invalid amount!');
    }
  };

  return (
    <div className="payment-container">
      <h1 className="title">Payments</h1>
      <input
        type="text"
        placeholder="Recipient Name"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount"
        value={transactionAmount}
        onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
      />
      <button className="nav-button" onClick={handlePayment}>Make Payment</button>
      {transactionMessage && <p className="transaction-message">{transactionMessage}</p>}
      <button className="back-button" onClick={() => navigate('/home')}>Back to Home</button>
    </div>
  );
}


function Accounts() {
  const navigate = useNavigate();

  return (
    <div className="accounts-container">
      <h1 className="title">Accounts</h1>
      <p className="info-text">Here you can view and manage your account details.</p>
      <button className="back-button" onClick={() => navigate('/home')}>Back to Home</button>
    </div>
  );
}

function Deposits() {
  const navigate = useNavigate();

  return (
    <div className="deposits-container">
      <h1 className="title">Deposits</h1>
      <p className="info-text">Here you can make deposits to your account.</p>
      <button className="back-button" onClick={() => navigate('/home')}>Back to Home</button>
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setLoggedIn={setLoggedIn} setUsername={setUsername} setBalance={setBalance} />} />
        {loggedIn && (
          <>
            <Route path="/home" element={<Home username={username} />} />
            <Route path="/balance" element={<Balance balance={balance} />} />
            <Route path="/payment" element={<Payment balance={balance} setBalance={setBalance} />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/deposits" element={<Deposits />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
