"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Send, 
  MessageCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Voice recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function CarCoPilotDashboard() {
  // Voice assistant state - Always listening by default
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAlwaysListening, setIsAlwaysListening] = useState(true); // Always on by default
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      text: 'Hello! I\'m your AI voice assistant. I\'m always listening and ready to help you with anything you need.',
      timestamp: new Date()
    }
  ]);

  // Voice recognition refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition with always-on capability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      synthRef.current = window.speechSynthesis;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setVoiceState('listening');
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
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
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          
          // Don't show error toasts for common issues when always listening
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            switch (event.error) {
              case 'not-allowed':
                toast.error('Microphone access denied. Please allow microphone permissions.');
                setIsAlwaysListening(false);
                break;
              case 'audio-capture':
                toast.error('No microphone was found. Please connect a microphone.');
                setIsAlwaysListening(false);
                break;
              case 'network':
                toast.error('Network error occurred during speech recognition.');
                break;
            }
          }
          
          // Restart recognition if always listening is enabled
          if (isAlwaysListening && event.error !== 'not-allowed' && event.error !== 'audio-capture') {
            restartRecognition();
          }
        };
        
        recognition.onend = () => {
          if (voiceState !== 'speaking') {
            setVoiceState('idle');
          }
          setInterimTranscript('');
          
          // Automatically restart if always listening is enabled
          if (isAlwaysListening) {
            restartRecognition();
          }
        };
        
        // Start listening immediately
        startListening();
      } else {
        toast.error('Speech recognition is not supported in this browser.');
        setIsAlwaysListening(false);
      }
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isAlwaysListening]);

  // Restart recognition with a small delay
  const restartRecognition = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    restartTimeoutRef.current = setTimeout(() => {
      if (isAlwaysListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.log('Recognition restart attempted while already running');
        }
      }
    }, 1000);
  };

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.log('Recognition already running or failed to start');
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
  };

  // Toggle always listening mode
  const toggleAlwaysListening = () => {
    const newState = !isAlwaysListening;
    setIsAlwaysListening(newState);
    
    if (newState) {
      startListening();
      toast.success('Always listening enabled');
    } else {
      stopListening();
      setVoiceState('idle');
      toast.info('Always listening disabled');
    }
  };

  // Voice command handler with AI-like responses
  const handleVoiceCommand = useCallback((command: string) => {
    setVoiceState('processing');
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      text: command,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Process command with AI-like intelligence
    setTimeout(() => {
      let response = '';
      const lowerCommand = command.toLowerCase();
      
      // AI-like natural language processing
      if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
        response = 'Hello! I\'m here and ready to assist you. What can I help you with today?';
      } else if (lowerCommand.includes('how are you')) {
        response = 'I\'m functioning perfectly and ready to help! My systems are all green and I\'m listening attentively.';
      } else if (lowerCommand.includes('what can you do')) {
        response = 'I can help you with various tasks, answer questions, provide information, and have natural conversations. Just speak naturally and I\'ll understand!';
      } else if (lowerCommand.includes('weather')) {
        response = 'I\'d love to help with weather information! Currently, I can provide general assistance. For real-time weather, I\'d need to connect to weather services.';
      } else if (lowerCommand.includes('time')) {
        const now = new Date();
        response = `The current time is ${now.toLocaleTimeString()}. Is there anything else you\'d like to know?`;
      } else if (lowerCommand.includes('date')) {
        const now = new Date();
        response = `Today is ${now.toLocaleDateString()}. How else can I assist you?`;
      } else if (lowerCommand.includes('thank')) {
        response = 'You\'re very welcome! I\'m always happy to help. Is there anything else you need?';
      } else if (lowerCommand.includes('music') || lowerCommand.includes('play')) {
        response = 'I understand you\'d like to control music. I can help coordinate with your vehicle\'s audio system when connected.';
      } else if (lowerCommand.includes('navigate') || lowerCommand.includes('directions')) {
        response = 'I can assist with navigation requests. I\'d work with your vehicle\'s GPS system to provide turn-by-turn directions.';
      } else if (lowerCommand.includes('call') || lowerCommand.includes('phone')) {
        response = 'I can help manage phone calls through your vehicle\'s hands-free system when available.';
      } else if (lowerCommand.includes('stop listening') || lowerCommand.includes('mute')) {
        response = 'I\'ll reduce my responsiveness. You can tap the microphone button to re-enable full listening mode.';
        setIsAlwaysListening(false);
      } else {
        response = `I heard you say: "${command}". I'm continuously learning and improving. How can I help you better understand or accomplish what you need?`;
      }
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        text: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Speak response if not muted
      if (!isMuted && synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onstart = () => setVoiceState('speaking');
        utterance.onend = () => setVoiceState(isAlwaysListening ? 'listening' : 'idle');
        synthRef.current.speak(utterance);
      } else {
        setVoiceState(isAlwaysListening ? 'listening' : 'idle');
      }
    }, 1500);
  }, [isMuted, isAlwaysListening]);

  // Text input handler
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleVoiceCommand(textInput.trim());
      setTextInput('');
    }
  };

  // Siri-style waveform animation with signature colors
  const SiriWaveform = ({ isActive, intensity = 1 }: { isActive: boolean; intensity?: number }) => (
    <div className="flex items-center justify-center space-x-1 h-16 w-full max-w-md">
      {Array.from({ length: 32 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{
            background: isActive 
              ? `linear-gradient(to top, 
                  #007AFF 0%, 
                  #00D4FF 30%, 
                  #5AC8FA 60%, 
                  #AF52DE 100%)`
              : 'rgba(120, 120, 128, 0.3)'
          }}
          animate={{
            height: isActive 
              ? [
                  6, 
                  Math.sin((i * 0.5) + Date.now() * 0.005) * 25 * intensity + 20, 
                  6
                ] 
              : 6,
            opacity: isActive ? [0.6, 1, 0.6] : 0.4
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.03,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        />
      ))}
    </div>
  );

  // Animated orb with Siri-style colors
  const VoiceOrb = () => (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings with Siri colors */}
      <AnimatePresence>
        {(voiceState === 'listening' || voiceState === 'processing') && (
          <>
            <motion.div
              className="absolute w-80 h-80 rounded-full border-2"
              style={{ 
                borderColor: voiceState === 'listening' 
                  ? 'rgba(0, 122, 255, 0.3)' 
                  : 'rgba(175, 82, 222, 0.3)' 
              }}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ 
                scale: [0.8, 1.5, 0.8], 
                opacity: [0.8, 0.1, 0.8] 
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div
              className="absolute w-64 h-64 rounded-full border-2"
              style={{ 
                borderColor: voiceState === 'listening' 
                  ? 'rgba(90, 200, 250, 0.4)' 
                  : 'rgba(0, 212, 255, 0.4)' 
              }}
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ 
                scale: [0.9, 1.3, 0.9], 
                opacity: [0.6, 0.2, 0.6] 
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.8 
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main orb with Siri colors */}
      <motion.div
        className="relative w-48 h-48 rounded-full cursor-pointer overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={voiceState === 'processing' ? { 
          rotate: 360,
        } : {}}
        transition={voiceState === 'processing' ? { 
          rotate: { duration: 3, repeat: Infinity, ease: "linear" }
        } : {}}
        style={{
          background: voiceState === 'speaking' 
            ? 'linear-gradient(135deg, #34C759, #007AFF, #5AC8FA)'
            : voiceState === 'processing'
            ? 'linear-gradient(135deg, #AF52DE, #007AFF, #00D4FF)'
            : voiceState === 'listening'
            ? 'linear-gradient(135deg, #007AFF, #5AC8FA, #00D4FF)'
            : 'linear-gradient(135deg, #8E8E93, #636366, #48484A)',
          boxShadow: `0 25px 80px ${
            voiceState === 'speaking' ? 'rgba(52, 199, 89, 0.5)' :
            voiceState === 'processing' ? 'rgba(175, 82, 222, 0.5)' :
            voiceState === 'listening' ? 'rgba(0, 122, 255, 0.5)' :
            'rgba(72, 72, 74, 0.3)'
          }`
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {voiceState === 'speaking' ? (
            <SiriWaveform isActive={true} intensity={1.8} />
          ) : voiceState === 'processing' ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-12 h-12 text-white" />
            </motion.div>
          ) : voiceState === 'listening' ? (
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mic className="w-12 h-12 text-white mb-2" />
              </motion.div>
              <SiriWaveform isActive={true} intensity={1.2} />
            </div>
          ) : (
            <Sparkles className="w-12 h-12 text-white/90" />
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/30">
        <div className="flex items-center space-x-3">
          <Badge 
            variant="default"
            className="bg-blue-600/20 text-blue-300 border-blue-500/30 flex items-center space-x-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Always Listening</span>
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white h-8 w-8"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className="text-slate-400 hover:text-white h-8 w-8"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Voice Assistant Area */}
      <div className="flex-1 flex">
        {/* Voice Assistant Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Voice State Display */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-light text-white mb-2">AI Voice Assistant</h1>
            <Badge 
              variant="secondary"
              className="text-sm px-3 py-1 capitalize bg-slate-800/50 text-slate-300 border-slate-700"
            >
              {voiceState === 'idle' ? 'Ready to Listen' : 
               voiceState === 'listening' ? 'Listening...' :
               voiceState === 'processing' ? 'Processing...' :
               'Speaking...'}
            </Badge>
          </div>

          {/* Voice Orb */}
          <VoiceOrb />

          {/* Speech to Text Display - Always visible and prominent */}
          <div className="mt-8 w-full max-w-3xl">
            {/* Live transcript with enhanced visibility */}
            <div className="mb-6 p-6 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 min-h-[120px] flex flex-col justify-center">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${
                    voiceState === 'listening' ? 'bg-blue-500/20' : 'bg-slate-700/30'
                  }`}>
                    <Mic className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    {voiceState === 'listening' ? 'Listening...' : 'Speech to Text'}
                  </span>
                </div>
                {voiceState === 'listening' && (
                  <div className="flex-1 ml-4">
                    <SiriWaveform isActive={true} intensity={0.8} />
                  </div>
                )}
              </div>
              
              {(transcript || interimTranscript) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg text-white leading-relaxed"
                >
                  {transcript}
                  <span className="text-blue-400 animate-pulse font-light">
                    {interimTranscript}
                  </span>
                </motion.div>
              ) : (
                <div className="text-slate-400 text-center py-4">
                  {voiceState === 'listening' 
                    ? 'Say something...' 
                    : 'Waiting for your voice...'}
                </div>
              )}
            </div>

            {/* Text Input */}
            <form onSubmit={handleTextSubmit} className="flex space-x-3">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type your message here..."
                className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 text-white placeholder-slate-400 text-base py-3 rounded-xl"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="bg-blue-600/80 hover:bg-blue-600 h-12 w-12 rounded-xl backdrop-blur-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Chat History Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-96 border-l border-slate-800/30 bg-slate-900/40 backdrop-blur-xl flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800/30">
                <h2 className="font-medium text-white flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat History</span>
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600/80 text-white'
                        : 'bg-slate-800/60 text-white border border-slate-700/50'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-slate-800/30 bg-slate-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span>Voice Assistant Active</span>
            <span>Messages: {chatMessages.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Always Listening</span>
          </div>
        </div>
      </div>
    </div>
  );
}