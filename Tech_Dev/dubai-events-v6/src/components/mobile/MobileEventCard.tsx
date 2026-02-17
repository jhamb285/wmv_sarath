'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Gift,
  Music,
  Sparkles,
  FileText,
  MapPin,
  Star,
  ExternalLink,
  Instagram,
  Phone,
  Share2,
  Navigation,
  ChevronUp,
  X,
  Target,
} from 'lucide-react';

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

interface MobileEventCardProps {
  card: EventCardData;
  getCategoryColor: (category: string) => { hue: number; saturation: number };
  isExpanded: boolean;
  onToggle: () => void;
  isFullScreen: boolean;
  onFullScreenToggle: () => void;
  onClose: () => void;
  dateOptions?: DateOption[];
  selectedDates?: string[];
  onDateChange?: (dates: string[]) => void;
}

const PLACEHOLDER_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVW-pbYSH_W9UliC5eEBX7oWNcsAJN9LETGg&s';

function parseToArray(value: unknown): string[] {
  if (!value) return [];

  const extractItems = (arr: unknown[]): string[] =>
    arr
      .map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) return Object.keys(item)[0] || '';
        return String(item);
      })
      .filter(Boolean);

  if (Array.isArray(value)) return extractItems(value);

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return extractItems(parsed);
    } catch { /* not JSON */ }
    // Plain string — split by comma if it contains commas
    if (value.includes(',')) return value.split(',').map(s => s.trim()).filter(Boolean);
    return [value];
  }

  return [String(value)];
}

