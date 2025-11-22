// Switches between different pages in the dashboard
// Saves the current page to localStorage
class PageManager {
  constructor() {
    this.currentPage = this.loadCurrentPage();
    this.pages = document.querySelectorAll('.page');
    this.sidebarItems = document.querySelectorAll('.sidebar-item');
  }

  loadCurrentPage() {
    try {
      return localStorage.getItem('dashboard_currentPage') || 'home';
    } catch (e) {
      console.error('Failed to load current page:', e);
      return 'home';
    }
  }

  show(pageName) {
    this.currentPage = pageName;
    
    // Save to localStorage
    try {
      localStorage.setItem('dashboard_currentPage', pageName);
    } catch (e) {
      console.error('Failed to save current page:', e);
    }

    // Update sidebar active state
    this.sidebarItems.forEach(item => {
      const isActive = item.dataset.target === pageName;
      item.classList.toggle('sidebar-item--active', isActive);
    });

    // Show/hide pages
    this.pages.forEach(page => {
      const isActive = page.dataset.page === pageName;
      page.classList.toggle('page--active', isActive);
    });

    // Activate/deactivate managers based on page
    if (pageName === 'console') {
      if (typeof ConsoleManager !== 'undefined') {
        ConsoleManager.activate();
      }
    } else {
      if (typeof ConsoleManager !== 'undefined') {
        ConsoleManager.deactivate();
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update icons
    if (window.feather) {
      feather.replace();
    }
  }

  init() {
    // Setup click handlers
    this.sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.target;
        if (target) this.show(target);
      });
    });

    // Show initial page
    this.show(this.currentPage);
  }
}
