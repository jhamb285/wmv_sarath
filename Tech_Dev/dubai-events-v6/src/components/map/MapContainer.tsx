'use client';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
// import { SlidersHorizontal } from 'lucide-react'; // Removed - filter button now accessed via search bar
import {
  GOOGLE_MAPS_CONFIG,
  MAP_OPTIONS
} from '@/lib/maps-config';
// Removed VenueClusterComponent import
// import HorizontalNav from '@/components/navigation/HorizontalNav'; // Disabled - needs update to HierarchicalFilterState
import TopNav from '@/components/navigation/TopNav';
import CategoryPills from '@/components/filters/CategoryPills';
import AttributePills from '@/components/filters/AttributePills';
import VenueDetailsSidebar from '@/components/venue/VenueDetailsSidebar';
import VenueFloatingPanel from '@/components/venue/VenueFloatingPanel';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import type { MapContainerProps, Venue, HierarchicalFilterState, FilterOptions } from '@/types';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { getMarkerColorScheme, doesVenueMatchFilters, getMarkerIcon } from '@/lib/map/marker-colors';
import '@/styles/horizontal-nav.css';

interface DateSelectorProps {
  venues: Venue[];
  selectedDates: string[];
  onDateChange: (dates: string[]) => void;
  className?: string;
}

interface ExtendedMapContainerProps extends MapContainerProps {
  onFiltersChange: (filters: HierarchicalFilterState) => void;
  'data-testid'?: string;
  navButtons?: React.ReactNode;
  showDatePicker?: boolean;
  datePickerProps?: DateSelectorProps;
  embedMode?: boolean; // When true, omits TopNav/CategoryPills overlay (parent handles them)
  disableFloatingPanel?: boolean; // When true, skips rendering VenueFloatingPanel (parent handles venue display)
  gestureMode?: 'greedy' | 'cooperative'; // Controls map gesture handling. 'cooperative' requires two-finger pan (for embedded scrollable maps)
  onMapClick?: () => void; // Called when the map background is clicked (not a marker)
  highlightedVenueId?: string | null; // Venue ID to highlight on the map with a pulsing effect
}

