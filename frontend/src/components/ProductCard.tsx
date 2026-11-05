import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Check, Scale } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onCompareToggle?: (product: Product) => void;
  isCompared?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onCompareToggle,
  isCompared = false,
}) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setIsAdding(true);
      await addToCart(product.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompareToggle) {
      onCompareToggle(product);
    } else {
      // Navigate to compare page with this product id
      navigate(`/compare?ids=${product.id}`);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Badges Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {discountPercent > 0 ? (
          <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {discountPercent}% OFF
          </span>
        ) : <span />}

        {product.is_featured && (
          <span className="bg-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
            Featured
          </span>
        )}
      </div>

      {/* Image Container */}
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden bg-slate-50 pt-[80%]">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e: any) => {
            // Fallback placeholder image if Unsplash fails
            e.currentTarget.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-indigo-600">{product.brand}</span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-400 font-normal">({product.rating_count})</span>
            </div>
          </div>

          {/* Product Name */}
          <Link to={`/products/${product.id}`} className="block">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 text-sm leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Short description */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            {product.original_price && product.original_price > product.price && (
              <div className="text-xs text-slate-400 line-through">
                ₹{product.original_price.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Compare Toggle */}
            <button
              onClick={handleCompareClick}
              title={isCompared ? "Remove from comparison" : "Add to comparison"}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                isCompared
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding || product.stock === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : product.stock === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{product.stock === 0 ? 'Out' : 'Add'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

