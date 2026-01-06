import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import * as providers from '../services/providers/index.js';
import { validateGenerate, validateEdit, validateInpaint, validateUpscale, validateQueue } from '../middleware/validate.js';
import * as db from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const STORAGE_PATH = join(__dirname, '../../storage');
const IMAGES_PATH = join(STORAGE_PATH, 'images');

// Ensure storage directories exist and migrate data
async function ensureStorage() {
  try {
    await fs.mkdir(IMAGES_PATH, { recursive: true });

    // Run migration from JSON if needed
    const migrated = await db.migrateFromJSON();
    if (migrated.history > 0 || migrated.queue > 0) {
      console.log(`Migrated ${migrated.history} history items and ${migrated.queue} queue items to SQLite`);
    }
  } catch (error) {
    console.error('Error ensuring storage:', error);
  }
}
ensureStorage();

async function saveImage(imageData, id) {
  const buffer = Buffer.from(imageData, 'base64');
  const imagePath = join(IMAGES_PATH, `${id}.png`);
  await fs.writeFile(imagePath, buffer);
  return `/api/images/${id}.png`;
}

// GET /api/providers - Get available providers
router.get('/providers', (req, res) => {
  const available = providers.getAvailableProviders();
  res.json(available);
});

// POST /api/generate - Text to image
router.post('/generate', validateGenerate, async (req, res) => {
  try {
    const {
      prompt,
      provider = 'openai',
      model,
      aspectRatio,
      count = 1,
      seed,
      steps,
      cfgScale,
      negativePrompt,
      sampler
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await providers.generate(provider, {
      prompt,
      model,
      aspectRatio,
      count: Math.min(count, 4),
      seed,
      steps,
      cfgScale,
      negativePrompt,
      sampler
    });

    if (!result.images || result.images.length === 0) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const variantGroup = count > 1 ? uuidv4() : null;
    const savedImages = [];
    const perImageCost = result.images.length > 0 ? result.cost / result.images.length : 0;

    for (const image of result.images) {
      const id = uuidv4();
      const imageUrl = await saveImage(image.imageData, id);

      const historyEntry = {
        id,
        prompt,
        type: 'generate',
        provider,
        model,
        aspectRatio,
        imageUrl,
        cost: perImageCost,
        variantGroup,
        createdAt: new Date().toISOString()
      };

      db.addHistory(historyEntry);
      savedImages.push(historyEntry);
    }

    res.json({
      success: true,
      images: savedImages,
      totalCost: result.cost
    });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// POST /api/edit - Edit image with prompt
router.post('/edit', upload.single('image'), validateEdit, async (req, res) => {
  try {
    const { prompt, provider = 'openai' } = req.body;
    const imageFile = req.file;

    if (!prompt || !imageFile) {
      return res.status(400).json({ error: 'Prompt and image are required' });
    }

    const imageBase64 = imageFile.buffer.toString('base64');
    const mimeType = imageFile.mimetype;

    const result = await providers.edit(provider, {
      prompt,
      imageBase64,
      mimeType
    });

    if (!result.images || result.images.length === 0) {
      return res.status(500).json({ error: 'Failed to edit image' });
    }

    const id = uuidv4();
    const imageUrl = await saveImage(result.images[0].imageData, id);

    const historyEntry = {
      id,
      prompt,
      type: 'edit',
      provider,
      imageUrl,
      cost: result.cost,
      createdAt: new Date().toISOString()
    };

    db.addHistory(historyEntry);

    res.json({ success: true, ...historyEntry });
  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({ error: error.message || 'Failed to edit image' });
  }
});

// POST /api/inpaint - Inpaint image with mask
router.post('/inpaint', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mask', maxCount: 1 }
]), validateInpaint, async (req, res) => {
  try {
    const { prompt, provider = 'stability' } = req.body;
    const imageFile = req.files?.image?.[0];
    const maskFile = req.files?.mask?.[0];

    if (!prompt || !imageFile || !maskFile) {
      return res.status(400).json({ error: 'Prompt, image, and mask are required' });
    }

    const imageBase64 = imageFile.buffer.toString('base64');
    const maskBase64 = maskFile.buffer.toString('base64');
    const mimeType = imageFile.mimetype;

    const result = await providers.inpaint(provider, {
      prompt,
      imageBase64,
      maskBase64,
      mimeType
    });

    if (!result.images || result.images.length === 0) {
      return res.status(500).json({ error: 'Failed to inpaint image' });
    }

    const id = uuidv4();
    const imageUrl = await saveImage(result.images[0].imageData, id);

    const historyEntry = {
      id,
      prompt,
      type: 'inpaint',
      provider,
      imageUrl,
      cost: result.cost,
      createdAt: new Date().toISOString()
    };

    db.addHistory(historyEntry);

    res.json({ success: true, ...historyEntry });
  } catch (error) {
    console.error('Inpaint error:', error);
    res.status(500).json({ error: error.message || 'Failed to inpaint image' });
  }
});

// POST /api/upscale - Upscale image
router.post('/upscale', upload.single('image'), validateUpscale, async (req, res) => {
  try {
    const { provider = 'stability', scale = 2 } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const imageBase64 = imageFile.buffer.toString('base64');
    const mimeType = imageFile.mimetype;

    const result = await providers.upscale(provider, {
      imageBase64,
      mimeType,
      scale: parseInt(scale)
    });

    if (!result.images || result.images.length === 0) {
      return res.status(500).json({ error: 'Failed to upscale image' });
    }

    const id = uuidv4();
    const imageUrl = await saveImage(result.images[0].imageData, id);

    const historyEntry = {
      id,
      prompt: `Upscaled ${scale}x`,
      type: 'upscale',
      provider,
      imageUrl,
      cost: result.cost,
      createdAt: new Date().toISOString()
    };

    db.addHistory(historyEntry);

    res.json({ success: true, ...historyEntry });
  } catch (error) {
    console.error('Upscale error:', error);
    res.status(500).json({ error: error.message || 'Failed to upscale image' });
  }
});

// POST /api/enhance-prompt - Enhance prompt with AI
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt, provider = 'openai' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let enhanced;
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing image generation prompts. Enhance the user\'s prompt to be more detailed and descriptive for better image generation results. Keep it concise but add relevant details about style, lighting, composition, and mood. Return only the enhanced prompt, nothing else.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500
      });

      enhanced = response.choices[0].message.content.trim();
    } else if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const response = await model.generateContent(
        `You are an expert at writing image generation prompts. Enhance this prompt to be more detailed and descriptive for better image generation results. Keep it concise but add relevant details about style, lighting, composition, and mood. Return only the enhanced prompt, nothing else.\n\nOriginal prompt: ${prompt}`
      );

      enhanced = response.response.text().trim();
    } else {
      return res.status(400).json({ error: 'No AI provider available for prompt enhancement' });
    }

    res.json({ success: true, original: prompt, enhanced });
  } catch (error) {
    console.error('Enhance error:', error);
    res.status(500).json({ error: error.message || 'Failed to enhance prompt' });
  }
});

