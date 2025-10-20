document.addEventListener('DOMContentLoaded', () => {
  const sidenav = document.querySelector('.sidenav');
  const navLinks = document.querySelectorAll('.sidenav a[href^="#"]');
  
  if (!sidenav) return;
  
  // ===== SIDEBAR HIDE/SHOW FUNCTIONALITY =====
  const fullBleedSections = Array.from(document.querySelectorAll('*')).filter(el => {
    return el.classList.contains('full-bleed');
  });
  
  console.log(`Found ${fullBleedSections.length} elements with explicit .full-bleed class`);
  
  let isSidebarHidden = false;
  let isNavigating = false;
  let scrollTimeout;
  
  function updateSidebarVisibility() {
    if (isNavigating) return; // Don't update during navigation
    
    let shouldHide = false;
    
    for (let section of fullBleedSections) {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (!isSidebarHidden) {
        if (rect.top < windowHeight * 0.7 && rect.bottom > windowHeight * 0.3) {
          shouldHide = true;
          break;
        }
      } else {
        if (rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.4) {
          shouldHide = true;
          break;
        }
      }
    }
    
    if (shouldHide !== isSidebarHidden) {
      if (shouldHide) {
        sidenav.style.opacity = '0';
        sidenav.style.pointerEvents = 'none';
      } else {
        sidenav.style.opacity = '1';
        sidenav.style.pointerEvents = 'auto';
      }
      isSidebarHidden = shouldHide;
    }
  }
  
  // ===== NAVIGATION AND SCROLL HIGHLIGHTING =====
  if (navLinks.length === 0) {
    let ticking = false;
    function handleScrollForHiding() {
      if (isNavigating) return; // Don't update during navigation
      if (!ticking) {
        setTimeout(() => {
          updateSidebarVisibility();
          ticking = false;
        }, 100);
        ticking = true;
      }
    }
    
    window.addEventListener('scroll', handleScrollForHiding, { passive: true });
    updateSidebarVisibility();
    return;
  }

  // Get all sections that have corresponding nav links
  const sections = Array.from(navLinks)
    .map(link => {
      const href = link.getAttribute('href');
      const section = document.querySelector(href);
      return section ? { element: section, id: href, link: link } : null;
    })
    .filter(Boolean);
  
  // Get all parent links that have submenus
  const parentLinkElements = Array.from(document.querySelectorAll('.sidenav a + ul'))
    .map(ul => ul.previousElementSibling);
  
  // Track manually opened/closed dropdowns
  const manualStates = new Map();
  
  // ===== CLICK HANDLING =====
  sidenav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || !sidenav.contains(a)) return;

    const href = a.getAttribute('href');
    const submenu = a.nextElementSibling;
    
    // Handle icon clicks for dropdown toggle only
    if (e.target.closest('.material-symbols-outlined')) {
      e.preventDefault();
      const wasOpen = a.classList.contains('is-open');
      a.classList.toggle('is-open');
      manualStates.set(a, !wasOpen);
      return;
    }
    
    // If this is a link with a hash (actual navigation link)
    if (href && href.startsWith('#')) {
      e.preventDefault(); // Always prevent default for hash links
      
      const targetSection = document.querySelector(href);
      if (!targetSection) return;
      
      // Set navigation flag - THIS IS CRITICAL
      isNavigating = true;
      console.log('Navigation started to:', href);
      
      // Notify other scripts (like highlight.js) that navigation is starting
      window.dispatchEvent(new CustomEvent('navigationStart'));
      
      // Clear any existing timeout
      clearTimeout(scrollTimeout);
      
      // Open parent dropdown if needed
      if (submenu && submenu.tagName === 'UL' && !a.classList.contains('is-open')) {
        a.classList.add('is-open');
        manualStates.set(a, true);
      }
      
      // Update active states immediately
      updateActiveLink(a);
      
      // Calculate target position fresh each time
      const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - 24;
      
      console.log('Scrolling to position:', targetPosition);
      
      // Perform the scroll
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      // Use a longer timeout and only clear flag after scroll completes
      scrollTimeout = setTimeout(() => {
        isNavigating = false;
        console.log('Navigation complete');
        // Notify other scripts that navigation is complete
        window.dispatchEvent(new CustomEvent('navigationEnd'));
        // Force one update after navigation is done
        updateActiveSection();
      }, 2000); // Increased to 2 seconds to ensure scroll completes
      
      return;
    }
  });
  
  // ===== SCROLLSPY FUNCTIONALITY =====
  let currentActiveSection = null;
  
  function updateActiveSection() {
    if (isNavigating) {
      console.log('Skipping updateActiveSection - navigation in progress');
      return;
    }
    
    const scrollPosition = window.scrollY;
    const buffer = 150;
    
    let newActiveSection = null;
    
    // Find which section we're currently in
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const rect = section.element.getBoundingClientRect();
      const sectionTop = scrollPosition + rect.top;
      
      if (scrollPosition >= sectionTop - buffer) {
        newActiveSection = section;
        break;
      }
    }
    
    if (window.scrollY < 50) {
      newActiveSection = sections[0];
    }
    
    // Update active states
    if (newActiveSection && newActiveSection !== currentActiveSection) {
      currentActiveSection = newActiveSection;
      updateActiveLink(newActiveSection.link);
      manageDropdowns(newActiveSection.link);
    }
    
    // Update sliding indicator position
    updateSlidingIndicator();
  }
  
  function updateSlidingIndicator() {
    const activeLink = document.querySelector('.sidenav a.active');
    if (!activeLink) return;
    
    // Check if active link is in a submenu
    const isSubmenuLink = activeLink.closest('.sidenav ul ul');
    if (!isSubmenuLink) return;
    
    // Get the submenu container and the active link's position
    const submenu = activeLink.closest('.sidenav ul ul');
    const submenuRect = submenu.getBoundingClientRect();
    const activeLinkRect = activeLink.getBoundingClientRect();
    
    // Calculate the relative position within the submenu
    const relativeTop = activeLinkRect.top - submenuRect.top;
    const linkHeight = activeLinkRect.height;
    
    // Find or create the sliding indicator
    let indicator = submenu.querySelector('.sliding-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'sliding-indicator';
      submenu.appendChild(indicator);
    }
    
    // Position the indicator at the active link's position
    indicator.style.transform = `translateY(${relativeTop + linkHeight/4}px)`;
    indicator.style.opacity = '1';
    
    // Hide indicators in other submenus
    document.querySelectorAll('.sidenav .sliding-indicator').forEach(ind => {
      if (ind !== indicator) {
        ind.style.opacity = '0';
      }
    });
  }
  
  // ===== HELPER FUNCTIONS =====
  function updateActiveLink(activeLink) {
    // Remove all active classes
    navLinks.forEach(link => {
      link.classList.remove('active');
      link.classList.remove('active-parent');
    });
    
    // Add active class to the current link
    if (activeLink) {
      activeLink.classList.add('active');
      
      // Also mark parent as active if this is a child link
      let parentElement = activeLink.parentElement;
      while (parentElement && parentElement !== sidenav) {
        if (parentElement.previousElementSibling && 
            parentElement.previousElementSibling.tagName === 'A') {
          parentElement.previousElementSibling.classList.add('active-parent');
          break;
        }
        parentElement = parentElement.parentElement;
      }
    }
  }
  
  function manageDropdowns(activeLink) {
    // Find which parent should be open for the active section
    let targetParent = null;
    let parentElement = activeLink.parentElement;
    while (parentElement && parentElement !== sidenav) {
      if (parentElement.previousElementSibling && 
          parentElement.previousElementSibling.tagName === 'A') {
        targetParent = parentElement.previousElementSibling;
        break;
      }
      parentElement = parentElement.parentElement;
    }
    
    // Manage dropdown states
    parentLinkElements.forEach(parentLink => {
      const parentUl = parentLink.nextElementSibling;
      
      if (parentLink === targetParent) {
        // This should be open - but only if user hasn't manually closed it
        if (manualStates.get(parentLink) !== false) {
          parentLink.classList.add('is-open');
        }
      } else {
        // This should be closed - but only if user hasn't manually opened it
        const containsActiveSection = parentUl && parentUl.contains(activeLink);
        if (!containsActiveSection && manualStates.get(parentLink) !== true) {
          parentLink.classList.remove('is-open');
        }
      }
    });
  }
  
  // ===== COMBINED SCROLL LISTENER =====
  let ticking = false;
  
  function handleScroll() {
    // CRITICAL: Skip all scroll handling during navigation
    if (isNavigating) {
      return;
    }
    
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveSection();
        updateSidebarVisibility();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // ===== INITIALIZATION =====
  // Auto-open parents for active links on page load
  navLinks.forEach(link => {
    if (link.classList.contains('active')) {
      let p = link.parentElement;
      while (p && p !== sidenav) {
        if (p.previousElementSibling && p.previousElementSibling.tagName === 'A') {
          p.previousElementSibling.classList.add('is-open');
        }
        p = p.parentElement;
      }
    }
  });
  
  // Initial call to set active section and sidebar visibility
  updateActiveSection();
  updateSidebarVisibility();
  
  console.log('Scrollspy navigation initialized');
  console.log('Found sections:', sections.length);
  console.log('Found parent links with submenus:', parentLinkElements.length);
  console.log('Found full-bleed sections:', fullBleedSections.length);
});