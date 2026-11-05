import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Filter, RotateCcw, Search, SlidersHorizontal, 
  Scale, Mic, Star, Sparkles, X, Check
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openVoiceModal } = useVoiceAssistant();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state from URL or defaults
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get('brand') || '');
  const [maxPrice, setMaxPrice] = useState<number>(Number(searchParams.get('max_price')) || 250000);
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get('rating')) || 0);
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort_by') || '');
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');

  // Comparison selection list
  const [comparedProductIds, setComparedProductIds] = useState<number[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedBrand(searchParams.get('brand') || '');
    if (searchParams.get('max_price')) setMaxPrice(Number(searchParams.get('max_price')));
    if (searchParams.get('rating')) setMinRating(Number(searchParams.get('rating')));
    if (searchParams.get('sort_by')) setSortBy(searchParams.get('sort_by') || '');
    if (searchParams.get('search')) setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Load Categories once
  useEffect(() => {
    api.products.categories().then(setCategories).catch(console.error);
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.products.list({
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        max_price: maxPrice < 250000 ? maxPrice : undefined,
        rating: minRating > 0 ? minRating : undefined,
        sort_by: sortBy || undefined,
        search: searchTerm || undefined,
        limit: 50,
      });
      setProducts(res.products);
      setTotalCount(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedBrand, maxPrice, minRating, sortBy, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Apply filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (maxPrice < 250000) params.set('max_price', String(maxPrice));
    if (minRating > 0) params.set('rating', String(minRating));
    if (sortBy) params.set('sort_by', sortBy);
    if (searchTerm) params.set('search', searchTerm);
    setSearchParams(params);
    setMobileFilterOpen(false);
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMaxPrice(250000);
    setMinRating(0);
    setSortBy('');
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  // Brand list options derived from products or common brands
  const brandsList = [
    "Apple", "Samsung", "Dell", "ASUS", "HP", "Sony", "boAt", "Bose", 
    "Logitech", "Google", "Xiaomi", "OnePlus", "Noise", "SanDisk", "LG"
  ];

  const handleCompareToggle = (p: Product) => {
    setComparedProductIds((prev) => {
      if (prev.includes(p.id)) {
        return prev.filter((id) => id !== p.id);
      } else {
        if (prev.length >= 3) {
          alert("You can compare up to 3 products at a time.");
          return prev;
        }
        return [...prev, p.id];
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Browse Products
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                {totalCount} Items
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Filter by budget, brand, and customer ratings, or use voice commands anytime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openVoiceModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            >
              <Mic className="w-4 h-4 text-indigo-600" />
              <span>Voice Filter</span>
            </button>

            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('sort_by', e.target.value);
                else p.delete('sort_by');
                setSearchParams(p);
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(selectedCategory || selectedBrand || maxPrice < 250000 || minRating > 0 || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 py-3">
            <span className="text-xs font-medium text-slate-400">Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                Category: {selectedCategory}
                <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setSelectedCategory('')} />
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                Brand: {selectedBrand}
                <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setSelectedBrand('')} />
              </span>
            )}
            {maxPrice < 250000 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                Budget: ≤ ₹{maxPrice.toLocaleString('en-IN')}
                <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setMaxPrice(250000)} />
              </span>
            )}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                ⭐ {minRating}+
                <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setMinRating(0)} />
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                Search: &ldquo;{searchTerm}&rdquo;
                <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setSearchTerm('')} />
              </span>
            )}
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 ml-2"
            >
              <RotateCcw className="w-3 h-3" /> Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
          
          {/* Desktop Filters Sidebar */}
          <aside className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} md:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm h-fit sticky top-24`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                Refine Selection
              </h3>
              <button
                onClick={handleReset}
                title="Reset filters"
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Search Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Ultra, Noise Cancelling"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Categories
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === '' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedCategory === c.slug ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:bg-white focus:border-indigo-400"
              >
                <option value="">All Brands</option>
                {brandsList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Budget Limit</span>
                <span className="text-indigo-600 font-bold">
                  {maxPrice >= 250000 ? 'Any Price' : `Up to ₹${maxPrice.toLocaleString('en-IN')}`}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="250000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹1k</span>
                <span>₹50k</span>
                <span>₹1.5L</span>
                <span>₹2.5L+</span>
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Customer Rating
              </label>
              <div className="flex gap-1">
                {[0, 4, 4.5, 4.8].map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setMinRating(rt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                      minRating === rt
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {rt === 0 ? 'All' : (
                      <>
                        <span>{rt}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all"
            >
              Apply Filters
            </button>
          </aside>

          {/* Products Grid */}
          <main className="md:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 h-80 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No products matched your criteria</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Try broadening your price limit or clearing active brand filters. You can also ask our AI assistant to find alternatives.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={openVoiceModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Ask Assistant
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onCompareToggle={handleCompareToggle}
                    isCompared={comparedProductIds.includes(p.id)}
                  />
                ))}
              </div>
            )}
          </main>

        </div>

      </div>

      {/* Floating Comparison Drawer (Bottom bar if products selected) */}
      {comparedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700 animate-slide-up">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>{comparedProductIds.length} / 3 Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/compare?ids=${comparedProductIds.join(',')}`)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
            >
              <span>Compare Now</span>
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setComparedProductIds([])}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Clear comparison list"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

