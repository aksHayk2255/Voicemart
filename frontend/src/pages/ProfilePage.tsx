import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User as UserIcon, Mail, ShieldAlert, Calendar, 
  Package, ShoppingCart, Mic, Sparkles, LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-md shadow-indigo-200">
              {user.username.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {user.full_name || user.username}
                </h1>
                {isAdmin ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    Member
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/cart"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Cart</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">{cart.item_count} Items</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/orders"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">Order Logs</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">Track Orders</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/assistant"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">Voice Assistant</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">Conversations</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
          </Link>
        </div>

        {/* Admin Shortcut if applicable */}
        {isAdmin && (
          <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Administrator Console</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                You have elevated permissions to add products, modify stock, and view all orders.
              </p>
            </div>
            <Link
              to="/admin"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Open Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

