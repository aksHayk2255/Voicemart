import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mic, MicOff, Send, Volume2, VolumeX, Sparkles, 
  Trash2, ArrowRight, ShoppingCart, AlertCircle, 
  CheckCircle2, Terminal, HelpCircle
} from 'lucide-react';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const VoiceAssistantPage: React.FC = () => {
  const {
    isListening,
    isSpeaking,
    isProcessing,
    isSupported,
    transcript,
    interimTranscript,
    error,
    messages,
    toggleListening,
    speakText,
    stopSpeaking,
    isMuted,
    toggleMute,
    processCommand,
    clearHistory,
  } = useVoiceAssistant();

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [inputText, setInputText] = useState('');
  const [showInspector, setShowInspector] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      processCommand(inputText.trim());
      setInputText('');
    }
  };

  const sampleCommands = [
    "Find smartphones below 40000 rupees",
    "Show the cheapest smartphones",
    "Show headphones under 2000",
    "Find highly rated products",
    "Compare Samsung Galaxy S24 and Apple iPhone 15",
    "What is my cart total?"
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-colors ${
              isListening ? 'bg-rose-500 animate-pulse' : isSpeaking ? 'bg-amber-500' : 'bg-indigo-600 shadow-indigo-200'
            }`}>
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                AI Voice Shopping Assistant
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  Core Module
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Powered by Web Speech API, SpeechSynthesis, and Python NLP Intent Detection.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInspector(!showInspector)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showInspector ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
              }`}
              title="Toggle NLP Entity Inspector"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>NLP Inspector</span>
            </button>
            <button
              onClick={toggleMute}
              className="p-2 bg-white border border-slate-200 hover:text-indigo-600 rounded-xl text-slate-600 transition-colors"
              title={isMuted ? "Unmute spoken replies" : "Mute spoken replies"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={clearHistory}
              className="p-2 bg-white border border-slate-200 hover:text-slate-900 rounded-xl text-slate-500 transition-colors"
              title="Reset conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Status & Visualizer Wave */}
        <div className={`mt-6 p-4 rounded-3xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
          isListening 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : isSpeaking 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-white border-slate-200/80 text-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            {/* Wave animation */}
            <div className="flex items-center gap-1 h-6 px-2">
              <span className={`w-1.5 rounded-full ${isListening ? 'bg-rose-500 wave-bar-1' : isSpeaking ? 'bg-amber-500 wave-bar-3' : 'bg-slate-300 h-2'}`} />
              <span className={`w-1.5 rounded-full ${isListening ? 'bg-rose-500 wave-bar-2' : isSpeaking ? 'bg-amber-500 wave-bar-1' : 'bg-slate-300 h-3'}`} />
              <span className={`w-1.5 rounded-full ${isListening ? 'bg-rose-500 wave-bar-3' : isSpeaking ? 'bg-amber-500 wave-bar-4' : 'bg-slate-300 h-4'}`} />
              <span className={`w-1.5 rounded-full ${isListening ? 'bg-rose-500 wave-bar-4' : isSpeaking ? 'bg-amber-500 wave-bar-2' : 'bg-slate-300 h-3'}`} />
              <span className={`w-1.5 rounded-full ${isListening ? 'bg-rose-500 wave-bar-5' : isSpeaking ? 'bg-amber-500 wave-bar-5' : 'bg-slate-300 h-2'}`} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {isListening ? 'Listening Live...' : isSpeaking ? 'Speaking Response...' : isProcessing ? 'Reasoning Intent...' : 'Ready for Voice Commands'}
              </p>
              <p className="text-xs font-medium opacity-80">
                {isListening
                  ? (interimTranscript || transcript || 'Speak your request into your microphone...')
                  : isSpeaking
                  ? 'Click "Stop Audio" anytime to silence playback.'
                  : 'Tap the big mic below or select a recommended query.'}
              </p>
            </div>
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0"
            >
              Stop Audio
            </button>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Chat Feed & Inspection Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          {/* Main Conversational Feed (2 cols) */}
          <div className={`${showInspector ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[600px] overflow-hidden`}>
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {/* Assistant Message Header */}
                    {msg.sender === 'assistant' && (
                      <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          VoiceMart AI
                          {msg.intent && (
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded">
                              {msg.intent}
                            </span>
                          )}
                        </span>
                        {msg.spokenText && (
                          <button
                            onClick={() => speakText(msg.spokenText!)}
                            title="Hear speech synthesis"
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Markdown rendering */}
                    <div 
                      className="whitespace-pre-line text-xs sm:text-sm"
                      dangerouslySetInnerHTML={{
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }}
                    />

                    {/* Embedded Products Cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-xs font-bold text-slate-700">
                          Matching Products ({msg.products.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.products.map((p) => (
                            <div
                              key={p.id}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:border-indigo-300 transition-colors"
                            >
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-14 h-14 rounded-lg object-cover bg-white shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {p.name}
                                </h4>
                                <p className="text-xs font-extrabold text-indigo-600">
                                  ₹{p.price.toLocaleString('en-IN')}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Link
                                    to={`/products/${p.id}`}
                                    className="text-[10px] text-slate-600 hover:text-indigo-600 font-semibold underline flex items-center gap-0.5"
                                  >
                                    View <ArrowRight className="w-2.5 h-2.5" />
                                  </Link>
                                  <button
                                    onClick={async () => {
                                      if (!isAuthenticated) {
                                        alert("Please sign in to add to cart");
                                        return;
                                      }
                                      await addToCart(p.id, 1);
                                      speakText(`Added ${p.name} to your cart.`);
                                    }}
                                    className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded-md font-semibold"
                                  >
                                    + Add to Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 p-3 rounded-2xl w-fit">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>Parsing voice intent, filtering catalog, and synthesizing response...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Chips Bar */}
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
              <span className="text-slate-400 text-[11px] shrink-0 font-medium mr-1">Try:</span>
              {sampleCommands.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => processCommand(cmd)}
                  className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full text-slate-600 transition-colors text-[11px]"
                >
                  &ldquo;{cmd}&rdquo;
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!isSupported}
                  title={isListening ? "Stop listening" : "Tap and speak your query"}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-md transition-all shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white animate-voice-pulse shadow-rose-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={isListening ? "Listening... speak now" : "Speak or type shopping commands..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 text-sm bg-slate-100 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isProcessing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right: NLP & Intent Inspector (Evaluation Showcase) */}
          {showInspector && (
            <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between h-[600px] overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Terminal className="w-4 h-4" />
                    <span>NLP Intent Inspector</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
                    Live Analyzer
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Demonstrating natural language entity extraction and intent mapping in real time:
                </p>

                {/* Inspect latest assistant message */}
                {(() => {
                  const lastBot = [...messages].reverse().find((m) => m.sender === 'assistant' && m.intent);
                  if (!lastBot) {
                    return (
                      <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-800 text-xs text-slate-400 text-center font-mono">
                        Speak a command to view extracted intent & parameter tokens.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="text-slate-400 text-[10px] uppercase block">Detected Intent:</span>
                        <span className="text-emerald-400 font-bold text-sm">{lastBot.intent}</span>
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1.5">
                        <span className="text-slate-400 text-[10px] uppercase block">Action Dispatch:</span>
                        <span className="text-indigo-300">{lastBot.action || 'MESSAGE'}</span>
                        {lastBot.actionData && (
                          <pre className="text-[11px] text-amber-300/90 whitespace-pre-wrap mt-1">
                            {JSON.stringify(lastBot.actionData, null, 2)}
                          </pre>
                        )}
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="text-slate-400 text-[10px] uppercase block mb-1">Spoken TTS Payload:</span>
                        <p className="text-xs text-slate-300 italic font-sans">
                          &ldquo;{lastBot.spokenText}&rdquo;
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                <p>Intents Supported: SEARCH_PRODUCT, FILTER_PRODUCT, SORT_PRODUCT, ADD_TO_CART, REMOVE_FROM_CART, COMPARE_PRODUCTS, CHECK_CART, GENERAL_QUERY.</p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

