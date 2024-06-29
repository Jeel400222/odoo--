import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const PaymentForm = () => {
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/payment', { token, amount });
      setMessage(response.data.message);
    } catch (err) {
      setMessage('Payment failed');
    }
  };

  return (
    <div className="container">
      <h1>Payment Form</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="card-element">Credit or debit card</label>
          <div id="card-element">
            A card form will be here
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Pay Now
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default PaymentForm;