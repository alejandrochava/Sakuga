const API_URL = 'https://api.bfl.ml/v1';

const MODELS = {
  'flux-pro-1.1': 'flux-pro-1.1',
  'flux-pro': 'flux-pro',
  'flux-dev': 'flux-dev',
  'flux-schnell': 'flux-schnell'
};

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

async function pollForResult(taskId, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_URL}/get_result?id=${taskId}`, {
      headers: {
        'x-key': process.env.BFL_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to poll for result');
    }

    const data = await response.json();

    if (data.status === 'Ready') {
      return data.result;
    } else if (data.status === 'Error') {
      throw new Error(data.error || 'Generation failed');
    }

    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Generation timed out');
}

export async function generate({ prompt, model = 'flux-schnell', aspectRatio = '1:1', count = 1 }) {
  if (!process.env.BFL_API_KEY) {
    throw new Error('Black Forest Labs API key not configured');
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
  const images = [];

  for (let i = 0; i < count; i++) {
    // Submit generation request
    const response = await fetch(`${API_URL}/${modelId}`, {
      method: 'POST',
      headers: {
        'x-key': process.env.BFL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        width: size.width,
        height: size.height
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Black Forest Labs API error');
    }

    const { id } = await response.json();

    // Poll for result
    const result = await pollForResult(id);

    if (result.sample) {
      const imageData = await fetchImageAsBase64(result.sample);
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
    'flux-pro-1.1': 0.06,
    'flux-pro': 0.055,
    'flux-dev': 0.025,
    'flux-schnell': 0.003
  };
  return (costs[model] || 0.025) * count;
}
