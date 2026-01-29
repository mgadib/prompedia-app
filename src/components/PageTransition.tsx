import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * Component to add smooth page transitions between routes
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState<'entering' | 'entered'>('entered');

    useEffect(() => {
        if (location !== displayLocation) {
            setTransitionStage('entering');
            const timer = setTimeout(() => {
                setDisplayLocation(location);
                setTransitionStage('entered');
            }, 150); // Match CSS transition duration
            return () => clearTimeout(timer);
        }
    }, [location, displayLocation]);

    return (
        <div
            className={`page-transition ${
                transitionStage === 'entering' ? 'page-transition-entering' : 'page-transition-entered'
            }`}
        >
            {children}
        </div>
    );
};
