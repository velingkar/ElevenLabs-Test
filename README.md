# ElevenLabs Language Testing App

A React TypeScript application that uses ElevenLabs ConvAI API and VAPI to create AI agents for natural language conversations.

## Features

- **AI Agent Conversations**: Create and interact with AI agents using ElevenLabs ConvAI API
- **VAPI Dynamic Conversations**: Real-time conversations with VAPI agents using your selected voice and language
- **Smartphone Sales Agent**: Pre-configured agent that helps users find the perfect smartphone
- **Multi-language Support**: Supports multiple languages with appropriate voice selection
- **Real-time Speech**: Voice-to-text and text-to-speech capabilities
- **ElevenLabs Integration**: Uses ElevenLabs API for high-quality voice synthesis

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory with your API keys:
   ```
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   VITE_VAPI_API_KEY=your_vapi_api_key_here
   ```
   
   Get your API keys from:
   - [ElevenLabs](https://elevenlabs.io/)
   - [VAPI](https://vapi.ai/)

3. **Run the Application**
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open your browser and navigate to `http://localhost:5173`

## How to Use

### Traditional ConvAI Conversations
1. **Select Language & Voice**: Choose your preferred language and voice on the home page
2. **Start Conversation**: Click "Start Conversation" to create an AI agent
3. **Interact with Agent**: Speak naturally with the smartphone sales agent
4. **Get Recommendations**: The agent will ask questions and recommend smartphones based on your needs

### VAPI Dynamic Conversations
1. **Click "Start Conversation with VAPI"**: Access the new VAPI conversation interface
2. **Setup Your Agent**: Select voice, language, and gender for your dynamic agent
3. **Create Agent**: Click "Create Agent" to initialize your VAPI agent
4. **Start Conversation**: Begin a real-time conversation with your custom agent
5. **Dynamic Responses**: The agent responds naturally to any topic you discuss

## ConvAI Features

The app uses ElevenLabs ConvAI API to create intelligent AI agents:

- **Agent Creation**: Creates a specialized smartphone sales agent
- **Natural Conversations**: Real-time conversation simulation
- **Voice Integration**: Seamless voice input and output
- **Multi-language Support**: Agents respond in the selected language

## VAPI Features

The app also integrates with VAPI for dynamic conversations:

- **Dynamic Agent Creation**: Create agents with custom prompts and voices
- **Real-time Conversations**: Live chat with AI agents
- **Voice Integration**: Uses ElevenLabs voices through VAPI
- **Multi-language Support**: Agents respond in your selected language
- **Custom Prompts**: Flexible conversation topics beyond smartphone sales

## API Endpoints Used

### ElevenLabs ConvAI
- `POST /v1/convai/agents/create` - Create AI agent
- `POST /v1/convai/agents/:agent_id/simulate-conversation` - Simulate conversation
- `POST /v1/text-to-speech/:voice_id` - Generate speech

### VAPI
- `POST /assistant` - Create VAPI assistant
- `POST /call` - Start VAPI conversation
- `POST /call/:call_id/message` - Send message to VAPI conversation
- `POST /call/:call_id/end` - End VAPI conversation

## Technologies Used

- React 18
- TypeScript
- Vite
- Tailwind CSS
- ElevenLabs API
- VAPI
- Web Speech API

## Development

- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Lint**: `npm run lint`
