"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { 
  Mic, 
  MicOff, 
  Terminal, 
  Command as CommandIcon, 
  Speech, 
  Keyboard,
  Speaker,
  MicVocal,
  Headset
} from 'lucide-react';

// Types
interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: Date;
  result: string;
  confidence: number;
  type: 'voice' | 'text';
  intent?: string;
  parameters?: Record<string, any>;
}

interface ParsedCommand {
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
  action: string;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  interimTranscript: string;
  finalTranscript: string;
  waveformLevels: number[];
}

const COMMON_SUGGESTIONS = [
  "show engine codes",
  "clear diagnostic codes",
  "plan route to",
  "what is my fuel economy?",
  "check tire pressure",
  "show maintenance schedule",
  "scan for issues",
  "reset service light",
  "show vehicle health",
  "navigate to nearest gas station"
];

const MOCK_COMMANDS = {
  "show engine codes": { intent: "diagnostic", action: "show_codes", params: {} },
  "clear diagnostic codes": { intent: "diagnostic", action: "clear_codes", params: {}, requiresConfirmation: true },
  "plan route to": { intent: "navigation", action: "plan_route", params: { destination: "" } },
  "what is my fuel economy": { intent: "telemetry", action: "fuel_economy", params: {} },
  "check tire pressure": { intent: "diagnostic", action: "tire_pressure", params: {} },
  "show maintenance schedule": { intent: "maintenance", action: "schedule", params: {} }
};

