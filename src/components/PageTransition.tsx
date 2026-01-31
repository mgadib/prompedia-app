import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * Component to add smooth page transitions between routes
 */
// Simplified component - no transitions
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    return (
        <div className="page-transition">
            {children}
        </div>
    );
};
