import * as openai from './openai.js';
import * as stability from './stability.js';
import * as replicate from './replicate.js';
import * as gemini from './gemini.js';
import * as ideogram from './ideogram.js';
import * as fal from './fal.js';
import * as together from './together.js';
import * as bfl from './bfl.js';
import * as a1111 from './a1111.js';

const providers = {
  openai,
  stability,
  replicate,
  gemini,
  ideogram,
  fal,
  together,
  bfl,
  a1111
};

export function getProvider(name) {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return provider;
}

export function getAvailableProviders() {
  const available = [];

  if (process.env.OPENAI_API_KEY) {
    available.push({
      id: 'openai',
      name: 'OpenAI DALL-E',
      type: 'cloud',
      models: ['dall-e-3', 'dall-e-2'],
      features: ['generate', 'edit', 'variants'],
      advancedParams: [],
      costPerImage: 0.04
    });
  }

  if (process.env.STABILITY_API_KEY) {
    available.push({
      id: 'stability',
      name: 'Stability AI',
      type: 'cloud',
      models: ['sd3-large', 'sd3-medium', 'sdxl-1.0'],
      features: ['generate', 'edit', 'inpaint', 'upscale', 'variants'],
      advancedParams: ['seed', 'negativePrompt'],
      costPerImage: 0.003
    });
  }

  if (process.env.REPLICATE_API_TOKEN) {
    available.push({
      id: 'replicate',
      name: 'Replicate',
      type: 'cloud',
      models: ['flux-pro', 'flux-schnell', 'sdxl'],
      features: ['generate', 'upscale', 'variants'],
      advancedParams: ['seed', 'steps'],
      costPerImage: 0.003
    });
  }

  if (process.env.GEMINI_API_KEY) {
    available.push({
      id: 'gemini',
      name: 'Google Gemini',
      type: 'cloud',
      models: ['gemini-2.0-flash-exp-image-generation'],
      features: ['generate', 'edit'],
      advancedParams: [],
      costPerImage: 0.02
    });
  }

  if (process.env.IDEOGRAM_API_KEY) {
    available.push({
      id: 'ideogram',
      name: 'Ideogram',
      type: 'cloud',
      models: ['V_2', 'V_2_TURBO', 'V_1', 'V_1_TURBO'],
      features: ['generate', 'variants'],
      advancedParams: ['negativePrompt'],
      costPerImage: 0.08
    });
  }

  if (process.env.FAL_KEY) {
    available.push({
      id: 'fal',
      name: 'FAL.ai',
      type: 'cloud',
      models: ['flux-pro', 'flux-dev', 'flux-schnell', 'flux-realism', 'sdxl'],
      features: ['generate', 'edit', 'variants'],
      advancedParams: ['seed', 'steps'],
      costPerImage: 0.01
    });
  }

  if (process.env.TOGETHER_API_KEY) {
    available.push({
      id: 'together',
      name: 'Together AI',
      type: 'cloud',
      models: ['flux-schnell', 'flux-dev'],
      features: ['generate', 'variants'],
      advancedParams: ['seed', 'steps'],
      costPerImage: 0.003
    });
  }

  if (process.env.BFL_API_KEY) {
    available.push({
      id: 'bfl',
      name: 'Black Forest Labs',
      type: 'cloud',
      models: ['flux-pro-1.1', 'flux-pro', 'flux-dev', 'flux-schnell'],
      features: ['generate', 'variants'],
      advancedParams: ['seed', 'steps'],
      costPerImage: 0.025
    });
  }

  if (process.env.A1111_URL) {
    available.push({
      id: 'a1111',
      name: 'Automatic1111',
      type: 'local',
      models: ['loaded-model'],
      features: ['generate', 'edit', 'inpaint', 'variants'],
      advancedParams: ['seed', 'steps', 'cfgScale', 'negativePrompt', 'sampler'],
      costPerImage: 0
    });
  }

  return available;
}

export async function generate(providerName, options) {
  const provider = getProvider(providerName);
  return provider.generate(options);
}

export async function edit(providerName, options) {
  const provider = getProvider(providerName);
  if (!provider.edit) {
    throw new Error(`Provider ${providerName} does not support image editing`);
  }
  return provider.edit(options);
}

export async function inpaint(providerName, options) {
  const provider = getProvider(providerName);
  if (!provider.inpaint) {
    throw new Error(`Provider ${providerName} does not support inpainting`);
  }
  return provider.inpaint(options);
}

export async function upscale(providerName, options) {
  const provider = getProvider(providerName);
  if (!provider.upscale) {
    throw new Error(`Provider ${providerName} does not support upscaling`);
  }
  return provider.upscale(options);
}
