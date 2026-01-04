import * as openai from './openai.js';
import * as stability from './stability.js';
import * as replicate from './replicate.js';
import * as gemini from './gemini.js';

const providers = {
  openai,
  stability,
  replicate,
  gemini
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
      models: ['dall-e-3', 'dall-e-2'],
      features: ['generate', 'edit', 'variants'],
      costPerImage: 0.04
    });
  }

  if (process.env.STABILITY_API_KEY) {
    available.push({
      id: 'stability',
      name: 'Stability AI',
      models: ['sd3-large', 'sd3-medium', 'sdxl-1.0'],
      features: ['generate', 'edit', 'inpaint', 'upscale', 'variants'],
      costPerImage: 0.003
    });
  }

  if (process.env.REPLICATE_API_TOKEN) {
    available.push({
      id: 'replicate',
      name: 'Replicate',
      models: ['flux-pro', 'flux-schnell', 'sdxl'],
      features: ['generate', 'upscale', 'variants'],
      costPerImage: 0.003
    });
  }

  if (process.env.GEMINI_API_KEY) {
    available.push({
      id: 'gemini',
      name: 'Google Gemini',
      models: ['gemini-2.0-flash-exp-image-generation'],
      features: ['generate', 'edit'],
      costPerImage: 0.02
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
