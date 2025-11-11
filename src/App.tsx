import { useState, useEffect } from 'react';
import { Headphones, Settings, AlertCircle, X, Bot } from 'lucide-react';
import { Language, Voice } from './types';
import { ElevenLabsService, ElevenLabsAgent } from './services/elevenLabsService';
import { getLanguagesForModel, ELEVENLABS_MODELS } from './data/elevenLabsData';
import { LanguageSelector } from './components/LanguageSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { ConversationPage } from './components/ConversationPage';
import { FeedbackPage } from './components/FeedbackPage';
import { DebugPage } from './components/DebugPage';
import { VoiceExportPage } from './components/VoiceExportPage';

const APP_VERSION = 'V 1.02';

function App() {
  const [currentPage, setCurrentPage] = useState<'selection' | 'conversation' | 'feedback' | 'debug' | 'voice-export'>('selection');
  // Fixed model - Eleven Turbo v2.5
  const selectedModel = ELEVENLABS_MODELS.find(m => m.model_id === 'eleven_turbo_v2') || ELEVENLABS_MODELS[0];
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [voiceType, setVoiceType] = useState<string>('high_quality');
  const [voiceSort, setVoiceSort] = useState<string>('usage_character_count_1y');
  const [voiceSearchTerm, setVoiceSearchTerm] = useState<string>('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicePage, setVoicePage] = useState(1);
  const [voiceHasMore, setVoiceHasMore] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdAgent, setCreatedAgent] = useState<ElevenLabsAgent | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [showAgentDetails, setShowAgentDetails] = useState(false);

  const elevenLabsService = ElevenLabsService.getInstance();

  // Get model ID based on selected language
  const getModelIdForLanguage = (languageCode: string): string => {
    if (languageCode === 'en') {
      return 'eleven_turbo_v2';
    }
    return 'eleven_turbo_v2_5';
  };

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
      setVoicePage(1);
      loadVoicesForLanguage(selectedLanguage.code, 1);
    } else {
      setVoices([]);
      setSelectedVoice(null);
      setVoiceHasMore(false);
      setVoicePage(1);
    }
  }, [selectedLanguage, voiceType, voiceSort]);

  const loadVoicesForLanguage = async (languageCode: string, page: number) => {
    setVoicesLoading(true);
    try {
      // Use empty string when "all" is selected, otherwise use the selected voiceType
      const category = voiceType === 'all' ? '' : voiceType;
      const { voices: voiceList, hasMore } = await elevenLabsService.getVoicesForLanguage(
        languageCode,
        category,
        page,
        30,
        voiceSort
      );
      setVoices(voiceList);
      setVoiceHasMore(hasMore);
      setVoicePage(page);

      setSelectedVoice(prev => {
        if (voiceList.length === 0) {
          return null;
        }

        if (prev) {
          const match = voiceList.find(v => v.voice_id === prev.voice_id);
          if (match) {
            return match;
          }
        }

        return voiceList[0];
      });
    } catch (error) {
      console.error('Failed to load voices for language:', error);
      setVoices([]);
      setVoiceHasMore(false);
    } finally {
      setVoicesLoading(false);
    }
  };

  const handleNextVoicePage = () => {
    if (!selectedLanguage || voicesLoading || !voiceHasMore) return;
    loadVoicesForLanguage(selectedLanguage.code, voicePage + 1);
  };

  const handlePrevVoicePage = () => {
    if (!selectedLanguage || voicesLoading || voicePage <= 1) return;
    loadVoicesForLanguage(selectedLanguage.code, voicePage - 1);
  };

  const handleTestVoice = async (voice: Voice) => {
    if (!selectedLanguage) return;
    
    
    if (!voice.preview_url) {
      setErrorMessage('Preview not available for this voice ID.');
      return;
    }

    try {
      await elevenLabsService.playAudio(voice.preview_url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn('ElevenLabs failed, using browser TTS:', errorMsg);
      
      // Show error message to user
      setErrorMessage(`ElevenLabs API: ${errorMsg}. Using browser text-to-speech instead.`);
    }
  };

  const startConversation = async () => {
    if (!selectedVoice || !selectedLanguage) {
      setErrorMessage('Please select both language and voice first');
      return;
    }

    // Clear any previous state
    setIsCreatingAgent(true);
    setErrorMessage(null);
    setShowAgentDetails(false);
    setCreatedAgent(null);

    try {
      // Step 1: Create the agent
      // Select model based on language: 'en' uses 'eleven_turbo_v2', others use 'eleven_turbo_v2_5'
      const modelId = getModelIdForLanguage(selectedLanguage.code);
      const agent = await elevenLabsService.createAgent(
        selectedLanguage.code,
        selectedVoice.voice_id,
        selectedVoice.name,
        modelId,
        selectedVoice
      );

      setCreatedAgent(agent);
      setShowAgentDetails(true);
      
      // Auto-proceed to conversation after showing details for 3 seconds
      setTimeout(() => {
        setShowAgentDetails(false);
        setCurrentPage('conversation');
      }, 5000);

    } catch (error: any) {
      console.error('Error creating agent:', error);
      
      // Enhanced error message with more details
      let errorMsg = 'Failed to create agent';
      if (error.message) {
        errorMsg = error.message;
      } else if (error.error) {
        errorMsg = error.error;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      setErrorMessage(`Agent Creation Error: ${errorMsg}`);
      setShowAgentDetails(false);
      setCreatedAgent(null);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const backToSelection = () => {
    setCurrentPage('selection');
    setCreatedAgent(null);
    setShowAgentDetails(false);
  };

  const goToFeedback = () => {
    setCurrentPage('feedback');
  };

  const completeFeedback = () => {
    setCurrentPage('selection');
    setCreatedAgent(null);
    setShowAgentDetails(false);
  };

  const languages = getLanguagesForModel(selectedModel.model_id);

  if (currentPage === 'debug') {
    return <DebugPage onBack={() => setCurrentPage('selection')} />;
  }

  if (currentPage === 'voice-export') {
    return <VoiceExportPage onBack={() => setCurrentPage('selection')} />;
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

  if (currentPage === 'conversation' && selectedVoice && selectedLanguage && createdAgent) {
    return (
      <ConversationPage
        voice={selectedVoice}
        language={selectedLanguage}
        agent={createdAgent}
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
            Mindtickle Voice Testing Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test different voices in multiple languages with high-quality AI speech synthesis
          </p>
        </div>

        {/* Voice Testing Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {errorMessage && (
            <div className={`mb-6 rounded-lg p-4 flex items-start ${
              errorMessage.includes('Agent Creation Error') 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <AlertCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                errorMessage.includes('Agent Creation Error') 
                  ? 'text-red-600' 
                  : 'text-yellow-600'
              }`} />
              <div className="flex-1">
                <div className={`text-sm ${
                  errorMessage.includes('Agent Creation Error') 
                    ? 'text-red-800' 
                    : 'text-yellow-800'
                }`}>
                  {errorMessage.includes('Agent Creation Error') && (
                    <p className="font-semibold mb-1">❌ Agent Creation Failed</p>
                  )}
                  <p>{errorMessage}</p>
                  {errorMessage.includes('Agent Creation Error') && (
                    <div className="mt-2 text-xs">
                      <p>💡 Make sure your ElevenLabs API key is valid and has sufficient credits.</p>
                      <p className="mt-1">🔄 You can try again by clicking the "Create Agent & Start Conversation" button.</p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className={`ml-3 hover:opacity-80 ${
                  errorMessage.includes('Agent Creation Error') 
                    ? 'text-red-600' 
                    : 'text-yellow-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Agent Creation Status & Details */}
          {showAgentDetails && createdAgent && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">✅ Agent Created Successfully!</h3>
                <p className="text-green-700">Your ElevenLabs conversational agent is ready. Starting conversation in a few seconds...</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-gray-900 mb-3">Agent Created</h4>
                <div className="text-center">
                  <span className="font-medium text-gray-700">Agent ID:</span>
                  <p className="text-lg font-mono bg-gray-50 px-4 py-2 rounded border mt-2 text-green-800">
                    {createdAgent.agent_id}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center mb-6">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Voice Testing</h2>
          </div>

          <div className="grid gap-8">
            <LanguageSelector
              languages={languages}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />

            {/* Voice Controls Row: Filter By, Sort By, and Search */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Voice
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Filter By */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Filter by
                  </label>
                  <select
                    value={voiceType}
                    onChange={(e) => setVoiceType(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    <option value="high_quality">High Quality</option>
                    <option value="professional">Professional</option>
                    <option value="famous">Famous</option>
                    <option value="all">All</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Sort By
                  </label>
                  <select
                    value={voiceSort}
                    onChange={(e) => setVoiceSort(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    <option value="usage_character_count_1y">Usage (1 Year)</option>
                    <option value="created_date">Created Date</option>
                    <option value="trending">Trending</option>
                    <option value="cloned_by_count">Cloned By Count</option>
                  </select>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Search voices
                  </label>
                  <input
                    type="text"
                    value={voiceSearchTerm}
                    onChange={(e) => setVoiceSearchTerm(e.target.value)}
                    placeholder="Filter by name, ID, gender, accent..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <VoiceSelector
                voices={voices}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                onTestVoice={handleTestVoice}
                loading={voicesLoading}
                currentPage={voicePage}
                hasNextPage={voiceHasMore}
                canPrevPage={voicePage > 1}
                onNextPage={handleNextVoicePage}
                onPrevPage={handlePrevVoicePage}
                searchTerm={voiceSearchTerm}
              />
            </div>
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
                      onClick={startConversation}
                      disabled={isCreatingAgent || showAgentDetails}
                      className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      title={isCreatingAgent ? "Creating agent..." : showAgentDetails ? "Agent created, starting conversation..." : "Create agent and start conversation"}
                    >
                      {isCreatingAgent ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating Agent...
                        </>
                      ) : showAgentDetails ? (
                        <>
                          <Bot className="h-5 w-5 mr-2" />
                          Starting Conversation...
                        </>
                      ) : (
                        <>
                          <Bot className="h-5 w-5 mr-2" />
                          Start Conversation
                        </>
                      )}
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
              <li>Choose your preferred language from the dropdown</li>
              <li>Select a voice to test</li>
              <li>Click "Listen to Sample" to hear the voice sample</li>
              <li>Click "Start Conversation" to create an ElevenLabs agent and start talking to the agent</li>
              <li>After 5 Minutes of conversation, end the call and submit feedback</li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Model Information Note */}
      <div className="py-3 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-500">
            🤖 Using <span className="font-medium text-gray-700">Eleven Turbo v2.5</span> for optimal speech synthesis quality and conversational agent performance
          </p>
        </div>
      </div>
      
      {/* Footer with subtle utility buttons */}
      <div className="py-4 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-6">
              <button
               className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
               title="Application Version"
             >
               {APP_VERSION}
             </button>
            <button
              onClick={() => setCurrentPage('debug')}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
              title="Debug ConvAI"
            >
              Debug
            </button>
            <button
              onClick={() => setCurrentPage('voice-export')}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
              title="Export All Voices to CSV"
            >
              Export All Voices to CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;