/**
 * Get allowed origins from FRONTEND_URL environment variable.
 * Supports comma-separated list of URLs.
 * @returns {string[]} Array of allowed origin URLs
 */
const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    return ['http://localhost:5173'];
  }
  return frontendUrl.split(',').map(s => s.trim().replace(/\/+$/, ''));
};

module.exports = { getAllowedOrigins };
