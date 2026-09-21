import React from 'react';
import { FilterState, Priority, Status } from '../types';
import { Search, Filter, ArrowUpDown, X, Tag as TagIcon, Layers } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  categories: string[];
  tags: string[];
  totalFiltered: number;
  totalAll: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  categories,
  tags,
  totalFiltered,
  totalAll,
}) => {
  const isAnyFilterActive =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.tag !== 'all' ||
    filters.deadlineFilter !== 'all';

  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      tag: 'all',
      deadlineFilter: 'all',
    });
  };

  const statusOptions: { value: 'all' | Status; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div id="filter-bar" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-5 shadow-xs space-y-3">
      {/* Row 1: Search bar + Sort controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, subtasks, #tags, or GitHub PR..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sort:</span>
          </div>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="progress">Progress</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <button
            onClick={() => onFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="px-2 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Toggle sort direction"
          >
            {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {/* Row 2: Status tabs & Category / Tag selectors */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/60">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {statusOptions.map((opt) => {
            const active = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFilterChange({ status: opt.value })}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Dropdowns for Priority, Category, and Tag */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority dropdown */}
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value as FilterState['priority'] })}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category dropdown */}
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Project Tag dropdown */}
          {tags.length > 0 && (
            <select
              value={filters.tag}
              onChange={(e) => onFilterChange({ tag: e.target.value })}
              className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Clear filters button */}
          {isAnyFilterActive && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset ({totalFiltered}/{totalAll})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
