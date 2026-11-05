import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, ShoppingBag, ArrowRight, ArrowLeft, 
  ShieldCheck, Sparkles, Mic, Tag 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { openVoiceModal, processCommand } = useVoiceAssistant();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Sign in to view your cart</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          Your saved items and voice shopping cart are synchronized across your devices.
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
        >
          Sign in to VoiceMart
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 bg-slate-50 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 text-slate-300 flex items-center justify-center mb-4 shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Your cart is empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          Looks like you haven&apos;t added any tech items yet. Try speaking a voice command or browsing products.
        </p>
        <div className="flex gap-3">
          <Link
            to="/products"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            Explore Catalog
          </Link>
          <button
            onClick={() => {
              openVoiceModal();
              processCommand("Find smartphones below 40000 rupees");
            }}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Mic className="w-4 h-4 text-indigo-600" />
            <span>Voice Search</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-indigo-600" />
              Shopping Cart
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                {cart.item_count} Items
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review your items or ask VoiceMart: &ldquo;What is my cart total?&rdquo;
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Entire Cart</span>
          </button>
        </div>

        {/* Main Grid: Items List + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Voice command suggestion chip */}
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Try voice control: <strong>&ldquo;Remove the first product from my cart&rdquo;</strong></span>
              </div>
              <button
                onClick={() => {
                  openVoiceModal();
                  processCommand("What is my cart total?");
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold"
              >
                Speak Total
              </button>
            </div>

            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {item.product.brand}
                    </span>
                    <Link
                      to={`/products/${item.product.id}`}
                      className="block font-bold text-sm text-slate-900 hover:text-indigo-600 line-clamp-1 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ₹{item.product.price.toLocaleString('en-IN')} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 self-end sm:self-center">
                  
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-900">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            ))}

            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Order Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sticky top-24 space-y-6">
              <h3 className="font-extrabold text-slate-900 text-base pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.item_count} items)</span>
                  <span className="font-semibold text-slate-900">
                    ₹{cart.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Discount Savings
                    </span>
                    <span className="font-bold">-₹{cart.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-indigo-600">₹{cart.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Simulated Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Simulated Checkout Guarantee</span>
                </div>
                <p>
                  No real payments or credit cards required. Safe academic environment.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

