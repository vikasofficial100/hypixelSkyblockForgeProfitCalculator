// frontend/src/pages/ForgeList.js
import React, { useState, useMemo , useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchForgeItems, manualRefresh , API_BASE_URL } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonRow from '../components/SkeletonRow';
import ErrorDisplay from '../components/ErrorDisplay';
import {
  FaExclamationTriangle,
  FaChevronDown,
  FaSearch,
  FaSync,
  FaSpinner
} from 'react-icons/fa';
import toast from 'react-hot-toast';







function ForgeList({ filters }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [localSortBy, setLocalSortBy] = useState('profitPerForge');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['forgeItems'],
    queryFn: () => fetchForgeItems({}),
    staleTime: 30 * 60 * 1000,
  });


  useEffect(() => {
  const eventSource = new EventSource(
    `${API_BASE_URL}/events`
  );

  eventSource.addEventListener(
    'refresh-complete',
    async () => {
      await refetch();

      setIsRefreshing(false);

      toast.success(
        'Prices updated successfully!',
        { id: 'refresh' }
      );
    }
  );

  return () => {
    eventSource.close();
  };
  }, [refetch]);

  const handleRefresh = async () => {
  if (isRefreshing) return;

  setIsRefreshing(true);

  toast.loading(
    'Refreshing prices in background...',
    { id: 'refresh' }
  );

  try {
    await manualRefresh();
  } catch (err) {
    setIsRefreshing(false);

    toast.error(
      'Failed to start refresh',
      { id: 'refresh' }
    );
  }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatProfit = (profit) => {
    const isPositive = profit > 0;
    let formattedValue;

    if (Math.abs(profit) >= 1e9) {
      formattedValue = `${(Math.abs(profit) / 1e9).toFixed(2)}B`;
    } else if (Math.abs(profit) >= 1e6) {
      formattedValue = `${(Math.abs(profit) / 1e6).toFixed(2)}M`;
    } else if (Math.abs(profit) >= 1e3) {
      formattedValue = `${(Math.abs(profit) / 1e3).toFixed(1)}K`;
    } else {
      formattedValue = Math.abs(profit).toFixed(0);
    }

    return (
      <span className={isPositive ? 'profit-positive' : 'profit-negative'}>
        {isPositive ? '+' : '-'}{formattedValue}
      </span>
    );
  };

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = [...data.items];

    if (filters.hotmTier && filters.hotmTier < 10) {
      items = items.filter(item => (item.tier || 0) <= filters.hotmTier);
    }

    if (filters.maxBudget) {
      items = items.filter(item => item.cost.totalCost <= filters.maxBudget);
    }

    if (filters.minProfit && filters.minProfit > 0) {
      items = items.filter(item => item.profit.profitPerForge >= filters.minProfit);
    }

    if (filters.minDuration) {
      items = items.filter(item => item.duration >= filters.minDuration);
    }

    if (searchTerm.trim()) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return items;
  }, [data?.items, filters, searchTerm]);

  const sortedAndFilteredItems = useMemo(() => {
    const items = [...filteredItems];

    items.sort((a, b) => {
      const aVal =
        localSortBy === 'profitPerForge'
          ? a.profit.profitPerForge || 0
          : a.profit.profitPerHour || 0;

      const bVal =
        localSortBy === 'profitPerForge'
          ? b.profit.profitPerForge || 0
          : b.profit.profitPerHour || 0;

      return bVal - aVal;
    });

    return items;
  }, [filteredItems, localSortBy]);

  const getAdjustedDuration = (duration) => {
    const quickForgeBonus = filters.quickForgeLevel || 0;
    const adjustedDuration = duration * (1 - quickForgeBonus * 0.01);
    
    // Convert to seconds if less than 1 minute (0.0167 hours)
    if (adjustedDuration < 0.0167) {
      const seconds = Math.round(adjustedDuration * 3600);
      return `${seconds}s`;
    }
    
    return `${adjustedDuration.toFixed(1)}h`;
  };

  const isLoss = (item) => item.profit.profitPerForge < 0;

  if (isLoading && !data) {
    return (
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-sky-border">
              <tr className="text-left text-sky-text-secondary text-sm">
                <th className="px-4 py-3">#</th>
                <th>Item</th>
                <th>HOTM</th>
                <th>Duration</th>
                <th>Forge Cost</th>
                <th>Profit/Forge</th>
                <th>Profit/hr</th>
                <th>Sell Price</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        message="Failed to load forge items. Make sure the backend is running at http://localhost:5000"
        onRetry={() => refetch()}
      />
    );
  }

  if (!data?.items?.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-sky-text-secondary">No items found.</p>
        <button onClick={() => refetch()} className="btn-primary mt-4">Refresh</button>
      </div>
    );
  }

  return (
    <div>

      {/* Stats Row - Simple text without colors */}
      <div className="flex items-center gap-4 mb-4 text-sm text-sky-text-secondary">
        <span>Showing {sortedAndFilteredItems.length} of {data.items.length} items</span>
        <span>Last updated: {new Date(data.timestamp).toLocaleTimeString()}</span>
      </div>

      {/* Search, Sort, and Refresh Row - Sort/Refresh aligned to right */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        
        {/* Search Box - takes remaining space */}
        <div className="relative flex-1 group">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-text-secondary" size={14} />
          <input
            type="text"
            placeholder="Search forge items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-9 pr-4 py-2.5
              bg-sky-card
              border border-sky-border
              rounded-lg
              text-sky-text
              text-sm
              placeholder-sky-text-secondary
              transition-all
              focus:outline-none
              focus:border-profit-green
              focus:ring-1
              focus:ring-profit-green/20
              hover:border-sky-text-secondary
              focus:hover:border-white
            "
          />
        </div>

        {/* Sort Dropdown and Refresh Button - aligned to right */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-sky-text-secondary">Sort by:</span>
            <div className="relative">
              <select
                value={localSortBy}
                onChange={(e) => setLocalSortBy(e.target.value)}
                className="
                  appearance-none
                  bg-sky-card
                  border border-sky-border
                  rounded-lg
                  px-4 py-2.5
                  pr-8
                  text-sky-text
                  text-sm
                  cursor-pointer
                  transition-all
                  focus:outline-none
                  focus:border-profit-green
                  hover:border-sky-text-secondary
                  focus:hover:border-white
                "
              >
                <option value="profitPerForge">Profit Per Forge</option>
                <option value="profitPerHour">Profit Per Hour</option>
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-text-secondary pointer-events-none" size={12} />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all
              bg-sky-card
              border border-sky-border
              text-sky-text text-sm
              focus:outline-none
              focus:border-profit-green
              hover:border-sky-text-secondary
              focus:hover:border-white
              ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isRefreshing ? (
              <FaSpinner className="animate-spin" size={14} />
            ) : (
              <FaSync size={14} />
            )}
            <span>{isRefreshing ? 'Updating...' : 'Refresh Prices'}</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-sm">
            <thead className="border-b border-sky-border bg-[#1a1a2e] sticky top-0 z-10">
              <tr className="text-left text-sky-text-secondary">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">HOTM</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Forge Cost</th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:text-profit-green transition-colors"
                  onClick={() => setLocalSortBy('profitPerForge')}
                >
                  <div className="flex items-center gap-1">
                    Profit/Forge
                    {localSortBy === 'profitPerForge' && (
                      <FaChevronDown className="text-xs" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:text-profit-green transition-colors"
                  onClick={() => setLocalSortBy('profitPerHour')}
                >
                  <div className="flex items-center gap-1">
                    Profit/hr
                    {localSortBy === 'profitPerHour' && (
                      <FaChevronDown className="text-xs" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3">Sell Price</th>
              </tr>
            </thead>

            <tbody>
              {sortedAndFilteredItems.map((item, index) => (
                <tr
                  key={item.itemId}
                  onClick={() => navigate(`/item/${item.itemId}`)}
                  className={`cursor-pointer border-b border-sky-border transition-colors ${
                    isLoss(item) 
                      ? 'hover:bg-red-900/20' 
                      : item.profit.warnings?.length > 0
                      ? 'hover:bg-yellow-900/20'
                      : 'hover:bg-sky-border/30'
                  }`}
                >
                  <td className="px-4 py-3 text-sky-text-secondary">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {item.name}
                    {item.profit.warnings?.length > 0 && (
                      <span className="ml-2 text-warning-yellow" title={item.profit.warnings.join(', ')}>
                        <FaExclamationTriangle className="inline" size={12} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sky-text-secondary">{item.tier}</td>
                  <td className="px-4 py-3 text-sky-text-secondary">{getAdjustedDuration(item.duration)}</td>
                  <td className="px-4 py-3 text-sky-text-secondary">{formatNumber(item.cost.totalCost)}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatProfit(item.profit.profitPerForge)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.profit.profitPerHour == null ? (
                      <span className="text-sky-text-secondary">N/A</span>
                    ) : (
                      formatProfit(item.profit.profitPerHour)
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      isLoss(item) ? 'text-loss-red' : 'text-profit-green'
                    }`}
                  >
                    {formatNumber(item.prices.sellPriceWithTax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with refresh hint */}
      <div className="mt-4 text-xs text-sky-text-secondary text-center">
        <p>Prices update automatically every 15 minutes. Click "Refresh Prices" for latest data.</p>
      </div>
    </div>
  );
}

export default ForgeList;