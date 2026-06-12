// frontend/src/components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHammer, FaBars, FaDiscord, FaGithub } from 'react-icons/fa';

function Header({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const isDetailPage = location.pathname.includes('/item/');

  return (
    <header className="bg-sky-card border-b border-sky-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Only show sidebar toggle button on list page */}
          {!isDetailPage && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sky-text hover:text-profit-green transition-colors"
            >
              <FaBars size={20} />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <FaHammer className="text-profit-green" size={28} />
            <h1 className="text-xl font-bold">Forge Profit Calculator</h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-sky-text-secondary">
            Data from <a href="https://sky.coflnet.com" target="_blank" rel="noopener noreferrer" className="text-info-blue hover:underline">Coflnet API</a>
          </span>
          <a href="https://discord.gg/example" target="_blank" rel="noopener noreferrer" className="text-sky-text-secondary hover:text-profit-green transition-colors">
            <FaDiscord size={20} />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sky-text-secondary hover:text-profit-green transition-colors">
            <FaGithub size={20} />
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;