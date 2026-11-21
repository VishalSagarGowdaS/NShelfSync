import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Banknote, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [recipientName, setRecipientName] = useState(user?.fullName || 'Aarav Sharma');
  const [email, setEmail] = useState(user?.email || 'customer@shelfsync.com');
  const [phone, setPhone] = useState(user?.phone || '+919820012345');
  const [addressLine1, setAddressLine1] = useState('Flat 402, Sunshine Heights');
  const [addressLine2, setAddressLine2] = useState('Powai Vihar, Hiranandani');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400076');
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    }
  }, [isAuthenticated, navigate]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Your cart is empty</h2>
        <button
          onClick={() => navigate('/search')}
          className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-full text-xs font-bold"
        >
          Browse Catalogue
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    const shippingAddress = {
      recipientName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
    };

    try {
      // 1. Submit Order to Backend with Atomic Stock Reservation
      const res = await api.createOrder({
        shippingAddress,
        paymentMethod,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to initialize order');
      }

      const { order, payment } = res;

      // 2. Handle Payment
      if (paymentMethod === 'COD') {
        await refreshCart();
        navigate(`/payment-result?status=success&orderNumber=${order.orderNumber}&method=cod`);
        return;
      }

      // Razorpay Payment Flow
      if (payment) {
        if (typeof window.Razorpay !== 'undefined' && payment.keyId && !payment.keyId.includes('placeholder')) {
          // Open Live/Test Razorpay Modal
          const options = {
            key: payment.keyId,
            amount: payment.amount,
            currency: payment.currency,
            name: 'ShelfSync India',
            description: `Order #${payment.orderNumber}`,
            order_id: payment.razorpayOrderId,
            prefill: {
              name: recipientName,
              email: email,
              contact: phone,
            },
            theme: { color: '#2563EB' },
            handler: async function (response: any) {
              try {
                // Verify signature on backend
                const verifyRes = await api.verifyPayment({
                  orderId: order.id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });

                if (verifyRes.success) {
                  await refreshCart();
                  navigate(`/payment-result?status=success&orderNumber=${order.orderNumber}&method=razorpay`);
                } else {
                  navigate(`/payment-result?status=failed&orderNumber=${order.orderNumber}&error=Signature_Mismatch`);
                }
              } catch (verifyErr: any) {
                navigate(`/payment-result?status=failed&orderNumber=${order.orderNumber}&error=${encodeURIComponent(verifyErr.message)}`);
              }
            },
            modal: {
              ondismiss: function () {
                setIsProcessing(false);
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Simulated Sandbox Payment Verification when live keys aren't set
          const mockPaymentId = `pay_sim_${Date.now()}`;
          const mockSignature = `sig_test_${Date.now()}`;

          const verifyRes = await api.verifyPayment({
            orderId: order.id,
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: mockPaymentId,
            razorpaySignature: mockSignature,
          });

          if (verifyRes.success) {
            await refreshCart();
            navigate(`/payment-result?status=success&orderNumber=${order.orderNumber}&method=razorpay_simulated`);
          } else {
            throw new Error('Sandbox signature check failed');
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed. Please check stock and try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        Checkout & Payment
      </h1>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              1. Delivery Information (India)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Street Address / House No.</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Area / Landmark</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  disabled
                  value="India"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              2. Select Payment Method
            </h2>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="mt-1 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                      Razorpay Gateway (UPI, Cards, NetBanking)
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
                      Fastest
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pay securely using Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard, or Indian NetBanking.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'border-purple-600 bg-purple-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-purple-600"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-bold text-slate-900 flex items-center">
                    <Banknote className="w-4 h-4 mr-2 text-purple-600" />
                    Cash on Delivery (COD)
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Pay in cash or UPI QR scan upon package delivery at your doorstep.
                  </p>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Order Review */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6 h-fit shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-200">
            Review Order
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.items.map((it) => (
              <div key={it.item_id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800">{it.quantity}x</span>
                  <span className="text-slate-700 line-clamp-1 max-w-[150px]">{it.name}</span>
                </div>
                <span className="font-black text-slate-900">₹{it.total_item_price.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="font-bold">-₹{cart.discount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-bold text-slate-900">
                {cart.deliveryCharge === 0 ? 'FREE' : `₹${cart.deliveryCharge}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
              <span>Payable Total</span>
              <span className="text-blue-600">₹{cart.finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-black text-sm transition shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <span>Reserving Stock & Processing...</span>
            ) : (
              <>
                <span>Place Order (₹{cart.finalAmount.toLocaleString('en-IN')})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400">
            🔒 Stock will be reserved atomically in PostgreSQL and confirmed via Kafka.
          </p>
        </div>

      </form>
    </div>
  );
};
