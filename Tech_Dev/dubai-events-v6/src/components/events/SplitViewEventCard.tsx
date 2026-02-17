'use client';

import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import type { Venue } from '@/types';

interface SplitViewEventCardProps {
  venue: Venue;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const PLACEHOLDER_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVW-pbYSH_W9UliC5eEBX7oWNcsAJN9LETGg&s';

const SplitViewEventCard: React.FC<SplitViewEventCardProps> = ({
  venue,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const categoryLabel = venue.event_categories?.[0]?.primary || venue.category || 'Event';
  const eventName = (venue as any).event_name || venue.name;
  const eventTime = (venue as any).event_time || '';
  const ticketPrice = (venue as any).ticket_price;

  return (
    <div
      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-purple-600/15 border border-purple-500/25 shadow-[0_2px_12px_rgba(124,58,237,0.12)]'
          : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08]'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={PLACEHOLDER_IMAGE}
          alt={venue.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="text-white font-semibold text-sm truncate leading-tight">
            {eventName}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{venue.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-500" />
            <p className="text-gray-500 text-[11px] truncate">{venue.area}</p>
          </div>
        </div>

        {/* Bottom row: category badge + time + price */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 font-semibold truncate max-w-[100px] border border-purple-500/15">
            {categoryLabel}
          </span>
          {eventTime && (
            <span className="flex items-center gap-1 text-gray-400 text-[11px]">
              <Clock className="w-3 h-3" />
              {eventTime.split(' - ')[0]}
            </span>
          )}
          {ticketPrice !== undefined && ticketPrice !== null && (
            <span className="text-gray-400 text-[11px] ml-auto">
              {ticketPrice === 0 || ticketPrice === '0' || ticketPrice === 'Free'
                ? 'Free'
                : typeof ticketPrice === 'number'
                  ? `AED ${ticketPrice}`
                  : ticketPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitViewEventCard;
