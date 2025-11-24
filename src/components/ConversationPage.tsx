import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, MessageSquare } from 'lucide-react';
import { Voice, Language } from '../types';
import { ElevenLabsAgent } from '../services/elevenLabsService';

interface ConversationPageProps {
  voice: Voice;
  language: Language;
  agent: ElevenLabsAgent;
  onBack: () => void;
  onEndCall: () => void;
}

export function ConversationPage({ voice, language, agent, onBack, onEndCall: onProvideFeedback }: ConversationPageProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [hasCopiedConversationId, setHasCopiedConversationId] = useState(false);

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
        
        // Apply minimal styles to let the widget render naturally
        widget.style.cssText = `
          width: 100%;
          height: 100%;
          min-height: 600px;
          border-radius: 8px;
          display: block;
        `;
        
        widgetRef.current.appendChild(widget);
        
        // Add a style tag to prevent widget from floating over other elements
        const styleId = 'elevenlabs-widget-containment';
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            /* Ensure widget container has proper stacking and containment */
            .widget-container {
              position: relative !important;
              overflow: visible !important;
              z-index: 1 !important;
            }
            
            /* Allow widget to render properly but prevent escape */
            .widget-container elevenlabs-convai {
              position: relative !important;
              display: block !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            
            /* Prevent any child elements from floating over page content */
            .widget-container elevenlabs-convai * {
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
          `;
          document.head.appendChild(style);
        }
        
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
          
          <div className="flex flex-col items-center">
            <button
              onClick={onProvideFeedback}
              disabled={!hasCopiedConversationId}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
              title={hasCopiedConversationId ? "Provide feedback on this conversation" : "Please confirm you have copied the conversation ID"}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Provide Feedback
            </button>
            <label className="flex items-center mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCopiedConversationId}
                onChange={(e) => setHasCopiedConversationId(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-orange-500 font-medium">I confirm I have copied <strong>Conversation ID</strong> from Chat</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-6">
        <div className="bg-white rounded-lg shadow-lg h-full min-h-[600px] p-6">
          {/* Agent Info */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🤖 Phone Purchase Helper Agent
            </h3>
            <p className="text-gray-600">
              Get guidance about buying a new phone or upgrading your current phone.
            </p>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 IMPORTANT INSTRUCTIONS:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click the microphone to start voice conversation, AI Agent will start listening</li>
              <li>• To start conversation, say "Hi" in your selected language.</li>
              <li>• The agent will respond using the <strong>{voice.name}</strong> voice in your selected language</li>
              <li>• Speak to agent for 5 - 10 minutes, test for voice quality and correctness of transcript</li>
              <li>• When you are satisfied, click the phone button to end call</li>
              <li>• <strong>Copy the convesation ID from the widget</strong>, you will need this in the next form.</li>
              <li>• Click "Provide Feedback" to go to feedback form</li>
            </ul>
          </div>

          {/* ElevenLabs Convai Widget Container */}
          <div className="w-full flex-1 min-h-[600px] relative">
            <div 
              ref={widgetRef}
              className="widget-container w-full h-full min-h-[600px] rounded-lg border-2 border-gray-200 bg-white"
              style={{
                position: 'relative',
                isolation: 'isolate'
              }}
            >
              {/* Loading placeholder - will be replaced by the widget */}
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading ElevenLabs Conversational Widget...</p>
                  <p className="text-sm mt-2">Agent ID: {agent.agent_id}</p>
                  <p className="text-xs mt-1 text-gray-400">This may take a few seconds to initialize</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}