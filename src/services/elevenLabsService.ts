import { ELEVENLABS_MODELS, getLanguagesForModel, getDefaultModel, AGENT_PROMPT } from '../data/elevenLabsData';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';


export interface ElevenLabsAgent {
  agent_id: string;
  name: string;
  platform_settings: {
    widget: {
      transcript_enabled: boolean;
      supports_text_only: boolean;
      always_expanded: boolean;
    };
  };
  conversation_config: {
    tts: {
      model_id: string;
      voice_id: string;
    };
    agent: {
      language: string;
      first_message: string;
      prompt: {
        prompt: string;
        llm: string;
        temperature: number;
      };
    };
  };
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private currentAudio: HTMLAudioElement | null = null;
  
  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  getModels() {
    return ELEVENLABS_MODELS;
  }

  getLanguagesForModel(modelId: string) {
    return getLanguagesForModel(modelId);
  }

  getDefaultModel() {
    return getDefaultModel();
  }

  async getVoicesForLanguage(languageCode: string): Promise<any[]> {
    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/shared-voices?language=${languageCode}`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY || 'demo-key'
        }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch voices for language, using fallback');
        return this.getFilteredMockVoices(languageCode);
      }
      
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.warn('Error fetching voices for language, using fallback');
      return this.getFilteredMockVoices(languageCode);
    }
  }

  private getFilteredMockVoices(languageCode: string) {
    const mockVoices = [
      {
        voice_id: 'rachel',
        name: 'Rachel',
        category: 'premade',
        labels: { accent: 'american', age: 'young', gender: 'female' }
      },
      {
        voice_id: 'drew',
        name: 'Drew',
        category: 'premade', 
        labels: { accent: 'american', age: 'young', gender: 'male' }
      },
      {
        voice_id: 'clyde',
        name: 'Clyde',
        category: 'premade',
        labels: { accent: 'american', age: 'middle_aged', gender: 'male' }
      },
      {
        voice_id: 'bella',
        name: 'Bella',
        category: 'premade',
        labels: { accent: 'american', age: 'young', gender: 'female' }
      },
      {
        voice_id: 'antonio',
        name: 'Antonio',
        category: 'premade',
        labels: { accent: 'spanish', age: 'middle_aged', gender: 'male' }
      },
      {
        voice_id: 'maria',
        name: 'Maria',
        category: 'premade',
        labels: { accent: 'spanish', age: 'young', gender: 'female' }
      },
      {
        voice_id: 'pierre',
        name: 'Pierre',
        category: 'premade',
        labels: { accent: 'french', age: 'middle_aged', gender: 'male' }
      },
      {
        voice_id: 'sophie',
        name: 'Sophie',
        category: 'premade',
        labels: { accent: 'french', age: 'young', gender: 'female' }
      }
    ];

    if (languageCode === 'en') {
      return mockVoices.filter(voice => 
        !voice.labels.accent || 
        voice.labels.accent.includes('american') || 
        voice.labels.accent.includes('british')
      );
    } else if (languageCode === 'es') {
      return mockVoices.filter(voice => 
        !voice.labels.accent || 
        voice.labels.accent.includes('spanish')
      );
    } else if (languageCode === 'fr') {
      return mockVoices.filter(voice => 
        !voice.labels.accent || 
        voice.labels.accent.includes('french')
      );
    }

    return mockVoices.slice(0, 2);
  }

  async generateSpeech(text: string, voiceId: string, modelId?: string): Promise<string> {

    
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      console.warn('No valid ElevenLabs API key found, using browser TTS fallback');
      return this.generateBrowserTTS(text);
    }
    
    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('ElevenLabs API error:', response.status, response.statusText, errorText);
        console.warn('Using browser TTS fallback');
        return this.generateBrowserTTS(text);
      }

      const audioBlob = await response.blob();

      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.warn('ElevenLabs request failed:', error);
      console.warn('Using browser TTS fallback');
      return this.generateBrowserTTS(text);
    }
  }

  private generateBrowserTTS(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser TTS not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Create a silent audio file as placeholder since we'll use speechSynthesis directly
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      // Convert to blob URL for consistency
      const arrayBuffer = new ArrayBuffer(44);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 22050, true);
      view.setUint32(28, 44100, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, 0, true);
      
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      // Store the utterance for later use
      (window as any).__currentUtterance = utterance;
      
      resolve(url);
    });
  }

  async createAgent(
    language: string,
    voiceId: string,
    voiceName: string,
    modelId: string = 'eleven_turbo_v2_5'
  ): Promise<ElevenLabsAgent> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      throw new Error('ElevenLabs API key is required to create agents');
    }

    const agentName = `Test${language}${voiceName.substring(0, 10)}`;
    
    const agentData = {
      conversation_config: {
        tts: {
          model_id: modelId,
          voice_id: voiceId
        },
        agent: {
          language: language,
          first_message: "",
          prompt: {
            prompt: AGENT_PROMPT,
            llm: "gpt-4.1",
            temperature: 0.1
          }
        }
      },
      name: agentName,
      platform_settings: {
        widget: {
          transcript_enabled: true,
          supports_text_only: true,
          always_expanded: false
        }
      }
    };

    try {
      console.log('Creating agent with data:', JSON.stringify(agentData, null, 2));
      
      const response = await fetch(`${ELEVENLABS_BASE_URL}/convai/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify(agentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Agent creation failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to create agent: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const createdAgent = await response.json();
      console.log('Agent created successfully:', createdAgent);
      return createdAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<ElevenLabsAgent> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      throw new Error('ElevenLabs API key is required to get agent details');
    }

    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get agent: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting agent:', error);
      throw error;
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    try {
      // Check if this is a browser TTS placeholder
      if ((window as any).__currentUtterance) {
        const utterance = (window as any).__currentUtterance;
        (window as any).__currentUtterance = null;
        
        return new Promise((resolve, reject) => {
          utterance.onend = () => resolve();
          utterance.onerror = (error: any) => reject(error);
          
          if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            
            if (this.currentAudio.src.startsWith('blob:')) {
              URL.revokeObjectURL(this.currentAudio.src);
            }
          }
          
          speechSynthesis.speak(utterance);
        });
      }
      
      // Regular audio playback for ElevenLabs
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        
        if (this.currentAudio.src.startsWith('blob:')) {
          URL.revokeObjectURL(this.currentAudio.src);
        }
      }

      this.currentAudio = new Audio(audioUrl);
      
      await this.currentAudio.play();
      
      this.currentAudio.addEventListener('ended', () => {
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        this.currentAudio = null;
      });
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw new Error('Audio playback failed');
    }
  }
}