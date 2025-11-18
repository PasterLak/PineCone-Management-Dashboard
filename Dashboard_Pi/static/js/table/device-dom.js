/**
 * Device DOM Handler
 * Verwaltet DOM-Zugriffe für die Device Table
 */
class DeviceDOM {
  constructor() {
    this.tbody = document.getElementById('tbody');
  }

  isAvailable() {
    return this.tbody !== null;
  }

  getTbody() {
    return this.tbody;
  }

  getRow(deviceId) {
    return this.tbody?.querySelector(`tr[data-id="${deviceId}"]`);
  }

  getAllRows() {
    return this.tbody?.querySelectorAll('tr[data-id]') || [];
  }

  replaceContent(content) {
    if (!this.tbody) return;
    this.tbody.replaceChildren(content);
  }

  findButton(row, buttonSelector) {
    return row?.querySelector(buttonSelector);
  }

  getNextRow(row) {
    return row?.nextElementSibling;
  }

  insertAfter(newRow, targetRow) {
    if (targetRow && newRow) {
      targetRow.after(newRow);
    }
  }

  removeRow(row) {
    if (row) {
      row.remove();
    }
  }
}
