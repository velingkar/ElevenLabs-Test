# ElevenLabs Language Testing App

A React TypeScript application that uses ElevenLabs ConvAI API to create AI agents for natural language conversations.

## Features

- **AI Agent Conversations**: Create and interact with AI agents using ElevenLabs ConvAI API
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
   Create a `.env` file in the root directory with your ElevenLabs API key:
   ```
   VITE_ELEVENLABS_API_KEY=your_api_key_here
   ```
   
   Get your API key from [ElevenLabs](https://elevenlabs.io/)

3. **Run the Application**
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open your browser and navigate to `http://localhost:5173`

## How to Use

1. **Select Language & Voice**: Choose your preferred language and voice on the home page
2. **Start Conversation**: Click "Start Conversation" to create an AI agent
3. **Interact with Agent**: Speak naturally with the smartphone sales agent
4. **Get Recommendations**: The agent will ask questions and recommend smartphones based on your needs

## ConvAI Features

The app uses ElevenLabs ConvAI API to create intelligent AI agents:

- **Agent Creation**: Creates a specialized smartphone sales agent
- **Natural Conversations**: Real-time conversation simulation
- **Voice Integration**: Seamless voice input and output
- **Multi-language Support**: Agents respond in the selected language

## API Endpoints Used

- `POST /v1/convai/agents/create` - Create AI agent
- `POST /v1/convai/agents/:agent_id/simulate-conversation` - Simulate conversation
- `POST /v1/text-to-speech/:voice_id` - Generate speech

## Technologies Used

- React 18
- TypeScript
- Vite
- Tailwind CSS
- ElevenLabs API
- Web Speech API

## Development

- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Lint**: `npm run lint`
