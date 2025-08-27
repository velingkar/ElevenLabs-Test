import { Voice, Language } from '../types';

const VAPI_API_KEY = import.meta.env.VITE_VAPI_API_KEY;
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

export interface VapiAgent {
  id: string;
  name: string;
  voice_id: string;
  language: string;
  status: 'active' | 'inactive';
}

export interface VapiMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audio_url?: string;
}

export class VapiService {
  private static instance: VapiService;
  private currentAgent: VapiAgent | null = null;
  private vapiInstance: any = null;
  
  static getInstance(): VapiService {
    if (!VapiService.instance) {
      VapiService.instance = new VapiService();
    }
    return VapiService.instance;
  }

  async createAgent(voiceId: string, language: string, agentName: string = 'DynamicAgent'): Promise<VapiAgent> {
    console.log('Creating VAPI agent with:', { voiceId, language, agentName });
    console.log('VAPI API Key available:', !!VAPI_API_KEY);
    
    if (!VAPI_API_KEY) {
      throw new Error('VAPI API key not available');
    }

    try {
      const assistantBody = {
        name: agentName,
        model: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
          systemPrompt: this.getDynamicPrompt(language)
        },
        voice: {
          provider: "11labs",
          voiceId: voiceId
        },
        transcriber: {
          provider: "deepgram",
          language: language
        },
        firstMessage: this.getStartingMessage(language)
      };

      console.log('VAPI assistant creation request:', JSON.stringify(assistantBody, null, 2));

      const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VAPI_API_KEY}`
        },
        body: JSON.stringify(assistantBody)
      });

      console.log('VAPI assistant response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create VAPI assistant:', response.status, response.statusText);
        console.error('Error response body:', errorText);
        throw new Error(`Failed to create VAPI assistant: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('VAPI assistant creation response:', data);

      const agent: VapiAgent = {
        id: data.id,
        name: agentName,
        voice_id: voiceId,
        language: language,
        status: 'active'
      };

      this.currentAgent = agent;
      console.log('Current VAPI agent after creation:', this.currentAgent);
      
      // Verify the agent's voice configuration
      await this.verifyAgentVoiceConfiguration(data.id, voiceId);
      
