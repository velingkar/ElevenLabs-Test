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
  descriptive: string;
  use_case: string;
  preview_url: string;
  usage_1y: string;
  cloned_count: string;
  created_date: string;
  notice_period: string;
}

export class VoiceExportService {
  private static instance: VoiceExportService;

  static getInstance(): VoiceExportService {
    if (!VoiceExportService.instance) {
      VoiceExportService.instance = new VoiceExportService();
    }
    return VoiceExportService.instance;
  }

  // Helper function to format numbers with commas
  private formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US');
  }

  // Helper function to format Unix timestamp to readable date
  private formatDate(dateUnix: number | undefined): string {
    if (dateUnix === undefined || dateUnix === null) return 'N/A';
    const date = new Date(dateUnix * 1000); // Convert Unix timestamp to milliseconds
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Helper function to format notice period
  private formatNoticePeriod(days: number | undefined): string {
    if (days === undefined || days === null) return 'N/A';
    return `${days} ${days === 1 ? 'day' : 'days'}`;
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
              preview_url: voice.preview_url || '',
              usage_1y: `${this.formatNumber(voice.usage_character_count_1y)} chars`,
              cloned_count: `${this.formatNumber(voice.cloned_by_count)} times`,
              created_date: this.formatDate(voice.date_unix),
              notice_period: this.formatNoticePeriod(voice.notice_period)
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

  async getAllVoicesForLanguageWithPagination(
    languageCode: string,
    onProgress?: (currentPage: number, totalVoices: number, hasMore: boolean) => void
  ): Promise<VoiceExportData[]> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      throw new Error('Valid ElevenLabs API key required');
    }

    try {
      const allVoices: VoiceExportData[] = [];
      let page = 0;
      let hasMore = true;
      const pageSize = 100; // Use larger page size for export

      while (hasMore) {
        console.log(`Fetching page ${page + 1} for language: ${languageCode}`);
        
        const url = new URL(`${ELEVENLABS_BASE_URL}/shared-voices`);
        url.searchParams.append("language", languageCode);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("page_size", pageSize.toString());
        url.searchParams.append("sort", "usage_character_count_1y");

        const response = await fetch(url.toString(), {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch page ${page + 1} for ${languageCode}: ${response.status}`);
          break;
        }

        const data = await response.json();
        const voices = Array.isArray(data.voices) ? data.voices : [];
        hasMore = Boolean(data.has_more ?? (voices.length === pageSize));

        // Transform and add voices to collection
        for (const voice of voices) {
            const voiceData: VoiceExportData = {
              language: languageCode,
              voice_id: voice.voice_id,
              name: voice.name,
              gender: voice.labels?.gender || voice.gender || 'unknown',
              age: voice.labels?.age || voice.age || 'unknown',
              accent: voice.labels?.accent || voice.accent || 'neutral',
              category: voice.category || 'unknown',
              descriptive: voice.descriptive || 'N/A',
              use_case: voice.use_case || 'N/A',
              preview_url: voice.preview_url || '',
              usage_1y: `${this.formatNumber(voice.usage_character_count_1y)} chars`,
              cloned_count: `${this.formatNumber(voice.cloned_by_count)} times`,
              created_date: this.formatDate(voice.date_unix),
              notice_period: this.formatNoticePeriod(voice.notice_period)
            };
          allVoices.push(voiceData);
        }

        if (onProgress) {
          onProgress(page + 1, allVoices.length, hasMore);
        }

        page++;

        // Add a small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`Total ${allVoices.length} voices collected for ${languageCode}`);
      return allVoices;
    } catch (error) {
      console.error('Error fetching voices with pagination:', error);
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
              preview_url: voice.preview_url || '',
              usage_1y: `${this.formatNumber(voice.usage_character_count_1y)} chars`,
              cloned_count: `${this.formatNumber(voice.cloned_by_count)} times`,
              created_date: this.formatDate(voice.date_unix),
              notice_period: this.formatNoticePeriod(voice.notice_period)
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
          descriptive: voice.descriptive,
          use_case: voice.use_case,
          usage_1y: voice.usage_1y,
          cloned_count: voice.cloned_count,
          created_date: voice.created_date,
          notice_period: voice.notice_period,
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
    const headers = ['language', 'voice_id', 'name', 'gender', 'age', 'accent', 'category', 'descriptive', 'use_case', 'usage_1y', 'cloned_count', 'created_date', 'notice_period', 'preview_url'];
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
        `"${voice.descriptive}"`, // Wrap in quotes to handle commas
        `"${voice.use_case}"`, // Wrap in quotes to handle commas
        `"${voice.usage_1y}"`, // Wrap in quotes to handle commas
        `"${voice.cloned_count}"`, // Wrap in quotes to handle commas  
        voice.created_date,
        `"${voice.notice_period}"`, // Wrap in quotes to handle commas
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
