import { useMemo } from 'react';
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
  searchTerm: string;
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
  onPrevPage,
  searchTerm
}: VoiceSelectorProps) {

  // Helper function to format numbers with commas
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US');
  };

  // Helper function to format Unix timestamp to readable date
  const formatDate = (dateUnix: number | undefined): string => {
    if (dateUnix === undefined || dateUnix === null) return 'N/A';
    const date = new Date(dateUnix * 1000); // Convert Unix timestamp to milliseconds
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to format notice period
  const formatNoticePeriod = (days: number | undefined): string => {
    if (days === undefined || days === null) return 'N/A';
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

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
      {loading ? (
        <div className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-500">
          Loading voices...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVoices.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
              No voices match your search on page {currentPage}.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredVoices.map((voice, index) => {
                const isSelected = selectedVoice?.voice_id === voice.voice_id;
                const voiceNumber = (currentPage * 30) + index + 1; // Calculate global voice number across pages
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                            {voiceNumber}
                          </span>
                          <p className="font-semibold text-gray-900 text-sm">
                            {voice.name}
                          </p>
                          {voice.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 space-x-2 mt-1">
                          <span>ID: <span className="font-mono">{voice.voice_id}</span></span>
                          <span>Gender: {voice.labels?.gender || voice.gender || 'N/A'}</span>
                          <span>Age: {voice.labels?.age || voice.age || 'N/A'}</span>
                          <span>Accent: {voice.labels?.accent || voice.accent || 'neutral'}</span>
                          <span>Category: {voice.category || 'N/A'}</span>
                        </div>
                        {/* Usage Statistics */}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div>
                              <span className="text-gray-400">Usage (1Y):</span>{' '}
                              <span className="text-gray-700 font-medium">
                                {formatNumber(voice.usage_character_count_1y)} chars
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Cloned:</span>{' '}
                              <span className="text-gray-700 font-medium">
                                {formatNumber(voice.cloned_by_count)} times
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Created:</span>{' '}
                              <span className="text-gray-700 font-medium">
                                {formatDate(voice.date_unix)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Notice Period:</span>{' '}
                              <span className="text-gray-700 font-medium">
                                {formatNoticePeriod(voice.notice_period)}
                              </span>
                            </div>
                          </div>
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
              Page {currentPage + 1}
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