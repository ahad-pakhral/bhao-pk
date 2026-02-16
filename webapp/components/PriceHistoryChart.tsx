"use client";

import React, { useState, useRef } from 'react';

interface PricePoint {
  date: string;
  price: number;
}

interface PriceHistoryChartProps {
  data: PricePoint[];
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>No price history available</div>;
  }

  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const barWidth = rect.width / data.length;
    const index = Math.floor(x / barWidth);

    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
      setCursorPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div>
      <div
        ref={chartRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          height: '200px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '3px',
          cursor: 'crosshair',
          padding: '20px 0',
        }}
      >
        {data.map((point, index) => {
          const height = priceRange > 0 ? ((point.price - minPrice) / priceRange) * 160 + 20 : 50;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${height}px`,
                background: isHovered ? 'var(--accent-primary)' : '#333',
                transition: 'all 0.2s ease',
                opacity: isHovered ? 0.8 : 1,
                position: 'relative',
              }}
            />
          );
        })}

        {/* Crosshair cursor */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${cursorPosition.x}px`,
              top: 0,
              bottom: 0,
              width: '1px',
              background: 'var(--accent-primary)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${cursorPosition.x}px`,
              top: `${Math.max(10, cursorPosition.y - 50)}px`,
              transform: 'translateX(-50%)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-primary)',
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--accent-primary)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <div>{data[hoveredIndex].date}</div>
            <div style={{ fontWeight: 'bold' }}>Rs. {data[hoveredIndex].price.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginTop: '20px',
        padding: '16px',
        background: 'var(--bg-surface)',
        borderRadius: '8px',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>Current</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>Rs. {data[data.length - 1].price.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>Lowest</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-success)' }}>Rs. {minPrice.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>Highest</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-alert)' }}>Rs. {maxPrice.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>Average</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Rs. {Math.round(data.reduce((sum, d) => sum + d.price, 0) / data.length).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};
