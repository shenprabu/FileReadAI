import React, { useState, useRef, useEffect } from 'react';
import { useFormStore, useUIStore } from '../../stores';
import './ExtractedData.scss';

const ExtractedData = () => {
  const extractedData = useFormStore((state) => state.extractedData);
  const updateField = useFormStore((state) => state.updateField);
  const toggleFieldVerification = useFormStore((state) => state.toggleFieldVerification);
  const deleteField = useFormStore((state) => state.deleteField);
  const exportData = useFormStore((state) => state.exportData);
  const addField = useFormStore((state) => state.addField);
  const isPDF = useFormStore((state) => state.isPDF);
  const totalPages = useFormStore((state) => state.totalPages);
  const currentPage = useFormStore((state) => state.currentPage);
  const goToPage = useFormStore((state) => state.goToPage);
  const highlightField = useFormStore((state) => state.highlightField);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showInfo = useUIStore((state) => state.showInfo);
  const showError = useUIStore((state) => state.showError);

  const [editingField, setEditingField] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');
  const [selectedPage, setSelectedPage] = useState('all');
  const [newFieldId, setNewFieldId] = useState(null);
  const [showAddFieldPopover, setShowAddFieldPopover] = useState(false);
  const [newFieldForm, setNewFieldForm] = useState({
    label: '',
    value: '',
    page: currentPage || 1
  });
  const fieldRefs = useRef({});

  const handleEdit = (field) => {
    setEditingField(field.id);
    setEditLabel(field.label);
    setEditValue(field.value);
  };

  const handleSave = (fieldId) => {
    if (!editLabel.trim()) {
      showError('Field name is required');
      return;
    }
    updateField(fieldId, { label: editLabel, value: editValue });
    setEditingField(null);
    showSuccess('Field updated successfully');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditLabel('');
    setEditValue('');
  };

  const handleExport = (format) => {
    exportData(format);
    showInfo(`Exported as ${format.toUpperCase()}`);
  };

  const handleAddField = () => {
    // Reset form and show popover
    setNewFieldForm({
      label: '',
      value: '',
      page: currentPage || 1
    });
    setShowAddFieldPopover(true);
  };

  const handleSaveNewField = () => {
    if (!newFieldForm.label.trim()) {
      showError('Field name is required');
      return;
    }

    // Add the field and get the ID that will be generated
    const timestamp = Date.now();
    const fieldId = `field_${timestamp}_${newFieldForm.page}`;
    
    addField({ 
      label: newFieldForm.label, 
      value: newFieldForm.value, 
      type: 'text',
      page: newFieldForm.page
    });
    
    // Close popover
    setShowAddFieldPopover(false);
    
    // Set the new field to be scrolled to
    setNewFieldId(fieldId);
  };

  const handleCancelNewField = () => {
    setShowAddFieldPopover(false);
    setNewFieldForm({
      label: '',
      value: '',
      page: currentPage || 1
    });
  };

  const handlePopoverKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNewField();
    } else if (e.key === 'Escape') {
      handleCancelNewField();
    }
  };

  // Effect to scroll to newly added field
  useEffect(() => {
    if (newFieldId && fieldRefs.current[newFieldId]) {
      const element = fieldRefs.current[newFieldId];
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      
      // Clear the new field ID
      setNewFieldId(null);
    }
  }, [newFieldId, extractedData]);

  const handleFieldClick = async (field) => {
    // If field is on a different page, navigate to it first
    if (field.page && field.page !== currentPage && isPDF) {
      try {
        await goToPage(field.page);
        // Wait a bit for page to load before highlighting
        setTimeout(() => {
          highlightField(field.id);
        }, 300);
      } catch (error) {
        showError(error.message);
      }
    } else {
      highlightField(field.id);
    }
  };

  if (!extractedData) return null;

  const { fields = [], formTitle } = extractedData;

  // Group fields by page
  const fieldsByPage = fields.reduce((acc, field) => {
    const page = field.page || 1;
    if (!acc[page]) {
      acc[page] = [];
    }
    acc[page].push(field);
    return acc;
  }, {});

  const pages = Object.keys(fieldsByPage).sort((a, b) => Number(a) - Number(b));
  const showMultiplePages = isPDF && totalPages > 1;

  // Filter fields based on selected page
  const displayedFields = selectedPage === 'all' 
    ? fields 
    : fields.filter(f => (f.page || 1) === Number(selectedPage));

  return (
    <div className="extracted-data">
      <div className="data-header">
        <div>
          <h2>✅ Extracted Data</h2>
          {formTitle && <p className="form-title">{formTitle}</p>}
        </div>
        <div className="header-actions">
          <button onClick={() => handleExport('json')} className="btn-icon" title="Export JSON">
            📥 JSON
          </button>
          <button onClick={() => handleExport('csv')} className="btn-icon" title="Export CSV">
            📥 CSV
          </button>
          <button onClick={handleAddField} className="btn-add-field" title="Add missing field">
            + Add missing field
          </button>
        </div>
      </div>


      {showMultiplePages && (
        <div className="page-filter">
          <label>Filter by page:</label>
          <select 
            value={selectedPage} 
            onChange={(e) => setSelectedPage(e.target.value)}
            className="page-select"
          >
            <option value="all">All Pages ({fields.length} fields)</option>
            {pages.map(page => (
              <option key={page} value={page}>
                Page {page} ({fieldsByPage[page].length} fields)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="fields-list">
        {fields.length === 0 ? (
          <div className="no-fields">
            <p>No fields extracted</p>
          </div>
        ) : displayedFields.length === 0 ? (
          <div className="no-fields">
            <p>No fields on this page</p>
          </div>
        ) : (
          displayedFields.map((field) => (
            <div
              key={field.id}
              ref={(el) => (fieldRefs.current[field.id] = el)}
              className={`field-item ${field.verified ? 'verified' : ''}`}
              onClick={() => handleFieldClick(field)}
            >
              <div className="field-header">
                <div className="field-info">
                  <span className="field-label">{field.label}</span>
                  <span className="field-type">{field.type}</span>
                  {showMultiplePages && selectedPage === 'all' && (
                    <span className="page-badge">Page {field.page || 1}</span>
                  )}
                </div>
                <div className="field-actions">
                  <button
                    onClick={() => toggleFieldVerification(field.id)}
                    className={`btn-verify ${field.verified ? 'verified' : ''}`}
                    title={field.verified ? 'Verified' : 'Verify'}
                  >
                    {field.verified ? '✓' : '○'}
                  </button>
                  <button
                    onClick={() => handleEdit(field)}
                    className="btn-icon-small"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteField(field.id)}
                    className="btn-icon-small btn-danger"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="field-value">
                {editingField === field.id ? (
                  <div className="field-edit">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Field name"
                      className="field-input"
                    />
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Field value"
                      autoFocus
                      className="field-input"
                    />
                    <div className="edit-actions">
                      <button onClick={() => handleSave(field.id)} className="btn-save">
                        Save
                      </button>
                      <button onClick={handleCancel} className="btn-cancel">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="field-display">
                    <span className="value-text">{field.value || '(empty)'}</span>
                    {field.confidence !== undefined && (
                      <span
                        className={`confidence ${
                          field.confidence > 0.8
                            ? 'high'
                            : field.confidence > 0.5
                            ? 'medium'
                            : 'low'
                        }`}
                      >
                        {Math.round(field.confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Field Popover */}
      {showAddFieldPopover && (
        <div className="popover-overlay" onClick={handleCancelNewField}>
          <div className="popover-content" onClick={(e) => e.stopPropagation()} onKeyDown={handlePopoverKeyDown}>
            <h3>Add Missing Field</h3>
            
            <div className="popover-form">
              <div className="form-group">
                <label>Field Name *</label>
                <input
                  type="text"
                  value={newFieldForm.label}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, label: e.target.value })}
                  placeholder="e.g., Email Address"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Field Value</label>
                <input
                  type="text"
                  value={newFieldForm.value}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, value: e.target.value })}
                  placeholder="Enter value (optional)"
                />
              </div>

              {isPDF && totalPages > 1 && (
                <div className="form-group">
                  <label>Page</label>
                  <select
                    value={newFieldForm.page}
                    onChange={(e) => setNewFieldForm({ ...newFieldForm, page: Number(e.target.value) })}
                  >
                    {[...Array(totalPages)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Page {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="popover-actions">
              <button onClick={handleSaveNewField} className="btn-save">
                Save
              </button>
              <button onClick={handleCancelNewField} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractedData;

