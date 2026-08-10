/**
 * Truncate long table cell values for consistent list UI.
 * @param {unknown} text
 * @param {number} [maxLength=40]
 * @returns {string}
 */
export const truncateText = (text, maxLength = 40) => {
    if (text == null || text === '') return '';
    const value = String(text);
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};
