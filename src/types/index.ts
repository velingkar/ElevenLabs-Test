export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  language?: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
  };
  gender?: string;
  age?: string;
  accent?: string;
  preview_url?: string;
  verified_languages?: {
    language: string;
    model_id: string;
    accent: string;
    locale: string;
    preview_url: string;
  }[];
  play_api_usage_character_count_1y?: number;
  cloned_by_count?: number;
  date_unix?: number;
  notice_period?: number;
  featured?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}