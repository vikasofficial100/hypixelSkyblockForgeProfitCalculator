import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <FaExclamationTriangle className="text-warning-yellow text-5xl mb-4" />
      <p className="text-sky-text-secondary mb-4">{message || 'Failed to load data'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary flex items-center gap-2">
          <FaRedo /> Retry
        </button>
      )}
    </div>
  );
}

export default ErrorDisplay;