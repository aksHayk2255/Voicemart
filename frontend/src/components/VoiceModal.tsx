import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Mic, MicOff, Send, Volume2, VolumeX, 
  Trash2, Sparkles, AlertCircle, ShoppingBag, ArrowRight
} from 'lucide-react';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const VoiceModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    closeVoiceModal,
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
  const [textInput, setTextInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVoiceModalOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isVoiceModalOpen, interimTranscript]);

  if (!isVoiceModalOpen) return null;

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      processCommand(textInput.trim());
      setTextInput('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors ${
              isListening ? 'bg-rose-500 animate-pulse' : isSpeaking ? 'bg-amber-500' : 'bg-indigo-600'
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                VoiceMart AI Assistant
                <span className="text-[10px] font-semibold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isListening ? 'Listening to your voice...' : isSpeaking ? 'Assistant is speaking...' : isProcessing ? 'Processing request...' : 'Ready for voice or text'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute TTS" : "Mute TTS"}
              className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={clearHistory}
              title="Clear Conversation"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeVoiceModal}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Audio Visualizer Banner (When Listening or Speaking) */}
        {(isListening || isSpeaking) && (
          <div className="bg-indigo-900 text-white px-6 py-2.5 flex items-center justify-between text-xs transition-all">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-5">
                <span className="w-1 bg-indigo-300 rounded-full wave-bar-1" />
                <span className="w-1 bg-indigo-300 rounded-full wave-bar-2" />
                <span className="w-1 bg-indigo-300 rounded-full wave-bar-3" />
                <span className="w-1 bg-indigo-300 rounded-full wave-bar-4" />
                <span className="w-1 bg-indigo-300 rounded-full wave-bar-5" />
              </div>
              <span className="font-medium">
                {isListening ? (interimTranscript || transcript || 'Speak your request now...') : 'Voice playback active'}
              </span>
            </div>
            {isSpeaking && (
              <button 
                onClick={stopSpeaking}
                className="text-[11px] bg-indigo-800 hover:bg-indigo-700 px-2 py-1 rounded"
              >
                Stop Audio
              </button>
            )}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-100 px-6 py-2 flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                {/* Spoken replay button for assistant messages */}
                {msg.sender === 'assistant' && msg.spokenText && (
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-100">
                    <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      VoiceMart AI
                    </span>
                    <button
                      onClick={() => speakText(msg.spokenText!)}
                      title="Hear this reply"
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message text formatted */}
                <div 
                  className="whitespace-pre-line prose prose-sm max-w-none prose-slate"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }}
                />

                {/* Embedded matching products preview if returned */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                      Matching Products ({msg.products.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.products.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-3 hover:border-indigo-300 transition-colors"
                        >
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 truncate">
                              {p.name}
                            </h4>
                            <p className="text-xs font-bold text-indigo-600">
                              ₹{p.price.toLocaleString('en-IN')}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Link
                                to={`/products/${p.id}`}
                                onClick={closeVoiceModal}
                                className="text-[10px] text-slate-500 hover:text-indigo-600 underline flex items-center gap-0.5"
                              >
                                View <ArrowRight className="w-2.5 h-2.5" />
                              </Link>
                              <button
                                onClick={async () => {
                                  if (!isAuthenticated) {
                                    closeVoiceModal();
                                    return;
                                  }
                                  await addToCart(p.id, 1);
                                }}
                                className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-semibold hover:bg-indigo-700"
                              >
                                + Cart
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

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 p-3 rounded-2xl w-fit">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>VoiceMart is reasoning and extracting shopping intent...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-slate-400 text-[11px] shrink-0 font-medium mr-1">Suggestions:</span>
          {sampleCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => processCommand(cmd)}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-transparent rounded-full text-slate-600 transition-colors text-[11px]"
            >
              &ldquo;{cmd}&rdquo;
            </button>
          ))}
        </div>

        {/* Input Bar with Large Mic Button and Text Alternative */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendText} className="flex items-center gap-3">
            
            {/* Main Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={!isSupported}
              title={isListening ? "Stop listening" : "Tap to speak command"}
              className={`relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-md transition-all shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-voice-pulse shadow-rose-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-105 active:scale-95'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Alternative Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={isListening ? "Listening... (or type your command)" : "Ask or speak your shopping query..."}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full pl-4 pr-10 py-3 text-sm bg-slate-100 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </form>

          {!isSupported && (
            <p className="text-[11px] text-amber-600 mt-2 text-center">
              ⚠️ Web Speech API is not supported in this browser. Please use Chrome/Edge for voice recognition, or use the text bar above.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

