import { fal } from '@fal-ai/client';

// Configure FAL client
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

const MODELS = {
  'flux-pro': 'fal-ai/flux-pro',
  'flux-dev': 'fal-ai/flux/dev',
  'flux-schnell': 'fal-ai/flux/schnell',
  'flux-realism': 'fal-ai/flux-realism',
  'sdxl': 'fal-ai/fast-sdxl'
};

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

export async function generate({ prompt, model = 'flux-schnell', aspectRatio = '1:1', count = 1 }) {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL API key not configured');
  }

  const modelId = MODELS[model] || MODELS['flux-schnell'];

  const aspectRatioMap = {
    '1:1': 'square',
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9',
    '4:3': 'landscape_4_3',
    '3:4': 'portrait_4_3'
  };

  const images = [];

  for (let i = 0; i < count; i++) {
    const result = await fal.subscribe(modelId, {
      input: {
        prompt,
        image_size: aspectRatioMap[aspectRatio] || 'square',
        num_images: 1,
        enable_safety_checker: false
      }
    });

    if (result.images && result.images.length > 0) {
      const imageUrl = result.images[0].url;
      const imageData = await fetchImageAsBase64(imageUrl);
      images.push({
        imageData,
        mimeType: 'image/png'
      });
    }
  }

  return { images, cost: getCost(model, count) };
}

export async function edit({ prompt, imageBase64, mimeType, model = 'flux-dev' }) {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL API key not configured');
  }

  // Use img2img model
  const result = await fal.subscribe('fal-ai/flux/dev/image-to-image', {
    input: {
      prompt,
      image_url: `data:${mimeType};base64,${imageBase64}`,
      strength: 0.75,
      num_images: 1
    }
  });

  if (result.images && result.images.length > 0) {
    const imageUrl = result.images[0].url;
    const imageData = await fetchImageAsBase64(imageUrl);
    return {
      images: [{ imageData, mimeType: 'image/png' }],
      cost: 0.025
    };
  }

  throw new Error('No image generated');
}

function getCost(model, count) {
  const costs = {
    'flux-pro': 0.05,
    'flux-dev': 0.025,
    'flux-schnell': 0.003,
    'flux-realism': 0.025,
    'sdxl': 0.003
  };
  return (costs[model] || 0.01) * count;
}
