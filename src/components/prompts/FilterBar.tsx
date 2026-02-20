import React, { useState, memo } from 'react';
import { TagChip } from '@/components/ui/tag-chip';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Filter, X, ChevronDown, Hash } from 'lucide-react';
import { Tag } from '@/types/prompts';
import { cn } from '@/lib/utils';

interface FilterBarProps {
    tags: Tag[];
    currentFilter: string;
    onFilterChange: (filter: string) => void;
}

// Mobile Filter Button Component
const MobileFilterButtonComponent: React.FC<FilterBarProps> = ({ tags, currentFilter, onFilterChange }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    if (tags.length === 0) return null;

    return (
        <div className="lg:hidden mb-6">
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-3 bg-card border rounded-xl text-sm font-bold text-foreground transition-all duration-300 w-full justify-between shadow-xs",
                    isOpen ? "border-primary/30 ring-4 ring-primary/5" : "border-border"
                )}
                aria-label={t('sidebar.title', { count: tags.length })}
                aria-expanded={isOpen}
            >
                <span className="flex items-center gap-2">
                    <Filter className={cn("w-4 h-4 transition-colors", currentFilter ? "text-primary" : "text-muted-foreground")} />
                    {t('sidebar.title', { count: tags.length })}
                    {currentFilter && (
                        <span className="px-2.5 py-0.5 bg-primary text-white text-[10px] font-black uppercase rounded-full">
                            {currentFilter}
                        </span>
                    )}
                </span>
                <div className={cn("p-1 rounded-full bg-muted transition-transform duration-300", isOpen && "rotate-180")}>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
            </button>

            {/* Collapsible Tags Section */}
            {isOpen && (
                <div className="mt-3 p-5 bg-card border border-border rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-wrap gap-2.5">
                        {tags.map(tag => (
                            <TagChip
                                key={tag.id}
                                variant={currentFilter.toLowerCase() === tag.name.toLowerCase() ? 'active' : 'outline'}
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
                            className="mt-5 w-full rounded-full bg-muted/50 hover:bg-muted font-bold text-xs h-10"
                            onClick={() => {
                                onFilterChange('');
                                setIsOpen(false);
                            }}
                        >
                            <X className="w-3 h-3 mr-2" />
                            {t('sidebar.clear_filter')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export const MobileFilterButton = memo(MobileFilterButtonComponent);

// Desktop Sidebar Component
const FilterBarComponent: React.FC<FilterBarProps> = ({ tags, currentFilter, onFilterChange }) => {
    const { t } = useTranslation();

    return (
        <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-[5.5rem] bg-card border border-border rounded-3xl shadow-sm p-6 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
                    <Hash className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                        {t('sidebar.title', { count: tags.length })}
                    </h2>
                </div>

                {tags.length === 0 ? (
                    <div className="py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
                        <p className="text-xs font-medium text-muted-foreground px-4">{t('sidebar.no_tags')}</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <TagChip
                                key={tag.id}
                                variant={currentFilter.toLowerCase() === tag.name.toLowerCase() ? 'active' : 'outline'}
                                size="default"
                                className="px-3"
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
                        className="mt-8 w-full rounded-full border border-border/50 hover:bg-muted font-black text-[10px] uppercase tracking-widest h-9"
                        onClick={() => onFilterChange('')}
                    >
                        <X className="w-3 h-3 mr-2" />
                        {t('sidebar.clear_filter')}
                    </Button>
                )}
            </div>
        </aside>
    );
};

export const FilterBar = memo(FilterBarComponent);
