import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle2, Truck, ArrowRight, 
  ExternalLink, ShoppingBag, ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await api.orders.list();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      case 'confirmed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase">
            <Clock className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="pb-6 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600" />
            Your Order History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and view previous purchases placed via voice or web checkout.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 mt-6 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-600">Retrieving order logs...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 mt-6 text-center max-w-md mx-auto">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">No orders yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              You haven&apos;t placed any orders yet. Try asking VoiceMart for recommendations!
            </p>
            <Link
              to="/products"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{order.order_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Placed On</span>
                      <span className="font-medium text-slate-700">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Amount</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items List */}
                <div className="p-4 sm:p-6 divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 line-clamp-1">{item.product_name}</h4>
                          <p className="text-slate-500 text-[11px]">
                            Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-slate-900">
                        ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer Details */}
                <div className="px-4 py-3 sm:px-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>Ship To: <strong className="text-slate-700">{order.shipping_address}</strong></span>
                  <span className="font-mono text-emerald-600 font-semibold">{order.payment_status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

