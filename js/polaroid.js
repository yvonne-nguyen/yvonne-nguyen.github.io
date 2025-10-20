
    // ========================================
    // GET THE DECK ELEMENT
    // ========================================
console.log('polaroid.js is loading...');
    const deck = document.getElementById('deck');
console.log('Deck element:', deck);

if (!deck) {
  console.error('Deck element not found! Make sure the script loads after the HTML.');
} else {
  console.log('Deck found! Ready to go.');
}

    // ========================================
    // SIMPLE RESPONSIVE CONFIG
    // Mobile-first: fast animations on mobile, slower on desktop
    // ========================================
    
    // Check if we're on mobile or desktop
const isMobile = window.innerWidth < 1024;
    
    const CONFIG = { 
      // Faster on mobile, slower on desktop
      straightenMs: isMobile ? 250 : 320,    // Pick-up animation
      snapMs: isMobile ? 400 : 500,          // Snap back animation
      swipeMs: isMobile ? 600 : 700,         // Swipe away animation
      thresholdRatio: isMobile ? 0.2 : 0.25  // Easier to swipe on mobile
    };

    // ========================================
    // SWIPE ANIMATION PHASES
    // ========================================
    
    function getPhaseTimings() {
      // Phase A: Initial swipe (25% of total)
      const phaseA = Math.max(120, Math.round(CONFIG.swipeMs * 0.25));
      
      // Phase B: Move to bottom (50% of total)
      const phaseB = Math.max(240, Math.round(CONFIG.swipeMs * 0.5));
      
      // Phase C: Settle in place (remaining time)
      const phaseC = Math.max(140, CONFIG.swipeMs - phaseA - phaseB);
      
      return { phaseA, phaseB, phaseC };
    }

    // ========================================
    // DRAG STATE TRACKING
    // ========================================
    
    const state = { 
      active: null,      // Current card being dragged
      startX: 0,         // Starting X position
      startY: 0,         // Starting Y position
      dx: 0,             // Distance dragged horizontally
      dy: 0,             // Distance dragged vertically
      dragging: false    // Is currently dragging?
    };

    // ========================================
    // SET TOP CARD
    // ========================================
    
    function setTop() {
      const cards = [...deck.querySelectorAll('.card')];
      cards.forEach(c => c.classList.remove('top'));
      if(cards.length > 0) {
    const topCard = cards[cards.length - 1];
    topCard.classList.add('top');

    // Update caption if it exists
    const caption = document.getElementById('caption');
    if (caption) {
      const captionText = topCard.getAttribute('data-caption');
      if (captionText) {
        caption.textContent = captionText;
      }
    }
      }
    }

    // ========================================
    // START DRAGGING
    // ========================================
    
    function onPointerDown(e) {
  console.log('Pointer down detected');
      const card = e.target.closest('.card');
  console.log('Card found:', card);
  console.log('Is top card:', card ? card.classList.contains('top') : 'no card');
      if(!card || !card.classList.contains('top')) return;
      
  console.log('Starting drag');
      e.preventDefault();
      
      state.active = card; 
      state.dragging = true; 
      state.justPicked = true;
      state.startX = e.clientX;
      state.startY = e.clientY;
      
      // Capture pointer for smooth dragging
      try { 
        if (e.pointerId !== undefined && card.setPointerCapture) {
          card.setPointerCapture(e.pointerId);
        }
      } catch(_) {}
      
      // Straighten card when picked up
      card.style.transition = `transform ${CONFIG.straightenMs}ms ease`;
      card.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    }

    // ========================================
    // DRAGGING MOVEMENT
    // ========================================
    
    function onPointerMove(e) {
      if(!state.dragging || !state.active) return;
      
      // Remove transition for smooth dragging
      if (state.justPicked) { 
        state.active.style.transition = 'none'; 
        state.justPicked = false; 
      }
      
      // Calculate drag distance
      state.dx = e.clientX - state.startX;
      state.dy = e.clientY - state.startY;
      
      // Move card with rotation
      // Less rotation on mobile (15) vs desktop (10)
      const rotationDivisor = isMobile ? 15 : 10;
      state.active.style.transform = 
        `translate(calc(-50% + ${state.dx}px), calc(-50% + ${state.dy}px)) rotate(${state.dx/rotationDivisor}deg)`;
    }

    // ========================================
    // STOP DRAGGING
    // ========================================
    
    function onPointerUp() {
      if(!state.dragging || !state.active) return;
      
      const card = state.active;
      const dx = state.dx; 
      const dy = state.dy;
      
      // Check if dragged far enough to swipe
      const threshold = deck.clientWidth * CONFIG.thresholdRatio;
      
      if(Math.abs(dx) > threshold) {
        // Swipe away
        const dir = Math.sign(dx) || 1;
        moveToBottom(card, dir, dx, dy);
      } else {
        // Snap back
        snapBack(card, dx, dy);
      }
      
      // Reset state
      state.dragging = false; 
      state.active = null; 
      state.dx = 0; 
      state.dy = 0;
    }

    // ========================================
    // SNAP BACK ANIMATION
    // Modified to keep the tilt when snapping back
    // ========================================
    
    function snapBack(card, dx, dy) {
      // Get the card's original rotation angle
      const idleRot = getComputedStyle(card).getPropertyValue('--idle-rot') || '0deg';
      
      // First animate back to center position while still straight
      card.style.transition = `transform ${CONFIG.snapMs * 0.6}ms cubic-bezier(.25,.8,.25,1)`;
      card.style.transform = `translate(-50%, -50%) rotate(0deg)`;
      
      // Then add the tilt back after a slight delay for natural feel
      setTimeout(() => {
        card.style.transition = `transform ${CONFIG.snapMs * 0.4}ms ease`;
        card.style.transform = `translate(-50%, -50%) rotate(${idleRot})`;
        
        setTimeout(() => { 
          card.style.transition = ''; 
        }, CONFIG.snapMs * 0.4);
      }, CONFIG.snapMs * 0.6);
    }

    // ========================================
    // SWIPE TO BOTTOM ANIMATION
    // ========================================
    
    function moveToBottom(card, dir, dx, dy) {
      const cards = [...deck.querySelectorAll('.card')];
      const next = cards[cards.length - 2];

  console.log('Total cards:', cards.length);
  console.log('Current top card:', card.getAttribute('data-caption'));
  console.log('Next top card should be:', next ? next.getAttribute('data-caption') : 'none');
      
      // Update top card
      cards.forEach(c => c.classList.remove('top'));
      if(next) next.classList.add('top');

  // Update caption immediately for the next card
  const caption = document.getElementById('caption');
  console.log('Caption element:', caption);
  console.log('Next card:', next);
  if (caption && next) {
    const captionText = next.getAttribute('data-caption');
    console.log('Caption text:', captionText);
    if (captionText) {
      caption.textContent = captionText;
      console.log('Caption updated to:', captionText);
    }
  }
      
      // Move card to bottom of deck
      deck.insertBefore(card, deck.firstChild);

      const { phaseA, phaseB, phaseC } = getPhaseTimings();
      
      // Scale movements smaller on mobile
      const scale = isMobile ? 0.7 : 1;

      // PHASE A: Continue swipe direction
      card.style.transition = `transform ${phaseA}ms cubic-bezier(.25,.8,.25,1)`;
      card.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${dx/10}deg)`;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.style.transform = 
            `translate(calc(-50% + ${dx + dir*16*scale}px), calc(-50% + ${dy - 6*scale}px)) rotate(${dx/10 + dir*5}deg)`;
        });
      });

      // PHASE B: Move down and shrink
      setTimeout(() => {
        card.style.transition = `transform ${phaseB}ms cubic-bezier(.33,.9,.33,1)`;
        card.style.transform = 
          `translate(calc(-50% + ${dx + dir*6*scale}px), calc(-50% + ${dy + 10*scale}px)) rotate(0deg) scale(0.96)`;
      }, phaseA);

  // PHASE C: Settle into place and update caption
      setTimeout(() => {
        card.style.transition = `transform ${phaseC}ms ease`;
        const idleRot = getComputedStyle(card).getPropertyValue('--idle-rot') || '0deg';
        card.style.transform = `translate(-50%, -50%) rotate(${idleRot})`;
        setTop();
      }, phaseA + phaseB);
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    deck.addEventListener('pointerdown', onPointerDown);
    deck.addEventListener('pointermove', onPointerMove);
    deck.addEventListener('pointerup', onPointerUp);
    deck.addEventListener('pointercancel', onPointerUp);

    // Initialize
    setTop();
