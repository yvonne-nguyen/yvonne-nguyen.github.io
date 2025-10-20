// Enhanced lightbox that works with both regular images and full-bleed images
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox.querySelector('img');
  
  if (!lightbox || !lightboxImg) return;
  
  // Select all images that should have lightbox functionality
  const images = document.querySelectorAll('img, .full-bleed img');
  
  // Add click handlers to all images
  images.forEach(img => {
    // Skip if image is already in lightbox or has no src
    if (img.closest('#lightbox') || !img.src) return;
    
    img.style.cursor = 'pointer';
    
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });
  
  // Close lightbox when clicking outside the image
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightbox.querySelector('.viewport')) {
      closeLightbox();
    }
  });
  
  // Handle image zoom toggle
  lightboxImg.addEventListener('click', (e) => {
    e.stopPropagation();
    lightboxImg.classList.toggle('zoomed');
  });
  
  // Mouse panning when zoomed
  lightbox.addEventListener('mousemove', (e) => {
    if (!lightboxImg.classList.contains('zoomed')) return;
    
    const viewport = lightbox.querySelector('.viewport');
    const rect = viewport.getBoundingClientRect();
    
    // Calculate mouse position as percentage (0 to 1)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Convert to transform origin (0% to 100%)
    const originX = x * 110;
    const originY = y * 110;
    
    lightboxImg.style.transformOrigin = `${originX}% ${originY}%`;
  });
  
  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      closeLightbox();
    }
  });
  
  function closeLightbox() {
    lightbox.style.display = 'none';
    lightboxImg.classList.remove('zoomed');
    lightboxImg.src = '';
    lightboxImg.style.transformOrigin = 'center center';
    document.body.style.overflow = '';
  }
});