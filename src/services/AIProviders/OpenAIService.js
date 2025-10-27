import BaseService from '../BaseService';
import PromptService from '../PromptService';

/**
 * OpenAIService - Handles OpenAI API integration for form field extraction
 * Uses GPT-4o (with vision) to analyze form images and extract field data
 */
class OpenAIService extends BaseService {
  constructor() {
    super('https://api.openai.com/v1');
    this.apiKey = this.getEnvVar('VITE_OPENAI_API_KEY');
  }

  /**
   * Extract form fields from an image using GPT-4o
   * @param {File} imageFile - The form image file
   * @returns {Promise<object>} Extracted form data
   */
  async extractFormFields(imageFile) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
    }

    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Prepare the request
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: PromptService.getFieldsExtractionPrompt()
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      // Parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse form data from AI response');
    } catch (error) {
      console.error('OpenAI form extraction failed:', error);
      throw error;
    }
  }


  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

export default new OpenAIService();

