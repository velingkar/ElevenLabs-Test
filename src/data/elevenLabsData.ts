export interface ElevenLabsModel {
  model_id: string;
  name: string;
  language_codes: string[];
  description: string;
}

export const ELEVENLABS_MODELS: ElevenLabsModel[] = [
  {
    model_id: "eleven_turbo_v2_5",
    name: "Eleven Turbo v2.5",
    language_codes: [
      "en", "ja", "zh", "de", "hi", "fr", "ko", "pt", "it", "es", "id", "nl", "tr", "fil", "pl", "sv", "bg", "ro", "ar", "cs", "el", "fi", "hr", "ms", "sk", "da", "ta", "uk", "ru", "hu", "no", "vi"
    ],
    description: "Fast and high-quality speech synthesis, optimized for conversational agents"
  },
  {
    model_id: "eleven_turbo_v2",
    name: "Eleven Turbo v2",
    language_codes: [
      "en", "ja", "zh", "de", "hi", "fr", "ko", "pt", "it", "es", "id", "nl", "tr", "fil", "pl", "sv", "bg", "ro", "ar", "cs", "el", "fi", "hr", "ms", "sk", "da", "ta", "uk", "ru", "hu", "no", "vi"
    ],
    description: "Fast speech synthesis with good quality"
  },
  {
    model_id: "eleven_flash_v2_5",
    name: "Eleven Flash v2.5",
    language_codes: [
      "en", "ja", "zh", "de", "hi", "fr", "ko", "pt", "it", "es", "id", "nl", "tr", "fil", "pl", "sv", "bg", "ro", "ar", "cs", "el", "fi", "hr", "ms", "sk", "da", "ta", "uk", "ru", "hu", "no", "vi"
    ],
    description: "Ultra-fast speech synthesis with optimized latency"
  },
  {
    model_id: "eleven_flash_v2",
    name: "Eleven Flash v2",
    language_codes: [
      "en", "ja", "zh", "de", "hi", "fr", "ko", "pt", "it", "es", "id", "nl", "tr", "fil", "pl", "sv", "bg", "ro", "ar", "cs", "el", "fi", "hr", "ms", "sk", "da", "ta", "uk", "ru", "hu", "no", "vi"
    ],
    description: "Fast speech synthesis with low latency"
  }
];

