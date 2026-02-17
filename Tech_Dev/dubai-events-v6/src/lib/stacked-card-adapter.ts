/**
 * Adapter utility to connect existing category color system
 * with StackedEventCards component requirements
 */

import { getCategoryColor, getHexColor } from '@/lib/category-mappings';
import { hexToHSL } from '@/lib/card-color-utils';

/**
 * Adapter function that converts your existing category color system
 * to the format expected by StackedEventCards component
 *
 * @param category - Category name (e.g., "Music Events", "Nightlife")
 * @returns Object with hue (0-360) and saturation (0-100) values
 */
export function getCategoryColorForStackedCards(
  category: string
): { hue: number; saturation: number } {
  // 1. Get color name from your existing system
  const colorName = getCategoryColor(category);

  // 2. Get hex color
  const hexColor = getHexColor(colorName);

  // 3. Convert to HSL
  const { h, s } = hexToHSL(hexColor);

  // 4. Return in the format expected by StackedEventCards
  return {
    hue: h,
    saturation: s
  };
}

/**
 * Example data transformer for Supabase venue/event data
 * Transform your Supabase data to match EventCardData type
 */
export interface SupabaseVenueEvent {
  // Event fields
  event_id?: string;
  event_name?: string;
  artist?: string;
  event_time?: string;
  event_date?: string;
  ticket_price?: string;
  special_offers?: string;

  // Venue fields
  venue_id?: number;
  name?: string;
  rating?: number;
  rating_count?: number;
  area?: string;
  final_instagram?: string;
  phone?: string;
  venue_lat?: number;
  venue_lng?: number;

  // Category
  event_categories?: Array<{ primary: string; secondary?: string }>;

  // Attributes
  attributes?: {
    venue?: string[];
    energy?: string[];
    status?: string[];
    timing?: string[];
  };
}

/**
 * Parse and validate event time strings safely
 * Handles both time ranges ("8:00 PM - 2:00 AM") and single times ("8:00 PM")
 */
function parseEventTime(event_time: string | null | undefined): {
  startTime: string;
  endTime: string;
} {
  if (!event_time || typeof event_time !== 'string') {
    return { startTime: '', endTime: '' };
  }

  const trimmed = event_time.trim();

  // Handle range format "HH:MM AM - HH:MM PM"
  if (trimmed.includes(' - ')) {
    const [start, end] = trimmed.split(' - ');
    return {
      startTime: start?.trim() || '',
      endTime: end?.trim() || ''
    };
  }

  // Handle single time
  if (trimmed.match(/^\d{1,2}:\d{2}\s?(AM|PM)$/i)) {
    return { startTime: trimmed, endTime: '' };
  }

  return { startTime: '', endTime: '' };
}

/**
 * Validate if a string is suitable as a title
 * Rejects truncated strings, empty strings, and invalid data
 */
function isValidTitle(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();

  // Reject truncated (< 4 chars), truncation indicators, non-letter strings
  if (trimmed.length < 4) return false;
  if (trimmed.endsWith('...')) return false;

  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  return letterCount >= trimmed.length * 0.5;
}

/**
 * Select the best title from available options
 * Prioritizes: event_name > artist > venue_name > fallback
 */
function selectBestTitle(
  event_name: string | null | undefined,
  artist: string | null | undefined,
  venue_name: string | null | undefined
): string {
  // Prioritize event_name (most reliable)
  if (isValidTitle(event_name)) return event_name!.trim();

  // Then artist
  if (isValidTitle(artist)) return artist!.trim();

  // Then venue name
  if (isValidTitle(venue_name)) return venue_name!.trim();

  return 'Event';
}

/**
 * Calculate completeness score for a card (higher = more data)
 * Used to prefer records with more information when deduplicating
 */
function calculateDataCompleteness(card: {
  event: {
    artist?: string;
    music_genre?: string;
    event_vibe?: string;
    analysis_notes?: string;
    event_subtitle?: string;
  };
  venue: {
    venue_instagram?: string;
    venue_phone?: string;
    venue_website?: string;
    venue_address?: string;
    venue_highlights?: string;
  };
}): number {
  let score = 0;

  // Event data completeness
  if (card.event.artist) score += 2;
  if (card.event.music_genre) score += 2;
  if (card.event.event_vibe) score += 2;
  if (card.event.analysis_notes) score += 1;
  if (card.event.event_subtitle) score += 1;

  // Venue data completeness
  if (card.venue.venue_instagram) score += 1;
  if (card.venue.venue_phone) score += 1;
  if (card.venue.venue_website) score += 1;
  if (card.venue.venue_address) score += 1;
  if (card.venue.venue_highlights) score += 1;

  return score;
}

