import React, { useState } from 'react';
import { ArrowLeft, Download, Upload, Database, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { VoiceExportService, VoiceExportData } from '../services/voiceExportService';

interface VoiceExportPageProps {
  onBack?: () => void;
}

export function VoiceExportPage({ onBack }: VoiceExportPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [voiceData, setVoiceData] = useState<VoiceExportData[]>([]);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState<{
    totalVoices: number;
    totalLanguages: number;
    uniqueLanguages: string[];
  } | null>(null);
  const [progress, setProgress] = useState<{
    currentLanguage: string;
    currentStep: number;
    totalSteps: number;
    processedLanguages: number;
  } | null>(null);

  const voiceExportService = VoiceExportService.getInstance();

  const fetchAllVoices = async () => {
    setIsLoading(true);
    setExportStatus('idle');
    setStatusMessage('');
    setProgress(null);

    try {
      setStatusMessage('Step 1: Getting supported languages...');
      
      // Create a progress callback
      const onProgress = (currentLanguage: string, currentStep: number, totalSteps: number, processedLanguages: number) => {
        setProgress({
          currentLanguage,
          currentStep,
          totalSteps,
          processedLanguages
        });
        
        if (currentStep === 1) {
          setStatusMessage(`Step 1: Found ${totalSteps} supported languages`);
        } else {
          setStatusMessage(`Step 2: Fetching voices for ${currentLanguage} (${processedLanguages + 1}/${totalSteps} languages processed)`);
        }
      };
      
      const voices = await voiceExportService.getAllVoicesWithProgress(onProgress);
      
      setVoiceData(voices);
      setProgress(null);
      
      // Calculate stats
      const uniqueLanguages = [...new Set(voices.map(v => v.language))].sort();
      setStats({
        totalVoices: voices.length,
        totalLanguages: uniqueLanguages.length,
        uniqueLanguages
      });

      setStatusMessage(`Successfully fetched ${voices.length} voice entries across ${uniqueLanguages.length} languages`);
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

    try {
      setStatusMessage('Generating CSV file...');
      const csvContent = await voiceExportService.exportVoicesToCSV(voiceData);
      voiceExportService.downloadCSV(csvContent);
      setStatusMessage(`Successfully downloaded CSV with ${voiceData.length} voice entries`);
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
              <p className="text-gray-600">Export all ElevenLabs voices and languages to Google Sheets or CSV</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={fetchAllVoices}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Database className="h-5 w-5" />
              )}
              <span>Fetch All Voices</span>
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
                  {progress.currentStep === 1 ? 'Step 1: Getting Languages' : 'Step 2: Fetching Voices'}
                </span>
                <span className="text-sm text-blue-600">
                  {progress.currentStep === 1 
                    ? `${progress.totalSteps} languages found`
                    : `${progress.processedLanguages + 1}/${progress.totalSteps} languages processed`
                  }
                </span>
              </div>
              {progress.currentStep === 2 && progress.currentLanguage && (
                <div className="text-sm text-blue-700 mb-2">
                  Currently processing: <span className="font-medium">{progress.currentLanguage}</span>
                </div>
              )}
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: progress.currentStep === 1 
                      ? '100%' 
                      : `${(progress.processedLanguages / progress.totalSteps) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalVoices}</div>
                <div className="text-sm text-blue-800">Total Voice Entries</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalLanguages}</div>
                <div className="text-sm text-green-800">Unique Languages</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{voiceData.length}</div>
                <div className="text-sm text-purple-800">Total Records</div>
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

          {/* Language List */}
          {stats?.uniqueLanguages && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Supported Languages</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {stats.uniqueLanguages.map((lang, index) => (
                  <div key={index} className="bg-gray-100 px-3 py-2 rounded text-sm">
                    {lang}
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
