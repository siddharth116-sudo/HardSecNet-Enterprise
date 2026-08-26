/**
 * Calculate the compliance score percentage based on checks.
 * @param {Array} checks - List of audit checks.
 * @returns {number} Score from 0 to 100.
 */
export const calculateScore = (checks) => {
    if (!checks || checks.length === 0) return 0;
    const passed = checks.filter(c => c.Status === 'Compliant').length;
    return Math.round((passed / checks.length) * 100);
};

/**
 * Format timestamp if needed (currently simple passthrough but good for future).
 * @param {string} timestamp 
 * @returns {string}
 */
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
};
