# Sakuga (作画)

Personal AI image generation app powered by Nano Banana (Google Gemini 2.5 Flash Image).

## Features

- **Text to Image** - Generate images from text prompts
- **Image Editing** - Edit existing images with prompts
- **Image to Image** - Transform images based on prompts and references
- **History** - Browse and manage past generations

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + Tailwind CSS
- **Backend**: Node.js + Express
- **AI**: Google Gemini 2.5 Flash Image API
- **Storage**: Local filesystem

## Setup

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/alejandrochava/Sakuga.git
cd Sakuga
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Configure environment:
```bash
cd ../server
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Running

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd client
npm run dev
```

3. Open http://localhost:5173 in your browser

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/generate | Generate image from text |
| POST | /api/edit | Edit image with prompt |
| POST | /api/image-to-image | Transform image |
| GET | /api/history | Get generation history |
| GET | /api/images/:id | Serve saved image |
| DELETE | /api/history/:id | Delete a generation |

## Project Structure

```
Sakuga/
├── client/          # Vue 3 frontend
├── server/          # Node.js backend
│   └── storage/     # Images and history
├── .env.example
└── README.md
```

## License

MIT
