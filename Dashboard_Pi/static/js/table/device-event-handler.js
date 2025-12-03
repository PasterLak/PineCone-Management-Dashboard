// Wires up all user interactions on the device table
// Handles clicks and hover on delete, blink, edit, copy buttons, and table clear
class DeviceEventHandler {
  constructor(actions, pinManager, renderer) {
    this.actions = actions;
    this.pinManager = pinManager;
    this.renderer = renderer;
    this.buttonFeedback = new ButtonFeedback();
    this.tooltip = null;
  }

  // Setup event listener
  setup() {
    document.addEventListener('click', (e) => this._handleClick(e));
    this._setupClearTableButton();
    this._setupTooltip();
  }

  // Setup tooltip for action buttons
  _setupTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'action-tooltip';
    document.body.appendChild(this.tooltip);

    const showTooltip = (btn) => {
      const text = btn.getAttribute('data-tooltip');
      if (!text) return;
      
      this.tooltip.textContent = text;
      
      const rect = btn.getBoundingClientRect();
      this.tooltip.style.top = `${rect.top - 30}px`;
      this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
      this.tooltip.style.transform = 'translateX(-50%)';
      this.tooltip.classList.add('visible');
    };

    const hideTooltip = () => {
      this.tooltip.classList.remove('visible');
    };

    const tbody = document.getElementById('tbody');
    if (tbody) {
      let currentBtn = null;
      
      tbody.addEventListener('mouseover', (e) => {
        const btn = e.target.closest('.actions-cell button[data-tooltip]');
        if (btn && btn !== currentBtn) {
          currentBtn = btn;
          showTooltip(btn);
        }
      });

      tbody.addEventListener('mouseout', (e) => {
        const btn = e.target.closest('.actions-cell button[data-tooltip]');
        if (btn) {
          const relatedBtn = e.relatedTarget?.closest('.actions-cell button[data-tooltip]');
          if (relatedBtn !== btn) {
            currentBtn = null;
            hideTooltip();
          }
        }
      });
    }

    window.addEventListener('scroll', hideTooltip, true);
  }

  // Setup clear table button
  _setupClearTableButton() {
    const clearBtn = document.getElementById('clearTableBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._handleClearTable();
      });
    }
  }

  // Central click handler
  _handleClick(e) {
    const okBtn = e.target.closest(DeviceConfig.BUTTONS.OK);
    const cancelBtn = e.target.closest(DeviceConfig.BUTTONS.CANCEL);
    const editBtn = e.target.closest(DeviceConfig.BUTTONS.EDIT);
    const deleteBtn = e.target.closest(DeviceConfig.BUTTONS.DELETE);
    const copyBtn = e.target.closest(DeviceConfig.BUTTONS.COPY);
    const blinkBtn = e.target.closest(DeviceConfig.BUTTONS.BLINK);
    const pinCard = e.target.closest('.pin-card');
    const row = e.target.closest('tbody tr');

    if (okBtn) {
      this._handleOkButton(okBtn);
    } else if (cancelBtn) {
      this._handleCancelButton(cancelBtn);
    } else if (editBtn) {
      this._handleEditButton(editBtn);
    } else if (deleteBtn) {
      this._handleDeleteButton(deleteBtn);
    } else if (copyBtn) {
      this._handleCopyButton(copyBtn);
    } else if (blinkBtn) {
      this._handleBlinkButton(blinkBtn);
    } else if (pinCard) {
      return;
    } else if (row) {
      if (!e.target.closest('button') && !e.target.closest('input')) {
        this._handleRowClick(row);
      }
    }
  }

  // OK Button (Save)
  _handleOkButton(button) {
    const deviceId = button.dataset.id;
    if (deviceId) {
      this.actions.finishEdit(deviceId, false);
    }
  }

  // Cancel Button (Cancel)
  _handleCancelButton(button) {
    const deviceId = button.dataset.id;
    if (deviceId) {
      this.actions.finishEdit(deviceId, true);
    }
  }

  // Edit Button
  _handleEditButton(button) {
    const deviceId = button.dataset.id;
    if (deviceId) {
      this.tooltip.classList.remove('visible');
      this.actions.startEdit(deviceId);
    }
  }

  // Delete Button
  _handleDeleteButton(button) {
    const deviceId = button.dataset.id;
    if (deviceId) {
      this.actions.deleteDevice(deviceId, () => {
        const devices = this.actions.dataService.getAll();
        this.renderer.render(devices);
      });
    }
  }

  // Copy Button - Copy device JSON to clipboard
  async _handleCopyButton(button) {
    const deviceId = button.dataset.id;
    if (!deviceId) return;
    
    const device = this.actions.dataService.getDevice(deviceId);
    if (!device) return;
    
    const deviceData = { [deviceId]: device };
    const success = await ClipboardUtils.copyJSON(deviceData);
    
    if (success) {
      this.buttonFeedback.showIconFeedback(button, 'check', {
        bgColor: 'var(--color-success)',
        duration: 2000
      });
    } else {
      this.buttonFeedback.showIconFeedback(button, 'x', {
        bgColor: 'var(--color-danger)',
        duration: 2000
      });
      
      if (window.ConfirmDialog) {
        const deviceJson = JSON.stringify(deviceData, null, 2);
        ConfirmDialog.show({
          title: 'Copy Failed',
          message: `Could not copy to clipboard. JSON:\n\n${deviceJson}`,
          type: 'warning',
          infoOnly: true
        });
      }
    }
  }

  // Blink Button
  _handleBlinkButton(button) {
    const deviceId = button.dataset.id;
    if (deviceId) {
      this.actions.toggleBlink(deviceId, (newBlinkState) => {
        this.renderer.rowRenderer.updateBlinkButton(
          button.closest('tr'),
          newBlinkState
        );
      });
    }
  }

  // Row Click - Toggle pin details
  _handleRowClick(row) {
    const deviceId = row.dataset.id;
    if (deviceId) {
      const device = this.actions.dataService.getDevice(deviceId);
      console.log('Row clicked, showing pin details for:', deviceId, device);
      this.pinManager.togglePinDetails(deviceId, device);
    }
  }

  // Clear Table
  _handleClearTable() {
    this.actions.clearTable(() => {
      const devices = this.actions.dataService.getAll();
      this.renderer.render(devices);
    });
  }
}
