import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Scale, Volume2, Plus, X, Sparkles, Check, 
  ShoppingCart, Star, ArrowRight, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { Product, ComparisonResponse } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { speakText, stopSpeaking, isSpeaking } = useVoiceAssistant();

  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync selected IDs from URL query params
  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const parsed = idsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
      setSelectedIds(parsed);
    } else {
      // Default initial comparison: Samsung Galaxy S24 and iPhone 15 Pro
      setSelectedIds([1, 2]);
      setSearchParams({ ids: '1,2' });
    }
  }, [searchParams, setSearchParams]);

  // Load all products for the add modal
  useEffect(() => {
    api.products.list({ limit: 50 }).then((res) => setAllProducts(res.products)).catch(console.error);
  }, []);

  // Fetch comparison data whenever selectedIds change
  useEffect(() => {
    if (selectedIds.length === 0) {
      setComparison(null);
      setLoading(false);
      return;
    }

    async function loadComparison() {
      try {
        setLoading(true);
        const data = await api.assistant.compare(selectedIds);
        setComparison(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [selectedIds]);

  const removeProduct = (id: number) => {
    const updated = selectedIds.filter((pId) => pId !== id);
    setSelectedIds(updated);
    setSearchParams(updated.length ? { ids: updated.join(',') } : {});
  };

  const addProduct = (id: number) => {
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= 4) {
      alert("You can compare up to 4 products simultaneously.");
      return;
    }
    const updated = [...selectedIds, id];
    setSelectedIds(updated);
    setSearchParams({ ids: updated.join(',') });
    setShowAddModal(false);
  };

  const handleHearComparison = () => {
    if (!comparison) return;
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(comparison.spoken_summary);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Scale className="w-7 h-7 text-indigo-600" />
              Product Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Side-by-side specifications, prices, and automated value-for-money verdict.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {comparison && (
              <button
                onClick={handleHearComparison}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                  isSpeaking
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeaking ? 'Playing Audio...' : 'Hear Spoken Verdict'}</span>
              </button>
            )}

            {selectedIds.length < 4 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Verdict Banner */}
        {comparison && comparison.verdict && (
          <div className="mt-6 p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl shadow-lg border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>VoiceMart AI Recommendation Verdict</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {comparison.verdict}
              </p>
            </div>

            <button
              onClick={handleHearComparison}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Listen
            </button>
          </div>
        )}

        {/* Comparison Table */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 mt-6 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-600">Comparing specifications matrix...</p>
          </div>
        ) : !comparison || comparison.products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 mt-6 text-center max-w-md mx-auto">
            <Scale className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">No Products Selected</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Select at least two products to inspect their differences and value-for-money rating.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
            >
              Select Products to Compare
            </button>
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="p-4 sm:p-6 w-48 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Feature / Attribute
                  </th>
                  {comparison.products.map((p) => {
                    const isBetterValue = comparison.better_value_product_id === p.id;
                    return (
                      <th key={p.id} className="p-4 sm:p-6 min-w-[220px] align-top relative">
                        {isBetterValue && (
                          <div className="mb-2 inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold tracking-wide uppercase">
                            <Sparkles className="w-3 h-3 text-emerald-600" /> Better Value
                          </div>
                        )}

                        <div className="relative group">
                          <button
                            onClick={() => removeProduct(p.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-full text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
                            title="Remove from comparison"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-36 object-cover rounded-xl bg-slate-100 border border-slate-100 mb-3"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            {p.brand}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mt-0.5">
                            {p.name}
                          </h4>
                          <div className="text-base font-extrabold text-slate-900 mt-1">
                            ₹{p.price.toLocaleString('en-IN')}
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={async () => {
                                if (!isAuthenticated) {
                                  navigate('/login');
                                  return;
                                }
                                await addToCart(p.id, 1);
                                speakText(`Added ${p.name} to cart.`);
                              }}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                            <Link
                              to={`/products/${p.id}`}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                            >
                              Specs
                            </Link>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {comparison.features.map((f, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="p-4 sm:p-6 font-semibold text-slate-700 whitespace-nowrap">
                      {f.feature_name}
                    </td>
                    {comparison.products.map((p) => {
                      const val = f.values[p.id] || '—';
                      const isBetterValue = comparison.better_value_product_id === p.id;
                      return (
                        <td
                          key={p.id}
                          className={`p-4 sm:p-6 font-medium text-slate-800 ${
                            isBetterValue ? 'bg-indigo-50/20' : ''
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Select Product to Compare</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search products by title or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mt-4 px-4 py-2.5 text-xs bg-slate-100 rounded-xl outline-none focus:bg-white focus:border-indigo-400 border border-transparent"
            />

            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {allProducts
                .filter((p) => !selectedIds.includes(p.id) && (
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.brand.toLowerCase().includes(searchQuery.toLowerCase())
                ))
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addProduct(p.id)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-white" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">{p.name}</h4>
                        <p className="text-[11px] font-bold text-indigo-600">₹{p.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-1 rounded-md border border-indigo-200">
                      + Add
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
