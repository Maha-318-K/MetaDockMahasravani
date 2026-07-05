const Tesseract = require('tesseract.js');

/**
 * Extracts text from an image using Tesseract.js
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromImage = async (imagePath) => {
  try {
    const result = await Tesseract.recognize(imagePath, 'eng');
    return result.data.text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    return '';
  }
};

module.exports = {
  extractTextFromImage
};
