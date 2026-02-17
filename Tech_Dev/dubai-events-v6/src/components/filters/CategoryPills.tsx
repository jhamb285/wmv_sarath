'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Gift, Music, Building2, Users,
  Utensils, Laugh, Moon
} from 'lucide-react';
import { HierarchicalFilterState, EventCategoryFilterState, Venue } from '@/types';
import {
  PRIMARY_CATEGORY_MAP,
  SECONDARY_CATEGORIES_MAP,
  getCategoryColor,
  getHexColor,
  getDisplayName
} from '@/lib/category-mappings';

interface CategoryPillsProps {
  filters: HierarchicalFilterState;
  onFiltersChange: (filters: HierarchicalFilterState) => void;
  venues: Venue[];
  inlineMode?: boolean;
}

// Quick filter definitions mapped to existing data
const QUICK_FILTERS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'free', label: 'Free', icon: Gift },
  { id: 'live-music', label: 'Live Music', icon: Music },
  { id: 'rooftop', label: 'Rooftop', icon: Building2 },
  { id: 'family', label: 'Family', icon: Users },
];

// Icon mapping for primary categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Music Events': Music,
  'Food & Dining': Utensils,
  'Comedy & Entertainment': Laugh,
  'Nightlife': Moon,
};

const CategoryPills: React.FC<CategoryPillsProps> = ({
  filters,
  onFiltersChange,
  venues,
  inlineMode = false
}) => {
  const eventCategories: EventCategoryFilterState = filters.eventCategories || {
    selectedPrimaries: [],
    selectedSecondaries: {},
    expandedPrimaries: []
  };

  // Track active quick filters
  const activeQuickFilters = (filters as any)._quickFilters || [];

  const getCategoryCount = (primaryCategory: string): number => {
    return venues.filter(venue => {
      const categories = venue.event_categories || [];
      return categories.some(cat => cat.primary === primaryCategory);
    }).length;
  };

  // Handle quick filter toggle
  const handleQuickFilterClick = (filterId: string) => {
    const isActive = activeQuickFilters.includes(filterId);
    const newQuickFilters = isActive
      ? activeQuickFilters.filter((f: string) => f !== filterId)
      : [...activeQuickFilters, filterId];

    // Build filter changes based on quick filter type
    let updatedFilters = { ...filters, _quickFilters: newQuickFilters } as any;

    // These quick filters are visual indicators; the actual filtering
    // happens through the existing filter state fields
    if (filterId === 'trending') {
      updatedFilters.selectedRatings = isActive ? [] : [4];
    } else if (filterId === 'free') {
      updatedFilters.selectedTicketPrices = isActive ? [] : ['Free'];
    } else if (filterId === 'live-music') {
      if (!isActive) {
        updatedFilters.eventCategories = {
          ...eventCategories,
          selectedPrimaries: [...new Set([...eventCategories.selectedPrimaries, 'Music Events'])],
        };
      } else {
        updatedFilters.eventCategories = {
          ...eventCategories,
          selectedPrimaries: eventCategories.selectedPrimaries.filter(p => p !== 'Music Events'),
          expandedPrimaries: eventCategories.expandedPrimaries.filter(p => p !== 'Music Events'),
        };
      }
    } else if (filterId === 'rooftop') {
      updatedFilters.attributes = {
        ...(filters.attributes || { venue: [], energy: [], timing: [], status: [] }),
        venue: isActive ? [] : ['Rooftop'],
      };
    }

    onFiltersChange(updatedFilters);
  };

  const handlePrimaryClick = (category: string) => {
    const currentPrimaries = eventCategories.selectedPrimaries;
    const currentExpanded = eventCategories.expandedPrimaries;

    if (currentPrimaries.includes(category)) {
      onFiltersChange({
        ...filters,
        eventCategories: {
          ...eventCategories,
          selectedPrimaries: currentPrimaries.filter(c => c !== category),
          expandedPrimaries: currentExpanded.filter(c => c !== category),
          selectedSecondaries: Object.fromEntries(
            Object.entries(eventCategories.selectedSecondaries).filter(([key]) => key !== category)
          )
        }
      });
    } else {
      onFiltersChange({
        ...filters,
        eventCategories: {
          ...eventCategories,
          selectedPrimaries: [...currentPrimaries, category],
          expandedPrimaries: [...currentExpanded, category]
        }
      });
    }
  };

  const handleSecondaryClick = (primary: string, secondary: string) => {
    const currentSecondaries = eventCategories.selectedSecondaries[primary] || [];
    const isCurrentlySelected = currentSecondaries.includes(secondary);
    const newSecondaries = isCurrentlySelected
      ? currentSecondaries.filter(s => s !== secondary)
      : [...currentSecondaries, secondary];

    if (newSecondaries.length === 0 && isCurrentlySelected) {
      onFiltersChange({
        ...filters,
        eventCategories: {
          ...eventCategories,
          selectedSecondaries: Object.fromEntries(
            Object.entries(eventCategories.selectedSecondaries).filter(([key]) => key !== primary)
          )
        }
      });
      return;
    }

    const primaryIsSelected = eventCategories.selectedPrimaries.includes(primary);
    const primaryIsExpanded = eventCategories.expandedPrimaries.includes(primary);

    onFiltersChange({
      ...filters,
      eventCategories: {
        selectedPrimaries: primaryIsSelected
          ? eventCategories.selectedPrimaries
          : [...eventCategories.selectedPrimaries, primary],
        expandedPrimaries: primaryIsExpanded
          ? eventCategories.expandedPrimaries
          : [...eventCategories.expandedPrimaries, primary],
        selectedSecondaries: {
          ...eventCategories.selectedSecondaries,
          [primary]: newSecondaries
        }
      }
    });
  };

  const getExpandedSecondaries = () => {
    const secondaries: Array<{ primary: string, secondary: string }> = [];
    eventCategories.expandedPrimaries.forEach(primary => {
      const subcategories = SECONDARY_CATEGORIES_MAP[primary] || [];
      subcategories.forEach(secondary => {
        secondaries.push({ primary, secondary });
      });
    });
    return secondaries;
  };

  const expandedSecondaries = getExpandedSecondaries();

  const pillsContent = (
    <div className="flex flex-col gap-2">
      {/* Quick Filters Row */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {QUICK_FILTERS.map(({ id, label, icon: Icon }) => {
          const isActive = activeQuickFilters.includes(id);
          return (
            <button
              key={id}
              onClick={() => handleQuickFilterClick(id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-400/30 shadow-[0_2px_8px_rgba(124,58,237,0.2)]'
                  : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-gray-300 hover:border-white/[0.10]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Primary Category Row with Icons */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {Object.keys(PRIMARY_CATEGORY_MAP).map(category => {
          const isSelected = eventCategories.selectedPrimaries.includes(category);
          const isExpanded = eventCategories.expandedPrimaries.includes(category);
          const hexColor = getHexColor(getCategoryColor(category));
          const displayName = getDisplayName(category);
          const count = getCategoryCount(category);
          const IconComponent = CATEGORY_ICONS[category];

          return (
            <button
              key={`category-${category}`}
              onClick={() => handlePrimaryClick(category)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                isSelected ? 'shadow-md' : 'hover:shadow-sm'
              }`}
              style={{
                color: '#ffffff',
                background: isSelected ? `${hexColor}B3` : `${hexColor}25`,
                border: `1px solid ${isSelected ? hexColor + '60' : hexColor + '20'}`,
              }}
            >
              {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
              {displayName} ({count})
              {isExpanded && ' ↓'}
            </button>
          );
        })}
      </div>

      {/* Secondary Category Row - Animated */}
      <AnimatePresence>
        {expandedSecondaries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 pt-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {expandedSecondaries.map(({ primary, secondary }) => {
                const isSelected = eventCategories.selectedSecondaries[primary]?.includes(secondary) || false;
                const hexColor = getHexColor(getCategoryColor(primary));
                return (
                  <button
                    key={`category-${primary}-${secondary}`}
                    onClick={() => handleSecondaryClick(primary, secondary)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                      isSelected ? 'shadow-lg scale-105' : ''
                    }`}
                    style={{
                      color: '#ffffff',
                      background: isSelected ? `${hexColor}CC` : `${hexColor}30`,
                      border: `1px solid ${isSelected ? hexColor + '60' : hexColor + '20'}`,
                    }}
                  >
                    {secondary}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (inlineMode) {
    return pillsContent;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-[130px] md:h-[150px] bg-gradient-to-b from-black/40 via-black/20 to-transparent pointer-events-none z-39" />
      <div className="fixed top-[110px] md:top-[120px] left-0 right-0 z-30 px-2 md:px-4 pt-1 pb-1">
        {pillsContent}
      </div>
    </>
  );
};

export default CategoryPills;
