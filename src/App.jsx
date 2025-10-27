import React from 'react';
import './App.scss';
import Header from './components/Header/Header';
import FileUpload from './components/FileUpload/FileUpload';
import FormViewer from './components/FormViewer/FormViewer';
import ExtractedData from './components/ExtractedData/ExtractedData';
import Notifications from './components/Notifications/Notifications';
import { useFormStore } from './stores';

function App() {
  const currentForm = useFormStore((state) => state.currentForm);
  const extractedData = useFormStore((state) => state.extractedData);

  return (
    <div className="app">
      <Header />
      <Notifications />
      
      <main className="main-content">
        {!currentForm ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-icon">🤖</div>
              <h1>Welcome to FileReadAI</h1>
              <p>AI-powered form field reader and extractor</p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">📄</span>
                  <span>Upload form images / PDFs</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🧠</span>
                  <span>AI field extraction</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✅</span>
                  <span>Verify & export data</span>
                </div>
              </div>
              <FileUpload />
            </div>
          </div>
        ) : (
          <div className="workspace">
            <div className="viewer-section">
              <FormViewer />
            </div>
            <div className="data-section">
              {extractedData ? (
                <ExtractedData />
              ) : (
                <div className="extraction-prompt">
                  <div className="prompt-content">
                    <h2>Form Uploaded Successfully! 🎉</h2>
                    <p>Click on 'Extract Fields' button to fetch form fields using AI</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

