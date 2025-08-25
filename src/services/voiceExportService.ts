import { getLanguagesForModel, getDefaultModel } from '../data/elevenLabsData';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const GOOGLE_SHEETS_WEBAPP_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL;

export interface VoiceExportData {
  language: string;
  voice_id: string;
  name: string;
  gender: string;
  age: string;
  accent: string;
  category: string;
  preview_url: string;
}

export class VoiceExportService {
  private static instance: VoiceExportService;

  static getInstance(): VoiceExportService {
    if (!VoiceExportService.instance) {
      VoiceExportService.instance = new VoiceExportService();
    }
    return VoiceExportService.instance;
  }

  async getAllVoices(): Promise<VoiceExportData[]> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      throw new Error('Valid ElevenLabs API key required');
    }

    try {
      // Step 1: Get all supported languages from the data file
      const defaultModel = getDefaultModel();
      const languages = getLanguagesForModel(defaultModel.model_id);
      
      console.log(`Found ${languages.length} supported languages`);

      // Step 2: Get voices for each language using the working endpoint
      const exportData: VoiceExportData[] = [];
      
      for (const language of languages) {
        try {
          console.log(`Fetching voices for language: ${language.code}`);
          
          const voicesResponse = await fetch(`${ELEVENLABS_BASE_URL}/shared-voices?language=${language.code}`, {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY
            }
          });

          if (!voicesResponse.ok) {
            console.warn(`Failed to fetch voices for ${language.code}: ${voicesResponse.status}`);
            continue;
          }

          const voicesData = await voicesResponse.json();
          const voices = voicesData.voices || [];
          
          console.log(`Found ${voices.length} voices for ${language.code}`);

          // Transform voices for this language
          for (const voice of voices) {
            const voiceData: VoiceExportData = {
              language: language.code,
              voice_id: voice.voice_id,
              name: voice.name,
              gender: voice.labels?.gender || voice.gender || 'unknown',
              age: voice.labels?.age || voice.age || 'unknown',
              accent: voice.labels?.accent || voice.accent || 'neutral',
              category: voice.category || 'unknown',
              preview_url: voice.preview_url || ''
            };
            exportData.push(voiceData);
          }
        } catch (error) {
          console.warn(`Error fetching voices for ${language.code}:`, error);
          // Continue with next language
        }
      }

      console.log(`Total voice entries collected: ${exportData.length}`);
      return exportData;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  async getAllVoicesWithProgress(
    onProgress?: (currentLanguage: string, currentStep: number, totalSteps: number, processedLanguages: number) => void
  ): Promise<VoiceExportData[]> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      throw new Error('Valid ElevenLabs API key required');
    }

    try {
      // Step 1: Get all supported languages from the data file
      if (onProgress) onProgress('', 1, 0, 0);
      
      const defaultModel = getDefaultModel();
      const languages = getLanguagesForModel(defaultModel.model_id);
      
      console.log(`Found ${languages.length} supported languages`);
      if (onProgress) onProgress('', 1, languages.length, 0);

      // Step 2: Get voices for each language using the working endpoint
      const exportData: VoiceExportData[] = [];
      
      for (let i = 0; i < languages.length; i++) {
        const language = languages[i];
        
        if (onProgress) onProgress(language.code, 2, languages.length, i);
        
        try {
          console.log(`Fetching voices for language: ${language.code}`);
          
          const voicesResponse = await fetch(`${ELEVENLABS_BASE_URL}/shared-voices?language=${language.code}`, {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY
            }
          });

          if (!voicesResponse.ok) {
            console.warn(`Failed to fetch voices for ${language.code}: ${voicesResponse.status}`);
            continue;
          }

          const voicesData = await voicesResponse.json();
          const voices = voicesData.voices || [];
          
          console.log(`Found ${voices.length} voices for ${language.code}`);

          // Transform voices for this language
          for (const voice of voices) {
            const voiceData: VoiceExportData = {
              language: language.code,
              voice_id: voice.voice_id,
              name: voice.name,
              gender: voice.labels?.gender || voice.gender || 'unknown',
              age: voice.labels?.age || voice.age || 'unknown',
              accent: voice.labels?.accent || voice.accent || 'neutral',
              category: voice.category || 'unknown',
              preview_url: voice.preview_url || ''
            };
            exportData.push(voiceData);
          }
        } catch (error) {
          console.warn(`Error fetching voices for ${language.code}:`, error);
          // Continue with next language
        }
      }

      console.log(`Total voice entries collected: ${exportData.length}`);
      return exportData;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  async exportToGoogleSheets(voiceData: VoiceExportData[]): Promise<boolean> {
    if (!GOOGLE_SHEETS_WEBAPP_URL) {
      console.warn('Google Sheets Web App URL not configured');
      return false;
    }

    try {
      // Format data for Google Sheets
      const sheetData = {
        timestamp: new Date().toISOString(),
        data: voiceData.map(voice => ({
          language: voice.language,
          voice_id: voice.voice_id,
          name: voice.name,
          gender: voice.gender,
          age: voice.age,
          accent: voice.accent,
          category: voice.category,
          preview_url: voice.preview_url
        }))
      };

      const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'no-cors', // Required for Google Apps Script
        body: JSON.stringify({
          type: 'voice_export',
          ...sheetData
        })
      });

      // With no-cors mode, we can't read the response, so we assume success
      return true;
    } catch (error) {
      console.error('Failed to export to Google Sheets:', error);
      return false;
    }
  }

  async exportVoicesToCSV(voiceData: VoiceExportData[]): Promise<string> {
    // Create CSV content
    const headers = ['language', 'voice_id', 'name', 'gender', 'age', 'accent', 'category', 'preview_url'];
    const csvRows = [headers.join(',')];

    for (const voice of voiceData) {
      const row = [
        voice.language,
        voice.voice_id,
        `"${voice.name}"`, // Wrap name in quotes to handle commas
        voice.gender,
        voice.age,
        voice.accent,
        voice.category,
        `"${voice.preview_url}"` // Wrap preview_url in quotes to handle commas
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  downloadCSV(csvContent: string, filename: string = 'elevenlabs_voices.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
