/**
 * Google Apps Script Web App for receiving ElevenLabs Voice Feedback
 * 
 * Instructions to set up:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Create a new Google Sheet or use existing one
 * 5. Update the SPREADSHEET_ID constant below with your sheet ID
 * 6. Deploy as web app with execute permissions for "Anyone"
 * 7. Copy the web app URL and add it to your .env file as VITE_GOOGLE_SHEETS_WEBAPP_URL
 */

// Replace this with your Google Sheet ID
const SPREADSHEET_ID = 'YOUR_ACTUAL_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Voice Feedback';

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Check if this is a voice export request
    if (data.type === 'voice_export') {
      return handleVoiceExport(data);
    } else {
      return handleFeedbackSubmission(data);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleVoiceExport(data) {
  try {
    // Get or create the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('Voice Export');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Voice Export');
      
      // Add headers for voice export
      const headers = [
        'Timestamp',
        'Language',
        'Voice ID',
        'Name',
        'Gender',
        'Age',
        'Accent',
        'Category'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#34a853');
      headerRange.setFontColor('white');
    }
    
    // Prepare data for each voice entry
    const voiceData = data.data || [];
    const rows = [];
    
    for (const voice of voiceData) {
      const rowData = [
        data.timestamp,
        voice.language,
        voice.voice_id,
        voice.name,
        voice.gender,
        voice.age,
        voice.accent,
        voice.category
      ];
      rows.push(rowData);
    }
    
    // Add all the data to the sheet
    if (rows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `Successfully exported ${rows.length} voice entries`,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in handleVoiceExport:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleFeedbackSubmission(data) {
  try {
    // Get or create the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      
      // Add headers
      const headers = [
        'Timestamp',
        'Reviewer Name',
        'Conversation ID',
        'Voice ID',
        'Voice Name',
        'Language Code',
        'Language Name',
        'Overall Rating',
        'Voice Quality Rating',
        'Voice Quality Comment',
        'Naturalness Rating',
        'Naturalness Comment',
        'Pronunciation Rating',
        'Pronunciation Comment',
        'Emotional Expression Rating',
        'Emotional Expression Comment',
        'Professional Sounding Rating',
        'Professional Sounding Comment',
        'Engagement Rating',
        'Engagement Comment',
        'Pace & Rhythm Rating',
        'Pace & Rhythm Comment',
        'Accent Clarity Rating',
        'Accent Clarity Comment',
        'Consistency Rating',
        'Consistency Comment',
        'General Feedback'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
    }
    
    // Prepare row data
    const rowData = [
      data.timestamp,
      data.reviewerName,
      data.conversationId,
      data.voiceId,
      data.voiceName,
      data.languageCode,
      data.languageName,
      data.overallRating,
      data.voiceQualityRating,
      data.voiceQualityComment,
      data.naturalnessRating,
      data.naturalnessComment,
      data.pronunciationRating,
      data.pronunciationComment,
      data.emotionalExpressionRating,
      data.emotionalExpressionComment,
      data.professionalSoundingRating,
      data.professionalSoundingComment,
      data.engagementRating,
      data.engagementComment,
      data.paceRhythmRating,
      data.paceRhythmComment,
      data.accentClarityRating,
      data.accentClarityComment,
      data.consistencyRating,
      data.consistencyComment,
      data.generalFeedback
    ];
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, rowData.length);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Feedback submitted successfully',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests (for testing)
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'ElevenLabs Voice Feedback API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}