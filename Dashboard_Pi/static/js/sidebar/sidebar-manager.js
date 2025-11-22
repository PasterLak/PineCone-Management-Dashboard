/**
 * Sidebar Manager - Handles sidebar open/close state
 */
class SidebarManager {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.toggle = document.getElementById('sidebarToggle');
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
    this.sidebar.classList.add('sidebar--open');
    this.sidebar.classList.remove('sidebar--closed');
    if (window.feather) feather.replace();
  }

  close() {
    this.isOpen = false;
    this.sidebar.classList.remove('sidebar--open');
    this.sidebar.classList.add('sidebar--closed');
    if (window.feather) feather.replace();
  }

  toggleState() {
    this.isOpen ? this.close() : this.open();
  }

  init() {
    if (!this.sidebar || !this.toggle) return;

    // Toggle button click
    this.toggle.addEventListener('click', () => {
      this.toggleState();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.isOpen) return;
      
      const clickedSidebar = e.target.closest('#sidebar');
      const clickedToggle = e.target.closest('#sidebarToggle');
      
      if (!clickedSidebar && !clickedToggle) {
        this.close();
      }
    });
  }
}
