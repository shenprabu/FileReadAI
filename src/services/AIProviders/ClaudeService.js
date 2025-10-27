import BaseService from '../BaseService';
import PromptService from '../PromptService';

/**
 * ClaudeService - Handles Anthropic Claude API integration for form field extraction
 * Uses Claude 3 with vision to analyze form images and extract field data
 * 
 * Get API key: https://console.anthropic.com/
 */
class ClaudeService extends BaseService {
  constructor() {
    super('https://api.anthropic.com/v1');
    this.apiKey = this.getEnvVar('VITE_CLAUDE_API_KEY');
    this.model = 'claude-3-5-sonnet-20241022'; // Latest Claude 3.5 Sonnet with vision
  }

  /**
   * Extract form fields from an image using Claude
   * @param {File} imageFile - The form image file
   * @returns {Promise<object>} Extracted form data
   */
  async extractFormFields(imageFile) {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured. Please set VITE_CLAUDE_API_KEY in your .env file');
    }

    try {
      // Convert image to base64 (without data URL prefix)
      const base64Image = await this.fileToBase64(imageFile);
      const base64Data = base64Image.split(',')[1]; // Remove data:image/...;base64, prefix
      
      // Get media type (Claude uses specific format)
      let mediaType = imageFile.type || 'image/jpeg';
      // Claude expects format like "image/jpeg", "image/png", "image/webp", "image/gif"
      
      // Prepare the request
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data
                  }
                },
                {
                  type: 'text',
                  text: PromptService.getFieldsExtractionPrompt()
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Claude API request failed');
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;
      
      if (!content) {
        throw new Error('No response from Claude API');
      }
      
      // Parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse form data from AI response');
    } catch (error) {
      console.error('Claude form extraction failed:', error);
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

export default new ClaudeService();

