import React, { useState, useEffect, useRef } from 'react';
import { useFormStore, useUIStore } from '../../stores';
import './FormViewer.scss';

const FormViewer = () => {
  const imagePreview = useFormStore((state) => state.imagePreview);
  const currentForm = useFormStore((state) => state.currentForm);
  const processing = useFormStore((state) => state.processing);
  const extractFields = useFormStore((state) => state.extractFields);
  const extractedData = useFormStore((state) => state.extractedData);
  const selectedProvider = useFormStore((state) => state.selectedProvider);
  const setProvider = useFormStore((state) => state.setProvider);
  const getAvailableProviders = useFormStore((state) => state.getAvailableProviders);
  const isPDF = useFormStore((state) => state.isPDF);
  const currentPage = useFormStore((state) => state.currentPage);
  const totalPages = useFormStore((state) => state.totalPages);
  const processingPage = useFormStore((state) => state.processingPage);
  const goToPage = useFormStore((state) => state.goToPage);
  const highlightedFieldId = useFormStore((state) => state.highlightedFieldId);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  const [providers, setProviders] = useState([]);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Load available providers on mount
    const availableProviders = getAvailableProviders();
    setProviders(availableProviders);
  }, [getAvailableProviders]);

  // Handle field highlighting
  useEffect(() => {
    if (!highlightedFieldId || !extractedData || !imageRef.current || !canvasRef.current) {
      return;
    }

    const field = extractedData.fields.find(f => f.id === highlightedFieldId);
    if (!field || !field.boundingBox) {
      return;
    }

    const image = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Wait for image to load if not already loaded
    const drawHighlight = () => {
      // Get the actual rendered dimensions of the image
      const displayWidth = image.offsetWidth;
      const displayHeight = image.offsetHeight;

      // Set canvas to match displayed image size exactly
      // Use device pixel ratio for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      // Scale context to handle high DPI
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate actual box position based on normalized coordinates
      const box = field.boundingBox;
      
      // Log for debugging
      console.log('Bounding box:', box);
      console.log('Display dimensions:', { displayWidth, displayHeight });
      
      const x = box.x * displayWidth;
      const y = box.y * displayHeight;
      const width = box.width * displayWidth;
      const height = box.height * displayHeight;
      
      console.log('Calculated position:', { x, y, width, height });

      // Draw highlight with animation
      let opacity = 1;
      let animationFrameId;
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw semi-transparent yellow highlight
        ctx.fillStyle = `rgba(255, 235, 59, ${opacity * 0.3})`;
        ctx.fillRect(x, y, width, height);
        
        // Draw border
        ctx.strokeStyle = `rgba(255, 193, 7, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        opacity -= 0.02;
        if (opacity > 0) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      animate();

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    };

    if (image.complete) {
      drawHighlight();
    } else {
      image.onload = drawHighlight;
    }
  }, [highlightedFieldId, extractedData, imagePreview]);

  const handleExtract = async () => {
    try {
      await extractFields();
      showSuccess('Form fields extracted successfully!');
    } catch (error) {
      showError(error.message);
    }
  };

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    try {
      setProvider(newProvider);
      showSuccess(`Switched to ${providers.find(p => p.key === newProvider)?.name}`);
    } catch (error) {
      showError(error.message);
    }
  };

  const handlePreviousPage = async () => {
    if (currentPage > 1) {
      try {
        await goToPage(currentPage - 1);
      } catch (error) {
        showError(error.message);
      }
    }
  };

  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      try {
        await goToPage(currentPage + 1);
      } catch (error) {
        showError(error.message);
      }
    }
  };

  return (
    <div className="form-viewer">
      <div className="viewer-header">
        <h2>📄 Form Preview</h2>
        
        {currentForm && (
          <div className="filename-center">{currentForm.name}</div>
        )}
        
        {currentForm && !extractedData && (
          <div className="header-actions">
            <button
              onClick={handleExtract}
              disabled={processing}
              className="btn-extract-compact"
            >
              {processing ? (
                <>
                  <span className="spinner-small"></span>
                  {processingPage && totalPages > 1 
                    ? `Processing page ${processingPage}/${totalPages}...` 
                    : 'Processing...'}
                </>
              ) : (
                'Extract Fields'
              )}
            </button>
            
            <div className="model-select-inline">
              <span className="using-text">using</span>
              <select
                value={selectedProvider}
                onChange={handleProviderChange}
                disabled={processing}
                className="model-dropdown-inline"
              >
                {providers.map((provider) => (
                  <option key={provider.key} value={provider.key}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="viewer-content">
        {imagePreview ? (
          <div className="image-container">
            <div className="image-wrapper">
              <img 
                ref={imageRef}
                src={imagePreview} 
                alt="Form preview" 
                className="form-image" 
              />
              <canvas 
                ref={canvasRef}
                className="highlight-canvas"
              />
              {isPDF && totalPages > 1 && (
                <div className="pdf-navigation">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || processing}
                    className="nav-btn"
                    title="Previous page"
                  >
                    ←
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || processing}
                    className="nav-btn"
                    title="Next page"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-image">
            <span className="no-image-icon">🖼️</span>
            <p>No image to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormViewer;

