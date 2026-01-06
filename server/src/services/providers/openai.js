import OpenAI from 'openai';
import { getApiKeyForProvider } from './index.js';

let client = null;
let currentApiKey = null;

function getClient() {
  const apiKey = getApiKeyForProvider('openai');

  // Reinitialize client if API key changed
  if (apiKey !== currentApiKey) {
    client = null;
    currentApiKey = apiKey;
  }

  if (!client && apiKey) {
    client = new OpenAI({ apiKey });
  }
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }
  return client;
}

export async function generate({ prompt, model = 'dall-e-3', size = '1024x1024', count = 1 }) {
  const openai = getClient();
  const response = await openai.images.generate({
    model,
    prompt,
    n: model === 'dall-e-3' ? 1 : Math.min(count, 4),
    size,
    response_format: 'b64_json'
  });

  const images = response.data.map(img => ({
    imageData: img.b64_json,
    mimeType: 'image/png'
  }));

  // DALL-E 3 only generates 1 at a time, so we need multiple calls for variants
  if (model === 'dall-e-3' && count > 1) {
    const additionalCalls = [];
    for (let i = 1; i < count; i++) {
      additionalCalls.push(
        openai.images.generate({
          model,
          prompt,
          n: 1,
          size,
          response_format: 'b64_json'
        })
      );
    }
    const additionalResults = await Promise.all(additionalCalls);
    for (const result of additionalResults) {
      images.push({
        imageData: result.data[0].b64_json,
        mimeType: 'image/png'
      });
    }
  }

  return { images, cost: getCost(model, images.length) };
}

export async function edit({ prompt, imageBase64, mimeType, size = '1024x1024' }) {
  const openai = getClient();
  // Convert base64 to buffer for OpenAI
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  const response = await openai.images.edit({
    model: 'dall-e-2',
    image: new File([imageBuffer], 'image.png', { type: mimeType }),
    prompt,
    n: 1,
    size,
    response_format: 'b64_json'
  });

  return {
    images: [{
      imageData: response.data[0].b64_json,
      mimeType: 'image/png'
    }],
    cost: 0.02
  };
}

function getCost(model, count) {
  const costs = {
    'dall-e-3': 0.04,
    'dall-e-2': 0.02
  };
  return (costs[model] || 0.04) * count;
}
