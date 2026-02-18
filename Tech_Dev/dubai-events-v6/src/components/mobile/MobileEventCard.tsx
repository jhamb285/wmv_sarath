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

const PLACEHOLDER_IMAGES = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVW-pbYSH_W9UliC5eEBX7oWNcsAJN9LETGg&s',
  'https://images.musement.com/cover/0002/45/dubai-skyline-at-dusk-jpg_header-144981.jpeg',
  'https://cdn.audleytravel.com/4571/3265/79/15992392-dubai-marina-skyline-dubai.jpg',
];
const PLACEHOLDER_IMAGE = PLACEHOLDER_IMAGES[0];

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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchDeltaXRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  // Infinite image list: [...images, first image clone] for seamless loop
  const loopImages = [...PLACEHOLDER_IMAGES, PLACEHOLDER_IMAGES[0]];
  const totalReal = PLACEHOLDER_IMAGES.length;

  // Auto-advance carousel every 3s when fullscreen
  useEffect(() => {
    if (!isFullScreen) return;
    carouselTimerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCarouselIndex(prev => prev + 1);
    }, 3000);
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [isFullScreen]);

  // When transition ends on the clone slide, snap back to real first slide instantly
  const handleCarouselTransitionEnd = () => {
    if (carouselIndex >= totalReal) {
      setIsTransitioning(false);
      setCarouselIndex(0);
    }
  };

  const resetCarouselTimer = () => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    carouselTimerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCarouselIndex(prev => prev + 1);
    }, 3000);
  };

  const goToSlide = (idx: number) => {
    setIsTransitioning(true);
    setCarouselIndex(idx);
    resetCarouselTimer();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const threshold = 50;
    if (touchDeltaXRef.current < -threshold) {
      // Swipe left → next
      setIsTransitioning(true);
      setCarouselIndex(prev => prev + 1);
      resetCarouselTimer();
    } else if (touchDeltaXRef.current > threshold) {
      // Swipe right → prev (wrap around)
      setIsTransitioning(true);
      setCarouselIndex(prev => (prev - 1 + totalReal) % totalReal);
      resetCarouselTimer();
    }
    touchDeltaXRef.current = 0;
  };

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
        className="fixed z-[60] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.99)',
          top: '190px',
          left: '6px',
          right: '6px',
          bottom: '12px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Close Button */}
        <div className="flex items-center px-4 pt-5 pb-2 flex-shrink-0">
          <h2 className="font-bold text-[20px] flex-1 leading-snug text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {event.event_name}
          </h2>
          <button
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ml-3"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>

        {/* Venue info (fixed with header) */}
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="font-semibold text-[15px] text-gray-800">{venue.venue_name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-amber-600 text-[12px] font-bold">{venue.venue_rating}</span>
            <span className="text-[11px] text-gray-500">({venue.venue_review_count?.toLocaleString()})</span>
            <span className="text-[10px] mx-0.5 text-gray-300">|</span>
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] truncate text-gray-600">{venue.venue_location}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-24"
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Divider + Image Carousel (always shown) */}
          <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }} />
          <div className="my-3 relative">
            {/* Carousel viewport */}
            <div
              className="overflow-hidden rounded-2xl"
              style={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(-${carouselIndex * 100}%)`,
                  transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                }}
                onTransitionEnd={handleCarouselTransitionEnd}
              >
                {loopImages.map((src, idx) => (
                  <div key={idx} className="w-full flex-shrink-0 relative">
                    <img
                      src={src}
                      alt={`${venue.venue_name} ${idx + 1}`}
                      className="w-full object-cover"
                      style={{ height: '220px' }}
                      draggable={false}
                    />
                    {/* Gradient overlay at bottom for depth */}
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{
                        height: '60px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            {totalReal > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2.5">
                {PLACEHOLDER_IMAGES.map((_, idx) => {
                  const isActive = (carouselIndex % totalReal) === idx;
                  return (
                    <button
                      key={idx}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: isActive ? '20px' : '6px',
                        height: '6px',
                        background: isActive
                          ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                          : 'rgba(0, 0, 0, 0.12)',
                        boxShadow: isActive ? '0 1px 4px rgba(124, 58, 237, 0.4)' : 'none',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToSlide(idx);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Date Pills */}
          <div className="pb-4 pt-1">
            <div
              className="flex items-center gap-1.5 overflow-x-auto"
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
                        background: isSelected ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.04)',
                        border: `1px solid ${isSelected ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {opt.day}
                      </span>
                      <span className={`text-[12px] font-semibold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                        {opt.date}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(0, 0, 0, 0.1)' }}
                >
                  <Calendar className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-bold uppercase">{datePill.day}</span>
                  <span className="text-[12px] text-white font-semibold">{datePill.date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detail rows */}
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.1)' }}>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-500">Date</p>
                <p className="text-[14px] font-medium mt-0.5 text-gray-900">{formatDisplayDate(event.event_date) || 'TBA'}</p>
              </div>
            </div>

            {/* Time */}
            {event.event_time_start && (
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-500">Time</p>
                  <p className="text-[14px] font-medium mt-0.5 text-gray-900">
                    {event.event_time_start}
                    {event.event_time_end && <span className="text-gray-400"> — </span>}
                    {event.event_time_end && event.event_time_end}
                  </p>
                </div>
              </div>
            )}

            {/* Entry Price */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-500">Entry</p>
                <p className="text-[14px] font-medium mt-0.5 text-gray-900">{event.event_entry_price || 'TBA'}</p>
              </div>
            </div>

            {/* Offers */}
            {event.event_offers && !event.event_offers.toLowerCase().includes('no special offers') && (
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                  <Gift className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-500">Offers</p>
                  <p className="text-[14px] font-medium mt-0.5 text-gray-900">{event.event_offers}</p>
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
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-500">AI Confidence</p>
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(0, 0, 0, 0.06)' }}>
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
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-gray-500">Details</p>
                  <p
                    className="text-[12px] mt-1 leading-relaxed"
                    style={{
                      color: 'rgb(120, 100, 50)',
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
                      style={{ color: 'rgb(140, 120, 60)' }}
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
            <div className="my-4" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }} />
          )}
          <div className="space-y-3">
            {/* Artists */}
            {event.artist && (
              <div className="flex items-start gap-3">
                <Music className="w-4 h-4 text-purple-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Artists</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.artist.split(/[|,]/).map((artist, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'rgba(147, 51, 234, 0.12)',
                          color: 'rgb(109, 40, 217)',
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
                <Music className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Music Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.music_genre.split(',').map((genre, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: 'rgb(37, 99, 235)',
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
                <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Vibes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.event_vibe.split('|').map((vibe, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'rgba(236, 72, 153, 0.12)',
                          color: 'rgb(190, 24, 93)',
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

          {/* Venue Details Section */}
          {(venue.venue_address || highlightTags.length > 0 || atmosphereTags.length > 0 || venue.venue_phone) && (
            <>
              <div className="my-4" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }} />
              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-3">Venue Details</p>

                <div className="space-y-2.5">
                  {highlightTags.length > 0 && (
                    <div className="flex items-center gap-2.5">
                      <Star className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'rgba(156, 163, 175, 0.8)' }} />
                      <span className="text-gray-700 text-[13px]">{highlightTags.join(', ')}</span>
                    </div>
                  )}
                  {atmosphereTags.length > 0 && (
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'rgba(156, 163, 175, 0.8)' }} />
                      <span className="text-gray-700 text-[13px]">{atmosphereTags.join(', ')}</span>
                    </div>
                  )}
                  {venue.venue_phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'rgba(156, 163, 175, 0.8)' }} />
                      <span className="text-gray-700 text-[13px]">{venue.venue_phone}</span>
                    </div>
                  )}
                  {venue.venue_address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-[18px] h-[18px] flex-shrink-0 mt-0.5" style={{ color: 'rgba(156, 163, 175, 0.8)' }} />
                      <span className="text-gray-700 text-[13px] leading-relaxed">{venue.venue_address}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Action Buttons at bottom */}
        <div
          className="flex-shrink-0 px-4 py-3 flex items-center gap-3 rounded-b-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Icon buttons left, Get Directions right */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {venue.venue_instagram && (
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(90, 90, 90, 0.75)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}
                  onClick={handleInstagramClick}
                >
                  <Instagram className="w-[18px] h-[18px]" style={{ color: '#E1306C' }} />
                </button>
              )}
              {venue.venue_phone && (
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(90, 90, 90, 0.75)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}
                  onClick={handleCallClick}
                >
                  <Phone className="w-[18px] h-[18px]" style={{ color: '#4ADE80' }} />
                </button>
              )}
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(90, 90, 90, 0.75)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}
                onClick={handleShareClick}
              >
                <Share2 className="w-[18px] h-[18px]" style={{ color: '#ffffff' }} />
              </button>
            </div>

            {/* Get Directions pill button */}
            <button
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold transition-all active:scale-95"
              style={{
                background: 'rgba(90, 90, 90, 0.75)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                color: '#ffffff',
              }}
              onClick={handleDirectionsClick}
            >
              <Navigation className="w-4 h-4" style={{ color: '#4ADE80' }} />
              <span>Get Directions</span>
            </button>
          </div>
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
      className="rounded-2xl overflow-hidden cursor-pointer w-full flex flex-col"
      style={{
        background: 'rgba(255, 255, 255, 0.97)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.12)',
      }}
      onClick={onToggle}
    >
      {/* === SECTION 1: Header — Name + Subtitle + Venue + Rating | Image === */}
      <div className="flex gap-3 px-3.5 pt-3 pb-2.5">
        {/* Left Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-gray-900 font-bold text-[15px] leading-tight tracking-tight line-clamp-2">
            {event.event_name}
          </h3>
          {event.event_subtitle && event.event_subtitle !== event.event_name && (
            <p className="text-gray-500 text-[10px] mt-0.5 truncate leading-snug uppercase tracking-wide font-semibold">
              {event.event_subtitle}
            </p>
          )}
          <p className="text-gray-800 text-[12px] font-semibold truncate mt-1.5">{venue.venue_name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
            <span className="text-amber-600 text-[11px] font-bold">{venue.venue_rating}</span>
            <span className="text-gray-400 text-[9px]">({venue.venue_review_count?.toLocaleString()})</span>
            <span className="text-gray-300 text-[9px] mx-0.5">|</span>
            <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500 text-[10px] truncate">{venue.venue_location}</span>
          </div>
        </div>
        {/* Right Column: Image */}
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: '100px' }}>
          <div className="w-[96px] h-[96px] rounded-xl overflow-hidden"
               style={{ border: '2px solid rgba(0,0,0,0.06)' }}>
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
      <div className="mx-3.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

      {/* === SECTION 2: Dates + Expand — grows to fill remaining space === */}
      <div className="px-3 py-2 flex items-center gap-2 flex-1">
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
                  className="flex flex-col items-center px-2.5 py-1 rounded-xl whitespace-nowrap flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isSelected ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isSelected ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                    {opt.day}
                  </span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                    {opt.date}
                  </span>
                </button>
              );
            })
          ) : (
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(0, 0, 0, 0.45)' }}
            >
              <Calendar className="w-3 h-3 text-white" />
              <span className="text-[10px] text-white font-bold uppercase">{datePill.day}</span>
              <span className="text-[11px] text-white font-semibold">{datePill.date}</span>
            </div>
          )}
        </div>
        <button
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: isFullScreen ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            border: `1px solid ${isFullScreen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isFullScreen) { onClose(); } else { onFullScreenToggle(); }
          }}
          aria-label={isFullScreen ? 'Close' : 'Expand'}
        >
          {isFullScreen ? (
            <X className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>
      </div>

      {/* === SECTION 3: Timing + Artists (bottom, compact) === */}
      {(event.event_time_start || (event.artist && event.artist.trim())) && (
        <div className="px-3.5 pb-2.5 pt-0">
          <div className="mx-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

          {/* Timing */}
          {event.event_time_start && (
            <div className="flex justify-center items-center gap-1.5 pt-2 pb-1">
              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 text-[11px] font-medium">
                {event.event_time_start}
                {event.event_time_end && ` — ${event.event_time_end}`}
              </span>
            </div>
          )}

          {/* Artists */}
          {event.artist && event.artist.trim() && (() => {
            const isArtistCategory = ['Music Events', 'Nightlife'].some(
              cat => event.category?.includes(cat) || event.event_categories?.some(c => c.primary === cat)
            );
            return (
              <div className="flex items-center justify-center gap-1.5 overflow-hidden pt-0.5 pb-0.5">
                {isArtistCategory && (
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold flex-shrink-0">Artists</span>
                )}
                <span className="text-gray-500 text-[11px] font-medium truncate">
                  {event.artist.split(/[|,]/).map(a => a.trim()).filter(Boolean).join(' | ')}
                </span>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};

export default MobileEventCard;
