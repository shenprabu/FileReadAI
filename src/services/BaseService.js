/**
 * BaseService - Foundation for all service classes
 * Provides common functionality for environment variables and file conversion
 */
class BaseService {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  /**
   * Get environment variable
   */
  getEnvVar(key) {
    return import.meta.env[key];
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
}

export default BaseService;

