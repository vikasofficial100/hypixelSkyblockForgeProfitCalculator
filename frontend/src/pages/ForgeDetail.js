// frontend/src/pages/ForgeDetail.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchForgeDetail } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { 
  FaArrowLeft, FaHammer, FaDollarSign, FaClock, 
  FaChartLine, FaHistory, FaExclamationTriangle, FaTrophy
} from 'react-icons/fa';
import { 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip , LineChart, Line
} from 'recharts';

function ForgeDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['forgeDetail', itemId],
    queryFn: () => fetchForgeDetail(itemId),
    staleTime: 2 * 60 * 1000,
  });

  const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num)) {
          return 'N/A';
        }

        const abs = Math.abs(num);
        const sign = num < 0 ? '-' : '';

        if (abs >= 1e9) {
          return `${sign}${(abs / 1e9).toFixed(2)}B`;
        }

        if (abs >= 1e6) {
          return `${sign}${(abs / 1e6).toFixed(1)}M`;
        }

        if (abs >= 1e3) {
          return `${sign}${(abs / 1e3).toFixed(1)}K`;
        }

        return `${num.toFixed(0)}`;
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
      <span className={`text-2xl font-bold ${isPositive ? 'profit-positive' : 'profit-negative'}`}>
        {isPositive ? '+' : '-'}{formattedValue}
      </span>
    );
  };

  // Prepare chart data from sales history
  const prepareChartData = () => {
    const salesData = data?.market?.recent?.salesLast7Days;

    if (!salesData || typeof salesData !== 'object') {
      return [];
    }

    return Object.entries(salesData)
      .map(([date, count]) => {
        const d = new Date(date);

        return {
          date: d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          }),
          sales: count,
        };
      })
      .reverse();
  };

  //prepare prcice data for char view 
    const preparePriceTrendData = () => {
          const sales = data?.market?.recent?.lowestBinsLast24h;

          if (!sales?.length) return [];

          return [...sales]
            .sort(
              (a, b) =>
                new Date(a.soldAt).getTime() -
                new Date(b.soldAt).getTime()
            )
            .map((sale) => ({
              time: new Date(sale.soldAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              fullTime: sale.soldAt,
              price: sale.price,
            }));
    };


    const priceData = preparePriceTrendData();

    const minPrice = priceData.length
      ? Math.min(...priceData.map((p) => p.price))
      : 0;

    const maxPrice = priceData.length
      ? Math.max(...priceData.map((p) => p.price))
      : 0;

    // 15% padding
    const padding = Math.max(
      (maxPrice - minPrice) * 0.5,
      1000000
    );

   const salesData = prepareChartData();

      const minSales = salesData.length
        ? Math.min(...salesData.map((d) => d.sales))
        : 0;

      const maxSales = salesData.length
        ? Math.max(...salesData.map((d) => d.sales))
        : 0;

      const salesPadding = Math.max(
        (maxSales - minSales) * 0.50,   //padding 
        3
      );

  // Check if item has recent sales data
  const hasRecentSales = () => {
    const recent = data?.market?.recent;
    if (!recent) return false;
    
    const hasSales7Days = recent.salesLast7Days && Object.keys(recent.salesLast7Days).length > 0;
    const hasLowestSales = recent.lowestBinsLast24h && recent.lowestBinsLast24h.length > 0;
    const hasAvgPrice = recent.avgSoldPrice !== null && recent.avgSoldPrice > 0;
    
    return hasSales7Days || hasLowestSales || hasAvgPrice;
  };

  if (isLoading) return <LoadingSpinner />;
  
  if (error || !data?.success) {
    return (
      <ErrorDisplay 
        message={data?.error || error?.message || "Item not found"}
        onRetry={() => refetch()}
      />
    );
  }

  const { item, market, recipe, profit } = data;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
        <FaArrowLeft /> Back to List
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left side - Item Info */}
          <div className="flex items-center gap-3">
            <FaHammer className="text-profit-green text-3xl" />
            <div>
              <h1 className="text-2xl font-bold">{item.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-sky-text-secondary">
                <span>🏷️ {item.category}</span>
                <span>⭐ {item.rarity}</span>
                <span><FaTrophy className="inline mr-1 text-warning-yellow" size={12} /> HOTM {item.tier}</span>
                <span><FaClock className="inline mr-1" size={12} /> {item.duration}h</span>
                <span>📦 {market.current.source}</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Profit Stats side by side */}
          <div className="flex flex-row gap-6 items-center">
            <div className="text-right">
              <div className="text-xs text-sky-text-secondary whitespace-nowrap">Profit Per Forge</div>
              <div className={`text-lg md:text-xl font-semibold ${profit.profitPerForge > 0 ? 'profit-positive' : 'profit-negative'}`}>
                {profit.profitPerForge > 0 ? '+' : ''}{formatNumber(profit.profitPerForge)}
              </div>
            </div>
            
            <div className="w-px h-8 bg-sky-border hidden sm:block"></div>
            
              <div className="text-right">
                <div className="text-xs text-sky-text-secondary whitespace-nowrap">
                  Profit Per Hour
                </div>

                <div
                  className={`text-lg md:text-xl font-semibold ${
                    profit.profitPerHour > 0
                      ? 'profit-positive'
                      : 'profit-negative'
                  }`}
                >
                  {profit.profitPerHour > 0 ? '+' : ''}
                  {formatNumber(profit.profitPerHour)}
                </div>
              </div>
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-sky-border">
          <div className="text-center">
            <div className="text-xs text-sky-text-secondary">Current Price</div>
            <div className="profit-positive text-sm font-semibold">{formatNumber(market.current.sellPrice)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-sky-text-secondary">Total Cost</div>
            <div className="text-sm font-semibold">{formatNumber(recipe.totalCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-sky-text-secondary">ROI Ratio</div>
            <div className="text-sm font-semibold">{profit.ratio?.toFixed(2)}x</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-sky-text-secondary">Quick Forge</div>
            <div className="text-sm font-semibold">-{profit.adjustedDuration ? ((item.duration - profit.adjustedDuration) / item.duration * 100).toFixed(0) : 0}%</div>
          </div>
        </div>
      </div>

      {/* Market & Profit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FaDollarSign className="text-profit-green" /> Market Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Sell Price (Raw):</span>
              <span className="profit-positive">{formatNumber(market.current.sellPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">After Tax:</span>
              <span>{formatNumber(market.current.sellPriceWithTax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Tax Rate:</span>
              <span>{market.current.source === 'AH' ? '2%' : '1.125%'}</span>
            </div>
            {market.current.activeAuctions !== null && (
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Active Auctions:</span>
                <span className={market.current.activeAuctions < 5 ? 'warning' : ''}>
                  {market.current.activeAuctions}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FaChartLine className="text-profit-green" /> Profit Analysis
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Material Cost:</span>
              <span>{formatNumber(recipe.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Revenue (after tax):</span>
              <span className="profit-positive">{formatNumber(market.current.sellPriceWithTax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-sky-border">
              <span className="text-sky-text-secondary">Net Profit:</span>
              <span className={profit.profitPerForge > 0 ? 'profit-positive' : 'profit-negative'}>
                {profit.profitPerForge > 0 ? '+' : ''}{formatNumber(profit.profitPerForge)}
              </span>
            </div>
            {profit.warnings?.length > 0 && (
              <div className="mt-3 p-2 bg-yellow-900/30 rounded flex items-center gap-2">
                <FaExclamationTriangle className="text-warning-yellow" />
                <span className="text-sm text-warning-yellow">{profit.warnings.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recipe Breakdown */}
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FaHammer className="text-profit-green" /> Recipe Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-sky-border">
              <tr className="text-left text-sky-text-secondary">
                <th className="px-3 py-2">Material</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Unit Price</th>
                <th className="px-3 py-2">Total Price</th>
               </tr>
            </thead>
            <tbody>
              {recipe.ingredients?.map((ing, idx) => (
                <tr key={idx} className={ing.missing ? 'opacity-50' : ''}>
                  <td className="px-3 py-2">{ing.item}</td>
                  <td className="px-3 py-2">{ing.quantity}</td>
                  <td className="px-3 py-2">{formatNumber(ing.unitPrice)}</td>
                  <td className="px-3 py-2 profit-positive">{formatNumber(ing.totalPrice)}</td>
                </tr>
              ))}
              <tr className="border-t border-sky-border font-semibold">
                <td className="px-3 py-2" colSpan="3">Total Cost</td>
                <td className="px-3 py-2 profit-positive">{formatNumber(recipe.totalCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Sales Section */}
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FaHistory className="text-profit-green" /> Sales History
        </h3>
        
        {market.current.source === 'AH' ? (
          <>
            {hasRecentSales() ? (
              <>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-2 bg-sky-dark rounded">
                    <div className="text-xs text-sky-text-secondary">Average Price</div>
                    <div className="profit-positive font-semibold">
                      {market.recent?.avgSoldPrice ? formatNumber(market.recent.avgSoldPrice) : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-sky-dark rounded">
                    <div className="text-xs text-sky-text-secondary">Median Price</div>
                    <div className="font-semibold">
                      {market.recent?.medianSoldPrice ? formatNumber(market.recent.medianSoldPrice) : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-sky-dark rounded">
                    <div className="text-xs text-sky-text-secondary">Sales Per Day</div>
                    <div className="font-semibold">
                      {market.recent?.salesPerDay ? market.recent.salesPerDay.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-sky-dark rounded">
                    <div className="text-xs text-sky-text-secondary">Total (7d)</div>
                    <div className="font-semibold">
                      {market.recent?.salesLast7Days ? 
                        Object.values(market.recent.salesLast7Days).reduce((a,b) => a + b, 0) : '0'}
                    </div>
                  </div>
                </div>


                        {preparePriceTrendData().length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                              
                                      <h4 className="text-sm font-semibold]">
                                          Lowest Price Trend
                                        </h4>
                                        <span className="text-[11px] text-sky-text-secondary">
                                          • Last 24 Hours
                                        </span>
                              </div>

                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={priceData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#2a2a4a"
                                />

                                        <XAxis
                                          dataKey="time"
                                          stroke="#a0a0a0"
                                          angle={-35}
                                          textAnchor="end"
                                          height={55}
                                          tick={{
                                            fontSize: 13,
                                            fill: '#a0a0a0'
                                          }}
                                        />

                                        <YAxis
                                          stroke="#a0a0a0"
                                          tick={{
                                            fontSize: 13,
                                            fill: '#a0a0a0'
                                          }}
                                          domain={[
                                            Math.max(0, minPrice - padding),
                                            maxPrice + padding
                                          ]}
                                          tickFormatter={(v) => formatNumber(v)}
                                        />
                                <Tooltip
                                  formatter={(value) => [
                                    formatNumber(value),
                                    'Price'
                                  ]}
                                  labelFormatter={(label, payload) =>
                                  payload?.[0]?.payload?.fullTime || ''
                                  }
                                  contentStyle={{
                                    backgroundColor: '#131826',
                                    border: '1px solid #2f3a55',
                                    borderRadius: '10px',
                                    color: '#fff'
                                  }}
                                />

                                <Line
                                  type="monotone"
                                  dataKey="price"
                                  stroke="#00ff88"
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}


                {prepareChartData().length > 0 && (
                          <div className="h-64">
                              <div className="flex items-center gap-2 mb-4 mt-6">
            
                                <h4 className="text-sm font-semibold">
                                  Sales Activity
                                </h4>
                                <span className="text-[11px] text-sky-text-secondary">
                                          • Last 7 Days
                                </span>
                              </div>
                            <ResponsiveContainer width="100%" height="90%">
                              <LineChart data={prepareChartData()}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#2a2a4a"
                                />

                                            <XAxis
                                              dataKey="date"
                                              stroke="#a0a0a0"
                                              angle={-35}
                                              textAnchor="end"
                                              height={55}
                                              tick={{
                                                fontSize: 13,
                                                fill: '#a0a0a0'
                                              }}
                                            />

                                            <YAxis
                                              stroke="#a0a0a0"
                                              tick={{
                                                fontSize: 13,
                                                fill: '#a0a0a0'
                                              }}
                                              domain={[
                                                Math.max(0, minSales - salesPadding),
                                                maxSales + salesPadding
                                              ]}
                                            />

                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#131826',
                                    border: '1px solid #2f3a55',
                                    borderRadius: '10px',
                                    color: '#ffffff'
                                  }}
                                  labelStyle={{
                                    color: '#cbd5e1',
                                    fontWeight: 600
                                  }}
                                  itemStyle={{
                                    color: '#00ff88'
                                  }}
                                  cursor={{
                                    stroke: '#00ff88',
                                    strokeWidth: 1
                                  }}
                                />

                                <Line
                                  type="monotone"
                                  dataKey="sales"
                                  stroke="#00ff88"
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-sky-text-secondary">
                <FaHistory className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No sales history available for this item</p>
                <p className="text-sm mt-2">This item may be new or has low trading volume</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-sky-text-secondary">
            <FaHistory className="text-4xl mx-auto mb-3 opacity-50" />
            <p>Sales history is only available for Auction House (AH) items</p>
            <p className="text-sm mt-2">This item is sold on the Bazaar</p>
          </div>
        )}
      </div>

      {/* Coflnet Link */}
      <div className="text-center">
        <a 
          href={`https://sky.coflnet.com/item/${item.itemId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-info-blue hover:underline text-sm"
        >
          View full history on Coflnet →
        </a>
      </div>
    </div>
  );
}

export default ForgeDetail;