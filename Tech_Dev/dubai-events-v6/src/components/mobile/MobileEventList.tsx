'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MobileEventCard from './MobileEventCard';

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
  allCards?: EventCardData[];
  getCategoryColor: (category: string) => { hue: number; saturation: number };
  activeDates?: string[];
  selectedVenueId?: number | null;
  venueDateMap?: Map<string, DateOption[]>;
  selectedDates?: string[];
  onDateChange?: (dates: string[]) => void;
  dismissSignal?: number;
  onActiveCardChange?: (venueId: string | null) => void;
  presetRangeDates?: string[];
  navHeight?: number;
}

// Two modes: 'list' shows all cards, 'marker' shows single venue card
type PanelMode = 'list' | 'marker';

const MobileEventList: React.FC<MobileEventListProps> = ({
  cards,
  allCards = [],
  getCategoryColor,
  activeDates,
  selectedVenueId,
  venueDateMap = new Map(),
  selectedDates = [],
  onDateChange,
  dismissSignal = 0,
  onActiveCardChange,
  presetRangeDates = [],
  navHeight = 140,
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
  const [expandedCardOverride, setExpandedCardOverride] = useState<EventCardData | null>(null);
  const [expandedLocalDates, setExpandedLocalDates] = useState<string[]>([]);
  const [miniCardOverrides, setMiniCardOverrides] = useState<Map<string, { card: EventCardData; dates: string[] }>>(new Map());

  // Filter cards: when specific dates are active, only show cards for venues
  // that actually have events on those dates (using venueDateMap as source of truth)
  const displayCards = useMemo(() => {
    if (!activeDates || activeDates.length === 0) return cards;
    return cards.filter(card => {
      const dates = venueDateMap.get(card.venue.id);
      if (!dates || dates.length === 0) return false;
      return dates.some(d => activeDates.includes(d.dateKey));
    });
  }, [cards, activeDates, venueDateMap]);

  const hasCards = displayCards.length > 0;

  // Track active card via scroll position
  const handleCarouselScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.offsetWidth * 0.85 + 12; // card width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(index, displayCards.length - 1));
  }, [displayCards.length]);

  // Reset carousel position AND immediately highlight first card when cards/filters change
  // When All Dates (activeDates=[]), auto-scroll to today's first card
  useEffect(() => {
    let startIndex = 0;

    if ((!activeDates || activeDates.length === 0) && displayCards.length > 0) {
      // All Dates mode — find first card with today's date
      const todayStr = new Date().toDateString();
      const todayIndex = displayCards.findIndex(card => {
        try {
          return new Date(card.event.event_date).toDateString() === todayStr;
        } catch { return false; }
      });
      if (todayIndex >= 0) startIndex = todayIndex;
    }

    setActiveCardIndex(startIndex);

    // Scroll to the target card after render
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      if (startIndex === 0) {
        scrollRef.current.scrollLeft = 0;
      } else {
        // Look up the card element by venue ID (reliable, order-independent)
        const targetVenueId = displayCards[startIndex]?.venue.id;
        const targetEl = targetVenueId ? cardRefs.current.get(targetVenueId) : null;
        if (targetEl) {
          targetEl.scrollIntoView({ inline: 'start', block: 'nearest' });
        }
      }
    });

    // Immediately notify parent of active card's venue
    const activeCard = displayCards[startIndex];
    if (onActiveCardChange && activeCard) {
      onActiveCardChange(activeCard.venue.id);
    } else if (onActiveCardChange) {
      onActiveCardChange(null);
    }
  }, [activeDates, displayCards, onActiveCardChange]);

  // Notify parent of active card's venue ID on scroll/mode changes
  useEffect(() => {
    if (mode === 'list' && hasCards && !isDismissed && onActiveCardChange) {
      const activeCard = displayCards[activeCardIndex];
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

  // Date change → switch to list mode, collapse expanded card, show panel
  useEffect(() => {
    setIsDismissed(false);
    setMode('list');
    setMarkerVenueId(null);
    setMarkerFullScreen(false);
    setListFullScreenVenueId(null);
    setExpandedCardOverride(null);
    setExpandedLocalDates([]);
    setMiniCardOverrides(new Map());
  }, [activeDates]);

  // Cards changed (filter change) → collapse expanded card
  useEffect(() => {
    setListFullScreenVenueId(null);
    setMarkerFullScreen(false);
    setExpandedCardOverride(null);
    setExpandedLocalDates([]);
    setMiniCardOverrides(new Map());
  }, [displayCards]);

  // Map marker click → switch to marker mode with single card
  useEffect(() => {
    const venueChanged = prevSelectedVenueIdRef.current !== selectedVenueId;
    prevSelectedVenueIdRef.current = selectedVenueId;

    if (selectedVenueId != null && venueChanged) {
      const venueIdStr = selectedVenueId.toString();
      const matchingCard = displayCards.find(c => c.venue.id === venueIdStr);
      if (matchingCard) {
        setMode('marker');
        setMarkerVenueId(venueIdStr);
        setMarkerFullScreen(false);
        setIsDismissed(false);
      }
    }
  }, [selectedVenueId, displayCards]);

  // --- List mode handlers ---
  const handleListFullScreenToggle = useCallback((venueId: string) => {
    setListFullScreenVenueId(prev => {
      if (prev === venueId) {
        setExpandedCardOverride(null);
        setExpandedLocalDates([]);
        return null;
      }
      return venueId;
    });
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

  // Local date change for minicards — switches card data without changing global filter
  // Only allows switching to dates within the active date range (or any date if All Dates)
  const handleMiniCardDateChange = useCallback((venueId: string, dates: string[]) => {
    const dateKey = dates[0];
    if (!dateKey) return;

    // If specific dates are active, only allow switching within that range
    if (activeDates && activeDates.length > 0 && !activeDates.includes(dateKey)) {
      return;
    }

    const matchingCard = allCards.find(c => {
      if (c.venue.id !== venueId) return false;
      try {
        return new Date(c.event.event_date).toDateString() === dateKey;
      } catch { return false; }
    });
    if (matchingCard) {
      setMiniCardOverrides(prev => {
        const next = new Map(prev);
        next.set(venueId, { card: matchingCard, dates });
        return next;
      });
    }
  }, [allCards, activeDates]);

  // Local date change for expanded cards — switches card data without changing global filter
  const handleExpandedDateChange = useCallback((venueId: string, dates: string[]) => {
    const dateKey = dates[0];
    if (!dateKey) return;
    setExpandedLocalDates(dates);
    // Find matching card for this venue on the new date from allCards
    const matchingCard = allCards.find(c => {
      if (c.venue.id !== venueId) return false;
      try {
        const cardDateKey = new Date(c.event.event_date).toDateString();
        return cardDateKey === dateKey;
      } catch { return false; }
    });
    if (matchingCard) {
      setExpandedCardOverride(matchingCard);
    }
  }, [allCards]);

  // Preset range = dropdown has a range preset active (e.g., "This Week")
  const isPresetRange = presetRangeDates.length > 0;

  // Find card data for marker mode
  const markerCard = markerVenueId
    ? displayCards.find(c => c.venue.id === markerVenueId)
    : null;

  // Find card data for list full-screen (use override if user changed date inside card)
  const listFullScreenCard = listFullScreenVenueId
    ? (expandedCardOverride && expandedCardOverride.venue.id === listFullScreenVenueId
        ? expandedCardOverride
        : displayCards.find(c => c.venue.id === listFullScreenVenueId))
    : null;

  // Effective selected dates for expanded card (local override or global)
  const expandedSelectedDates = expandedLocalDates.length > 0 ? expandedLocalDates : selectedDates;

  return (
    <>
      {/* ============================================= */}
      {/* MARKER MODE: Single card for map marker click */}
      {/* ============================================= */}
      {mode === 'marker' && markerCard && (
        <>
          {/* Full-screen overlay (marker) */}
          {markerFullScreen && (
            <MobileEventCard
              card={markerCard}
              getCategoryColor={getCategoryColor}
              isExpanded={true}
              onToggle={() => setMarkerFullScreen(false)}
              isFullScreen={true}
              onFullScreenToggle={() => setMarkerFullScreen(false)}
              onClose={handleMarkerClose}
              dateOptions={venueDateMap.get(markerCard.venue.id) || []}
              selectedDates={selectedDates}
              onDateChange={onDateChange}
              isPresetRange={isPresetRange}
              presetRangeDates={presetRangeDates}
              navHeight={navHeight}
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
              <MobileEventCard
                card={markerCard}
                getCategoryColor={getCategoryColor}
                isExpanded={true}
                onToggle={handleMarkerFullScreenToggle}
                isFullScreen={false}
                onFullScreenToggle={handleMarkerFullScreenToggle}
                onClose={handleMarkerClose}
                dateOptions={venueDateMap.get(markerCard.venue.id) || []}
                selectedDates={selectedDates}
                onDateChange={onDateChange}
                isPresetRange={isPresetRange}
                presetRangeDates={presetRangeDates}
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
              onToggle={() => { setListFullScreenVenueId(null); setExpandedCardOverride(null); setExpandedLocalDates([]); }}
              isFullScreen={true}
              onFullScreenToggle={() => { setListFullScreenVenueId(null); setExpandedCardOverride(null); setExpandedLocalDates([]); }}
              onClose={() => { setListFullScreenVenueId(null); setExpandedCardOverride(null); setExpandedLocalDates([]); }}
              dateOptions={venueDateMap.get(listFullScreenCard.venue.id) || []}
              selectedDates={expandedSelectedDates}
              onDateChange={(dates) => handleExpandedDateChange(listFullScreenCard.venue.id, dates)}
              isPresetRange={isPresetRange}
              presetRangeDates={presetRangeDates}
              navHeight={navHeight}
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
                className={`flex overflow-x-auto items-stretch ${displayCards.length === 1 ? 'justify-center' : ''}`}
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
                {displayCards.map((card) => {
                  const override = miniCardOverrides.get(card.venue.id);
                  // Only use override if its date falls within the active date range
                  const isOverrideValid = override && (
                    !activeDates || activeDates.length === 0 ||
                    override.dates.some(d => activeDates.includes(d))
                  );
                  const displayCard = isOverrideValid ? override.card : card;
                  const displayDates = isOverrideValid ? override.dates : selectedDates;
                  return (
                    <div
                      key={`${card.venue.id}-${card.event.id}`}
                      ref={(el) => {
                        if (el) cardRefs.current.set(card.venue.id, el);
                      }}
                      className="flex-shrink-0 flex"
                      style={{
                        width: displayCards.length === 1 ? '92%' : '85%',
                        scrollSnapAlign: 'center',
                      }}
                    >
                      <MobileEventCard
                        card={displayCard}
                        getCategoryColor={getCategoryColor}
                        isExpanded={true}
                        onToggle={() => {
                          // Carry minicard override into expanded card
                          if (override) {
                            setExpandedCardOverride(override.card);
                            setExpandedLocalDates(override.dates);
                          }
                          handleListFullScreenToggle(card.venue.id);
                        }}
                        isFullScreen={false}
                        onFullScreenToggle={() => {
                          if (override) {
                            setExpandedCardOverride(override.card);
                            setExpandedLocalDates(override.dates);
                          }
                          handleListFullScreenToggle(card.venue.id);
                        }}
                        onClose={handleListDismiss}
                        dateOptions={venueDateMap.get(card.venue.id) || []}
                        selectedDates={displayDates}
                        onDateChange={(dates) => handleMiniCardDateChange(card.venue.id, dates)}
                        isPresetRange={isPresetRange}
                        presetRangeDates={presetRangeDates}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Dot indicators */}
              {displayCards.length > 1 && (
                <div className="flex justify-center gap-1.5 pb-3">
                  {displayCards.map((_, index) => (
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
