/**
 * Fetch an image from URL and convert to base64
 * @param {string} url - The image URL to fetch
 * @returns {Promise<string>} Base64 encoded image data
 */
export async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}
