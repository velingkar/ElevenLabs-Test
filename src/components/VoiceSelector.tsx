import { useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Voice } from '../types';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: Voice | null;
  onVoiceChange: (voice: Voice) => void;
  onTestVoice: (voice: Voice) => void;
  disabled?: boolean;
  loading?: boolean;
  currentPage: number;
  hasNextPage: boolean;
  canPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function VoiceSelector({ 
  voices, 
  selectedVoice, 
  onVoiceChange, 
  onTestVoice, 
  disabled, 
  loading,
  currentPage,
  hasNextPage,
  canPrevPage,
  onNextPage,
  onPrevPage
}: VoiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return voices;
    return voices.filter((voice) => {
      const fields = [
        voice.name,
        voice.voice_id,
        voice.labels?.gender || voice.gender,
        voice.labels?.age || voice.age,
        voice.labels?.accent || voice.accent,
        voice.category,
      ];
      return fields.some((field) =>
        field?.toLowerCase().includes(term)
      );
    });
  }, [voices, searchTerm]);

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
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Search voices
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, ID, gender, accent, age, category..."
              disabled={disabled}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {filteredVoices.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
              No voices match your search on page {currentPage}.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoice?.voice_id === voice.voice_id;
                return (
                  <label
                    key={voice.voice_id}
                    className={`flex items-start justify-between gap-3 border rounded-lg p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="voice-selection"
                        value={voice.voice_id}
                        checked={isSelected}
                        onChange={() => onVoiceChange(voice)}
                        disabled={disabled}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {voice.name}
                        </p>
                        <div className="text-xs text-gray-500 space-x-2 mt-1">
                          <span>ID: <span className="font-mono">{voice.voice_id}</span></span>
                          <span>Gender: {voice.labels?.gender || voice.gender || 'N/A'}</span>
                          <span>Age: {voice.labels?.age || voice.age || 'N/A'}</span>
                          <span>Accent: {voice.labels?.accent || voice.accent || 'neutral'}</span>
                          <span>Category: {voice.category || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTestVoice(voice)}
                      disabled={disabled || !voice.preview_url}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-blue-100 text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-transparent transition-colors"
                    >
                      <Volume2 className="h-4 w-4" />
                      Sample
                    </button>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={disabled || !canPrevPage}
              className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-transparent transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage}
            </span>
            <button
              type="button"
              onClick={onNextPage}
              disabled={disabled || !hasNextPage}
              className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-transparent transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}