import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mic, Search, Sparkles, ArrowRight, ShieldCheck, 
  Zap, ShoppingCart, Scale, Cpu, Headphones, Smartphone, 
  Laptop, Watch, Layers, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category, RecommendationItem } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isListening, 
    toggleListening, 
    interimTranscript, 
    transcript, 
    processCommand, 
    openVoiceModal 
  } = useVoiceAssistant();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendationItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [featRes, catRes, recRes] = await Promise.all([
          api.products.list({ featured: true, limit: 8 }),
          api.products.categories(),
          api.assistant.recommendations({ limit: 4 }),
        ]);
        setFeaturedProducts(featRes.products);
        setCategories(catRes);
        setRecommendedProducts(recRes);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const sampleCommands = [
    { label: "Find smartphones below ₹40,000", cmd: "Find smartphones below 40000 rupees" },
    { label: "Show laptops under ₹50,000", cmd: "Find laptops below 50000 rupees" },
    { label: "Show headphones under ₹2,000", cmd: "Show headphones under 2000" },
    { label: "Show the cheapest smartphones", cmd: "Show the cheapest smartphones" },
    { label: "Compare Samsung & Apple Flagships", cmd: "Compare Samsung Galaxy S24 and Apple iPhone 15" },
    { label: "What is my cart total?", cmd: "What is my cart total?" }
  ];

  const categoryIcons: Record<string, React.ReactNode> = {
    smartphones: <Smartphone className="w-6 h-6" />,
    laptops: <Laptop className="w-6 h-6" />,
    headphones: <Headphones className="w-6 h-6" />,
    smartwatches: <Watch className="w-6 h-6" />,
    accessories: <Cpu className="w-6 h-6" />,
    electronics: <Layers className="w-6 h-6" />
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. HERO SECTION WITH CENTRAL MICROPHONE FOCUS */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 border-b border-slate-200/60">
        
        {/* Subtle Decorative Background Blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            <span>Voice-First AI Conversational Shopping</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Your Shopping, Just a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Conversation Away
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 mb-10 leading-relaxed">
            Experience next-generation hands-free e-commerce. Search tech gadgets, filter by your exact budget, compare specifications, and manage your cart using natural voice commands.
          </p>

          {/* MAIN VISUAL FOCUS: LARGE GLOWING MICROPHONE BUTTON */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center">
              
              {/* Outer Pulsing Rings when active */}
              {isListening && (
                <>
                  <span className="absolute -inset-6 rounded-full bg-rose-400/20 animate-ping" />
                  <span className="absolute -inset-3 rounded-full bg-rose-500/30 animate-pulse" />
                </>
              )}

              <button
                onClick={() => {
                  toggleListening();
                }}
                className={`group relative z-10 flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-voice-pulse shadow-rose-300'
                    : 'bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-500 text-white shadow-indigo-300/80 hover:shadow-indigo-400/90 hover:scale-105'
                }`}
                title={isListening ? "Listening... Tap to stop" : "Tap and Speak Voice Command"}
              >
                <Mic className={`w-12 h-12 ${isListening ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
              </button>
            </div>

            {/* Live Voice Status Indicator */}
            <div className="mt-4 flex flex-col items-center">
              <span className={`text-sm font-bold tracking-wide transition-colors ${
                isListening ? 'text-rose-600 animate-pulse' : 'text-slate-800'
              }`}>
                {isListening ? 'Listening to you... Speak now' : 'Tap the microphone to start talking'}
              </span>

              {/* Real-time transcript display */}
              {(interimTranscript || transcript) && (
                <div className="mt-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-xs sm:text-sm font-medium shadow-sm max-w-lg">
                  &ldquo;{interimTranscript || transcript}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Quick Voice Command Chips */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3">
              Try clicking or saying any of these:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              {sampleCommands.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    openVoiceModal();
                    processCommand(item.cmd);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-full text-xs font-medium text-slate-700 hover:text-indigo-600 shadow-sm transition-all"
                >
                  &ldquo;{item.label}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Hero Search Bar Alternative */}
          <div className="mt-10 max-w-xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative shadow-md rounded-full">
              <input
                type="text"
                placeholder="Or type here (e.g. 'Sony headphones under 30000')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 text-sm bg-white border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-slate-900"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-sm transition-colors"
              >
                Search
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 2. POPULAR CATEGORIES */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Popular Categories
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Explore gadgets and tech categories hand-curated for modern lifestyles.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            Browse all products <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group relative bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                {categoryIcons[cat.slug] || <Layers className="w-6 h-6" />}
              </div>
              <h3 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Explore</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Featured Products
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Top picks loved by tech enthusiasts, creators, and power users.
              </p>
            </div>
            <Link
              to="/products?featured=true"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              View all featured <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-100 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. AI-RECOMMENDED PRODUCTS SECTION */}
      {recommendedProducts.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Recommended For You
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Personalized selections based on high customer ratings and feature benchmarks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map(({ product, reason }) => (
              <div key={product.id} className="flex flex-col">
                <ProductCard product={product} />
                <div className="mt-2 px-3 py-1 bg-indigo-50/80 border border-indigo-100 rounded-xl text-[11px] font-medium text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">{reason}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. HOW VOICEMART WORKS SECTION */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950 px-3 py-1 rounded-full border border-indigo-800">
              Conversational Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 tracking-tight">
              How VoiceMart Works
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">
              From spoken natural language to targeted e-commerce transactions in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 relative flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Speak Command</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Web Speech API captures your spoken words with real-time audio wave feedback and zero latency.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 relative flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/30 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">NLP Understanding</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our Python NLP service extracts intent, brand, categories, budget ranges, and sorting preferences automatically.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 relative flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Instant Answers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                VoiceMart queries the database, displays matched products, and speaks friendly voice responses using SpeechSynthesis.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 relative flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Hands-Free Cart</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Say &ldquo;Add to cart&rdquo; or &ldquo;What is my cart total?&rdquo; to complete your shopping journey seamlessly.
              </p>
            </div>

          </div>

          {/* Demonstration CTA banner */}
          <div className="mt-16 bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border border-indigo-700/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                Ready to experience hands-free shopping?
              </h3>
              <p className="text-xs text-indigo-200 mt-1">
                Explore the dedicated voice assistant page with live waveform visualizer.
              </p>
            </div>
            <Link
              to="/assistant"
              className="px-6 py-3 bg-white text-indigo-900 rounded-2xl text-sm font-bold shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 shrink-0"
            >
              <Mic className="w-4 h-4 text-indigo-600" />
              Open Voice Assistant
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};

