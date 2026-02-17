'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Search, Calendar, ChevronDown, List, Map as MapIcon, Menu } from 'lucide-react';
import { Venue } from '@/types';
import { parseDateFromFormat } from '@/lib/filters/date-utils';

interface DateSelectorProps {
  venues: Venue[];
  selectedDates: string[];
  onDateChange: (dates: string[]) => void;
  className?: string;
}

interface TopNavProps {
  navButtons?: React.ReactNode;
  onSearchClick?: () => void;
  showDatePicker?: boolean;
  datePickerProps?: DateSelectorProps;
  showCategoryPills?: boolean;
  categoryPillsContent?: React.ReactNode;
  embedded?: boolean; // When true, renders as static (for desktop split-view)
  hideProfile?: boolean; // When true, hides user avatar/signout in mobile overlay
  onListToggle?: () => void; // Toggle between map and list views
  isListView?: boolean; // Current view mode
}

const TopNav: React.FC<TopNavProps> = ({
  navButtons,
  onSearchClick,
  showDatePicker,
  datePickerProps,
  showCategoryPills,
  categoryPillsContent,
  embedded = false,
  hideProfile = false,
  onListToggle,
  isListView = false,
}) => {
  const { user, signOut } = useAuth();

  const [filterOptions, setFilterOptions] = useState<{ dates?: string[] } | null>(null);

  useEffect(() => {
    if (!showDatePicker) return;
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/filter-options');
        if (!response.ok) throw new Error('Failed to fetch filter options');
        const result = await response.json();
        setFilterOptions(result.data || result);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        setFilterOptions({ dates: [] });
      }
    };
    fetchFilterOptions();
  }, [showDatePicker]);

  const dateOptions = useMemo(() => {
    if (!datePickerProps) return [];
    const allDates = filterOptions?.dates || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const dateMap = new Map<string, Date>();
    allDates.forEach((dateStr: string) => {
      try {
        const date = parseDateFromFormat(dateStr);
        if (date.getTime() >= threeDaysAgo.getTime()) {
          const dateKey = date.toDateString();
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, date);
          }
        }
      } catch { /* skip */ }
    });

    const sortedDates = Array.from(dateMap.entries())
      .sort(([, a], [, b]) => a.getTime() - b.getTime());

    return sortedDates.map(([dateKey, date]) => ({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateKey,
      isToday: date.toDateString() === today.toDateString(),
      isSaturday: date.getDay() === 6,
      isSunday: date.getDay() === 0,
    }));
  }, [filterOptions, datePickerProps]);

  const handleDateClick = (dateKey: string) => {
    if (!datePickerProps) return;
    if (dateKey === 'all') {
      datePickerProps.onDateChange([]);
    } else {
      const isSelected = datePickerProps.selectedDates.includes(dateKey);
      if (isSelected) {
        datePickerProps.onDateChange(datePickerProps.selectedDates.filter(d => d !== dateKey));
      } else {
        datePickerProps.onDateChange([dateKey]);
      }
    }
  };

  const isDateSelected = (dateKey: string) => {
    if (!datePickerProps) return false;
    if (dateKey === 'all') return datePickerProps.selectedDates.length === 0;
    return datePickerProps.selectedDates.includes(dateKey);
  };

  // Get current selected date label for the desktop pill
  const selectedDateLabel = useMemo(() => {
    if (!datePickerProps || datePickerProps.selectedDates.length === 0) return 'All Dates';
    const todayStr = new Date().toDateString();
    if (datePickerProps.selectedDates.includes(todayStr)) {
      const today = new Date();
      return `Today — ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    const first = datePickerProps.selectedDates[0];
    try {
      const d = new Date(first);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Selected';
    }
  }, [datePickerProps]);

  // --- DESKTOP EMBEDDED LAYOUT ---
  if (embedded) {
    return (
      <div
        className="border-b"
        style={{
          background: 'rgba(10, 10, 26, 0.97)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
        }}
      >
        {/* === ROW 1: Logo + Date Pills + Search + Hamburger === */}
        <div className="flex items-center gap-3 px-5 py-3">
          {/* WMV Logo */}
          <img
            src="/logo_clean.svg"
            alt="Where's My Vibe"
            className="flex-shrink-0"
            style={{
              filter: 'invert(1) brightness(2)',
              width: '40px',
              height: '40px',
              objectFit: 'contain',
            }}
          />

          {/* Scrollable Date Pills */}
          {showDatePicker && datePickerProps && (
            <div
              className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All Dates pill */}
              <button
                onClick={() => handleDateClick('all')}
                className={`text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  isDateSelected('all')
                    ? 'bg-purple-600/30 text-purple-300 shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                All Dates
              </button>

              {/* Individual date pills */}
              {dateOptions.map((dateOption, index) => {
                const isSelected = isDateSelected(dateOption.dateKey);
                const isToday = dateOption.isToday;
                const isWeekend = dateOption.isSaturday || dateOption.isSunday;

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(dateOption.dateKey)}
                    className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 relative ${
                      isSelected
                        ? 'bg-purple-600/30 shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      ...(isToday && !isSelected ? { border: '1px solid rgba(124,58,237,0.4)' } : {}),
                      ...(isSelected ? { border: '1px solid rgba(124,58,237,0.5)' } : {}),
                    }}
                  >
                    {isToday && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white tracking-wider">
                        TODAY
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isSelected ? 'text-purple-300'
                        : isWeekend ? 'text-red-400'
                        : 'text-gray-500'
                    }`}>
                      {dateOption.day}
                    </span>
                    <span className={`text-[13px] font-bold ${
                      isSelected ? 'text-white'
                        : isToday ? 'text-purple-400'
                        : 'text-gray-400'
                    }`}>
                      {dateOption.date}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Bar */}
          <div className="w-64 flex-shrink-0">
            <div className="relative cursor-pointer group" onClick={onSearchClick}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-colors group-hover:text-purple-400" />
              <input
                type="text"
                placeholder="Search for your Vibe?"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 cursor-pointer focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
                readOnly
                onClick={onSearchClick}
              />
            </div>
          </div>

          {/* List/Map Toggle */}
          {onListToggle && (
            <button
              onClick={onListToggle}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200"
              style={{
                background: isListView ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isListView ? 'rgba(124, 58, 237, 0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}
              aria-label={isListView ? 'Show map' : 'Show list'}
            >
              {isListView ? (
                <MapIcon className="w-5 h-5 text-purple-300" />
              ) : (
                <List className="w-5 h-5 text-gray-300" />
              )}
            </button>
          )}
        </div>

        {/* === ROW 2: Category Pills === */}
        {showCategoryPills && categoryPillsContent && (
          <div className="px-5 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {categoryPillsContent}
          </div>
        )}
      </div>
    );
  }

  // --- MOBILE OVERLAY LAYOUT (original) ---
  return (
    <div className="fixed top-1.5 md:top-2 left-1.5 md:left-2 right-1.5 md:right-2 z-50">
      <div
        className={`px-3 md:px-4 rounded-2xl relative ${
          showDatePicker ? 'py-2.5 md:py-3' : 'py-2.5 md:py-3.5'
        }`}
        style={{
          background: 'rgba(10, 10, 26, 0.98)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
        }}
      >
        <div className="flex flex-col gap-2">
          {/* ROW 1: Logo, Search, Buttons */}
          <div className="flex items-center justify-between">
            <img
              src="/logo_clean.svg"
              alt="Where's My Vibe"
              className="flex-shrink-0"
              style={{
                filter: 'invert(1) brightness(2)',
                width: '36px',
                height: '36px',
                objectFit: 'contain',
              }}
            />

            <div className="flex-1 max-w-md mx-2 md:mx-4">
              <div className="relative cursor-pointer group" onClick={onSearchClick}>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 stroke-[2.5] pointer-events-none transition-colors group-hover:text-purple-400" />
                <input
                  type="text"
                  placeholder="Search for your Vibe?"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                  readOnly
                  onClick={onSearchClick}
                />
              </div>
            </div>

            {hideProfile ? (
              <button
                onClick={onListToggle}
                className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 active:scale-90"
                style={{
                  background: isListView
                    ? 'rgba(124, 58, 237, 0.3)'
                    : 'rgba(124, 58, 237, 0.15)',
                  border: `1px solid ${isListView ? 'rgba(124, 58, 237, 0.5)' : 'rgba(124, 58, 237, 0.25)'}`,
                }}
                aria-label={isListView ? 'Show map' : 'Show event list'}
              >
                {isListView ? (
                  <MapIcon className="w-4 h-4 text-purple-300" />
                ) : (
                  <List className="w-4 h-4 text-purple-400" />
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 md:gap-2">
                {navButtons}
                {user && (
                  <button
                    onClick={signOut}
                    className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/15 transition-all duration-200"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ROW 2: Date Picker */}
          {showDatePicker && datePickerProps && (
            <div className="flex items-center gap-3 overflow-x-auto pt-3 pb-1 -mx-1 px-1 scrollbar-hide"
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => handleDateClick('all')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  isDateSelected('all')
                    ? 'bg-purple-600/30 text-purple-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                All Dates
              </button>
              {dateOptions.map((dateOption, index) => {
                const isSelected = isDateSelected(dateOption.dateKey);
                const isToday = dateOption.isToday;
                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(dateOption.dateKey)}
                    className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 relative ${
                      isSelected
                        ? 'bg-purple-600/30 shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                        : 'hover:bg-white/5'
                    }`}
                    style={isToday && !isSelected ? { border: '1px solid rgba(124,58,237,0.4)' } : {}}
                  >
                    {isToday && (
                      <span className="absolute -top-2 -right-2 text-[7px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">
                        TODAY
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isSelected ? 'text-purple-300' : 'text-gray-500'
                    }`}>
                      {dateOption.day}
                    </span>
                    <span className={`text-[13px] font-bold ${
                      isSelected ? 'text-white' : isToday ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      {dateOption.date}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ROW 3: Category Pills (only when explicitly provided) */}
          {showCategoryPills && categoryPillsContent && (
            <div className="-mx-1 px-1">
              {categoryPillsContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
