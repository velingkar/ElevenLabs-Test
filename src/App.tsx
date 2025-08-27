import React, { useState, useEffect } from 'react';
import { Headphones, Settings, AlertCircle, X, MessageCircle, Bug, Database, Zap } from 'lucide-react';
import { Language, Voice } from './types';
import { ElevenLabsService } from './services/elevenLabsService';
import { getDefaultModel, getLanguagesForModel } from './data/elevenLabsData';
import { LanguageSelector } from './components/LanguageSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { ConversationPage } from './components/ConversationPage';
import { FeedbackPage } from './components/FeedbackPage';
import { DebugPage } from './components/DebugPage';
import { VoiceExportPage } from './components/VoiceExportPage';
import { VapiConversationPage } from './components/VapiConversationPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'selection' | 'conversation' | 'feedback' | 'debug' | 'voice-export' | 'vapi-conversation'>('selection');
  const [selectedModel] = useState(getDefaultModel());
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const elevenLabsService = ElevenLabsService.getInstance();

  useEffect(() => {
    // Set default language to English
    const languages = getLanguagesForModel(selectedModel.model_id);
    const defaultLanguage = languages.find(lang => lang.code === 'en') || languages[0];
    if (defaultLanguage) {
      setSelectedLanguage(defaultLanguage);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedLanguage) {
      loadVoicesForLanguage(selectedLanguage.code);
    } else {
      setVoices([]);
      setSelectedVoice(null);
    }
  }, [selectedLanguage]);

  const loadVoicesForLanguage = async (languageCode: string) => {
    setVoicesLoading(true);
    setSelectedVoice(null);
    try {
      const voiceList = await elevenLabsService.getVoicesForLanguage(languageCode);
      setVoices(voiceList);
      if (voiceList.length > 0) {
        setSelectedVoice(voiceList[0]);
      }
    } catch (error) {
      console.error('Failed to load voices for language:', error);
      setVoices([]);
    } finally {
      setVoicesLoading(false);
    }
  };

  const handleTestVoice = async (voice: Voice) => {
    if (!selectedLanguage) return;
    
    
    try {
      await elevenLabsService.playAudio(voice.preview_url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn('ElevenLabs failed, using browser TTS:', errorMsg);
      
      // Show error message to user
      setErrorMessage(`ElevenLabs API: ${errorMsg}. Using browser text-to-speech instead.`);
    }
  };

  const startConversation = () => {
    if (selectedVoice && selectedLanguage) {
      setCurrentPage('conversation');
    }
  };

  const backToSelection = () => {
    setCurrentPage('selection');
  };

  const goToFeedback = () => {
    setCurrentPage('feedback');
  };

  const completeFeedback = () => {
    setCurrentPage('selection');
  };

  const languages = getLanguagesForModel(selectedModel.model_id);

  if (currentPage === 'debug') {
    return <DebugPage onBack={() => setCurrentPage('selection')} />;
  }

  if (currentPage === 'voice-export') {
    return <VoiceExportPage onBack={() => setCurrentPage('selection')} />;
  }

  if (currentPage === 'vapi-conversation') {
    return <VapiConversationPage voices={voices} languages={languages} onBack={() => setCurrentPage('selection')} />;
  }

  if (currentPage === 'feedback' && selectedVoice && selectedLanguage) {
    return (
      <FeedbackPage
        voice={selectedVoice}
        language={selectedLanguage}
        onBack={() => setCurrentPage('conversation')}
        onComplete={completeFeedback}
      />
    );
  }

  if (currentPage === 'conversation' && selectedVoice && selectedLanguage) {
    return (
      <ConversationPage
        voice={selectedVoice}
        language={selectedLanguage}
        onBack={backToSelection}
        onEndCall={goToFeedback}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <Headphones className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ElevenLabs Voice Testing Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test different voices in multiple languages with high-quality AI speech synthesis
          </p>
          <div className="mt-4 flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage('debug')}
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug ConvAI
            </button>
            <button
              onClick={() => setCurrentPage('voice-export')}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <Database className="h-4 w-4 mr-2" />
              Export Voices
            </button>
            <button
              onClick={() => setCurrentPage('vapi-conversation')}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Conversation with VAPI
            </button>
          </div>
        </div>

        {/* Voice Testing Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-800 text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-3 text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center mb-6">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Voice Testing</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LanguageSelector
              languages={languages}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />

            <VoiceSelector
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              onTestVoice={handleTestVoice}
              loading={voicesLoading}
            />
          </div>

          {selectedVoice && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <Headphones className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedVoice.name}</h3>
                      <p className="text-blue-600 font-medium">Selected Voice Profile</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="rounded-lg p-4 text-center border border-gray-100">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Gender</p>
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {selectedVoice.labels?.gender || selectedVoice.gender || 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg p-4 text-center border border-gray-100">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Age</p>
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {selectedVoice.labels?.age || selectedVoice.age || 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg p-4 text-center border border-gray-100">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Accent</p>
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {selectedVoice.labels?.accent || selectedVoice.accent || 'Neutral'}
                      </p>
                    </div>
                    <div className="rounded-lg p-4 text-center border border-gray-100">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Category</p>
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {selectedVoice.category || 'Standard'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Available Models Section */}
                {selectedVoice.verified_languages && selectedVoice.verified_languages.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs items-center">
                      <span className="font-semibold text-gray-500">Voice ID:</span>
                      <span className="text-gray-500 font-mono">{selectedVoice.voice_id}</span>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      <span className="font-semibold text-gray-500">Language:</span>
                      <span className="text-gray-500 font-mono">{selectedVoice.language}</span>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      <span className="font-semibold text-gray-500">Available Models:</span>
                      {Array.from(new Set(selectedVoice.verified_languages.map(lang => lang.model_id))).map((modelId) => (
                        <span key={modelId} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-gray-500 font-mono">{modelId}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleTestVoice(selectedVoice)}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Listen to voice sample in selected language"
                    >
                      <Headphones className="h-5 w-5 mr-2" />
                      Listen to Sample
                    </button>
                    
                    <button
                      onClick={startConversation}
                      className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      title="Start a conversation with AI agent"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Start Conversation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">How to use:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Select your preferred language from the dropdown</li>
              <li>Choose a voice that matches your needs</li>
              <li>Click "Listen to Sample" to hear the voice sample</li>
              <li>Click "Start Conversation" to chat with an AI agent using that voice</li>
              <li>Try different combinations to find your perfect voice</li>
              <li>Use "Start Conversation with VAPI" for dynamic AI conversations</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;