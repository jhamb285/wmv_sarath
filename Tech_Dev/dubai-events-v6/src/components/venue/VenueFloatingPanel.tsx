'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Instagram, ExternalLink, Phone, Share2, Navigation, Calendar, DollarSign, Gift, FileText, Music, Sparkles, Target } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useTheme } from '@/contexts/ThemeContext';
import type { Venue, HierarchicalFilterState, InstagramStory } from '@/types';
import './VenueFloatingPanel.css';

interface VenueFloatingPanelProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  filters?: HierarchicalFilterState;
  stories?: InstagramStory[];
  onViewDetails?: () => void;
  onFiltersChange?: (filters: HierarchicalFilterState) => void;
}

// Convert hierarchical filter state to flat filter state for API calls
function convertHierarchicalToFlat(hierarchicalState?: HierarchicalFilterState) {
  if (!hierarchicalState) {
    return {
      selectedAreas: [],
      activeVibes: [],
      activeDates: [],
      activeGenres: [],
      activeOffers: [],
      searchQuery: '',
      eventCategories: [],
      attributes: {}
    };
  }

  const allActiveGenres: string[] = [];
  const allActiveVibes: string[] = [];

  // Process genres
  hierarchicalState.selectedPrimaries.genres.forEach(primary => {
    const secondaries = hierarchicalState.selectedSecondaries.genres?.[primary] || [];
    if (secondaries.length > 0) {
      allActiveGenres.push(...secondaries);
    } else {
      allActiveGenres.push(primary);
    }
  });

  // Process vibes
  hierarchicalState.selectedPrimaries.vibes.forEach(primary => {
    const secondaries = hierarchicalState.selectedSecondaries.vibes?.[primary] || [];
    if (secondaries.length > 0) {
      allActiveVibes.push(...secondaries);
    } else {
      allActiveVibes.push(primary);
    }
  });

  // Process event categories
  const eventCategories: Array<{ primary: string; secondary?: string }> = [];
  if (hierarchicalState.eventCategories) {
    hierarchicalState.eventCategories.selectedPrimaries.forEach(primary => {
      const secondaries = hierarchicalState.eventCategories!.selectedSecondaries[primary] || [];
      if (secondaries.length > 0) {
        secondaries.forEach(secondary => {
          eventCategories.push({ primary, secondary });
        });
      } else {
        eventCategories.push({ primary });
      }
    });
  }

  // Process attributes
  const attributes: {
    venue?: string[];
    energy?: string[];
    timing?: string[];
    status?: string[];
  } = {};
  if (hierarchicalState.attributes) {
    if (hierarchicalState.attributes.venue.length > 0) {
      attributes.venue = hierarchicalState.attributes.venue;
    }
    if (hierarchicalState.attributes.energy.length > 0) {
      attributes.energy = hierarchicalState.attributes.energy;
    }
    if (hierarchicalState.attributes.timing.length > 0) {
      attributes.timing = hierarchicalState.attributes.timing;
    }
    if (hierarchicalState.attributes.status.length > 0) {
      attributes.status = hierarchicalState.attributes.status;
    }
  }

  return {
    selectedAreas: hierarchicalState.selectedAreas,
    activeVibes: allActiveVibes,
    activeDates: hierarchicalState.activeDates,
    activeGenres: allActiveGenres,
    activeOffers: hierarchicalState.activeOffers,
    searchQuery: hierarchicalState.searchQuery,
    eventCategories,
    attributes
  };
}

