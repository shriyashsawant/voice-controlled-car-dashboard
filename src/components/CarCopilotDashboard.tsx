"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  MapPin, 
  Navigation, 
  Car, 
  Fuel, 
  Thermometer, 
  Gauge, 
  Activity, 
  Battery, 
  Shield, 
  Wrench, 
  FileText,
  Share2,
  Play,
  Zap,
  Wind,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Type
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface VehicleData {
  rpm: number;
  speed: number;
  coolantTemp: number;
  throttlePosition: number;
  fuelFlow: number;
  engineLoad: number;
}

interface DiagnosticAlert {
  id: string;
  severity: 'healthy' | 'warning' | 'critical';
  title: string;
  description: string;
  value?: string;
  threshold?: string;
}

interface TripData {
  distance: number;
  averageSpeed: number;
  maxRpm: number;
  maxSpeed: number;
  fuelConsumption: number;
  ecoScore: number;
  startTime: string;
  duration: string;
}

type DashboardSection = 'voice' | 'telemetry' | 'navigation' | 'diagnostics' | 'trip';

export const CarCoPilotDashboard = () => {
  const [currentSection, setCurrentSection] = useState<DashboardSection>('voice');
  const [isListening, setIsListening] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [textInput, setTextInput] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [vehicleData, setVehicleData] = useState<VehicleData>({
    rpm: 2150,
    speed: 65,
    coolantTemp: 88,
    throttlePosition: 45,
    fuelFlow: 2.3,
    engineLoad: 42
  });

  const [obdStatus] = useState({
    connected: true,
    dongleName: 'ELM327 Pro',
    pollingRate: '10Hz',
    latency: '23ms'
  });

  const [gpsStatus] = useState({
    active: true,
    type: 'Active USB',
    accuracy: '3.2m'
  });

  const [networkStatus] = useState({
    online: true,
    strength: 4
  });

  const [carInfo] = useState({
    vin: 'WVWZZZ1JZ***6789',
    model: '2021 Volkswagen Golf GTI',
    tripStart: '14:23',
    duration: '1h 42m'
  });

  const [diagnosticAlerts] = useState<DiagnosticAlert[]>([
    {
      id: '1',
      severity: 'healthy',
      title: 'Engine Systems',
      description: 'All systems operating normally'
    },
    {
      id: '2',
      severity: 'warning',
      title: 'Coolant Temperature',
      description: 'Running warm but within acceptable range',
      value: '88°C',
      threshold: '105°C'
    },
    {
      id: '3',
      severity: 'healthy',
      title: 'Transmission',
      description: 'Smooth shifting detected'
    }
  ]);

  const [tripData] = useState<TripData>({
    distance: 87.3,
    averageSpeed: 52,
    maxRpm: 4200,
    maxSpeed: 78,
    fuelConsumption: 7.2,
    ecoScore: 72,
    startTime: '14:23',
    duration: '1h 42m'
  });

  const [insights] = useState([
    {
      icon: '🚦',
      title: 'Driving Style',
      description: 'Smooth acceleration detected. Great for fuel economy!'
    },
    {
      icon: '🌦️',
      title: 'Weather Alert',
      description: 'Rain expected in 15km. Reduce speed accordingly.'
    },
    {
      icon: '🔋',
      title: 'Maintenance',
      description: 'Oil change due in 2,100km'
    }
  ]);

  const sections: { key: DashboardSection; title: string; icon: any }[] = [
    { key: 'voice', title: 'Voice Assistant', icon: Mic },
    { key: 'telemetry', title: 'Telemetry', icon: Gauge },
    { key: 'navigation', title: 'Navigation', icon: Navigation },
    { key: 'diagnostics', title: 'Diagnostics', icon: Shield },
    { key: 'trip', title: 'Trip Summary', icon: Car }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
          setVoiceState('listening');
          setSpeechText('');
          setInterimTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setInterimTranscript(interimTranscript);
          
          if (finalTranscript) {
            setSpeechText(finalTranscript.trim());
            setVoiceState('processing');
            
            setTimeout(() => {
              setLastCommand(finalTranscript.trim());
              setVoiceState('idle');
              setIsListening(false);
              setSpeechText('');
              setInterimTranscript('');
              
              handleVoiceCommand(finalTranscript.trim());
            }, 2000);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setVoiceState('idle');
          setIsListening(false);
          setSpeechText('');
          setInterimTranscript('');
          
          let errorMessage = 'Voice recognition error';
          switch (event.error) {
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone permissions.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found. Please check your audio settings.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          toast.error(errorMessage);
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          if (voiceState === 'listening') {
            setVoiceState('idle');
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
        console.warn('SpeechRecognition not supported');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceCommand = useCallback((command: string) => {
    console.log('Processing voice command:', command);
    
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('telemetry') || lowerCommand.includes('engine') || lowerCommand.includes('performance')) {
      setCurrentSection('telemetry');
      toast.success('Showing telemetry data');
    } else if (lowerCommand.includes('navigation') || lowerCommand.includes('navigate') || lowerCommand.includes('route')) {
      setCurrentSection('navigation');
      toast.success('Opening navigation');
    } else if (lowerCommand.includes('diagnostic') || lowerCommand.includes('health') || lowerCommand.includes('check')) {
      setCurrentSection('diagnostics');
      toast.success('Running diagnostics');
    } else if (lowerCommand.includes('trip') || lowerCommand.includes('summary') || lowerCommand.includes('journey')) {
      setCurrentSection('trip');
      toast.success('Showing trip summary');
    } else {
      toast.success(`Command received: "${command}"`);
    }
  }, []);

  const handleVoiceToggle = useCallback(() => {
    if (!speechSupported) {
      toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized');
      return;
    }

    if (voiceState === 'idle') {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start voice recognition. Please try again.');
      }
    } else if (voiceState === 'listening') {
      recognitionRef.current.stop();
    }
  }, [voiceState, speechSupported]);

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleVoiceCommand(textInput);
    setLastCommand(textInput);
    setTextInput('');
  }, [textInput, handleVoiceCommand]);

  const navigateSection = (direction: 'left' | 'right') => {
    const currentIndex = sections.findIndex(s => s.key === currentSection);
    let newIndex;
    
    if (direction === 'left') {
      newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
    }
    
    setCurrentSection(sections[newIndex].key);
  };

  const getGaugeColor = (value: number, type: string) => {
    switch (type) {
      case 'rpm':
        return value > 6000 ? '#ef4444' : value > 4000 ? '#f59e0b' : '#22c55e';
      case 'temp':
        return value > 100 ? '#ef4444' : value > 95 ? '#f59e0b' : '#22c55e';
      case 'throttle':
        return value > 80 ? '#f59e0b' : '#22c55e';
      default:
        return '#22c55e';
    }
  };

  const CircularGauge = ({ value, max, title, unit, type }: {
    value: number;
    max: number;
    title: string;
    unit: string;
    type: string;
  }) => {
    const percentage = (value / max) * 100;
    const strokeDasharray = 2 * Math.PI * 45;
    const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;
    const color = getGaugeColor(value, type);

    return (
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-bold text-foreground">{Math.round(value)}</div>
          <div className="text-xs text-muted-foreground">{unit}</div>
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-center">
          {title}
        </div>
      </div>
    );
  };

  const VoiceSection = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      {!speechSupported && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-400 font-medium">
                  Voice recognition requires Chrome, Edge, or Safari browser
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        className="relative w-48 h-48 rounded-full flex items-center justify-center cursor-pointer"
        animate={{
          scale: isListening ? [1, 1.05, 1] : 1,
          boxShadow: isListening 
            ? [
                '0 0 0 0 rgba(59, 130, 246, 0.7)',
                '0 0 0 40px rgba(59, 130, 246, 0)',
                '0 0 0 0 rgba(59, 130, 246, 0)'
              ]
            : '0 0 0 0 rgba(59, 130, 246, 0)'
        }}
        transition={{
          duration: 1.5,
          repeat: isListening ? Infinity : 0,
          ease: "easeInOut"
        }}
        onClick={handleVoiceToggle}
        style={{
          background: isListening 
            ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' 
            : speechSupported
              ? 'linear-gradient(135deg, #374151, #4b5563)'
              : 'linear-gradient(135deg, #6b7280, #9ca3af)'
        }}
      >
        {voiceState === 'listening' ? (
          <Mic className="w-20 h-20 text-white" />
        ) : voiceState === 'processing' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RotateCcw className="w-20 h-20 text-white" />
          </motion.div>
        ) : (
          <MicOff className="w-20 h-20 text-white" />
        )}
      </motion.div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center"
        >
          <div className="text-2xl font-bold mb-2">
            {voiceState === 'idle' && (speechSupported ? 'Hey, I\'m your Co-Pilot' : 'Voice Assistant Unavailable')}
            {voiceState === 'listening' && 'Listening...'}
            {voiceState === 'processing' && 'Processing...'}
          </div>
          <div className="text-muted-foreground">
            {voiceState === 'idle' && (speechSupported ? 'Tap to speak or type below' : 'Please use text input below')}
            {voiceState === 'listening' && 'Speak your command'}
            {voiceState === 'processing' && 'Understanding your request'}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {(speechText || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl"
          >
            <Card className="bg-card/90 backdrop-blur-sm border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Type className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-2">Speech to Text:</div>
                    <div className="text-lg font-medium min-h-[1.5rem]">
                      <span className="text-blue-400">{speechText}</span>
                      <span className="text-blue-300/70 italic">{interimTranscript}</span>
                      {(voiceState === 'listening' || interimTranscript) && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-0.5 h-6 bg-blue-500 ml-1"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {lastCommand && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Last Command:</span>
                <span className="text-green-400 font-medium">{lastCommand}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <form onSubmit={handleTextSubmit} className="w-full max-w-2xl">
        <div className="flex gap-2">
          <Input
            placeholder="Or type your command here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="h-14 text-lg bg-background/50 border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/20"
            style={{
              boxShadow: textInput ? '0 0 0 1px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          />
          <Button type="submit" disabled={!textInput.trim()} className="h-14 px-6">
            Send
          </Button>
        </div>
      </form>

      {voiceState === 'listening' && (
        <div className="flex items-center justify-center space-x-2">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-blue-500 rounded-full"
              animate={{
                height: [8, 24, 8],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Try saying:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>"Show telemetry"</div>
              <div>"Open navigation"</div>
              <div>"Check diagnostics"</div>
              <div>"Show trip summary"</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const TelemetrySection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Live Telemetry</h2>
        <p className="text-muted-foreground">Real-time vehicle performance data</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="flex justify-center">
          <CircularGauge
            value={vehicleData.rpm}
            max={8000}
            title="Engine RPM"
            unit="RPM"
            type="rpm"
          />
        </div>
        <div className="flex justify-center">
          <CircularGauge
            value={vehicleData.speed}
            max={240}
            title="Speed"
            unit="km/h"
            type="speed"
          />
        </div>
        <div className="flex justify-center">
          <CircularGauge
            value={vehicleData.coolantTemp}
            max={120}
            title="Coolant Temp"
            unit="°C"
            type="temp"
          />
        </div>
        <div className="flex justify-center">
          <CircularGauge
            value={vehicleData.throttlePosition}
            max={100}
            title="Throttle"
            unit="%"
            type="throttle"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Fuel className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Fuel Flow</span>
            </div>
            <div className="text-3xl font-bold">{vehicleData.fuelFlow.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">L/h</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Engine Load</span>
            </div>
            <div className="text-3xl font-bold">{Math.round(vehicleData.engineLoad)}</div>
            <div className="text-sm text-muted-foreground">%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const NavigationSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Navigation</h2>
        <p className="text-muted-foreground">Route guidance and location services</p>
      </div>

      <div className="aspect-video bg-background/30 rounded-xl flex items-center justify-center relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20" />
        <div className="text-center z-10">
          <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
          <div className="text-xl font-bold mb-2">Current Location</div>
          <div className="text-muted-foreground">Highway A1, Exit 23</div>
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Next Turn:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">2.3 km</Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Navigation className="w-6 h-6 text-blue-500" />
            <span className="text-lg">Turn right onto B-road 245</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button className="h-16 flex-col space-y-2">
          <MapPin className="w-6 h-6" />
          <span>Find Stations</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col space-y-2">
          <Wind className="w-6 h-6" />
          <span>Traffic</span>
        </Button>
      </div>
    </div>
  );

  const DiagnosticsSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">System Diagnostics</h2>
        <p className="text-muted-foreground">Vehicle health and maintenance alerts</p>
      </div>

      <div className="space-y-4">
        {diagnosticAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    {alert.severity === 'healthy' && (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    )}
                    {alert.severity === 'warning' && (
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    )}
                    {alert.severity === 'critical' && (
                      <XCircle className="w-8 h-8 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold mb-2">{alert.title}</div>
                    <div className="text-muted-foreground mb-2">{alert.description}</div>
                    {alert.value && (
                      <div className="text-lg">
                        <span className="font-bold text-primary">{alert.value}</span>
                        {alert.threshold && (
                          <span className="text-muted-foreground"> / {alert.threshold}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Smart Insights</h3>
        {insights.map((insight, index) => (
          <Card key={index} className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{insight.icon}</div>
                <div>
                  <div className="font-bold text-lg">{insight.title}</div>
                  <div className="text-muted-foreground">{insight.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const TripSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Trip Summary</h2>
        <p className="text-muted-foreground">Current journey statistics and performance</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">{tripData.distance}</div>
            <div className="text-muted-foreground">km traveled</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">{tripData.averageSpeed}</div>
            <div className="text-muted-foreground">avg speed km/h</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">{tripData.maxSpeed}</div>
            <div className="text-muted-foreground">max speed km/h</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">{tripData.fuelConsumption}</div>
            <div className="text-muted-foreground">L/100km</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">Eco Score</span>
            <span className="text-2xl font-bold text-green-500">{tripData.ecoScore}/100 🌱</span>
          </div>
          <Progress value={tripData.ecoScore} className="h-4" />
          <div className="text-center mt-4 text-muted-foreground">
            Great driving! You are saving fuel and reducing emissions.
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection = () => {
    switch (currentSection) {
      case 'voice':
        return <VoiceSection />;
      case 'telemetry':
        return <TelemetrySection />;
      case 'navigation':
        return <NavigationSection />;
      case 'diagnostics':
        return <DiagnosticsSection />;
      case 'trip':
        return <TripSection />;
      default:
        return <VoiceSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 rounded-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                {obdStatus.connected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="text-sm">
                  <div className="font-medium">{obdStatus.dongleName}</div>
                  <div className="text-muted-foreground">
                    {obdStatus.pollingRate} • {obdStatus.latency}
                  </div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <div className="text-sm">
                  <div className="font-medium">{gpsStatus.type}</div>
                  <div className="text-muted-foreground">±{gpsStatus.accuracy}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {networkStatus.online ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {networkStatus.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-medium">{carInfo.model}</div>
                <div className="text-muted-foreground">{carInfo.vin}</div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <div className="font-medium">Trip: {carInfo.duration}</div>
                <div className="text-muted-foreground">Started {carInfo.tripStart}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 bg-card/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateSection('right')}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <div className="flex items-center space-x-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.key}
                variant={currentSection === section.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentSection(section.key)}
                className="flex items-center space-x-2"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.title}</span>
              </Button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateSection('left')}
          className="flex items-center space-x-2"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};