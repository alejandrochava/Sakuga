# Sakuga

Sakuga (作画) is a personal image generation tool I built to experiment with Google's Gemini image model. The name comes from the Japanese term for animation/drawing - felt fitting for an app that creates images.

The idea is simple: a local-first app where I can generate images, edit existing ones, or transform them using text prompts. Everything stays on my machine - images are saved locally and there's a basic history to look back at past generations.

## What it does

- **Generate** - describe what you want, get an image
- **Edit** - upload an image and tell it what to change
- **Transform** - take an image and apply a style or concept to it

## Stack

Vue 3 frontend, Express backend, Gemini 2.0 Flash for the actual generation. Tailwind for styling because I didn't want to think about CSS.

## Running it

Needs Node 18+ and a [Gemini API key](https://aistudio.google.com/apikey).

### Install dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Configure environment

```bash
echo "GEMINI_API_KEY=your_key" > server/.env
```

### Run the app

```bash
# Start the server (from /server folder)
npm run dev

# Start the client (from /client folder, in another terminal)
npm run dev
```

App runs at http://localhost:5173.

### Other commands

```bash
# Client
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests in watch mode
npm run test:run   # Run tests once
npm run typecheck  # Check TypeScript types

# Server
npm run build      # Build for production
npm start          # Run production build
```
