/**
 * Confirm Dialog Component
 * Modern, reusable confirmation dialog with animations
 * 
 * Usage:
 * const confirmed = await ConfirmDialog.show({
 *   title: 'Delete Device?',
 *   message: 'This action cannot be undone.',
 *   confirmText: 'Delete',
 *   cancelText: 'Cancel',
 *   type: 'danger' // 'danger', 'warning', 'info', 'success'
 * });
 * 
 * if (confirmed) {
 *   // User clicked confirm
 * }
 */

class ConfirmDialog {
  static currentDialog = null;

  /**
   * Show confirmation dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<boolean>} - Resolves with true if confirmed, false if cancelled
   */
  static show(options = {}) {
    // Close any existing dialog
    if (this.currentDialog) {
      this.currentDialog.destroy();
    }

    return new Promise((resolve) => {
      this.currentDialog = new ConfirmDialogInstance(options, resolve);
    });
  }
}

class ConfirmDialogInstance {
  constructor(options, resolveCallback) {
    this.options = {
      title: options.title || 'Confirm Action',
      message: options.message || 'Are you sure you want to proceed?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'info', // 'danger', 'warning', 'info', 'success'
      infoOnly: options.infoOnly || false // Show only close button (no cancel/confirm)
    };
    
    this.resolveCallback = resolveCallback;
    this.overlay = null;
    this.dialog = null;
    
    this.create();
    this.show();
  }

  create() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'confirm-dialog-overlay';
    
    // Create dialog
    this.dialog = document.createElement('div');
    this.dialog.className = 'confirm-dialog';
    
    // Create content
    const footerButtons = this.options.infoOnly 
      ? `<button class="confirm-dialog-btn confirm-dialog-btn--confirm confirm-dialog-btn--${this.options.type}" data-action="close">
          Close
        </button>`
      : `<button class="confirm-dialog-btn confirm-dialog-btn--cancel" data-action="cancel">
          ${this.escapeHtml(this.options.cancelText)}
        </button>
        <button class="confirm-dialog-btn confirm-dialog-btn--confirm confirm-dialog-btn--${this.options.type}" data-action="confirm">
          ${this.escapeHtml(this.options.confirmText)}
        </button>`;
    
    this.dialog.innerHTML = `
      <div class="confirm-dialog-header">
        <div class="confirm-dialog-icon confirm-dialog-icon--${this.options.type}">
          ${this.getIcon()}
        </div>
        <h3 class="confirm-dialog-title">${this.escapeHtml(this.options.title)}</h3>
      </div>
      <div class="confirm-dialog-body">
        <p class="confirm-dialog-message">${this.escapeHtml(this.options.message)}</p>
      </div>
      <div class="confirm-dialog-footer">
        ${footerButtons}
      </div>
    `;
    
    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);
    
    // Replace feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Click outside to cancel (or close for info-only)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        if (this.options.infoOnly) {
          this.close();
        } else {
          this.cancel();
        }
      }
    });
    
    // Button clicks
    const cancelBtn = this.dialog.querySelector('[data-action="cancel"]');
    const confirmBtn = this.dialog.querySelector('[data-action="confirm"]');
    const closeBtn = this.dialog.querySelector('[data-action="close"]');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancel());
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirm());
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Escape key to cancel/close
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        if (this.options.infoOnly) {
          this.close();
        } else {
          this.cancel();
        }
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
    
    // Enter key to confirm/close (focus on action button)
    const actionBtn = closeBtn || confirmBtn;
    if (actionBtn) {
      actionBtn.focus();
      this.enterHandler = (e) => {
        if (e.key === 'Enter' && document.activeElement === actionBtn) {
          if (this.options.infoOnly) {
            this.close();
          } else {
            this.confirm();
          }
        }
      };
      document.addEventListener('keydown', this.enterHandler);
    }
  }

  show() {
    // Force reflow for animation
    this.overlay.offsetHeight;
    
    // Add active class for fade-in animation
    requestAnimationFrame(() => {
      this.overlay.classList.add('confirm-dialog-overlay--active');
      this.dialog.classList.add('confirm-dialog--active');
    });
  }

  confirm() {
    this.destroy();
    this.resolveCallback(true);
  }

  cancel() {
    this.destroy();
    this.resolveCallback(false);
  }

  close() {
    this.destroy();
    this.resolveCallback(false); // Info-only dialogs return false (no action needed)
  }

  destroy() {
    // Remove event listeners
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    if (this.enterHandler) {
      document.removeEventListener('keydown', this.enterHandler);
    }
    
    // Fade out animation
    this.overlay.classList.remove('confirm-dialog-overlay--active');
    this.dialog.classList.remove('confirm-dialog--active');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      ConfirmDialog.currentDialog = null;
    }, 300);
  }

  getIcon() {
    const iconNames = {
      danger: 'alert-circle',
      warning: 'alert-triangle',
      success: 'check-circle',
      info: 'info'
    };
    
    const iconName = iconNames[this.options.type] || iconNames.info;
    return `<i data-feather="${iconName}"></i>`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
