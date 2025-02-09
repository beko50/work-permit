const path = require('path');
const fs = require('fs').promises;
const { poolPromise, sql } = require('../db');

const fileController = {
  async uploadFile(file) {
    try {
      // Convert file to base64
      const base64Data = file.buffer.toString('base64');
      
      // Add proper data URI prefix for images
      const mimeType = file.mimetype;
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      
      return dataUri;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }
};

module.exports = fileController;