const VenueFloatingPanel: React.FC<VenueFloatingPanelProps> = ({
  venue,
  isOpen,
  onClose,
  filters,
  stories = [],
  onViewDetails,
  onFiltersChange
}) => {
  const { isDarkMode } = useTheme();
  const flatFilters = convertHierarchicalToFlat(filters);
  const venueNameRef = useRef<HTMLHeadingElement>(null);
  const [venueNameWrapped, setVenueNameWrapped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  // Fetch events for this venue
  const { events, isLoading: eventsLoading } = useEvents({
    venue_id: venue?.venue_id ? Number(venue.venue_id) : undefined,
    limit: 50,
    genres: flatFilters.activeGenres || [],
    vibes: flatFilters.activeVibes || [],
    offers: flatFilters.activeOffers || [],
    eventCategories: flatFilters.eventCategories || [],
    attributes: flatFilters.attributes || {},
    enabled: isOpen && !!venue?.venue_id
  });

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = new Date(event.event_date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const uniqueDates = Object.keys(eventsByDate).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Create date options for selector
  const dateOptions = uniqueDates.map((dateKey, index) => {
    const date = new Date(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    const isTonight = eventDate.getTime() === today.getTime();

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      isTonight,
      dateKey
    };
  });

  // Get events for selected date
  const selectedDateKey = dateOptions[selectedDateIndex]?.dateKey;
  const selectedEvents = selectedDateKey ? eventsByDate[selectedDateKey] || [] : [];
  const currentEvent = selectedEvents[0]; // Show first event for selected date

  // Check if venue name wraps to multiple lines
  useEffect(() => {
    if (venueNameRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(venueNameRef.current).lineHeight);
      const height = venueNameRef.current.offsetHeight;
      setVenueNameWrapped(height > lineHeight * 1.5);
    }
  }, [venue?.name]);

  // Get vibes from event or venue attributes
  const getVibes = () => {
    const vibes: string[] = [];

    if (currentEvent?.attributes) {
      vibes.push(
        ...(currentEvent.attributes.venue || []),
        ...(currentEvent.attributes.energy || []),
        ...(currentEvent.attributes.timing || []),
        ...(currentEvent.attributes.status || [])
      );
    }

    // If no vibes from event, use venue category
    if (vibes.length === 0 && venue?.category) {
      try {
        // Try to parse as JSON first (in case it's a JSON array string)
        const parsed = JSON.parse(venue.category);
        if (Array.isArray(parsed)) {
          vibes.push(...parsed.map(c => String(c).trim()));
        } else {
          // Not an array, treat as comma-separated string
          const categories = venue.category.split(',').map(c => c.trim());
          vibes.push(...categories);
        }
      } catch {
        // Not JSON, treat as comma-separated string
        const categories = venue.category.split(',').map(c => c.trim());
        vibes.push(...categories);
      }
    }

    // Remove any empty strings, quotes, or brackets
    return vibes.filter(v => v && !v.match(/^[\[\]"']+$/)).map(v =>
      v.replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim()
    ).filter(v => v.length > 0);
  };

  const vibes = getVibes();

  // Check if there are limited tickets
  const hasLimitedTickets = currentEvent?.special_offers?.toLowerCase().includes('limited') || false;

  // Debug logging
  console.log('🎨 VenueFloatingPanel render:', { isOpen, venueName: venue?.name, hasEvents: events.length > 0 });

  if (!venue) return null;

  return (
    <>
      {/* Custom CSS */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');

        .event-card {
          width: 100%;
          max-width: 100%;
          background: rgba(10, 10, 26, 0.95);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border-radius: 24px;
          border: 1px solid rgba(124, 58, 237, 0.2);
          overflow: hidden;
          box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.3),
            0 12px 24px rgba(0, 0, 0, 0.35),
            0 20px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(124, 58, 237, 0.1);
          position: relative;
          display: flex;
          flex-direction: column;
          max-height: 45vh;
          transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 768px) {
          .event-card {
            max-width: 500px;
          }
        }

        .event-card.expanded {
          max-height: 100vh;
        }

        .card-body-wrapper {
          flex: 1;
          overflow-y: auto;
          position: relative;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .card-body-wrapper::-webkit-scrollbar {
          display: none;
        }

        .scroll-indicator {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: transparent;
          pointer-events: none;
          z-index: 5;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 16px 20px;
          transition: opacity 0.3s ease;
        }

        .scroll-indicator.hidden {
          opacity: 0;
        }

        .scroll-arrow {
          width: 52px;
          height: 52px;
          background: rgba(124, 58, 237, 0.15);
          border: 2px solid rgba(124, 58, 237, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e2e8f0;
          pointer-events: auto;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: bounceDown 1.5s ease-in-out infinite;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .scroll-arrow.close-button {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.4);
          animation: none;
        }

        .scroll-arrow.close-button:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .scroll-arrow:hover {
          background: rgba(124, 58, 237, 0.25);
          color: #ffffff;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .card-footer {
          flex-shrink: 0;
          background: rgba(18, 18, 42, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          position: relative;
          z-index: 10;
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(124, 58, 237, 0.2);
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Floating Panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
                duration: 0.3
              }}
              className="fixed bottom-1 md:bottom-4 left-1 right-1 md:left-2 md:right-2 z-[60] mx-auto"
              style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`event-card ${isCardExpanded ? 'expanded' : ''}`}>
                {/* Header with event name, time, genres, and venue info */}
                <div style={{
                  padding: '20px 20px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  {/* LEFT COLUMN - Event Name, Time, Genre Tags */}
                  <div style={{
                    width: '60%',
                    minWidth: 0,
                    maxWidth: '60%'
                  }}>
                    {/* Event Name (Large Title) */}
                    <h1
                      ref={venueNameRef}
                      style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#ffffff',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                      }}
                    >
                      {currentEvent?.artist || currentEvent?.event_name || venue.name}
                    </h1>

                    {/* Time Row with Teal Clock Icon - ALWAYS VISIBLE */}
                    {currentEvent?.event_time && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '8px',
                        marginBottom: '8px'
                      }}>
                        <Clock size={16} color="#00bfa5" />
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#e2e8f0'
                        }}>
                          {currentEvent.event_time}
                        </span>
                      </div>
                    )}

                    {/* Genre Tags (CYAN) - ALWAYS VISIBLE */}
                    {vibes.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        alignItems: 'center',
                        marginTop: '8px'
                      }}>
                        {vibes.map((vibe, index) => (
                          <React.Fragment key={index}>
                            <span style={{
                              color: '#a78bfa',
                              fontSize: '11px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap'
                            }}>
                              {vibe}
                            </span>
                            {index < vibes.length - 1 && (
                              <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 600 }}> | </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN - Star Rating & Venue Location */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '8px',
                    width: '40%',
                    maxWidth: '40%',
                    flexShrink: 1
                  }}>
                    {/* Star Rating Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(124, 58, 237, 0.2)',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      border: '1px solid rgba(124, 58, 237, 0.4)'
                    }}>
                      <span style={{ color: '#a78bfa', fontSize: '14px' }}>★</span>
                      <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>
                        {venue.rating ? venue.rating.toFixed(1) : '4.5'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        ({venue.rating_count ? venue.rating_count.toLocaleString() : '120'})
                      </span>
                    </div>

                    {/* Venue Location (Enhanced Prominence) */}
                    <div style={{
                      marginTop: '8px',
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#ffffff',
                        lineHeight: 1.3,
                        marginBottom: '4px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                      }}>
                        {venue.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#a78bfa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        justifyContent: 'flex-end'
                      }}>
                        <MapPin size={12} />
                        {venue.area}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full-Width Date Selector - MOVED FROM HEADER */}
                {dateOptions.length > 0 && (
                  <div style={{
                    padding: '20px 20px 12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      overflowX: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}>
                      {dateOptions.map((dateOption, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedDateIndex(index)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            minWidth: '70px',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            border: selectedDateIndex === index ? '1.5px solid rgba(124, 58, 237, 0.5)' : '1.5px solid rgba(124, 58, 237, 0.15)',
                            background: selectedDateIndex === index
                              ? 'linear-gradient(145deg, rgba(124, 58, 237, 0.4) 0%, rgba(109, 40, 217, 0.5) 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            boxShadow: selectedDateIndex === index
                              ? '0 4px 12px rgba(124, 58, 237, 0.3)'
                              : 'none',
                            position: 'relative'
                          }}
                        >
                          {dateOption.isTonight && (
                            <span style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                              color: 'white',
                              fontSize: '8px',
                              fontWeight: 700,
                              padding: '3px 6px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.4)'
                            }}>
                              TONIGHT
                            </span>
                          )}
                          <span style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: selectedDateIndex === index ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                            marginBottom: '2px',
                            fontWeight: 600
                          }}>
                            {dateOption.day}
                          </span>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color: selectedDateIndex === index ? 'white' : 'rgba(255,255,255,0.7)'
                          }}>
                            {dateOption.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full-Width Artists Section with Inline Arrow Button */}
                {currentEvent?.artist && (
                  <div style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    {/* Artists Info */}
                    <div className="venue-panel-artists-section" style={{
                      marginTop: 0,
                      flex: 1,
                      minWidth: 0
                    }}>
                      {/* ARTISTS Label */}
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#a78bfa',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px'
                      }}>
                        ARTISTS
                      </div>

                      {/* Artist Badges with Instagram Handles */}
                      <div className="venue-panel-artists-badges">
                        {currentEvent.artist.split(',').map((artist, idx, arr) => {
                          const artistName = artist.trim();
                          const instagramHandle = `(@${artistName.toUpperCase().replace(/\s+/g, '_')})`;

                          return (
                            <React.Fragment key={idx}>
                              <span className="venue-panel-artist-badge">
                                {artistName} {instagramHandle}
                              </span>
                              {idx < arr.length - 1 && (
                                <span className="venue-panel-artist-separator">|</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inline Arrow Button */}
                    <div
                      className={`scroll-arrow ${isCardExpanded ? 'close-button' : ''}`}
                      style={{ flexShrink: 0, marginTop: 0 }}
                      onClick={() => {
                        if (isCardExpanded) {
                          setIsCardExpanded(false);
                          onClose();
                        } else {
                          setIsCardExpanded(true);
                        }
                      }}
                    >
                      {isCardExpanded ? (
                        <X size={24} />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15"/>
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Scrollable body wrapper */}
                <div className="card-body-wrapper">
                  <div style={{ padding: '20px', paddingBottom: '90px' }}>
                    {/* Limited tickets alert */}
                    {hasLimitedTickets && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0.25) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '16px'
                      }}>
                        <span style={{ fontSize: '18px' }}>🎫</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: '#c084fc', fontWeight: 600 }}>
                            Limited online tickets left
                          </div>
                          <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 500 }}>
                            Secure online now
                          </div>
                        </div>
                        <button style={{
                          background: 'linear-gradient(145deg, #7c3aed 0%, #6d28d9 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}>
                          Get Tickets
                        </button>
                      </div>
                    )}

                    {/* DATE Section */}
                    {isCardExpanded && currentEvent?.event_date && (
                      <div className="venue-panel-info-section">
                        <div className="venue-panel-info-icon venue-panel-date-icon">
                          <Calendar size={20} />
                        </div>
                        <div className="venue-panel-info-content">
                          <span className="venue-panel-info-label">DATE</span>
                          <span className="venue-panel-info-value">
                            {new Date(currentEvent.event_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ENTRY Section */}
                    {isCardExpanded && currentEvent?.ticket_price && (
                      <div className="venue-panel-info-section">
                        <div className="venue-panel-info-icon venue-panel-entry-icon">
                          <DollarSign size={20} />
                        </div>
                        <div className="venue-panel-info-content">
                          <span className="venue-panel-info-label">ENTRY</span>
                          <span className="venue-panel-info-value">{currentEvent.ticket_price}</span>
                        </div>
                      </div>
                    )}

                    {/* OFFERS Section */}
                    {isCardExpanded && currentEvent?.special_offers && currentEvent.special_offers !== 'No special offers mentioned' && (
                      <div className="venue-panel-info-section">
                        <div className="venue-panel-info-icon venue-panel-offers-icon">
                          <Gift size={20} />
                        </div>
                        <div className="venue-panel-info-content">
                          <span className="venue-panel-info-label">OFFERS</span>
                          <span className="venue-panel-info-value">{currentEvent.special_offers}</span>
                        </div>
                      </div>
                    )}

                    {/* MUSIC GENRES Section */}
                    {isCardExpanded && currentEvent?.music_genre && (
                      <div className="venue-panel-info-section">
                        <div className="venue-panel-info-icon venue-panel-genre-icon">
                          <Music size={20} />
                        </div>
                        <div className="venue-panel-info-content">
                          <span className="venue-panel-info-label">MUSIC GENRES</span>
                          <div className="venue-panel-genre-badges">
                            {currentEvent.music_genre.split(',').map((genre, idx) => (
                              <span key={idx} className="venue-panel-genre-badge">
                                {genre.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EVENT VIBES Section */}
                    {isCardExpanded && currentEvent?.event_vibe && (
                      <div className="venue-panel-info-section">
                        <div className="venue-panel-info-icon venue-panel-vibe-icon">
                          <Sparkles size={20} />
                        </div>
                        <div className="venue-panel-info-content">
                          <span className="venue-panel-info-label">VIBES</span>
                          <div className="venue-panel-vibe-badges">
                            {currentEvent.event_vibe.split('|').map((vibe, idx) => (
                              <span key={idx} className="venue-panel-vibe-badge">
                                {vibe.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CONFIDENCE SCORE */}
                    {isCardExpanded && currentEvent?.confidence_score && (
                      <div className="venue-panel-info-section">
                        <div className="venue-panel-info-icon">
                          <Target size={20} style={{ color: 'rgba(34, 197, 94, 0.95)' }} />
                        </div>
                        <div className="venue-panel-info-content">
                          <span className="venue-panel-info-label">AI CONFIDENCE</span>
                          <span className="venue-panel-confidence-badge">
                            {currentEvent.confidence_score}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ANALYSIS NOTES - Expandable */}
                    {isCardExpanded && currentEvent?.analysis_notes && (
                      <div className="venue-panel-info-section">
                        <div className="venue-panel-info-icon venue-panel-notes-icon">
                          <FileText size={20} />
                        </div>
                        <div className="venue-panel-info-content">
                          <span className="venue-panel-info-label">DETAILS</span>
                          <p className="venue-panel-analysis-notes">
                            {isNotesExpanded
                              ? currentEvent.analysis_notes
                              : currentEvent.analysis_notes.substring(0, 150) +
                                (currentEvent.analysis_notes.length > 150 ? '...' : '')
                            }
                            {currentEvent.analysis_notes.length > 150 && (
                              <button
                                className="venue-panel-show-more-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsNotesExpanded(!isNotesExpanded);
                                }}
                              >
                                {isNotesExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* VENUE DETAILS Section */}
                    {isCardExpanded && (venue.address || venue.highlights || venue.atmosphere || venue.website || currentEvent?.website_social) && (
                      <div className="venue-panel-venue-details">
                        <h4 className="venue-panel-info-label" style={{ marginBottom: '12px' }}>
                          VENUE INFORMATION
                        </h4>

                        {venue.address && (
                          <div className="venue-panel-venue-detail-row">
                            <MapPin size={18} />
                            <span>{venue.address}</span>
                          </div>
                        )}

                        {venue.highlights && (
                          <div className="venue-panel-venue-detail-row">
                            <Sparkles size={18} />
                            <span>{venue.highlights}</span>
                          </div>
                        )}

                        {venue.atmosphere && (
                          <div className="venue-panel-venue-detail-row">
                            <Target size={18} />
                            <span>{venue.atmosphere}</span>
                          </div>
                        )}

                        {/* Visit Website Button */}
                        {(venue.website || currentEvent?.website_social) && (
                          <a
                            href={venue.website || currentEvent?.website_social}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="venue-panel-website-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={18} />
                            <span>Visit Website</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Venue types */}
                    {venue.category && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
                        {venue.category.split(',').map((type, index) => (
                          <span
                            key={index}
                            style={{
                              fontSize: '11px',
                              color: '#a78bfa',
                              background: 'rgba(124, 58, 237, 0.1)',
                              border: '1px solid rgba(124, 58, 237, 0.25)',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontWeight: 500
                            }}
                          >
                            {type.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scroll indicator with arrow/close button - ONLY when NO artists */}
                  {!currentEvent?.artist && (
                    <div className="scroll-indicator">
                      <div
                        className={`scroll-arrow ${isCardExpanded ? 'close-button' : ''}`}
                        onClick={() => {
                          if (isCardExpanded) {
                            setIsCardExpanded(false);
                            onClose();
                          } else {
                            setIsCardExpanded(true);
                          }
                        }}
                      >
                        {isCardExpanded ? (
                          <X size={24} />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed footer with action buttons */}
                <div className="card-footer">
                  <div style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: venue.name,
                            url: window.location.href
                          });
                        }
                      }}
                      style={{
                        width: '50px',
                        padding: '14px',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid rgba(124, 58, 237, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#e2e8f0'
                      }}
                      title="Share"
                    >
                      <Share2 size={18} />
                    </button>
                    {venue.final_instagram && (
                      <a
                        href={`https://instagram.com/${venue.final_instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '50px',
                          padding: '14px',
                          borderRadius: '14px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid rgba(124, 58, 237, 0.2)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#E1306C',
                          textDecoration: 'none'
                        }}
                        title="View on Instagram"
                      >
                        <Instagram size={22} />
                      </a>
                    )}
                    {venue.phone && (
                      <a
                        href={`tel:${venue.phone.toString().replace(/\s/g, '')}`}
                        style={{
                          width: '50px',
                          padding: '14px',
                          borderRadius: '14px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid rgba(124, 58, 237, 0.2)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#25D366',
                          textDecoration: 'none'
                        }}
                        title="Call venue"
                      >
                        <Phone size={22} />
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        border: 'none',
                        background: 'linear-gradient(145deg, #7c3aed 0%, #6d28d9 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                        textDecoration: 'none'
                      }}
                    >
                      <Navigation size={16} />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default VenueFloatingPanel;
