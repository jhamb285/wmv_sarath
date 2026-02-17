'use client';

import React from 'react';
import SplitViewEventCard from './SplitViewEventCard';
import type { Venue } from '@/types';

interface EventListPanelProps {
  venues: Venue[];
  onVenueSelect: (venue: Venue) => void;
  onVenueHover?: (venue: Venue | null) => void;
  selectedVenueId?: number | string;
  isLoading?: boolean;
}

const EventListPanel: React.FC<EventListPanelProps> = ({
  venues,
  onVenueSelect,
  onVenueHover,
  selectedVenueId,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500/20 border-t-purple-500"></div>
          <span className="text-sm text-gray-400 font-medium">Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a1a]">
      {/* Results header */}
      <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {venues.length} event{venues.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin">
        {venues.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500 text-sm">No events match your filters</p>
          </div>
        ) : (
          venues.map((venue, index) => (
            <SplitViewEventCard
              key={`${venue.venue_id}-${index}`}
              venue={venue}
              isSelected={selectedVenueId === venue.venue_id}
              onClick={() => onVenueSelect(venue)}
              onMouseEnter={() => onVenueHover?.(venue)}
              onMouseLeave={() => onVenueHover?.(null)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EventListPanel;