const MobileEventCard: React.FC<MobileEventCardProps> = ({
  card,
  getCategoryColor,
  isExpanded,
  onToggle,
  isFullScreen,
  onFullScreenToggle,
  onClose,
  dateOptions = [],
  selectedDates = [],
  onDateChange,
}) => {
  const { event, venue } = card;
  const expandedRef = useRef<HTMLDivElement>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Lock body scroll when full-screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isFullScreen]);

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_instagram) {
      const handle = venue.venue_instagram.replace('@', '').trim();
      window.open(`https://www.instagram.com/${handle}`, '_blank');
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_phone) {
      window.open(`tel:${venue.venue_phone}`, '_self');
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: event.event_name,
        text: `${event.event_name} at ${venue.venue_name}`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_coordinates) {
      const { lat, lng } = venue.venue_coordinates;
      const name = encodeURIComponent(venue.venue_name);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${name}`, '_blank');
    } else if (venue.venue_address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.venue_address)}`, '_blank');
    }
  };

  const highlightTags = parseToArray(venue.venue_highlights);
  const atmosphereTags = parseToArray(venue.venue_atmosphere);

  // Collect attribute tags
  const allTags: { label: string; type: string }[] = [];
  if (venue.attributes) {
    venue.attributes.venue?.forEach(t => allTags.push({ label: t, type: 'venue' }));
    venue.attributes.energy?.forEach(t => allTags.push({ label: t, type: 'energy' }));
    venue.attributes.status?.forEach(t => allTags.push({ label: t, type: 'status' }));
    venue.attributes.timing?.forEach(t => allTags.push({ label: t, type: 'timing' }));
  }

  // Format date for date pills
  const formatDatePill = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { day, date };
    } catch {
      return { day: '', date: dateStr };
    }
  };

  const datePill = formatDatePill(event.event_date);

  // Format date for display (ISO → readable)
  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Get confidence score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'rgba(34, 197, 94, 0.15)', text: 'rgb(74, 222, 128)', border: 'rgba(34, 197, 94, 0.25)' };
    if (score >= 60) return { bg: 'rgba(251, 191, 36, 0.15)', text: 'rgb(251, 191, 36)', border: 'rgba(251, 191, 36, 0.25)' };
    return { bg: 'rgba(239, 68, 68, 0.15)', text: 'rgb(248, 113, 113)', border: 'rgba(239, 68, 68, 0.25)' };
  };

  // =============================================
  // FULL-SCREEN EXPANDED VIEW
  // =============================================
  if (isFullScreen) {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col"
        style={{ background: 'rgba(10, 10, 26, 0.99)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-4 pt-5 pb-2 flex-shrink-0">
          <h2 className="font-bold text-[20px] flex-1 leading-snug" style={{ color: '#f0f0ff', letterSpacing: '-0.02em' }}>
            {event.event_name}
          </h2>
        </div>

        {/* Date Pills Row + Close Button (in full-screen) */}
        <div className="px-4 pb-3 flex items-center gap-2 flex-shrink-0">
          <div
            className="flex-1 flex items-center gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {dateOptions.length > 0 ? (
              dateOptions.map((opt) => {
                const isSelected = selectedDates.includes(opt.dateKey);
                return (
                  <button
                    key={opt.dateKey}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSelected && onDateChange) {
                        onDateChange([opt.dateKey]);
                      }
                    }}
                    className="flex flex-col items-center px-3 py-1.5 rounded-xl whitespace-nowrap flex-shrink-0 transition-all duration-200"
                    style={{
                      background: isSelected ? 'rgba(20, 20, 40, 1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                      {opt.day}
                    </span>
                    <span className={`text-[12px] font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {opt.date}
                    </span>
                  </button>
                );
              })
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(20, 20, 40, 1)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Calendar className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] text-gray-300 font-bold uppercase">{datePill.day}</span>
                <span className="text-[12px] text-white font-semibold">{datePill.date}</span>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-24"
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Venue header bar */}
          <div className="flex items-center gap-3 pb-3" style={{ borderBottom: isImageExpanded ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer transition-transform active:scale-95"
              style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => { e.stopPropagation(); setIsImageExpanded(prev => !prev); }}
            >
              <img src={PLACEHOLDER_IMAGE} alt={venue.venue_name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[16px]" style={{ color: '#e8e0ff' }}>{venue.venue_name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-[12px] font-bold">{venue.venue_rating}</span>
                <span className="text-[11px]" style={{ color: 'rgb(120, 120, 150)' }}>({venue.venue_review_count?.toLocaleString()})</span>
                <span className="text-[10px] mx-0.5" style={{ color: 'rgb(60, 60, 90)' }}>|</span>
                <MapPin className="w-3 h-3" style={{ color: 'rgb(120, 120, 150)' }} />
                <span className="text-[11px] truncate" style={{ color: 'rgb(150, 150, 180)' }}>{venue.venue_location}</span>
              </div>
            </div>
          </div>

          {/* Expanded venue image */}
          {isImageExpanded && (
            <div
              className="mt-3 mb-5 rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={(e) => { e.stopPropagation(); setIsImageExpanded(false); }}
            >
              <img
                src={PLACEHOLDER_IMAGE}
                alt={venue.venue_name}
                className="w-full object-cover"
                style={{ maxHeight: '260px' }}
              />
            </div>
          )}
          {!isImageExpanded && <div className="mb-5" />}

          {/* Detail rows */}
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.1)' }}>
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgb(100, 100, 140)' }}>Date</p>
                <p className="text-[15px] font-medium mt-0.5" style={{ color: '#f0f0ff' }}>{formatDisplayDate(event.event_date) || 'TBA'}</p>
              </div>
            </div>

            {/* Time */}
            {event.event_time_start && (
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgb(100, 100, 140)' }}>Time</p>
                  <p className="text-[15px] font-medium mt-0.5" style={{ color: '#f0f0ff' }}>
                    {event.event_time_start}
                    {event.event_time_end && <span style={{ color: 'rgb(120, 120, 150)' }}> — </span>}
                    {event.event_time_end && event.event_time_end}
                  </p>
                </div>
              </div>
            )}

            {/* Entry Price */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgb(100, 100, 140)' }}>Entry</p>
                <p className="text-[15px] font-medium mt-0.5" style={{ color: '#f0f0ff' }}>{event.event_entry_price || 'TBA'}</p>
              </div>
            </div>

            {/* Offers */}
            {event.event_offers && !event.event_offers.toLowerCase().includes('no special offers') && (
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                  <Gift className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgb(100, 100, 140)' }}>Offers</p>
                  <p className="text-[15px] font-medium mt-0.5" style={{ color: '#f0f0ff' }}>{event.event_offers}</p>
                </div>
              </div>
            )}

            {/* AI Confidence Score */}
            {event.confidence_score != null && (
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: getScoreColor(event.confidence_score).bg, border: `1px solid ${getScoreColor(event.confidence_score).border}` }}>
                  <Target className="w-4 h-4" style={{ color: getScoreColor(event.confidence_score).text }} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgb(100, 100, 140)' }}>AI Confidence</p>
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${event.confidence_score}%`,
                          background: getScoreColor(event.confidence_score).text,
                        }}
                      />
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: getScoreColor(event.confidence_score).text }}>
                      {event.confidence_score}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Notes / Details */}
            {event.analysis_notes && (
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                     style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgb(100, 100, 140)' }}>Details</p>
                  <p
                    className="text-[12px] mt-1 leading-relaxed"
                    style={{
                      color: 'rgba(220, 200, 150, 0.9)',
                      fontStyle: 'italic',
                      display: '-webkit-box',
                      WebkitLineClamp: isDetailsExpanded ? 'unset' : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: isDetailsExpanded ? 'visible' : 'hidden',
                    }}
                  >
                    {event.analysis_notes}
                  </p>
                  {event.analysis_notes.length > 120 && (
                    <button
                      className="text-[10px] font-semibold mt-1.5 transition-colors"
                      style={{ color: 'rgba(200, 180, 120, 0.8)' }}
                      onClick={(e) => { e.stopPropagation(); setIsDetailsExpanded(prev => !prev); }}
                    >
                      {isDetailsExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Artists, Genres & Vibes */}
          {(event.artist || event.music_genre || event.event_vibe) && (
            <div className="my-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          )}
          <div className="space-y-3">
            {/* Artists */}
            {event.artist && (
              <div className="flex items-start gap-3">
                <Music className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Artists</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.artist.split(/[|,]/).map((artist, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'rgba(147, 51, 234, 0.15)',
                          color: 'rgb(192, 132, 252)',
                          border: '1px solid rgba(147, 51, 234, 0.2)',
                        }}
                      >
                        {artist.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Music Genres */}
            {event.music_genre && (
              <div className="flex items-start gap-3">
                <Music className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Music Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.music_genre.split(',').map((genre, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'rgb(96, 165, 250)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        {genre.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Event Vibes */}
            {event.event_vibe && (
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Vibes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.event_vibe.split('|').map((vibe, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'rgba(236, 72, 153, 0.15)',
                          color: 'rgb(244, 114, 182)',
                          border: '1px solid rgba(236, 72, 153, 0.2)',
                        }}
                      >
                        {vibe.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Venue Information Section */}
          {(venue.venue_address || highlightTags.length > 0 || atmosphereTags.length > 0 || venue.venue_website) && (
            <>
              <div className="my-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-3">Venue Information</p>

                <div className="space-y-2.5">
                  {venue.venue_address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-[13px] leading-relaxed">{venue.venue_address}</span>
                    </div>
                  )}
                  {highlightTags.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-1" />
                      <div className="flex flex-wrap gap-1.5">
                        {highlightTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                            style={{
                              background: 'rgba(251, 191, 36, 0.12)',
                              color: 'rgb(251, 191, 36)',
                              border: '1px solid rgba(251, 191, 36, 0.2)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {atmosphereTags.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400 flex-shrink-0 mt-1" />
                      <div className="flex flex-wrap gap-1.5">
                        {atmosphereTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                            style={{
                              background: 'rgba(236, 72, 153, 0.12)',
                              color: 'rgb(244, 114, 182)',
                              border: '1px solid rgba(236, 72, 153, 0.2)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {venue.venue_website && (
                  <button
                    className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-95 w-full justify-center"
                    style={{
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: 'rgb(96, 165, 250)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                    }}
                    onClick={(e) => { e.stopPropagation(); window.open(venue.venue_website, '_blank'); }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Fixed Action Buttons at bottom */}
        <div
          className="flex-shrink-0 px-4 py-3 flex items-center gap-2"
          style={{
            background: 'rgba(10, 10, 26, 0.98)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#60a5fa' }}
            onClick={handleShareClick}
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          {venue.venue_instagram && (
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#e879f9' }}
              onClick={handleInstagramClick}
            >
              <Instagram className="w-4 h-4" />
              <span>Insta</span>
            </button>
          )}
          {venue.venue_phone && (
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#34d399' }}
              onClick={handleCallClick}
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </button>
          )}
          <button
            className="flex-[1.5] flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{
              background: 'rgba(124, 58, 237, 0.2)',
              color: '#a78bfa',
              border: '1px solid rgba(124, 58, 237, 0.3)',
            }}
            onClick={handleDirectionsClick}
          >
            <Navigation className="w-4 h-4" />
            <span>Directions</span>
          </button>
        </div>
      </div>
    );
  }

  // =============================================
  // COLLAPSED PREVIEW CARD (shown in bottom panel)
  // =============================================
  if (!isExpanded) return null; // Only show when selected

  return (
    <div
      ref={expandedRef}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(15, 15, 35, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
      onClick={onToggle}
    >
      {/* Main Header: Left details + Right image/rating */}
      <div className="flex gap-3 p-3.5">
        {/* Left Column: Event Details */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Event Name */}
          <h3 className="text-white font-bold text-[16px] leading-tight tracking-tight">
            {event.event_name}
          </h3>

          {/* Time Row */}
          {event.event_time_start && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-gray-300 text-[12px] font-medium">
                {event.event_time_start}
                {event.event_time_end && ` — ${event.event_time_end}`}
              </span>
            </div>
          )}

          {/* Subtitle */}
          {event.event_subtitle && event.event_subtitle !== event.event_name && (
            <p className="text-gray-400 text-[11px] mt-1 truncate leading-snug">
              {event.event_subtitle}
            </p>
          )}

          {/* Attribute Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {allTags.slice(0, 4).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    background: 'rgba(124, 58, 237, 0.12)',
                    color: 'rgb(167, 139, 250)',
                    border: '1px solid rgba(124, 58, 237, 0.18)',
                  }}
                >
                  {tag.label}
                </span>
              ))}
              {allTags.length > 4 && (
                <span className="text-[9px] text-gray-500 px-1 py-0.5 font-medium">
                  +{allTags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Image + Rating + Venue info */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: '90px' }}>
          {/* Venue Image */}
          <div className="w-[76px] h-[76px] rounded-xl overflow-hidden"
               style={{ border: '2px solid rgba(255,255,255,0.08)' }}>
            <img
              src={PLACEHOLDER_IMAGE}
              alt={venue.venue_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="mx-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Venue Name + Rating + Location */}
      <div className="px-3.5 py-2">
        <p className="text-white text-[13px] font-semibold truncate">{venue.venue_name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
          <span className="text-amber-400 text-[12px] font-bold">{venue.venue_rating}</span>
          <span className="text-gray-500 text-[9px]">({venue.venue_review_count?.toLocaleString()})</span>
          <span className="text-gray-600 text-[10px] mx-0.5">|</span>
          <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <span className="text-gray-400 text-[11px] truncate">{venue.venue_location}</span>
        </div>
      </div>

      {/* Date Pills Row + Close Button */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          {dateOptions.length > 0 ? (
            dateOptions.map((opt) => {
              const isSelected = selectedDates.includes(opt.dateKey);
              return (
                <button
                  key={opt.dateKey}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected && onDateChange) {
                      onDateChange([opt.dateKey]);
                    }
                  }}
                  className="flex flex-col items-center px-3 py-1.5 rounded-xl whitespace-nowrap flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isSelected ? 'rgba(20, 20, 40, 1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                    {opt.day}
                  </span>
                  <span className={`text-[12px] font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                    {opt.date}
                  </span>
                </button>
              );
            })
          ) : (
            /* Fallback: show event's own date */
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                background: 'rgba(20, 20, 40, 1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Calendar className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-gray-300 font-bold uppercase">{datePill.day}</span>
              <span className="text-[12px] text-white font-semibold">{datePill.date}</span>
            </div>
          )}
        </div>

        {/* Expand / Close Toggle Button */}
        <button
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: isFullScreen
              ? 'rgba(239, 68, 68, 0.12)'
              : 'rgba(124, 58, 237, 0.15)',
            border: `1px solid ${isFullScreen
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(124, 58, 237, 0.25)'}`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isFullScreen) {
              onClose();
            } else {
              onFullScreenToggle();
            }
          }}
          aria-label={isFullScreen ? 'Close' : 'Expand'}
        >
          {isFullScreen ? (
            <X className="w-4 h-4 text-red-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-purple-400" />
          )}
        </button>
      </div>

      {/* Artists Row */}
      {event.artist && (
        <>
          <div className="mx-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />
          <div className="px-3.5 py-2 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold flex-shrink-0">Artists</p>
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {event.artist.split(/[|,]/).map((artist, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0"
                  style={{
                    background: 'rgba(147, 51, 234, 0.15)',
                    color: 'rgb(192, 132, 252)',
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                  }}
                >
                  {artist.trim()}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default MobileEventCard;
