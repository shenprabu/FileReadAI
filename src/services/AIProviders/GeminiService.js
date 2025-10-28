import BaseService from '../BaseService';
import PromptService from '../PromptService';

/**
 * GeminiService - Handles Google Gemini API integration for form field extraction
 * Uses Gemini Pro Vision to analyze form images and extract field data
 * 
 * Free tier: 60 requests per minute
 * Get API key: https://aistudio.google.com/app/apikey
 */
class GeminiService extends BaseService {
  constructor() {
    super('https://generativelanguage.googleapis.com/v1beta');
    this.apiKey = this.getEnvVar('VITE_GEMINI_API_KEY');
    this.model = this.getEnvVar('VITE_GEMINI_MODEL') || 'gemini-2.5-flash'; // Use flash for speed, can switch to 'gemini-1.5-pro' for better accuracy
    this.maxOutputTokens = parseInt(this.getEnvVar('VITE_GEMINI_MAX_OUTPUT_TOKENS') || '8192', 10);
  }

  /**
   * Parse JSON from AI response text
   * Handles markdown code blocks, escaped quotes, and malformed JSON
   * @param {string} content - The AI response text
   * @returns {object} Parsed JSON object
   * @private
   */
  parseJsonFromResponse(content) {
    // Try to parse JSON from the response
    // First, try to find JSON within markdown code blocks
    let jsonStr = content;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Extract JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in AI response');
    }
    
    // Clean up escaped quotes and other escape sequences
    let cleanedJson = jsonMatch[0]
      .replace(/\\"/g, '"')  // Replace \" with "
      .replace(/\\'/g, "'")  // Replace \' with '
      .replace(/\\\\/g, '\\'); // Replace \\ with \
    
    try {
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse:', cleanedJson);
      throw new Error('Could not parse JSON from AI response');
    }
  }

  /**
   * Extract form fields from an image using Gemini
   * @param {File} imageFile - The form image file
   * @returns {Promise<object>} Extracted form data
   */
  async extractFormFields(imageFile) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file');
    }

    try {
      // Convert image to base64 (without data URL prefix)
      const base64Image = await this.fileToBase64(imageFile);
      const base64Data = base64Image.split(',')[1]; // Remove data:image/...;base64, prefix
      
      // Get MIME type
      const mimeType = imageFile.type || 'image/jpeg';
      
      // Prepare the request
      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: PromptService.getFieldsExtractionPrompt()
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: this.maxOutputTokens,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE'
              }
            ]
          })
        }
      );

      const data = await response.json();
      console.log('data', data);
      if(data.candidates[0].finishReason !== 'STOP') {
        // retry for MAX_TOKENS
        throw new Error(`Gemini API request finished with ${data.candidates[0].finishReason}`);
      }

      const content = data.candidates[0].content.parts
        .map((p) => p.text || "").join("")
        .replace(/```json/g, "").replace(/```/g, "").replace(/\\"/g, "'").replace(/\\'/g, "'").replace(/\\\\/g, '\\')
        .trim();
      console.log('content', content);
      
      if (!content) {
        throw new Error('Empty response from Gemini API');
      }
      
      return this.parseJsonFromResponse(content);
    } catch (error) {
      console.error('Gemini form extraction failed:', error);
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

export default new GeminiService();

