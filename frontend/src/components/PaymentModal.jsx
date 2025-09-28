import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const PaymentModal = ({ milestone, isOpen, onClose, onPaymentSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const handlePayment = async () => {
    try {
      setProcessing(true);

      // Create payment order
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payments/milestone/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ milestoneId: milestone._id })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Initialize Razorpay payment with minimal config to show all default methods
      const options = {
        key: 'rzp_test_RKKI5YvBWNfh2o', // Use direct test key to ensure it's working
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'WebSphere Payments',
        description: `Payment for milestone: ${milestone.title}`,
        order_id: data.data.orderId,
        // Standard Razorpay config that should show UPI
        method: {
          upi: true,
          card: true,
          netbanking: true,  
          wallet: true
        },
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch('http://localhost:5000/api/payments/milestone/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                milestone_id: milestone._id
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast.success('Payment completed successfully!');
              onPaymentSuccess(verifyData.data);
              onClose();
            } else {
              throw new Error(verifyData.message);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        },
        theme: {
          color: '#3B82F6'
        }
      };

      console.log('Razorpay options:', options);
      console.log('Razorpay key being used:', options.key);
      console.log('Payment amount in paise:', options.amount);
      console.log('Payment amount in rupees:', options.amount / 100);
      
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', async function (response) {
        console.error('Payment failed:', response.error);
        
        // Handle UPI-specific errors
        let errorMessage = response.error.description;
        if (response.error.code === 'BAD_REQUEST_ERROR' && response.error.description.includes('UPI')) {
          errorMessage = 'UPI payment failed. Please try using a different UPI ID or payment method.';
        } else if (response.error.code === 'BAD_REQUEST_ERROR' && response.error.description.includes('VPA')) {
          errorMessage = 'Invalid UPI ID. Please check and try again.';
        }
        
        toast.error(`Payment failed: ${errorMessage}`);
        
        // Report failure to backend
        await fetch('http://localhost:5000/api/payments/milestone/failure', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: data.data.orderId,
            reason: response.error.description,
            errorCode: response.error.code
          })
        });
        
        setProcessing(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Complete Milestone Payment</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-lg mb-2">{milestone.title}</h4>
          <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Payment Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              {milestone.currency} {milestone.amount}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Payment Method</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <img 
                  src="/razorpay-logo.png" 
                  alt="Razorpay" 
                  className="h-6 mr-2"
                  onError={(e) => {e.target.style.display = 'none'}}
                />
                <span>Razorpay (Cards, UPI, Net Banking, Wallets, EMI, Pay Later)</span>
              </div>
            </label>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>Your payment is processed securely through Razorpay. Choose from multiple payment options including credit/debit cards, UPI (PhonePe, GPay, Paytm), net banking, digital wallets, EMI, and pay later options. The amount will be released to the freelancer once you confirm milestone completion.</p>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">🧪</span>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Test Mode Instructions</p>
              <p>For UPI testing in sandbox mode, use these test UPI IDs:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>success@razorpay</strong> - Simulates successful payment</li>
                <li><strong>failure@razorpay</strong> - Simulates failed payment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              `Pay ${milestone.currency} ${milestone.amount}`
            )}
          </button>
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>By proceeding, you agree to our Terms of Service and Payment Policy</p>
        </div>
      </div>
    </div>
  );
};

const PaymentHistory = ({ workspaceId, isOpen, onClose }) => {
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/payments/workspace/${workspaceId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPaymentHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && workspaceId) {
      fetchPaymentHistory();
    }
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Payment History</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : paymentHistory ? (
          <div>
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{paymentHistory.totalPaid}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {paymentHistory.paymentCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {paymentHistory.payments.map((payment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{payment.title}</h4>
                    <span className="text-green-600 font-bold">
                      {payment.currency} {payment.amount}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Paid on: {new Date(payment.paidDate).toLocaleDateString()}</p>
                    {payment.paymentDetails?.method && (
                      <p>Method: {payment.paymentDetails.method.toUpperCase()}</p>
                    )}
                    {payment.paymentDetails?.razorpay_payment_id && (
                      <p className="font-mono text-xs">
                        ID: {payment.paymentDetails.razorpay_payment_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {paymentHistory.payments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">💳</div>
                <p>No payments made yet</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Failed to load payment history
          </div>
        )}
      </div>
    </div>
  );
};

export { PaymentModal, PaymentHistory };