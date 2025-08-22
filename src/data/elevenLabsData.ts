export interface ElevenLabsModel {
  model_id: string;
  name: string;
  language_codes: string[];
  description: string;
}

export const ELEVENLABS_MODELS: ElevenLabsModel[] = [
  {
    model_id: "eleven_multilingual_v2",
    name: "Eleven Multilingual v2",
    language_codes: [
      "en", "ja", "zh", "de", "hi", "fr", "ko", "pt", "it", "es", "id", "nl", "tr", "fil", "pl", "sv", "bg", "ro", "ar", "cs", "el", "fi", "hr", "ms", "sk", "da", "ta", "uk", "ru", "hu", "no", "vi"
    ],
    description: "Cutting-edge multilingual speech synthesis, supporting 32 languages"
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