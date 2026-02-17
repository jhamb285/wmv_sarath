'use client';

import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';

interface EventCardData {
  event: {
    id: string;
    venue_id: string;
    event_name: string;
    event_subtitle: string;
    event_time_start: string;
    event_time_end: string;
    event_date: string;
    event_entry_price: string;
    event_offers: string;
    category: string;
    artist?: string;
  };
  venue: {
    id: string;
    venue_name: string;
    venue_rating: number;
    venue_review_count: number;
    venue_location: string;
  };
}

interface MobileFeaturedCardProps {
  card: EventCardData;
  onClick?: () => void;
}

const PLACEHOLDER_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVW-pbYSH_W9UliC5eEBX7oWNcsAJN9LETGg&s';

const MobileFeaturedCard: React.FC<MobileFeaturedCardProps> = ({ card, onClick }) => {
  const { event, venue } = card;

  const priceDisplay = event.event_entry_price;
  const isFree = priceDisplay === 'Free' || priceDisplay === 'AED 0' || priceDisplay?.toLowerCase().includes('free');

  return (
    <div
      className="flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
      style={{
        background: 'rgba(10, 10, 26, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={PLACEHOLDER_IMAGE}
          alt={venue.venue_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="text-white font-bold text-sm truncate leading-tight">
            {venue.venue_name}
          </h4>
          <p className="text-gray-400 text-xs truncate mt-0.5">
            {event.event_subtitle || event.category}
            {event.artist ? `  ${event.artist}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {event.event_time_start && (
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.event_time_start}
            </span>
          )}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto"
            style={{
              background: isFree ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 201, 103, 0.15)',
              color: isFree ? '#34d399' : '#f8c967',
              border: `1px solid ${isFree ? 'rgba(52, 211, 153, 0.25)' : 'rgba(248, 201, 103, 0.25)'}`,
            }}
          >
            {isFree ? 'Free' : priceDisplay}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-gray-500 self-center flex-shrink-0" />
    </div>
  );
};

export default MobileFeaturedCard;
