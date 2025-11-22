/**
 * Device Row Renderer
 * Contains logic to create and update individual device table rows
 */
class DeviceRowRenderer {
  constructor(dataService) {
    this.dataService = dataService;
  }

  // Creates a full table row
  createRow(rowData, offlineThreshold) {
    const tr = document.createElement('tr');
    tr.dataset.id = rowData.id;
    
    const isOffline = this.dataService.isOffline(rowData, offlineThreshold);
    const statusClass = isOffline ? 'device-status--offline' : 'device-status--online';
    const statusText = isOffline ? 'Offline' : 'Online ';
    
    tr.innerHTML = `
      <td class="status-cell">
        <div class="device-status ${statusClass}">
          <span class="device-status-dot"></span>
          <span>${statusText}</span>
        </div>
      </td>
      <td>${rowData.id}</td>
      <td>${rowData.ip}</td>
      <td class="desc-cell" data-id="${rowData.id}">
        <span class="desc-text">${rowData.description}</span>
      </td>
      <td>${rowData.last_seen}</td>
      <td class="actions-cell">
        <button class="edit-btn" type="button" data-id="${rowData.id}" aria-label="Edit description">
          <i data-feather="edit-3"></i>
        </button>
        <button class="pins-btn" type="button" data-id="${rowData.id}" aria-label="View pins">
          <i data-feather="cpu"></i>
        </button>
        <button class="blink-btn ${rowData.blink ? 'blink-active' : ''}" type="button" data-id="${rowData.id}" aria-label="Toggle blink">
          <i data-feather="zap"></i>
        </button>
        <button class="delete-btn" type="button" data-id="${rowData.id}" aria-label="Delete device">
          <i data-feather="trash-2"></i>
        </button>
      </td>
    `;
    
    return tr;
  }

  // Creates "No Devices" message
  createEmptyRow() {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--text)';
    td.textContent = 'No devices available. Devices will appear here when they connect.';
    tr.appendChild(td);
    return tr;
  }

  // Updates row data in-place
  updateRowInPlace(row, deviceData, offlineThreshold) {
    const cells = row.querySelectorAll('td');

    // Update Status Badge (column 0)
    if (cells[DeviceConfig.COLUMNS.STATUS]) {
      const isOffline = this.dataService.isOffline(deviceData, offlineThreshold);
      this.updateStatusBadge(cells[DeviceConfig.COLUMNS.STATUS], isOffline);
    }

    // Update IP
    if (cells[DeviceConfig.COLUMNS.IP]) {
      cells[DeviceConfig.COLUMNS.IP].textContent = deviceData.ip;
    }

    // Update Description (only if not in edit mode)
    if (cells[DeviceConfig.COLUMNS.DESCRIPTION]) {
      const descSpan = cells[DeviceConfig.COLUMNS.DESCRIPTION].querySelector('.desc-text');
      if (descSpan && descSpan.textContent !== deviceData.description) {
        descSpan.textContent = deviceData.description;
      }
    }

    // Update Last Seen
    if (cells[DeviceConfig.COLUMNS.LAST_SEEN] && 
        cells[DeviceConfig.COLUMNS.LAST_SEEN].textContent !== deviceData.last_seen) {
      cells[DeviceConfig.COLUMNS.LAST_SEEN].textContent = deviceData.last_seen;
    }

    // Update Blink Button
    this.updateBlinkButton(row, deviceData.blink);
  }

  // Updates status badge
  updateStatusBadge(statusCell, isOffline) {
    const statusDiv = statusCell.querySelector('.device-status');
    if (!statusDiv) return;

    const statusText = statusDiv.querySelector('span:last-child');
    
    if (isOffline) {
      statusDiv.className = 'device-status device-status--offline';
      if (statusText) statusText.textContent = 'Offline';
    } else {
      statusDiv.className = 'device-status device-status--online';
      if (statusText) statusText.textContent = 'Online ';
    }
  }

  // Updates Blink Button status
  updateBlinkButton(row, isBlinking) {
    const blinkBtn = row.querySelector(DeviceConfig.BUTTONS.BLINK);
    if (blinkBtn) {
      blinkBtn.classList.toggle(DeviceConfig.CSS_CLASSES.BLINK_ACTIVE, isBlinking);
    }
  }
}
