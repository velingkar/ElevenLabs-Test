import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Upload, Database, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { VoiceExportService, VoiceExportData } from '../services/voiceExportService';
import { getLanguagesForModel, getDefaultModel, LANGUAGE_MAP } from '../data/elevenLabsData';
import type { Language } from '../types';

interface VoiceExportPageProps {
  onBack?: () => void;
}

export function VoiceExportPage({ onBack }: VoiceExportPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [voiceData, setVoiceData] = useState<VoiceExportData[]>([]);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [progress, setProgress] = useState<{
    currentPage: number;
    totalVoices: number;
    hasMore: boolean;
  } | null>(null);

  const voiceExportService = VoiceExportService.getInstance();

  // Initialize available languages on component mount
  useEffect(() => {
    const defaultModel = getDefaultModel();
    const languages = getLanguagesForModel(defaultModel.model_id);
    setAvailableLanguages(languages);
    
    // Set default to English if available
    const defaultLanguage = languages.find(lang => lang.code === 'en') || languages[0];
    if (defaultLanguage) {
      setSelectedLanguage(defaultLanguage);
    }
  }, []);

  const fetchVoicesForLanguage = async () => {
    if (!selectedLanguage) {
      setStatusMessage('Please select a language first.');
      setExportStatus('error');
      return;
    }
    setIsLoading(true);
    setExportStatus('idle');
    setStatusMessage('');
    setProgress(null);

    try {
      const languageName = LANGUAGE_MAP[selectedLanguage.code]?.name || selectedLanguage.name;
      setStatusMessage(`Fetching voices for ${languageName}...`);
      
      // Create a progress callback
      const onProgress = (currentPage: number, totalVoices: number, hasMore: boolean) => {
        setProgress({
          currentPage,
          totalVoices,
          hasMore
        });
        
        setStatusMessage(`Fetched ${totalVoices} voices from ${currentPage} pages for ${languageName}...${hasMore ? ' (more available)' : ' (completed)'}`);
      };
      
      const voices = await voiceExportService.getAllVoicesForLanguageWithPagination(selectedLanguage.code, onProgress);
      
      setVoiceData(voices);
      setProgress(null);

      setStatusMessage(`Successfully fetched ${voices.length} voices for ${languageName}`);
      setExportStatus('success');
    } catch (error) {
      console.error('Error fetching voices:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Failed to fetch voices'}`);
      setExportStatus('error');
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToGoogleSheets = async () => {
    if (voiceData.length === 0) {
      setStatusMessage('No voice data to export. Please fetch voices first.');
      setExportStatus('error');
      return;
    }

    setIsLoading(true);
    setExportStatus('idle');
    setStatusMessage('Exporting to Google Sheets...');

    try {
      const success = await voiceExportService.exportToGoogleSheets(voiceData);
      
      if (success) {
        setStatusMessage(`Successfully exported ${voiceData.length} voice entries to Google Sheets`);
        setExportStatus('success');
      } else {
        setStatusMessage('Failed to export to Google Sheets. Check your configuration.');
        setExportStatus('error');
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Failed to export'}`);
      setExportStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (voiceData.length === 0) {
      setStatusMessage('No voice data to download. Please fetch voices first.');
      setExportStatus('error');
      return;
    }

    if (!selectedLanguage) {
      setStatusMessage('No language selected.');
      setExportStatus('error');
      return;
    }

    try {
      setStatusMessage('Generating CSV file...');
      const csvContent = await voiceExportService.exportVoicesToCSV(voiceData);
      const filename = `elevenlabs_voices_${selectedLanguage.code}_${new Date().toISOString().split('T')[0]}.csv`;
      voiceExportService.downloadCSV(csvContent, filename);
      setStatusMessage(`Successfully downloaded CSV with ${voiceData.length} voice entries for ${LANGUAGE_MAP[selectedLanguage.code]?.name || selectedLanguage.name}`);
      setExportStatus('success');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Failed to download CSV'}`);
      setExportStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voice Export Utility</h1>
              <p className="text-gray-600">Export ElevenLabs voices for a specific language to CSV</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Language Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Language
            </label>
            <div className="relative">
              <select
                value={selectedLanguage?.code || ''}
                onChange={(e) => {
                  const language = availableLanguages.find(lang => lang.code === e.target.value);
                  setSelectedLanguage(language || null);
                  // Clear previous data when language changes
                  setVoiceData([]);
                  setExportStatus('idle');
                  setStatusMessage('');
                }}
                className="w-full max-w-xs appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Choose a language...</option>
                {availableLanguages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {LANGUAGE_MAP[language.code]?.flag} {LANGUAGE_MAP[language.code]?.name || language.name} ({language.code})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={fetchVoicesForLanguage}
              disabled={isLoading || !selectedLanguage}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Database className="h-5 w-5" />
              )}
              <span>
                {selectedLanguage 
                  ? `Fetch ${LANGUAGE_MAP[selectedLanguage.code]?.name || selectedLanguage.name} Voices`
                  : 'Select Language First'
                }
              </span>
            </button>

         

            <button
              onClick={downloadCSV}
              disabled={isLoading || voiceData.length === 0}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              <span>Download CSV</span>
            </button>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="flex items-center space-x-2 mb-6 p-4 rounded-lg bg-gray-50 border">
              {getStatusIcon()}
              <span className="text-sm">{statusMessage}</span>
            </div>
          )}

          {/* Progress Indicator */}
          {progress && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  Fetching Voices with Pagination
                </span>
                <span className="text-sm text-blue-600">
                  {progress.totalVoices} voices found
                </span>
              </div>
              <div className="text-sm text-blue-700 mb-2">
                Page <span className="font-medium">{progress.currentPage}</span> processed
                {progress.hasMore && <span className="text-blue-600"> (more pages available)</span>}
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Stats */}
          {voiceData.length > 0 && selectedLanguage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{voiceData.length}</div>
                <div className="text-sm text-blue-800">Total Voices Found</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {LANGUAGE_MAP[selectedLanguage.code]?.flag} {LANGUAGE_MAP[selectedLanguage.code]?.name || selectedLanguage.name}
                </div>
                <div className="text-sm text-green-800">Selected Language</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {[...new Set(voiceData.map(v => v.category))].length}
                </div>
                <div className="text-sm text-purple-800">Voice Categories</div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {voiceData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Data Preview (First 10 entries)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voice ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accent</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descriptive</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Use Case</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage (1Y)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cloned</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notice Period</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {voiceData.slice(0, 10).map((voice, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.language}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 font-mono">{voice.voice_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.gender}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.age}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.accent}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.category}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate" title={voice.descriptive}>{voice.descriptive}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate" title={voice.use_case}>{voice.use_case}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.usage_1y}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.cloned_count}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.created_date}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{voice.notice_period}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {voice.preview_url ? (
                            <a 
                              href={voice.preview_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Listen
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {voiceData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 10 of {voiceData.length} entries
                </p>
              )}
            </div>
          )}

          {/* Voice Categories */}
          {voiceData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Voice Categories Found</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[...new Set(voiceData.map(v => v.category))].map((category, index) => (
                  <div key={index} className="bg-gray-100 px-3 py-2 rounded text-sm capitalize">
                    {category}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
