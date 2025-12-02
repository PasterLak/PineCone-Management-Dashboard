// Wires up all user interactions on the device table
// Handles clicks on delete, blink, edit, pin buttons, and table clear
class DeviceEventHandler {
  constructor(actions, pinManager, renderer) {
    this.actions = actions;
    this.pinManager = pinManager;
    this.renderer = renderer;
  }

  // Setup event listener
  setup() {
    document.addEventListener('click', (e) => this._handleClick(e));
    this._setupClearTableButton();
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
    const pinsBtn = e.target.closest(DeviceConfig.BUTTONS.PINS);
    const blinkBtn = e.target.closest(DeviceConfig.BUTTONS.BLINK);
    const pinCard = e.target.closest('.pin-card');
    const pinDetailsRow = e.target.closest('tr.pin-details-row');
    const row = e.target.closest('tbody tr:not(.pin-details-row)');

    if (okBtn) {
      this._handleOkButton(okBtn);
    } else if (cancelBtn) {
      this._handleCancelButton(cancelBtn);
    } else if (editBtn) {
      this._handleEditButton(editBtn);
    } else if (deleteBtn) {
      this._handleDeleteButton(deleteBtn);
    } else if (pinsBtn) {
      this._handlePinsButton(pinsBtn);
    } else if (blinkBtn) {
      this._handleBlinkButton(blinkBtn);
    } else if (pinCard) {
      return;
    } else if (pinDetailsRow) {
      this._handlePinDetailsRowClick(pinDetailsRow);
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

  // Pins Button
  _handlePinsButton(button) {
    const deviceId = button.dataset.id;
    if (deviceId) {
      const device = this.actions.dataService.getDevice(deviceId);
      this.pinManager.togglePinDetails(deviceId, device);
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
      this.pinManager.togglePinDetails(deviceId, device);
    }
  }

  // Pin Details Row Click - Close pin details
  _handlePinDetailsRowClick(pinDetailsRow) {
    const deviceId = pinDetailsRow.dataset.deviceId;
    if (deviceId) {
      const device = this.actions.dataService.getDevice(deviceId);
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