      return agent;
    } catch (error) {
      console.error('Error creating VAPI agent:', error);
      throw error;
    }
  }

  async startVoiceCall(voiceId: string, language: string = 'en'): Promise<any> {
    console.log('Starting VAPI voice call with voice ID:', voiceId);
    console.log('Using language:', language);
    
    if (!VAPI_PUBLIC_KEY) {
      throw new Error('VAPI public key not available');
    }

    try {
      // Import VAPI Web SDK dynamically
      const { default: Vapi } = await import('@vapi-ai/web');
      
      // Initialize VAPI Web SDK
      this.vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
      console.log('VAPI Web SDK initialized');
      
      console.log('Using voice ID for call:', voiceId);
      console.log('Using language for call:', language);
      
      // Try creating the assistant configuration directly in the call
      // This bypasses any potential issues with pre-created agents
      const assistantConfig = {
        model: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
          systemPrompt: this.getDynamicPrompt(language)
        },
        voice: {
          provider: "11labs",
          voiceId: voiceId
        },
        transcriber: {
          provider: "deepgram" as const,
          language: language
        },
        firstMessage: this.getStartingMessage(language)
      };
      
      console.log('Assistant configuration for direct call:', JSON.stringify(assistantConfig, null, 2));
      
      // Start the call with the assistant configuration directly
      // This ensures the voice configuration is explicitly set
      const call = await this.vapiInstance.start(assistantConfig);
      
      console.log('VAPI voice call started with direct assistant config:', call);
      return call;
    } catch (error) {
      console.error('Error starting VAPI voice call:', error);
      throw error;
    }
  }

  async stopVoiceCall(): Promise<void> {
    console.log('Stopping VAPI voice call');
    
    try {
      if (this.vapiInstance) {
        await this.vapiInstance.stop();
        this.vapiInstance = null;
        console.log('VAPI voice call stopped');
      }
    } catch (error) {
      console.error('Error stopping VAPI voice call:', error);
      throw error;
    }
  }

  getCurrentAgent(): VapiAgent | null {
    return this.currentAgent;
  }

  getVapiInstance(): any {
    return this.vapiInstance;
  }

  async testApiConnection(): Promise<boolean> {
    if (!VAPI_API_KEY) {
      console.warn('No VAPI API key available for testing');
      return false;
    }

    try {
      console.log('Testing VAPI API connection...');
      const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });
      
      const isConnected = response.ok;
      console.log('VAPI API connection test result:', isConnected);
      return isConnected;
    } catch (error) {
      console.error('VAPI API connection test failed:', error);
      return false;
    }
  }

  private getDynamicPrompt(language: string): string {
    const basePrompt = `You are a helpful and engaging conversational AI assistant. You can discuss any topic, answer questions, provide advice, or simply have a friendly chat.

IMPORTANT: Always respond in the same language that the user is speaking to you in. If they speak to you in ${language}, respond in ${language}.

Key characteristics:
- Be friendly, helpful, and engaging
- Adapt your conversation style to match the user's energy
- Ask follow-up questions to keep the conversation flowing
- Share relevant information and insights
- Be conversational rather than robotic
- Show personality while remaining professional

You can discuss:
- General knowledge and current events
- Personal advice and recommendations
- Hobbies and interests
- Technology and innovation
- Travel and culture
- Health and wellness
- Entertainment and media
- Or any other topic the user brings up

Keep responses conversational and natural, as if you're talking to a friend.`;

    return basePrompt;
  }

  private getStartingMessage(language: string): string {
    const englishGreeting = "Hello! I'm here to chat with you. What would you like to talk about today?";
    
    if (language === 'en') {
      return englishGreeting;
    }

    // Simple translations for common languages
    const translations: Record<string, string> = {
      'es': '¡Hola! Estoy aquí para charlar contigo. ¿De qué te gustaría hablar hoy?',
      'fr': 'Bonjour ! Je suis là pour discuter avec vous. De quoi aimeriez-vous parler aujourd\'hui ?',
      'de': 'Hallo! Ich bin hier, um mit Ihnen zu sprechen. Worüber möchten Sie heute reden?',
      'zh': '你好！我在这里和你聊天。你今天想聊什么？',
      'ja': 'こんにちは！お話しするためにここにいます。今日は何について話したいですか？',
      'hi': 'नमस्ते! मैं आपसे बात करने के लिए यहाँ हूँ। आज आप किस बारे में बात करना चाहते हैं?',
      'ko': '안녕하세요! 당신과 대화하기 위해 여기 있습니다. 오늘 무엇에 대해 이야기하고 싶으신가요?',
      'pt': 'Olá! Estou aqui para conversar com você. Sobre o que você gostaria de falar hoje?',
      'it': 'Ciao! Sono qui per chiacchierare con te. Di cosa vorresti parlare oggi?',
      'ru': 'Привет! Я здесь, чтобы пообщаться с вами. О чем бы вы хотели поговорить сегодня?',
      'ar': 'مرحباً! أنا هنا للتحدث معك. ما الذي تود التحدث عنه اليوم؟'
    };

    return translations[language] || englishGreeting;
  }

  private async verifyAgentVoiceConfiguration(agentId: string, expectedVoiceId: string): Promise<void> {
    try {
      console.log('Verifying agent voice configuration...');
      const response = await fetch(`${VAPI_BASE_URL}/assistant/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (response.ok) {
        const agentData = await response.json();
        console.log('Agent configuration from VAPI:', agentData);
        
        const actualVoiceId = agentData.voice?.voiceId;
        const actualVoiceProvider = agentData.voice?.provider;
        
        console.log('Expected voice ID:', expectedVoiceId);
        console.log('Actual voice ID from VAPI:', actualVoiceId);
        console.log('Actual voice provider from VAPI:', actualVoiceProvider);
        
        if (actualVoiceId !== expectedVoiceId) {
          console.warn('Voice ID mismatch! Expected:', expectedVoiceId, 'Got:', actualVoiceId);
        } else {
          console.log('Voice ID verification successful');
        }
        
        if (actualVoiceProvider !== '11labs') {
          console.warn('Voice provider mismatch! Expected: 11labs, Got:', actualVoiceProvider);
        } else {
          console.log('Voice provider verification successful');
        }
      } else {
        console.warn('Failed to verify agent configuration');
      }
    } catch (error) {
      console.warn('Error verifying agent configuration:', error);
    }
  }

  private async reloadAgent(agentId: string): Promise<any> {
    try {
      const response = await fetch(`${VAPI_BASE_URL}/assistant/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to reload agent: ${response.status}`);
      }

      const agentData = await response.json();
      console.log('Agent reloaded successfully:', agentData);
      return agentData;
    } catch (error) {
      console.error('Error reloading agent:', error);
      throw error;
    }
  }
}
