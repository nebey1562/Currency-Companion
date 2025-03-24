# Voice Banking Demo

A voice-enabled banking demo application built with React (frontend) and Flask (backend). Features include voice navigation, pre-generated text-to-speech (TTS) audio for fast performance, and simulated voice authentication endpoints. This project is optimized for a demo environment, prioritizing speed and simplicity.

## Project Structure


## Prerequisites
- **Python**: 3.9 or higher
- **Node.js**: 18 or higher
- **npm**: 8 or higher
- A modern browser (e.g., Chrome) with microphone support for voice features

## Setup Instructions

├── audio/                    # Pre-generated audio files for each route
├── server/                   # Backend Flask server
│   ├── server.py             # Flask app with /scrape, /tts, /enroll, /verify
│   ├── generate_audio.py     # Script to generate audio files
│   └── requirements.txt      # Python dependencies
├── src/                      # Frontend React code
│   ├── components/           # Optional React components
│   ├── App.jsx               # Main app with UI and routing
│   ├── App.css               # Styles
│   ├── index.jsx             # React entry point
├── package.json              # Node.js dependencies and scripts
├── config-overrides.js       # Custom webpack config for react-app-rewired
└── README.md                 # This file

### Backend Setup
1. **Navigate to Backend Directory**:
   ```bash
   cd server