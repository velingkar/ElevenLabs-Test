export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
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
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}