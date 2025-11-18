/**
 * Device Row Renderer
 * Erstellt und aktualisiert Table Rows
 */
class DeviceRowRenderer {
  constructor(dataService) {
    this.dataService = dataService;
  }

  // Erstellt eine vollständige Table Row
  createRow(rowData, offlineThreshold) {
    const tr = document.createElement('tr');
    tr.dataset.id = rowData.id;
    tr.innerHTML = `
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

    // Flash-Animation für neue/aktualisierte Devices
    const prevDevice = this.dataService.getDevice(rowData.id);
    if (!prevDevice || prevDevice.last_seen !== rowData.last_seen) {
      tr.classList.add(DeviceConfig.CSS_CLASSES.FLASH);
      tr.addEventListener('animationend', () => {
        tr.classList.remove(DeviceConfig.CSS_CLASSES.FLASH);
      }, { once: true });
    }

    // Offline markieren
    if (this.dataService.isOffline(rowData, offlineThreshold)) {
      tr.classList.add(DeviceConfig.CSS_CLASSES.OFFLINE);
    }

    return tr;
  }

  // Erstellt "No Devices" Nachricht
  createEmptyRow() {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--text)';
    td.textContent = 'No devices available. Devices will appear here when they connect.';
    tr.appendChild(td);
    return tr;
  }

  // Aktualisiert Row-Daten in-place
  updateRowInPlace(row, deviceData) {
    const cells = row.querySelectorAll('td');

    // Update IP
    if (cells[DeviceConfig.COLUMNS.IP]) {
      cells[DeviceConfig.COLUMNS.IP].textContent = deviceData.ip;
    }

    // Update Description (nur wenn nicht im Edit-Modus)
    if (cells[DeviceConfig.COLUMNS.DESCRIPTION]) {
      const descSpan = cells[DeviceConfig.COLUMNS.DESCRIPTION].querySelector('.desc-text');
      if (descSpan && descSpan.textContent !== deviceData.description) {
        descSpan.textContent = deviceData.description;
      }
    }

    // Update Last Seen mit Flash-Animation
    if (cells[DeviceConfig.COLUMNS.LAST_SEEN] && 
        cells[DeviceConfig.COLUMNS.LAST_SEEN].textContent !== deviceData.last_seen) {
      cells[DeviceConfig.COLUMNS.LAST_SEEN].textContent = deviceData.last_seen;
      
      row.classList.remove(DeviceConfig.CSS_CLASSES.FLASH);
      void row.offsetWidth; // Force reflow
      row.classList.add(DeviceConfig.CSS_CLASSES.FLASH);
      row.addEventListener('animationend', () => {
        row.classList.remove(DeviceConfig.CSS_CLASSES.FLASH);
      }, { once: true });
    }

    // Update Blink Button
    this.updateBlinkButton(row, deviceData.blink);
  }

  // Aktualisiert Blink-Button Status
  updateBlinkButton(row, isBlinking) {
    const blinkBtn = row.querySelector(DeviceConfig.BUTTONS.BLINK);
    if (blinkBtn) {
      blinkBtn.classList.toggle(DeviceConfig.CSS_CLASSES.BLINK_ACTIVE, isBlinking);
    }
  }

  // Aktualisiert Offline-Status
  updateOfflineStatus(row, isOffline) {
    row.classList.toggle(DeviceConfig.CSS_CLASSES.OFFLINE, isOffline);
  }
}
