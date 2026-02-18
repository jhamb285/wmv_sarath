'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  onActiveCardChange?: (venueId: string | null) => void;
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
  onActiveCardChange,
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
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const internalDateChangeRef = useRef(false);

  const hasCards = cards.length > 0;

  // Track active card via scroll position
  const handleCarouselScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.offsetWidth * 0.85 + 12; // card width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(index, cards.length - 1));
  }, [cards.length]);

  // Reset carousel position AND immediately highlight first card when cards/filters change
  useEffect(() => {
    setActiveCardIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
    // Immediately notify parent of first card's venue
    if (onActiveCardChange && cards.length > 0) {
      onActiveCardChange(cards[0].venue.id);
    } else if (onActiveCardChange) {
      onActiveCardChange(null);
    }
  }, [activeDates, cards, onActiveCardChange]);

  // Notify parent of active card's venue ID on scroll/mode changes
  useEffect(() => {
    if (mode === 'list' && hasCards && !isDismissed && onActiveCardChange) {
      const activeCard = cards[activeCardIndex];
      onActiveCardChange(activeCard?.venue.id || null);
    } else if (mode === 'marker' && markerVenueId && onActiveCardChange) {
      onActiveCardChange(markerVenueId);
    } else if (onActiveCardChange && (isDismissed || !hasCards)) {
      onActiveCardChange(null);
    }
  }, [activeCardIndex, mode, markerVenueId, hasCards, isDismissed, onActiveCardChange]);

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

  // Date change → switch to list mode, collapse expanded card (unless from inside card), show panel
  useEffect(() => {
    const isInternal = internalDateChangeRef.current;
    internalDateChangeRef.current = false;

    setIsDismissed(false);
    setMode('list');
    setMarkerVenueId(null);
    setMarkerFullScreen(false);
    if (!isInternal) {
      setListFullScreenVenueId(null);
    }
  }, [activeDates]);

  // Cards changed (filter change) → collapse expanded card (skip if internal date change)
  useEffect(() => {
    if (!internalDateChangeRef.current) {
      setListFullScreenVenueId(null);
      setMarkerFullScreen(false);
    }
  }, [cards]);

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

  // Wrapped onDateChange for expanded cards — marks as internal so effects don't collapse
  const handleInternalDateChange = useCallback((dates: string[]) => {
    internalDateChangeRef.current = true;
    onDateChange?.(dates);
  }, [onDateChange]);

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
              onDateChange={handleInternalDateChange}
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
                onDateChange={handleInternalDateChange}
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
              onDateChange={handleInternalDateChange}
            />
          )}

          {/* Bottom slide-up carousel */}
          {hasCards && !listFullScreenVenueId && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-auto"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              {/* Horizontal carousel */}
              <div
                ref={scrollRef}
                className={`flex overflow-x-auto items-stretch ${cards.length === 1 ? 'justify-center' : ''}`}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  gap: '12px',
                  padding: '0 12px 12px 12px',
                }}
                onScroll={handleCarouselScroll}
              >
                {cards.map((card) => (
                  <div
                    key={card.event.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(card.venue.id, el);
                    }}
                    className="flex-shrink-0 flex"
                    style={{
                      width: '85%',
                      scrollSnapAlign: 'center',
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

              {/* Dot indicators */}
              {cards.length > 1 && (
                <div className="flex justify-center gap-1.5 pb-3">
                  {cards.map((_, index) => (
                    <div
                      key={index}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: index === activeCardIndex ? '16px' : '6px',
                        height: '6px',
                        background: index === activeCardIndex
                          ? 'rgba(0, 0, 0, 0.6)'
                          : 'rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default MobileEventList;
