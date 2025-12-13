import { useEffect, useState, useRef } from "react";

interface LoadingBarProps {
    isLoading: boolean;
}

export function LoadingBar({ isLoading }: LoadingBarProps) {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const isLoadingRef = useRef(isLoading);

    // Update ref when isLoading changes
    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        if (isLoadingRef.current) {
            // Use setTimeout to avoid synchronous setState
            const showTimer = setTimeout(() => {
                setIsVisible(true);
                setProgress(0);
            }, 0);
            // Fast start
            const t1 = setTimeout(() => setProgress(30), 100);
            // Slow crunch
            const t2 = setTimeout(() => setProgress(70), 500);
            const t3 = setTimeout(() => setProgress(90), 1500);

            return () => {
                clearTimeout(showTimer);
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        } else {
            // Complete - use setTimeout to avoid synchronous setState
            const completeTimer = setTimeout(() => {
                setProgress(100);
            }, 0);
            const t = setTimeout(() => {
                setIsVisible(false);
                setProgress(0);
            }, 400); // Wait for fade out
            return () => {
                clearTimeout(completeTimer);
                clearTimeout(t);
            };
        }
    }, [isLoading]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent pointer-events-none">
            <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${progress}%`, opacity: isLoading ? 1 : 0 }}
            />
        </div>
    );
}
