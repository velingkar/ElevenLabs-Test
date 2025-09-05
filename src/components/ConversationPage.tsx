import { useEffect, useRef } from 'react';
import { ArrowLeft, Bot, PhoneOff } from 'lucide-react';
import { Voice, Language } from '../types';
import { ElevenLabsAgent } from '../services/elevenLabsService';

interface ConversationPageProps {
  voice: Voice;
  language: Language;
  agent: ElevenLabsAgent;
  onBack: () => void;
  onEndCall: () => void;
}

export function ConversationPage({ voice, language, agent, onBack, onEndCall }: ConversationPageProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the ElevenLabs Convai widget script
    const scriptId = 'elevenlabs-convai-script';
    
    // Check if script is already loaded
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('ElevenLabs Convai widget script loaded');
        createWidget();
      };
      
      script.onerror = () => {
        console.error('Failed to load ElevenLabs Convai widget script');
      };

      document.head.appendChild(script);
    } else {
      // Script already exists, create widget immediately
      createWidget();
    }

    function createWidget() {
      if (widgetRef.current && agent.agent_id) {
        // Clear any existing content
        widgetRef.current.innerHTML = '';
        
        // Create the widget element exactly as in the embed code
        const widget = document.createElement('elevenlabs-convai');
        widget.setAttribute('agent-id', agent.agent_id);
        
        widgetRef.current.appendChild(widget);
        
        console.log('ElevenLabs widget created with agent ID:', agent.agent_id);
      }
    }
  }, [agent.agent_id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Voice Selection
          </button>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <h2 className="font-semibold text-gray-900">ElevenLabs Conversational Agent</h2>
              <p className="text-sm text-gray-600">{language.flag} {language.name} | {voice.name}</p>
              <p className="text-xs text-blue-600 font-medium">Agent ID: {agent.agent_id}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
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

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-6">
        <div className="bg-white rounded-lg shadow-lg h-full min-h-[600px] p-6">
          {/* Agent Info */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🤖 ElevenLabs Conversational AI
            </h3>
            <p className="text-gray-600">
              Start speaking or typing to begin your conversation with the AI agent
            </p>
          </div>

          {/* ElevenLabs Convai Widget Container */}
          <div className="w-full flex-1 min-h-[500px] relative">
            <div 
              ref={widgetRef}
              className="w-full h-full min-h-[500px] rounded-lg overflow-hidden"
            >
              {/* Loading placeholder - will be replaced by the widget */}
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading ElevenLabs Conversational Widget...</p>
                  <p className="text-sm mt-2">Agent ID: {agent.agent_id}</p>
                  <p className="text-xs mt-1 text-gray-400">This may take a few seconds to initialize</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 ElevenLabs Conversational AI:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This is the official ElevenLabs conversational widget</li>
              <li>• Click the microphone to start voice conversation</li>
              <li>• The agent will respond using the <strong>{voice.name}</strong> voice</li>
              <li>• Click "End Call" when finished to provide feedback</li>
            </ul>
            <div className="mt-3 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              <strong>Agent ID:</strong> {agent.agent_id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}