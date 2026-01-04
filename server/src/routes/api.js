import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import * as providers from '../services/providers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const STORAGE_PATH = join(__dirname, '../../storage');
const IMAGES_PATH = join(STORAGE_PATH, 'images');
const HISTORY_PATH = join(STORAGE_PATH, 'history.json');
const QUEUE_PATH = join(STORAGE_PATH, 'queue.json');

// Ensure storage directories exist
async function ensureStorage() {
  try {
    await fs.mkdir(IMAGES_PATH, { recursive: true });
    try {
      await fs.access(HISTORY_PATH);
    } catch {
      await fs.writeFile(HISTORY_PATH, '[]');
    }
    try {
      await fs.access(QUEUE_PATH);
    } catch {
      await fs.writeFile(QUEUE_PATH, '[]');
    }
  } catch (error) {
    console.error('Error ensuring storage:', error);
  }
}
ensureStorage();

// Helper to read/write history
async function readHistory() {
  try {
    const data = await fs.readFile(HISTORY_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeHistory(history) {
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2));
}

async function readQueue() {
  try {
    const data = await fs.readFile(QUEUE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeQueue(queue) {
  await fs.writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

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
router.post('/generate', async (req, res) => {
  try {
    const { prompt, provider = 'openai', model, aspectRatio, count = 1 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await providers.generate(provider, {
      prompt,
      model,
      aspectRatio,
      count: Math.min(count, 4)
    });

    if (!result.images || result.images.length === 0) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const variantGroup = count > 1 ? uuidv4() : null;
    const savedImages = [];
    const history = await readHistory();

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
        cost: result.cost / result.images.length,
        variantGroup,
        createdAt: new Date().toISOString()
      };

      history.unshift(historyEntry);
      savedImages.push(historyEntry);
    }

    await writeHistory(history);

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
router.post('/edit', upload.single('image'), async (req, res) => {
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

    const history = await readHistory();
    history.unshift(historyEntry);
    await writeHistory(history);

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
]), async (req, res) => {
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

    const history = await readHistory();
    history.unshift(historyEntry);
    await writeHistory(history);

    res.json({ success: true, ...historyEntry });
  } catch (error) {
    console.error('Inpaint error:', error);
    res.status(500).json({ error: error.message || 'Failed to inpaint image' });
  }
});

// POST /api/upscale - Upscale image
router.post('/upscale', upload.single('image'), async (req, res) => {
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

    const history = await readHistory();
    history.unshift(historyEntry);
    await writeHistory(history);

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

    // Use OpenAI or Gemini for prompt enhancement
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

// Queue endpoints
// POST /api/queue - Add job to queue
router.post('/queue', async (req, res) => {
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

    const queue = await readQueue();
    queue.push(job);
    await writeQueue(queue);

    // Process queue in background
    processQueue();

    res.json({ success: true, job });
  } catch (error) {
    console.error('Queue add error:', error);
    res.status(500).json({ error: 'Failed to add to queue' });
  }
});

// GET /api/queue - Get queue status
router.get('/queue', async (req, res) => {
  try {
    const queue = await readQueue();
    res.json(queue);
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// DELETE /api/queue/:id - Cancel/remove job
router.delete('/queue/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const queue = await readQueue();
    const index = queue.findIndex(job => job.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Job not found' });
    }

    queue.splice(index, 1);
    await writeQueue(queue);

    res.json({ success: true });
  } catch (error) {
    console.error('Queue delete error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Background queue processor
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (true) {
      const queue = await readQueue();
      const pendingJob = queue.find(job => job.status === 'pending');

      if (!pendingJob) break;

      // Mark as processing
      pendingJob.status = 'processing';
      await writeQueue(queue);

      try {
        const result = await providers.generate(pendingJob.provider, {
          prompt: pendingJob.prompt,
          model: pendingJob.model,
          aspectRatio: pendingJob.aspectRatio,
          count: pendingJob.count
        });

        const history = await readHistory();
        const variantGroup = pendingJob.count > 1 ? uuidv4() : null;

        for (const image of result.images) {
          const id = uuidv4();
          const imageUrl = await saveImage(image.imageData, id);

          history.unshift({
            id,
            prompt: pendingJob.prompt,
            type: 'generate',
            provider: pendingJob.provider,
            imageUrl,
            cost: result.cost / result.images.length,
            variantGroup,
            fromQueue: true,
            createdAt: new Date().toISOString()
          });
        }

        await writeHistory(history);

        // Mark as completed and remove from queue
        const updatedQueue = await readQueue();
        const jobIndex = updatedQueue.findIndex(j => j.id === pendingJob.id);
        if (jobIndex !== -1) {
          updatedQueue.splice(jobIndex, 1);
          await writeQueue(updatedQueue);
        }
      } catch (error) {
        console.error('Queue job error:', error);
        const updatedQueue = await readQueue();
        const job = updatedQueue.find(j => j.id === pendingJob.id);
        if (job) {
          job.status = 'failed';
          job.error = error.message;
          await writeQueue(updatedQueue);
        }
      }
    }
  } finally {
    isProcessing = false;
  }
}

// GET /api/stats - Get usage statistics
router.get('/stats', async (req, res) => {
  try {
    const history = await readHistory();

    const stats = {
      totalGenerations: history.length,
      totalCost: history.reduce((sum, h) => sum + (h.cost || 0), 0),
      byProvider: {},
      byType: {},
      last7Days: 0,
      last30Days: 0
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    for (const entry of history) {
      // By provider
      const provider = entry.provider || 'gemini';
      stats.byProvider[provider] = stats.byProvider[provider] || { count: 0, cost: 0 };
      stats.byProvider[provider].count++;
      stats.byProvider[provider].cost += entry.cost || 0;

      // By type
      stats.byType[entry.type] = stats.byType[entry.type] || 0;
      stats.byType[entry.type]++;

      // Time-based
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= sevenDaysAgo) stats.last7Days++;
      if (entryDate >= thirtyDaysAgo) stats.last30Days++;
    }

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/history - Get generation history
router.get('/history', async (req, res) => {
  try {
    const history = await readHistory();
    res.json(history);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// DELETE /api/history/:id - Delete a generation
router.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const history = await readHistory();
    const index = history.findIndex(item => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Delete image file
    try {
      await fs.unlink(join(IMAGES_PATH, `${id}.png`));
    } catch {
      // Image might not exist, continue anyway
    }

    // Remove from history
    history.splice(index, 1);
    await writeHistory(history);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export default router;
