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
      timestamp: new Date(d.last_seen).getTime()
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
        <button class="edit-btn" type="button" aria-label="Edit description">
          <i data-feather="edit-3"></i>
        </button>
      </td>
      <td>${row.last_seen}</td>
      <td class="actions-cell">
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
      return;
    }

    const fragment = document.createDocumentFragment();
    rows.forEach(row => {
      fragment.appendChild(this.createRow(row));
    });

    this.tbody.replaceChildren(fragment);
    this.devices = newDevices;

    if (window.feather) feather.replace();
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

      // If editing, update internal state but don't re-render (else the edit would be stopped and lost)
      if (this.isEditing) {
        this.devices = newDevices;
        return;
      }

      // Check if re-render is needed (devices changed)
      const needsUpdate = this.hasChanges(newDevices);
      if (needsUpdate) {
        this.render(newDevices);
      }
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }

  // Check if devices have changed
  hasChanges(newDevices) {
    const prevIds = new Set(Object.keys(this.devices));
    const newIds = Object.keys(newDevices);

    // Check if IDs changed
    if (newIds.length !== prevIds.size || newIds.some(id => !prevIds.has(id))) {
      return true;
    }

    // Check if last_seen changed
    return newIds.some(id => {
      const prev = this.devices[id];
      const curr = newDevices[id];
      return !prev || prev.last_seen !== curr.last_seen;
    });
  }

  // show input for editing description
  startEdit(cell) {
    if (!cell || this.activeCell === cell) return;
    
    this.activeCell = cell;
    this.isEditing = true;

    const currentText = (cell.querySelector('.desc-text')?.textContent || '').trim();

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'desc-input';

    const okBtn = document.createElement('button');
    okBtn.className = 'ok-btn';
    okBtn.type = 'button';
    okBtn.innerHTML = '<i data-feather="check"></i>';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.type = 'button';
    cancelBtn.innerHTML = '<i data-feather="x"></i>';

    cell.dataset.old = currentText;
    cell.replaceChildren(input, okBtn, cancelBtn);

    input.focus();
    input.select();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.finishEdit(cell, false);
      if (e.key === 'Escape') this.finishEdit(cell, true);
    });

    if (window.feather) feather.replace();
  }

  // Finish editing
  async finishEdit(cell, cancel) {
    const nodeId = cell.dataset.id;
    const input = cell.querySelector('.desc-input');
    const oldText = cell.dataset.old || '';
    const newText = cancel ? oldText : (input ? input.value.trim() : oldText);

    this.renderDescriptionText(cell, newText);
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

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.type = 'button';
    editBtn.innerHTML = '<i data-feather="edit-3"></i>';

    cell.replaceChildren(span, editBtn);
    if (window.feather) feather.replace();
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

  // Setup event handlers
  setupEventHandlers() {
    document.addEventListener('click', (e) => {
      const okBtn = e.target.closest('.ok-btn');
      const cancelBtn = e.target.closest('.cancel-btn');
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');

      if (okBtn) {
        this.finishEdit(okBtn.closest('.desc-cell'), false);
      } else if (cancelBtn) {
        this.finishEdit(cancelBtn.closest('.desc-cell'), true);
      } else if (editBtn) {
        this.startEdit(editBtn.closest('.desc-cell'));
      } else if (deleteBtn) {
        const nodeId = deleteBtn.dataset.id;
        if (nodeId) this.deleteDevice(nodeId);
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
