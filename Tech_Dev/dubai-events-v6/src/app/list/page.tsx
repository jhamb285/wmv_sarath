'use client';

// List view with integrated TopNav date picker
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { type HierarchicalFilterState } from '@/types';
import TopNav from '@/components/navigation/TopNav';
import CategoryPills from '@/components/filters/CategoryPills';
import StackedEventCards from '@/components/events/StackedEventCards';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import {
  getCategoryColorForStackedCards,
  transformSupabaseDataToStackedCards
} from '@/lib/stacked-card-adapter';

export default function ListView() {
  const router = useRouter();

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
    activeDates: [], // Default to All Dates
    activeOffers: [],
    searchQuery: ''
  });

  const { allVenues, filteredVenues, isLoading } = useClientSideVenues(filters);

  // State for filter sheet modal
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(130);
  const handleNavHeightChange = useCallback((h: number) => setNavHeight(h), []);

  // Get filter options for FilterBottomSheet
  const { filterOptions } = useFilterOptions();

  const handleFiltersChange = (newFilters: HierarchicalFilterState) => {
    console.log('🔥 LIST VIEW - Filter change requested:', {
      old: filters.eventCategories,
      new: newFilters.eventCategories
    });
    setFilters(newFilters);
  };

  // Date handling for date picker
  const handleDateChange = (dates: string[]) => {
    setFilters({
      ...filters,
      activeDates: dates
    });
  };

  // Debug: Log filter state changes and venue data
  useEffect(() => {
    console.log('🔥 LIST VIEW - Filter state updated:', filters.eventCategories);
    console.log('🔥 LIST VIEW - Filtered venues count:', filteredVenues.length);
  }, [filters, filteredVenues.length]);

  // Debug: Log venue structure on initial load
  useEffect(() => {
    if (filteredVenues.length > 0) {
      console.log('🔥 LIST VIEW - Sample venue data:', {
        venue: filteredVenues[0],
        hasEventCategories: !!filteredVenues[0].event_categories,
        eventCategories: filteredVenues[0].event_categories,
        totalVenues: filteredVenues.length,
        venuesWithCategories: filteredVenues.filter(v => v.event_categories?.length > 0).length
      });
    }
  }, [filteredVenues]);

  // Transform venues to card format (date filtering handled by useClientSideVenues via filters.activeDates)
  const cards = useMemo(() => {
    // Transform venues to cards first
    const allCards = transformSupabaseDataToStackedCards(filteredVenues);

    // Deduplicate by event ID to prevent React duplicate key errors
    const eventMap = new Map<string, typeof allCards[0]>();
    allCards.forEach(card => {
      if (card.event.id && !eventMap.has(card.event.id)) {
        eventMap.set(card.event.id, card);
      }
    });

    console.log('🔍 LIST VIEW Deduplication - Input:', allCards.length, 'Output:', eventMap.size);
    return Array.from(eventMap.values());
  }, [filteredVenues]);

  // View toggle button — only map icon on list page
  const viewToggleButtons = (
    <button
      onClick={() => router.push('/')}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
      style={{ background: 'rgba(59, 130, 246, 0.9)' }}
      title="Map View"
    >
      <MapIcon className="w-[18px] h-[18px] text-white" />
    </button>
  );


  if (isLoading) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-gray-900">
        <div className="p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2 text-white">Loading Venues...</h3>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-4"></div>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <main className="min-h-screen w-full" style={{ backgroundColor: '#1a1917' }}>
        {/* Top Navigation with integrated date picker and category pills */}
        <TopNav
          navButtons={viewToggleButtons}
          onSearchClick={() => setIsFilterSheetOpen(true)}
          showDatePicker={true}
          datePickerProps={{
            venues: filteredVenues,
            selectedDates: filters.activeDates,
            onDateChange: handleDateChange
          }}
          showCategoryPills={true}
          categoryPillsContent={
            <CategoryPills
              filters={filters}
              onFiltersChange={handleFiltersChange}
              venues={allVenues}
              inlineMode={true}
            />
          }
          onHeightChange={handleNavHeightChange}
        />

        {/* Stacked Event Cards - fixed scroll area below navbar */}
        <div
          className="fixed md:top-[210px] left-1.5 md:left-2 right-1.5 md:right-2 bottom-0 z-10 overflow-y-auto rounded-2xl"
          style={{ backgroundColor: '#1a1917', top: `${navHeight + 8}px` }}
        >
          <StackedEventCards
            cards={cards}
            getCategoryColor={getCategoryColorForStackedCards}
          />
        </div>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
        />
      </main>
    </ThemeProvider>
  );
}
