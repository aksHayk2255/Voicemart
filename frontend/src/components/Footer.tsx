import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, ShieldCheck, Sparkles, Scale, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Mic className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Voice<span className="text-indigo-400">Mart</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your conversational e-commerce companion. Browse, filter by budget, compare devices, and checkout hands-free using natural voice commands.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-3 py-2 rounded-lg">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Voice AI & Rule-based Recommendation Engine</span>
            </div>
          </div>

          {/* Voice Commands Cheat Sheet */}
          <div className="md:col-span-1 space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
              Try Saying
            </h4>
            <ul className="text-xs space-y-2 text-slate-400">
              <li className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-indigo-300">
                &ldquo;Show Samsung phones&rdquo;
              </li>
              <li className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-indigo-300">
                &ldquo;Find laptops below 50000 rupees&rdquo;
              </li>
              <li className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-indigo-300">
                &ldquo;Show the cheapest smartphones&rdquo;
              </li>
              <li className="bg-slate-800/80 p-2 rounded border border-slate-700/60 font-mono text-indigo-300">
                &ldquo;What is my cart total?&rdquo;
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
              Navigation
            </h4>
            <ul className="text-sm space-y-2">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  Product Comparison
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  AI Voice Assistant
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Project Details */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
              Project Information
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              BTech Computer Science & Engineering Final-Year Capstone Project.
            </p>
            <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Simulated E-Commerce</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Safe testing environment: all payments, order processing, and tokenizations are simulated.
              </p>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Stack: React, Vite, TypeScript, Tailwind, FastAPI, Python NLP, Web Speech API.
            </p>
          </div>

        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} VoiceMart. Built for final-year engineering demonstration.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for AI Conversational Commerce
          </p>
        </div>
      </div>
    </footer>
  );
};