// ============ QUEUE ENDPOINTS ============

// POST /api/queue - Add job to queue
router.post('/queue', validateQueue, async (req, res) => {
  try {
    const { prompt, provider = 'openai', model, aspectRatio, count = 1 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const job = {
      id: uuidv4(),
      prompt,
      provider,
      model,
      aspectRatio,
      count,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.addQueue(job);
    processQueue();

    res.json({ success: true, job });
  } catch (error) {
    console.error('Queue add error:', error);
    res.status(500).json({ error: 'Failed to add to queue' });
  }
});

// GET /api/queue - Get queue status
router.get('/queue', (req, res) => {
  try {
    const queue = db.getQueue();
    res.json(queue);
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// DELETE /api/queue/:id - Cancel/remove job
router.delete('/queue/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.deleteQueue(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Queue delete error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// POST /api/queue/:id/retry - Retry a failed job
router.post('/queue/:id/retry', (req, res) => {
  try {
    const { id } = req.params;
    const job = db.getQueueById(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'failed') {
      return res.status(400).json({ error: 'Can only retry failed jobs' });
    }

    db.updateQueue(id, {
      status: 'pending',
      error: null,
      retryCount: (job.retry_count || 0) + 1
    });

    processQueue();

    res.json({ success: true, job: db.getQueueById(id) });
  } catch (error) {
    console.error('Queue retry error:', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

// Background queue processor
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (true) {
      const queue = db.getQueue();
      const pendingJob = queue.find(job => job.status === 'pending');

      if (!pendingJob) break;

      db.updateQueue(pendingJob.id, { status: 'processing' });

      try {
        const result = await providers.generate(pendingJob.provider, {
          prompt: pendingJob.prompt,
          model: pendingJob.model,
          aspectRatio: pendingJob.aspect_ratio,
          count: pendingJob.count
        });

        const variantGroup = pendingJob.count > 1 ? uuidv4() : null;
        const perImageCost = result.images.length > 0 ? result.cost / result.images.length : 0;

        for (const image of result.images) {
          const id = uuidv4();
          const imageUrl = await saveImage(image.imageData, id);

          db.addHistory({
            id,
            prompt: pendingJob.prompt,
            type: 'generate',
            provider: pendingJob.provider,
            imageUrl,
            cost: perImageCost,
            variantGroup,
            createdAt: new Date().toISOString()
          });
        }

        db.deleteQueue(pendingJob.id);
      } catch (error) {
        console.error('Queue job error:', error);
        db.updateQueue(pendingJob.id, {
          status: 'failed',
          error: error.message
        });
      }
    }
  } finally {
    isProcessing = false;
  }
}

// ============ STATS ENDPOINT ============

router.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();

    // Transform for frontend compatibility
    const byProvider = {};
    for (const p of stats.byProvider) {
      byProvider[p.provider || 'unknown'] = { count: p.count, cost: p.cost };
    }

    const byType = {};
    for (const t of stats.byType) {
      byType[t.type] = t.count;
    }

    // Calculate 7/30 day counts
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const last7Days = stats.recentCosts
      .filter(r => r.date >= sevenDaysAgo)
      .reduce((sum, r) => sum + r.count, 0);

    const last30Days = stats.recentCosts
      .filter(r => r.date >= thirtyDaysAgo)
      .reduce((sum, r) => sum + r.count, 0);

    res.json({
      totalGenerations: stats.totalGenerations,
      totalCost: stats.totalCost,
      byProvider,
      byType,
      last7Days,
      last30Days,
      recentCosts: stats.recentCosts
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============ HISTORY ENDPOINTS ============

router.get('/history', (req, res) => {
  try {
    const { page, limit, type, provider, search } = req.query;

    const result = db.getHistory({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 0,
      type: type || null,
      provider: provider || null,
      search: search || null
    });

    // Map database columns to frontend format
    if (Array.isArray(result)) {
      res.json(result.map(mapHistoryItem));
    } else {
      res.json({
        items: result.items.map(mapHistoryItem),
        pagination: result.pagination
      });
    }
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

function mapHistoryItem(item) {
  return {
    id: item.id,
    prompt: item.prompt,
    type: item.type,
    provider: item.provider,
    model: item.model,
    aspectRatio: item.aspect_ratio,
    imageUrl: item.image_url,
    cost: item.cost,
    variantGroup: item.variant_group,
    collectionId: item.collection_id,
    createdAt: item.created_at
  };
}

router.delete('/history', async (req, res) => {
  try {
    const history = db.getHistory();
    const items = Array.isArray(history) ? history : history.items || [];

    // Delete all image files
    for (const item of items) {
      try {
        await fs.unlink(join(IMAGES_PATH, `${item.id}.png`));
      } catch {
        // Continue
      }
    }

    const result = db.clearHistory();
    res.json({ success: true, deleted: result.changes });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

router.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete image file
    try {
      await fs.unlink(join(IMAGES_PATH, `${id}.png`));
    } catch {
      // Continue
    }

    const deleted = db.deleteHistory(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ============ COLLECTIONS ENDPOINTS ============

router.get('/collections', (req, res) => {
  try {
    const collections = db.getCollections() || [];
    res.json(collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      itemCount: c.item_count || 0,
      createdAt: c.created_at
    })));
  } catch (error) {
    console.error('Collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

router.post('/collections', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const collection = {
      id: uuidv4(),
      name,
      description,
      createdAt: new Date().toISOString()
    };

    db.addCollection(collection);
    res.json({ success: true, collection });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

router.put('/collections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    db.updateCollection(id, { name, description });
    res.json({ success: true });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

router.delete('/collections/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.deleteCollection(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

router.get('/collections/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const items = db.getHistory({ collectionId: id });
    const result = Array.isArray(items) ? items : items.items || [];
    res.json(result.map(mapHistoryItem));
  } catch (error) {
    console.error('Collection items error:', error);
    res.status(500).json({ error: 'Failed to fetch collection items' });
  }
});

router.post('/history/:id/collection', (req, res) => {
  try {
    const { id } = req.params;
    const { collectionId } = req.body;

    db.updateHistoryCollection(id, collectionId || null);
    res.json({ success: true });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// ============ FAVORITES ENDPOINTS ============

router.get('/favorites', (req, res) => {
  try {
    const favorites = db.getFavorites();
    res.json(favorites.map(mapHistoryItem));
  } catch (error) {
    console.error('Favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

router.post('/favorites/:historyId', (req, res) => {
  try {
    const { historyId } = req.params;
    const id = uuidv4();
    db.addFavorite(id, historyId);
    res.json({ success: true });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

router.delete('/favorites/:historyId', (req, res) => {
  try {
    const { historyId } = req.params;
    db.removeFavorite(historyId);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// ============ SETUP & SETTINGS ENDPOINTS ============

// Provider metadata for UI
const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI DALL-E',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...',
    description: 'DALL-E 3 and DALL-E 2 image generation'
  },
  stability: {
    name: 'Stability AI',
    keyUrl: 'https://platform.stability.ai/account/keys',
    keyPlaceholder: 'sk-...',
    description: 'Stable Diffusion models'
  },
  replicate: {
    name: 'Replicate',
    keyUrl: 'https://replicate.com/account/api-tokens',
    keyPlaceholder: 'r8_...',
    description: 'Flux and SDXL models'
  },
  gemini: {
    name: 'Google Gemini',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyPlaceholder: 'AIza...',
    description: 'Gemini 2.0 Flash image generation'
  },
  ideogram: {
    name: 'Ideogram',
    keyUrl: 'https://ideogram.ai/manage-api',
    keyPlaceholder: 'api-...',
    description: 'Ideogram V2 image generation'
  },
  fal: {
    name: 'FAL.ai',
    keyUrl: 'https://fal.ai/dashboard/keys',
    keyPlaceholder: 'key-...',
    description: 'Flux and SDXL models'
  },
  together: {
    name: 'Together AI',
    keyUrl: 'https://api.together.xyz/settings/api-keys',
    keyPlaceholder: 'tok-...',
    description: 'Flux models'
  },
  bfl: {
    name: 'Black Forest Labs',
    keyUrl: 'https://api.bfl.ml',
    keyPlaceholder: 'bfl-...',
    description: 'Native Flux models'
  }
};

// GET /api/setup/status - Check if setup is complete
router.get('/setup/status', (req, res) => {
  try {
    const setupComplete = db.isSetupComplete();
    const configuredProviders = db.getConfiguredProviders();
    const hasEnvKeys = checkEnvKeys();

    res.json({
      setupComplete: setupComplete || hasEnvKeys.length > 0,
      configuredProviders: [...new Set([...configuredProviders, ...hasEnvKeys])],
      providerInfo: PROVIDER_INFO
    });
  } catch (error) {
    console.error('Setup status error:', error);
    res.status(500).json({ error: 'Failed to check setup status' });
  }
});

// POST /api/setup/complete - Mark setup as complete
router.post('/setup/complete', (req, res) => {
  try {
    db.markSetupComplete();
    res.json({ success: true });
  } catch (error) {
    console.error('Setup complete error:', error);
    res.status(500).json({ error: 'Failed to mark setup complete' });
  }
});

// GET /api/settings/api-keys - List all configured API keys (masked)
router.get('/settings/api-keys', (req, res) => {
  try {
    const dbKeys = db.getAllApiKeys();
    const envKeys = checkEnvKeys();

    // Merge DB keys with env keys info
    const allKeys = [...dbKeys];

    for (const provider of envKeys) {
      if (!allKeys.find(k => k.provider === provider)) {
        allKeys.push({
          provider,
          apiKey: '(from environment)',
          isValid: true,
          source: 'env'
        });
      }
    }

    res.json({
      keys: allKeys,
      providerInfo: PROVIDER_INFO
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// POST /api/settings/api-keys - Save an API key
router.post('/settings/api-keys', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and apiKey are required' });
    }

    if (!PROVIDER_INFO[provider]) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Save the key
    db.setApiKey(provider, apiKey);

    // Reload providers
    providers.reloadProviders();

    res.json({ success: true, provider });
  } catch (error) {
    console.error('Save API key error:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// DELETE /api/settings/api-keys/:provider - Delete an API key
router.delete('/settings/api-keys/:provider', (req, res) => {
  try {
    const { provider } = req.params;

    const deleted = db.deleteApiKey(provider);
    if (!deleted) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Reload providers
    providers.reloadProviders();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// POST /api/settings/api-keys/validate - Validate an API key without saving
router.post('/settings/api-keys/validate', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and apiKey are required' });
    }

    const isValid = await providers.validateApiKey(provider, apiKey);

    res.json({ valid: isValid, provider });
  } catch (error) {
    console.error('Validate API key error:', error);
    res.json({ valid: false, error: error.message });
  }
});

// Helper to check which providers have env keys configured
function checkEnvKeys() {
  const envProviders = [];
  if (process.env.OPENAI_API_KEY) envProviders.push('openai');
  if (process.env.STABILITY_API_KEY) envProviders.push('stability');
  if (process.env.REPLICATE_API_TOKEN) envProviders.push('replicate');
  if (process.env.GEMINI_API_KEY) envProviders.push('gemini');
  if (process.env.IDEOGRAM_API_KEY) envProviders.push('ideogram');
  if (process.env.FAL_KEY) envProviders.push('fal');
  if (process.env.TOGETHER_API_KEY) envProviders.push('together');
  if (process.env.BFL_API_KEY) envProviders.push('bfl');
  return envProviders;
}

// ============ EXPORT/IMPORT ENDPOINTS ============

router.get('/export', (req, res) => {
  try {
    const data = db.exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=sakuga-export.json');
    res.json(data);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

router.post('/import', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const data = req.body;

    if (!data || (!data.history && !data.collections)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const result = db.importData(data);
    res.json({ success: true, imported: result });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

export default router;
