// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ForgeList from './pages/ForgeList';
import ForgeDetail from './pages/ForgeDetail';

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
  hotmTier: 10,
  maxBudget: null,
  minProfit: 0,
  minDuration: null,
  minActiveAuctions: null,  
  quickForgeLevel: 0,
});

  const isDetailPage = location.pathname.includes('/item/');

  // Load filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('forgeFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      } catch (e) {}
    }
  }, []);

  // Save filters to localStorage
  const updateFilters = (newFilters) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    localStorage.setItem('forgeFilters', JSON.stringify(updated));
  };

  // Remember sidebar state
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === 'true');
    }
  }, []);

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState);
  };

  return (
    <div className="min-h-screen">
      <Toaster 
        position="bottom-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1a1a2e',
            color: '#e2e2e2',
            border: '1px solid #2a2a4a',
            borderRadius: '8px',
          },
          success: {
            style: {
              color: '#00ff88',
            },
          },
        }}
      />
      <Header sidebarOpen={sidebarOpen && !isDetailPage} setSidebarOpen={handleSidebarToggle} />
      <div className="flex">
        {!isDetailPage && (
          <Sidebar 
            isOpen={sidebarOpen} 
            filters={filters} 
            setFilters={updateFilters}
          />
        )}
        <main className={`flex-1 transition-all duration-300 ${
          !isDetailPage && sidebarOpen ? 'ml-72' : 'ml-0'
        }`}>
          <div className="container mx-auto p-6">
            <Routes>
              <Route path="/" element={<ForgeList filters={filters} />} />
              <Route path="/item/:itemId" element={<ForgeDetail />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
