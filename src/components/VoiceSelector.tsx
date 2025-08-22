import React from 'react';
import { ChevronDown, Volume2 } from 'lucide-react';
import { Voice } from '../types';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: Voice | null;
  onVoiceChange: (voice: Voice) => void;
  onTestVoice: (voice: Voice) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function VoiceSelector({ 
  voices, 
  selectedVoice, 
  onVoiceChange, 
  onTestVoice, 
  disabled, 
  loading 
}: VoiceSelectorProps) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Voice
      </label>
      {loading ? (
        <div className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-500">
          Loading voices...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <select
              value={selectedVoice?.voice_id || ''}
              onChange={(e) => {
                const voice = voices.find(v => v.voice_id === e.target.value);
                if (voice) onVoiceChange(voice);
              }}
              disabled={disabled}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <option value="">Choose a voice...</option>
              {voices.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} • {voice.labels?.gender || voice.gender || 'N/A'} • {voice.labels?.age || voice.age || 'N/A'} • {voice.labels?.accent || voice.accent || 'neutral'} • {voice.category || 'N/A'} 
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}