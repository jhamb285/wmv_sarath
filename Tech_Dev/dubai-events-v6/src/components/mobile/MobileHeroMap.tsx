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
  highlightedVenueId?: string | null;
}

const MobileHeroMap: React.FC<MobileHeroMapProps> = ({
  venues,
  onVenueSelect,
  filters,
  onFiltersChange,
  isLoading,
  onMapClick,
  highlightedVenueId,
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
        highlightedVenueId={highlightedVenueId}
      />

    </div>
  );
};

export default MobileHeroMap;
