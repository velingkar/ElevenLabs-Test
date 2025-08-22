import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onLanguageChange: (language: Language) => void;
  disabled?: boolean;
}

export function LanguageSelector({ 
  languages, 
  selectedLanguage, 
  onLanguageChange, 
  disabled
}: LanguageSelectorProps) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Language
      </label>
      <div className="relative">
        <select
          value={selectedLanguage?.code || ''}
          onChange={(e) => {
            const language = languages.find(lang => lang.code === e.target.value);
            if (language) onLanguageChange(language);
          }}
          disabled={disabled}
          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          {!selectedLanguage && (
            <option value="" disabled>
              Select a language...
            </option>
          )}
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}