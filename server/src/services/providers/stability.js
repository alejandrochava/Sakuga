const API_HOST = 'https://api.stability.ai';

async function callStabilityAPI(endpoint, body, isFormData = false) {
  const headers = {
    'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
    'Accept': 'application/json'
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_HOST}${endpoint}`, {
    method: 'POST',
    headers,
    body: isFormData ? body : JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Stability API error');
  }

  return response.json();
}

export async function generate({ prompt, model = 'sd3-large', aspectRatio = '1:1', count = 1 }) {
  const images = [];

  for (let i = 0; i < count; i++) {
    const result = await callStabilityAPI('/v2beta/stable-image/generate/sd3', {
      prompt,
      model,
      aspect_ratio: aspectRatio,
      output_format: 'png'
    });

    images.push({
      imageData: result.image,
      mimeType: 'image/png'
    });
  }

  return { images, cost: getCost(model, count) };
}

export async function edit({ prompt, imageBase64, mimeType, strength = 0.7 }) {
  const formData = new FormData();
  const imageBlob = new Blob([Buffer.from(imageBase64, 'base64')], { type: mimeType });
  formData.append('image', imageBlob, 'image.png');
  formData.append('prompt', prompt);
  formData.append('strength', strength.toString());
  formData.append('output_format', 'png');

  const result = await callStabilityAPI('/v2beta/stable-image/generate/sd3', formData, true);

  return {
    images: [{
      imageData: result.image,
      mimeType: 'image/png'
    }],
    cost: 0.004
  };
}

export async function inpaint({ prompt, imageBase64, maskBase64, mimeType }) {
  const formData = new FormData();
  const imageBlob = new Blob([Buffer.from(imageBase64, 'base64')], { type: mimeType });
  const maskBlob = new Blob([Buffer.from(maskBase64, 'base64')], { type: 'image/png' });

  formData.append('image', imageBlob, 'image.png');
  formData.append('mask', maskBlob, 'mask.png');
  formData.append('prompt', prompt);
  formData.append('output_format', 'png');

  const result = await callStabilityAPI('/v2beta/stable-image/edit/inpaint', formData, true);

  return {
    images: [{
      imageData: result.image,
      mimeType: 'image/png'
    }],
    cost: 0.004
  };
}

export async function upscale({ imageBase64, mimeType, scale = 2 }) {
  const formData = new FormData();
  const imageBlob = new Blob([Buffer.from(imageBase64, 'base64')], { type: mimeType });
  formData.append('image', imageBlob, 'image.png');
  formData.append('output_format', 'png');

  const endpoint = scale === 4
    ? '/v2beta/stable-image/upscale/creative'
    : '/v2beta/stable-image/upscale/fast';

  const result = await callStabilityAPI(endpoint, formData, true);

  return {
    images: [{
      imageData: result.image,
      mimeType: 'image/png'
    }],
    cost: scale === 4 ? 0.25 : 0.05
  };
}

function getCost(model, count) {
  const costs = {
    'sd3-large': 0.065,
    'sd3-medium': 0.035,
    'sdxl-1.0': 0.002
  };
  return (costs[model] || 0.004) * count;
}