const MapContainer: React.FC<ExtendedMapContainerProps> = ({
  initialCenter,
  initialZoom = 12,
  venues = [],
  onVenueSelect,
  filters,
  isLoading = false,
  onFiltersChange,
  'data-testid': dataTestId,
  navButtons,
  showDatePicker,
  datePickerProps,
  embedMode = false,
  disableFloatingPanel = false,
  gestureMode,
  onMapClick,
  highlightedVenueId,
}) => {
  console.log('🚨 MAP CONTAINER RENDER - Component is rendering!');
  console.log('🚨 MAP CONTAINER RENDER - Filters:', filters);

  const handleHierarchicalFiltersChange = (hierarchicalFilters: HierarchicalFilterState) => {
    console.log('📍 HIERARCHICAL CHANGE - Handler called with:', hierarchicalFilters);
    onFiltersChange(hierarchicalFilters);
  };
  // Use useLoadScript to load Google Maps - MUST be at the top before any conditionals
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries: GOOGLE_MAPS_CONFIG.libraries,
    language: GOOGLE_MAPS_CONFIG.language,
    region: GOOGLE_MAPS_CONFIG.region,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markersByVenueIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const highlightOverlayRef = useRef<google.maps.Marker | null>(null);
  const mapViewportRef = useRef({
    center: initialCenter || MAP_OPTIONS.center,
    zoom: initialZoom,
    isInitialized: false
  });
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFloatingPanelOpen, setIsFloatingPanelOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [mapOptions, setMapOptions] = useState<google.maps.MapOptions | null>(null);

  // Get filter options (loaded once, no parameters needed)
  const { filterOptions } = useFilterOptions();


  // Clear all existing markers
  const clearMarkers = useCallback(() => {
    console.log('🧹 CLEARING MARKERS - Removing', markersRef.current.length, 'existing markers');
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    markersByVenueIdRef.current.clear();
    if (highlightOverlayRef.current) {
      highlightOverlayRef.current.setMap(null);
      highlightOverlayRef.current = null;
    }
    console.log('✅ All markers cleared');
  }, []);


  const handleVenueClick = useCallback((venue: Venue) => {
    console.log('🚀 MAP CONTAINER - handleVenueClick called with:', venue.name);
    console.log('🚀 MAP CONTAINER - Setting selectedVenue to:', venue);
    setSelectedVenue(venue);
    onVenueSelect(venue);
    console.log('🚀 MAP CONTAINER - Opening floating panel...');
    setIsFloatingPanelOpen(true);
    console.log('🚀 MAP CONTAINER - Floating panel opened - COMPLETE');
  }, [onVenueSelect]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log('🚀 === MAP LOAD START ===');
    console.log('🗺️ Map object:', map);
    console.log('🗺️ Venues received:', venues);
    console.log('🗺️ Venues count:', venues.length);
    console.log('🗺️ Venues array type:', typeof venues);
    console.log('🗺️ Venues is array:', Array.isArray(venues));
    console.log('🗺️ isLoading state:', isLoading);

    mapRef.current = map;
    
    // Store initial viewport and mark as initialized
    mapViewportRef.current = {
      center: map.getCenter()?.toJSON() || mapViewportRef.current.center,
      zoom: map.getZoom() || mapViewportRef.current.zoom,
      isInitialized: true
    };
    
    console.log('🗺️ Initial map center:', mapViewportRef.current.center);
    console.log('🗺️ Initial map zoom:', mapViewportRef.current.zoom);
    
    // Add viewport tracking listeners to preserve user's position
    map.addListener('center_changed', () => {
      const newCenter = map.getCenter()?.toJSON();
      if (newCenter) {
        mapViewportRef.current.center = newCenter;
      }
    });
    
    map.addListener('zoom_changed', () => {
      const newZoom = map.getZoom();
      if (newZoom !== undefined) {
        mapViewportRef.current.zoom = newZoom;
      }
    });
    
    try {
      // Use the React Google Maps map instance - now with viewport preservation
      const directMap = map;
      
      console.log('🗺️ MAP LOADED successfully with viewport tracking');
      console.log('🗺️ Viewport preserved - zoom:', mapViewportRef.current.zoom, 'center:', mapViewportRef.current.center);
      console.log(`🗺️ Number of venues to render: ${venues.length}`);
      
      // Global InfoWindow instance to prevent multiple windows and auto-panning issues
      let currentInfoWindow: google.maps.InfoWindow | null = null;

      // Create individual markers without clustering
      const validVenues = venues.filter(venue => venue.lat && venue.lng);
      console.log(`🗺️ TOTAL VENUES: ${venues.length}, VALID VENUES: ${validVenues.length}`);

      // Log each venue's details
      venues.forEach((venue, i) => {
        console.log(`📍 Venue ${i + 1}:`, {
          id: venue.venue_id,
          name: venue.name,
          lat: venue.lat,
          lng: venue.lng,
          hasCoords: !!(venue.lat && venue.lng)
        });
      });

      if (validVenues.length === 0) {
        console.error('❌ NO VALID VENUES FOUND - no markers will be created!');
        return;
      }

      validVenues.forEach((venue, i) => {
        console.log(`🎯 === CREATING MARKER ${i + 1} ===`);
        console.log(`🎯 Venue: ${venue.name}`);
        console.log(`🎯 Position: lat=${venue.lat}, lng=${venue.lng}`);

        // Smart category-based color mapping
        // Get dynamic marker icon based on venue's event category and active filters
        const markerIcon = getMarkerIcon(venue, filters, 32);
        const matchesFilters = doesVenueMatchFilters(venue, filters);
        
        // Get venue's primary event category for logging
        const primaryEventCategory = venue.event_categories?.[0]?.primary || 'Unknown';
        console.log(`🎯 Venue: ${venue.name}, Event Category: ${primaryEventCategory}, Marker Color: ${markerIcon.url.split('/').pop()}, Matches Filters: ${matchesFilters}`);

        try {
          // Create CATEGORY-COLORED marker that matches pill filter colors
          console.log(`🎨 Creating marker for ${venue.name} with unified color system`);
          const marker = new google.maps.Marker({
            position: { lat: venue.lat, lng: venue.lng },
            map: directMap,
            title: venue.name,
            icon: markerIcon,
          });

          // Add marker to tracking array and venue ID map
          markersRef.current.push(marker);
          markersByVenueIdRef.current.set(String(venue.venue_id), marker);

          console.log(`✅ Marker created successfully for ${venue.name}:`, marker.getPosition()?.toJSON());
          console.log(`✅ Marker visible:`, marker.getVisible());
          console.log(`✅ Marker map:`, marker.getMap());

          marker.addListener("click", (event: google.maps.MapMouseEvent) => {
            console.log(`🖱️ Marker clicked: ${venue.name}`);
            // Prevent event bubbling that might cause map repositioning
            if (event) {
              event.stop?.();
            }

            // Close any existing InfoWindow first
            if (currentInfoWindow) {
              currentInfoWindow.close();
              currentInfoWindow = null;
            }

            // Only trigger sidebar functionality - no InfoWindow popup
            handleVenueClick(venue);
          });

        } catch (markerError) {
          console.error(`❌ Error creating marker for ${venue.name}:`, markerError);
        }
      });
      
      console.log(`🎯 === MARKER CREATION COMPLETE ===`);
      console.log(`🗺️ Created ${validVenues.length} markers successfully`);
      
      // Check map bounds
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        console.log(`🗺️ Map bounds: NE(${ne.lat()}, ${ne.lng()}) SW(${sw.lat()}, ${sw.lng()})`);
        
        // Check if venues are within bounds
        validVenues.forEach(venue => {
          const inBounds = bounds.contains(new google.maps.LatLng(venue.lat, venue.lng));
          console.log(`📍 ${venue.name} in bounds: ${inBounds}`);
        });
      }
      
      
      
    } catch (error) {
      console.error('🚨 Error in onMapLoad:', error);
    }
    
    console.log('🚀 === MAP LOAD END ===');
    
  }, [venues, initialZoom, initialCenter, handleVenueClick]);

  // Update markers when venues change (this is the missing piece!)
  React.useEffect(() => {
    console.log('🔄 VENUES EFFECT TRIGGERED - venues.length:', venues.length);
    console.log('🔄 VENUES EFFECT TRIGGERED - mapRef.current:', !!mapRef.current);

    if (!mapRef.current) {
      console.log('🔄 VENUES EFFECT - No map ref, skipping');
      return;
    }

    console.log('🔄 UPDATING MARKERS - Venues changed:', venues.length);
    console.log('🔄 UPDATING MARKERS - Venue names:', venues.map(v => v.name));

    // Clear all existing markers first
    clearMarkers();

    // Then create new markers for current venues
    if (venues.length > 0) {
      console.log('🔄 UPDATING MARKERS - Calling onMapLoad to create new markers');
      onMapLoad(mapRef.current);
    } else {
      console.log('🔄 UPDATING MARKERS - No venues to display');
    }
  }, [venues, onMapLoad, clearMarkers]);

  // Highlight the active venue marker with a pulsing ring + bounce
  React.useEffect(() => {
    if (!mapRef.current) return;

    // Instantly remove previous highlight overlay
    if (highlightOverlayRef.current) {
      highlightOverlayRef.current.setMap(null);
      highlightOverlayRef.current = null;
    }

    // Instantly reset ALL markers to normal
    markersByVenueIdRef.current.forEach((marker, vid) => {
      const v = venues.find(ve => String(ve.venue_id) === vid);
      if (v) {
        marker.setAnimation(null);
        marker.setIcon(getMarkerIcon(v, filters, 32));
        marker.setZIndex(1);
        marker.setOpacity(1);
      }
    });

    if (!highlightedVenueId) return;

    const activeMarker = markersByVenueIdRef.current.get(highlightedVenueId);
    if (!activeMarker) return;

    const pos = activeMarker.getPosition();
    if (!pos) return;

    // Dim all non-highlighted markers
    markersByVenueIdRef.current.forEach((marker, vid) => {
      if (vid !== highlightedVenueId) {
        marker.setOpacity(0.4);
      }
    });

    // Make the active marker larger, full opacity, and on top
    const venue = venues.find(v => String(v.venue_id) === highlightedVenueId);
    if (venue) {
      activeMarker.setIcon(getMarkerIcon(venue, filters, 48));
      activeMarker.setZIndex(999);
      activeMarker.setOpacity(1);
    }

    // Add animated pulsing ring overlay
    const pulseIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="28" fill="none" stroke="#7C3AED" stroke-width="3" opacity="0.6">
            <animate attributeName="r" from="16" to="36" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.7" to="0" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="40" cy="40" r="20" fill="none" stroke="#7C3AED" stroke-width="2" opacity="0.4">
            <animate attributeName="r" from="12" to="30" dur="1.5s" begin="0.3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" begin="0.3s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(80, 80),
      anchor: new google.maps.Point(40, 40),
    };

    const overlay = new google.maps.Marker({
      position: pos,
      map: mapRef.current,
      icon: pulseIcon,
      clickable: false,
      zIndex: 998,
    });

    highlightOverlayRef.current = overlay;

    // Keep the active marker bouncing continuously
    activeMarker.setAnimation(google.maps.Animation.BOUNCE);

    // Cleanup: instantly stop when effect re-runs (user swipes to next card)
    return () => {
      activeMarker.setAnimation(null);
      if (venue) {
        activeMarker.setIcon(getMarkerIcon(venue, filters, 32));
        activeMarker.setZIndex(1);
      }
      // Restore opacity on all markers
      markersByVenueIdRef.current.forEach((m) => {
        m.setOpacity(1);
      });
      if (highlightOverlayRef.current) {
        highlightOverlayRef.current.setMap(null);
        highlightOverlayRef.current = null;
      }
    };
  }, [highlightedVenueId, venues, filters]);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedVenue(null); // Clear selected venue when closing
    console.log('🚀 MAP CONTAINER - Sidebar closed, selectedVenue cleared');

    // DON'T reset map position - let it stay where user left it!
    console.log('🗺️ Preserving viewport:', mapViewportRef.current);
  }, []);

  const handleFloatingPanelClose = useCallback(() => {
    setIsFloatingPanelOpen(false);
    setSelectedVenue(null); // Clear selected venue when closing
    console.log('🚀 MAP CONTAINER - Floating panel closed, selectedVenue cleared');
  }, []);

  // Initialize mapOptions and update when theme changes
  React.useEffect(() => {
    const mapStyles = MAP_OPTIONS.styles;

    const newMapOptions: google.maps.MapOptions = {
      ...MAP_OPTIONS,
      center: mapViewportRef.current.center,
      zoom: mapViewportRef.current.zoom,
      styles: mapStyles,
      ...(gestureMode ? { gestureHandling: gestureMode } : {}),
    };

    setMapOptions(newMapOptions);
    console.log('🗺️ Map options updated');
  }, [gestureMode]); // Initialize once, re-run if gestureMode changes

  // Debug API key loading
  console.log('Google Maps API Key:', GOOGLE_MAPS_CONFIG.apiKey ? 'PRESENT' : 'MISSING');

  if (!GOOGLE_MAPS_CONFIG.apiKey || GOOGLE_MAPS_CONFIG.apiKey === 'your_google_maps_api_key') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="retro-surface p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2">Google Maps API Key Required</h3>
          <p className="text-muted-foreground mb-4">
            Please add your Google Maps API key to the environment variables to display the map.
          </p>
          <div className="bg-muted p-3 rounded text-sm font-mono text-left">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
            <br />
            Current: {GOOGLE_MAPS_CONFIG.apiKey || 'undefined'}
          </div>
        </div>
      </div>
    );
  }

  // Calculate live stories count (mock for now) - removed unused variable warning
  // const liveStoriesCount = Math.floor(venues.length * 0.3); // 30% of venues have live stories

  if (loadError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="retro-surface p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-600">Google Maps Load Error</h3>
          <p className="text-muted-foreground">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="retro-surface p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2">Loading Google Maps...</h3>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${embedMode ? 'h-full' : 'h-screen'}`} data-testid={dataTestId}>

      {/* Top Navigation - only rendered when NOT in embed mode (mobile overlay) */}
      {!embedMode && (
        <TopNav
          navButtons={navButtons}
          onSearchClick={() => {
            setIsFilterSheetOpen(true);
            setIsFloatingPanelOpen(false);
          }}
          showDatePicker={showDatePicker}
          datePickerProps={datePickerProps}
          showCategoryPills={true}
          categoryPillsContent={
            <CategoryPills
              filters={filters}
              onFiltersChange={handleHierarchicalFiltersChange}
              venues={venues}
              inlineMode={true}
            />
          }
        />
      )}

      {/* Attribute Pills - Venue/Energy/Timing/Status filtering */}
      {/* TEMPORARILY HIDDEN - Will be brought back when requested */}
      {/* <AttributePills
        filters={filters}
        onFiltersChange={handleHierarchicalFiltersChange}
        venues={venues}
      /> */}

      {/* Only render GoogleMap after mapOptions is initialized to prevent viewport resets */}
      {mapOptions && (
        <GoogleMap
          mapContainerStyle={{
            width: '100%',
            height: '100%',
          }}
          options={mapOptions}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onClick={() => {
            console.log('🗺️ MAP CLICKED - Closing floating panel');
            setIsFloatingPanelOpen(false);
            setSelectedVenue(null);
            onMapClick?.();
          }}
        >
        {/* Advanced Markers are now created directly in onMapLoad using clustering */}
        {/* Old VenuePin components commented out - now using AdvancedMarkerElement with clustering */}
        {/* 
        {venues.map((venue, index) => {
          console.log('🗺️ MAP CONTAINER - Mapping venue:', venue.name, venue.lat, venue.lng);
          // Simulate some venues having active stories for animation demo
          const hasActiveStories = index % 3 === 0; // Every 3rd venue has active stories
          
          return (
            <VenuePin
              key={venue.venue_id}
              venue={venue}
              hasActiveStories={hasActiveStories}
              isSelected={selectedVenue?.venue_id === venue.venue_id}
              onClick={() => handleVenueClick(venue)}
              onHover={(hovered) => setHoveredVenue(hovered ? venue.venue_id : null)}
            />
          );
        })}
        */}

        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="retro-surface p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm">Loading venues...</span>
            </div>
          </div>
        )}
        </GoogleMap>
      )}

      {/* Venue Details Sidebar */}
      <VenueDetailsSidebar
        venue={selectedVenue || null}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        filters={filters}
      />

      {/* Venue Floating Panel */}
      {!disableFloatingPanel && (
        <VenueFloatingPanel
          venue={selectedVenue}
          isOpen={isFloatingPanelOpen}
          onClose={handleFloatingPanelClose}
          filters={filters}
          onFiltersChange={onFiltersChange}
          onViewDetails={() => {
            setIsFloatingPanelOpen(false);
            setIsSidebarOpen(true);
          }}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onFiltersChange={handleHierarchicalFiltersChange}
        filterOptions={filterOptions}
      />

    </div>
  );
};

export default MapContainer;