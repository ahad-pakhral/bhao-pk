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
  const chartRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-3)', padding: '20px', textAlign: 'center' }}>No price history available</div>;
  }

  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const singleBar = data.length === 1;

  const getBarHeight = (price: number) => {
    if (singleBar) return 60;
    if (priceRange > 0) return ((price - minPrice) / priceRange) * 140 + 20;
    return 50;
  };

  return (
    <div>
      <div
        ref={chartRef}
        style={{
          position: 'relative',
          height: singleBar ? '100px' : '200px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: singleBar ? '0' : '3px',
          cursor: 'crosshair',
          padding: '16px 0',
          justifyContent: singleBar ? 'center' : 'flex-start',
        }}
      >
        {data.map((point, index) => {
          const height = getBarHeight(point.price);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              style={{
                width: singleBar ? '120px' : undefined,
                flex: singleBar ? undefined : 1,
                height: `${height}px`,
                background: isHovered ? 'var(--accent)' : 'var(--accent-soft)',
                transition: 'all 0.2s ease',
                borderRadius: '4px 4px 0 0',
                minWidth: singleBar ? '120px' : '8px',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}

        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              left: singleBar ? '50%' : `${(hoveredIndex / data.length) * 100 + 50 / data.length}%`,
              top: '0',
              transform: 'translateX(-50%)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'var(--text)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
              marginBottom: '4px',
            }}
          >
            <div>{data[hoveredIndex].date}</div>
            <div style={{ fontWeight: 'bold' }}>Rs. {data[hoveredIndex].price.toLocaleString()}</div>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: singleBar ? '1fr' : 'repeat(4, 1fr)',
        gap: '12px',
        marginTop: '16px',
        padding: '12px 16px',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Price</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}>
            Rs. {data[data.length - 1].price.toLocaleString()}
          </div>
        </div>
        {!singleBar && (
          <>
            <div>
              <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lowest</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-success)', fontFamily: 'var(--font-mono)' }}>Rs. {minPrice.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highest</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FF4444', fontFamily: 'var(--font-mono)' }}>Rs. {maxPrice.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>Rs. {Math.round(data.reduce((sum, d) => sum + d.price, 0) / data.length).toLocaleString()}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
