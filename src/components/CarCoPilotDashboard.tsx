"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Mic, MicOff, Volume2, VolumeX, Phone, PhoneCall, Map, Navigation,
  Thermometer, Wind, Droplets, Sun, Moon, Car, Gauge, Fuel, Zap,
  Settings, Calendar, Home, Shield, Wrench, Heart, MessageSquare,
  Play, Pause, SkipForward, SkipBack, Bluetooth, Wifi, Battery,
  Camera, Eye, Palette, Massage, Sparkles, Waves, ChevronUp,
  ChevronDown, ChevronLeft, ChevronRight, MapPin, Route, Clock,
  AlertTriangle, CheckCircle, XCircle, Star, Music, ContactRound,
  Maximize, Activity, Target, Zap as Lightning, Brain } from
'lucide-react';

interface VehicleTelemetry {
  speed: number;
  rpm: number;
  fuelLevel: number;
  coolantTemp: number;
  oilPressure: number;
  batteryVoltage: number;
  throttlePosition: number;
  tirePressure: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
}

interface ClimateSettings {
  driverTemp: number;
  passengerTemp: number;
  fanSpeed: number;
  autoMode: boolean;
  airQuality: number;
  seatHeating: {
    driver: number;
    passenger: number;
  };
  seatCooling: {
    driver: number;
    passenger: number;
  };
}

interface MusicState {
  isPlaying: boolean;
  track: string;
  artist: string;
  albumArt: string;
  duration: number;
  currentTime: number;
  service: 'spotify' | 'apple' | 'youtube';
}

interface NavigationState {
  destination: string;
  eta: string;
  distance: string;
  nextTurn: string;
  turnDistance: string;
  arMode: boolean;
  hudMode: boolean;
}

type ViewMode = 'voice' | 'telemetry' | 'navigation' | 'music' | 'settings' | 'chat';
type LayoutTheme = 'classic' | 'sporty' | 'discreet' | 'navigation';
type VoiceState = 'ready' | 'listening' | 'processing' | 'speaking';

