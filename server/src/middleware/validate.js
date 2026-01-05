import { ValidationError } from '../utils/errors.js';

const VALID_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
const MAX_PROMPT_LENGTH = 4000;
const MAX_COUNT = 4;
const VALID_SCALES = [2, 4];

/**
 * Validate generate request
 */
export function validateGenerate(req, res, next) {
  const { prompt, count, aspectRatio } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return next(new ValidationError('Prompt is required'));
  }

  if (prompt.trim().length === 0) {
    return next(new ValidationError('Prompt cannot be empty'));
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return next(new ValidationError(`Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`));
  }

  if (count !== undefined) {
    const countNum = Number(count);
    if (isNaN(countNum) || countNum < 1 || countNum > MAX_COUNT) {
      return next(new ValidationError(`Count must be between 1 and ${MAX_COUNT}`));
    }
  }

  if (aspectRatio && !VALID_ASPECT_RATIOS.includes(aspectRatio)) {
    return next(new ValidationError(`Invalid aspect ratio. Valid options: ${VALID_ASPECT_RATIOS.join(', ')}`));
  }

  next();
}

/**
 * Validate edit/inpaint request
 */
export function validateEdit(req, res, next) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return next(new ValidationError('Prompt is required'));
  }

  if (prompt.trim().length === 0) {
    return next(new ValidationError('Prompt cannot be empty'));
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return next(new ValidationError(`Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`));
  }

  if (!req.file && !req.files?.image) {
    return next(new ValidationError('Image is required'));
  }

  next();
}

/**
 * Validate inpaint request (extends edit validation)
 */
export function validateInpaint(req, res, next) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return next(new ValidationError('Prompt is required'));
  }

  if (prompt.trim().length === 0) {
    return next(new ValidationError('Prompt cannot be empty'));
  }

  if (!req.files?.image?.[0]) {
    return next(new ValidationError('Image is required'));
  }

  if (!req.files?.mask?.[0]) {
    return next(new ValidationError('Mask is required'));
  }

  next();
}

/**
 * Validate upscale request
 */
export function validateUpscale(req, res, next) {
  const { scale } = req.body;

  if (!req.file) {
    return next(new ValidationError('Image is required'));
  }

  if (scale !== undefined) {
    const scaleNum = Number(scale);
    if (!VALID_SCALES.includes(scaleNum)) {
      return next(new ValidationError(`Scale must be one of: ${VALID_SCALES.join(', ')}`));
    }
  }

  next();
}

/**
 * Validate queue request
 */
export function validateQueue(req, res, next) {
  const { prompt, count } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return next(new ValidationError('Prompt is required'));
  }

  if (prompt.trim().length === 0) {
    return next(new ValidationError('Prompt cannot be empty'));
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return next(new ValidationError(`Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`));
  }

  if (count !== undefined) {
    const countNum = Number(count);
    if (isNaN(countNum) || countNum < 1 || countNum > MAX_COUNT) {
      return next(new ValidationError(`Count must be between 1 and ${MAX_COUNT}`));
    }
  }

  next();
}
