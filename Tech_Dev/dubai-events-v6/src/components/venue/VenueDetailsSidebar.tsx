'use client';

import React, { useState, useMemo } from 'react';
import { X, MapPin, Clock, Instagram, ExternalLink, Users, Calendar, Music, TrendingUp, DollarSign, Gift, MessageCircle, BarChart3, Sparkles, Target, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEvents } from '@/hooks/useEvents';
import { useTheme } from '@/contexts/ThemeContext';
import { getVenuePrimaryEventCategory } from '@/lib/map/marker-colors';
import { getCategoryColor, getHexColor } from '@/lib/category-mappings';
import type { Venue, InstagramStory, HierarchicalFilterState, FilterState } from '@/types';

interface VenueDetailsSidebarProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  stories?: InstagramStory[];
  filters?: HierarchicalFilterState;
}

// Convert hierarchical filter state to flat filter state for API calls
function convertHierarchicalToFlat(hierarchicalState?: HierarchicalFilterState): FilterState {
  if (!hierarchicalState) {
    return {
      selectedAreas: [],
      activeVibes: [],
      activeDates: [],
      activeGenres: [],
      activeOffers: [],
      searchQuery: ''
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

  return {
    selectedAreas: hierarchicalState.selectedAreas,
    activeVibes: allActiveVibes,
    activeDates: hierarchicalState.activeDates,
    activeGenres: allActiveGenres,
    activeOffers: hierarchicalState.activeOffers,
    searchQuery: hierarchicalState.searchQuery
  };
}

const VenueDetailsSidebar: React.FC<VenueDetailsSidebarProps> = ({
  venue,
  isOpen,
  onClose,
  stories = [],
  filters
}) => {
  // Get theme context
  const { isDarkMode } = useTheme();
  
  // Get venue's primary event category for color-coding
  const primaryEventCategory = venue ? getVenuePrimaryEventCategory(venue) : null;
  
  // Convert hierarchical filters to flat for API call
  const flatFilters = convertHierarchicalToFlat(filters);

  // Fetch real event data for this venue with applied filters
  // Only fetch when sidebar is actually open to avoid duplicate API calls
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents({
    venue_id: venue?.venue_id ? Number(venue.venue_id) : undefined,
    limit: 10,
    genres: flatFilters.activeGenres || [],
    vibes: flatFilters.activeVibes || [],
    offers: flatFilters.activeOffers || [],
    dates: flatFilters.activeDates || [],
    enabled: isOpen && !!venue?.venue_id // Only fetch when sidebar is open and has a venue
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

  // State for selected date (default to first date)
  const [selectedDateKey, setSelectedDateKey] = useState(uniqueDates[0] || '');

  // Update selected date when events change (e.g., when filters change)
  React.useEffect(() => {
    if (uniqueDates.length > 0 && !uniqueDates.includes(selectedDateKey)) {
      setSelectedDateKey(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDateKey]);
  const selectedDateEvents = selectedDateKey ? eventsByDate[selectedDateKey] || [] : [];

  // Deduplicate events by ID to prevent duplicate cards
  const uniqueSelectedDateEvents = useMemo(() => {
    const eventMap = new Map<number | string, typeof selectedDateEvents[0]>();
    selectedDateEvents.forEach(event => {
      if (event.id && !eventMap.has(event.id)) {
        eventMap.set(event.id, event);
      }
    });
    console.log('🔍 VenueDetailsSidebar Deduplication - Input:', selectedDateEvents.length, 'Output:', eventMap.size);
    return Array.from(eventMap.values());
  }, [selectedDateEvents]);

  if (!venue) return null;

  // Use venue data as-is without any dummy data

  const currentStories = stories;
  const hasLiveStories = currentStories.length > 0;
  const timeRemaining = hasLiveStories ? '22h 25m left' : '';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 backdrop-blur-2xl shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isDarkMode
            ? 'bg-[#0a0a1a]/95 border-l border-purple-500/20 text-white'
            : 'bg-white/85 border-l border-gray-300/60 text-gray-900'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-4 border-b ${
            isDarkMode ? 'border-purple-500/20' : 'border-gray-300/70'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2">
                  <div className="flex-1">
                    <h2 className={`text-lg font-bold mb-1 leading-tight ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{venue.name}</h2>
                    <p className={`text-sm flex items-center gap-1 ${
                      isDarkMode ? 'text-white/85' : 'text-gray-700'
                    }`}>
                      <span>{venue.area}</span>
                      <span className={`w-1 h-1 rounded-full ${
                        isDarkMode ? 'bg-white/60' : 'bg-gray-500'
                      }`}></span>
                      <span>Dubai</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {primaryEventCategory && (() => {
                      const colorName = getCategoryColor(primaryEventCategory);
                      
                      // Map color names to Tailwind utility classes
                      const colorClassMap: Record<string, { bg: string; border: string; text: string }> = {
                        purple: {
                          bg: isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500/10',
                          border: isDarkMode ? 'border-purple-400' : 'border-purple-400',
                          text: isDarkMode ? 'text-purple-300' : 'text-purple-600'
                        },
                        red: {
                          bg: isDarkMode ? 'bg-red-500/20' : 'bg-red-500/10',
                          border: isDarkMode ? 'border-red-400' : 'border-red-400',
                          text: isDarkMode ? 'text-red-300' : 'text-red-600'
                        },
                        yellow: {
                          bg: isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-500/10',
                          border: isDarkMode ? 'border-yellow-400' : 'border-yellow-400',
                          text: isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                        },
                        orange: {
                          bg: isDarkMode ? 'bg-orange-500/20' : 'bg-orange-500/10',
                          border: isDarkMode ? 'border-orange-400' : 'border-orange-400',
                          text: isDarkMode ? 'text-orange-300' : 'text-orange-600'
                        },
                        pink: {
                          bg: isDarkMode ? 'bg-pink-500/20' : 'bg-pink-500/10',
                          border: isDarkMode ? 'border-pink-400' : 'border-pink-400',
                          text: isDarkMode ? 'text-pink-300' : 'text-pink-600'
                        },
                        gray: {
                          bg: isDarkMode ? 'bg-gray-500/20' : 'bg-gray-500/10',
                          border: isDarkMode ? 'border-gray-400' : 'border-gray-400',
                          text: isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }
                      };
                      
                      const colors = colorClassMap[colorName] || colorClassMap.gray;
                      
                      return (
                        <Badge
                          variant="secondary"
                          className={`capitalize border-2 font-semibold text-base px-3 py-1.5 ${colors.bg} ${colors.border} ${colors.text}`}
                        >
                          {primaryEventCategory}
                        </Badge>
                      );
                    })()}
                    {!primaryEventCategory && (
                      <Badge
                        variant="secondary"
                        className={`capitalize border-2 font-semibold text-base px-3 py-1.5 ${
                          isDarkMode
                            ? 'bg-purple-900/40 text-purple-200 border-purple-500/30'
                            : 'bg-white/90 text-gray-900 border-gray-400'
                        }`}
                      >
                        {venue.category?.split(',')[0]?.replace(/([a-z])([A-Z])/g, '$1 $2')?.trim() || 'Venue'}
                      </Badge>
                    )}
                    {hasLiveStories && (
                      <Badge 
                        variant="destructive"
                        className={`animate-pulse ${
                          isDarkMode
                            ? 'bg-red-600 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mr-1.5 animate-pulse ${
                          isDarkMode ? 'bg-red-400' : 'bg-red-200'
                        }`}></span>
                        {currentStories.length} Live Stories
                      </Badge>
                    )}

                    {/* Venue Rating & Review Count */}
                    {venue.rating && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                          isDarkMode
                            ? 'bg-white/10 border-white/20'
                            : 'bg-white/50 border-gray-300/50'
                        }`}>
                          <span className="text-yellow-400">★</span>
                          <span className={`font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {venue.rating.toFixed(1)}
                          </span>
                        </div>
                        {venue.rating_count && (
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ({venue.rating_count.toLocaleString()} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {venue?.final_instagram && (
                      <a
                        href={`https://instagram.com/${venue.final_instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-full transition-colors duration-200 ${
                          isDarkMode
                            ? 'bg-purple-900/40 hover:bg-pink-600 border border-purple-500/20'
                            : 'bg-white/90 hover:bg-pink-500 border border-gray-300/70'
                        }`}
                      >
                        <Instagram className={`h-5 w-5 transition-colors ${
                          isDarkMode
                            ? 'text-pink-400 hover:text-white'
                            : 'text-pink-500 hover:text-white'
                        }`} />
                      </a>
                    )}
                    {venue?.phone && (
                      <a
                        href={`tel:${venue.phone}`}
                        className={`p-2 rounded-full transition-colors duration-200 ${
                          isDarkMode
                            ? 'bg-purple-900/40 hover:bg-green-600 border border-purple-500/20'
                            : 'bg-white/90 hover:bg-green-500 border border-gray-300/70'
                        }`}
                      >
                        <Phone className={`h-5 w-5 transition-colors ${
                          isDarkMode
                            ? 'text-green-400 hover:text-white'
                            : 'text-green-500 hover:text-white'
                        }`} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className={`h-8 w-8 transition-colors ${
                  isDarkMode
                    ? 'bg-purple-900/40 hover:bg-purple-800/50 text-purple-300 hover:text-white border border-purple-500/20'
                    : 'bg-white/90 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-300/70'
                }`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 max-h-[calc(100vh-8rem)] scrollbar-thin">
            {/* Current Stories Section */}
            {hasLiveStories && (
              <div className={`py-4 border-b ${
                isDarkMode ? 'border-purple-500/20' : 'border-gray-300/70'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Instagram className="h-5 w-5 text-purple-400" />
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Current Stories</h3>
                  <Badge variant="outline" className={`text-xs ${
                    isDarkMode ? 'border-purple-500/20' : 'border-gray-300'
                  }`}>
                    {currentStories.length}
                  </Badge>
                </div>

                {timeRemaining && (
                  <div className={`flex items-center gap-2 mb-3 text-xs ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>⏱️ {timeRemaining}</span>
                  </div>
                )}

                {currentStories.map((story) => (
                  <div
                    key={story.story_id}
                    className={`rounded-lg p-4 mb-3 border ${
                      isDarkMode
                        ? 'bg-[#12122a]/90 border-purple-500/20'
                        : 'bg-white/90 border-gray-300/70'
                    }`}
                  >
                    {/* Story Placeholder */}
                    <a 
                      href={`https://instagram.com/${story.username}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`block w-full h-32 rounded-md mb-3 flex items-center justify-center cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-pink-500/50 ${
                        isDarkMode
                          ? 'bg-purple-900/30 hover:bg-purple-800/40'
                          : 'bg-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-center transition-colors ${
                        isDarkMode 
                          ? 'text-purple-300/70 hover:text-pink-400' 
                          : 'text-gray-500 hover:text-pink-500'
                      }`}>
                        <Instagram className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs font-medium">📸 Instagram Story</p>
                        <p className={`text-xs font-semibold ${
                          isDarkMode ? 'text-pink-400' : 'text-pink-500'
                        }`}>👆 Click here to check out Instagram</p>
                      </div>
                    </a>

                    {/* Story Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className={`h-4 w-4 ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`} />
                        <span className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>@{story.username}</span>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>
                          {new Date(story.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>

                      <p className={`text-sm ${
                        isDarkMode ? 'text-white/90' : 'text-gray-800'
                      }`}>{story.context}</p>

                      {story.artists && story.artists.length > 0 && (
                        <div className={`text-xs ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>
                          Mentions: {story.artists.map(artist => `@${artist}`).join(' ')}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-pink-500/50 text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 bg-pink-500/10"
                      asChild
                    >
                      <a 
                        href={`https://instagram.com/${story.username}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <Instagram className="h-4 w-4" />
                        <span>👆 Click here to check out Instagram</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Event Information Section */}
            <div className="py-3">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-purple-400" />
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Events Calendar</h3>
              </div>

              {/* Interactive Event Date Tabs */}
              {!eventsLoading && !eventsError && uniqueDates.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {uniqueDates.map((dateKey) => {
                      const date = new Date(dateKey);
                      const eventCount = eventsByDate[dateKey].length;
                      return (
                        <Button
                          key={dateKey}
                          variant={selectedDateKey === dateKey ? "default" : "secondary"}
                          size="sm"
                          onClick={() => setSelectedDateKey(dateKey)}
                          className={`text-xs px-3 py-1.5 h-auto ${
                            selectedDateKey === dateKey
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : isDarkMode
                                ? "bg-purple-500/20 text-purple-200 hover:bg-slate-600"
                                : "bg-white/50 text-gray-700 hover:bg-gray-100 border border-gray-200/50"
                          }`}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                          {eventCount > 1 && (
                            <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-xs">
                              {eventCount}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  <Separator className={isDarkMode ? 'bg-purple-500/20' : 'bg-gray-200'} />
                </div>
              )}

              {eventsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className={`text-sm mt-2 ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Loading events...</p>
                </div>
              )}

              {eventsError && (
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-400">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm">{eventsError}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!eventsLoading && !eventsError && events.length === 0 && (
                <Card className={`${
                  isDarkMode
                    ? 'border-purple-500/20 bg-[#12122a]/90'
                    : 'border-gray-300 bg-white/90'
                }`}>
                  <CardContent className="pt-6">
                    <div className={`text-center ${
                      isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events found for this venue</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected Date Events - Show all events for selected date */}
              {!eventsLoading && !eventsError && uniqueSelectedDateEvents.length > 0 && (
                <div className="space-y-4">
                  {uniqueSelectedDateEvents.map((event) => (
                    <Card key={event.id} className={`backdrop-blur-sm shadow-lg ${
                      isDarkMode
                        ? 'border-purple-500/20 bg-[#12122a]/95'
                        : 'border-gray-300/80 bg-white/95'
                    }`}>
                      <CardHeader className="pb-1.5">
                        <div className="flex flex-col">
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className={`text-base font-semibold flex-1 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {event.event_name?.replace(/^#\s*/, '') || 'Unnamed Event'}
                            </CardTitle>
                            {event.confidence_score && (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-400 bg-green-500/10 px-2 py-0.5 ml-3">
                                <BarChart3 className="h-3 w-3 mr-0.5" />
                                {event.confidence_score}%
                              </Badge>
                            )}
                          </div>
                          <CardDescription className={`${
                            isDarkMode ? 'text-white/90' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center justify-between w-full">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                                <span className="text-sm font-medium">
                                  {new Date(event.event_date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </span>
                              {event.event_time && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-green-400" />
                                  <span className="text-sm font-medium">{event.event_time}</span>
                                </span>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-3">
                        {/* Artists Section - Only show if artists exist */}
                        {event.artist && (
                          <div className="mb-3">
                            <div className="flex items-start gap-2.5">
                              <div className="p-1.5 rounded-lg bg-purple-600/20">
                                <Music className="h-4 w-4 text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <p className={`text-xs font-semibold mb-1.5 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>Artists</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(Array.isArray(event.artist) ? event.artist : event.artist.split(',')).map((artist, idx) => (
                                    <Badge
                                      key={idx}
                                      className="bg-purple-600/20 text-purple-300 text-xs px-2 py-0.5 hover:bg-purple-600/30 border border-purple-500/30"
                                    >
                                      <Music className="w-2.5 h-2.5 mr-1" />
                                      {typeof artist === 'string' ? artist.trim() : artist}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Genre Section */}
                        {event.music_genre && (
                          <div className="mb-3">
                            <div className="flex items-start gap-2.5">
                              <div className="p-1.5 rounded-lg bg-blue-600/20">
                                <TrendingUp className="h-4 w-4 text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <p className={`text-xs font-semibold mb-1.5 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>Genre</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(Array.isArray(event.music_genre) ? event.music_genre : event.music_genre.split(',')).map((genre, idx) => (
                                    <Badge
                                      key={idx}
                                      className="bg-blue-600/20 text-blue-300 text-xs px-2 py-0.5 hover:bg-blue-600/30 border border-blue-500/30"
                                    >
                                      <TrendingUp className="w-2.5 h-2.5 mr-1" />
                                      {typeof genre === 'string' ? genre.trim() : genre}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Event Vibe */}
                        {event.event_vibe && (
                      <div className="mb-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-pink-600/20">
                            <Sparkles className="h-4 w-4 text-pink-400" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-semibold mb-1.5 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Vibe</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(Array.isArray(event.event_vibe) ? event.event_vibe.flatMap(v => v.split('|').map((tag: string) => tag.trim())) : event.event_vibe.split('|').map((tag: string) => tag.trim())).map((vibe, idx) => (
                                <Badge 
                                  key={idx} 
                                  className="bg-pink-600/20 text-pink-300 text-xs px-2 py-0.5 hover:bg-pink-600/30 border border-pink-500/30"
                                >
                                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                                  {vibe}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator className={`my-3 ${
                      isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                    }`} />

                    {/* Pricing & Offers */}
                    <div className="space-y-3">
                          {event.ticket_price && (
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-green-600/20">
                            <span className="text-base font-bold text-green-400">AED</span>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-1.5 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Pricing</p>
                            <p className={`text-base font-medium ${
                              isDarkMode ? 'text-green-300' : 'text-green-700'
                            }`}>{event.ticket_price}</p>
                          </div>
                        </div>
                      )}
                      
                          {event.special_offers && event.special_offers !== 'No special offers mentioned' && (
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-yellow-600/20">
                            <Gift className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-1.5 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Special Offers</p>
                            <p className={`text-base leading-relaxed ${
                              isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                            }`}>{event.special_offers}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact & Social */}
                        {(event.website_social || event.instagram_id) && (
                      <>
                        <Separator className={isDarkMode ? 'bg-purple-500/20' : 'bg-gray-300'} />
                        <div className="space-y-1">
                            {event.website_social && (
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-5 w-5 text-blue-400" />
                              <div>
                                <p className={`text-sm ${
                                  isDarkMode ? 'text-purple-300/70' : 'text-gray-600'
                                }`}>Contact</p>
                                <p className={`text-base ${
                                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                }`}>{event.website_social}</p>
                              </div>
                            </div>
                          )}
                          
                        </div>
                      </>
                    )}

                    {/* Analysis Notes */}
                        {event.analysis_notes && (
                      <>
                        <Separator className={isDarkMode ? 'bg-purple-500/20' : 'bg-gray-300'} />
                        <div className="flex items-start gap-2">
                          <Target className="h-5 w-5 text-orange-400 mt-0.5" />
                          <div>
                            <p className={`text-sm mb-1 ${
                              isDarkMode ? 'text-purple-300/70' : 'text-gray-600'
                            }`}>Analysis Notes</p>
                            <p className={`text-xs leading-relaxed ${
                              isDarkMode ? 'text-purple-200 opacity-75' : 'text-gray-600'
                            }`}>
                              {event.analysis_notes.length > 150
                                ? `${event.analysis_notes.substring(0, 150)}...`
                                : event.analysis_notes
                              }
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Venue Contact Details */}
              {venue && (venue.address || venue.phone || venue.website) && (
                <div className={`pt-6 border-t ${
                  isDarkMode ? 'border-purple-500/20' : 'border-gray-300'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                    <h4 className={`font-semibold text-lg ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Contact</h4>
                  </div>
                  <div className="space-y-3">
                    {venue.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-600/20">
                          <Phone className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-purple-200' : 'text-gray-700'
                        }`}>{venue.phone}</span>
                      </div>
                    )}
                    {venue.address && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-600/20">
                          <MapPin className="h-4 w-4 text-green-400" />
                        </div>
                        <span className={`text-sm leading-relaxed ${
                          isDarkMode ? 'text-purple-200' : 'text-gray-700'
                        }`}>{venue.address}</span>
                      </div>
                    )}
                    {venue.website && (
                      <Button
                        variant="outline"
                        className="w-full mt-3 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 bg-blue-500/10"
                        asChild
                      >
                        <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Visit Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VenueDetailsSidebar;