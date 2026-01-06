/**
 * Download an image to the user's device
 * @param {string} url - The image URL
 * @param {string} filename - The download filename
 */
export function downloadImage(url, filename = `sakuga-${Date.now()}.png`) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
