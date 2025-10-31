import React from 'react';
import { useFormStore } from '../../stores';
import './Header.scss';

const Header = () => {
  const stats = useFormStore((state) => state.getStats());
  const clearForm = useFormStore((state) => state.clearForm);
  const processing = useFormStore((state) => state.processing);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🤖</span>
            <span className="logo-text">FileReadAI</span>
          </div>
          <span className="tagline">AI-Powered Form Reader</span>
        </div>

        <div className="header-right">
          {stats.hasCurrentForm && (
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">Fields:</span>
                <span className="stat-value">{stats.currentFieldsCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Verified:</span>
                <span className="stat-value">{stats.verifiedFieldsCount}</span>
              </div>
            </div>
          )}
          
          <button onClick={clearForm} className="btn-secondary" disabled={processing}>
            New Form
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

