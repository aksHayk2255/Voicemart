import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, 
  CreditCard, Smartphone, Banknote, Truck, AlertCircle 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [addressLine, setAddressLine] = useState('Flat 402, Sunshine Heights, Tech Park Road');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('560100');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [paymentMethod, setPaymentMethod] = useState('Simulated UPI / QR');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (cart.items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No items to checkout</h2>
        <p className="text-xs text-slate-500 mb-6">Your shopping cart is currently empty.</p>
        <Link to="/products" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Browse Catalog
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const shippingAddress = `${fullName}, ${addressLine}, ${city}, ${stateName} - ${pincode} (Ph: ${phone})`;
      const order = await api.orders.create({
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
      });

      setOrderSuccess(order);
      await refreshCart();

      // Launch joyful celebratory confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to place simulated order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (orderSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 sm:p-10 max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Order Confirmed (Simulated)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Order Reference ID: <strong className="text-slate-800 font-mono text-sm">{orderSuccess.order_number}</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left text-xs space-y-2 text-slate-600">
            <div className="flex justify-between font-semibold text-slate-900 pb-2 border-b border-slate-200/60">
              <span>Total Paid (Simulated):</span>
              <span className="text-indigo-600 text-sm">₹{orderSuccess.total_amount.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Shipping Destination:</span>
              <p className="text-slate-700">{orderSuccess.shipping_address}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Payment Mode:</span>
              <p className="text-slate-700">{orderSuccess.payment_method}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/orders"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Order History</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/products"
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/cart')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Simulated Checkout
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Academic Safety Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Safe Simulated Checkout Environment</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  This application does not collect real card details or initiate actual banking transactions. All orders are stored in the local SQLite database for demonstration.
                </p>
              </div>
            </div>

            {/* Shipping Address Form */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Select Simulated Payment Method
              </h2>

              <div className="space-y-2.5">
                {[
                  { id: 'Simulated UPI / QR', title: 'Simulated UPI / Google Pay / PhonePe', desc: 'Instant virtual payment authorization', icon: <Smartphone className="w-4 h-4" /> },
                  { id: 'Simulated Credit/Debit Card', title: 'Simulated Credit / Debit Card', desc: 'Test mock Visa / Mastercard flow', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'Simulated Cash on Delivery', title: 'Simulated Cash on Delivery (COD)', desc: 'Pay virtually upon demo package arrival', icon: <Banknote className="w-4 h-4" /> }
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === m.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.id}
                      checked={paymentMethod === m.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 accent-indigo-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                        {m.icon}
                        <span>{m.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Right Col: Order Breakdown */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sticky top-24 space-y-6">
              <h3 className="font-extrabold text-slate-900 text-base pb-3 border-b border-slate-100">
                Review & Confirm
              </h3>

              {/* Items preview list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <img src={item.product.image_url} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover bg-slate-50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">{item.product.name}</h4>
                      <p className="text-slate-500 text-[11px]">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-slate-900">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-indigo-600">₹{cart.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Place Simulated Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

