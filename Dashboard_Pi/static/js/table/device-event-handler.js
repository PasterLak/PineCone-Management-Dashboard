/**
 * Device Event Handler
 * Handles all click events for device table
 */
class DeviceEventHandler {
  constructor(actions, pinManager, renderer) {
    this.actions = actions;
    this.pinManager = pinManager;
    this.renderer = renderer;
  }

  // Setup event listener
  setup() {
    document.addEventListener('click', (e) => this._handleClick(e));
  }

  // Central click handler
  _handleClick(e) {
    const okBtn = e.target.closest(DeviceConfig.BUTTONS.OK);
    const cancelBtn = e.target.closest(DeviceConfig.BUTTONS.CANCEL);
    const editBtn = e.target.closest(DeviceConfig.BUTTONS.EDIT);
    const deleteBtn = e.target.closest(DeviceConfig.BUTTONS.DELETE);
    const pinsBtn = e.target.closest(DeviceConfig.BUTTONS.PINS);
    const blinkBtn = e.target.closest(DeviceConfig.BUTTONS.BLINK);
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
    } else if (row) {
      // Click on row (but not on buttons or inputs)
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
        // After delete: Re-render
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
        // Update button UI
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
}
