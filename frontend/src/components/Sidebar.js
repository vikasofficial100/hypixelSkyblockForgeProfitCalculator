// frontend/src/components/Sidebar.js
import React, { useState } from 'react';
import { FaSearch, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

function Sidebar({ isOpen, filters, setFilters }) {
  const [localFilters, setLocalFilters] = useState({
    hotmTier: filters.hotmTier || 10,
    maxBudget: filters.maxBudget || null,
    minProfit: filters.minProfit || 0,
    minDuration: filters.minDuration || null,
    minActiveAuctions: filters.minActiveAuctions || null,
    quickForgeLevel: filters.quickForgeLevel || 0,
  });

  if (!isOpen) return null;

  const formatToMillions = (value) => {
    if (!value) return '';
    return (value / 1000000).toString();
  };

  const handleLocalChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value === '' ? null : value }));
  };

  const handleBudgetChange = (e) => {
    const v = e.target.value;
    handleLocalChange('maxBudget', v === '' ? null : parseFloat(v) * 1000000);
  };

  const handleProfitChange = (e) => {
    const v = e.target.value;
    handleLocalChange('minProfit', v === '' ? 0 : parseFloat(v) * 1000000);
  };

  const applyFilters = () => {
    setFilters(localFilters);
    toast.success('Filters applied', { duration: 1500 });
  };

  const resetFilters = () => {
    const reset = {
      hotmTier: 10,
      maxBudget: null,
      minProfit: 0,
      minDuration: null,
      minActiveAuctions: null,
      quickForgeLevel: 0,
    };
    setLocalFilters(reset);
    setFilters(reset);
    toast.success('Filters reset', { duration: 1500 });
  };

  const Input =
    "w-full bg-sky-card border border-sky-border rounded-lg px-3 py-2.5 text-sm " +
    "text-sky-text placeholder-sky-text-secondary/60 " +
    "transition-all focus:outline-none focus:border-profit-green " +
    "hover:border-sky-text-secondary focus:ring-1 focus:ring-profit-green/20";

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-[61px] h-[calc(100vh-61px)] w-72 overflow-y-auto z-40">
      <div className="p-4 space-y-4">

        {/* 1️⃣ HEADER CARD */}
        <div className="card py-3">
          <h2 className="text-base font-medium text-sky-text tracking-wide">
            Filters
          </h2>
        </div>

        {/* 2️⃣ CONTENT CARD */}
        <div className="card space-y-5">

          {/* HOTM */}
          <div className="space-y-2">
            <div className="text-sm text-sky-text-secondary">HOTM Tier</div>
            <select
              value={localFilters.hotmTier}
              onChange={(e) =>
                handleLocalChange('hotmTier', parseInt(e.target.value))
              }
              className={Input + " appearance-none"}
            >
              {[1,2,3,4,5,6,7,8,9,10].map(t => (
                <option key={t} value={t}>Tier {t}</option>
              ))}
            </select>
          </div>

          {/* Max Budget */}
          <div className="space-y-2">
            <div className="text-sm text-sky-text-secondary">Max Budget</div>
            <input
              type="number"
              value={formatToMillions(localFilters.maxBudget)}
              onChange={handleBudgetChange}
              placeholder="in Millions"
              className={Input}
            />
          </div>

          {/* Min Profit */}
          <div className="space-y-2">
            <div className="text-sm text-sky-text-secondary">Min Profit</div>
            <input
              type="number"
              value={formatToMillions(localFilters.minProfit)}
              onChange={handleProfitChange}
              placeholder="in Millions"
              className={Input}
            />
          </div>

          {/* Min Duration */}
          <div className="space-y-2">
            <div className="text-sm text-sky-text-secondary">Min Duration</div>
            <input
              type="number"
              value={localFilters.minDuration || ''}
              onChange={(e) =>
                handleLocalChange(
                  'minDuration',
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              placeholder="Hours"
              className={Input}
            />
          </div>

          {/* Auctions */}
          <div className="space-y-2">
            <div className="text-sm text-sky-text-secondary">
              Min Active Auctions
            </div>
            <input
              type="number"
              value={localFilters.minActiveAuctions || ''}
              onChange={(e) =>
                handleLocalChange(
                  'minActiveAuctions',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="Will only show AH items"
              className={Input}
            />
          </div>

          {/* Quick Forge */}
          <div className="space-y-2">
            <div className="text-sm text-sky-text-secondary">
              Quick Forge:{" "}
              <span className="text-profit-green">
                {localFilters.quickForgeLevel}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="20"
              value={localFilters.quickForgeLevel}
              onChange={(e) =>
                handleLocalChange('quickForgeLevel', parseInt(e.target.value))
              }
              className="w-full accent-profit-green"
            />
          </div>

        </div>

        {/* 3️⃣ ACTIONS CARD */}
        <div className="card space-y-3">

          <button
            onClick={applyFilters}
            className="w-full bg-sky-card border border-sky-border rounded-lg py-2.5 text-sm
                       text-sky-text flex items-center justify-center gap-2
                       hover:border-profit-green hover:text-profit-green transition-all"
          >
            <FaSearch /> Apply Filters
          </button>

          <button
            onClick={resetFilters}
            className="w-full bg-sky-card border border-sky-border rounded-lg py-2.5 text-sm
                       text-sky-text flex items-center justify-center gap-2
                       hover:border-red-500 hover:text-red-400 transition-all"
          >
            <FaTrash /> Reset All
          </button>

        </div>

      </div>
    </aside>
  );
}

export default Sidebar;