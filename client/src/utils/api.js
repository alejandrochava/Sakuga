/**
 * API utility with consistent error handling
 */

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Make an API request with consistent error handling
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - The parsed JSON response
 * @throws {ApiError} - On request failure or invalid response
 */
export async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new ApiError(
      'Network error. Please check your connection.',
      0,
      null
    );
  }

  let data = null;

  try {
    const text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  } catch (error) {
    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        null
      );
    }
    throw new ApiError(
      'Invalid response format from server',
      response.status,
      null
    );
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

/**
 * POST JSON data to an API endpoint
 * @param {string} url - The URL to post to
 * @param {object} body - The data to send
 * @returns {Promise<any>} - The parsed JSON response
 */
export async function postJson(url, body) {
  return apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

/**
 * POST FormData to an API endpoint
 * @param {string} url - The URL to post to
 * @param {FormData} formData - The form data to send
 * @returns {Promise<any>} - The parsed JSON response
 */
export async function postFormData(url, formData) {
  return apiRequest(url, {
    method: 'POST',
    body: formData
  });
}