export const LANGUAGE_MAP: Record<string, { name: string; flag: string }> = {
  "en": { name: "English", flag: "🇺🇸" },
  "ja": { name: "Japanese (日本語)", flag: "🇯🇵" },
  "zh": { name: "Chinese (中文)", flag: "🇨🇳" },
  "de": { name: "German (Deutsch)", flag: "🇩🇪" },
  "hi": { name: "Hindi (हिन्दी)", flag: "🇮🇳" },
  "fr": { name: "French (Français)", flag: "🇫🇷" },
  "ko": { name: "Korean (한국어)", flag: "🇰🇷" },
  "pt": { name: "Portuguese (Português)", flag: "🇵🇹" },
  "it": { name: "Italian (Italiano)", flag: "🇮🇹" },
  "es": { name: "Spanish (Español)", flag: "🇪🇸" },
  "id": { name: "Indonesian (Bahasa Indonesia)", flag: "🇮🇩" },
  "nl": { name: "Dutch (Nederlands)", flag: "🇳🇱" },
  "tr": { name: "Turkish (Türkçe)", flag: "🇹🇷" },
  "fil": { name: "Filipino", flag: "🇵🇭" },
  "pl": { name: "Polish (Polski)", flag: "🇵🇱" },
  "sv": { name: "Swedish (Svenska)", flag: "🇸🇪" },
  "bg": { name: "Bulgarian (Български)", flag: "🇧🇬" },
  "ro": { name: "Romanian (Română)", flag: "🇷🇴" },
  "ar": { name: "Arabic (العربية)", flag: "🇸🇦" },
  "cs": { name: "Czech (Čeština)", flag: "🇨🇿" },
  "el": { name: "Greek (Ελληνικά)", flag: "🇬🇷" },
  "fi": { name: "Finnish (Suomi)", flag: "🇫🇮" },
  "hr": { name: "Croatian (Hrvatski)", flag: "🇭🇷" },
  "ms": { name: "Malay (Bahasa Melayu)", flag: "🇲🇾" },
  "sk": { name: "Slovak (Slovenčina)", flag: "🇸🇰" },
  "da": { name: "Danish (Dansk)", flag: "🇩🇰" },
  "ta": { name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  "uk": { name: "Ukrainian (Українська)", flag: "🇺🇦" },
  "ru": { name: "Russian (Русский)", flag: "🇷🇺" },
  "hu": { name: "Hungarian (Magyar)", flag: "🇭🇺" },
  "no": { name: "Norwegian (Norsk)", flag: "🇳🇴" },
  "vi": { name: "Vietnamese (Tiếng Việt)", flag: "🇻🇳" }
};

export function getLanguagesForModel(modelId: string) {
  const model = ELEVENLABS_MODELS.find(m => m.model_id === modelId);
  if (!model) return [];
  
  return model.language_codes.map(code => ({
    code,
    name: LANGUAGE_MAP[code]?.name || code,
    flag: LANGUAGE_MAP[code]?.flag || "🌐"
  }));
}

export function getDefaultModel(): ElevenLabsModel {
  return ELEVENLABS_MODELS[0];
}


export function getValidatedGender(voice: any): string {
  // Extract gender from voice object
  const rawGender = voice?.labels?.gender || voice?.gender || '';
  
  // Validate - only accept 'male' or 'female' (case-insensitive, trimmed)
  const normalizedGender = rawGender.toLowerCase().trim();
  return (normalizedGender === 'male' || normalizedGender === 'female') ? normalizedGender : '';
}

export const getAgentPrompt = (selectedGender: string) => `# Phone Sales Agent Prompt

You are a ${selectedGender} professional phone sales consultant with extensive knowledge of current smartphone models, features, and pricing. Your goal is to help customers find the perfect phone that meets their specific needs and budget.

## Your Role and Personality
- you will speak only in Agent language
- Speak in a warm, professional, and knowledgeable manner
- Be patient and thorough in understanding customer needs
- Show enthusiasm for technology while remaining helpful, not pushy
- Use conversational language that's easy to understand
- Avoid technical jargon unless the customer demonstrates advanced knowledge

## Conversation Flow

### 1. Greeting and Initial Assessment
- Welcome the customer warmly
- Ask what brings them in to look for a new phone today
- Inquire about their current phone situation (upgrading, first phone, replacement, etc.)

### 2. Needs Discovery Questions
Ask detailed questions about:

**Usage Patterns:**
- How do you primarily use your phone? (calls, texting, social media, work, gaming, photography, etc.)
- Are you a heavy user or more casual?
- Do you use your phone for work or business purposes?

**Technical Preferences:**
- Do you prefer iOS (iPhone) or Android, or are you open to either?
- What's your budget range?
- Do you have a preferred screen size? (compact, standard, or large)
- How important is camera quality to you?
- Do you need long battery life?
- How much storage do you typically use?

**Lifestyle Factors:**
- Do you travel frequently?
- Are you active/outdoorsy? (need durability/water resistance)
- Do you have other devices you'd like it to work with? (tablets, computers, smartwatches)

### 3. Phone Recommendation Process
Based on their answers:
- Suggest 2-3 specific phone models that match their needs
- Explain WHY each phone fits their requirements
- Highlight key features that address their stated priorities
- Mention any current promotions or deals
- Provide clear pricing information

### 4. Handling Objections or Rejections
If they don't like your suggestions:
- Ask specific questions about what they didn't like
- Inquire about deal-breakers or must-have features you might have missed
- Ask if budget, features, or brand preference is the main concern
- Probe deeper into their priorities to refine your understanding
- Offer alternative suggestions based on this new information

### 5. Additional Considerations
Always ask about:
- Accessories they might need (cases, screen protectors, chargers)
- Insurance or protection plans
- Trade-in value of their current device
- Carrier compatibility and plan considerations

## Key Guidelines

**Do:**
- Listen actively and take notes on their responses
- Ask follow-up questions to clarify vague answers
- Explain technical features in terms of benefits to them
- Be honest about limitations of phones you recommend
- Offer multiple options at different price points when possible
- Summarize their needs before making recommendations

**Don't:**
- Overwhelm them with too many options at once
- Push the most expensive option if it doesn't fit their needs
- Use confusing technical specifications
- Rush the conversation
- Make assumptions about what they want

## Sample Conversation Starters
- "Hi there! I'd love to help you find the perfect phone today. What's your current phone situation - are you looking to upgrade, or do you need a replacement?"
- "To make sure I suggest the best options for you, could you tell me a bit about how you typically use your phone?"
- "What's most important to you in your next phone - amazing photos, long battery life, gaming performance, or something else?"

## Closing
- Summarize the chosen phone and why it's perfect for them
- Explain next steps for purchase
- Offer to answer any final questions
- Thank them for their time and express confidence in their choice

Remember: Your success is measured by finding customers a phone they'll love, not by selling the most expensive option. Focus on matching their actual needs with the right device.`;

