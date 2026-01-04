import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { generateImage, editImage, imageToImage } from '../services/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const STORAGE_PATH = join(__dirname, '../../storage');
const IMAGES_PATH = join(STORAGE_PATH, 'images');
const HISTORY_PATH = join(STORAGE_PATH, 'history.json');

// Ensure storage directories exist
async function ensureStorage() {
  try {
    await fs.mkdir(IMAGES_PATH, { recursive: true });
    try {
      await fs.access(HISTORY_PATH);
    } catch {
      await fs.writeFile(HISTORY_PATH, '[]');
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

async function saveImage(imageData, id) {
  const buffer = Buffer.from(imageData, 'base64');
  const imagePath = join(IMAGES_PATH, `${id}.png`);
  await fs.writeFile(imagePath, buffer);
  return `/api/images/${id}.png`;
}

// POST /api/generate - Text to image
router.post('/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await generateImage(prompt, aspectRatio);

    if (!result.imageData) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const id = uuidv4();
    const imageUrl = await saveImage(result.imageData, id);

    const historyEntry = {
      id,
      prompt,
      type: 'generate',
      aspectRatio,
      imageUrl,
      createdAt: new Date().toISOString()
    };

    const history = await readHistory();
    history.unshift(historyEntry);
    await writeHistory(history);

    res.json({ success: true, ...historyEntry });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// POST /api/edit - Edit image with prompt
router.post('/edit', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageFile = req.file;

    if (!prompt || !imageFile) {
      return res.status(400).json({ error: 'Prompt and image are required' });
    }

    const imageBase64 = imageFile.buffer.toString('base64');
    const mimeType = imageFile.mimetype;

    const result = await editImage(prompt, imageBase64, mimeType);

    if (!result.imageData) {
      return res.status(500).json({ error: 'Failed to edit image' });
    }

    const id = uuidv4();
    const imageUrl = await saveImage(result.imageData, id);

    const historyEntry = {
      id,
      prompt,
      type: 'edit',
      imageUrl,
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

// POST /api/image-to-image - Transform image based on prompt + reference
router.post('/image-to-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageFile = req.file;

    if (!prompt || !imageFile) {
      return res.status(400).json({ error: 'Prompt and image are required' });
    }

    const imageBase64 = imageFile.buffer.toString('base64');
    const mimeType = imageFile.mimetype;

    const result = await imageToImage(prompt, imageBase64, mimeType);

    if (!result.imageData) {
      return res.status(500).json({ error: 'Failed to transform image' });
    }

    const id = uuidv4();
    const imageUrl = await saveImage(result.imageData, id);

    const historyEntry = {
      id,
      prompt,
      type: 'image-to-image',
      imageUrl,
      createdAt: new Date().toISOString()
    };

    const history = await readHistory();
    history.unshift(historyEntry);
    await writeHistory(history);

    res.json({ success: true, ...historyEntry });
  } catch (error) {
    console.error('Image-to-image error:', error);
    res.status(500).json({ error: error.message || 'Failed to transform image' });
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

// GET /api/images/:id - Serve saved image (handled by static middleware in index.js)

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
