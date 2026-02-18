import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import './StackedEventCards.css';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

interface Venue {
  id: string;
  venue_name: string;
  venue_rating: number;
  venue_review_count: number;
  venue_location: string;
  venue_instagram?: string;
  venue_phone?: string;
  venue_coordinates?: { lat: number; lng: number };

  // New fields
  venue_website?: string;
  venue_address?: string;
  venue_highlights?: string;
  venue_atmosphere?: string;
  attributes?: any;
}

interface Event {
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

  // New fields
  artist?: string;
  music_genre?: string;
  event_vibe?: string;
  confidence_score?: number;
  analysis_notes?: string;
  website_social?: string;
  event_categories?: any[];
}

interface EventCardData {
  event: Event;
  venue: Venue;
}

interface StackedEventCardsProps {
  cards: EventCardData[];
  getCategoryColor: (category: string) => { hue: number; saturation: number };
}

interface EventCardProps {
  event: Event;
  venue: Venue;
  index: number;
  isExpanded: boolean;
  onCardClick: (id: string) => void;
  getCardColor: (category: string, rating: number) => string;
  contentRef: React.RefObject<HTMLDivElement> | null;
  contentHeight: number;
}

// ===========================================
// COLOR UTILITY FUNCTION
// ===========================================

/**
 * Generate card background color based on category + venue_rating
 *
 * @param categoryColor - Base color from category (hue, saturation)
 * @param venueRating - Rating value (1.0 to 5.0) shown on card
 * @returns HSLA color string
 */
function generateCardColor(
  categoryColor: { hue: number; saturation: number },
  venueRating: number
): string {
  // Clamp rating between 1.0 and 5.0
  const clampedRating = Math.max(1.0, Math.min(5.0, venueRating));

  // Normalize: 1.0-5.0 → 0-1 scale
  const normalized = (clampedRating - 1.0) / 4.0;

  // Higher rating = slightly more visible
  // Lower rating = more transparent (ultra-clear glass)
  const lightness = 85 - (normalized * 15);    // 85% to 70% (lighter)
  const opacity = 0.20 + (normalized * 0.15);  // 0.20 to 0.35 (much more transparent)

  return `hsla(${categoryColor.hue}, ${categoryColor.saturation}%, ${lightness}%, ${opacity})`;
}

// ===========================================
// DATE/TIME FORMATTING UTILITIES
// ===========================================

function formatTime(time: string): string {
  if (!time) return '';

  const timeRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;
  const match = time.trim().match(timeRegex);

  if (!match) return '';

  const [_, hour, minute, period] = match;
  return `${hour}:${minute} ${period.toUpperCase()}`;
}

function formatDate(dateString: string): string {
  // Assumes dateString is in "YYYY-MM-DD" format
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
}

/**
 * Generate smart subtitle that excludes redundant information
 * Filters out subtitles that are just concatenations of venue + event names
 */
function generateSmartSubtitle(
  eventName: string,
  venueName: string,
  subtitle: string
): string {
  if (!subtitle || !eventName || !venueName) return '';
  if (!subtitle.trim()) return '';

  // Normalize for comparison (lowercase, remove special chars)
  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/[^\w\s]/g, '');

  const normalizedEvent = normalize(eventName);
  const normalizedVenue = normalize(venueName);
  const normalizedSubtitle = normalize(subtitle);

  // Check if subtitle is just venue + event concatenation
  const isRedundant =
    normalizedSubtitle.includes(normalizedVenue) &&
    normalizedSubtitle.includes(normalizedEvent) &&
    normalizedSubtitle.length < normalizedVenue.length + normalizedEvent.length + 10;

  return isRedundant ? '' : subtitle;
}

// ===========================================
// SVG ICON COMPONENTS
// ===========================================

const ClockIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DollarIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor" stroke="none">$</text>
  </svg>
);

const GiftIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="18" height="12" rx="2"/>
    <path d="M12 8v12"/>
    <path d="M8 8V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/>
    <path d="M16 8V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2"/>
  </svg>
);

const InstagramIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const ShareIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const NavigationIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const MusicIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const SparklesIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);

const TargetIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const FileTextIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const MapPinIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LinkIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ExternalLinkIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ===========================================
// EVENT CARD COMPONENT
// ===========================================

const EventCard: React.FC<EventCardProps> = ({
  event,
  venue,
  index,
  isExpanded,
  onCardClick,
  getCardColor,
  contentRef,
  contentHeight,
}) => {
  const cardColor = getCardColor(event.category, venue.venue_rating);
  const dateDisplay = formatDate(event.event_date);

  // State for DETAILS expand/collapse
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Action handlers
  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_instagram) {
      // If it's already a full URL, use it directly
      if (venue.venue_instagram.startsWith('http')) {
        window.open(venue.venue_instagram, '_blank');
      } else {
        // Otherwise, construct Instagram URL from username
        const username = venue.venue_instagram.replace('@', '');
        window.open(`https://instagram.com/${username}`, '_blank');
      }
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_phone) {
      window.location.href = `tel:${venue.venue_phone}`;
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${venue.venue_name} - ${event.event_name}`,
        text: event.event_subtitle,
        url: window.location.href,
      });
    }
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (venue.venue_coordinates) {
      // Use coordinates (most accurate)
      const { lat, lng } = venue.venue_coordinates;
      const venueName = venue.venue_name ? encodeURIComponent(venue.venue_name) : '';
      const url = venueName
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${venueName}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (venue.venue_address) {
      // Fallback to address if coordinates not available
      const address = encodeURIComponent(venue.venue_address);
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${address}`,
        '_blank'
      );
    } else {
      // No location data available
      console.error('No location data available for directions');
      alert('Location data not available for this venue. Please check the venue details for contact information.');
    }
  };

  const handleDetailsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  return (
    <div
      id={`card-${event.id}`}
      className={`stacked-card ${isExpanded ? 'expanded' : ''}`}
      style={{
        backgroundColor: cardColor,
        zIndex: isExpanded ? 100 : index + 1,
        '--content-height': `${contentHeight}px`,
      } as React.CSSProperties}
      onClick={() => onCardClick(event.id)}
    >
      {/* HEADER — All info left, small image right */}
      <div className="stacked-card-header" style={{ alignItems: 'flex-start', gap: '12px' }}>
        {/* Left Column — stacked info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Event Name */}
          <h2 className="stacked-card-event-title">
            {event.event_name}
          </h2>

          {/* Venue Name */}
          <span className="stacked-card-venue-name" style={{ display: 'block', marginTop: '4px' }}>{venue.venue_name}</span>

          {/* Rating + Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span className="stacked-card-star">★</span>
            <span className="stacked-card-rating-value">{venue.venue_rating}</span>
            <span className="stacked-card-review-count">({venue.venue_review_count.toLocaleString()})</span>
            <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
            <span style={{ color: 'rgba(200, 200, 220, 0.7)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue.venue_location}</span>
          </div>

          {/* Category Tags (Subtitle) */}
          {(() => {
            const smartSubtitle = generateSmartSubtitle(
              event.event_name,
              venue.venue_name,
              event.event_subtitle
            );
            if (!smartSubtitle) return null;
            return (
              <p className="stacked-card-event-subtitle" style={{ marginTop: '6px' }}>
                {smartSubtitle.toUpperCase()}
              </p>
            );
          })()}
        </div>

        {/* Right — Small image, stretches to match left content height */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'stretch' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVW-pbYSH_W9UliC5eEBX7oWNcsAJN9LETGg&s"
            alt={event.event_name}
            style={{
              width: '88px',
              minHeight: '110px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '1.5px solid rgba(255,255,255,0.1)',
            }}
          />
        </div>
      </div>

      {/* ARTISTS SECTION - Collapsed State */}
      {event.artist && (
        <div className="stacked-card-artists-section">
          <div className="stacked-card-artists-badges">
            {event.artist.split(',').map((artist, idx) => (
              <span key={idx} className="stacked-card-artist-badge">
                {artist.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* EXPANDABLE CONTENT */}
      <div
        ref={isExpanded ? contentRef : null}
        className="stacked-card-content"
      >
        {/* Date */}
        <div className="stacked-card-info-row">
          <div className="stacked-card-info-icon stacked-card-date-icon">
            <CalendarIcon />
          </div>
          <div className="stacked-card-info-content">
            <span className="stacked-card-info-label">DATE</span>
            <span className="stacked-card-info-value">{dateDisplay}</span>
          </div>
        </div>

        {/* Entry */}
        <div className="stacked-card-info-row">
          <div className="stacked-card-info-icon stacked-card-entry-icon">
            <DollarIcon />
          </div>
          <div className="stacked-card-info-content">
            <span className="stacked-card-info-label">ENTRY</span>
            <span className="stacked-card-info-value">{event.event_entry_price}</span>
          </div>
        </div>

        {/* Offers */}
        <div className="stacked-card-info-row">
          <div className="stacked-card-info-icon stacked-card-offers-icon">
            <GiftIcon />
          </div>
          <div className="stacked-card-info-content">
            <span className="stacked-card-info-label">OFFERS</span>
            <span className="stacked-card-offers-text">{event.event_offers}</span>
          </div>
        </div>

        {/* MUSIC GENRES */}
        {event.music_genre && (
          <div className="stacked-card-info-row">
            <div className="stacked-card-info-icon stacked-card-genre-icon">
              <MusicIcon />
            </div>
            <div className="stacked-card-info-content">
              <span className="stacked-card-info-label">MUSIC GENRES</span>
              <div className="stacked-card-genre-badges">
                {event.music_genre.split(',').map((genre, idx) => (
                  <span key={idx} className="stacked-card-genre-badge">
                    {genre.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EVENT VIBES */}
        {event.event_vibe && (
          <div className="stacked-card-info-row">
            <div className="stacked-card-info-icon stacked-card-vibe-icon">
              <SparklesIcon />
            </div>
            <div className="stacked-card-info-content">
              <span className="stacked-card-info-label">VIBES</span>
              <div className="stacked-card-vibe-badges">
                {event.event_vibe.split('|').map((vibe, idx) => (
                  <span key={idx} className="stacked-card-vibe-badge">
                    {vibe.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYSIS NOTES - Expandable */}
        {event.analysis_notes && (
          <div className="stacked-card-info-row">
            <div className="stacked-card-info-icon stacked-card-notes-icon">
              <FileTextIcon />
            </div>
            <div className="stacked-card-info-content">
              <span className="stacked-card-info-label">DETAILS</span>
              <p
                className={`stacked-card-analysis-notes ${
                  isDetailsExpanded ? 'expanded' : 'collapsed'
                }`}
              >
                {event.analysis_notes}
              </p>
              {/* Only show toggle if text is long enough */}
              {event.analysis_notes.length > 150 && (
                <span
                  className="stacked-card-details-toggle"
                  onClick={handleDetailsToggle}
                >
                  <strong>{isDetailsExpanded ? 'Show less' : 'Show more'}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* VENUE DETAILS SECTION */}
        <div className="stacked-card-venue-details">
          <span className="stacked-card-info-label">VENUE DETAILS</span>

          {/* Venue Address */}
          {venue.venue_address && (
            <div className="stacked-card-venue-detail-row">
              <MapPinIcon />
              <span>{venue.venue_address}</span>
            </div>
          )}

          {/* Venue Highlights */}
          {venue.venue_highlights && (() => {
            try {
              const parsed = JSON.parse(venue.venue_highlights);
              const keys = Array.isArray(parsed)
                ? parsed.map(obj => Object.keys(obj)[0]).join(', ')
                : venue.venue_highlights;
              return (
                <div className="stacked-card-venue-detail-row">
                  <StarIcon />
                  <span>{keys}</span>
                </div>
              );
            } catch {
              return (
                <div className="stacked-card-venue-detail-row">
                  <StarIcon />
                  <span>{venue.venue_highlights}</span>
                </div>
              );
            }
          })()}

          {/* Venue Atmosphere */}
          {venue.venue_atmosphere && (() => {
            try {
              const parsed = JSON.parse(venue.venue_atmosphere);
              const keys = Array.isArray(parsed)
                ? parsed.map(obj => Object.keys(obj)[0]).join(', ')
                : venue.venue_atmosphere;
              return (
                <div className="stacked-card-venue-detail-row">
                  <SparklesIcon />
                  <span>{keys}</span>
                </div>
              );
            } catch {
              return (
                <div className="stacked-card-venue-detail-row">
                  <SparklesIcon />
                  <span>{venue.venue_atmosphere}</span>
                </div>
              );
            }
          })()}

          {/* Website Social */}
          {event.website_social && (
            <div className="stacked-card-venue-detail-row">
              <LinkIcon />
              <span>{event.website_social}</span>
            </div>
          )}

          {/* Venue Website Button */}
          {venue.venue_website && (
            <button
              className="stacked-card-website-btn"
              onClick={(e) => {
                e.stopPropagation();
                window.open(venue.venue_website, '_blank');
              }}
            >
              <ExternalLinkIcon />
              <span>Visit Website</span>
            </button>
          )}
        </div>
      </div>

      {/* FOOTER - ACTION BUTTONS */}
      <div className="stacked-card-footer">
        <div className="stacked-card-action-buttons">
          <button
            className="stacked-card-action-btn stacked-card-instagram"
            onClick={handleInstagramClick}
          >
            <InstagramIcon />
          </button>
          <button
            className="stacked-card-action-btn stacked-card-call"
            onClick={handleCallClick}
          >
            <PhoneIcon />
          </button>
          <button
            className="stacked-card-action-btn stacked-card-share"
            onClick={handleShareClick}
          >
            <ShareIcon />
          </button>
        </div>
        <button
          className="stacked-card-directions-btn"
          onClick={handleDirectionsClick}
        >
          <NavigationIcon />
          <span>Get Directions</span>
        </button>
      </div>
    </div>
  );
};

// ===========================================
// MAIN STACKED CARDS COMPONENT
// ===========================================

const StackedEventCards: React.FC<StackedEventCardsProps> = ({
  cards,
  getCategoryColor,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    cards.length > 0 ? cards[cards.length - 1].event.id : null
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Primary measurement: Fires synchronously after DOM mutation
  useLayoutEffect(() => {
    if (expandedId && contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [expandedId]);

  // Backup measurement: Catches edge cases after paint
  useEffect(() => {
    if (expandedId && contentRef.current) {
      // Small delay to ensure all child content is rendered
      const timer = setTimeout(() => {
        if (contentRef.current) {
          const height = contentRef.current.scrollHeight;
          setContentHeight(height);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [expandedId]);

  const handleCardClick = (id: string) => {
    // Collapse if clicking expanded card
    if (expandedId === id) {
      setExpandedId(null);
      setContentHeight(0);
      return;
    }

    // Expand card - height measurement handled by useLayoutEffect
    setExpandedId(id);

    // Scroll to card after expansion animation starts
    // Delay matches CSS transition duration
    setTimeout(() => {
      document.getElementById(`card-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 150);
  };

  const getCardColor = (category: string, rating: number): string => {
    const categoryColor = getCategoryColor(category);
    return generateCardColor(categoryColor, rating);
  };

  return (
    <div className="stacked-cards-container">
      <div className="stacked-cards-stack">
        {cards.map((cardData, index) => {
          const isExpanded = expandedId === cardData.event.id;
          return (
            <div key={cardData.event.id} data-card-id={cardData.event.id}>
              <EventCard
                event={cardData.event}
                venue={cardData.venue}
                index={index}
                isExpanded={isExpanded}
                onCardClick={handleCardClick}
                getCardColor={getCardColor}
                contentRef={isExpanded ? contentRef : null}
                contentHeight={contentHeight}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StackedEventCards;

// ===========================================
// EXPORT TYPES FOR EXTERNAL USE
// ===========================================

export type { Venue, Event, EventCardData, StackedEventCardsProps };
