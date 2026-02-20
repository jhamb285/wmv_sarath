// Dubai Event Discovery Platform - Type Definitions

// Geographic Types
export interface LatLng {
  lat: number;
  lng: number;
}

// Event Category Types (from final_1 table)
export interface EventCategory {
  primary: string;    // e.g., "Music Events", "Nightlife", "Sports & Viewing"
  secondary: string;  // e.g., "Electronic", "Rooftop Venue", "Match Viewing"
  confidence: number; // AI confidence score (0-1)
}

export interface EventAttributes {
  venue: string[];   // e.g., ["Indoor", "Rooftop", "Outdoor"]
  energy: string[];  // e.g., ["High Energy", "Intimate"]
  status: string[];  // e.g., ["Free Entry", "VIP", "Packed"]
  timing: string[];  // e.g., ["Night Event", "Late Night", "Day Party"]
}

// Frontend Venue interface (Legacy - for compatibility)
export interface Venue {
  venue_id: number | string;
  name: string;
  area: string;
  venue_area?: string; // For compatibility
  venue_name?: string; // For compatibility
  address?: string;
  country: string;
  lat: number;
  lng: number; // For Google Maps compatibility
  phone?: number;
  website?: string;
  category: string;
  venue_category?: string; // For compatibility
  created_at: string;
  final_instagram?: string; // Added for join compatibility
  music_genre_processed?: {
    primaries: string[];
    secondariesByPrimary: Record<string, string[]>;
    colorFamilies: string[];
  };
  event_vibe_processed?: {
    primaries: string[];
    secondariesByPrimary: Record<string, string[]>;
    colorFamilies: string[];
  };
  event_date?: string;
  rating?: number;
  rating_count?: number;
  // New event category fields from final_1 table
  event_categories?: EventCategory[];
  attributes?: EventAttributes;
}

// Map Types
export interface VenueCluster {
  id: string;
  center: LatLng;
  venues: Venue[];
  bounds: google.maps.LatLngBounds;
  count: number;
}

export interface DubaiArea {
  name: string;
  lat: number;
  lng: number;
  zoom?: number;
}

// Filter Types
export interface FilterState {
  selectedAreas: string[];
  activeVibes: string[];
  activeDates: string[];
  activeGenres: string[];
  activeOffers: string[];
  searchQuery?: string;
}

// Hierarchical Filter Types
export interface HierarchicalCategory {
  color: string;
  subcategories: string[];
}

export interface HierarchicalFilterState {
  // Legacy music genre/vibe filters (for backward compatibility)
  selectedPrimaries: {
    genres: string[];      // ["Electronic", "Hip-Hop"]
    vibes: string[];       // ["Energy", "Atmosphere"]
  };

  // Secondary categories selected (grouped by primary)
  selectedSecondaries: {
    genres: Record<string, string[]>;  // {"Electronic": ["Techno", "Deep House"]}
    vibes: Record<string, string[]>;   // {"Energy": ["High Energy", "Underground"]}
  };

  // Which primaries have their secondaries expanded
  expandedPrimaries: {
    genres: string[];      // ["Electronic"]
    vibes: string[];       // ["Energy"]
  };

  // NEW: Event category filters
  eventCategories?: EventCategoryFilterState;

  // NEW: Attribute filters
  attributes?: AttributeFilterState;

  // Keep existing for backward compatibility and other filters
  selectedAreas: string[];
  activeDates: string[];
  activeOffers: string[];
  searchQuery?: string;

  // NEW: Rating and Category filters
  selectedRatings?: number[];  // Minimum rating values [3, 4, 5]
  selectedVenueCategories?: string[];  // ["Bar", "Lounge", "Beach Club"]

  // NEW: Additional filters for event discovery
  selectedTimes?: string[];  // ["18:00", "20:00", "22:00"]
  selectedTicketPrices?: string[];  // ["Free", "$0-50", "$50-100"]
  selectedVenuePrices?: string[];  // ["Free", "$0-50", "$50-100"]
  selectedAtmospheres?: string[];  // ["High Energy", "Intimate", "Rooftop"]
  selectedEventCategories?: string[];  // ["Music Events", "Nightlife", "Sports & Viewing"]
}

export interface FilterOptions {
  areas: string[];
  dates: string[];
  hierarchicalGenres: Record<string, HierarchicalCategory>;
  hierarchicalVibes: Record<string, HierarchicalCategory>;
  // Legacy format for backward compatibility
  vibes: string[];
  genres: string[];
  // NEW: Additional filter options
  venueCategories: string[];
  specialOffers: string[];
  times: string[];
  ticketPrices: string[];
  venuePrices: string[];
  atmospheres: string[];
  eventCategories: string[];
}

// Event Category Filter State (New)
export interface EventCategoryFilterState {
  // Selected primary categories (using DB names: "Music Events", "Nightlife", etc.)
  selectedPrimaries: string[];  // ["Music Events", "Nightlife"]

  // Selected secondary categories grouped by primary
  selectedSecondaries: Record<string, string[]>;  // {"Music Events": ["Electronic", "Hip-Hop/R&B"]}

