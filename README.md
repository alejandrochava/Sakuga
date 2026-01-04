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

```bash
cd server && npm install
cd ../client && npm install
echo "GEMINI_API_KEY=your_key" > server/.env
```

Then run `npm run dev` in both `/server` and `/client` folders. App runs at http://localhost:5173.
