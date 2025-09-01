import React, { useState, useRef, useEffect } from 'react';

const EditableField = ({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  children,
  options = [],
  rows = 1,
  multiline = false,
  required = false,
  minLength = 0,
  maxLength = null,
  saveOnEnter = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'textarea') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleStartEdit = () => {
    setEditValue(value);
    setError('');
    setIsEditing(true);
  };

  const handleSave = () => {
    // Validation
    if (required && !editValue.trim()) {
      setError('This field is required');
      return;
    }

    if (minLength > 0 && editValue.length < minLength) {
      setError(`Minimum length is ${minLength} characters`);
      return;
    }

    if (maxLength && editValue.length > maxLength) {
      setError(`Maximum length is ${maxLength} characters`);
      return;
    }

    onSave(editValue);
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setEditValue(value);
    setError('');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline && saveOnEnter) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
          />
        );

      case 'date':
        return (
          <input
            ref={inputRef}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return (
          <input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
          />
        );
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {renderInput()}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleStartEdit}
      className={`cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors duration-200 ${className}`}
      title="Click to edit"
    >
      {children || value || placeholder}
    </div>
  );
};

export default EditableField;
