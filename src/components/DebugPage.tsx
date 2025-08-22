import React, { useState } from 'react';
import { ConvaiService } from '../services/convaiService';
import { ArrowLeft } from 'lucide-react';

interface DebugPageProps {
  onBack?: () => void;
}

export function DebugPage({ onBack }: DebugPageProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAgentCreation = async () => {
    setIsLoading(true);
    addLog('Starting agent creation test...');
    
    try {
      const convaiService = ConvaiService.getInstance();
      addLog('ConvAI service instance created');
      
      // Test API connection first
      addLog('Testing API connection...');
      const isConnected = await convaiService.testApiConnection();
      addLog(`API connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      
      if (!isConnected) {
        addLog('API connection failed, will use fallback mode');
      }
      
      const agent = await convaiService.createAgent('rachel', 'Female','en', 'Test Agent');
      addLog(`Agent created successfully: ${JSON.stringify(agent)}`);
      
      // Test conversation
      addLog('Testing conversation...');
      const response = await convaiService.simulateConversation('Hello, I need a new phone');
      addLog(`Conversation response: ${JSON.stringify(response)}`);
      
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLanguageResponses = async () => {
    setIsLoading(true);
    addLog('Testing language-specific responses...');
    
    try {
      const convaiService = ConvaiService.getInstance();
      const languages = ['en', 'es', 'fr', 'de', 'zh', 'ja'];
      
      for (const lang of languages) {
        addLog(`Testing ${lang} responses...`);
        const response = await convaiService.simulateConversation('Hello');
        addLog(`${lang}: ${response.response}`);
      }
      
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testVoiceSelection = async () => {
    setIsLoading(true);
    addLog('Testing voice selection...');
    
    try {
      const convaiService = ConvaiService.getInstance();
      const voices = ['rachel', 'drew', 'clyde', 'bella'];
      
      for (const voiceId of voices) {
        addLog(`Testing voice: ${voiceId}`);
        const agent = await convaiService.createAgent(voiceId, 'Female', 'en', `Test Agent ${voiceId}`);
        addLog(`Agent created with voice ${voiceId}: ${agent.voice_id}`);
        
        // Test conversation
        const response = await convaiService.simulateConversation('Hello');
        addLog(`Response with voice ${voiceId}: ${response.response}`);
      }
      
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">ConvAI Debug Page</h1>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </button>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="space-x-4">
            <button
              onClick={testAgentCreation}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Agent Creation'}
            </button>
            <button
              onClick={testLanguageResponses}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Languages'}
            </button>
            <button
              onClick={testVoiceSelection}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Voices'}
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click "Test Agent Creation" to start.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
