import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (items: number) => void;
    itemsPerPageOptions?: number[];
    showItemsPerPage?: boolean;
    showPageNumbers?: boolean;
    className?: string;
}

/**
 * Pagination component with page numbers, navigation, and items per page selector.
 * Supports ellipsis for large page counts and full keyboard navigation.
 */
export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 25, 50, 100],
    showItemsPerPage = true,
    showPageNumbers = true,
    className,
}) => {
    const { t } = useTranslation();
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    // Ensure totalPages is at least 1 if there are items
    const safeTotalPages = Math.max(1, totalPages);

    // Generate page numbers to display
    const getPageNumbers = (): (number | 'ellipsis')[] => {
        if (safeTotalPages <= 7) {
            // Show all pages if 7 or fewer
            return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
        }

        const pages: (number | 'ellipsis')[] = [];
        
        // Always show first page
        pages.push(1);

        if (currentPage <= 3) {
            // Near the start: 1, 2, 3, 4, ..., last
            pages.push(2, 3, 4);
            pages.push('ellipsis');
            pages.push(safeTotalPages);
        } else if (currentPage >= safeTotalPages - 2) {
            // Near the end: 1, ..., n-3, n-2, n-1, n
            pages.push('ellipsis');
            pages.push(safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1);
            pages.push(safeTotalPages);
        } else {
            // In the middle: 1, ..., current-1, current, current+1, ..., last
            pages.push('ellipsis');
            pages.push(currentPage - 1, currentPage, currentPage + 1);
            pages.push('ellipsis');
            pages.push(safeTotalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    if (safeTotalPages <= 1 && !showItemsPerPage) {
        return null;
    }

    return (
        <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border', className)}>
            {/* Results Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {totalItems === 0 ? (
                    <span>{t('pagination.no_results', 'No results')}</span>
                ) : (
                    <span>
                        {t('pagination.showing', {
                            start: startItem,
                            end: endItem,
                            total: totalItems,
                        }, `Showing ${startItem} - ${endItem} of ${totalItems}`)}
                    </span>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Items Per Page Selector */}
                {showItemsPerPage && onItemsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="items-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
                            {t('pagination.items_per_page', 'Items per page')}:
                        </label>
                        <select
                            id="items-per-page"
                            value={itemsPerPage}
                            onChange={(e) => {
                                const newItemsPerPage = Number(e.target.value);
                                onItemsPerPageChange(newItemsPerPage);
                                // Reset to first page when changing items per page
                                onPageChange(1);
                            }}
                            className="text-sm bg-card border border-border rounded-sm px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 cursor-pointer transition-colors duration-fast hover:border-primary/20"
                            aria-label={t('pagination.items_per_page', 'Items per page')}
                        >
                            {itemsPerPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Page Navigation */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        {/* First Page */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                            aria-label={t('pagination.first_page', 'First page')}
                            title={t('pagination.first_page', 'First page')}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        {/* Previous Page */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                            aria-label={t('pagination.previous_page', 'Previous page')}
                            title={t('pagination.previous_page', 'Previous page')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page Numbers */}
                        {showPageNumbers && (
                            <div className="flex items-center gap-1 mx-1">
                                {pageNumbers.map((page, index) => {
                                    if (page === 'ellipsis') {
                                        return (
                                            <span
                                                key={`ellipsis-${index}`}
                                                className="px-2 py-1 text-sm text-muted-foreground"
                                                aria-hidden="true"
                                            >
                                                ...
                                            </span>
                                        );
                                    }

                                    const isActive = page === currentPage;
                                    return (
                                        <Button
                                            key={page}
                                            variant={isActive ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => onPageChange(page)}
                                            className={cn(
                                                'h-8 min-w-[32px] px-2',
                                                isActive && 'bg-primary text-primary-foreground'
                                            )}
                                            aria-label={t('pagination.go_to_page', { page }, `Go to page ${page}`)}
                                            aria-current={isActive ? 'page' : undefined}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Next Page */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= safeTotalPages}
                            className="h-8 w-8 p-0"
                            aria-label={t('pagination.next_page', 'Next page')}
                            title={t('pagination.next_page', 'Next page')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Last Page */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(safeTotalPages)}
                            disabled={currentPage >= safeTotalPages}
                            className="h-8 w-8 p-0"
                            aria-label={t('pagination.last_page', 'Last page')}
                            title={t('pagination.last_page', 'Last page')}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Page Info (for mobile/simple view) */}
                {safeTotalPages > 1 && (
                    <div className="text-sm text-muted-foreground sm:hidden text-center">
                        {t('pagination.page_info', {
                            current: currentPage,
                            total: safeTotalPages,
                        }, `Page ${currentPage} of ${safeTotalPages}`)}
                    </div>
                )}
            </div>
        </div>
    );
};
