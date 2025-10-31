import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AIProviderService from '../services/AIProviderService';
import FormProcessingService from '../services/FormProcessingService';

/**
 * Form Store - Manages form processing state using Zustand
 * Integrates with AI services for form field extraction
 * 
 * Features:
 * - File upload and validation
 * - AI-powered field extraction
 * - Field editing and verification
 * - Export functionality
 * - Processing history
 */
const useFormStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        currentForm: null,            // Currently uploaded form image
        originalFile: null,           // Original uploaded file (for PDFs)
        extractedData: null,          // Extracted form data from AI
        processing: false,            // AI processing state
        error: null,                  // Error messages
        history: [],                  // Processing history
        imagePreview: null,           // Image preview URL
        selectedProvider: AIProviderService.getCurrentProvider(), // Selected AI provider
        isPDF: false,                 // Whether current file is PDF
        currentPage: 1,               // Current PDF page being viewed
        totalPages: 1,                // Total pages in PDF
        processingPage: null,         // Current page being processed during extraction
        highlightedFieldId: null,     // Field ID to highlight on the image

        // Actions
        
        /**
         * Upload and validate form image or PDF
         * @param {File} file - Form image or PDF file
         */
        uploadForm: async (file) => {
          set({ processing: true, error: null });

          try {
            // Validate file
            const validation = FormProcessingService.validateImageFile(file);
            if (!validation.valid) {
              throw new Error(validation.error);
            }

            let fileToProcess = file;
            let previewURL;
            const isPDFFile = FormProcessingService.isPDF(file);
            let pageCount = 1;

            // If PDF, convert first page to image
            if (isPDFFile) {
              pageCount = await FormProcessingService.getPDFPageCount(file);
              const imageBlob = await FormProcessingService.convertPDFToImage(file);
              // Keep original filename for display, but process as image
              fileToProcess = new File([imageBlob], file.name, { type: 'image/png' });
              previewURL = URL.createObjectURL(imageBlob);
            } else {
              previewURL = URL.createObjectURL(file);
            }

            set({
              currentForm: fileToProcess,
              originalFile: isPDFFile ? file : null,
              imagePreview: previewURL,
              extractedData: null,
              processing: false,
              isPDF: isPDFFile,
              currentPage: 1,
              totalPages: pageCount
            });

            return { success: true };
          } catch (error) {
            set({ error: error.message, processing: false });
            throw error;
          }
        },

        /**
         * Set AI provider
         * @param {string} provider - Provider key (gpt-4o, gemini, claude)
         */
        setProvider: (provider) => {
          try {
            AIProviderService.setProvider(provider);
            set({ selectedProvider: provider });
          } catch (error) {
            console.error('Failed to set provider:', error);
            throw error;
          }
        },

        /**
         * Get available AI providers
         * @returns {Array} List of providers
         */
        getAvailableProviders: () => {
          return AIProviderService.getAvailableProviders();
        },

        /**
         * Extract form fields using AI
         */
        extractFields: async () => {
          const { originalFile, currentForm, selectedProvider, isPDF, totalPages } = get();
          
          if (!currentForm) {
            throw new Error('No form uploaded');
          }

          set({ processing: true, error: null });

          try {
            let allFields = [];
            let formTitle = '';

            // If it's a multi-page PDF, extract from all pages
            if (isPDF && totalPages > 1 && originalFile) {
              for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                // Update progress
                set({ processingPage: pageNum });
                
                // Convert page to image
                const imageBlob = await FormProcessingService.convertPDFPageToImage(originalFile, pageNum);
                const pageFile = new File([imageBlob], originalFile.name, { type: 'image/png' });
                
                // Extract fields from this page
                const rawData = await AIProviderService.extractFormFields(pageFile);
                const formattedData = FormProcessingService.formatExtractedData(rawData, pageNum);
                
                // Use title from first page
                if (pageNum === 1) {
                  formTitle = formattedData.formTitle;
                }
                
                // Add page number to each field
                const fieldsWithPage = formattedData.fields.map(field => ({
                  ...field,
                  page: pageNum
                }));
                
                allFields = [...allFields, ...fieldsWithPage];
                
                // Update UI with current results after each page
                set(state => ({
                  extractedData: {
                    formTitle: formTitle || state.extractedData?.formTitle || '',
                    fields: allFields,
                    extractedAt: new Date().toISOString()
                  }
                }));
              }
            } else {
              // Single page or regular image
              const rawData = await AIProviderService.extractFormFields(currentForm);
              const formattedData = FormProcessingService.formatExtractedData(rawData, 1);
              formTitle = formattedData.formTitle;
              allFields = formattedData.fields.map(field => ({
                ...field,
                page: 1
              }));
            }

            const finalData = {
              formTitle,
              fields: allFields,
              extractedAt: new Date().toISOString()
            };

            // Get provider info for history
            const providerInfo = AIProviderService.getProviderInfo(selectedProvider);

            // Add to history
            const historyEntry = {
              id: Date.now(),
              filename: currentForm.name,
              extractedAt: new Date().toISOString(),
              fieldsCount: allFields.length,
              formTitle: formTitle,
              provider: providerInfo?.name || selectedProvider
            };

            set(state => ({
              extractedData: finalData,
              processing: false,
              processingPage: null,
              history: [historyEntry, ...state.history].slice(0, 10) // Keep last 10
            }));

            return finalData;
          } catch (error) {
            set({ error: error.message, processing: false, processingPage: null });
            throw error;
          }
        },

        /**
         * Update a specific field label and/or value
         * @param {string} fieldId - Field ID
         * @param {object} updates - Object with label and/or value to update
         */
        updateField: (fieldId, updates) => {
          set(state => ({
            extractedData: {
              ...state.extractedData,
              fields: state.extractedData.fields.map(field =>
                field.id === fieldId ? { ...field, ...updates, verified: true } : field
              )
            }
          }));
        },

        /**
         * Toggle field verification status
         * @param {string} fieldId - Field ID
         */
        toggleFieldVerification: (fieldId) => {
          set(state => ({
            extractedData: {
              ...state.extractedData,
              fields: state.extractedData.fields.map(field =>
                field.id === fieldId ? { ...field, verified: !field.verified } : field
              )
            }
          }));
        },

        /**
         * Delete a field
         * @param {string} fieldId - Field ID
         */
        deleteField: (fieldId) => {
          set(state => ({
            extractedData: {
              ...state.extractedData,
              fields: state.extractedData.fields.filter(field => field.id !== fieldId)
            }
          }));
        },

        /**
         * Add a new field manually
         * @param {object} fieldData - Field data
         */
        addField: (fieldData) => {
          const { currentPage } = get();
          const pageNum = fieldData.page || currentPage || 1;
          
          const newField = {
            id: `field_${Date.now()}_${pageNum}`,
            label: fieldData.label || 'New Field',
            value: fieldData.value || '',
            type: fieldData.type || 'text',
            confidence: 1.0,
            verified: true,
            page: pageNum
          };

          set(state => ({
            extractedData: {
              ...state.extractedData,
              fields: [...state.extractedData.fields, newField]
            }
          }));
        },

        /**
         * Export extracted data
         * @param {string} format - 'json' or 'csv'
         */
        exportData: (format = 'json') => {
          const { extractedData, currentForm } = get();
          
          if (!extractedData) {
            throw new Error('No data to export');
          }

          const timestamp = new Date().toISOString().split('T')[0];
          const baseFilename = currentForm?.name.split('.')[0] || 'form';

          if (format === 'json') {
            const content = FormProcessingService.exportToJSON(extractedData);
            FormProcessingService.downloadFile(
              content,
              `${baseFilename}_extracted_${timestamp}.json`,
              'application/json'
            );
          } else if (format === 'csv') {
            const content = FormProcessingService.exportToCSV(extractedData);
            FormProcessingService.downloadFile(
              content,
              `${baseFilename}_extracted_${timestamp}.csv`,
              'text/csv'
            );
          }
        },


        /**
         * Navigate to specific PDF page
         * @param {number} pageNumber - Page number to navigate to
         */
        goToPage: async (pageNumber) => {
          const { originalFile, totalPages, isPDF } = get();
          
          if (!isPDF || !originalFile) {
            throw new Error('Current file is not a PDF');
          }

          if (pageNumber < 1 || pageNumber > totalPages) {
            throw new Error(`Invalid page number. Must be between 1 and ${totalPages}`);
          }

          set({ processing: true });

          try {
            const imageBlob = await FormProcessingService.convertPDFPageToImage(originalFile, pageNumber);
            const previewURL = URL.createObjectURL(imageBlob);
            
            // Revoke old preview URL
            const { imagePreview } = get();
            if (imagePreview) {
              URL.revokeObjectURL(imagePreview);
            }

            // Update form with new page
            const fileToProcess = new File([imageBlob], originalFile.name, { type: 'image/png' });

            set({
              currentForm: fileToProcess,
              imagePreview: previewURL,
              currentPage: pageNumber,
              processing: false
            });
          } catch (error) {
            set({ processing: false });
            throw error;
          }
        },

        /**
         * Clear current form and data
         */
        clearForm: () => {
          const { imagePreview } = get();
          if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
          }
          
          set({
            currentForm: null,
            originalFile: null,
            extractedData: null,
            imagePreview: null,
            error: null,
            isPDF: false,
            currentPage: 1,
            totalPages: 1,
            processingPage: null
          });
        },

        /**
         * Highlight a field on the form image
         * @param {string} fieldId - Field ID to highlight
         */
        highlightField: (fieldId) => {
          set({ highlightedFieldId: fieldId });
          // Auto-clear after animation
          setTimeout(() => {
            set({ highlightedFieldId: null });
          }, 1000);
        },

        /**
         * Clear error state
         */
        clearError: () => set({ error: null }),

        /**
         * Reset entire store
         */
        reset: () => {
          const { imagePreview } = get();
          if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
          }
          
          set({
            currentForm: null,
            originalFile: null,
            extractedData: null,
            processing: false,
            error: null,
            history: [],
            imagePreview: null,
            isPDF: false,
            currentPage: 1,
            totalPages: 1,
            processingPage: null
          });
        },

        /**
         * Get statistics
         */
        getStats: () => {
          const { extractedData, history } = get();
          
          return {
            currentFieldsCount: extractedData?.fields?.length || 0,
            verifiedFieldsCount: extractedData?.fields?.filter(f => f.verified).length || 0,
            totalProcessed: history.length,
            hasCurrentForm: !!extractedData
          };
        }
      }),
      {
        name: 'form-storage',
        partialize: (state) => ({
          history: state.history,
          selectedProvider: state.selectedProvider
        })
      }
    )
  )
);

export default useFormStore;

