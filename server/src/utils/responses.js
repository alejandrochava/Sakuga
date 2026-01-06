/**
 * Standard HTTP response helpers for consistent error handling
 */

export const badRequest = (res, message) =>
  res.status(400).json({ error: message });

export const notFound = (res, message = 'Not found') =>
  res.status(404).json({ error: message });

export const serverError = (res, error, fallback = 'Server error') => {
  console.error(fallback, error);
  return res.status(500).json({ error: error.message || fallback });
};

export const success = (res, data = {}) =>
  res.json({ success: true, ...data });
