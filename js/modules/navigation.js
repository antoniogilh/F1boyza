/**
 * Navigation menu toggle for mobile + active link highlight
 */
export function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('active');
}

export function initNavigation() {
  document.querySelectorAll('.menu-toggle').forEach(btn => {
    btn.addEventListener('click', toggleMenu);
  });

  // Highlight the current page's nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}
