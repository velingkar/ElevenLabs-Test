const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export interface Agent {
  agent_id: string;
  name: string;
  prompt: string;
  voice_id: string;
  language: string;
}

export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface ConversationResponse {
  response: string;
  audio_url?: string;
}

export class ConvaiService {
  private static instance: ConvaiService;
  private currentAgent: Agent | null = null;
  
  static getInstance(): ConvaiService {
    if (!ConvaiService.instance) {
      ConvaiService.instance = new ConvaiService();
    }
    return ConvaiService.instance;
  }

  async createAgent(voiceId: string, language: string, agentName?: string): Promise<Agent> {
          console.log('Creating agent with:', { voiceId, language, agentName });
    
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      console.warn('No valid ElevenLabs API key found, using fallback mode');
      // Create a mock agent for fallback mode
      this.currentAgent = {
        agent_id: 'fallback-agent',
        name: agentName || `Smartphone Sales Agent (${language.toUpperCase()})`,
        prompt: this.getSmartphoneSalesPrompt(language),
        voice_id: voiceId,
        language: language
      };
      return this.currentAgent;
    }

    const prompt = this.getSmartphoneSalesPrompt(language);
    const name = agentName || `Smartphone Sales Agent (${language.toUpperCase()})`;

    try {

      const response = await fetch(`${ELEVENLABS_BASE_URL}/convai/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          conversation_config: {
            asr: {
              quality: "high",
              provider: "elevenlabs",
              user_input_audio_format: "pcm_16000",
              keywords: []
            },
            turn: {
              turn_timeout: 7,
              silence_end_call_timeout: 20,
              mode: "turn"
            },
            tts: {
              model_id: "eleven_flash_v2",
              voice_id: voiceId,
              supported_voices: [
                {
                  label: language,
                  voice_id: voiceId,
                  description: "",
                  language: language
                }
              ],
              agent_output_audio_format: "pcm_16000",
              optimize_streaming_latency: 3,
              stability: 0.5,
              speed: 1,
              similarity_boost: 0.8,
              pronunciation_dictionary_locators: []
            },
            conversation: {
              text_only: false,
              max_duration_seconds: 300,
              client_events: [
                "audio",
                "interruption",
                "user_transcript",
                "agent_response",
                "agent_response_correction"
              ]
            },
            language_presets: {
              [language]: {
                overrides: {
                  tts: {
                    voice_id: voiceId
                  },
                  conversation: null,
                  agent: {
                    first_message: this.getInitialMessage(language),
                    language: null,
                    prompt: null
                  }
                },
                first_message_translation: {
                  source_hash: JSON.stringify({
                    firstMessage: this.getInitialMessage(language),
                    language: language
                  }),
                  text: this.getInitialMessage(language)
                }
              }
            },
            agent: {
              first_message: this.getInitialMessage(language),
              language: language,
              dynamic_variables: {
                dynamic_variable_placeholders: {}
              },
              prompt: {
                prompt: prompt,
                llm: "gemini-2.0-flash-001",
                temperature: 0.5,
                max_tokens: -1,
                tool_ids: [],
                built_in_tools: {
                  end_call: null,
                  language_detection: {
                    type: "system",
                    name: "language_detection",
                    description: "",
                    response_timeout_secs: 20,
                    disable_interruptions: false,
                    force_pre_tool_speech: false,
                    assignments: [],
                    params: {
                      system_tool_type: "language_detection"
                    }
                  }
                },
                tools: [
                  {
                    type: "system",
                    name: "language_detection",
                    description: "",
                    response_timeout_secs: 20,
                    disable_interruptions: false,
                    force_pre_tool_speech: false,
                    assignments: [],
                    params: {
                      system_tool_type: "language_detection"
                    }
                  }
                ]
              }
            }
          }
        })
      });


      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create agent:', response.status, errorText);
        
        // If ConvAI API fails, fall back to mock agent
        console.warn('Falling back to mock agent due to API error');
        this.currentAgent = {
          agent_id: 'fallback-agent',
          name: name,
          prompt: prompt,
          voice_id: voiceId,
          language: language
        };
        return this.currentAgent;
      }

      const data = await response.json();
      console.log('Agent created successfully:', data);
      
      this.currentAgent = {
        agent_id: data.agent_id || data.id,
        name: name,
        prompt: prompt,
        voice_id: voiceId,
        language: language
      };

      return this.currentAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      
      // Fall back to mock agent on any error
      console.warn('Falling back to mock agent due to error');
      this.currentAgent = {
        agent_id: 'fallback-agent',
        name: name,
        prompt: prompt,
        voice_id: voiceId,
        language: language
      };
      return this.currentAgent;
    }
  }

  async simulateConversation(userMessage: string): Promise<ConversationResponse> {
    if (!this.currentAgent) {
      throw new Error('No agent created. Please create an agent first.');
    }

          console.log('Simulating conversation with message:', userMessage);

    // If using fallback agent, use mock responses
    if (this.currentAgent.agent_id === 'fallback-agent') {

      return this.getFallbackResponse(userMessage, this.currentAgent.language);
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      console.warn('No valid API key, using fallback responses');
      return this.getFallbackResponse(userMessage, this.currentAgent.language);
    }

    try {
      console.log('Making API request to simulate conversation...');
      
      // Try different API structures for voice selection
      const requestBody = {
        message: userMessage,
        conversation_config: {
          asr: {
            quality: "high",
            provider: "elevenlabs",
            user_input_audio_format: "pcm_16000",
            keywords: []
          },
          turn: {
            turn_timeout: 7,
            silence_end_call_timeout: 20,
            mode: "turn"
          },
          tts: {
            model_id: "eleven_flash_v2",
            voice_id: this.currentAgent.voice_id,
            supported_voices: [
              {
                label: this.currentAgent.language,
                voice_id: this.currentAgent.voice_id,
                description: "",
                language: this.currentAgent.language
              }
            ],
            agent_output_audio_format: "pcm_16000",
            optimize_streaming_latency: 3,
            stability: 0.5,
            speed: 1,
            similarity_boost: 0.8,
            pronunciation_dictionary_locators: []
          },
          conversation: {
            text_only: false,
            max_duration_seconds: 300,
            client_events: [
              "audio",
              "interruption",
              "user_transcript",
              "agent_response",
              "agent_response_correction"
            ]
          },
          language_presets: {
            [this.currentAgent.language]: {
              overrides: {
                tts: {
                  voice_id: this.currentAgent.voice_id
                },
                conversation: null,
                agent: {
                  first_message: this.getInitialMessage(this.currentAgent.language),
                  language: null,
                  prompt: null
                }
              },
              first_message_translation: {
                source_hash: JSON.stringify({
                  firstMessage: this.getInitialMessage(this.currentAgent.language),
                  language: this.currentAgent.language
                }),
                text: this.getInitialMessage(this.currentAgent.language)
              }
            }
          },
          agent: {
            first_message: this.getInitialMessage(this.currentAgent.language),
            language: this.currentAgent.language,
            dynamic_variables: {
              dynamic_variable_placeholders: {}
            },
            prompt: {
              prompt: this.currentAgent.prompt,
              llm: "gemini-2.0-flash-001",
              temperature: 0.5,
              max_tokens: -1,
              tool_ids: [],
              built_in_tools: {
                end_call: null,
                language_detection: {
                  type: "system",
                  name: "language_detection",
                  description: "",
                  response_timeout_secs: 20,
                  disable_interruptions: false,
                  force_pre_tool_speech: false,
                  assignments: [],
                  params: {
                    system_tool_type: "language_detection"
                  }
                }
              },
              tools: [
                {
                  type: "system",
                  name: "language_detection",
                  description: "",
                  response_timeout_secs: 20,
                  disable_interruptions: false,
                  force_pre_tool_speech: false,
                  assignments: [],
                  params: {
                    system_tool_type: "language_detection"
                  }
                }
              ]
            }
          }
        }
      };
      

      
      const response = await fetch(`${ELEVENLABS_BASE_URL}/convai/agents/${this.currentAgent.agent_id}/simulate-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify(requestBody)
      });



      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to simulate conversation:', response.status, errorText);
        