/**
 * Transform Supabase venue/event data to StackedEventCards format
 */
export function transformSupabaseDataToStackedCards(
  venues: SupabaseVenueEvent[]
) {
  // Step 1: Transform all records to card format
  const allCards = venues.map((venue, index) => {
    // Generate subtitle from event categories and attributes
    const subtitleParts: string[] = [];

    // Add event category secondary (e.g., "Electronic", "Rooftop Venue")
    if (venue.event_categories?.[0]?.secondary) {
      subtitleParts.push(venue.event_categories[0].secondary);
    }

    // Add key attributes (limit to 2-3 most relevant)
    if (venue.attributes) {
      // Add venue type (Rooftop, Beach, etc.)
      if (venue.attributes.venue && venue.attributes.venue.length > 0) {
        subtitleParts.push(venue.attributes.venue[0]);
      }
      // Add energy/status (High Energy, VIP, etc.)
      if (venue.attributes.status && venue.attributes.status.length > 0) {
        subtitleParts.push(venue.attributes.status[0]);
      } else if (venue.attributes.energy && venue.attributes.energy.length > 0) {
        subtitleParts.push(venue.attributes.energy[0]);
      }
    }

    const event_subtitle = subtitleParts.join(' | ').toUpperCase();

    // Parse event time safely
    const timing = parseEventTime(venue.event_time);

    return {
      event: {
        id: venue.event_id || `event-${venue.venue_id}-${index}`,
        venue_id: venue.venue_id?.toString() || '',
        event_name: selectBestTitle(venue.event_name, venue.artist, venue.name),
        event_subtitle,
        event_time_start: timing.startTime,
        event_time_end: timing.endTime,
        event_date: venue.event_date || new Date().toISOString().split('T')[0],
        event_entry_price: venue.ticket_price ? `AED ${venue.ticket_price}` : 'Contact for pricing',
        event_offers: venue.special_offers || 'No special offers',
        category: venue.event_categories?.[0]?.primary || 'Music Events',

        // New field mappings
        artist: venue.artist,
        music_genre: Array.isArray(venue.music_genre)
          ? venue.music_genre.join(', ')
          : venue.music_genre,
        event_vibe: Array.isArray(venue.event_vibe)
          ? venue.event_vibe.join(' | ')
          : venue.event_vibe,
        confidence_score: venue.confidence_score,
        analysis_notes: venue.analysis_notes,
        website_social: venue.website_social,
        event_categories: venue.event_categories,
      },
      venue: {
        id: venue.venue_id?.toString() || '',
        venue_name: venue.name || 'Venue',
        venue_rating: venue.rating || 4.0,
        venue_review_count: venue.rating_count || 0,
        venue_location: venue.area || 'Dubai',
        venue_instagram: venue.final_instagram,
        venue_phone: venue.phone,
        venue_coordinates: (venue.venue_lat && venue.venue_lng) ? {
          lat: venue.venue_lat,
          lng: venue.venue_lng
        } : undefined,

        // New field mappings (API returns 'address'/'website', DB uses 'venue_*' prefix)
        venue_website: venue.website || venue.venue_website,
        venue_address: venue.address || venue.venue_address,
        venue_highlights: venue.venue_highlights,
        venue_atmosphere: venue.venue_atmosphere,
        attributes: venue.attributes,
      }
    };
  });

  // Step 2: Deduplicate by event identity (venue + name + date + time)
  const deduplicationMap = new Map<string, typeof allCards[0]>();

  allCards.forEach(card => {
    // Create composite key for true event identity
    const venueId = card.venue.id || '';
    const eventName = (card.event.event_name || '').toLowerCase().trim();
    const eventDate = card.event.event_date || '';
    const eventTimeStart = card.event.event_time_start || '';

    // Composite key: venue + name + date + time
    const deduplicationKey = `${venueId}|${eventName}|${eventDate}|${eventTimeStart}`;

    // Only keep first occurrence, or replace if new one has more data
    const existing = deduplicationMap.get(deduplicationKey);
    if (!existing) {
      deduplicationMap.set(deduplicationKey, card);
    } else {
      // Keep the record with more complete data
      const existingDataScore = calculateDataCompleteness(existing);
      const newDataScore = calculateDataCompleteness(card);

      if (newDataScore > existingDataScore) {
        deduplicationMap.set(deduplicationKey, card);
      }
    }
  });

  return Array.from(deduplicationMap.values());
}
