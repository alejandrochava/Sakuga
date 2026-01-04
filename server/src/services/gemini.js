import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = 'gemini-2.0-flash-exp-image-generation';

// Text to image generation
export async function generateImage(prompt, aspectRatio = '1:1') {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseModalities: ['Text', 'Image']
    }
  });

  const response = await model.generateContent(prompt);
  const result = response.response;

  for (const part of result.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType
      };
    }
  }

  throw new Error('No image generated');
}

// Edit existing image with prompt
export async function editImage(prompt, imageBase64, mimeType) {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseModalities: ['Text', 'Image']
    }
  });

  const response = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    }
  ]);
  const result = response.response;

  for (const part of result.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType
      };
    }
  }

  throw new Error('No image generated');
}

// Image to image transformation
export async function imageToImage(prompt, imageBase64, mimeType) {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseModalities: ['Text', 'Image']
    }
  });

  const response = await model.generateContent([
    { text: `Transform this image: ${prompt}` },
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    }
  ]);
  const result = response.response;

  for (const part of result.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType
      };
    }
  }

  throw new Error('No image generated');
}
