// Controls the display of pin details in a dialog
// Shows device pin configuration when user clicks on a row
class DevicePinManager {
  constructor(dom) {
    this.dom = dom;
  }

  // Shows pin details dialog for a device
  togglePinDetails(deviceId, deviceData) {
    if (!deviceData) return;
    this.showPinDialog(deviceId, deviceData);
  }

  // Shows pin details in a confirm dialog
  async showPinDialog(deviceId, deviceData) {
    const pins = deviceData.pins || {};
    const pinContainer = this._createPinContainer(pins);
    
    if (window.ConfirmDialog) {
      await ConfirmDialog.show({
        title: `Device ${deviceId}`,
        type: 'info',
        infoOnly: true,
        customContent: pinContainer
      });
      
      // Replace feather icons after dialog is shown
      setTimeout(() => {
        if (window.feather) feather.replace();
      }, 100);
    } else {
      console.error('ConfirmDialog not available');
      alert(`Pin details for ${deviceId}:\n${JSON.stringify(pins, null, 2)}`);
    }
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
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'pin-details-title';
    titleContainer.innerHTML = `
      <i data-feather="cpu"></i>
      <span>Pin Configuration</span>
      <span class="pin-count-badge">${pinCount}</span>
    `;
    
    header.appendChild(titleContainer);
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

