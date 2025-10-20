// Simple persistent state tracking - no bidirectional (no snapping)
document.addEventListener('DOMContentLoaded', () => {
    const highlightElements = document.querySelectorAll('.animate-highlight');
    
    if (highlightElements.length === 0) return;
    
    // SPEED CONTROL
    const ANIMATION_SPEED = 0.3;
    
    // Track the state of each element persistently
    const elementStates = new Map();
    
    // Track if we're currently navigating
    let isNavigating = false;
    let navigationTimeout = null;
    
    // Initialize all elements
    highlightElements.forEach((element, index) => {
        elementStates.set(index, { progress: 0, isCompleted: false });
    });
    
    // Listen for navigation clicks
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', () => {
            // Pause highlight updates during navigation
            isNavigating = true;
            
            // Clear any existing timeout
            if (navigationTimeout) {
                clearTimeout(navigationTimeout);
            }
            
            // Resume after scroll completes (adjust timing if needed)
            navigationTimeout = setTimeout(() => {
                isNavigating = false;
                updateHighlights();
            }, 1000);
        });
    });
    
    // Find elements in viewport
    function getElementsInViewport() {
        const windowHeight = window.innerHeight;
        const elementsInView = [];
        
        highlightElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            
            if (rect.top < windowHeight && rect.bottom > 0) {
                elementsInView.push({
                    element,
                    index,
                    rect
                });
            }
        });
        
        return elementsInView.sort((a, b) => a.rect.top - b.rect.top);
    }
    
    // Calculate what should be animating right now
    function updateElementStates() {
        const elementsInView = getElementsInViewport();
        
        if (elementsInView.length === 0) {
            // Clear all highlights when nothing in view
            elementStates.forEach((state, index) => {
                state.progress = 0;
                state.isCompleted = false;
            });
            return;
        }
        
        // Find the first uncompleted element in viewport
        let activeElementIndex = -1;
        for (let viewportData of elementsInView) {
            const state = elementStates.get(viewportData.index);
            if (!state.isCompleted) {
                activeElementIndex = viewportData.index;
                break;
            }
        }
        
        if (activeElementIndex === -1) return; // All visible elements are completed
        
        // Calculate progress for the active element
        const activeElementData = elementsInView.find(el => el.index === activeElementIndex);
        const rect = activeElementData.rect;
        const windowHeight = window.innerHeight;
        
        // Different start trigger for first element vs subsequent elements
        let startTrigger;
        if (activeElementIndex === 0) {
            // First element starts later (more time to animate)
            startTrigger = windowHeight * 1.3;
        } else {
            // Subsequent elements start earlier (already in viewport when previous finishes)
            startTrigger = windowHeight * 1.1;
        }
        
        const animationDistance = windowHeight * ANIMATION_SPEED;
        const endTrigger = startTrigger - animationDistance;
        
        const elementTop = rect.top;
        let progress = 0;
        
        if (elementTop >= startTrigger) {
            progress = 0;
        } else if (elementTop <= endTrigger) {
            progress = 1;
        } else {
            const totalDistance = startTrigger - endTrigger;
            const currentDistance = startTrigger - elementTop;
            progress = currentDistance / totalDistance;
        }
        
        // Update the active element's state
        const activeState = elementStates.get(activeElementIndex);
        activeState.progress = progress;
        
        if (progress >= 1) {
            activeState.isCompleted = true;
        }
    }
    
    // Apply visual updates
    function updateVisuals() {
        highlightElements.forEach((element, index) => {
            const state = elementStates.get(index);
            
            // Clear background
            element.style.background = '';
            
            if (state.progress > 0) {
                const fillPercentage = state.progress * 100;
                element.style.background = `linear-gradient(to right,
                    rgba(212, 212, 240, 1) 0%,
                    rgba(212, 212, 240, 1) ${fillPercentage}%,
                    transparent ${fillPercentage}%,
                    transparent 100%)`;
                element.style.color = '#3B398A';
            }
        });
    }
    
    // Main update function
    function updateHighlights() {
        // Skip updates during navigation
        if (isNavigating) return;
        
        updateElementStates();
        updateVisuals();
    }
    
    // Scroll handler
    let ticking = false;
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHighlights();
                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    updateHighlights();
});