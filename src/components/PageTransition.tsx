import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * Component to add smooth page transitions between routes and scroll-to-top behavior
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('fade-in');

    useEffect(() => {
        if (location.pathname !== displayLocation.pathname) {
            setTransitionStage('fade-out');
            setTimeout(() => {
                // Scroll to top on page change
                window.scrollTo({ top: 0, behavior: 'instant' });
                setDisplayLocation(location);
                setTransitionStage('fade-in');
            }, 150);
        }
    }, [location, displayLocation]);

    return (
        <div className={`page-transition ${transitionStage === 'fade-in' ? 'animate-fade-in' : 'opacity-0'} transition-opacity duration-normal ease-default`}>
            {children}
        </div>
    );
};
