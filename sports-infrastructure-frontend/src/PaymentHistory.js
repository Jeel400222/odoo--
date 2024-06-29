
import React from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const PaymentHistory = () => {
  const [payments, setPayments] = React.useState([]);

  React.useEffect(() => {
    const fetchPayments = async () => {
      const response = await axios.get('/payment');
      setPayments(response.data);
    };
    fetchPayments();
  }, []);

  return (
    <div className="container">
      <h1>Payment History</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Status</th>
            <th>Processed On</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment._id}>
              <td>{payment.amount}</td>
              <td>{payment.status}</td>
              <td>{payment.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistory;