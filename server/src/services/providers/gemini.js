import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKeyForProvider } from './index.js';

const MODEL_NAME = 'gemini-2.0-flash-exp-image-generation';

let genAI = null;
let currentApiKey = null;

function getGenAI() {
  const apiKey = getApiKeyForProvider('gemini');

  if (apiKey !== currentApiKey) {
    genAI = null;
    currentApiKey = apiKey;
  }

  if (!genAI && apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }
  return genAI;
}

export async function generate({ prompt, count = 1 }) {
  const model = getGenAI().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseModalities: ['Text', 'Image']
    }
  });

  const images = [];

  for (let i = 0; i < count; i++) {
    const response = await model.generateContent(prompt);
    const result = response.response;

    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push({
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        });
        break;
      }
    }
  }

  if (images.length === 0) {
    throw new Error('No image generated');
  }

  return { images, cost: 0.02 * count };
}

export async function edit({ prompt, imageBase64, mimeType }) {
  const model = getGenAI().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseModalities: ['Text', 'Image']
    }
  });

  const response = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    }
  ]);
  const result = response.response;

  for (const part of result.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        images: [{
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        }],
        cost: 0.02
      };
    }
  }

  throw new Error('No image generated');
}