export default function VoiceAndTextCommandConsole() {
  // State management
  const [inputValue, setInputValue] = useState('');
  const [isSimulateMode, setIsSimulateMode] = useState(true);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    interimTranscript: '',
    finalTranscript: '',
    waveformLevels: [0.2, 0.4, 0.1, 0.6, 0.3, 0.8, 0.2, 0.5]
  });
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceState(prev => ({ ...prev, isListening: true, isProcessing: false }));
      };

      recognition.onresult = (event) => {
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

        setVoiceState(prev => ({
          ...prev,
          interimTranscript,
          finalTranscript: finalTranscript || prev.finalTranscript
        }));

        if (finalTranscript) {
          setInputValue(finalTranscript.trim());
          handleVoiceCommand(finalTranscript.trim());
        }
      };

      recognition.onerror = () => {
        setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
        toast.error('Voice recognition error. Please try again.');
      };

      recognition.onend = () => {
        setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Parse command to extract intent and parameters
  const parseCommand = useCallback((command: string): ParsedCommand => {
    const lowerCommand = command.toLowerCase().trim();
    
    // Check for exact or partial matches
    for (const [key, config] of Object.entries(MOCK_COMMANDS)) {
      if (lowerCommand.includes(key.toLowerCase())) {
        return {
          intent: config.intent,
          parameters: config.params,
          confidence: 0.95,
          requiresConfirmation: config.requiresConfirmation || false,
          action: config.action
        };
      }
    }

    // Handle route planning with destination
    if (lowerCommand.includes('route to') || lowerCommand.includes('navigate to')) {
      const destination = command.replace(/^(plan route to|navigate to)\s*/i, '').trim();
      return {
        intent: 'navigation',
        parameters: { destination },
        confidence: 0.85,
        requiresConfirmation: false,
        action: 'plan_route'
      };
    }

    // Default fallback
    return {
      intent: 'unknown',
      parameters: {},
      confidence: 0.1,
      requiresConfirmation: false,
      action: 'unknown'
    };
  }, []);

  // Handle voice command processing
  const handleVoiceCommand = useCallback((transcript: string) => {
    setVoiceState(prev => ({ ...prev, isProcessing: true }));
    
    setTimeout(() => {
      const parsed = parseCommand(transcript);
      setParsedCommand(parsed);
      
      if (parsed.requiresConfirmation) {
        setShowConfirmDialog(true);
      } else {
        executeCommand(transcript, parsed, 'voice');
      }
      
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }, 1000);
  }, [parseCommand]);

  // Execute command
  const executeCommand = useCallback(async (command: string, parsed: ParsedCommand, type: 'voice' | 'text') => {
    setIsExecuting(true);
    
    try {
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let result = '';
      switch (parsed.action) {
        case 'show_codes':
          result = 'Found 2 diagnostic codes: P0301, P0420';
          break;
        case 'clear_codes':
          result = 'All diagnostic codes cleared successfully';
          break;
        case 'plan_route':
          result = `Route planned to ${parsed.parameters.destination || 'destination'}`;
          break;
        case 'fuel_economy':
          result = 'Current fuel economy: 28.5 MPG';
          break;
        case 'tire_pressure':
          result = 'All tires within normal range (32-35 PSI)';
          break;
        case 'schedule':
          result = 'Next service due in 2,500 miles';
          break;
        default:
          result = `Command processed: ${command}`;
      }

      const historyItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command,
        timestamp: new Date(),
        result,
        confidence: parsed.confidence,
        type,
        intent: parsed.intent,
        parameters: parsed.parameters
      };

      setCommandHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      toast.success('Command executed successfully');
      
    } catch (error) {
      toast.error('Command execution failed');
    } finally {
      setIsExecuting(false);
      setParsedCommand(null);
      setInputValue('');
    }
  }, []);

  // Handle text input submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const parsed = parseCommand(inputValue);
    
    if (parsed.requiresConfirmation) {
      setParsedCommand(parsed);
      setShowConfirmDialog(true);
    } else {
      executeCommand(inputValue, parsed, 'text');
    }
  }, [inputValue, parseCommand, executeCommand]);

  // Toggle voice listening
  const toggleVoiceListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }

    if (voiceState.isListening) {
      recognitionRef.current.stop();
    } else {
      setInputMode('voice');
      setVoiceState(prev => ({ 
        ...prev, 
        interimTranscript: '', 
        finalTranscript: '' 
      }));
      recognitionRef.current.start();
    }
  }, [voiceState.isListening]);

  // Filter suggestions based on input
  const filteredSuggestions = COMMON_SUGGESTIONS.filter(suggestion =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Command Console</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isSimulateMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsSimulateMode(!isSimulateMode)}
          >
            {isSimulateMode ? "Simulate" : "Live"}
          </Button>
          <Button
            variant={inputMode === 'voice' ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
          >
            {inputMode === 'voice' ? <MicVocal className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Voice Control Section */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        {/* Microphone Button */}
        <Button
          size="lg"
          variant={voiceState.isListening ? "default" : "outline"}
          onClick={toggleVoiceListening}
          disabled={voiceState.isProcessing}
          className="relative"
        >
          {voiceState.isProcessing ? (
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          ) : voiceState.isListening ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </Button>

        {/* Waveform Visualization */}
        <div className="flex items-center gap-1 flex-1">
          {voiceState.waveformLevels.map((level, index) => (
            <div
              key={index}
              className={`w-1 bg-primary rounded-full transition-all duration-200 ${
                voiceState.isListening ? 'opacity-100' : 'opacity-30'
              }`}
              style={{ 
                height: `${8 + level * 16}px`,
                transform: voiceState.isListening ? `scaleY(${0.5 + level})` : 'scaleY(0.5)'
              }}
            />
          ))}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            voiceState.isListening ? 'bg-green-500' : 
            voiceState.isProcessing ? 'bg-yellow-500' : 'bg-gray-500'
          }`} />
          <span className="text-sm text-muted-foreground">
            {voiceState.isProcessing ? 'Processing...' : 
             voiceState.isListening ? 'Listening' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Voice Transcript Display */}
      {(voiceState.interimTranscript || voiceState.finalTranscript) && (
        <div className="p-3 bg-secondary rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Speech className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Voice Input</span>
          </div>
          <p className="text-sm">
            <span className="text-foreground">{voiceState.finalTranscript}</span>
            <span className="text-muted-foreground italic">{voiceState.interimTranscript}</span>
          </p>
        </div>
      )}

      {/* Text Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(inputValue.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Type a command or use voice input..."
              className="pr-10"
              disabled={isExecuting}
            />
            <CommandIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button type="submit" disabled={!inputValue.trim() || isExecuting}>
            {isExecuting ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              'Execute'
            )}
          </Button>
        </div>

        {/* Command Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1">
            <Command className="bg-popover border border-border rounded-lg shadow-lg">
              <CommandList>
                <CommandGroup>
                  {filteredSuggestions.slice(0, 5).map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => {
                        setInputValue(suggestion);
                        setShowSuggestions(false);
                        inputRef.current?.focus();
                      }}
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </form>

      {/* Parsed Command Display */}
      {parsedCommand && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Headset className="h-4 w-4 text-primary" />
            <span className="font-medium">Parsed Command</span>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Intent:</span>
              <span className="ml-2 font-medium">{parsedCommand.intent}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Confidence:</span>
              <span className="ml-2">{Math.round(parsedCommand.confidence * 100)}%</span>
            </div>
            {Object.keys(parsedCommand.parameters).length > 0 && (
              <div>
                <span className="text-muted-foreground">Parameters:</span>
                <div className="ml-2 mt-1 flex gap-2 flex-wrap">
                  {Object.entries(parsedCommand.parameters).map(([key, value]) => (
                    <span key={key} className="px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Recent Commands</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commandHistory.map((item) => (
              <div key={item.id} className="p-3 bg-muted rounded-lg text-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'voice' ? (
                      <Speaker className="h-3 w-3 text-primary" />
                    ) : (
                      <Terminal className="h-3 w-3 text-primary" />
                    )}
                    <span className="font-medium">{item.command}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{Math.round(item.confidence * 100)}%</span>
                    <span>{item.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
                <p className="text-muted-foreground">{item.result}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              This command will modify your vehicle state. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          {parsedCommand && (
            <div className="py-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Action:</span>
                  <span className="ml-2">{parsedCommand.action}</span>
                </div>
                <div>
                  <span className="font-medium">Intent:</span>
                  <span className="ml-2">{parsedCommand.intent}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (parsedCommand) {
                  executeCommand(inputValue, parsedCommand, inputMode);
                }
                setShowConfirmDialog(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}