import React from 'react';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-sky-border border-t-profit-green rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-profit-green rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;