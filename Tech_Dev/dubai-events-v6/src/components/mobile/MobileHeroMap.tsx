'use client';

import React from 'react';
import MapContainer from '@/components/map/MapContainer';
import type { Venue, HierarchicalFilterState } from '@/types';

interface MobileHeroMapProps {
  venues: Venue[];
  onVenueSelect: (venue: Venue) => void;
  filters: HierarchicalFilterState;
  onFiltersChange: (filters: HierarchicalFilterState) => void;
  isLoading: boolean;
  onMapClick?: () => void;
}

const MobileHeroMap: React.FC<MobileHeroMapProps> = ({
  venues,
  onVenueSelect,
  filters,
  onFiltersChange,
  isLoading,
  onMapClick,
}) => {
  return (
    <div className="absolute inset-0">
      {/* Interactive Map (full screen, behind navbar) */}
      <MapContainer
        venues={venues}
        onVenueSelect={onVenueSelect}
        filters={filters}
        onFiltersChange={onFiltersChange}
        isLoading={isLoading}
        embedMode={true}
        disableFloatingPanel={true}
        gestureMode="cooperative"
        onMapClick={onMapClick}
      />

      {/* Dark gradient overlay for navbar + hero text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            180deg,
            rgba(10, 10, 26, 0.85) 0%,
            rgba(10, 10, 26, 0.55) 18%,
            rgba(10, 10, 26, 0.15) 35%,
            rgba(10, 10, 26, 0.0) 50%,
            rgba(10, 10, 26, 0.0) 100%
          )`,
        }}
      />

      {/* Hero Text Overlay — positioned below navbar */}
      <div className="absolute inset-x-0 pointer-events-none px-5" style={{ top: '230px' }}>
        <h2 className="text-[28px] font-bold text-white leading-[1.2] tracking-tight drop-shadow-lg">
          Discover Dubai&apos;s<br />
          <span
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              color: '#f8c967',
              fontWeight: 700,
            }}
          >
            Best Events
          </span>{' '}
          Here
        </h2>
        <p className="text-gray-400/90 text-[13px] mt-2 leading-relaxed max-w-[280px] drop-shadow-md">
          Find top venues, concerts, sports, and more on an interactive map of Dubai.
        </p>
      </div>
    </div>
  );
};

export default MobileHeroMap;
