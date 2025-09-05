interface FeedbackData {
  reviewerName: string;
  conversationId: string;
  voiceId: string;
  voiceName: string;
  languageCode: string;
  languageName: string;
  overallRating: number;
  attributeRatings: Record<string, { rating: number; comment: string }>;
  generalFeedback: string;
  timestamp: string;
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private readonly webAppUrl: string;

  constructor() {
    // This should be your Google Apps Script Web App URL
    // You'll need to replace this with your actual deployed web app URL
    this.webAppUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL || '';
  }

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  async submitFeedback(feedbackData: FeedbackData): Promise<boolean> {
    if (!this.webAppUrl) {
      console.warn('Google Sheets Web App URL not configured. Please set VITE_GOOGLE_SHEETS_WEBAPP_URL in your .env file');
  
      // For development, log the data and return success
      return true;
    }

    try {
      // Prepare the data for Google Sheets
      const sheetData = this.formatDataForSheets(feedbackData);
      
      

      await fetch(this.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetData),
        mode: 'no-cors' // Changed to no-cors to avoid CORS issues with Google Apps Script
      });

      // With no-cors mode, we can't read the response, so we assume success
  
      return true;
    } catch (error: any) {
      console.warn('Failed to submit feedback to Google Sheets:', error);
  
      // Don't throw error, just log and return false for graceful degradation
      return false;
    }
  }

  private formatDataForSheets(feedbackData: FeedbackData) {
    // Format the data as a flat structure for Google Sheets
    const formattedData = {
      timestamp: feedbackData.timestamp,
      reviewerName: feedbackData.reviewerName,
      conversationId: feedbackData.conversationId,
      voiceId: feedbackData.voiceId,
      voiceName: feedbackData.voiceName,
      languageCode: feedbackData.languageCode,
      languageName: feedbackData.languageName,
      overallRating: feedbackData.overallRating,
      
      // Individual attribute ratings
      voiceQualityRating: feedbackData.attributeRatings.voice_quality?.rating || 0,
      voiceQualityComment: feedbackData.attributeRatings.voice_quality?.comment || '',
      
      naturalnessRating: feedbackData.attributeRatings.naturalness?.rating || 0,
      naturalnessComment: feedbackData.attributeRatings.naturalness?.comment || '',
      
      pronunciationRating: feedbackData.attributeRatings.pronunciation?.rating || 0,
      pronunciationComment: feedbackData.attributeRatings.pronunciation?.comment || '',
      
      emotionalExpressionRating: feedbackData.attributeRatings.emotional_expression?.rating || 0,
      emotionalExpressionComment: feedbackData.attributeRatings.emotional_expression?.comment || '',
      
      professionalSoundingRating: feedbackData.attributeRatings.professional_sounding?.rating || 0,
      professionalSoundingComment: feedbackData.attributeRatings.professional_sounding?.comment || '',
      
      engagementRating: feedbackData.attributeRatings.engagement?.rating || 0,
      engagementComment: feedbackData.attributeRatings.engagement?.comment || '',
      
      paceRhythmRating: feedbackData.attributeRatings.pace_rhythm?.rating || 0,
      paceRhythmComment: feedbackData.attributeRatings.pace_rhythm?.comment || '',
      
      accentClarityRating: feedbackData.attributeRatings.accent_clarity?.rating || 0,
      accentClarityComment: feedbackData.attributeRatings.accent_clarity?.comment || '',
      
      consistencyRating: feedbackData.attributeRatings.consistency?.rating || 0,
      consistencyComment: feedbackData.attributeRatings.consistency?.comment || '',
      
      generalFeedback: feedbackData.generalFeedback
    };

    return formattedData;
  }
}