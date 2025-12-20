import React, { useState } from 'react';
import { TagChip } from '@/components/ui/tag-chip';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

// Define Interface locally or import from shared types
interface Tag {
    id: string;
    name: string;
    user_id: string | null; // Allow null to match Supabase type if needed
}

interface FilterBarProps {
    tags: Tag[];
    currentFilter: string;
    onFilterChange: (filter: string) => void;
}

// Mobile Filter Button Component
export const MobileFilterButton: React.FC<FilterBarProps> = ({ tags, currentFilter, onFilterChange }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    if (tags.length === 0) return null;

    return (
        <div className="lg:hidden mb-4">
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-sm text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors w-full justify-between"
            >
                <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t('sidebar.title', { count: tags.length })}
                    {currentFilter && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-sm">
                            {currentFilter}
                        </span>
                    )}
                </span>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {/* Collapsible Tags Section */}
            {isOpen && (
                <div className="mt-2 p-3 bg-card border border-border rounded-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <TagChip
                                key={tag.id}
                                variant={currentFilter.toLowerCase() === tag.name.toLowerCase() ? 'active' : 'default'}
                                size="default"
                                onClick={() => {
                                    onFilterChange(tag.name);
                                    setIsOpen(false);
                                }}
                            >
                                {tag.name}
                            </TagChip>
                        ))}
                    </div>
                    {currentFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => {
                                onFilterChange('');
                                setIsOpen(false);
                            }}
                        >
                            <X className="w-3 h-3 mr-1" />
                            {t('sidebar.clear_filter')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

// Desktop Sidebar Component
export const FilterBar: React.FC<FilterBarProps> = ({ tags, currentFilter, onFilterChange }) => {
    const { t } = useTranslation();

    return (
        <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-[4.5rem] bg-card border border-border rounded-sm p-3 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
                <h2 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">
                    {t('sidebar.title', { count: tags.length })}
                </h2>
                {tags.length === 0 ? (
                    <p className="text-body text-muted-foreground">{t('sidebar.no_tags')}</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <TagChip
                                key={tag.id}
                                variant={currentFilter.toLowerCase() === tag.name.toLowerCase() ? 'active' : 'default'}
                                size="default"
                                onClick={() => onFilterChange(tag.name)}
                            >
                                {tag.name}
                            </TagChip>
                        ))}
                    </div>
                )}
                {currentFilter && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => onFilterChange('')}
                    >
                        {t('sidebar.clear_filter')}
                    </Button>
                )}
            </div>
        </aside>
    );
};

