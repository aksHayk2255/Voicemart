import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, ShoppingCart, Check, ShieldCheck, Truck, RotateCcw, 
  Mic, Scale, ArrowLeft, Sparkles, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { Product, RecommendationItem } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { setCurrentProductId, openVoiceModal, processCommand } = useVoiceAssistant();

  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    const prodId = parseInt(id, 10);
    setCurrentProductId(prodId);

    async function loadDetails() {
      try {
        setLoading(true);
        const data = await api.products.get(prodId);
        setProduct(data);

        // Fetch related recommendations
        const recs = await api.assistant.recommendations({
          current_product_id: prodId,
          category_slug: data.category?.slug,
          limit: 4,
        });
        setRecommendations(recs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();

    return () => {
      setCurrentProductId(null);
    };
  }, [id, setCurrentProductId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading product specs...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">The requested product could not be located.</p>
        <Link to="/products" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Return to Products
        </Link>
      </div>
    );
  }

  let specifications: Record<string, string> = {};
  try {
    specifications = JSON.parse(product.specifications || '{}');
  } catch {
    specifications = {};
  }

  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Back */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/compare?ids=${product.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* Main Product Card Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-10 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left: Product Image */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 aspect-square flex items-center justify-center">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Spoken voice helper pill */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Try saying: <strong>&ldquo;Add this product to my cart&rdquo;</strong></span>
                </div>
                <button
                  onClick={() => {
                    openVoiceModal();
                    processCommand("Add this product to my cart");
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold"
                >
                  Speak
                </button>
              </div>
            </div>

            {/* Right: Details & Purchase Actions */}
            <div className="flex flex-col justify-between space-y-6">
              <div>
                {/* Brand & Category */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                    {product.brand}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">
                    {product.category?.name || 'Electronics'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Based on {product.rating_count} verified reviews
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
                  </span>
                </div>

                {/* Price block */}
                <div className="mt-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-base text-slate-400 line-through">
                      ₹{product.original_price.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Save ₹{(product.original_price! - product.price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 mt-6 leading-relaxed">
                  {product.description}
                </p>

                {/* Features Highlights */}
                <div className="grid grid-cols-3 gap-3 mt-6 text-center text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Truck className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                    <span>Free Fast Delivery</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                    <span>1-Year Warranty</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <RotateCcw className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                    <span>7-Day Replacement</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector & Add To Cart CTA */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock === 0}
                    className={`flex-1 py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                      addedSuccess
                        ? 'bg-emerald-600 text-white'
                        : product.stock === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-98'
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/compare?ids=${product.id}`)}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Compare</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Specifications Table */}
          {Object.keys(specifications).length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Detailed Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(specifications).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600">{key}</span>
                    <span className="text-slate-900 font-medium text-right max-w-xs">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Related AI Recommendations */}
        {recommendations.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Frequently Compared & Recommended
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map(({ product: p, reason }) => (
                <div key={p.id} className="flex flex-col">
                  <ProductCard product={p} />
                  <div className="mt-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] font-medium text-indigo-700 truncate">
                    {reason}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

