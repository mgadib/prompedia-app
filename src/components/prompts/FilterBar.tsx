import React from 'react';
import { TagChip } from '@/components/ui/tag-chip';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

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

export const FilterBar: React.FC<FilterBarProps> = ({ tags, currentFilter, onFilterChange }) => {
    const { t } = useTranslation();

    return (
        <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-16 bg-card border border-border rounded-sm p-3">
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
