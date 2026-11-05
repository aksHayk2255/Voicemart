import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product, VoiceCommandResponse } from '../types';
import { useCart } from './CartContext';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  spokenText?: string;
  timestamp: Date;
  intent?: string;
  products?: Product[];
  action?: string;
  actionData?: any;
}

interface VoiceAssistantContextType {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  messages: ChatMessage[];
  isVoiceModalOpen: boolean;
  isMuted: boolean;
  currentProductId: number | null;
  setCurrentProductId: (id: number | null) => void;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  toggleMute: () => void;
  processCommand: (text: string) => Promise<VoiceCommandResponse | null>;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  clearHistory: () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: "👋 Hi! I'm VoiceMart AI. You can tap the microphone or speak commands like *'Find laptops below 50,000'* or *'Show Samsung phones'*.",
      spokenText: "Hi! I am VoiceMart, your voice shopping assistant. What would you like to find today?",
      timestamp: new Date(),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize SpeechSynthesis and SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setInterimTranscript('');
          };

          recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }

            if (final) {
              setTranscript(final);
              setInterimTranscript('');
              handleVoiceCommand(final);
            } else {
              setInterimTranscript(interim);
            }
          };

          recognition.onerror = (event: any) => {
            setIsListening(false);
            if (event.error === 'not-allowed') {
              setError('Microphone access was denied. Please allow microphone permissions in your browser.');
            } else if (event.error === 'no-speech') {
              // Gracefully handle silence
              setError('No speech was detected. Please try speaking again.');
            } else {
              setError(`Voice recognition error: ${event.error}`);
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch (e: any) {
          setIsSupported(false);
          setError('Speech Recognition initialization failed on this system.');
        }
      } else {
        setIsSupported(false);
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (isMuted || !synthRef.current) return;

      synthRef.current.cancel(); // Stop any pending speech
      const cleanText = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select natural sounding voice if available
      const voices = synthRef.current.getVoices();
      const naturalVoice = voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en')) && !v.name.includes('Bad')
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [isMuted]
  );

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
    }
    setIsMuted((prev) => !prev);
  };

  const startListening = () => {
    if (!isSupported) {
      setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    stopSpeaking();
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current?.start();
    } catch {
      // If already started, restart
      recognitionRef.current?.stop();
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (err: any) {
          setError('Could not start microphone: ' + err.message);
        }
      }, 150);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const processCommand = async (text: string): Promise<VoiceCommandResponse | null> => {
    if (!text.trim()) return null;

    stopSpeaking();
    setIsProcessing(true);
    setError(null);

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await api.assistant.command(text.trim(), currentProductId || undefined);

      // 2. Add assistant message
      const botMsg: ChatMessage = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: response.display_response,
        spokenText: response.spoken_response,
        timestamp: new Date(),
        intent: response.intent,
        products: response.products,
        action: response.action,
        actionData: response.action_data,
      };
      setMessages((prev) => [...prev, botMsg]);

      // 3. Speak assistant response
      speakText(response.spoken_response);

      // 4. Handle navigation / refresh actions
      if (response.action === 'CART_UPDATED' || response.action === 'CART_TOTAL') {
        refreshCart();
      }

      if (response.action === 'NAVIGATE' && response.action_data?.path) {
        navigate(response.action_data.path);
      } else if (response.action === 'COMPARE' && response.action_data?.path) {
        navigate(response.action_data.path);
      } else if (response.action === 'SEARCH_RESULTS') {
        // Build search URL params
        const params = new URLSearchParams();
        if (response.entities.category) params.append('category', response.entities.category);
        if (response.entities.brand) params.append('brand', response.entities.brand);
        if (response.entities.max_price) params.append('max_price', String(response.entities.max_price));
        if (response.entities.min_price) params.append('min_price', String(response.entities.min_price));
        if (response.entities.sort_by) params.append('sort_by', response.entities.sort_by);
        if (response.entities.keyword) params.append('search', response.entities.keyword);

        // If not already on /products or assistant modal, route to products
        const targetUrl = `/products?${params.toString()}`;
        if (window.location.pathname !== '/assistant') {
          navigate(targetUrl);
        }
      }

      return response;
    } catch (err: any) {
      const errText = err.message || 'Failed to process voice command. Please try again.';
      setError(errText);
      const errMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        text: `⚠️ **Error:** ${errText}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      speakText("I encountered an issue processing that request. Please try again.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceCommand = (text: string) => {
    processCommand(text);
  };

  const openVoiceModal = () => setIsVoiceModalOpen(true);
  const closeVoiceModal = () => {
    stopListening();
    stopSpeaking();
    setIsVoiceModalOpen(false);
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        sender: 'assistant',
        text: "Conversation reset. What product can I help you find?",
        spokenText: "Conversation reset. What product can I help you find?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <VoiceAssistantContext.Provider
      value={{
        isListening,
        isSpeaking,
        isProcessing,
        isSupported,
        transcript,
        interimTranscript,
        error,
        messages,
        isVoiceModalOpen,
        isMuted,
        currentProductId,
        setCurrentProductId,
        startListening,
        stopListening,
        toggleListening,
        speakText,
        stopSpeaking,
        toggleMute,
        processCommand,
        openVoiceModal,
        closeVoiceModal,
        clearHistory,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};

