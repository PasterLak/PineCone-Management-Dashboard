/**
 * Device Manager - Handles device data, rendering, and updates (table data)
 */
class DeviceManager {
  constructor(settingsManager) {
    this.settings = settingsManager;
    this.tbody = document.getElementById('tbody');
    this.devices = window.initialDevices || {};
    this.isEditing = false;
    this.activeCell = null;
    this.expandedPinRow = null;
    
    this.pollIntervalId = null;
    this.offlineIntervalId = null;
  }

  // Convert devices object to sorted array
  toRows(devices) {
    return Object.entries(devices).map(([id, d]) => ({
      id,
      ip: d.ip,
      description: d.description || '',
      last_seen: d.last_seen,
      timestamp: new Date(d.last_seen).getTime(),
      blink: d.blink || false
    })).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Create a table row element
  createRow(row) {
    const tr = document.createElement('tr');
    tr.dataset.id = row.id;
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.ip}</td>
      <td class="desc-cell" data-id="${row.id}">
        <span class="desc-text">${row.description}</span>
      </td>
      <td>${row.last_seen}</td>
      <td class="actions-cell">
        <button class="edit-btn" type="button" data-id="${row.id}" aria-label="Edit description">
          <i data-feather="edit-3"></i>
        </button>
        <button class="pins-btn" type="button" data-id="${row.id}" aria-label="View pins">
          <i data-feather="cpu"></i>
        </button>
        <button class="blink-btn ${row.blink ? 'blink-active' : ''}" type="button" data-id="${row.id}" aria-label="Toggle blink">
          <i data-feather="zap"></i>
        </button>
        <button class="delete-btn" type="button" data-id="${row.id}" aria-label="Delete device">
          <i data-feather="trash-2"></i>
        </button>
      </td>
    `;

    // Add flash animation for new/updated devices
    const prevDevice = this.devices[row.id];
    if (!prevDevice || prevDevice.last_seen !== row.last_seen) {
      tr.classList.add('flash');
      tr.addEventListener('animationend', () => tr.classList.remove('flash'), { once: true });
    }

    // Mark offline devices
    const now = Date.now();
    if (now - row.timestamp > this.settings.get('offlineThreshold')) {
      tr.classList.add('offline');
    }

    return tr;
  }

  // Render all devices to table
  render(newDevices) {
    if (!this.tbody) return;
    
    const rows = this.toRows(newDevices);

    // Remember which device had expanded pins
    const expandedDeviceId = this.expandedPinRow ? this.expandedPinRow.dataset.deviceId : null;

    // Show message if no devices in table
    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.style.textAlign = 'center';
      td.style.padding = '40px';
      td.style.color = 'var(--text)';
      td.textContent = 'No devices available. Devices will appear here when they connect.';
      tr.appendChild(td);
      this.tbody.replaceChildren(tr);
      this.devices = newDevices;
      this.expandedPinRow = null;
      return;
    }

    const fragment = document.createDocumentFragment();
    rows.forEach(row => {
      fragment.appendChild(this.createRow(row));
    });

    this.tbody.replaceChildren(fragment);
    this.devices = newDevices;

    if (window.feather) feather.replace();

    // Restore expanded pin details if it was open
    if (expandedDeviceId && newDevices[expandedDeviceId]) {
      const deviceRow = this.tbody.querySelector(`tr[data-id="${expandedDeviceId}"]`);
      if (deviceRow) {
        const pinRow = this.createPinDetailsRow(expandedDeviceId, newDevices[expandedDeviceId].pins || {});
        deviceRow.after(pinRow);
        this.expandedPinRow = pinRow;
        deviceRow.querySelector('.pins-btn').classList.add('active');
        if (window.feather) feather.replace();
      }
    }
  }

  // Update offline status for all rows
  updateOfflineStatus() {
    if (!this.tbody) return;
    
    const now = Date.now();
    const threshold = this.settings.get('offlineThreshold');
    const rows = this.tbody.querySelectorAll('tr');

    rows.forEach(tr => {
      const device = this.devices[tr.dataset.id];
      if (!device) return;

      const timestamp = new Date(device.last_seen).getTime();
      const isOffline = (now - timestamp) > threshold;
      tr.classList.toggle('offline', isOffline);
    });
  }

  // Poll devices from server
  async pollDevices() {
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) throw new Error('Polling failed');
      
      const data = await response.json();
      if (!data || !data.devices) return;

      const newDevices = data.devices;

      // If editing, update internal state but don't re-render
      if (this.isEditing) {
        this.devices = newDevices;
        return;
      }

      // Detect what changed
      const changes = this.detectChanges(newDevices);
      
      if (changes.structureChanged) {
        // IDs changed -> full re-render needed
        this.render(newDevices);
      } else if (changes.dataChanged) {
        // Only data changed -> update in place without DOM replacement
        this.updateInPlace(newDevices, changes.changedIds);
      } else {
        // Nothing visible changed, just update state
        this.devices = newDevices;
      }
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }

  // Detect what type of changes occurred
  detectChanges(newDevices) {
    const prevIds = new Set(Object.keys(this.devices));
    const newIds = Object.keys(newDevices);

    // Check structure changes (devices added/removed)
    const structureChanged = newIds.length !== prevIds.size || 
                            newIds.some(id => !prevIds.has(id));

    if (structureChanged) {
      return { structureChanged: true, dataChanged: false, changedIds: [] };
    }

    // Check data changes (last_seen, description, pins, or blink changed)
    const changedIds = newIds.filter(id => {
      const prev = this.devices[id];
      const curr = newDevices[id];
      if (!prev) return true;
      
      return prev.last_seen !== curr.last_seen || 
             prev.description !== curr.description ||
             prev.blink !== curr.blink ||
             JSON.stringify(prev.pins || {}) !== JSON.stringify(curr.pins || {});
    });

    return {
      structureChanged: false,
      dataChanged: changedIds.length > 0,
      changedIds: changedIds
    };
  }

  // Update rows in place without DOM replacement
  updateInPlace(newDevices, changedIds) {
    changedIds.forEach(nodeId => {
      const row = this.tbody.querySelector(`tr[data-id="${nodeId}"]`);
      if (!row) return;

      const device = newDevices[nodeId];
      const cells = row.querySelectorAll('td');

      // Update IP (cell 1)
      if (cells[1] && cells[1].textContent !== device.ip) {
        cells[1].textContent = device.ip;
      }

      // Update description (cell 2) - only if not editing
      if (cells[2] && !this.isEditing) {
        const descSpan = cells[2].querySelector('.desc-text');
        if (descSpan && descSpan.textContent !== device.description) {
          descSpan.textContent = device.description;
        }
      }

      // Update last_seen (cell 3)
      if (cells[3] && cells[3].textContent !== device.last_seen) {
        cells[3].textContent = device.last_seen;
        
        // Flash animation only when last_seen changes
        row.classList.remove('flash');
        void row.offsetWidth; // Force restart of animation
        row.classList.add('flash');
        row.addEventListener('animationend', () => row.classList.remove('flash'), { once: true });
      }

      // Update blink button state (cell 4 - actions cell)
      if (cells[4]) {
        const blinkBtn = cells[4].querySelector('.blink-btn');
        if (blinkBtn) {
          const shouldBeActive = device.blink || false;
          const isActive = blinkBtn.classList.contains('blink-active');
          if (shouldBeActive !== isActive) {
            blinkBtn.classList.toggle('blink-active', shouldBeActive);
          }
        }
      }

      // Update pin details if expanded for this device
      const pinRow = row.nextElementSibling;
      if (pinRow && pinRow.classList.contains('pin-details-row') && 
          pinRow.dataset.deviceId === nodeId) {
        
        // Check if pins actually changed
        const prevPins = JSON.stringify(this.devices[nodeId]?.pins || {});
        const newPins = JSON.stringify(device.pins || {});
        
        if (prevPins !== newPins) {
          // Replace pin row content
          const newPinRow = this.createPinDetailsRow(nodeId, device.pins || {});
          const newContent = newPinRow.querySelector('td').innerHTML;
          pinRow.querySelector('td').innerHTML = newContent;
          this.expandedPinRow = pinRow;
          if (window.feather) feather.replace();
        }
      }
    });

    // Update internal state
    this.devices = newDevices;
  }


  // show input for editing description
  startEdit(cell) {
    if (!cell || this.activeCell === cell) return;
    
    this.activeCell = cell;
    this.isEditing = true;

    const nodeId = cell.dataset.id;
    const row = cell.closest('tr');
    const actionsCell = row.querySelector('.actions-cell');

    const currentText = (cell.querySelector('.desc-text')?.textContent || '').trim();

    // Replace description cell with input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'desc-input';

    cell.dataset.old = currentText;
    cell.replaceChildren(input);

    input.focus();
    input.select();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.finishEdit(cell, false);
      if (e.key === 'Escape') this.finishEdit(cell, true);
    });

    // Replace actions with OK and Cancel buttons
    if (actionsCell) {
      const okBtn = document.createElement('button');
      okBtn.className = 'ok-btn';
      okBtn.type = 'button';
      okBtn.dataset.id = nodeId;
      okBtn.innerHTML = '<i data-feather="check"></i>';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'cancel-btn';
      cancelBtn.type = 'button';
      cancelBtn.dataset.id = nodeId;
      cancelBtn.innerHTML = '<i data-feather="x"></i>';

      // Store original buttons
      actionsCell.dataset.originalButtons = actionsCell.innerHTML;
      actionsCell.replaceChildren(okBtn, cancelBtn);
    }

    if (window.feather) feather.replace();
  }

  // Finish editing
  async finishEdit(cell, cancel) {
    const nodeId = cell.dataset.id;
    const input = cell.querySelector('.desc-input');
    const oldText = cell.dataset.old || '';
    const newText = cancel ? oldText : (input ? input.value.trim() : oldText);

    const row = cell.closest('tr');
    const actionsCell = row.querySelector('.actions-cell');

    // Restore description text
    this.renderDescriptionText(cell, newText);
    
    // Restore original action buttons
    if (actionsCell && actionsCell.dataset.originalButtons) {
      actionsCell.innerHTML = actionsCell.dataset.originalButtons;
      delete actionsCell.dataset.originalButtons;
      if (window.feather) feather.replace();
    }

    this.activeCell = null;
    this.isEditing = false;

    if (cancel || newText === oldText) return;

    try {
      const response = await fetch('/api/update_description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId, description: newText })
      });

      if (!response.ok) throw new Error('Save failed');
    } catch (err) {
      this.renderDescriptionText(cell, oldText);
      alert('Saving failed.');
    }
  }

  // Render description text
  renderDescriptionText(cell, text) {
    const span = document.createElement('span');
    span.className = 'desc-text';
    span.textContent = text;

    cell.replaceChildren(span);
  }

  // Delete a device
  async deleteDevice(nodeId) {
    try {
      const response = await fetch('/api/delete_device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId })
      });

      if (!response.ok) throw new Error('Delete failed');

      // Remove from state and re-render
      delete this.devices[nodeId];
      this.render(this.devices);
    } catch (err) {
      alert('Deleting failed.');
    }
  }

  // Toggle blink status
  async toggleBlink(nodeId) {
    try {
      const response = await fetch('/api/toggle_blink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId })
      });

      if (!response.ok) throw new Error('Toggle blink failed');

      const data = await response.json();
      
      // Update local state
      if (this.devices[nodeId]) {
        this.devices[nodeId].blink = data.blink;
      }

      // Update button UI
      const row = this.tbody.querySelector(`tr[data-id="${nodeId}"]`);
      if (row) {
        const blinkBtn = row.querySelector('.blink-btn');
        if (blinkBtn) {
          blinkBtn.classList.toggle('blink-active', data.blink);
        }
      }
    } catch (err) {
      console.error('Toggle blink failed:', err);
      alert('Toggle blink failed.');
    }
  }

  // Toggle pin details display
  togglePinDetails(nodeId) {
    const device = this.devices[nodeId];
    if (!device) return;

    const deviceRow = this.tbody.querySelector(`tr[data-id="${nodeId}"]`);
    if (!deviceRow) return;

    // Check if this device already has an expanded row
    const existingPinRow = deviceRow.nextElementSibling;
    const isCurrentlyExpanded = existingPinRow && existingPinRow.classList.contains('pin-details-row');

    // Close any open pin details
    if (this.expandedPinRow && this.expandedPinRow !== existingPinRow) {
      this.expandedPinRow.remove();
      // Remove active state from previous button
      const prevBtn = this.tbody.querySelector('.pins-btn.active');
      if (prevBtn) prevBtn.classList.remove('active');
    }

    // Toggle current row
    if (isCurrentlyExpanded) {
      existingPinRow.remove();
      this.expandedPinRow = null;
      deviceRow.querySelector('.pins-btn').classList.remove('active');
    } else {
      const pinRow = this.createPinDetailsRow(nodeId, device.pins || {});
      deviceRow.after(pinRow);
      this.expandedPinRow = pinRow;
      deviceRow.querySelector('.pins-btn').classList.add('active');
      if (window.feather) feather.replace();
    }
  }

  // Create pin details row
  createPinDetailsRow(nodeId, pins) {
    const tr = document.createElement('tr');
    tr.className = 'pin-details-row';
    tr.dataset.deviceId = nodeId;

    const td = document.createElement('td');
    td.colSpan = 5;

    const container = document.createElement('div');
    container.className = 'pin-details-container';

    const pinEntries = Object.entries(pins);

    // Header with title and pin count
    const header = document.createElement('div');
    header.className = 'pin-details-header';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'pin-details-title';
    titleContainer.innerHTML = `
      <i data-feather="cpu"></i>
      <span>Pin Configuration</span>
      <span class="pin-count-badge">${pinEntries.length}</span>
    `;
    
    header.appendChild(titleContainer);
    container.appendChild(header);

    if (pinEntries.length === 0) {
      const noMsg = document.createElement('div');
      noMsg.className = 'no-pins-message';
      noMsg.innerHTML = '<div class="no-pins-content"><i data-feather="info"></i> No pins configured for this device</div>';
      container.appendChild(noMsg);
    } else {
      // Create grid of pin cards
      const grid = document.createElement('div');
      grid.className = 'pins-grid';

      pinEntries.forEach(([gpio, pin]) => {
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
        grid.appendChild(card);
      });

      container.appendChild(grid);
    }

    td.appendChild(container);
    tr.appendChild(td);

    return tr;
  }

  // Setup event handlers
  setupEventHandlers() {
    document.addEventListener('click', (e) => {
      const okBtn = e.target.closest('.ok-btn');
      const cancelBtn = e.target.closest('.cancel-btn');
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');
      const pinsBtn = e.target.closest('.pins-btn');
      const blinkBtn = e.target.closest('.blink-btn');

      if (okBtn) {
        const nodeId = okBtn.dataset.id;
        if (nodeId) {
          const row = this.tbody.querySelector(`tr[data-id="${nodeId}"]`);
          const descCell = row?.querySelector('.desc-cell');
          if (descCell) this.finishEdit(descCell, false);
        }
      } else if (cancelBtn) {
        const nodeId = cancelBtn.dataset.id;
        if (nodeId) {
          const row = this.tbody.querySelector(`tr[data-id="${nodeId}"]`);
          const descCell = row?.querySelector('.desc-cell');
          if (descCell) this.finishEdit(descCell, true);
        }
      } else if (editBtn) {
        const nodeId = editBtn.dataset.id;
        if (nodeId) {
          const row = this.tbody.querySelector(`tr[data-id="${nodeId}"]`);
          const descCell = row?.querySelector('.desc-cell');
          if (descCell) this.startEdit(descCell);
        }
      } else if (deleteBtn) {
        const nodeId = deleteBtn.dataset.id;
        if (nodeId) this.deleteDevice(nodeId);
      } else if (pinsBtn) {
        const nodeId = pinsBtn.dataset.id;
        if (nodeId) this.togglePinDetails(nodeId);
      } else if (blinkBtn) {
        const nodeId = blinkBtn.dataset.id;
        if (nodeId) this.toggleBlink(nodeId);
      }
    });
  }

  // Start polling
  startPolling() {
    const pollInterval = this.settings.get('pollInterval');
    const tickOffline = this.settings.get('tickOffline');

    this.pollDevices();
    this.pollIntervalId = setInterval(() => this.pollDevices(), pollInterval);

    this.updateOfflineStatus();
    this.offlineIntervalId = setInterval(() => this.updateOfflineStatus(), tickOffline);
  }

  // Stop polling
  stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.offlineIntervalId) {
      clearInterval(this.offlineIntervalId);
      this.offlineIntervalId = null;
    }
  }

  // Restart polling with new settings
  restartPolling() {
    this.stopPolling();
    this.startPolling();
  }

  // Initialize
  init() {
    if (!this.tbody) return;

    this.render(this.devices);
    this.setupEventHandlers();
    this.startPolling();

    // Listen for settings changes
    this.settings.onUpdate((changes) => {
      if (changes.pollInterval || changes.offlineThreshold || changes.tickOffline) {
        console.log('Device polling settings updated:', changes);
        
        if (changes.offlineThreshold) {
          this.updateOfflineStatus();
        }
        
        if (changes.pollInterval || changes.tickOffline) {
          this.restartPolling();
        }
      }
    });
  }
}
