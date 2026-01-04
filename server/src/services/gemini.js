import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = 'gemini-2.0-flash-exp';

// Text to image generation
export async function generateImage(prompt, aspectRatio = '1:1') {
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseModalities: ['Text', 'Image']
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
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
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        text: prompt
      },
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ],
    config: {
      responseModalities: ['Text', 'Image']
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
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
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        text: `Transform this image: ${prompt}`
      },
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ],
    config: {
      responseModalities: ['Text', 'Image']
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData) {
      return {
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType
      };
    }
  }

  throw new Error('No image generated');
}
