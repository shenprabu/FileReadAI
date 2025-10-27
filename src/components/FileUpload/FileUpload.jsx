import React, { useRef } from 'react';
import { useFormStore, useUIStore } from '../../stores';
import './FileUpload.scss';

const FileUpload = () => {
  const fileInputRef = useRef(null);
  const uploadForm = useFormStore((state) => state.uploadForm);
  const processing = useFormStore((state) => state.processing);
  const showError = useUIStore((state) => state.showError);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadForm(file);
    } catch (error) {
      showError(error.message);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    try {
      await uploadForm(file);
    } catch (error) {
      showError(error.message);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={processing}
      />
      
      <div
        className="upload-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <div className="upload-icon">📤</div>
        <h3>Upload Form Document</h3>
        <p>Click to browse or drag and drop</p>
        <span className="upload-hint">Supports: JPG, PNG, WebP, PDF (max 10MB)</span>
      </div>
    </div>
  );
};

export default FileUpload;

