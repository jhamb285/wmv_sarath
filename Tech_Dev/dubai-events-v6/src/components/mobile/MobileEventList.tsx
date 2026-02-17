'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MobileEventCard from './MobileEventCard';
import MobileMarkerCard from './MobileMarkerCard';

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
    music_genre?: string;
    event_vibe?: string;
    confidence_score?: number;
    analysis_notes?: string;
    website_social?: string;
    event_categories?: Array<{ primary: string; secondary?: string }>;
  };
  venue: {
    id: string;
    venue_name: string;
    venue_rating: number;
    venue_review_count: number;
    venue_location: string;
    venue_instagram?: string;
    venue_phone?: string;
    venue_coordinates?: { lat: number; lng: number };
    venue_website?: string;
    venue_address?: string;
    venue_highlights?: string;
    venue_atmosphere?: string;
    attributes?: {
      venue?: string[];
      energy?: string[];
      status?: string[];
      timing?: string[];
    };
  };
}

interface DateOption {
  day: string;
  date: string;
  dateKey: string;
  isToday: boolean;
}

interface MobileEventListProps {
  cards: EventCardData[];
  getCategoryColor: (category: string) => { hue: number; saturation: number };
  activeDates?: string[];
  selectedVenueId?: number | null;
  venueDateMap?: Map<string, DateOption[]>;
  selectedDates?: string[];
  onDateChange?: (dates: string[]) => void;
  dismissSignal?: number;
}

// Two modes: 'list' shows all cards, 'marker' shows single venue card
type PanelMode = 'list' | 'marker';

const MobileEventList: React.FC<MobileEventListProps> = ({
  cards,
  getCategoryColor,
  activeDates,
  selectedVenueId,
  venueDateMap = new Map(),
  selectedDates = [],
  onDateChange,
  dismissSignal = 0,
}) => {
  const [mode, setMode] = useState<PanelMode>('list');
  const [markerVenueId, setMarkerVenueId] = useState<string | null>(null);
  const [markerFullScreen, setMarkerFullScreen] = useState(false);
  const [listFullScreenVenueId, setListFullScreenVenueId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevSelectedVenueIdRef = useRef<number | null | undefined>(selectedVenueId);

  const hasCards = cards.length > 0;

  // Dismiss when parent signals (e.g. map click)
  useEffect(() => {
    if (dismissSignal > 0) {
      setIsDismissed(true);
      setMarkerFullScreen(false);
      setListFullScreenVenueId(null);
      setMarkerVenueId(null);
    }
  }, [dismissSignal]);

  // Trigger slide-up animation when content exists (and not dismissed)
  const hasContent = mode === 'list' ? hasCards : markerVenueId !== null;
  useEffect(() => {
    if (hasContent && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [hasContent, isDismissed]);

  // Date change → switch to list mode and show panel
  useEffect(() => {
    setIsDismissed(false);
    setMode('list');
    setMarkerVenueId(null);
    setMarkerFullScreen(false);
  }, [activeDates]);

  // Map marker click → switch to marker mode with single card
  useEffect(() => {
    const venueChanged = prevSelectedVenueIdRef.current !== selectedVenueId;
    prevSelectedVenueIdRef.current = selectedVenueId;

    if (selectedVenueId != null && venueChanged) {
      const venueIdStr = selectedVenueId.toString();
      const matchingCard = cards.find(c => c.venue.id === venueIdStr);
      if (matchingCard) {
        setMode('marker');
        setMarkerVenueId(venueIdStr);
        setMarkerFullScreen(false);
        setIsDismissed(false);
      }
    }
  }, [selectedVenueId, cards]);

  // --- List mode handlers ---
  const handleListFullScreenToggle = useCallback((venueId: string) => {
    setListFullScreenVenueId(prev => prev === venueId ? null : venueId);
  }, []);

  const handleListDismiss = useCallback(() => {
    setIsDismissed(true);
    setListFullScreenVenueId(null);
  }, []);

  // --- Marker mode handlers ---
  const handleMarkerFullScreenToggle = useCallback(() => {
    setMarkerFullScreen(prev => !prev);
  }, []);

  const handleMarkerClose = useCallback(() => {
    setMarkerVenueId(null);
    setMarkerFullScreen(false);
    setIsDismissed(true);
  }, []);

  // Find card data for marker mode
  const markerCard = markerVenueId
    ? cards.find(c => c.venue.id === markerVenueId)
    : null;

  // Find card data for list full-screen
  const listFullScreenCard = listFullScreenVenueId
    ? cards.find(c => c.venue.id === listFullScreenVenueId)
    : null;

  return (
    <>
      {/* ============================================= */}
      {/* MARKER MODE: Single card for map marker click */}
      {/* ============================================= */}
      {mode === 'marker' && markerCard && (
        <>
          {/* Full-screen overlay (marker) */}
          {markerFullScreen && (
            <MobileMarkerCard
              card={markerCard}
              getCategoryColor={getCategoryColor}
              isFullScreen={true}
              onFullScreenToggle={() => setMarkerFullScreen(false)}
              onClose={handleMarkerClose}
              dateOptions={venueDateMap.get(markerCard.venue.id) || []}
              selectedDates={selectedDates}
              onDateChange={onDateChange}
            />
          )}

          {/* Bottom slide-up single card (marker) */}
          {!markerFullScreen && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto px-3 pb-4"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              <MobileMarkerCard
                card={markerCard}
                getCategoryColor={getCategoryColor}
                isFullScreen={false}
                onFullScreenToggle={handleMarkerFullScreenToggle}
                onClose={handleMarkerClose}
                dateOptions={venueDateMap.get(markerCard.venue.id) || []}
                selectedDates={selectedDates}
                onDateChange={onDateChange}
              />
            </div>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* LIST MODE: Scrollable list on date change     */}
      {/* ============================================= */}
      {mode === 'list' && (
        <>
          {/* Full-screen overlay (list) */}
          {listFullScreenCard && (
            <MobileEventCard
              card={listFullScreenCard}
              getCategoryColor={getCategoryColor}
              isExpanded={true}
              onToggle={() => setListFullScreenVenueId(null)}
              isFullScreen={true}
              onFullScreenToggle={() => setListFullScreenVenueId(null)}
              onClose={() => setListFullScreenVenueId(null)}
              dateOptions={venueDateMap.get(listFullScreenCard.venue.id) || []}
              selectedDates={selectedDates}
              onDateChange={onDateChange}
            />
          )}

          {/* Bottom slide-up panel with scrollable card list */}
          {hasCards && !listFullScreenVenueId && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-auto"
              style={{
                maxHeight: '52%',
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              {/* Scrollable card list */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 pb-4 space-y-3"
                style={{
                  scrollbarWidth: 'none',
                }}
              >
                {cards.map((card) => (
                  <div
                    key={card.event.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(card.venue.id, el);
                    }}
                  >
                    <MobileEventCard
                      card={card}
                      getCategoryColor={getCategoryColor}
                      isExpanded={true}
                      onToggle={() => handleListFullScreenToggle(card.venue.id)}
                      isFullScreen={false}
                      onFullScreenToggle={() => handleListFullScreenToggle(card.venue.id)}
                      onClose={handleListDismiss}
                      dateOptions={venueDateMap.get(card.venue.id) || []}
                      selectedDates={selectedDates}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default MobileEventList;