  // Which primaries have their secondaries expanded in UI
  expandedPrimaries: string[];  // ["Music Events"]
}

// Attribute Filter State
export interface AttributeFilterState {
  venue: string[];    // ["Indoor", "Rooftop", "Outdoor"]
  energy: string[];   // ["High Energy", "Intimate"]
  timing: string[];   // ["Night Event", "Day Party"]
  status: string[];   // ["Free Entry", "VIP", "Packed"]
}

// Component Props Types
export interface VenuePinProps {
  venue: Venue;
  hasActiveStories: boolean;
  isSelected: boolean;
  onClick: () => void;
  onHover?: (hovered: boolean) => void;
}

export interface MapContainerProps {
  initialCenter?: LatLng;
  initialZoom?: number;
  venues: Venue[];
  selectedVenue?: Venue | null;
  onVenueSelect: (venue: Venue) => void;
  filters: HierarchicalFilterState;
  isLoading?: boolean;
  navButtons?: React.ReactNode;
}

// Constants
export const DUBAI_AREAS: DubaiArea[] = [
  { name: 'Downtown Dubai', lat: 25.1972, lng: 55.2744, zoom: 14 },
  { name: 'Dubai Marina', lat: 25.0805, lng: 55.1403, zoom: 14 },
  { name: 'JBR', lat: 25.0752, lng: 55.1337, zoom: 15 },
  { name: 'Business Bay', lat: 25.1850, lng: 55.2650, zoom: 14 },
  { name: 'DIFC', lat: 25.2110, lng: 55.2820, zoom: 15 },
  { name: 'City Walk', lat: 25.2048, lng: 55.2645, zoom: 15 },
  { name: 'La Mer', lat: 25.2354, lng: 55.2707, zoom: 15 },
  { name: 'Bluewaters', lat: 25.0764, lng: 55.1201, zoom: 16 },
  { name: 'Old Dubai/Deira', lat: 25.2654, lng: 55.3007, zoom: 14 },
  { name: 'Al Seef', lat: 25.2554, lng: 55.2934, zoom: 15 },
  { name: 'Jumeirah', lat: 25.2048, lng: 55.2708, zoom: 14 },
];

// Final_1 Table Interface (Unified event and venue data)
export interface Final1Record {
  id: number;
  // Event fields
  event_id?: string;
  instagram_id?: string;
  event_date?: string;
  event_time?: string;
  event_name?: string;
  venue_name?: string;
  city?: string;
  country?: string;
  artists?: string[];
  music_genre?: string[];
  event_vibe?: string[];
  ticket_price?: number;
  special_offers?: string[];
  website_social?: string[];
  context?: string;
  confidence_score?: number;
  analysis_notes?: string;
  event_created_at?: string;
  event_updated_at?: string;
  // Venue fields
  venue_venue_id?: string;
  venue_unique_key?: string;
  venue_google_place_id?: string;
  venue_name_original?: string;
  venue_area?: string;
  venue_address?: string;
  venue_city?: string;
  venue_country?: string;
  venue_lat?: number;
  venue_lng?: number;
  venue_phone_number?: string;
  venue_website?: string;
  venue_category?: string;
  venue_cleaned_instagram?: string;
  venue_match_ai_instagram?: string;
  venue_final_instagram?: string;
  venue_last_scraped_at?: string;
  venue_created_at?: string;
  venue_updated_at?: string;
  // New event category fields
  event_categories?: EventCategory[];
  attributes?: EventAttributes;
}

// Event Types (Legacy - for compatibility)
export interface Event {
  id: number;
  created_at: string;
  event_date: string;
  event_time?: string;
  venue_id?: number; // Added for venue matching
  venue_name?: string;
  artist?: string;
  music_genre?: string;
  event_vibe?: string;
  event_name?: string;
  ticket_price?: string;
  special_offers?: string;
  website_social?: string;
  confidence_score?: string;
  analysis_notes?: string;
  instagram_id?: string;
  // New event category fields from final_1 table
  event_categories?: EventCategory[];
  attributes?: EventAttributes;
}

// Instagram Story Types (for compatibility)
export interface InstagramStory {
  story_id: string;
  unique_key: string;
  venue_unique_key: string;
  story_date: string;
  username?: string;
  media_type?: string;
  timestamp: string;
  context?: string;
  event_date?: string;
  event_time?: string;
  venue_name?: string;
  city?: string;
  country?: string;
  artists?: string[];
  music_genre?: string[];
  event_vibe?: string[];
  confidence_score?: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const DUBAI_CENTER: LatLng = {
  lat: 25.2048,
  lng: 55.2708
};

// Removed hardcoded options - these should come from the API dynamically

// Google Maps Dark Theme with POI/Icon Hiding
export const RETRO_MAP_STYLE: google.maps.MapTypeStyle[] = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#333333"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c8e6c9"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4caf50"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#e0e0e0"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e0e0e0"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#b3d9ff"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4a90d9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  }
];