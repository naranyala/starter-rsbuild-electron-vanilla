/**
 * Example backend utility function
 * This demonstrates the backend lib folder structure
 */

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function logWithTimestamp(message) {
  const timestamp = formatDate(new Date());
  console.log(`[${timestamp}] ${message}`);
}

module.exports = {
  formatDate,
  logWithTimestamp,
};
