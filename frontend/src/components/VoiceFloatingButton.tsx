import React from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';

export const VoiceFloatingButton: React.FC = () => {
  const { 
    isListening, 
    isSpeaking, 
    openVoiceModal, 
    toggleListening, 
    isMuted, 
    toggleMute 
  } = useVoiceAssistant();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2">
      
      {/* Audio Mute/Unmute Pill */}
      <button
        onClick={toggleMute}
        title={isMuted ? "Unmute Assistant Spoken Voice" : "Mute Assistant Spoken Voice"}
        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all text-xs"
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>

      {/* Main Glowing Floating Mic Trigger */}
      <div className="relative">
        {/* Pulsing indicator when listening or speaking */}
        {(isListening || isSpeaking) && (
          <span className="absolute -inset-2 rounded-full bg-indigo-500/30 animate-ping pointer-events-none" />
        )}

        <button
          onClick={() => {
            openVoiceModal();
            toggleListening();
          }}
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${
            isListening
              ? 'bg-rose-500 text-white animate-voice-pulse shadow-rose-300'
              : isSpeaking
              ? 'bg-amber-500 text-white shadow-amber-200'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-300 hover:scale-105 active:scale-95'
          }`}
          title={isListening ? "Listening... click to pause" : "Click to speak shopping commands"}
        >
          <Mic className={`w-7 h-7 ${isListening ? 'animate-bounce' : ''}`} />

          {/* Floating Tooltip */}
          <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isListening ? 'Listening...' : 'Tap & Speak'}
          </span>
        </button>
      </div>

    </div>
  );
};

