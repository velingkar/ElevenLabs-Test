import React, { useState, useEffect, useRef } from 'react';
import { VapiService, VapiAgent, VapiMessage } from '../services/vapiService';
import { Voice, Language } from '../types';
import { VoiceSelector } from './VoiceSelector';
import { LanguageSelector } from './LanguageSelector';
import { ElevenLabsService } from '../services/elevenLabsService';
import { Phone, PhoneOff } from 'lucide-react';

interface VapiConversationPageProps {
  voices: Voice[];
  languages: Language[];
  onBack: () => void;
}

export const VapiConversationPage: React.FC<VapiConversationPageProps> = ({
  voices,
  languages,
  onBack
}) => {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [agent, setAgent] = useState<VapiAgent | null>(null);
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // VAPI Web SDK states
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('idle');
  const [transcript, setTranscript] = useState('');
  
  const vapiService = VapiService.getInstance();
  const elevenLabsService = ElevenLabsService.getInstance();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load voices when language changes
  useEffect(() => {
    if (selectedLanguage) {
      loadVoicesForLanguage(selectedLanguage.code);
    } else {
      setAvailableVoices([]);
      setSelectedVoice(null);
    }
  }, [selectedLanguage]);

  const testConnection = async () => {
    try {
      const connected = await vapiService.testApiConnection();
      setIsConnected(connected);
      if (!connected) {
        setError('VAPI API connection failed. Please check your API key.');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      setError('Failed to test VAPI connection.');
    }
  };

  const loadVoicesForLanguage = async (languageCode: string) => {
    setIsLoadingVoices(true);
    setSelectedVoice(null);
    setError(null);
    
    try {
      const voiceList = await elevenLabsService.getVoicesForLanguage(languageCode);
      setAvailableVoices(voiceList);
      if (voiceList.length > 0) {
        setSelectedVoice(voiceList[0]);
      }
    } catch (error) {
      console.error('Failed to load voices for language:', error);
      setAvailableVoices([]);
      setError(`Failed to load voices for ${selectedLanguage?.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedVoice(null); // Reset voice selection when language changes
  };

  const handleCreateAgent = async () => {
    if (!selectedVoice || !selectedLanguage) {
      setError('Please select both a voice and language.');
      return;
    }

    setIsCreatingAgent(true);
    setError(null);

    try {
      const newAgent = await vapiService.createAgent(
        selectedVoice.voice_id,
        selectedLanguage.code,
        `DynamicAgent_${selectedLanguage.name}`
      );
      
      setAgent(newAgent);
      console.log('Agent created successfully:', newAgent);
    } catch (error) {
      console.error('Failed to create agent:', error);
      setError(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleStartCall = async () => {
    if (!selectedVoice || !selectedLanguage) {
      setError('Please select both a voice and language.');
      return;
    }

    setIsStartingCall(true);
    setError(null);

    try {
      console.log('Starting voice call with voice:', selectedVoice);
      console.log('Selected voice details:', selectedVoice);
      console.log('Voice ID:', selectedVoice.voice_id);
      
      // Update status to show what's happening
      setCallStatus('connecting');
      setTranscript('Starting voice call...');
      
      const call = await vapiService.startVoiceCall(selectedVoice.voice_id, selectedLanguage.code);
      setIsCallActive(true);
      setCallStatus('active');
      setTranscript(`Call started with voice: ${selectedVoice?.name} (ID: ${selectedVoice.voice_id})`);
      
      // Setup VAPI Web SDK event listeners
      const vapiInstance = vapiService.getVapiInstance();
      if (vapiInstance) {
        // Log voice information for debugging
        console.log('Starting call with voice ID:', selectedVoice.voice_id);
        console.log('Selected voice details:', selectedVoice);
        
        vapiInstance.on('call-start', () => {
          console.log('Call started');
          setCallStatus('active');
          setTranscript(`Call started with voice: ${selectedVoice?.name} (ID: ${selectedVoice.voice_id})`);
        });

        vapiInstance.on('call-end', () => {
          console.log('Call ended');
          setCallStatus('ended');
          setIsCallActive(false);
          setTranscript('Call ended');
        });

        vapiInstance.on('speech-start', () => {
          console.log('Agent started speaking');
          setTranscript('Agent is speaking...');
        });

        vapiInstance.on('speech-end', () => {
          console.log('Agent finished speaking');
          setTranscript('Agent finished speaking');
        });

        vapiInstance.on('message', (message: any) => {
          console.log('Message received:', message);
          
          // Handle different message types
          if (message.type === 'transcript' && message.transcript) {
            const transcriptData = message.transcript;
            if (transcriptData.role === 'user') {
              setTranscript(`You said: ${transcriptData.text}`);
              // Add user message to chat
              const userMessage: VapiMessage = {
                role: 'user',
                content: transcriptData.text,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, userMessage]);
            } else if (transcriptData.role === 'assistant') {
              setTranscript(`Agent said: ${transcriptData.text}`);
              // Add agent message to chat
              const agentMessage: VapiMessage = {
                role: 'agent',
                content: transcriptData.text,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, agentMessage]);
            }
          }
        });

        vapiInstance.on('error', (error: any) => {
          console.error('VAPI error:', error);
          setError(`VAPI error: ${error.message}`);
        });
      }
      
      console.log('Voice call started successfully:', call);
    } catch (error) {
      console.error('Failed to start call:', error);
      setError(`Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCallStatus('idle');
      setTranscript('');
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleEndCall = async () => {
    try {
      await vapiService.stopVoiceCall();
      setIsCallActive(false);
      setCallStatus('idle');
      setTranscript('');
    } catch (error) {
      console.error('Failed to end call:', error);
      setError(`Failed to end call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">VAPI Voice Call</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'VAPI Connected' : 'VAPI Disconnected'}
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Setup Section */}
          {!isCallActive && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-700">Setup Your Voice Call</h2>
              
              {/* Step 1: Language Selection */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Step 1: Select Language</h3>
                <LanguageSelector
                  languages={languages}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={handleLanguageChange}
                />
              </div>

              {/* Step 2: Voice Selection (only show if language is selected) */}
              {selectedLanguage && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-lg font-medium text-green-900 mb-3">
                    Step 2: Select Voice for {selectedLanguage.name}
                  </h3>
                  {isLoadingVoices ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-3 text-green-700">Loading voices for {selectedLanguage.name}...</span>
                    </div>
                  ) : availableVoices.length > 0 ? (
                    <div className="space-y-4">
                      <VoiceSelector
                        voices={availableVoices}
                        selectedVoice={selectedVoice}
                        onVoiceChange={setSelectedVoice}
                        onTestVoice={() => {}} // Empty function since we don't need test functionality here
                      />
                      
                      {/* Voice Metadata Display */}
                      {selectedVoice && (
                        <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm">
                          <h4 className="text-sm font-semibold text-green-800 mb-3">Selected Voice Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Voice ID:</span>
                              <span className="text-gray-800 font-mono text-xs">{selectedVoice.voice_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Name:</span>
                              <span className="text-gray-800">{selectedVoice.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Gender:</span>
                              <span className="text-gray-800 capitalize">
                                {selectedVoice.labels?.gender || selectedVoice.gender || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Category:</span>
                              <span className="text-gray-800 capitalize">
                                {selectedVoice.category || 'Standard'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Age:</span>
                              <span className="text-gray-800 capitalize">
                                {selectedVoice.labels?.age || selectedVoice.age || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Accent:</span>
                              <span className="text-gray-800 capitalize">
                                {selectedVoice.labels?.accent || selectedVoice.accent || 'Neutral'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-red-600">
                      No voices available for {selectedLanguage.name}
                    </div>
                  )}
                </div>
              )}

              {/* Start Call Button */}
              {selectedVoice && selectedLanguage && (
                <div className="space-y-3">
                  <button
                    onClick={handleStartCall}
                    disabled={isStartingCall || !isConnected}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isStartingCall ? 'Starting Voice Call...' : 'Start Voice Call'}
                  </button>
                  
                  {/* Debug Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700 mb-1">Debug Info:</p>
                    <p className="text-gray-600">Voice ID: {selectedVoice.voice_id}</p>
                    <p className="text-gray-600">Language: {selectedLanguage.code}</p>
                    <p className="text-gray-600">VAPI Connected: {isConnected ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Start Call Section */}
          {isCallActive && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">Voice Call</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  <strong>Voice:</strong> {selectedVoice?.name}<br/>
                  <strong>Language:</strong> {selectedLanguage?.name}
                </p>
              </div>
              
              <button
                onClick={handleEndCall}
                disabled={isStartingCall}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                End Call
              </button>
            </div>
          )}
        </div>

        {/* Voice Call Section */}
        {isCallActive && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Voice Call</h2>
              <button
                onClick={handleEndCall}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                End Call
              </button>
            </div>

            {/* Call Status */}
            <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className={`w-4 h-4 rounded-full ${
                callStatus === 'active' ? 'bg-green-500' : 
                callStatus === 'connecting' ? 'bg-yellow-500' : 
                callStatus === 'ended' ? 'bg-red-500' :
                'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {callStatus === 'active' ? 'Call Active' : 
                 callStatus === 'connecting' ? 'Connecting...' : 
                 callStatus === 'ended' ? 'Call Ended' :
                 'Ready to Start'}
              </span>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {isCallActive ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Phone className="h-6 w-6" />
                  <span>Voice call is active - speak naturally!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <PhoneOff className="h-6 w-6" />
                  <span>Call ended</span>
                </div>
              )}
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {transcript}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {isCallActive ? 
                    'Start speaking to begin the conversation!' : 
                    'Call ended - no messages recorded'
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">How to use:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Speak naturally when the call is active</li>
                <li>• The agent will respond with voice</li>
                <li>• Your conversation will be transcribed below</li>
                <li>• Click "End Call" when finished</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
