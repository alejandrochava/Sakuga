import { fetchImageAsBase64 } from '../utils/imageConverter.js';
import { getApiKeyForProvider } from './index.js';

const API_URL = 'https://api.ideogram.ai';

export async function generate({ prompt, model = 'V_2', aspectRatio = '1:1', count = 1 }) {
  const apiKey = getApiKeyForProvider('ideogram');
  if (!apiKey) {
    throw new Error('Ideogram API key not configured');
  }

  const aspectRatioMap = {
    '1:1': 'ASPECT_1_1',
    '16:9': 'ASPECT_16_9',
    '9:16': 'ASPECT_9_16',
    '4:3': 'ASPECT_4_3',
    '3:4': 'ASPECT_3_4'
  };

  const images = [];

  for (let i = 0; i < count; i++) {
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_request: {
          prompt,
          model,
          aspect_ratio: aspectRatioMap[aspectRatio] || 'ASPECT_1_1',
          magic_prompt_option: 'AUTO'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ideogram API error');
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const imageUrl = data.data[0].url;
      const imageData = await fetchImageAsBase64(imageUrl);
      images.push({
        imageData,
        mimeType: 'image/png'
      });
    }
  }

  return { images, cost: getCost(model, count) };
}

function getCost(model, count) {
  const costs = {
    'V_2': 0.08,
    'V_2_TURBO': 0.05,
    'V_1': 0.02,
    'V_1_TURBO': 0.01
  };
  return (costs[model] || 0.08) * count;
}
