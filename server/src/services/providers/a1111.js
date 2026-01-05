// Automatic1111 Stable Diffusion WebUI provider
// Requires running WebUI with --api flag

function getApiUrl() {
  return process.env.A1111_URL || 'http://localhost:7860';
}

export async function generate({
  prompt,
  negativePrompt = '',
  aspectRatio = '1:1',
  count = 1,
  // Advanced parameters with defaults
  seed = -1,
  steps = 30,
  cfgScale = 7,
  sampler = 'DPM++ 2M Karras'
}) {
  const apiUrl = getApiUrl();

  // Map aspect ratio to dimensions
  const dimensions = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '4:3': { width: 1152, height: 896 },
    '3:4': { width: 896, height: 1152 }
  };

  const size = dimensions[aspectRatio] || dimensions['1:1'];

  const response = await fetch(`${apiUrl}/sdapi/v1/txt2img`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      seed: seed ?? -1,
      steps: steps ?? 30,
      width: size.width,
      height: size.height,
      cfg_scale: cfgScale ?? 7,
      sampler_name: sampler ?? 'DPM++ 2M Karras',
      batch_size: count
    })
  });

  if (!response.ok) {
    throw new Error(`Automatic1111 API error: ${response.statusText}`);
  }

  const data = await response.json();

  const images = data.images.map(imageData => ({
    imageData,
    mimeType: 'image/png'
  }));

  return { images, cost: 0 }; // Free - runs locally
}

export async function edit({
  prompt,
  imageBase64,
  mimeType,
  negativePrompt = '',
  strength = 0.75,
  seed = -1,
  steps = 30,
  cfgScale = 7,
  sampler = 'DPM++ 2M Karras'
}) {
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}/sdapi/v1/img2img`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      init_images: [imageBase64],
      denoising_strength: strength,
      seed: seed ?? -1,
      steps: steps ?? 30,
      cfg_scale: cfgScale ?? 7,
      sampler_name: sampler ?? 'DPM++ 2M Karras'
    })
  });

  if (!response.ok) {
    throw new Error(`Automatic1111 API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    images: [{
      imageData: data.images[0],
      mimeType: 'image/png'
    }],
    cost: 0
  };
}

export async function inpaint({
  prompt,
  imageBase64,
  maskBase64,
  mimeType,
  negativePrompt = '',
  seed = -1,
  steps = 30,
  cfgScale = 7,
  sampler = 'DPM++ 2M Karras'
}) {
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}/sdapi/v1/img2img`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      init_images: [imageBase64],
      mask: maskBase64,
      inpainting_fill: 1, // original
      inpaint_full_res: true,
      denoising_strength: 0.75,
      seed: seed ?? -1,
      steps: steps ?? 30,
      cfg_scale: cfgScale ?? 7,
      sampler_name: sampler ?? 'DPM++ 2M Karras'
    })
  });

  if (!response.ok) {
    throw new Error(`Automatic1111 API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    images: [{
      imageData: data.images[0],
      mimeType: 'image/png'
    }],
    cost: 0
  };
}

// Check if A1111 is available
export async function checkHealth() {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/sdapi/v1/sd-models`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
