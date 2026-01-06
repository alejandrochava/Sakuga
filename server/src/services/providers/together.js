import { getApiKeyForProvider } from './index.js';

const API_URL = 'https://api.together.xyz/v1/images/generations';

const MODELS = {
  'flux-schnell': 'black-forest-labs/FLUX.1-schnell-Free',
  'flux-dev': 'black-forest-labs/FLUX.1-dev'
};

export async function generate({ prompt, model = 'flux-schnell', aspectRatio = '1:1', count = 1 }) {
  const apiKey = getApiKeyForProvider('together');
  if (!apiKey) {
    throw new Error('Together AI API key not configured');
  }

  const modelId = MODELS[model] || MODELS['flux-schnell'];

  // Map aspect ratio to dimensions
  const dimensions = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '4:3': { width: 1152, height: 896 },
    '3:4': { width: 896, height: 1152 }
  };

  const size = dimensions[aspectRatio] || dimensions['1:1'];

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      n: count,
      width: size.width,
      height: size.height,
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Together AI API error');
  }

  const data = await response.json();

  const images = data.data.map(img => ({
    imageData: img.b64_json,
    mimeType: 'image/png'
  }));

  return { images, cost: getCost(model, count) };
}

function getCost(model, count) {
  const costs = {
    'flux-schnell': 0.003,
    'flux-dev': 0.018
  };
  return (costs[model] || 0.003) * count;
}
