/**
 * Device Edit Handler
 * Verwaltet Inline-Editing von Descriptions
 */
class DeviceEditHandler {
  constructor(dom) {
    this.dom = dom;
    this.isEditing = false;
    this.activeCell = null;
  }

  // Startet Edit-Modus
  startEdit(deviceId) {
    const row = this.dom.getRow(deviceId);
    if (!row) return;

    const cell = row.querySelector('.desc-cell');
    if (!cell || this.activeCell === cell) return;
    
    this.activeCell = cell;
    this.isEditing = true;

    const currentText = (cell.querySelector('.desc-text')?.textContent || '').trim();
    const actionsCell = row.querySelector('.actions-cell');

    // Input erstellen
    const input = this._createInput(currentText);
    cell.dataset.old = currentText;
    cell.replaceChildren(input);

    input.focus();
    input.select();

    // Keyboard Events
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.finishEdit(deviceId, false);
      if (e.key === 'Escape') this.finishEdit(deviceId, true);
    });

    // Action Buttons ersetzen
    this._replaceActionsWithEditButtons(actionsCell, deviceId);
  }

  // Beendet Edit-Modus
  async finishEdit(deviceId, cancel) {
    const row = this.dom.getRow(deviceId);
    if (!row) return;

    const cell = row.querySelector('.desc-cell');
    const input = cell?.querySelector('.desc-input');
    const oldText = cell?.dataset.old || '';
    const newText = cancel ? oldText : (input ? input.value.trim() : oldText);

    const actionsCell = row.querySelector('.actions-cell');

    // Description wiederherstellen
    this._renderDescriptionText(cell, newText);
    
    // Original Buttons wiederherstellen
    this._restoreOriginalButtons(actionsCell);

    this.activeCell = null;
    this.isEditing = false;

    // Speichern wenn geändert
    if (!cancel && newText !== oldText) {
      return await this._saveDescription(deviceId, newText, cell, oldText);
    }
  }

  // Gibt Edit-Status zurück
  isCurrentlyEditing() {
    return this.isEditing;
  }

  // Erstellt Input-Element
  _createInput(value) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = 'desc-input';
    return input;
  }

  // Ersetzt Actions mit Edit-Buttons
  _replaceActionsWithEditButtons(actionsCell, deviceId) {
    if (!actionsCell) return;

    const okBtn = document.createElement('button');
    okBtn.className = 'ok-btn';
    okBtn.type = 'button';
    okBtn.dataset.id = deviceId;
    okBtn.innerHTML = '<i data-feather="check"></i>';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.type = 'button';
    cancelBtn.dataset.id = deviceId;
    cancelBtn.innerHTML = '<i data-feather="x"></i>';

    actionsCell.dataset.originalButtons = actionsCell.innerHTML;
    actionsCell.replaceChildren(okBtn, cancelBtn);

    if (window.feather) feather.replace();
  }

  // Stellt Original-Buttons wieder her
  _restoreOriginalButtons(actionsCell) {
    if (actionsCell && actionsCell.dataset.originalButtons) {
      actionsCell.innerHTML = actionsCell.dataset.originalButtons;
      delete actionsCell.dataset.originalButtons;
      if (window.feather) feather.replace();
    }
  }

  // Rendert Description Text
  _renderDescriptionText(cell, text) {
    if (!cell) return;

    const span = document.createElement('span');
    span.className = 'desc-text';
    span.textContent = text;
    cell.replaceChildren(span);
  }

  // Speichert Description via API
  async _saveDescription(deviceId, newText, cell, oldText) {
    try {
      const response = await fetch(DeviceConfig.API.UPDATE_DESC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: deviceId, description: newText })
      });

      if (!response.ok) throw new Error('Save failed');
      return true;
    } catch (err) {
      this._renderDescriptionText(cell, oldText);
      alert('Saving failed.');
      return false;
    }
  }
}