export default function CarCoPilotDashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>('voice');
  const [isListening, setIsListening] = useState(false);
  const [isAlwaysListening, setIsAlwaysListening] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{id: string;text: string;isUser: boolean;timestamp: Date;}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [lightingAnimation, setLightingAnimation] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>();
  const restartTimeoutRef = useRef<NodeJS.Timeout>();

  const [telemetry, setTelemetry] = useState<VehicleTelemetry>({
    speed: 65,
    rpm: 2200,
    fuelLevel: 68,
    coolantTemp: 195,
    oilPressure: 45,
    batteryVoltage: 12.6,
    throttlePosition: 35,
    tirePressure: {
      frontLeft: 32.5,
      frontRight: 32.8,
      rearLeft: 31.9,
      rearRight: 32.1
    }
  });

  const [climate, setClimate] = useState<ClimateSettings>({
    driverTemp: 72,
    passengerTemp: 74,
    fanSpeed: 3,
    autoMode: true,
    airQuality: 85,
    seatHeating: { driver: 0, passenger: 0 },
    seatCooling: { driver: 1, passenger: 0 }
  });

  const [music, setMusic] = useState<MusicState>({
    isPlaying: true,
    track: "Midnight City",
    artist: "M83",
    albumArt: "/api/placeholder/80/80",
    duration: 240,
    currentTime: 142,
    service: 'spotify'
  });

  const [navigation, setNavigation] = useState<NavigationState>({
    destination: "Tesla Supercharger Station",
    eta: "12:45 PM",
    distance: "8.3 mi",
    nextTurn: "Turn right on Highway 101",
    turnDistance: "0.3 mi",
    arMode: false,
    hudMode: false
  });

  const [settings, setSettings] = useState({
    layoutTheme: 'sporty' as LayoutTheme,
    ambientLighting: '#ff4747',
    display3D: true,
    massageIntensity: 2,
    suspensionMode: 'comfort',
    scentIntensity: 1,
    carWashMode: false
  });

  // Glass morphism theme styles
  const glassStyles = {
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  };

  const getThemeStyles = (theme: LayoutTheme) => {
    switch (theme) {
      case 'sporty':
        return {
          primary: '#ff4747',
          accent: '#ff8a5a',
          background: 'linear-gradient(135deg, rgba(255, 71, 71, 0.1) 0%, rgba(0, 0, 0, 0.9) 50%, rgba(255, 138, 90, 0.1) 100%)'
        };
      case 'classic':
        return {
          primary: '#c6e062',
          accent: '#22c55e',
          background: 'linear-gradient(135deg, rgba(198, 224, 98, 0.1) 0%, rgba(0, 0, 0, 0.9) 50%, rgba(34, 197, 94, 0.1) 100%)'
        };
      case 'discreet':
        return {
          primary: '#6b7280',
          accent: '#9ca3af',
          background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.05) 0%, rgba(0, 0, 0, 0.95) 50%, rgba(156, 163, 175, 0.05) 100%)'
        };
      case 'navigation':
        return {
          primary: '#3b82f6',
          accent: '#8b5cf6',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(0, 0, 0, 0.9) 50%, rgba(139, 92, 246, 0.1) 100%)'
        };
      default:
        return {
          primary: '#ff4747',
          accent: '#ff8a5a',
          background: 'linear-gradient(135deg, rgba(255, 71, 71, 0.1) 0%, rgba(0, 0, 0, 0.9) 50%, rgba(255, 138, 90, 0.1) 100%)'
        };
    }
  };

  const currentTheme = getThemeStyles(settings.layoutTheme);

  // Initialize Speech Recognition with always-on mode
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscriptText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptText += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(interimTranscript);

        if (finalTranscriptText) {
          setFinalTranscript(finalTranscriptText);
          setVoiceState('processing');
          handleVoiceCommand(finalTranscriptText);
        }
      };

      recognition.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceState('ready');

        // Auto-restart if always listening is enabled
        if (isAlwaysListening && event.error !== 'not-allowed') {
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setCurrentTranscript('');

        // Auto-restart if always listening is enabled
        if (isAlwaysListening) {
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 500);
        } else {
          setVoiceState('ready');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  // Start listening when always listening is enabled
  useEffect(() => {
    if (isAlwaysListening && !isListening) {
      startListening();
    } else if (!isAlwaysListening && isListening) {
      stopListening();
    }
  }, [isAlwaysListening]);

  // Simulate voice level animation
  useEffect(() => {
    if (isListening || voiceState === 'speaking') {
      const animate = () => {
        setVoiceLevel(Math.random() * 100);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      setVoiceLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, voiceState]);

  // Lighting animation effect
  const triggerLightingAnimation = (type: 'temperature' | 'hazard' | 'comfort') => {
    setLightingAnimation(type);
    setTimeout(() => setLightingAnimation(''), 2000);
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Speech recognition start error:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setVoiceState('ready');
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
  }, [isListening]);

  const handleVoiceCommand = useCallback((command: string) => {
    const lowerCommand = command.toLowerCase();

    // Add to chat
    const userMessage = {
      id: Date.now().toString(),
      text: command,
      isUser: true,
      timestamp: new Date()
    };
    setChatMessages((prev) => [...prev, userMessage]);

    let response = "";

    // Natural language temperature commands
    if (lowerCommand.includes('cold') || lowerCommand.includes('freezing')) {
      const newTemp = Math.min(85, climate.driverTemp + 5);
      setClimate((prev) => ({ ...prev, driverTemp: newTemp }));
      triggerLightingAnimation('temperature');
      response = `I've increased your temperature to ${newTemp}°F to warm you up.`;
    } else if (lowerCommand.includes('hot') || lowerCommand.includes('warm')) {
      const newTemp = Math.max(60, climate.driverTemp - 5);
      setClimate((prev) => ({ ...prev, driverTemp: newTemp }));
      triggerLightingAnimation('temperature');
      response = `I've decreased your temperature to ${newTemp}°F to cool you down.`;
    }

    // Passenger-specific commands (Multi-Seat Intelligence)
    else if (lowerCommand.includes('passenger') && lowerCommand.includes('cold')) {
      const newTemp = Math.min(85, climate.passengerTemp + 5);
      setClimate((prev) => ({ ...prev, passengerTemp: newTemp }));
      triggerLightingAnimation('temperature');
      response = `I've increased the passenger temperature to ${newTemp}°F.`;
    } else if (lowerCommand.includes('passenger') && lowerCommand.includes('hot')) {
      const newTemp = Math.max(60, climate.passengerTemp - 5);
      setClimate((prev) => ({ ...prev, passengerTemp: newTemp }));
      triggerLightingAnimation('temperature');
      response = `I've decreased the passenger temperature to ${newTemp}°F.`;
    }

    // Navigation commands
    else if (lowerCommand.includes('navigate') || lowerCommand.includes('directions')) {
      setCurrentView('navigation');
      response = "Opening navigation. Where would you like to go?";
    } else if (lowerCommand.includes('ar navigation') || lowerCommand.includes('augmented reality')) {
      setNavigation((prev) => ({ ...prev, arMode: true }));
      setCurrentView('navigation');
      response = "AR Navigation activated. You'll see turn-by-turn directions overlaid on the road.";
    }

    // Music commands
    else if (lowerCommand.includes('play') || lowerCommand.includes('music')) {
      setMusic((prev) => ({ ...prev, isPlaying: true }));
      setCurrentView('music');
      response = `Now playing ${music.track} by ${music.artist}`;
    } else if (lowerCommand.includes('pause') || lowerCommand.includes('stop music')) {
      setMusic((prev) => ({ ...prev, isPlaying: false }));
      response = "Music paused";
    }

    // Car status commands
    else if (lowerCommand.includes('status') || lowerCommand.includes('diagnostics')) {
      setCurrentView('telemetry');
      response = "Displaying vehicle diagnostics. All systems are operating normally.";
    }

    // Comfort commands
    else if (lowerCommand.includes('massage')) {
      const newIntensity = Math.min(5, settings.massageIntensity + 1);
      setSettings((prev) => ({ ...prev, massageIntensity: newIntensity }));
      triggerLightingAnimation('comfort');
      response = `Seat massage set to level ${newIntensity}`;
    } else if (lowerCommand.includes('car wash')) {
      setSettings((prev) => ({ ...prev, carWashMode: !prev.carWashMode }));
      response = settings.carWashMode ?
      "Car wash mode deactivated" :
      "Car wash mode activated - Windows closing, mirrors folding";
    }

    // Theme changes
    else if (lowerCommand.includes('sporty') || lowerCommand.includes('sport mode')) {
      setSettings((prev) => ({ ...prev, layoutTheme: 'sporty' }));
      response = "Switched to sporty display theme with red accents.";
    } else if (lowerCommand.includes('classic') || lowerCommand.includes('traditional')) {
      setSettings((prev) => ({ ...prev, layoutTheme: 'classic' }));
      response = "Switched to classic display theme.";
    } else if (lowerCommand.includes('discreet') || lowerCommand.includes('minimal')) {
      setSettings((prev) => ({ ...prev, layoutTheme: 'discreet' }));
      response = "Switched to discreet minimal display theme.";
    } else

    {
      response = "I understand. How can I help you with your vehicle today?";
    }

    // Simulate AI thinking time
    setTimeout(() => {
      setVoiceState('speaking');

      // Add AI response
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages((prev) => [...prev, aiMessage]);

      // Speak response if not muted
      if (!isMuted && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.onend = () => setVoiceState('ready');
        speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setVoiceState('ready'), 2000);
      }
    }, 1500);

    setCurrentTranscript('');
    setFinalTranscript('');
  }, [climate, music, settings, isMuted]);

  const sendChatMessage = useCallback(() => {
    if (chatInput.trim()) {
      handleVoiceCommand(chatInput);
      setChatInput('');
    }
  }, [chatInput, handleVoiceCommand]);

  // Enhanced Voice Orb with Siri styling (without waveform)
  const VoiceOrb = useMemo(() =>
  <motion.div
    className="relative w-48 h-48 mx-auto mb-8"
    animate={{ scale: isListening ? 1.05 : 1 }}
    transition={{ duration: 0.3 }}>

      {/* Outer glow rings with Siri colors */}
      <motion.div
      className="absolute inset-0 rounded-full opacity-20"
      style={{
        background: `radial-gradient(circle, #007AFF40, transparent 70%)`,
        ...glassStyles
      }}
      animate={{
        scale: isListening ? [1, 1.3, 1] : 1,
        opacity: isListening ? [0.2, 0.6, 0.2] : 0.1
      }}
      transition={{ duration: 2, repeat: isListening ? Infinity : 0 }} />

      
      {/* Middle ring */}
      <motion.div
      className="absolute inset-4 rounded-full"
      style={{
        background: `radial-gradient(circle, #5AC8FA60, transparent)`,
        ...glassStyles
      }}
      animate={{
        scale: isListening ? [1, 1.2, 1] : 1
      }}
      transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }} />

      
      {/* Main orb with Siri gradient */}
      <motion.div
      className="absolute inset-8 rounded-full flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, #007AFF, #5AC8FA, #00D4FF, #AF52DE)`,
        ...glassStyles
      }}
      animate={{
        boxShadow: isListening ?
        '0 0 40px rgba(0, 122, 255, 0.6), 0 0 80px rgba(90, 200, 250, 0.4)' :
        '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>

        <motion.div
        animate={{
          rotate: voiceState === 'listening' ? 360 : 0,
          scale: voiceState === 'processing' ? [1, 1.1, 1] : 1
        }}
        transition={{
          rotate: { duration: 2, repeat: voiceState === 'listening' ? Infinity : 0, ease: "linear" },
          scale: { duration: 1, repeat: voiceState === 'processing' ? Infinity : 0 }
        }}>

          {voiceState === 'listening' ?
        <Mic className="w-12 h-12 text-white" /> :
        voiceState === 'processing' ?
        <Brain className="w-12 h-12 text-white" /> :
        voiceState === 'speaking' ?
        <Volume2 className="w-12 h-12 text-white" /> :

        <Mic className="w-12 h-12 text-white" />
        }
        </motion.div>
      </motion.div>
      
      {/* Status indicator */}
      <motion.div
      className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}>

        <Badge
        variant="default"
        className="backdrop-blur-sm px-4 py-1"
        style={{
          backgroundColor: isAlwaysListening && isListening ? '#22c55e' : '#6b7280',
          color: 'white'
        }}>

          <div className="flex items-center space-x-2">
            {isAlwaysListening && isListening &&
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
          }
            <span>
              {voiceState === 'listening' ? 'Listening...' :
            voiceState === 'processing' ? 'Processing...' :
            voiceState === 'speaking' ? 'Speaking...' :
            isAlwaysListening ? 'Ready to listen' : 'Voice ready'}
            </span>
          </div>
        </Badge>
      </motion.div>
    </motion.div>,
  [isListening, voiceState, isAlwaysListening]);

  // Speech-to-Text Display Component (without waveform)
  const SpeechToTextDisplay = useMemo(() =>
  <Card className="p-6 mb-6" style={glassStyles}>
      <div className="flex items-center space-x-3 mb-4">
        <Mic className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Speech to Text</h3>
      </div>
      
      <div className="min-h-[100px] p-4 rounded-lg border border-white/10" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
        {finalTranscript &&
      <p className="text-white mb-2">
            <span className="text-gray-400">You said:</span> {finalTranscript}
          </p>
      }
        {currentTranscript &&
      <p className="text-blue-400 opacity-80">
            {currentTranscript}
            <motion.span
          className="inline-block w-0.5 h-4 bg-blue-400 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 1, repeat: Infinity }} />

          </p>
      }
        {!finalTranscript && !currentTranscript && isListening &&
      <div className="flex items-center space-x-2 text-gray-400">
            <span>Listening for your voice...</span>
            <motion.div
              className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </motion.div>
          </div>
      }
        {!isListening && !finalTranscript && !currentTranscript &&
      <p className="text-gray-400">Voice recognition ready</p>
      }
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
            checked={isAlwaysListening}
            onCheckedChange={setIsAlwaysListening} />

            <span className="text-white text-sm">Always Listening</span>
          </div>
          
          <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMuted(!isMuted)}
          className="text-white border-white/20">

            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
        </div>

        <Button
        variant="outline"
        size="sm"
        onClick={() => setShowChat(!showChat)}
        className="text-white border-white/20">

          <MessageSquare className="w-4 h-4 mr-2" />
          Chat {showChat ? 'Hide' : 'Show'}
        </Button>
      </div>
    </Card>,
  [finalTranscript, currentTranscript, isListening, isAlwaysListening, isMuted, showChat]);

  // Chat History Component
  const ChatHistory = useMemo(() =>
  <AnimatePresence>
      {showChat &&
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6">

          <Card className="p-6" style={glassStyles}>
            <h3 className="text-lg font-semibold text-white mb-4">Conversation History</h3>
            
            <div className="h-64 overflow-y-auto space-y-3 mb-4">
              {chatMessages.length === 0 ?
          <p className="text-gray-400 text-center py-8">No conversation yet. Start by speaking or typing below.</p> :

          chatMessages.map((message) =>
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>

                    <div
              className={`max-w-[80%] p-3 rounded-lg ${
              message.isUser ?
              'bg-blue-600 text-white' :
              'bg-gray-700 text-white'}`
              }>

                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
          )
          }
            </div>

            <div className="flex space-x-2">
              <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
            className="flex-1 text-white placeholder-gray-400 border-white/20 bg-black/30" />

              <Button onClick={sendChatMessage} style={{ backgroundColor: '#007AFF' }}>
                Send
              </Button>
            </div>
          </Card>
        </motion.div>
    }
    </AnimatePresence>,
  [showChat, chatMessages, chatInput, sendChatMessage]);

  const TelemetryView = useMemo(() =>
  <div className="space-y-6">
      {/* Performance Gauges with 3D Effect */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6" style={{ ...glassStyles, transform: settings.display3D ? 'perspective(1000px) rotateX(5deg)' : 'none' }}>
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <defs>
                  <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentTheme.primary} />
                    <stop offset="100%" stopColor={currentTheme.accent} />
                  </linearGradient>
                </defs>
                <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none" />

                <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#speedGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${telemetry.speed / 120 * 352} 352`}
                strokeLinecap="round" />

              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{telemetry.speed}</span>
                <span className="text-sm text-gray-400">MPH</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-white">Speed</p>
          </div>
        </Card>

        <Card className="p-6" style={{ ...glassStyles, transform: settings.display3D ? 'perspective(1000px) rotateX(5deg)' : 'none' }}>
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <defs>
                  <linearGradient id="rpmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentTheme.accent} />
                    <stop offset="100%" stopColor={currentTheme.primary} />
                  </linearGradient>
                </defs>
                <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none" />

                <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#rpmGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${telemetry.rpm / 7000 * 352} 352`}
                strokeLinecap="round" />

              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{telemetry.rpm}</span>
                <span className="text-sm text-gray-400">RPM</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-white">Engine</p>
          </div>
        </Card>
      </div>

      {/* Tire Pressure with Enhanced Visual */}
      <Card className="p-6" style={glassStyles}>
        <h3 className="text-xl font-bold mb-6 text-white">Tire Pressure Monitor</h3>
        <div className="relative">
          {/* Car silhouette */}
          <div className="mx-auto w-48 h-32 relative">
            <div className="absolute inset-0 border-2 border-white/20 rounded-lg"></div>
            
            {/* Individual tire displays */}
            <div className="absolute -top-4 -left-4">
              <div className={`w-12 h-8 rounded border-2 ${telemetry.tirePressure.frontLeft > 30 ? 'border-green-400 bg-green-400/20' : 'border-red-400 bg-red-400/20'} flex items-center justify-center`}>
                <span className="text-xs font-bold text-white">{telemetry.tirePressure.frontLeft}</span>
              </div>
            </div>
            
            <div className="absolute -top-4 -right-4">
              <div className={`w-12 h-8 rounded border-2 ${telemetry.tirePressure.frontRight > 30 ? 'border-green-400 bg-green-400/20' : 'border-red-400 bg-red-400/20'} flex items-center justify-center`}>
                <span className="text-xs font-bold text-white">{telemetry.tirePressure.frontRight}</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4">
              <div className={`w-12 h-8 rounded border-2 ${telemetry.tirePressure.rearLeft > 30 ? 'border-green-400 bg-green-400/20' : 'border-red-400 bg-red-400/20'} flex items-center justify-center`}>
                <span className="text-xs font-bold text-white">{telemetry.tirePressure.rearLeft}</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4">
              <div className={`w-12 h-8 rounded border-2 ${telemetry.tirePressure.rearRight > 30 ? 'border-green-400 bg-green-400/20' : 'border-red-400 bg-red-400/20'} flex items-center justify-center`}>
                <span className="text-xs font-bold text-white">{telemetry.tirePressure.rearRight}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Other Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center" style={glassStyles}>
          <Fuel className="w-8 h-8 mx-auto mb-2" style={{ color: currentTheme.primary }} />
          <p className="text-xl font-bold text-white">{telemetry.fuelLevel}%</p>
          <p className="text-sm text-gray-400">Fuel Level</p>
        </Card>
        <Card className="p-4 text-center" style={glassStyles}>
          <Thermometer className="w-8 h-8 mx-auto mb-2" style={{ color: currentTheme.accent }} />
          <p className="text-xl font-bold text-white">{telemetry.coolantTemp}°F</p>
          <p className="text-sm text-gray-400">Coolant</p>
        </Card>
        <Card className="p-4 text-center" style={glassStyles}>
          <Battery className="w-8 h-8 mx-auto mb-2" style={{ color: '#22c55e' }} />
          <p className="text-xl font-bold text-white">{telemetry.batteryVoltage}V</p>
          <p className="text-sm text-gray-400">Battery</p>
        </Card>
      </div>
    </div>,
  [telemetry, currentTheme, settings.display3D]);

  const NavigationView = useMemo(() =>
  <div className="space-y-6">
      {settings.layoutTheme === 'navigation' ?
    // Full-screen map mode
    <div className="h-96 relative rounded-lg overflow-hidden" style={glassStyles}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40">
            <div className="absolute inset-4 border border-white/20 rounded-lg"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <Map className="w-16 h-16 mx-auto mb-4 text-white" />
              <h2 className="text-2xl font-bold text-white mb-2">Full Navigation Mode</h2>
              <p className="text-gray-300">Interactive map with live traffic and POI</p>
            </div>
          </div>
        </div> :

    <Card className="p-6" style={glassStyles}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Navigation Control Hub</h3>
            <div className="flex space-x-2">
              <Button
            variant="outline"
            size="sm"
            onClick={() => setNavigation((prev) => ({ ...prev, arMode: !prev.arMode }))}
            style={{ backgroundColor: navigation.arMode ? currentTheme.primary : 'rgba(255,255,255,0.1)' }}>

                <Camera className="w-4 h-4 mr-2" />
                {navigation.arMode ? 'Exit AR' : 'AR Mode'}
              </Button>
              <Button
            variant="outline"
            size="sm"
            onClick={() => setNavigation((prev) => ({ ...prev, hudMode: !prev.hudMode }))}
            style={{ backgroundColor: navigation.hudMode ? currentTheme.primary : 'rgba(255,255,255,0.1)' }}>

                <Target className="w-4 h-4 mr-2" />
                {navigation.hudMode ? 'Exit HUD' : 'AR HUD'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <MapPin className="w-6 h-6" style={{ color: currentTheme.primary }} />
              <div>
                <p className="text-lg font-semibold text-white">{navigation.destination}</p>
                <p className="text-sm text-gray-400">{navigation.distance} • ETA {navigation.eta}</p>
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center space-x-3 mb-2">
                <ChevronRight className="w-6 h-6" style={{ color: currentTheme.accent }} />
                <span className="text-lg font-semibold text-white">{navigation.nextTurn}</span>
              </div>
              <p className="text-sm text-gray-400">in {navigation.turnDistance}</p>
            </div>
          </div>
        </Card>
    }

      {/* AR Navigation Display */}
      {navigation.arMode &&
    <Card className="p-4" style={glassStyles}>
          <div className="relative h-64 bg-gradient-to-b from-blue-900/30 to-blue-600/30 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
            className="text-white text-xl font-bold"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}>

                📹 AR Camera Feed Active
              </motion.div>
            </div>
            
            {/* AR overlay elements */}
            <motion.div
          className="absolute top-4 left-4 px-3 py-1 rounded text-white text-sm font-semibold"
          style={{ backgroundColor: currentTheme.primary }}>

              Next: Right Turn 0.3 mi
            </motion.div>
            
            <motion.div
          className="absolute bottom-8 right-8"
          style={{ color: currentTheme.accent }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}>

              <ChevronRight className="w-12 h-12" />
            </motion.div>
            
            {/* Street name overlay */}
            <div className="absolute bottom-4 left-4 px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
              Highway 101 North
            </div>
          </div>
        </Card>
    }

      {/* AR HUD Display */}
      {navigation.hudMode &&
    <Card className="p-4" style={glassStyles}>
          <div className="text-center">
            <h4 className="text-lg font-semibold text-white mb-4">AR Head-Up Display Active</h4>
            <div className="relative h-32 bg-gradient-to-t from-transparent to-blue-500/20 rounded-lg">
              <motion.div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 text-2xl"
            animate={{ y: [0, -5, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}>

                ↗️
              </motion.div>
              <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-300">
                Projected 30ft ahead on windshield
              </p>
            </div>
          </div>
        </Card>
    }

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="flex items-center space-x-2 text-white border-white/20">
          <Fuel className="w-4 h-4" />
          <span>Gas Stations</span>
        </Button>
        <Button variant="outline" className="flex items-center space-x-2 text-white border-white/20">
          <Lightning className="w-4 h-4" />
          <span>EV Chargers</span>
        </Button>
      </div>
    </div>,
  [navigation, currentTheme, settings.layoutTheme]);

  const MusicView = useMemo(() =>
  <div className="space-y-6">
      <Card className="p-8" style={glassStyles}>
        <div className="text-center mb-8">
          <motion.img
          src={music.albumArt}
          alt="Album Art"
          className="w-40 h-40 rounded-2xl mx-auto mb-6 shadow-2xl"
          whileHover={{ scale: 1.05 }}
          style={{ filter: 'brightness(1.1) contrast(1.2)' }} />

          <h2 className="text-2xl font-bold text-white mb-2">{music.track}</h2>
          <p className="text-gray-400 text-lg">{music.artist}</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400 w-12 text-right">
              {Math.floor(music.currentTime / 60)}:{(music.currentTime % 60).toString().padStart(2, '0')}
            </span>
            <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                width: `${music.currentTime / music.duration * 100}%`
              }}
              layoutId="progress" />

            </div>
            <span className="text-sm text-gray-400 w-12">
              {Math.floor(music.duration / 60)}:{(music.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex justify-center items-center space-x-8">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <SkipBack className="w-6 h-6" />
            </Button>
            <Button
            size="lg"
            className="rounded-full w-20 h-20 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})` }}
            onClick={() => setMusic((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))}>

              {music.isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-center space-x-4">
        <Badge
        variant={music.service === 'spotify' ? "default" : "secondary"}
        className="px-4 py-2"
        style={music.service === 'spotify' ? { backgroundColor: currentTheme.primary } : {}}>

          <Music className="w-4 h-4 mr-2" />
          Spotify Connect
        </Badge>
        <Badge variant="secondary" className="px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Bluetooth className="w-4 h-4 mr-2" />
          CarPlay Connected
        </Badge>
      </div>
    </div>,
  [music, currentTheme]);

  const SettingsView = useMemo(() =>
  <div className="space-y-6">
      {/* Layout Theme Selection */}
      <Card className="p-6" style={glassStyles}>
        <h3 className="text-xl font-bold mb-6 text-white">Customizable Display Layouts</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
        { key: 'sporty', label: 'Sporty', desc: 'Red-themed, performance-focused', color: '#ff4747' },
        { key: 'classic', label: 'Classic', desc: 'Traditional two-tube instrument look', color: '#c6e062' },
        { key: 'discreet', label: 'Discreet', desc: 'Minimalist, essential information only', color: '#6b7280' },
        { key: 'navigation', label: 'Navigation', desc: 'Full-screen map interface', color: '#3b82f6' }].
        map((theme) =>
        <Button
          key={theme.key}
          variant={settings.layoutTheme === theme.key ? "default" : "outline"}
          className="h-auto p-4 flex flex-col items-start space-y-2 text-left"
          onClick={() => setSettings((prev) => ({ ...prev, layoutTheme: theme.key as LayoutTheme }))}
          style={{
            backgroundColor: settings.layoutTheme === theme.key ? theme.color : 'rgba(255,255,255,0.1)',
            borderColor: theme.color
          }}>

              <span className="font-semibold text-white">{theme.label}</span>
              <span className="text-sm text-gray-300">{theme.desc}</span>
            </Button>
        )}
        </div>
      </Card>

      {/* Display & Visual Effects */}
      <Card className="p-6" style={glassStyles}>
        <h3 className="text-xl font-bold mb-6 text-white">Display & Visual Effects</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">Autostereoscopic 3D Display</span>
              <p className="text-sm text-gray-400">Eye-tracking 3D without glasses</p>
            </div>
            <Switch
            checked={settings.display3D}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, display3D: checked }))} />

          </div>
          
          <div className="space-y-3">
            <label className="text-white font-medium">Ambient Lighting</label>
            <div className="flex space-x-3">
              {['#ff4747', '#c6e062', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'].map((color) =>
            <button
              key={color}
              className={`w-10 h-10 rounded-full border-2 ${settings.ambientLighting === color ? 'border-white scale-110' : 'border-gray-600'} transition-all`}
              style={{ backgroundColor: color }}
              onClick={() => setSettings((prev) => ({ ...prev, ambientLighting: color }))} />

            )}
            </div>
          </div>
        </div>
      </Card>

      {/* Comfort & Vehicle Controls */}
      <Card className="p-6" style={glassStyles}>
        <h3 className="text-xl font-bold mb-6 text-white">Comfort & Vehicle Controls</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Seat Massage Intensity</span>
              <span className="text-gray-400">{settings.massageIntensity}/5</span>
            </div>
            <Slider
            value={[settings.massageIntensity]}
            onValueChange={([value]) => {
              setSettings((prev) => ({ ...prev, massageIntensity: value }));
              triggerLightingAnimation('comfort');
            }}
            max={5}
            min={0}
            step={1}
            className="w-full" />

          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Air Balance Scent Intensity</span>
              <span className="text-gray-400">{settings.scentIntensity}/3</span>
            </div>
            <Slider
            value={[settings.scentIntensity]}
            onValueChange={([value]) => setSettings((prev) => ({ ...prev, scentIntensity: value }))}
            max={3}
            min={0}
            step={1}
            className="w-full" />

          </div>

          <div className="space-y-3">
            <label className="text-white font-medium">Suspension Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['comfort', 'sport', 'eco'].map((mode) =>
            <Button
              key={mode}
              variant={settings.suspensionMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings((prev) => ({ ...prev, suspensionMode: mode }))}
              style={{
                backgroundColor: settings.suspensionMode === mode ? currentTheme.primary : 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.2)'
              }}>

                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
            )}
            </div>
          </div>
        </div>
      </Card>

      {/* Car Wash Mode */}
      <Card className="p-6" style={glassStyles}>
        <div className="text-center">
          <h4 className="text-lg font-semibold text-white mb-4">Vehicle Preparation</h4>
          <Button
          className="w-full py-4 text-lg"
          style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})` }}
          onClick={() => {
            setSettings((prev) => ({ ...prev, carWashMode: !prev.carWashMode }));
            toast.success(settings.carWashMode ?
            "Car wash mode deactivated" :
            "Car wash mode activated - Windows closing, mirrors folding");
          }}>

            <Sparkles className="w-5 h-5 mr-3" />
            {settings.carWashMode ? 'Exit Car Wash Mode' : 'Activate Car Wash Mode'}
          </Button>
          <p className="text-sm text-gray-400 mt-2">
            One-touch preparation: Closes windows, folds mirrors, locks doors
          </p>
        </div>
      </Card>
    </div>,
  [settings, currentTheme]);

  const ClimateControl = useMemo(() =>
  <Card className="p-4" style={glassStyles}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <Thermometer className="w-5 h-5 mx-auto mb-1" style={{ color: currentTheme.primary }} />
            <p className="text-sm text-white font-medium">{climate.driverTemp}°F</p>
            <p className="text-xs text-gray-400">Driver</p>
          </div>
          <div className="text-center">
            <Thermometer className="w-5 h-5 mx-auto mb-1" style={{ color: currentTheme.accent }} />
            <p className="text-sm text-white font-medium">{climate.passengerTemp}°F</p>
            <p className="text-xs text-gray-400">Passenger</p>
          </div>
          <div className="text-center">
            <Wind className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-sm text-white font-medium">{climate.fanSpeed}</p>
            <p className="text-xs text-gray-400">Fan</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
          variant="ghost"
          size="sm"
          onClick={() => setClimate((prev) => ({ ...prev, autoMode: !prev.autoMode }))}
          className="text-white hover:bg-white/10"
          style={{ backgroundColor: climate.autoMode ? currentTheme.primary : 'rgba(255,255,255,0.1)' }}>

            Auto
          </Button>
          <div className="text-center">
            <Droplets className="w-4 h-4 mx-auto mb-1 text-green-400" />
            <p className="text-xs text-gray-400">{climate.airQuality}%</p>
          </div>
        </div>
      </div>
    </Card>,
  [climate, currentTheme]);

  return (
    <div
      className="h-screen text-white overflow-hidden select-none"
      style={{
        background: currentTheme.background
      }}>

      {/* Ambient lighting animation overlay */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: lightingAnimation === 'temperature' ?
          `radial-gradient(circle at 50% 50%, ${currentTheme.primary}20, transparent 70%)` :
          lightingAnimation === 'comfort' ?
          `radial-gradient(circle at 50% 50%, ${currentTheme.accent}20, transparent 70%)` :
          'transparent'
        }}
        transition={{ duration: 0.5 }} />


      {/* Header */}
      <div className="p-4 border-b border-white/10 relative z-10" style={{ ...glassStyles, backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <motion.div
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
                animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 2, repeat: Infinity }} />

              <span className="text-sm font-medium text-white">AI Voice Assistant</span>
            </div>
            {isAlwaysListening && isListening &&
            <Badge variant="default" style={{ backgroundColor: '#22c55e' }}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                Always Listening
              </Badge>
            }
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ContactRound className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto px-4 py-3 space-x-2 border-b border-white/10 relative z-10" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        {[
        { key: 'voice', label: 'Voice Assistant', icon: Mic },
        { key: 'telemetry', label: 'Diagnostics', icon: Gauge },
        { key: 'navigation', label: 'Navigation', icon: Map },
        { key: 'music', label: 'Media Hub', icon: Music },
        { key: 'settings', label: 'Vehicle Settings', icon: Settings }].
        map(({ key, label, icon: Icon }) =>
        <Button
          key={key}
          variant={currentView === key ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentView(key as ViewMode)}
          className="flex items-center space-x-2 whitespace-nowrap text-white"
          style={{
            backgroundColor: currentView === key ? '#007AFF' : 'rgba(255,255,255,0.1)',
            borderColor: 'rgba(255,255,255,0.2)'
          }}>

            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full p-4 overflow-y-auto">

            {currentView === 'voice' &&
            <div className="flex flex-col h-full">
                <div className="flex-1">
                  {/* Voice Orb */}
                  <div className="text-center mb-8">
                    {VoiceOrb}
                    <h1 className="text-3xl font-bold mb-3 text-white">
                      {voiceState === 'listening' ? "I'm listening..." :
                    voiceState === 'processing' ? "Processing..." :
                    voiceState === 'speaking' ? "Speaking..." :
                    "Voice Assistant Ready"}
                    </h1>
                    <p className="text-gray-300 text-lg">
                      {isAlwaysListening ?
                    "Always listening for your commands - just speak naturally" :
                    "Voice recognition ready - toggle always listening mode"}
                    </p>
                  </div>
                  
                  {/* Speech to Text Display */}
                  {SpeechToTextDisplay}
                  
                  {/* Chat History */}
                  {ChatHistory}
                </div>
              </div>
            }

            {currentView === 'telemetry' && TelemetryView}
            {currentView === 'music' && MusicView}
            {currentView === 'navigation' && NavigationView}
            {currentView === 'settings' && SettingsView}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Climate Control (Always Visible) */}
      <div className="p-4 border-t border-white/10 relative z-10">
        {ClimateControl}
      </div>
    </div>);

}