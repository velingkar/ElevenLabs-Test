import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Bot, User, Volume2, Play, Pause, PhoneOff, Loader2 } from 'lucide-react';
import { Voice, Language } from '../types';
import { ElevenLabsService, ElevenLabsAgent } from '../services/elevenLabsService';
import { ConvaiService } from '../services/convaiService';

// Type declarations for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ConversationPageProps {
  voice: Voice;
  language: Language;
  agent: ElevenLabsAgent;
  onBack: () => void;
  onEndCall: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'agent';
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

export function ConversationPage({ voice, language, agent, onBack, onEndCall }: ConversationPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const elevenLabsService = ElevenLabsService.getInstance();
  const convaiService = ConvaiService.getInstance();

  useEffect(() => {
    // Initialize conversation by creating an agent
    const initConversation = async () => {
      try {
        setIsProcessing(true);
        
        // Create the AI agent
        const agent = await convaiService.createAgent(voice.voice_id, voice.gender || 'Male', language.code);
        
        // Get the initial message from the agent in the correct language
        const initialMessage = convaiService.getInitialGreeting(language.code);
        
        const agentMessage: Message = {
          id: Date.now().toString(),
          type: 'agent',
          text: initialMessage,
          timestamp: new Date()
        };

        try {
          const modelId = voice.verified_languages?.[0]?.model_id || 'eleven_multilingual_v2';
          const audioUrl = await elevenLabsService.generateSpeech(initialMessage, voice.voice_id, modelId);
          agentMessage.audioUrl = audioUrl;
        } catch (error) {
          console.warn('Failed to generate greeting audio:', error);
        }
        
        setMessages([agentMessage]);
        
        // Auto-play the greeting
        setTimeout(() => {
          playAgentMessage(agentMessage);
        }, 500);
      } catch (error) {
        console.error('Failed to create agent:', error);
        // Fallback to a simple greeting
        const fallbackMessage: Message = {
          id: Date.now().toString(),
          type: 'agent',
          text: `Hello! I'm your smartphone specialist. I'd love to help you find the perfect phone. What brings you in today?`,
          timestamp: new Date()
        };
        setMessages([fallbackMessage]);
      } finally {
        setIsProcessing(false);
      }
    };

    initConversation();
  }, [voice, language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language.code === 'zh' ? 'zh-CN' : language.code;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserSpeech(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isAgentSpeaking) {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        setCurrentPlayingId(null);
        setIsAgentSpeaking(false);
      }
      
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleUserSpeech = async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: transcript.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Get AI response from ConvAI agent
      const convaiResponse = await convaiService.simulateConversation(transcript.trim());
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: convaiResponse.response,
        timestamp: new Date()
      };

      // Always generate speech with ElevenLabs TTS to ensure correct voice
      console.log('Generating TTS with voice ID:', voice.voice_id);
      
      try {
        const modelId = voice.verified_languages?.[0]?.model_id || 'eleven_multilingual_v2';
        console.log('Using model ID for TTS:', modelId);
        const audioUrl = await elevenLabsService.generateSpeech(convaiResponse.response, voice.voice_id, modelId);
        agentMessage.audioUrl = audioUrl;

      } catch (error) {
        console.warn('Failed to generate response audio:', error);
        // Fallback to ConvAI audio if available
        if (convaiResponse.audio_url) {
  
          agentMessage.audioUrl = convaiResponse.audio_url;
        }
      }

      setMessages(prev => [...prev, agentMessage]);
      
      // Auto-play the agent response
      if (agentMessage.audioUrl) {
        setTimeout(() => {
          playAgentMessage(agentMessage);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAgentMessage = async (message: Message) => {
    if (!message.audioUrl || isAgentSpeaking) return;
    
    setIsAgentSpeaking(true);
    setCurrentPlayingId(message.id);
    
    try {
      await elevenLabsService.playAudio(message.audioUrl);
      setIsAgentSpeaking(false);
      setCurrentPlayingId(null);
    } catch (error) {
      console.error('Failed to play audio:', error);
      
      // Fallback to browser TTS
      try {
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = language.code === 'zh' ? 'zh-CN' : language.code;
        
        utterance.onend = () => {
          setIsAgentSpeaking(false);
          setCurrentPlayingId(null);
        };
        
        utterance.onerror = () => {
          setIsAgentSpeaking(false);
          setCurrentPlayingId(null);
        };
        
        speechSynthesis.speak(utterance);
      } catch (ttsError) {
        console.error('Browser TTS also failed:', ttsError);
        setIsAgentSpeaking(false);
        setCurrentPlayingId(null);
      }
    }
  };

  const stopAgentSpeaking = () => {
    // Stop speech synthesis
    speechSynthesis.cancel();
    
    // Stop regular audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    setIsAgentSpeaking(false);
    setCurrentPlayingId(null);
  };

  const replayMessage = (message: Message) => {
    if (message.audioUrl && !isAgentSpeaking) {
      playAgentMessage(message);
    }
  };

  const canStartListening = !isListening && !isProcessing && !isAgentSpeaking && recognitionRef.current;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Voice Selection
          </button>
          
                      <div className="flex items-center space-x-6">
              <div className="text-right">
                <h2 className="font-semibold text-gray-900">{agent.name}</h2>
                <p className="text-sm text-gray-600">{language.flag} {language.name}</p>
                <p className="text-xs text-blue-600 font-medium">Agent ID: {agent.agent_id}</p>
                <p className="text-xs text-gray-500">Voice: {voice.name} | Model: {agent.conversation_config.tts.model_id}</p>
                <p className="text-xs text-gray-500">LLM: {agent.conversation_config.agent.prompt.llm} | Temp: {agent.conversation_config.agent.prompt.temperature}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
            
            <button
              onClick={onEndCall}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              title="End call and provide feedback"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </button>
          </div>
        </div>
      </div>

      {/* Voice Status */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-6">
            {isListening && (
              <div className="flex items-center text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="font-medium">Listening...</span>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center text-blue-600">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                <span className="font-medium">Processing...</span>
              </div>
            )}
            
            {isAgentSpeaking && (
              <div className="flex items-center text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="font-medium">Agent Speaking...</span>
              </div>
            )}
            
            {!isListening && !isProcessing && !isAgentSpeaking && (
              <div className="flex items-center text-gray-500">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="font-medium">Ready to listen</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Transcript */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Agent Conversation</h3>
            <p className="text-sm text-gray-500">Speak naturally with your AI smartphone sales agent</p>
          </div>
          
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'agent' && (
                      <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      {message.type === 'agent' && message.audioUrl && (
                        <button
                          onClick={() => replayMessage(message)}
                          disabled={isAgentSpeaking}
                          className={`mt-2 flex items-center text-xs transition-colors ${
                            currentPlayingId === message.id
                              ? 'text-green-600'
                              : 'text-blue-600 hover:text-blue-800'
                          } disabled:opacity-50`}
                        >
                          {currentPlayingId === message.id ? (
                            <Pause className="h-3 w-3 mr-1" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          {currentPlayingId === message.id ? 'Playing...' : 'Replay'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border border-gray-200 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-4">
            {/* Main Microphone Button */}
            <div className="relative">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!canStartListening && !isListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold shadow-lg transform transition-all duration-200 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 scale-110 animate-pulse'
                    : canStartListening
                    ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </button>
              
              {isListening && (
                <div className="absolute -inset-2 border-4 border-red-300 rounded-full animate-ping"></div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 mb-1">
                {isListening
                  ? 'Listening... Speak now'
                  : isProcessing
                  ? 'Processing your message...'
                  : isAgentSpeaking
                  ? 'Agent is speaking...'
                  : 'Tap to speak with your voice agent'
                }
              </p>
              <p className="text-sm text-gray-500">
                {!recognitionRef.current
                  ? 'Speech recognition not supported in this browser'
                  : isAgentSpeaking
                  ? 'Wait for the agent to finish, then speak'
                  : 'Hold the button and speak naturally'
                }
              </p>
            </div>
            
            {/* Stop Agent Button */}
            {isAgentSpeaking && (
              <button
                onClick={stopAgentSpeaking}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium"
              >
                Stop Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}