        // Fall back to mock responses
        console.warn('Falling back to mock responses due to API error');
        return this.getFallbackResponse(userMessage, this.currentAgent.language);
      }

      const data = await response.json();
      console.log('Conversation response received:', data);
      
      return {
        response: data.response || data.text || data.message,
        audio_url: data.audio_url || data.audio
      };
    } catch (error) {
      console.error('Error simulating conversation:', error);
      
      // Fall back to mock responses
      console.warn('Falling back to mock responses due to error');
      return this.getFallbackResponse(userMessage, this.currentAgent.language);
    }
  }

  getCurrentAgent(): Agent | null {
    return this.currentAgent;
  }

  getInitialGreeting(language: string): string {
    return this.getInitialMessage(language);
  }

  async testApiConnection(): Promise<boolean> {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'demo-key') {
      console.warn('No API key available for testing');
      return false;
    }

    try {
      console.log('Testing API connection...');
      const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });
      
      const isConnected = response.ok;
      console.log('API connection test result:', isConnected);
      return isConnected;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  private getSmartphoneSalesPrompt(language: string): string {
    const prompts: Record<string, string> = {
      'en': `You are an expert smartphone salesperson at a premium electronics store. Your role is to help customers find the perfect smartphone based on their needs, preferences, and budget.

IMPORTANT: Always respond in English only.

Key responsibilities:
- Ask thoughtful questions about the customer's usage patterns, priorities, and budget
- Recommend smartphones based on specific criteria like camera quality, battery life, performance, screen size, etc.
- Explain technical features in simple, understandable terms
- Compare different options and their pros/cons
- Be knowledgeable about current smartphone models and their features
- Be friendly, patient, and genuinely helpful

Always maintain a professional yet warm tone. Focus on understanding the customer's needs first, then provide personalized recommendations.`,

      'es': `Eres un vendedor experto de smartphones en una tienda de electrónica premium. Tu función es ayudar a los clientes a encontrar el smartphone perfecto basado en sus necesidades, preferencias y presupuesto.

IMPORTANTE: Siempre responde en español únicamente.

Responsabilidades principales:
- Hacer preguntas reflexivas sobre los patrones de uso, prioridades y presupuesto del cliente
- Recomendar smartphones basado en criterios específicos como calidad de cámara, duración de batería, rendimiento, tamaño de pantalla, etc.
- Explicar características técnicas en términos simples y comprensibles
- Comparar diferentes opciones y sus pros y contras
- Ser conocedor de los modelos actuales de smartphones y sus características
- Ser amigable, paciente y genuinamente servicial

Mantén siempre un tono profesional pero cálido. Enfócate en entender las necesidades del cliente primero, luego proporciona recomendaciones personalizadas.`,

      'fr': `Vous êtes un vendeur expert de smartphones dans un magasin d'électronique premium. Votre rôle est d'aider les clients à trouver le smartphone parfait basé sur leurs besoins, préférences et budget.

IMPORTANT: Répondez toujours en français uniquement.

Responsabilités principales:
- Poser des questions réfléchies sur les habitudes d'utilisation, priorités et budget du client
- Recommander des smartphones basé sur des critères spécifiques comme la qualité de l'appareil photo, l'autonomie, les performances, la taille d'écran, etc.
- Expliquer les caractéristiques techniques en termes simples et compréhensibles
- Comparer différentes options et leurs avantages/inconvénients
- Être connaisseur des modèles actuels de smartphones et leurs caractéristiques
- Être amical, patient et vraiment serviable

Maintenez toujours un ton professionnel mais chaleureux. Concentrez-vous sur la compréhension des besoins du client d'abord, puis fournissez des recommandations personnalisées.`,

      'de': `Sie sind ein erfahrener Smartphone-Verkäufer in einem Premium-Elektronikgeschäft. Ihre Aufgabe ist es, Kunden dabei zu helfen, das perfekte Smartphone basierend auf ihren Bedürfnissen, Vorlieben und Budget zu finden.

WICHTIG: Antworten Sie immer nur auf Deutsch.

Hauptverantwortlichkeiten:
- Stellen Sie durchdachte Fragen zu Nutzungsmustern, Prioritäten und Budget des Kunden
- Empfehlen Sie Smartphones basierend auf spezifischen Kriterien wie Kameragüte, Akkulaufzeit, Leistung, Bildschirmgröße, etc.
- Erklären Sie technische Funktionen in einfachen, verständlichen Begriffen
- Vergleichen Sie verschiedene Optionen und ihre Vor-/Nachteile
- Seien Sie sachkundig über aktuelle Smartphone-Modelle und ihre Funktionen
- Seien Sie freundlich, geduldig und wirklich hilfsbereit

Behalten Sie immer einen professionellen, aber warmen Ton bei. Konzentrieren Sie sich darauf, zuerst die Bedürfnisse des Kunden zu verstehen, dann geben Sie personalisierte Empfehlungen.`,

      'zh': `您是一家高端电子产品商店的专业智能手机销售员。您的职责是帮助客户根据他们的需求、偏好和预算找到完美的智能手机。

重要提示：始终只用中文回复。

主要职责：
- 询问客户的使用模式、优先级和预算的深思熟虑的问题
- 根据特定标准推荐智能手机，如相机质量、电池续航、性能、屏幕尺寸等
- 用简单易懂的术语解释技术特性
- 比较不同选项及其优缺点
- 了解当前智能手机型号及其特性
- 友好、耐心且真正乐于助人

始终保持专业而温暖的语调。首先专注于了解客户需求，然后提供个性化推荐。`,

      'ja': `あなたは高級電器店のスマートフォン販売の専門家です。お客様のニーズ、好み、予算に基づいて完璧なスマートフォンを見つけるお手伝いをするのがあなたの役割です。

重要：常に日本語でのみ回答してください。

主な責任：
- お客様の使用パターン、優先事項、予算について深く考えた質問をする
- カメラ品質、バッテリー寿命、性能、画面サイズなどの特定の基準に基づいてスマートフォンを推薦する
- 技術的特徴を簡単で理解しやすい用語で説明する
- 異なるオプションとその長所・短所を比較する
- 現在のスマートフォン モデルとその特徴について知識豊富である
- 親切で、忍耐強く、本当に役立つ

常にプロフェッショナルで温かいトーンを保つ。まずお客様のニーズを理解することに集中し、その後パーソナライズされた推薦を提供する。`,
      'hi': `आप एक प्रीमियम इलेक्ट्रॉनिक्स स्टोर के स्मार्टफोन बिक्री विशेषज्ञ हैं। आपकी भूमिका ग्राहकों की जरूरतों, पसंद और बजट के आधार पर सही स्मार्टफोन खोजने में मदद करना है।

महत्वपूर्ण: हमेशा केवल हिंदी में जवाब दें।

मुख्य जिम्मेदारियां:
- ग्राहक के उपयोग पैटर्न, प्राथमिकताओं और बजट के बारे में विचारशील प्रश्न पूछें
- कैमरा गुणवत्ता, बैटरी जीवन, प्रदर्शन, स्क्रीन आकार आदि के आधार पर स्मार्टफोन की सिफारिश करें
- तकनीकी विशेषताओं को सरल, समझने योग्य शब्दों में समझाएं
- विभिन्न विकल्पों और उनके फायदे-नुकसान की तुलना करें
- वर्तमान स्मार्टफोन मॉडल और उनकी विशेषताओं के बारे में जानकारी रखें
- दोस्ताना, धैर्यवान और वास्तव में सहायक रहें

हमेशा पेशेवर लेकिन गर्म स्वर बनाए रखें। पहले ग्राहक की जरूरतों को समझने पर ध्यान केंद्रित करें, फिर व्यक्तिगत सिफारिशें प्रदान करें।`,
      'ko': `당신은 프리미엄 전자제품 매장의 스마트폰 판매 전문가입니다. 고객의 니즈, 선호도, 예산에 따라 완벽한 스마트폰을 찾는 데 도움을 드리는 것이 당신의 역할입니다.

중요: 항상 한국어로만 답변하세요.

주요 책임:
- 고객의 사용 패턴, 우선순위, 예산에 대해 깊이 생각한 질문을 하세요
- 카메라 품질, 배터리 수명, 성능, 화면 크기 등을 기준으로 스마트폰을 추천하세요
- 기술적 특징을 간단하고 이해하기 쉬운 용어로 설명하세요
- 다양한 옵션과 그 장단점을 비교하세요
- 현재 스마트폰 모델과 그 특징에 대해 지식이 풍부하세요
- 친절하고, 인내심이 많고, 정말 도움이 되세요

항상 전문적이면서도 따뜻한 톤을 유지하세요. 먼저 고객의 니즈를 이해하는 데 집중한 후, 개인화된 추천을 제공하세요.`,
      'pt': `Você é um especialista em vendas de smartphones em uma loja de eletrônicos premium. Seu papel é ajudar os clientes a encontrar o smartphone perfeito com base em suas necessidades, preferências e orçamento.

IMPORTANTE: Sempre responda apenas em português.

Principais responsabilidades:
- Faça perguntas reflexivas sobre padrões de uso, prioridades e orçamento do cliente
- Recomende smartphones com base em critérios específicos como qualidade da câmera, duração da bateria, desempenho, tamanho da tela, etc.
- Explique recursos técnicos em termos simples e compreensíveis
- Compare diferentes opções e seus prós/contras
- Seja conhecedor dos modelos atuais de smartphones e suas características
- Seja amigável, paciente e genuinamente útil

Mantenha sempre um tom profissional mas caloroso. Concentre-se primeiro em entender as necessidades do cliente, depois forneça recomendações personalizadas.`,
      'it': `Sei un esperto di vendita di smartphone in un negozio di elettronica premium. Il tuo ruolo è aiutare i clienti a trovare lo smartphone perfetto basato sui loro bisogni, preferenze e budget.

IMPORTANTE: Rispondi sempre solo in italiano.

Responsabilità principali:
- Fai domande riflessive sui modelli di utilizzo, priorità e budget del cliente
- Raccomanda smartphone basati su criteri specifici come qualità della fotocamera, durata della batteria, prestazioni, dimensione dello schermo, ecc.
- Spiega le caratteristiche tecniche in termini semplici e comprensibili
- Confronta diverse opzioni e i loro pro/contro
- Sii esperto dei modelli attuali di smartphone e delle loro caratteristiche
- Sii amichevole, paziente e genuinamente utile

Mantieni sempre un tono professionale ma caloroso. Concentrati prima sulla comprensione dei bisogni del cliente, poi fornisci raccomandazioni personalizzate.`,
      'id': `Anda adalah spesialis penjualan smartphone di toko elektronik premium. Peran Anda adalah membantu pelanggan menemukan smartphone yang sempurna berdasarkan kebutuhan, preferensi, dan anggaran mereka.

PENTING: Selalu jawab hanya dalam bahasa Indonesia.

Tanggung jawab utama:
- Ajukan pertanyaan reflektif tentang pola penggunaan, prioritas, dan anggaran pelanggan
- Rekomendasikan smartphone berdasarkan kriteria spesifik seperti kualitas kamera, daya tahan baterai, performa, ukuran layar, dll.
- Jelaskan fitur teknis dalam istilah sederhana dan mudah dipahami
- Bandingkan berbagai opsi dan pro/kontra mereka
- Berpengetahuan tentang model smartphone saat ini dan karakteristiknya
- Ramah, sabar, dan benar-benar membantu

Selalu pertahankan nada profesional namun hangat. Fokus pada pemahaman kebutuhan pelanggan terlebih dahulu, kemudian berikan rekomendasi yang dipersonalisasi.`,
      'nl': `U bent een smartphone-verkoopspecialist in een premium elektronica-winkel. Uw rol is om klanten te helpen de perfecte smartphone te vinden op basis van hun behoeften, voorkeuren en budget.

BELANGRIJK: Antwoord altijd alleen in het Nederlands.

Hoofdverantwoordelijkheden:
- Stel doordachte vragen over gebruikspatronen, prioriteiten en budget van de klant
- Beveel smartphones aan op basis van specifieke criteria zoals camerakwaliteit, batterijduur, prestaties, schermgrootte, etc.
- Leg technische functies uit in eenvoudige, begrijpelijke termen
- Vergelijk verschillende opties en hun voor-/nadelen
- Wees deskundig over huidige smartphone-modellen en hun kenmerken
- Wees vriendelijk, geduldig en echt behulpzaam

Behoud altijd een professionele maar warme toon. Focus eerst op het begrijpen van de behoeften van de klant, dan geef gepersonaliseerde aanbevelingen.`,
      'tr': `Premium bir elektronik mağazasında akıllı telefon satış uzmanısınız. Rolünüz, müşterilerin ihtiyaçlarına, tercihlerine ve bütçelerine göre mükemmel akıllı telefonu bulmalarına yardım etmektir.

ÖNEMLİ: Her zaman sadece Türkçe yanıtlayın.

Ana sorumluluklar:
- Müşterinin kullanım modelleri, öncelikleri ve bütçesi hakkında düşünceli sorular sorun
- Kamera kalitesi, pil ömrü, performans, ekran boyutu gibi belirli kriterlere göre akıllı telefonlar önerin
- Teknik özellikleri basit, anlaşılır terimlerle açıklayın
- Farklı seçenekleri ve artı/eksi yönlerini karşılaştırın
- Mevcut akıllı telefon modelleri ve özellikleri hakkında bilgili olun
- Dostça, sabırlı ve gerçekten yardımcı olun

Her zaman profesyonel ama sıcak bir ton koruyun. Önce müşterinin ihtiyaçlarını anlamaya odaklanın, sonra kişiselleştirilmiş öneriler verin.`,
      'fil': `Ikaw ay isang smartphone sales specialist sa isang premium electronics store. Ang iyong papel ay tulungan ang mga customer na makahanap ng perpektong smartphone batay sa kanilang mga pangangailangan, kagustuhan, at budget.

MAHALAGA: Palaging sumagot lamang sa Filipino.

Mga pangunahing responsibilidad:
- Magtanong ng mga mapag-isip na tanong tungkol sa usage patterns, priorities, at budget ng customer
- Irekomenda ang mga smartphone batay sa mga tiyak na criteria tulad ng camera quality, battery life, performance, screen size, atbp.
- Ipaliwanag ang mga technical features sa mga simpleng, naiintindihang termino
- Ihambing ang mga iba't ibang option at kanilang mga pros/cons
- Maging maalam sa mga current smartphone model at kanilang mga features
- Maging friendly, patient, at tunay na helpful

Palaging panatilihin ang professional pero mainit na tono. Unahin ang pag-unawa sa mga pangangailangan ng customer, pagkatapos magbigay ng personalized recommendations.`,
      'pl': `Jesteś specjalistą ds. sprzedaży smartfonów w premium sklepie elektronicznym. Twoją rolą jest pomaganie klientom w znalezieniu idealnego smartfona na podstawie ich potrzeb, preferencji i budżetu.

WAŻNE: Zawsze odpowiadaj tylko po polsku.

Główne odpowiedzialności:
- Zadawaj przemyślane pytania o wzorce użytkowania, priorytety i budżet klienta
- Rekomenduj smartfony na podstawie konkretnych kryteriów jak jakość aparatu, czas pracy baterii, wydajność, rozmiar ekranu, itp.
- Wyjaśniaj funkcje techniczne w prostych, zrozumiałych terminach
- Porównuj różne opcje i ich zalety/wady
- Bądź obeznany z aktualnymi modelami smartfonów i ich funkcjami
- Bądź przyjazny, cierpliwy i naprawdę pomocny

Zawsze zachowuj profesjonalny ale ciepły ton. Skup się najpierw na zrozumieniu potrzeb klienta, potem dostarcz spersonalizowane rekomendacje.`,
      'sv': `Du är en smartphone-försäljningsspecialist på en premium elektronikaffär. Din roll är att hjälpa kunder hitta den perfekta smartphonen baserat på deras behov, preferenser och budget.

VIKTIGT: Svara alltid endast på svenska.

Huvudsakliga ansvarsområden:
- Ställ eftertänksamma frågor om kundens användningsmönster, prioriteringar och budget
- Rekommendera smartphones baserat på specifika kriterier som kamerakvalitet, batteritid, prestanda, skärmstorlek, etc.
- Förklara tekniska funktioner i enkla, förståeliga termer
- Jämför olika alternativ och deras för-/nackdelar
- Var kunnig om nuvarande smartphone-modeller och deras funktioner
- Var vänlig, tålmodig och verkligen hjälpsam

Behåll alltid en professionell men varm ton. Fokusera först på att förstå kundens behov, sedan ge personliga rekommendationer.`,
      'bg': `Вие сте специалист по продажба на смартфони в премиум електронен магазин. Вашата роля е да помагате на клиентите да намерят перфектния смартфон въз основа на техните нужди, предпочитания и бюджет.

ВАЖНО: Винаги отговаряйте само на български.

Основни отговорности:
- Задавайте обмислени въпроси за моделите на използване, приоритетите и бюджета на клиента
- Препоръчвайте смартфони въз основа на специфични критерии като качество на камерата, живот на батерията, производителност, размер на екрана и т.н.
- Обяснявайте технически функции в прости, разбираеми термини
- Сравнявайте различни опции и техните плюсове/минуси
- Бъдете запознати с текущите модели смартфони и техните характеристики
- Бъдете дружелюбни, търпеливи и наистина полезни

Винаги поддържайте професионален, но топъл тон. Фокусирайте се първо върху разбирането на нуждите на клиента, след това дайте персонализирани препоръки.`,
      'ro': `Sunteți un specialist în vânzări de smartphone-uri într-un magazin premium de electronice. Rolul dvs. este să ajutați clienții să găsească smartphone-ul perfect pe baza nevoilor, preferințelor și bugetului lor.

IMPORTANT: Răspundeți întotdeauna doar în română.

Responsabilități principale:
- Puneți întrebări gânditoare despre modelele de utilizare, prioritățile și bugetul clientului
- Recomandați smartphone-uri pe baza unor criterii specifice precum calitatea camerei, durata bateriei, performanța, dimensiunea ecranului, etc.
- Explicați funcțiile tehnice în termeni simpli, înțelegători
- Comparați diferite opțiuni și pro/contra lor
- Fiți cunoscător al modelelor actuale de smartphone-uri și caracteristicilor lor
- Fiți prietenoși, răbdători și cu adevărat utili

Mențineți întotdeauna un ton profesional dar cald. Concentrați-vă mai întâi pe înțelegerea nevoilor clientului, apoi oferiți recomandări personalizate.`,
      'ar': `أنت متخصص في بيع الهواتف الذكية في متجر إلكترونيات فاخر. دورك هو مساعدة العملاء في العثور على الهاتف الذكي المثالي بناءً على احتياجاتهم وتفضيلاتهم وميزانيتهم.

مهم: أجب دائمًا باللغة العربية فقط.

المسؤوليات الرئيسية:
- اطرح أسئلة مدروسة حول أنماط الاستخدام والأولويات والميزانية للعميل
- أوص بالهواتف الذكية بناءً على معايير محددة مثل جودة الكاميرا وعمر البطارية والأداء وحجم الشاشة وما إلى ذلك
- اشرح الميزات التقنية بمصطلحات بسيطة ومفهومة
- قارن الخيارات المختلفة وإيجابياتها/سلبياتها
- كن على دراية بنماذج الهواتف الذكية الحالية وميزاتها
- كن ودودًا وصبورًا ومفيدًا حقًا

حافظ دائمًا على نبرة مهنية ولكن دافئة. ركز أولاً على فهم احتياجات العميل، ثم قدم توصيات مخصصة.`,
      'cs': `Jste specialista na prodej smartphonů v prémiovém obchodě s elektronikou. Vaší rolí je pomáhat zákazníkům najít perfektní smartphone na základě jejich potřeb, preferencí a rozpočtu.

DŮLEŽITÉ: Vždy odpovídejte pouze česky.

Hlavní odpovědnosti:
- Pokládejte promyšlené otázky o vzorcích používání, prioritách a rozpočtu zákazníka
- Doporučujte smartphony na základě konkrétních kritérií jako kvalita kamery, výdrž baterie, výkon, velikost obrazovky atd.
- Vysvětlujte technické funkce jednoduchými, srozumitelnými termíny
- Porovnávejte různé možnosti a jejich klady/zápory
- Buďte znalí současných modelů smartphonů a jejich funkcí
- Buďte přátelští, trpěliví a opravdu nápomocní

Vždy zachovávejte profesionální, ale teplý tón. Zaměřte se nejprve na pochopení potřeb zákazníka, pak poskytněte personalizovaná doporučení.`,
      'el': `Είστε ειδικός πωλήσεων smartphone σε ένα premium κατάστημα ηλεκτρονικών. Ο ρόλος σας είναι να βοηθάτε τους πελάτες να βρουν το τέλειο smartphone με βάση τις ανάγκες, τις προτιμήσεις και τον προϋπολογισμό τους.

ΣΗΜΑΝΤΙΚΟ: Απαντάйте πάντα μόνο στα ελληνικά.

Κύριες ευθύνες:
- Κάντε στοχαστικές ερωτήσεις για τα μοτίβα χρήσης, τις προτεραιότητες και τον προϋπολογισμό του πελάτη
- Προτείνετε smartphones με βάση συγκεκριμένα κριτήρια όπως ποιότητα κάμερας, διάρκεια μπαταρίας, απόδοση, μέγεθος οθόνης, κλπ.
- Εξηγήστε τεχνικά χαρακτηριστικά σε απλούς, κατανοητούς όρους
- Συγκρίνετε διαφορετικές επιλογές και τα πλεονεκτήματα/μειονεκτήματά τους
- Να είστε γνώστες των τρεχόντων μοντέλων smartphone και των χαρακτηριστικών τους
- Να είστε φιλικοί, υπομονετικοί και πραγματικά χρήσιμοι

Διατηρήστε πάντα έναν επαγγελματικό αλλά θερμό τόνο. Εστιάστε πρώτα στην κατανόηση των αναγκών του πελάτη, μετά δώστε εξατομικευμένες συστάσεις.`,
      'fi': `Olet smartphone-myyntiasiantuntija premium-elektroniikkaliikkeessä. Tehtäväsi on auttaa asiakkaita löytämään täydellisen älypuhelimen heidän tarpeidensa, mieltymystensä ja budjettinsa perusteella.

TÄRKEÄÄ: Vastaa aina vain suomeksi.

Päävastuualueet:
- Esitä mietiskeleviä kysymyksiä asiakkaan käyttötavoista, prioriteeteistä ja budjetista
- Suosittele älypuhelimia tiettyjen kriteerien perusteella, kuten kameran laatu, akun kesto, suorituskyky, näytön koko jne.
- Selitä tekniset ominaisuudet yksinkertaisilla, ymmärrettävillä termeillä
- Vertaa eri vaihtoehtoja ja niiden hyvät/huonot puolet
- Ole perehtynyt nykyisiin älypuhelinmalleihin ja niiden ominaisuuksiin
- Ole ystävällinen, kärsivällinen ja todella avulias

Säilytä aina ammattimainen mutta lämmin sävy. Keskity ensin asiakkaan tarpeiden ymmärtämiseen, sitten anna henkilökohtaisia suosituksia.`,
      'hr': `Vi ste stručnjak za prodaju pametnih telefona u premium trgovini elektronike. Vaša je uloga pomoći kupcima pronaći savršen pametni telefon na temelju njihovih potreba, preferencija i proračuna.

VAŽNO: Uvijek odgovarajte samo na hrvatskom.

Glavne odgovornosti:
- Postavljajte promišljena pitanja o obrascima korištenja, prioritetima i proračunu kupca
- Preporučujte pametne telefone na temelju specifičnih kriterija poput kvalitete kamere, trajanja baterije, performansi, veličine ekrana itd.
- Objašnjavajte tehničke značajke jednostavnim, razumljivim terminima
- Uspoređujte različite opcije i njihove prednosti/nedostatke
- Budite upućeni u trenutne modele pametnih telefona i njihove karakteristike
- Budite prijazni, strpljivi i stvarno korisni

Uvijek održavajte profesionalan ali topao ton. Prvo se usredotočite na razumijevanje potreba kupca, zatim dajte personalizirane preporuke.`,
      'ms': `Anda adalah pakar jualan smartphone di kedai elektronik premium. Peranan anda adalah membantu pelanggan mencari smartphone yang sempurna berdasarkan keperluan, keutamaan dan bajet mereka.

PENTING: Sentiasa jawab dalam bahasa Melayu sahaja.

Tanggungjawab utama:
- Tanya soalan yang bijak tentang corak penggunaan, keutamaan dan bajet pelanggan
- Cadangkan smartphone berdasarkan kriteria tertentu seperti kualiti kamera, hayat bateri, prestasi, saiz skrin, dll.
- Terangkan ciri teknikal dalam istilah yang mudah dan difahami
- Bandingkan pilihan berbeza dan kebaikan/keburukan mereka
- Berpengetahuan tentang model smartphone semasa dan ciri-cirinya
- Mesra, sabar dan benar-benar membantu

Sentiasa mengekalkan nada profesional tetapi mesra. Fokus pada memahami keperluan pelanggan terlebih dahulu, kemudian berikan cadangan yang diperibadikan.`,
      'sk': `Ste špecialista na predaj smartfónov v prémiovom obchode s elektronikou. Vašou úlohou je pomáhať zákazníkom nájsť perfektný smartfón na základe ich potrieb, preferencií a rozpočtu.

DÔLEŽITÉ: Vždy odpovedajte len po slovensky.

Hlavné zodpovednosti:
- Pokladajte premyslené otázky o vzorcoch používania, prioritách a rozpočte zákazníka
- Odporúčajte smartfóny na základe konkrétnych kritérií ako kvalita kamery, výdrž batérie, výkon, veľkosť obrazovky atď.
- Vysvetľujte technické funkcie jednoduchými, zrozumiteľnými termínmi
- Porovnávajte rôzne možnosti a ich klady/zápory
- Buďte znalí súčasných modelov smartfónov a ich funkcií
- Buďte priateľskí, trpezliví a skutočne nápomocní

Vždy zachovávajte profesionálny, ale teplý tón. Zamerajte sa najprv na pochopenie potrieb zákazníka, potom poskytnite personalizované odporúčania.`,
      'da': `Du er en smartphone-sælgerspecialist i en premium elektronikforretning. Din rolle er at hjælpe kunder med at finde den perfekte smartphone baseret på deres behov, præferencer og budget.

VIGTIGT: Svar altid kun på dansk.

Hovedansvarsområder:
- Still reflekterende spørgsmål om kundens brugsmønstre, prioriteringer og budget
- Anbefal smartphones baseret på specifikke kriterier som kamerakvalitet, batterilevetid, ydeevne, skærmstørrelse, etc.
- Forklar tekniske funktioner i enkle, forståelige termer
- Sammenlign forskellige muligheder og deres for-/ulemper
- Vær kendt til nuværende smartphone-modeller og deres funktioner
- Vær venlig, tålmodig og virkelig hjælpsom

Behold altid en professionel men varm tone. Fokuser først på at forstå kundens behov, derefter giv personlige anbefalinger.`,
      'ta': `நீங்கள் ஒரு பிரீமியம் எலக்ட்ரானிக்ஸ் கடையில் ஸ்மார்ட்போன் விற்பனை நிபுணர். உங்கள் பங்கு என்பது வாடிக்கையாளர்களின் தேவைகள், விருப்பங்கள் மற்றும் பட்ஜெட் ஆகியவற்றின் அடிப்படையில் சரியான ஸ்மார்ட்போனைக் கண்டுபிடிப்பதில் உதவுவதாகும்.

முக்கியமானது: எப்போதும் தமிழில் மட்டும் பதிலளிக்கவும்.

முக்கிய பொறுப்புகள்:
- வாடிக்கையாளரின் பயன்பாட்டு வடிவங்கள், முன்னுரிமைகள் மற்றும் பட்ஜெட் பற்றி சிந்தனையுள்ள கேள்விகளைக் கேள்வி
- கேமரா தரம், பேட்டரி வாழ்க்கை, செயல்திறன், திரை அளவு போன்ற குறிப்பிட்ட அளவுகோல்களின் அடிப்படையில் ஸ்மார்ட்போன்களை பரிந்துரைக்கவும்
- தொழில்நுட்ப அம்சங்களை எளிய, புரிந்துகொள்ளக்கூடிய சொற்களில் விளக்கவும்
- வெவ்வேறு விருப்பங்கள் மற்றும் அவற்றின் நன்மைகள்/குறைகளை ஒப்பிடுங்கள்
- தற்போதைய ஸ்மார்ட்போன் மாடல்கள் மற்றும் அவற்றின் அம்சங்களைப் பற்றி அறிந்திருக்கவும்
- நட்பு, பொறுமை மற்றும் உண்மையில் உதவிகரமாக இருங்கள்

எப்போதும் தொழில்முறை ஆனால் சூடான தொனியை பராமரிக்கவும். முதலில் வாடிக்கையாளரின் தேவைகளைப் புரிந்துகொள்வதில் கவனம் செலுத்துங்கள், பின்னர் தனிப்பட்ட பரிந்துரைகளை வழங்குங்கள்.`,
      'uk': `Ви є спеціалістом з продажу смартфонів у преміум магазині електроніки. Ваша роль - допомагати клієнтам знайти ідеальний смартфон на основі їхніх потреб, уподобань та бюджету.

ВАЖЛИВО: Завжди відповідайте тільки українською мовою.

Основні обов'язки:
- Задавайте продумані питання про моделі використання, пріоритети та бюджет клієнта
- Рекомендуйте смартфони на основі конкретних критеріїв, таких як якість камери, час роботи батареї, продуктивність, розмір екрану тощо
- Пояснюйте технічні функції простими, зрозумілими термінами
- Порівнюйте різні варіанти та їх переваги/недоліки
- Буйте обізнані з поточними моделями смартфонів та їх характеристиками
- Буйте дружелюбними, терплячими та справді корисними

Завжди зберігайте професійний, але теплий тон. Спочатку зосередьтеся на розумінні потреб клієнта, потім надайте персоналізовані рекомендації.`,
      'ru': `Вы специалист по продажам смартфонов в премиальном магазине электроники. Ваша роль - помогать клиентам найти идеальный смартфон на основе их потреб, предпочтений и бюджета.

ВАЖНО: Всегда отвечайте только на русском языке.

Основные обязанности:
- Задавайте продуманные вопросы о моделях использования, приоритетах и бюджете клиента
- Рекомендуйте смартфоны на основе конкретных критериев, таких как качество камеры, время работы батареи, производительность, размер экрана и т.д.
- Объясняйте технические функции простыми, понятными терминами
- Сравнивайте различные варианты и их преимущества/недостатки
- Будьте осведомлены о текущих моделях смартфонов и их характеристиках
- Будьте дружелюбными, терпеливыми и действительно полезными

Всегда сохраняйте профессиональный, но теплый тон. Сначала сосредоточьтесь на понимании потребностей клиента, затем дайте персонализированные рекомендации.`,
      'hu': `Ön egy prémium elektronikai üzlet okostelefon-értékesítési szakértője. Az Ön szerepe az ügyfelek segítése a tökéletes okostelefon megtalálásában az igényeik, preferenciáik és költségvetésük alapján.

FONTOS: Mindig csak magyarul válaszoljon.

Főbb felelősségek:
- Tegyen fel gondolkodó kérdéseket az ügyfél használati mintáiról, prioritásairól és költségvetéséről
- Javasoljon okostelefonokat konkrét kritériumok alapján, mint például a kamera minősége, az akkumulátor élettartama, a teljesítmény, a képernyő mérete stb.
- Magyarázza el a technikai funkciókat egyszerű, érthető kifejezésekkel
- Hasonlítsa össze a különböző lehetőségeket és azok előnyeit/hátrányait
- Legyen jártas a jelenlegi okostelefon-modellekben és azok jellemzőiben
- Legyen barátságos, türelmes és valóban hasznos

Mindig tartsa fenn a professzionális, de meleg hangnemet. Először összpontosítson az ügyfél igényeinek megértésére, majd adjon személyre szabott ajánlásokat.`,
      'no': `Du er en smartphone-salgsspesialist i en premium elektronikkbutikk. Din rolle er å hjelpe kunder med å finne den perfekte smarttelefonen basert på deres behov, preferanser og budsjett.

VIKTIG: Svar alltid kun på norsk.

Hovedansvarsområder:
- Still reflekterende spørsmål om kundens bruksmønstre, prioriteringer og budsjett
- Anbefal smarttelefoner basert på spesifikke kriterier som kamerakvalitet, batterilevetid, ytelse, skjermstørrelse, etc.
- Forklar tekniske funksjoner i enkle, forståelige termer
- Sammenlign forskjellige alternativer og deres for-/ulemper
- Vær kunnskapsrik om nåværende smarttelefon-modeller og deres funksjoner
- Vær vennlig, tålmodig og virkelig hjelpsom

Behold alltid en profesjonell men varm tone. Fokuser først på å forstå kundens behov, deretter gi personlige anbefalinger.`,
      'vi': `Bạn là chuyên gia bán hàng smartphone tại một cửa hàng điện tử cao cấp. Vai trò của bạn là giúp khách hàng tìm chiếc smartphone hoàn hảo dựa trên nhu cầu, sở thích và ngân sách của họ.

QUAN TRỌNG: Luôn trả lời chỉ bằng tiếng Việt.

Trách nhiệm chính:
- Đặt những câu hỏi có suy nghĩ về mô hình sử dụng, ưu tiên và ngân sách của khách hàng
- Đề xuất smartphone dựa trên các tiêu chí cụ thể như chất lượng camera, thời lượng pin, hiệu suất, kích thước màn hình, v.v.
- Giải thích các tính năng kỹ thuật bằng các thuật ngữ đơn giản, dễ hiểu
- So sánh các lựa chọn khác nhau và ưu/nhược điểm của chúng
- Hiểu biết về các mẫu smartphone hiện tại và đặc điểm của chúng
- Thân thiện, kiên nhẫn và thực sự hữu ích

Luôn duy trì giọng điệu chuyên nghiệp nhưng ấm áp. Tập trung trước tiên vào việc hiểu nhu cầu của khách hàng, sau đó đưa ra các đề xuất được cá nhân hóa.`
    };

    return prompts[language] || prompts['en'];
  }

  private getInitialMessage(language: string): string {
    const messages: Record<string, string> = {
      'en': "Hello! I'm your smartphone specialist. I'd love to help you find the perfect phone. What brings you in today?",
      'es': "¡Hola! Soy tu especialista en smartphones. Me encantaría ayudarte a encontrar el teléfono perfecto. ¿Qué te trae hoy?",
      'fr': "Bonjour ! Je suis votre spécialiste en smartphones. J'aimerais vous aider à trouver le téléphone parfait. Qu'est-ce qui vous amène aujourd'hui ?",
      'de': "Hallo! Ich bin Ihr Smartphone-Spezialist. Ich würde Ihnen gerne dabei helfen, das perfekte Telefon zu finden. Was führt Sie heute zu uns?",
      'zh': "您好！我是您的智能手机专家。我很乐意帮助您找到完美的手机。今天是什么风把您吹来了？",
      'ja': "こんにちは！私はあなたのスマートフォン専門家です。完璧な携帯電話を見つけるお手伝いをさせていただきます。今日は何でお越しですか？",
      'hi': "नमस्ते! मैं आपका स्मार्टफोन विशेषज्ञ हूं। मैं आपको सही फोन खोजने में मदद करना चाहूंगा। आज आप क्या लेकर आए हैं?",
      'ko': "안녕하세요! 저는 스마트폰 전문가입니다. 완벽한 휴대폰을 찾는 데 도움을 드리고 싶습니다. 오늘 무엇을 도와드릴까요?",
      'pt': "Olá! Sou seu especialista em smartphones. Adoraria ajudá-lo a encontrar o telefone perfeito. O que o traz hoje?",
      'it': "Ciao! Sono il tuo specialista di smartphone. Mi piacerebbe aiutarti a trovare il telefono perfetto. Cosa ti porta qui oggi?",
      'id': "Halo! Saya adalah spesialis smartphone Anda. Saya ingin membantu Anda menemukan ponsel yang sempurna. Apa yang membawa Anda ke sini hari ini?",
      'nl': "Hallo! Ik ben uw smartphone-specialist. Ik zou u graag willen helpen de perfecte telefoon te vinden. Wat brengt u vandaag hier?",
      'tr': "Merhaba! Ben sizin akıllı telefon uzmanınızım. Mükemmel telefonu bulmanıza yardım etmek isterim. Bugün sizi buraya ne getirdi?",
      'fil': "Kumusta! Ako ang inyong smartphone specialist. Gusto kong tulungan kayo na makahanap ng perpektong phone. Ano ang nagdala sa inyo dito ngayon?",
      'pl': "Cześć! Jestem twoim specjalistą od smartfonów. Chciałbym pomóc Ci znaleźć idealny telefon. Co sprowadza Cię tutaj dzisiaj?",
      'sv': "Hej! Jag är din smartphone-specialist. Jag skulle gärna hjälpa dig hitta den perfekta telefonen. Vad för dig hit idag?",
      'bg': "Здравейте! Аз съм вашият специалист по смартфони. Бих искал да ви помогна да намерите перфектния телефон. Какво ви доведе тук днес?",
      'ro': "Bună! Sunt specialistul tău în smartphone-uri. Mi-ar plăcea să te ajut să găsești telefonul perfect. Ce te aduce aici astăzi?",
      'ar': "مرحباً! أنا متخصص الهواتف الذكية الخاص بك. أود مساعدتك في العثور على الهاتف المثالي. ما الذي أتى بك هنا اليوم؟",
      'cs': "Ahoj! Jsem váš specialista na smartphony. Rád bych vám pomohl najít perfektní telefon. Co vás sem dnes přivádí?",
      'el': "Γεια σας! Είμαι ο ειδικός σας σε smartphones. Θα ήθελα να σας βοηθήσω να βρείτε το τέλειο τηλέφωνο. Τι σας φέρνει εδώ σήμερα;",
      'fi': "Hei! Olen smartphone-asiantuntijasi. Haluaisin auttaa sinua löytämään täydellisen puhelimen. Mikä tuo sinut tänne tänään?",
      'hr': "Pozdrav! Ja sam vaš stručnjak za pametne telefone. Volio bih vam pomoći pronaći savršen telefon. Što vas danas dovodi ovdje?",
      'ms': "Hai! Saya adalah pakar smartphone anda. Saya ingin membantu anda mencari telefon yang sempurna. Apa yang membawa anda ke sini hari ini?",
      'sk': "Ahoj! Som váš špecialista na smartfóny. Rád by som vám pomohol nájsť perfektný telefón. Čo vás sem dnes privádza?",
      'da': "Hej! Jeg er din smartphone-specialist. Jeg vil gerne hjælpe dig med at finde den perfekte telefon. Hvad bringer dig her i dag?",
      'ta': "வணக்கம்! நான் உங்கள் ஸ்மார்ட்போன் நிபுணர். சரியான தொலைபேசியைக் கண்டுபிடிப்பதில் உங்களுக்கு உதவ விரும்புகிறேன். இன்று உங்களை இங்கே என்ன கொண்டு வந்தது?",
      'uk': "Привіт! Я ваш спеціаліст зі смартфонів. Я хотів би допомогти вам знайти ідеальний телефон. Що привело вас сюди сьогодні?",
      'ru': "Привет! Я ваш специалист по смартфонам. Я хотел бы помочь вам найти идеальный телефон. Что привело вас сюда сегодня?",
      'hu': "Üdvözlöm! Én vagyok az Ön okostelefon-szakértője. Szeretnék segíteni megtalálni a tökéletes telefont. Mi hozza ide ma?",
      'no': "Hei! Jeg er din smartphone-spesialist. Jeg vil gjerne hjelpe deg med å finne den perfekte telefonen. Hva bringer deg hit i dag?",
      'vi': "Xin chào! Tôi là chuyên gia smartphone của bạn. Tôi muốn giúp bạn tìm chiếc điện thoại hoàn hảo. Điều gì đưa bạn đến đây hôm nay?"
    };

    return messages[language] || messages['en'];
  }

  private getFallbackResponse(userMessage: string, language: string): ConversationResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Smartphone sales focused responses with better language detection
    const responses: Record<string, string[]> = {
      'en': [
        "Great question! To help you find the perfect smartphone, I'd like to know more about your needs. What's most important to you - camera quality, battery life, performance, or screen size?",
        "That's helpful information! Based on what you've shared, I'd recommend considering phones with good camera systems. What's your budget range?",
        "Excellent choice! For that price range, I'd suggest looking at the latest models from Samsung, Apple, or Google. Do you prefer Android or iOS?",
        "Perfect! Let me ask you a few more questions to narrow down the best options. How do you primarily use your phone - for photography, gaming, work, or general use?",
        "Thanks for sharing that! For your usage patterns, I'd recommend focusing on phones with strong battery life and good performance. What screen size do you prefer?"
      ],
      'es': [
        "¡Excelente pregunta! Para ayudarte a encontrar el smartphone perfecto, me gustaría saber más sobre tus necesidades. ¿Qué es más importante para ti: calidad de cámara, duración de batería, rendimiento o tamaño de pantalla?",
        "¡Esa información es muy útil! Basándome en lo que has compartido, te recomendaría considerar teléfonos con buenos sistemas de cámara. ¿Cuál es tu rango de presupuesto?",
        "¡Excelente elección! Para ese rango de precio, te sugiero mirar los últimos modelos de Samsung, Apple o Google. ¿Prefieres Android o iOS?",
        "¡Perfecto! Déjame hacerte algunas preguntas más para reducir las mejores opciones. ¿Cómo usas principalmente tu teléfono: para fotografía, juegos, trabajo o uso general?",
        "¡Gracias por compartir eso! Para tus patrones de uso, te recomendaría enfocarte en teléfonos con buena duración de batería y rendimiento. ¿Qué tamaño de pantalla prefieres?"
      ],
      'fr': [
        "Excellente question ! Pour vous aider à trouver le smartphone parfait, j'aimerais en savoir plus sur vos besoins. Qu'est-ce qui est le plus important pour vous : la qualité de l'appareil photo, l'autonomie, les performances ou la taille d'écran ?",
        "Ces informations sont très utiles ! Basé sur ce que vous avez partagé, je recommanderais de considérer des téléphones avec de bons systèmes d'appareil photo. Quel est votre budget ?",
        "Excellent choix ! Pour cette fourchette de prix, je suggérerais de regarder les derniers modèles de Samsung, Apple ou Google. Préférez-vous Android ou iOS ?",
        "Parfait ! Laissez-moi vous poser quelques questions de plus pour affiner les meilleures options. Comment utilisez-vous principalement votre téléphone : pour la photographie, les jeux, le travail ou l'usage général ?",
        "Merci de partager cela ! Pour vos habitudes d'utilisation, je recommanderais de vous concentrer sur des téléphones avec une bonne autonomie et de bonnes performances. Quelle taille d'écran préférez-vous ?"
      ],
      'de': [
        "Ausgezeichnete Frage! Um Ihnen zu helfen, das perfekte Smartphone zu finden, würde ich gerne mehr über Ihre Bedürfnisse erfahren. Was ist Ihnen am wichtigsten - Kameragüte, Akkulaufzeit, Leistung oder Bildschirmgröße?",
        "Das sind sehr nützliche Informationen! Basierend auf dem, was Sie geteilt haben, würde ich Telefone mit guten Kamerasystemen empfehlen. Was ist Ihr Budget?",
        "Ausgezeichnete Wahl! Für diesen Preissegment würde ich die neuesten Modelle von Samsung, Apple oder Google vorschlagen. Bevorzugen Sie Android oder iOS?",
        "Perfekt! Lassen Sie mich Ihnen noch ein paar Fragen stellen, um die besten Optionen einzugrenzen. Wie nutzen Sie Ihr Telefon hauptsächlich - für Fotografie, Spiele, Arbeit oder allgemeine Nutzung?",
        "Vielen Dank für das Teilen! Für Ihre Nutzungsmuster würde ich Telefone mit guter Akkulaufzeit und Leistung empfehlen. Welche Bildschirmgröße bevorzugen Sie?"
      ],
      'zh': [
        "很好的问题！为了帮您找到完美的智能手机，我想了解更多关于您需求的信息。对您来说最重要的是什么 - 相机质量、电池续航、性能还是屏幕尺寸？",
        "这些信息很有用！根据您分享的内容，我建议您考虑具有良好相机系统的手机。您的预算范围是多少？",
        "很好的选择！对于这个价格范围，我建议您看看三星、苹果或谷歌的最新机型。您更喜欢安卓还是iOS？",
        "完美！让我再问您几个问题来缩小最佳选择范围。您主要如何使用手机 - 摄影、游戏、工作还是一般使用？",
        "感谢分享！根据您的使用模式，我建议您关注具有良好电池续航和性能的手机。您喜欢什么屏幕尺寸？"
      ],
      'ja': [
        "素晴らしい質問です！完璧なスマートフォンを見つけるお手伝いをするために、あなたのニーズについてもっと知りたいと思います。あなたにとって最も重要なのは何ですか - カメラ品質、バッテリー寿命、性能、それとも画面サイズですか？",
        "その情報はとても役立ちます！あなたが共有してくれたことに基づいて、良いカメラシステムを持つ電話を検討することをお勧めします。あなたの予算範囲は何ですか？",
        "素晴らしい選択です！その価格帯では、サムスン、アップル、またはグーグルの最新モデルを見つけることをお勧めします。AndroidとiOSのどちらがお好みですか？",
        "完璧です！最高のオプションを絞り込むために、もう少し質問させてください。あなたは主にどのように電話を使用しますか - 写真撮影、ゲーム、仕事、それとも一般的な使用ですか？",
        "それを共有していただきありがとうございます！あなたの使用パターンでは、良いバッテリー寿命と性能を持つ電話に焦点を当てることをお勧めします。どの画面サイズがお好みですか？"
      ],
      'hi': [
        "बहुत अच्छा सवाल! आपको सही स्मार्टफोन खोजने में मदद करने के लिए, मैं आपकी जरूरतों के बारे में और जानना चाहूंगा। आपके लिए सबसे महत्वपूर्ण क्या है - कैमरा गुणवत्ता, बैटरी लाइफ, प्रदर्शन, या स्क्रीन साइज?",
        "यह जानकारी बहुत उपयोगी है! आपने जो साझा किया है, उसके आधार पर मैं अच्छे कैमरा सिस्टम वाले फोन की सिफारिश करूंगा। आपका बजट रेंज क्या है?",
        "बहुत अच्छा चुनाव! उस कीमत रेंज के लिए, मैं Samsung, Apple, या Google के नवीनतम मॉडल देखने की सिफारिश करूंगा। आप Android या iOS पसंद करते हैं?",
        "बिल्कुल सही! सर्वोत्तम विकल्पों को कम करने के लिए मुझे कुछ और प्रश्न पूछने दें। आप मुख्य रूप से अपने फोन का उपयोग कैसे करते हैं - फोटोग्राफी, गेमिंग, काम, या सामान्य उपयोग के लिए?",
        "यह साझा करने के लिए धन्यवाद! आपके उपयोग पैटर्न के लिए, मैं मजबूत बैटरी लाइफ और अच्छे प्रदर्शन वाले फोन पर ध्यान केंद्रित करने की सिफारिश करूंगा। आप किस स्क्रीन साइज को पसंद करते हैं?"
      ],
      'ko': [
        "정말 좋은 질문이네요! 완벽한 스마트폰을 찾는 데 도움을 드리기 위해, 귀하의 필요에 대해 더 알고 싶습니다. 귀하에게 가장 중요한 것은 무엇인가요 - 카메라 품질, 배터리 수명, 성능, 아니면 화면 크기인가요?",
        "그 정보는 매우 유용합니다! 귀하가 공유해주신 내용을 바탕으로, 좋은 카메라 시스템을 가진 휴대폰을 고려해보시는 것을 추천합니다. 귀하의 예산 범위는 어떻게 되나요?",
        "훌륭한 선택입니다! 그 가격대에서는 Samsung, Apple, 또는 Google의 최신 모델을 살펴보시는 것을 제안합니다. Android와 iOS 중 어느 것을 선호하시나요?",
        "완벽합니다! 최고의 옵션을 좁히기 위해 몇 가지 질문을 더 드리겠습니다. 귀하는 주로 휴대폰을 어떻게 사용하시나요 - 사진 촬영, 게임, 업무, 아니면 일반적인 사용을 위해?",
        "그것을 공유해주셔서 감사합니다! 귀하의 사용 패턴에 대해, 강력한 배터리 수명과 좋은 성능을 가진 휴대폰에 집중하는 것을 추천합니다. 어떤 화면 크기를 선호하시나요?"
      ],
      'pt': [
        "Excelente pergunta! Para ajudá-lo a encontrar o smartphone perfeito, gostaria de saber mais sobre suas necessidades. O que é mais importante para você - qualidade da câmera, duração da bateria, desempenho ou tamanho da tela?",
        "Essas informações são muito úteis! Com base no que você compartilhou, eu recomendaria considerar telefones com bons sistemas de câmera. Qual é sua faixa de orçamento?",
        "Excelente escolha! Para essa faixa de preço, eu sugeriria olhar os modelos mais recentes da Samsung, Apple ou Google. Você prefere Android ou iOS?",
        "Perfeito! Deixe-me fazer algumas perguntas a mais para refinar as melhores opções. Como você usa principalmente seu telefone - para fotografia, jogos, trabalho ou uso geral?",
        "Obrigado por compartilhar isso! Para seus padrões de uso, eu recomendaria focar em telefones com boa duração de bateria e bom desempenho. Que tamanho de tela você prefere?"
      ],
      'it': [
        "Ottima domanda! Per aiutarti a trovare lo smartphone perfetto, vorrei sapere di più sui tuoi bisogni. Cosa è più importante per te - qualità della fotocamera, durata della batteria, prestazioni o dimensione dello schermo?",
        "Queste informazioni sono molto utili! Basandomi su quello che hai condiviso, raccomanderei di considerare telefoni con buoni sistemi fotografici. Qual è la tua fascia di prezzo?",
        "Ottima scelta! Per quella fascia di prezzo, suggerirei di guardare i modelli più recenti di Samsung, Apple o Google. Preferisci Android o iOS?",
        "Perfetto! Fammi fare alcune domande in più per affinare le migliori opzioni. Come usi principalmente il tuo telefono - per fotografia, giochi, lavoro o uso generale?",
        "Grazie per aver condiviso questo! Per i tuoi modelli di utilizzo, raccomanderei di concentrarsi su telefoni con buona durata della batteria e buone prestazioni. Che dimensione dello schermo preferisci?"
      ],
      'id': [
        "Pertanyaan yang sangat bagus! Untuk membantu Anda menemukan smartphone yang sempurna, saya ingin tahu lebih banyak tentang kebutuhan Anda. Apa yang paling penting bagi Anda - kualitas kamera, daya tahan baterai, performa, atau ukuran layar?",
        "Informasi itu sangat berguna! Berdasarkan apa yang Anda bagikan, saya akan merekomendasikan untuk mempertimbangkan ponsel dengan sistem kamera yang baik. Berapa kisaran anggaran Anda?",
        "Pilihan yang sangat bagus! Untuk kisaran harga tersebut, saya akan menyarankan untuk melihat model terbaru dari Samsung, Apple, atau Google. Apakah Anda lebih suka Android atau iOS?",
        "Sempurna! Biarkan saya mengajukan beberapa pertanyaan lagi untuk menyempitkan opsi terbaik. Bagaimana Anda terutama menggunakan ponsel Anda - untuk fotografi, game, kerja, atau penggunaan umum?",
        "Terima kasih telah berbagi itu! Untuk pola penggunaan Anda, saya akan merekomendasikan untuk fokus pada ponsel dengan daya tahan baterai yang kuat dan performa yang baik. Ukuran layar apa yang Anda sukai?"
      ],
      'nl': [
        "Uitstekende vraag! Om u te helpen de perfecte smartphone te vinden, zou ik graag meer willen weten over uw behoeften. Wat is het belangrijkst voor u - camerakwaliteit, batterijduur, prestaties of schermgrootte?",
        "Die informatie is zeer nuttig! Op basis van wat u heeft gedeeld, zou ik aanraden om telefoons met goede camerasystemen te overwegen. Wat is uw budgetbereik?",
        "Uitstekende keuze! Voor dat prijsbereik zou ik voorstellen om naar de nieuwste modellen van Samsung, Apple of Google te kijken. Heeft u voorkeur voor Android of iOS?",
        "Perfect! Laat me nog een paar vragen stellen om de beste opties te verfijnen. Hoe gebruikt u voornamelijk uw telefoon - voor fotografie, gaming, werk of algemeen gebruik?",
        "Bedankt voor het delen daarvan! Voor uw gebruikspatronen zou ik aanraden om te focussen op telefoons met sterke batterijduur en goede prestaties. Welke schermgrootte heeft uw voorkeur?"
      ],
      'tr': [
        "Harika soru! Mükemmel akıllı telefonu bulmanıza yardım etmek için, ihtiyaçlarınız hakkında daha fazla bilgi almak isterim. Sizin için en önemli olan nedir - kamera kalitesi, pil ömrü, performans veya ekran boyutu?",
        "Bu bilgiler çok faydalı! Paylaştığınız şeylere dayanarak, iyi kamera sistemlerine sahip telefonları düşünmenizi öneririm. Bütçe aralığınız nedir?",
        "Harika seçim! O fiyat aralığı için, Samsung, Apple veya Google'ın en son modellerine bakmanızı öneririm. Android mi yoksa iOS mu tercih edersiniz?",
        "Mükemmel! En iyi seçenekleri daraltmak için birkaç soru daha sormama izin verin. Telefonunuzu nasıl kullanıyorsunuz - fotoğrafçılık, oyun, iş veya genel kullanım için mi?",
        "Bunu paylaştığınız için teşekkürler! Kullanım modelleriniz için, güçlü pil ömrü ve iyi performansa sahip telefonlara odaklanmanızı öneririm. Hangi ekran boyutunu tercih edersiniz?"
      ],
      'fil': [
        "Napakagandang tanong! Para matulungan kang makahanap ng perpektong smartphone, gusto kong malaman ang higit pa tungkol sa iyong mga pangangailangan. Ano ang pinakamahalaga para sa iyo - kalidad ng camera, battery life, performance, o screen size?",
        "Napakauseful ng impormasyong iyon! Batay sa iyong naibahagi, ire-rekomenda kong isaalang-alang ang mga phone na may magandang camera system. Ano ang iyong budget range?",
        "Napakagandang pagpili! Para sa price range na iyon, ire-rekomenda kong tingnan ang mga pinakabagong model ng Samsung, Apple, o Google. Mas gusto mo ba ang Android o iOS?",
        "Perpekto! Hayaan mo akong magtanong ng ilang tanong pa para ma-refine ang mga pinakamagandang option. Paano mo ginagamit ang iyong phone - para sa photography, gaming, work, o general use?",
        "Salamat sa pagbabahagi nito! Para sa iyong usage patterns, ire-rekomenda kong mag-focus sa mga phone na may malakas na battery life at magandang performance. Anong screen size ang gusto mo?"
      ],
      'pl': [
        "Świetne pytanie! Aby pomóc Ci znaleźć idealny smartphone, chciałbym dowiedzieć się więcej o Twoich potrzebach. Co jest dla Ciebie najważniejsze - jakość aparatu, czas pracy baterii, wydajność czy rozmiar ekranu?",
        "Te informacje są bardzo przydatne! Na podstawie tego, co podzieliłeś się, poleciłbym rozważenie telefonów z dobrymi systemami aparatów. Jaki jest Twój zakres budżetu?",
        "Świetny wybór! W tym zakresie cenowym poleciłbym spojrzenie na najnowsze modele Samsung, Apple lub Google. Preferujesz Android czy iOS?",
        "Doskonale! Pozwól mi zadać jeszcze kilka pytań, aby doprecyzować najlepsze opcje. Jak głównie używasz swojego telefonu - do fotografii, gier, pracy czy ogólnego użytku?",
        "Dziękuję za podzielenie się tym! Dla Twoich wzorców użytkowania poleciłbym skupienie się na telefonach z silnym czasem pracy baterii i dobrą wydajnością. Jaki rozmiar ekranu preferujesz?"
      ],
      'sv': [
        "Utmärkt fråga! För att hjälpa dig hitta den perfekta smartphonen skulle jag vilja veta mer om dina behov. Vad är viktigast för dig - kamerakvalitet, batteritid, prestanda eller skärmstorlek?",
        "Den informationen är mycket användbar! Baserat på vad du har delat skulle jag rekommendera att överväga telefoner med bra kamerasystem. Vad är din budgetintervall?",
        "Utmärkt val! För det prisintervallet skulle jag föreslå att titta på de senaste modellerna från Samsung, Apple eller Google. Föredrar du Android eller iOS?",
        "Perfekt! Låt mig ställa några fler frågor för att förfina de bästa alternativen. Hur använder du främst din telefon - för fotografi, spel, arbete eller allmänt bruk?",
        "Tack för att du delade det! För dina användningsmönster skulle jag rekommendera att fokusera på telefoner med stark batteritid och bra prestanda. Vilken skärmstorlek föredrar du?"
      ],
      'bg': [
        "Отличен въпрос! За да ви помогна да намерите перфектния смартфон, бих искал да знам повече за вашите нужди. Какво е най-важно за вас - качество на камерата, живот на батерията, производителност или размер на екрана?",
        "Тази информация е много полезна! Въз основа на това, което споделихте, бих препоръчал да разгледате телефони с добри камерни системи. Какъв е вашият бюджетен диапазон?",
        "Отличен избор! За този ценови диапазон бих предложил да разгледате най-новите модели на Samsung, Apple или Google. Предпочитате ли Android или iOS?",
        "Перфектно! Нека задам още няколко въпроса, за да прецизирам най-добрите опции. Как използвате основно телефона си - за фотография, игри, работа или общо ползване?",
        "Благодаря, че споделихте това! За вашите модели на използване бих препоръчал да се фокусирате върху телефони с силен живот на батерията и добра производителност. Какъв размер на екрана предпочитате?"
      ],
      'ro': [
        "Excelentă întrebare! Pentru a vă ajuta să găsiți smartphone-ul perfect, aș vrea să știu mai multe despre nevoile dvs. Ce este cel mai important pentru dvs. - calitatea camerei, durata bateriei, performanța sau dimensiunea ecranului?",
        "Această informație este foarte utilă! Pe baza a ceea ce ați împărtășit, aș recomanda să luați în considerare telefoane cu sisteme de cameră bune. Care este intervalul dvs. de buget?",
        "Alegere excelentă! Pentru acel interval de preț, aș sugera să priviți modelele cele mai noi de la Samsung, Apple sau Google. Preferați Android sau iOS?",
        "Perfect! Permiteți-mi să pun câteva întrebări suplimentare pentru a rafina cele mai bune opțiuni. Cum folosiți în principal telefonul dvs. - pentru fotografie, jocuri, muncă sau utilizare generală?",
        "Vă mulțumesc că ați împărtășit asta! Pentru modelele dvs. de utilizare, aș recomanda să vă concentrați pe telefoane cu o durată puternică a bateriei și performanțe bune. Ce dimensiune de ecran preferați?"
      ],
      'ar': [
        "سؤال ممتاز! لمساعدتك في العثور على الهاتف الذكي المثالي، أود معرفة المزيد عن احتياجاتك. ما هو الأهم بالنسبة لك - جودة الكاميرا، عمر البطارية، الأداء أم حجم الشاشة؟",
        "هذه المعلومات مفيدة جداً! بناءً على ما شاركته، أوصي بالنظر في الهواتف التي تحتوي على أنظمة كاميرا جيدة. ما هو نطاق ميزانيتك؟",
        "اختيار ممتاز! لهذا النطاق السعري، أقترح النظر في أحدث طرازات Samsung أو Apple أو Google. هل تفضل Android أم iOS؟",
        "مثالي! دعني أطرح بعض الأسئلة الإضافية لتحسين أفضل الخيارات. كيف تستخدم هاتفك بشكل أساسي - للتصوير الفوتوغرافي، والألعاب، والعمل أم الاستخدام العام؟",
        "شكراً لك على مشاركة ذلك! لأنماط استخدامك، أوصي بالتركيز على الهواتف التي تتمتع بعمر بطارية قوي وأداء جيد. ما حجم الشاشة الذي تفضله؟"
      ],
      'cs': [
        "Výborná otázka! Abych vám pomohl najít perfektní smartphone, rád bych věděl více o vašich potřebách. Co je pro vás nejdůležitější - kvalita kamery, výdrž baterie, výkon nebo velikost obrazovky?",
        "Tyto informace jsou velmi užitečné! Na základě toho, co jste sdíleli, doporučil bych zvážit telefony s dobrými kamerovými systémy. Jaký je váš rozpočtový rozsah?",
        "Výborná volba! Pro tento cenový rozsah bych doporučil podívat se na nejnovější modely od Samsung, Apple nebo Google. Preferujete Android nebo iOS?",
        "Perfektní! Dovolte mi položit ještě několik otázek, abych upřesnil nejlepší možnosti. Jak hlavně používáte svůj telefon - pro fotografování, hry, práci nebo obecné použití?",
        "Děkuji za sdílení! Pro vaše vzorce používání bych doporučil zaměřit se na telefony se silnou výdrží baterie a dobrým výkonem. Jakou velikost obrazovky preferujete?"
      ],
      'el': [
        "Εξαιρετική ερώτηση! Για να σας βοηθήσω να βρείτε το τέλειο smartphone, θα ήθελα να μάθω περισσότερα για τις ανάγκες σας. Τι είναι πιο σημαντικό για εσάς - ποιότητα κάμερας, διάρκεια μπαταρίας, απόδοση ή μέγεθος οθόνης;",
        "Αυτές οι πληροφορίες είναι πολύ χρήσιμες! Με βάση αυτό που μοιραστήκατε, θα συνιστούσα να εξετάσετε τηλέφωνα με καλά συστήματα κάμερας. Ποιο είναι το εύρος προϋπολογισμού σας;",
        "Εξαιρετική επιλογή! Για αυτό το εύρος τιμών, θα πρότεινα να δείτε τα πιο πρόσφατα μοντέλα από Samsung, Apple ή Google. Προτιμάτε Android ή iOS;",
        "Τέλεια! Επιτρέψτε μου να κάνω μερικές ακόμα ερωτήσεις για να βελτιώσω τις καλύτερες επιλογές. Πώς χρησιμοποιείτε κυρίως το τηλέφωνό σας - για φωτογραφία, παιχνίδια, εργασία ή γενική χρήση;",
        "Ευχαριστώ που το μοιραστήκατε! Για τα μοτίβα χρήσης σας, θα συνιστούσα να εστιάσετε σε τηλέφωνα με ισχυρή διάρκεια μπαταρίας και καλή απόδοση. Ποιο μέγεθος οθόνης προτιμάτε;"
      ],
      'fi': [
        "Erinomainen kysymys! Auttaakseni sinua löytämään täydellisen älypuhelimen, haluaisin tietää enemmän tarpeistasi. Mikä on sinulle tärkeintä - kameran laatu, akun kesto, suorituskyky vai näytön koko?",
        "Tämä tieto on erittäin hyödyllistä! Perustuen siihen, mitä olet jakanut, suosittelisin harkitsemaan puhelimia, joissa on hyviä kamerajärjestelmiä. Mikä on budjettisi?",
        "Erinomainen valinta! Tuohon hintaluokkaan suosittelisin katsomaan Samsungin, Applen tai Googlen uusimpia malleja. Suositteko Androidia vai iOS:ää?",
        "Täydellinen! Antakaa minun esittää vielä muutamia kysymyksiä parantaakseni parhaita vaihtoehtoja. Miten käytät puhelintasi pääasiassa - valokuvaukseen, pelaamiseen, työhön vai yleiseen käyttöön?",
        "Kiitos, että jaoit sen! Käyttötapojesi vuoksi suosittelisin keskittymään puhelimiin, joissa on vahva akun kesto ja hyvä suorituskyky. Minkä kokoista näyttöä suositte?"
      ],
      'hr': [
        "Odlično pitanje! Da vam pomognem pronaći savršen smartphone, želio bih znati više o vašim potrebama. Što vam je najvažnije - kvaliteta kamere, trajanje baterije, performanse ili veličina ekrana?",
        "Te informacije su vrlo korisne! Na temelju onoga što ste podijelili, preporučio bih razmatranje telefona s dobrim kamerama. Koji je vaš proračunski raspon?",
        "Odličan izbor! Za taj cjenovni raspon predložio bih da pogledate najnovije modele Samsung, Apple ili Google. Preferirate li Android ili iOS?",
        "Savršeno! Dopustite mi da postavim još nekoliko pitanja kako bih precizirao najbolje opcije. Kako uglavnom koristite svoj telefon - za fotografiju, igre, posao ili opću upotrebu?",
        "Hvala vam što ste to podijelili! Za vaše obrasce korištenja preporučio bih da se usredotočite na telefone s jakim trajanjem baterije i dobrim performansama. Koju veličinu ekrana preferirate?"
      ],
      'ms': [
        "Soalan yang sangat baik! Untuk membantu anda mencari smartphone yang sempurna, saya ingin tahu lebih lanjut tentang keperluan anda. Apa yang paling penting untuk anda - kualiti kamera, hayat bateri, prestasi, atau saiz skrin?",
        "Maklumat itu sangat berguna! Berdasarkan apa yang anda kongsi, saya akan mengesyorkan untuk mempertimbangkan telefon dengan sistem kamera yang baik. Apakah julat bajet anda?",
        "Pilihan yang sangat baik! Untuk julat harga itu, saya akan mencadangkan untuk melihat model terbaru dari Samsung, Apple, atau Google. Adakah anda lebih suka Android atau iOS?",
        "Sempurna! Biarkan saya mengemukakan beberapa soalan lagi untuk memperhalusi pilihan terbaik. Bagaimana anda terutamanya menggunakan telefon anda - untuk fotografi, permainan, kerja, atau penggunaan umum?",
        "Terima kasih kerana berkongsi itu! Untuk corak penggunaan anda, saya akan mengesyorkan untuk memberi tumpuan kepada telefon dengan hayat bateri yang kuat dan prestasi yang baik. Saiz skrin mana yang anda suka?"
      ],
      'sk': [
        "Výborná otázka! Aby som vám pomohol nájsť perfektný smartphone, rád by som vedel viac o vašich potrebách. Čo je pre vás najdôležitejšie - kvalita kamery, výdrž batérie, výkon alebo veľkosť obrazovky?",
        "Tieto informácie sú veľmi užitočné! Na základe toho, čo ste zdieľali, odporučil by som zvážiť telefóny s dobrými kamerovými systémami. Aký je váš rozpočtový rozsah?",
        "Výborná voľba! Pre tento cenový rozsah by som odporučil pozrieť sa na najnovšie modely od Samsung, Apple alebo Google. Preferujete Android alebo iOS?",
        "Perfektné! Dovoľte mi položiť ešte niekoľko otázok, aby som upresnil najlepšie možnosti. Ako hlavne používate svoj telefón - na fotografovanie, hry, prácu alebo všeobecné použitie?",
        "Ďakujem za zdieľanie! Pre vaše vzorce používania by som odporučil zamerať sa na telefóny so silnou výdržou batérie a dobrým výkonom. Akú veľkosť obrazovky preferujete?"
      ],
      'da': [
        "Fremragende spørgsmål! For at hjælpe dig med at finde den perfekte smartphone, vil jeg gerne vide mere om dine behov. Hvad er vigtigst for dig - kamerakvalitet, batterilevetid, ydeevne eller skærmstørrelse?",
        "Den information er meget nyttig! Baseret på det, du har delt, vil jeg anbefale at overveje telefoner med gode kamerasystemer. Hvad er dit budgetområde?",
        "Fremragende valg! For det prisområde vil jeg foreslå at kigge på de nyeste modeller fra Samsung, Apple eller Google. Foretrækker du Android eller iOS?",
        "Perfekt! Lad mig stille et par spørgsmål mere for at forfine de bedste muligheder. Hvordan bruger du primært din telefon - til fotografi, spil, arbejde eller generel brug?",
        "Tak for at dele det! For dine brugsmønstre vil jeg anbefale at fokusere på telefoner med stærk batterilevetid og god ydeevne. Hvilken skærmstørrelse foretrækker du?"
      ],
      'ta': [
        "சிறந்த கேள்வி! சரியான ஸ்மார்ட்போனைக் கண்டுபிடிப்பதில் உங்களுக்கு உதவ, உங்கள் தேவைகளைப் பற்றி மேலும் அறிய விரும்புகிறேன். உங்களுக்கு மிக முக்கியமானது என்ன - கேமரா தரம், பேட்டரி வாழ்க்கை, செயல்திறன், அல்லது திரை அளவு?",
        "அந்த தகவல் மிகவும் பயனுள்ளதாக இருக்கிறது! நீங்கள் பகிர்ந்ததை அடிப்படையாகக் கொண்டு, நல்ல கேமரா அமைப்புகளைக் கொண்ட தொலைபேசிகளைக் கருத்தில் கொள்ள பரிந்துரைக்கிறேன். உங்கள் பட்ஜெட் வரம்பு என்ன?",
        "சிறந்த தேர்வு! அந்த விலை வரம்புக்கு, Samsung, Apple, அல்லது Google இன் சமீபத்திய மாடல்களைப் பார்க்க பரிந்துரைக்கிறேன். நீங்கள் Android அல்லது iOS ஐ விரும்புகிறீர்களா?",
        "சரியானது! சிறந்த விருப்பங்களை மேம்படுத்த இன்னும் சில கேள்விகளைக் கேட்க அனுமதியுங்கள். நீங்கள் முக்கியமாக உங்கள் தொலைபேசியை எப்படி பயன்படுத்துகிறீர்கள் - புகைப்படம் எடுப்பதற்கு, விளையாட்டு, வேலை, அல்லது பொதுவான பயன்பாட்டிற்கு?",
        "அதை பகிர்ந்தமைக்கு நன்றி! உங்கள் பயன்பாட்டு வடிவங்களுக்கு, வலுவான பேட்டரி வாழ்க்கை மற்றும் நல்ல செயல்திறனுடன் கூடிய தொலைபேசிகளில் கவனம் செலுத்த பரிந்துரைக்கிறேன். எந்த திரை அளவை நீங்கள் விரும்புகிறீர்கள்?"
      ],
      'uk': [
        "Відмінне питання! Щоб допомогти вам знайти ідеальний смартфон, я хотів би дізнатися більше про ваші потреби. Що для вас найважливіше - якість камери, час роботи батареї, продуктивність чи розмір екрану?",
        "Ця інформація дуже корисна! Ґрунтуючись на тому, що ви поділилися, я б рекомендував розглянути телефони з хорошими системами камер. Який ваш бюджетний діапазон?",
        "Відмінний вибір! Для цього цінового діапазону я б запропонував подивитися на найновіші моделі Samsung, Apple або Google. Ви віддаєте перевагу Android чи iOS?",
        "Ідеально! Дозвольте мені поставити ще кілька запитань, щоб уточнити найкращі варіанти. Як ви в основному використовуєте свій телефон - для фотографії, ігор, роботи чи загального використання?",
        "Дякую, що поділилися цим! Для ваших моделей використання я б рекомендував зосередитися на телефонах з сильним часом роботи батареї та хорошою продуктивністю. Який розмір екрану ви віддаєте перевагу?"
      ],
      'ru': [
        "Отличный вопрос! Чтобы помочь вам найти идеальный смартфон, я хотел бы узнать больше о ваших потребностях. Что для вас важнее всего - качество камеры, время работы батареи, производительность или размер экрана?",
        "Эта информация очень полезна! Основываясь на том, что вы поделились, я бы порекомендовал рассмотреть телефоны с хорошими системами камер. Какой у вас бюджетный диапазон?",
        "Отличный выбор! Для этого ценового диапазона я бы предложил посмотреть на новейшие модели Samsung, Apple или Google. Вы предпочитаете Android или iOS?",
        "Отлично! Позвольте мне задать еще несколько вопросов, чтобы уточнить лучшие варианты. Как вы в основном используете свой телефон - для фотографии, игр, работы или общего использования?",
        "Спасибо, что поделились этим! Для ваших моделей использования я бы порекомендовал сосредоточиться на телефонах с сильным временем работы батареи и хорошей производительностью. Какой размер экрана вы предпочитаете?"
      ],
      'hu': [
        "Kiváló kérdés! Hogy segítsek megtalálni a tökéletes okostelefont, szeretnék többet tudni az Ön igényeiről. Mi a legfontosabb Önnek - a kamera minősége, az akkumulátor élettartama, a teljesítmény vagy a képernyő mérete?",
        "Ez az információ nagyon hasznos! Az Ön által megosztottak alapján javasolnám, hogy fontolóra vegye a jó kamerarendszerekkel rendelkező telefonokat. Mi az Ön költségvetési tartománya?",
        "Kiváló választás! Ebben az ártartományban javasolnám, hogy nézze meg a Samsung, Apple vagy Google legújabb modelljeit. Az Androidot vagy az iOS-t részesíti előnyben?",
        "Tökéletes! Engedje meg, hogy még néhány kérdést tegyek fel a legjobb lehetőségek finomításához. Hogyan használja főként a telefonját - fényképezéshez, játékhoz, munkához vagy általános használathoz?",
        "Köszönöm, hogy megosztotta ezt! Használati mintáihoz javasolnám, hogy olyan telefonokra összpontosítson, amelyek erős akkumulátor-élettartamúak és jó teljesítményűek. Milyen képernyőméreteket részesít előnyben?"
      ],
      'no': [
        "Utmerket spørsmål! For å hjelpe deg med å finne den perfekte smarttelefonen, vil jeg gjerne vite mer om dine behov. Hva er viktigst for deg - kamerakvalitet, batterilevetid, ytelse eller skjermstørrelse?",
        "Den informasjonen er veldig nyttig! Basert på det du har delt, vil jeg anbefale å vurdere telefoner med gode kamerasystemer. Hva er ditt budsjettområde?",
        "Utmerket valg! For det prisområdet vil jeg foreslå å se på de nyeste modellene fra Samsung, Apple eller Google. Foretrekker du Android eller iOS?",
        "Perfekt! La meg stille noen flere spørsmål for å forbedre de beste alternativene. Hvordan bruker du hovedsakelig telefonen din - til fotografi, spill, arbeid eller generell bruk?",
        "Takk for at du delte det! For dine bruksmønstre vil jeg anbefale å fokusere på telefoner med sterk batterilevetid og god ytelse. Hvilken skjermstørrelse foretrekker du?"
      ],
      'vi': [
        "Câu hỏi tuyệt vời! Để giúp bạn tìm chiếc smartphone hoàn hảo, tôi muốn biết thêm về nhu cầu của bạn. Điều gì quan trọng nhất đối với bạn - chất lượng camera, thời lượng pin, hiệu suất hay kích thước màn hình?",
        "Thông tin đó rất hữu ích! Dựa trên những gì bạn đã chia sẻ, tôi sẽ khuyên bạn nên xem xét các điện thoại có hệ thống camera tốt. Phạm vi ngân sách của bạn là gì?",
        "Lựa chọn tuyệt vời! Với phạm vi giá đó, tôi sẽ đề xuất xem các mẫu mới nhất từ Samsung, Apple hoặc Google. Bạn thích Android hay iOS?",
        "Hoàn hảo! Hãy để tôi đặt thêm một vài câu hỏi để tinh chỉnh các lựa chọn tốt nhất. Bạn chủ yếu sử dụng điện thoại như thế nào - để chụp ảnh, chơi game, làm việc hay sử dụng chung?",
        "Cảm ơn bạn đã chia sẻ điều đó! Đối với các mẫu sử dụng của bạn, tôi sẽ khuyên bạn nên tập trung vào các điện thoại có thời lượng pin mạnh và hiệu suất tốt. Bạn thích kích thước màn hình nào?"
      ]
    };

    // Always use the specified language, fallback to English if not available
    const languageResponses = responses[language] || responses['en'];
    const randomResponse = languageResponses[Math.floor(Math.random() * languageResponses.length)];
    
    console.log(`Using ${language} responses for fallback`);
    
    return {
      response: randomResponse
    };
  }
}
