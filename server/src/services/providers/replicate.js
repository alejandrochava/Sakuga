import Replicate from 'replicate';
import { fetchImageAsBase64 } from '../utils/imageConverter.js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

const MODELS = {
  'flux-pro': 'black-forest-labs/flux-pro',
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
};

export async function generate({ prompt, model = 'flux-schnell', aspectRatio = '1:1', count = 1 }) {
  const images = [];
  const modelId = MODELS[model] || MODELS['flux-schnell'];

  for (let i = 0; i < count; i++) {
    const output = await replicate.run(modelId, {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        output_format: 'png',
        num_outputs: 1
      }
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    const imageData = await fetchImageAsBase64(imageUrl);

    images.push({
      imageData,
      mimeType: 'image/png'
    });
  }

  return { images, cost: getCost(model, count) };
}

export async function upscale({ imageBase64, mimeType, scale = 2 }) {
  // Use Real-ESRGAN for upscaling
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const output = await replicate.run(
    'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    {
      input: {
        image: dataUrl,
        scale: scale,
        face_enhance: false
      }
    }
  );

  const imageData = await fetchImageAsBase64(output);

  return {
    images: [{
      imageData,
      mimeType: 'image/png'
    }],
    cost: 0.01
  };
}

function getCost(model, count) {
  const costs = {
    'flux-pro': 0.055,
    'flux-schnell': 0.003,
    'sdxl': 0.002
  };
  return (costs[model] || 0.003) * count;
}
