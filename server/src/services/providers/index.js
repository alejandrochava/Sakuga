import * as openai from './openai.js';
import * as stability from './stability.js';
import * as replicate from './replicate.js';
import * as gemini from './gemini.js';
import * as ideogram from './ideogram.js';
import * as fal from './fal.js';
import * as together from './together.js';
import * as bfl from './bfl.js';
import * as a1111 from './a1111.js';
import { getApiKey as getDbApiKey } from '../../db/index.js';

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

// Map provider IDs to their environment variable names
const ENV_KEY_MAP = {
  openai: 'OPENAI_API_KEY',
  stability: 'STABILITY_API_KEY',
  replicate: 'REPLICATE_API_TOKEN',
  gemini: 'GEMINI_API_KEY',
  ideogram: 'IDEOGRAM_API_KEY',
  fal: 'FAL_KEY',
  together: 'TOGETHER_API_KEY',
  bfl: 'BFL_API_KEY',
  a1111: 'A1111_URL'
};

// Cache for API keys (refreshed on reload)
let apiKeyCache = {};

// Get API key for a provider - checks DB first, then env vars
export function getApiKeyForProvider(providerId) {
  // Check cache first
  if (apiKeyCache[providerId]) {
    return apiKeyCache[providerId];
  }

  // Check database
  const dbKey = getDbApiKey(providerId);
  if (dbKey) {
    apiKeyCache[providerId] = dbKey;
    return dbKey;
  }

  // Fall back to environment variable
  const envVar = ENV_KEY_MAP[providerId];
  if (envVar && process.env[envVar]) {
    apiKeyCache[providerId] = process.env[envVar];
    return process.env[envVar];
  }

  return null;
}

// Check if a provider has an API key configured
export function hasApiKey(providerId) {
  return !!getApiKeyForProvider(providerId);
}

// Reload providers (clear cache to pick up new keys)
export function reloadProviders() {
  apiKeyCache = {};
}

export function getProvider(name) {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return provider;
}

export function getAvailableProviders() {
  const available = [];

  if (hasApiKey('openai')) {
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

  if (hasApiKey('stability')) {
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

  if (hasApiKey('replicate')) {
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

  if (hasApiKey('gemini')) {
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

  if (hasApiKey('ideogram')) {
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

  if (hasApiKey('fal')) {
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

  if (hasApiKey('together')) {
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

  if (hasApiKey('bfl')) {
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

  if (hasApiKey('a1111')) {
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

// Validate an API key by making a simple request
export async function validateApiKey(providerId, apiKey) {
  try {
    switch (providerId) {
      case 'openai': {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey });
        await client.models.list();
        return true;
      }
      case 'stability': {
        const response = await fetch('https://api.stability.ai/v1/user/account', {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        return response.ok;
      }
      case 'replicate': {
        const response = await fetch('https://api.replicate.com/v1/account', {
          headers: { Authorization: `Token ${apiKey}` }
        });
        return response.ok;
      }
      case 'gemini': {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        await model.generateContent('test');
        return true;
      }
      case 'ideogram': {
        const response = await fetch('https://api.ideogram.ai/describe', {
          method: 'POST',
          headers: {
            'Api-Key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image_url: 'https://example.com/test.png' })
        });
        // 400 is ok (bad request), 401/403 means invalid key
        return response.status !== 401 && response.status !== 403;
      }
      case 'fal': {
        const { fal } = await import('@fal-ai/client');
        fal.config({ credentials: apiKey });
        // Just check if credentials are set - no simple validation endpoint
        return apiKey && apiKey.length > 10;
      }
      case 'together': {
        const response = await fetch('https://api.together.xyz/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        return response.ok;
      }
      case 'bfl': {
        // BFL doesn't have a simple validation endpoint
        return apiKey && apiKey.length > 10;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error(`API key validation error for ${providerId}:`, error.message);
    return false;
  }
}
