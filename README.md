# ElevenLabs Language Testing App

A React TypeScript application that uses ElevenLabs ConvAI API to create AI agents for natural language conversations.

## Features

- **Firebase Authentication**: Secure SSO authentication with Google, Microsoft, Okta, and email/password
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
   Create a `.env` file in the root directory with your API keys:
   ```
   # ElevenLabs API Key
   VITE_ELEVENLABS_API_KEY=your_api_key_here
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
   
   - Get your ElevenLabs API key from [ElevenLabs](https://elevenlabs.io/)
   - Get your Firebase config from [Firebase Console](https://console.firebase.google.com/)
     - Go to Project Settings → General → Your apps → Web app
     - Copy the Firebase configuration values

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

## Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select an existing one

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable the sign-in providers you want to use:
     - **Google**: Enable and configure
     - **Microsoft**: Enable and configure (requires Azure AD setup)
     - **Okta**: Enable and configure (requires custom OIDC provider)
     - **Email/Password**: Enable

3. **Get Firebase Configuration**
   - Go to Project Settings → General
   - Scroll down to "Your apps" section
   - Click on the Web app icon (</>) or add a new web app
   - Copy the Firebase configuration object
   - Add the values to your `.env` file

4. **Configure OAuth Providers** (for SSO)
   - **Google**: Follow Firebase's Google sign-in setup guide
   - **Microsoft**: Configure Azure AD and add OAuth credentials
   - **Okta**: Set up OIDC provider in Firebase

## Technologies Used

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- ElevenLabs API
- Web Speech API

## Development

- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Lint**: `npm run lint`
