import BaseService from './BaseService';

/**
 * FormProcessingService - Handles form preprocessing and post-processing
 * Provides utilities for image optimization, field validation, and data formatting
 */
class FormProcessingService extends BaseService {
  /**
   * Validate image or PDF file
   * @param {File} file - Image or PDF file to validate
   * @returns {object} Validation result
   */
  validateImageFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Please upload JPG, PNG, WebP images or PDF files.' 
      };
    }
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'File too large. Maximum size is 10MB.' 
      };
    }
    
    return { valid: true };
  }

  /**
   * Check if file is a PDF
   * @param {File} file - File to check
   * @returns {boolean}
   */
  isPDF(file) {
    return file.type === 'application/pdf';
  }

  /**
   * Convert PDF to image (first page)
   * @param {File} pdfFile - PDF file
   * @returns {Promise<Blob>} Image blob
   */
  async convertPDFToImage(pdfFile) {
    try {
      // Dynamically import pdf.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker path
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Load PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Get first page
      const page = await pdf.getPage(1);
      
      // Set scale for good quality
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert PDF to image'));
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }

  /**
   * Convert specific PDF page to image
   * @param {File} pdfFile - PDF file
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {Promise<Blob>} Image blob
   */
  async convertPDFPageToImage(pdfFile, pageNumber) {
    try {
      // Dynamically import pdf.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker path
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Load PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Get specified page
      const page = await pdf.getPage(pageNumber);
      
      // Set scale for good quality
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert PDF to image'));
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert PDF page ${pageNumber}: ${error.message}`);
    }
  }

  /**
   * Get number of pages in PDF
   * @param {File} pdfFile - PDF file
   * @returns {Promise<number>} Number of pages
   */
  async getPDFPageCount(pdfFile) {
    try {
      // Dynamically import pdf.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker path
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Load PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      return pdf.numPages;
    } catch (error) {
      console.error('Error getting PDF page count:', error);
      throw new Error(`Failed to get PDF page count: ${error.message}`);
    }
  }

  /**
   * Compress and optimize image before sending to AI
   * @param {File} file - Original image file
   * @param {number} maxWidth - Maximum width
   * @returns {Promise<Blob>} Optimized image
   */
  async optimizeImage(file, maxWidth = 1920) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Scale down if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image optimization failed'));
            }
          },
          file.type,
          0.9 // Quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Format extracted fields for display/export
   * @param {object} rawData - Raw AI response
   * @param {number} pageNumber - Page number (optional, defaults to 1)
   * @returns {object} Formatted data
   */
  formatExtractedData(rawData, pageNumber = 1) {
    if (!rawData || !rawData.fields) {
      return {
        fields: [],
        formTitle: 'Unknown Form',
        extractedAt: new Date().toISOString()
      };
    }

    // Don't include summary in formatted data
    const { summary, ...dataWithoutSummary } = rawData;

    return {
      ...dataWithoutSummary,
      extractedAt: new Date().toISOString(),
      fields: rawData.fields.map((field, index) => ({
        id: `field_${index}_${pageNumber}`,
        label: field.label || `Field ${index + 1}`,
        value: field.value || '',
        type: field.type || 'text',
        confidence: field.confidence || 0.8,
        verified: false,
        boundingBox: field.boundingBox || null
      }))
    };
  }

  /**
   * Export form data to JSON
   * @param {object} formData - Form data to export
   * @returns {string} JSON string
   */
  exportToJSON(formData) {
    return JSON.stringify(formData, null, 2);
  }

  /**
   * Export form data to CSV
   * @param {object} formData - Form data to export
   * @returns {string} CSV string
   */
  exportToCSV(formData) {
    if (!formData.fields || formData.fields.length === 0) {
      return 'No data to export';
    }

    const headers = ['Label', 'Value', 'Type', 'Confidence', 'Verified'];
    const rows = formData.fields.map(field => [
      field.label,
      field.value,
      field.type,
      field.confidence,
      field.verified ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download file helper
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

}

export default new FormProcessingService();

