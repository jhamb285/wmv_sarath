'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import MapContainer from '@/components/map/MapContainer';
import TopNav from '@/components/navigation/TopNav';
import CategoryPills from '@/components/filters/CategoryPills';
import EventListPanel from '@/components/events/EventListPanel';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import WelcomePopup from '@/components/onboarding/WelcomePopup';
import MobileHeroMap from '@/components/mobile/MobileHeroMap';
import MobileEventList from '@/components/mobile/MobileEventList';
import MobileEventCard from '@/components/mobile/MobileEventCard';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import {
  getCategoryColorForStackedCards,
  transformSupabaseDataToStackedCards
} from '@/lib/stacked-card-adapter';
import { type Venue, type HierarchicalFilterState } from '@/types';

export default function Home() {
  const [filters, setFilters] = useState<HierarchicalFilterState>({
    selectedPrimaries: {
      genres: [],
      vibes: []
    },
    selectedSecondaries: {
      genres: {},
      vibes: {}
    },
    expandedPrimaries: {
      genres: [],
      vibes: []
    },
    eventCategories: {
      selectedPrimaries: [],
      selectedSecondaries: {},
      expandedPrimaries: []
    },
    attributes: {
      venue: [],
      energy: [],
      timing: [],
      status: []
    },
    selectedAreas: ['All Dubai'],
    activeDates: [],
    activeOffers: [],
    searchQuery: ''
  });

  const { allVenues, filteredVenues, isLoading, error } = useClientSideVenues(filters);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { filterOptions } = useFilterOptions();

  // Compute per-venue date options (only dates the venue has events)
  const venueDateMap = useMemo(() => {
    const map = new Map<string, { day: string; date: string; dateKey: string; isToday: boolean }[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allVenues.forEach(venue => {
      if (!venue.event_date || !venue.venue_id) return;
      const venueKey = String(venue.venue_id);
      try {
        const d = new Date(venue.event_date);
        if (isNaN(d.getTime())) return;
        const dateKey = d.toDateString();

        if (!map.has(venueKey)) {
          map.set(venueKey, []);
        }
        const existing = map.get(venueKey)!;
        if (!existing.some(e => e.dateKey === dateKey)) {
          existing.push({
            day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dateKey,
            isToday: d.toDateString() === today.toDateString(),
          });
        }
      } catch { /* skip */ }
    });

    // Sort dates within each venue
    map.forEach((dates) => {
      dates.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
    });

    return map;
  }, [allVenues]);

  // Transform venues to card format for mobile list view (sorted by date, deduped by venue+event name)
  const cards = useMemo(() => {
    const rawCards = transformSupabaseDataToStackedCards(filteredVenues);
    // Deduplicate by venue + event name so the same recurring event shows only once
    // (card date pills already let users switch between available dates)
    // Prefer the card with date closest to today so the carousel focuses correctly
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const dedupMap = new Map<string, typeof rawCards[0]>();
    rawCards.forEach(card => {
      const key = `${card.venue.id}|${(card.event.event_name || '').toLowerCase().trim()}`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, card);
      } else {
        const existing = dedupMap.get(key)!;
        const existingDist = Math.abs(new Date(existing.event.event_date).getTime() - todayTime);
        const newDist = Math.abs(new Date(card.event.event_date).getTime() - todayTime);
        if (newDist < existingDist) {
          dedupMap.set(key, card);
        }
      }
    });
    let result = Array.from(dedupMap.values());

    // Post-filter: ensure card dates actually fall within the active date range
    if (filters.activeDates.length > 0) {
      result = result.filter(card => {
        try {
          const cardDate = new Date(card.event.event_date).toDateString();
          return filters.activeDates.includes(cardDate);
        } catch { return true; }
      });
    }

    return result.sort((a, b) => {
      const dateA = new Date(a.event.event_date).getTime() || 0;
      const dateB = new Date(b.event.event_date).getTime() || 0;
      return dateA - dateB;
    });
  }, [filteredVenues, filters.activeDates]);

  // All cards (unfiltered by date) for expanded card local date switching
  const allCards = useMemo(() => {
    const rawCards = transformSupabaseDataToStackedCards(allVenues);
    const eventMap = new Map<string, typeof rawCards[0]>();
    rawCards.forEach(card => {
      if (card.event.id && !eventMap.has(card.event.id)) {
        eventMap.set(card.event.id, card);
      }
    });
    return Array.from(eventMap.values());
  }, [allVenues]);

  // Deduplicate by venue_id for map markers
  const venues = useMemo(() => {
    const venueMap = new Map<number, typeof filteredVenues[0]>();
    filteredVenues.forEach(venue => {
      if (venue.venue_id && !venueMap.has(venue.venue_id)) {
        venueMap.set(venue.venue_id, venue);
      }
    });
    console.log('🗺️ MAP VIEW Deduplication - Input:', filteredVenues.length, 'Output:', venueMap.size);
    return Array.from(venueMap.values());
  }, [filteredVenues]);

  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [hoveredVenue, setHoveredVenue] = useState<Venue | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [desktopListView, setDesktopListView] = useState(false);
  const [listViewFullScreenId, setListViewFullScreenId] = useState<string | null>(null);
  const [mapClickCount, setMapClickCount] = useState(0);
  const [highlightedVenueId, setHighlightedVenueId] = useState<string | null>(null);
  const [presetRangeDates, setPresetRangeDates] = useState<string[]>([]);
  const [navHeight, setNavHeight] = useState(140);

  const handleDateChange = (dates: string[]) => {
    setFilters({ ...filters, activeDates: dates });
  };

  const handlePresetRangeDatesChange = useCallback((dates: string[]) => {
    setPresetRangeDates(dates);
  }, []);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenWelcome && !isLoading && venues.length > 0) {
      const timer = setTimeout(() => setShowWelcomePopup(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, venues.length]);

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false);
    sessionStorage.setItem('hasSeenWelcomePopup', 'true');
  };

  const handleVenueSelect = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);

  const handleFiltersChange = (newFilters: HierarchicalFilterState) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-background">
        <div className="retro-surface p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Venues</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (isLoading && venues.length === 0) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500/20 border-t-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm font-medium tracking-wide">Discovering events in Dubai...</p>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <main className="h-screen w-full flex flex-col bg-background">
        <h1 className="sr-only">Dubai Event Discovery - Find the Hottest Venues and Events</h1>

        {/* === DESKTOP LAYOUT (>= lg) === */}
        <div className="hidden lg:flex lg:flex-col lg:h-screen">
          {/* Desktop TopNav - old layout with inline date pills + category row */}
          <TopNav
            embedded={true}
            onSearchClick={() => setIsFilterSheetOpen(true)}
            showDatePicker={true}
            datePickerProps={{
              venues: filteredVenues,
              selectedDates: filters.activeDates,
              onDateChange: handleDateChange,
            }}
            showCategoryPills={true}
            categoryPillsContent={
              <CategoryPills
                filters={filters}
                onFiltersChange={handleFiltersChange}
                venues={venues}
                inlineMode={true}
              />
            }
            onListToggle={() => setDesktopListView(prev => !prev)}
            isListView={desktopListView}
            onPresetRangeDatesChange={handlePresetRangeDatesChange}
          />

          {/* Content: Split (list+map) or Full List */}
          <div className="flex-1 flex overflow-hidden">
            {/* Event List Panel */}
            <div
              className={`${desktopListView ? 'w-full' : 'w-[40%]'} border-r overflow-hidden transition-all duration-300`}
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <EventListPanel
                venues={filteredVenues}
                onVenueSelect={handleVenueSelect}
                onVenueHover={setHoveredVenue}
                selectedVenueId={selectedVenue?.venue_id}
                isLoading={isLoading}
              />
            </div>

            {/* Map Panel — hidden in list view */}
            {!desktopListView && (
              <div className="flex-1">
                <MapContainer
                  venues={venues}
                  onVenueSelect={handleVenueSelect}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  isLoading={isLoading}
                  embedMode={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* === MOBILE LAYOUT (< lg) === */}
        <div className="lg:hidden h-screen w-full relative overflow-hidden">
          {/* Mobile TopNav (fixed overlay, no profile) */}
          <TopNav
            embedded={false}
            hideProfile={true}
            onSearchClick={() => setIsFilterSheetOpen(true)}
            showDatePicker={true}
            datePickerProps={{
              venues: filteredVenues,
              selectedDates: filters.activeDates,
              onDateChange: handleDateChange,
            }}
            showCategoryPills={true}
            categoryPillsContent={
              <CategoryPills
                filters={filters}
                onFiltersChange={handleFiltersChange}
                venues={venues}
                inlineMode={true}
              />
            }
            onListToggle={() => setMobileView(prev => prev === 'map' ? 'list' : 'map')}
            isListView={mobileView === 'list'}
            onPresetRangeDatesChange={handlePresetRangeDatesChange}
            onHeightChange={setNavHeight}
          />

          {mobileView === 'map' ? (
            <>
              {/* Full-screen Map (behind everything, below TopNav) */}
              <MobileHeroMap
                venues={venues}
                onVenueSelect={handleVenueSelect}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isLoading={isLoading}
                onMapClick={() => setMapClickCount(c => c + 1)}
                highlightedVenueId={highlightedVenueId}
              />

              {/* Event List — slides up from bottom when events exist */}
              <MobileEventList
                cards={cards}
                allCards={allCards}
                getCategoryColor={getCategoryColorForStackedCards}
                activeDates={filters.activeDates}
                selectedVenueId={selectedVenue?.venue_id}
                venueDateMap={venueDateMap}
                selectedDates={filters.activeDates}
                onDateChange={handleDateChange}
                dismissSignal={mapClickCount}
                onActiveCardChange={setHighlightedVenueId}
                presetRangeDates={presetRangeDates}
                navHeight={navHeight}
              />
            </>
          ) : (
            /* Full-screen List View */
            <div
              className="absolute inset-0 overflow-y-auto px-3 pb-6 space-y-2"
              style={{
                top: `${navHeight + 8}px`,
                backgroundColor: 'rgba(10, 10, 26, 1)',
              }}
            >
              {cards.length > 0 ? (
                <>
                  {cards.map((card, index) => (
                    <MobileEventCard
                      key={`${card.venue.id}-${card.event.id || index}`}
                      card={card}
                      getCategoryColor={getCategoryColorForStackedCards}
                      isExpanded={selectedVenue?.venue_id?.toString() === card.venue.id}
                      onToggle={() => {
                        setSelectedVenue(prev =>
                          prev?.venue_id?.toString() === card.venue.id ? null : { venue_id: Number(card.venue.id) } as Venue
                        );
                      }}
                      isFullScreen={listViewFullScreenId === card.venue.id}
                      onFullScreenToggle={() => {
                        setListViewFullScreenId(prev => prev === card.venue.id ? null : card.venue.id);
                      }}
                      onClose={() => {
                        setListViewFullScreenId(null);
                        setSelectedVenue(null);
                      }}
                      dateOptions={venueDateMap.get(card.venue.id) || []}
                      selectedDates={filters.activeDates}
                      onDateChange={handleDateChange}
                      isPresetRange={presetRangeDates.length > 0}
                      presetRangeDates={presetRangeDates}
                      navHeight={navHeight}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-gray-400 text-sm">No events found for the selected filters.</p>
                  <p className="text-gray-500 text-xs mt-1">Try changing the date or category.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Filter Bottom Sheet (shared across desktop + mobile) */}
        <FilterBottomSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
        />

        {/* Welcome Popup */}
        <WelcomePopup
          isOpen={showWelcomePopup}
          onClose={handleCloseWelcomePopup}
        />
      </main>
    </ThemeProvider>
  );
}
