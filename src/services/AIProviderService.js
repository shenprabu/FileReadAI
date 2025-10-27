import OpenAIService from './AIProviders/OpenAIService';
import GeminiService from './AIProviders/GeminiService';
import ClaudeService from './AIProviders/ClaudeService';

/**
 * AIProviderService - Manages multiple AI providers and routes requests
 * Acts as a facade for OpenAI, Gemini, and Claude services
 */
class AIProviderService {
  constructor() {
    this.providers = {
      'gpt-4o': {
        name: 'GPT-4o',
        service: OpenAIService,
        description: 'OpenAI GPT-4 with Vision',
        icon: '🤖',
        cost: 'Paid ($0.01-0.03/image)',
        isConfigured: () => OpenAIService.isConfigured()
      },
      'gemini': {
        name: 'Gemini 2.5',
        service: GeminiService,
        description: 'Google Gemini Pro Vision',
        icon: '✨',
        cost: 'Free (60 req/min)',
        isConfigured: () => GeminiService.isConfigured()
      },
      'claude': {
        name: 'Claude 3.5',
        service: ClaudeService,
        description: 'Anthropic Claude Sonnet',
        icon: '🧠',
        cost: 'Paid (~$0.02/image)',
        isConfigured: () => ClaudeService.isConfigured()
      }
    };

    this.currentProvider = this.getDefaultProvider();
  }

  /**
   * Get default provider (first configured one)
   * @returns {string} Provider key
   */
  getDefaultProvider() {
    // Try providers in order: Gemini (free), GPT-4o, Claude
    const priorityOrder = ['gemini', 'gpt-4o', 'claude'];
    
    for (const provider of priorityOrder) {
      if (this.providers[provider].isConfigured()) {
        return provider;
      }
    }
    
    // Default to GPT-4o even if not configured (will show error later)
    return 'gpt-4o';
  }

  /**
   * Set the current AI provider
   * @param {string} providerKey - Provider key (gpt-4o, gemini, claude)
   */
  setProvider(providerKey) {
    if (!this.providers[providerKey]) {
      throw new Error(`Unknown provider: ${providerKey}`);
    }
    this.currentProvider = providerKey;
  }

  /**
   * Get current provider key
   * @returns {string} Current provider key
   */
  getCurrentProvider() {
    return this.currentProvider;
  }

  /**
   * Get list of all available providers
   * @returns {Array} List of provider info
   */
  getAvailableProviders() {
    return Object.entries(this.providers).map(([key, info]) => ({
      key,
      name: info.name,
      description: info.description,
      icon: info.icon,
      cost: info.cost,
      configured: info.isConfigured()
    }));
  }

  /**
   * Check if current provider is configured
   * @returns {boolean} True if configured
   */
  isCurrentProviderConfigured() {
    return this.providers[this.currentProvider].isConfigured();
  }

  /**
   * Get the service instance for current provider
   * @returns {object} Service instance
   */
  getCurrentService() {
    return this.providers[this.currentProvider].service;
  }

  /**
   * Extract form fields using current provider
   * @param {File} imageFile - The form image file
   * @returns {Promise<object>} Extracted form data
   */
  async extractFormFields(imageFile) {
    const service = this.getCurrentService();
    
    if (!this.isCurrentProviderConfigured()) {
      const providerInfo = this.providers[this.currentProvider];
      throw new Error(
        `${providerInfo.name} is not configured. Please add the API key to your .env file. ` +
        `Alternatively, try another provider from the dropdown.`
      );
    }

    try {
      return await service.extractFormFields(imageFile);
    } catch (error) {
      console.error(`${this.currentProvider} extraction failed:`, error);
      throw error;
    }
  }


  /**
   * Get provider info by key
   * @param {string} providerKey - Provider key
   * @returns {object} Provider info
   */
  getProviderInfo(providerKey) {
    const provider = this.providers[providerKey];
    if (!provider) return null;

    return {
      key: providerKey,
      name: provider.name,
      description: provider.description,
      icon: provider.icon,
      cost: provider.cost,
      configured: provider.isConfigured()
    };
  }
}

export default new AIProviderService();

