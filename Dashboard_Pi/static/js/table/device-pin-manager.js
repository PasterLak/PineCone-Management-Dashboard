// Controls the display of pin details in a dialog
// Shows device pin configuration when user clicks on a row
class DevicePinManager {
  constructor(dom, settingsManager) {
    this.dom = dom;
    this.settings = settingsManager;
    this.currentDeviceId = null;
    this.pinContainer = null;
    this.updateInterval = null;
  }

  // Shows pin details dialog for a device
  togglePinDetails(deviceId, deviceData) {
    if (!deviceData) return;
    this.showPinDialog(deviceId, deviceData);
  }

  // Shows pin details in a confirm dialog
  async showPinDialog(deviceId, deviceData) {
    this.currentDeviceId = deviceId;
    const pins = deviceData.pins || {};
    
    const pinContainer = this._createPinContainer(pins);
    
    if (window.ConfirmDialog) {
      this._startPinUpdates(deviceId);
      
      await ConfirmDialog.show({
        title: `Device ${deviceId}`,
        type: 'info',
        infoOnly: true,
        customContent: pinContainer
      });
      
      this._stopPinUpdates();
      
      setTimeout(() => {
        if (window.feather) feather.replace();
      }, 100);
    } else {
      console.error('ConfirmDialog not available');
      alert(`Pin details for ${deviceId}:\n${JSON.stringify(pins, null, 2)}`);
    }
    
    this.pinContainer = pinContainer;
  }

  // Start updating pin values
  _startPinUpdates(deviceId) {
    this._stopPinUpdates();
    
    const pollInterval = this.settings ? this.settings.get('pollInterval') : 1000;
    
    this.updateInterval = setInterval(() => {
      if (!this.pinContainer || !window.deviceDataService) return;
      
      const deviceData = window.deviceDataService.get(deviceId);
      if (!deviceData || !deviceData.pins) return;
      
      this._updatePinValues(deviceData.pins);
    }, pollInterval);
  }

  // Stop updating pin values
  _stopPinUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.currentDeviceId = null;
    this.pinContainer = null;
  }

  // Update pin values in the DOM
  _updatePinValues(pins) {
    if (!this.pinContainer) return;
    
    Object.entries(pins).forEach(([gpio, pin]) => {
      const cards = this.pinContainer.querySelectorAll('.pin-card');
      cards.forEach(card => {
        const gpioElement = card.querySelector('.pin-gpio');
        if (gpioElement && gpioElement.textContent === gpio) {
          const valueElement = card.querySelector('.pin-value');
          if (valueElement) {
            const newValue = pin.value !== undefined ? pin.value : '-';
            if (valueElement.textContent !== String(newValue)) {
              valueElement.textContent = newValue;
            }
          }
        }
      });
    });
  }

  // Creates Pin Container
  _createPinContainer(pins) {
    const container = document.createElement('div');
    container.className = 'pin-details-container';

    const pinEntries = Object.entries(pins);

    // Header
    const header = this._createHeader(pinEntries.length);
    container.appendChild(header);

    // Content
    if (pinEntries.length === 0) {
      container.appendChild(this._createEmptyMessage());
    } else {
      container.appendChild(this._createPinsGrid(pinEntries));
    }

    return container;
  }

  // Creates Header
  _createHeader(pinCount) {
    const header = document.createElement('div');
    header.className = 'pin-details-header';
    
    const titleText = document.createElement('div');
    titleText.className = 'pin-title-text';
    titleText.innerHTML = `
      <i data-feather="cpu"></i>
      <span>Pin Configuration</span>
    `;
    
    const badge = document.createElement('span');
    badge.className = 'pin-count-badge';
    badge.textContent = pinCount;
    
    header.appendChild(titleText);
    header.appendChild(badge);
    return header;
  }

  // Creates "No Pins" message
  _createEmptyMessage() {
    const noMsg = document.createElement('div');
    noMsg.className = 'no-pins-message';
    noMsg.innerHTML = '<div class="no-pins-content"><i data-feather="info"></i> No pins configured for this device</div>';
    return noMsg;
  }

  // Creates Pins Grid
  _createPinsGrid(pinEntries) {
    const grid = document.createElement('div');
    grid.className = 'pins-grid';

    pinEntries.forEach(([gpio, pin]) => {
      grid.appendChild(this._createPinCard(gpio, pin));
    });

    return grid;
  }

  // Creates individual Pin Card
  _createPinCard(gpio, pin) {
    const card = document.createElement('div');
    card.className = 'pin-card';
    card.innerHTML = `
      <div class="pin-card-header">
        <div class="pin-gpio">${gpio}</div>
        <span class="pin-mode pin-mode--${pin.mode || 'input'}">${pin.mode || 'input'}</span>
      </div>
      <div class="pin-card-body">
        <div class="pin-detail-row">
          <span class="pin-detail-label">Name:</span>
          <span class="pin-detail-value pin-name">${pin.name || '-'}</span>
        </div>
        <div class="pin-detail-row">
          <span class="pin-detail-label">Value:</span>
          <span class="pin-value">${pin.value !== undefined ? pin.value : '-'}</span>
        </div>
      </div>
    `;
    return card;
  }
}

