/**
 * Simulator DOM Handler
 * Manages DOM access for simulator UI
 */
class SimulatorDOM {
  constructor() {
    this.simulatorList = document.getElementById('simulatorList');
    this.addSimulatorBtn = document.getElementById('addSimulator');
  }

  // Check if DOM elements are available
  isAvailable() {
    return this.simulatorList !== null;
  }

  // Get simulator list container
  getSimulatorList() {
    return this.simulatorList;
  }

  // Get add button
  getAddButton() {
    return this.addSimulatorBtn;
  }

  // Replace list content
  replaceListContent(content) {
    if (this.simulatorList) {
      if (typeof content === 'string') {
        this.simulatorList.innerHTML = content;
      } else {
        this.simulatorList.innerHTML = '';
        this.simulatorList.appendChild(content);
      }
    }
  }

  // Append card to list
  appendCard(card) {
    if (this.simulatorList && card) {
      this.simulatorList.appendChild(card);
    }
  }

  // Clear list
  clearList() {
    if (this.simulatorList) {
      this.simulatorList.innerHTML = '';
    }
  }

  // Find console output element
  findConsoleOutput(simId) {
    return document.querySelector(`.sim-console-output[data-id="${simId}"]`);
  }

  // Find payload textarea
  findPayloadTextarea(simId) {
    return document.querySelector(`textarea[data-id="${simId}"][data-field="json"]`);
  }

  // Find scroll button
  findScrollButton(consoleEl) {
    return consoleEl?.parentElement?.querySelector('.scroll-to-bottom-btn');
  }

  // Find pin info content
  findPinInfoContent() {
    return document.getElementById('pinInfoContent');
  }

  // Find pin info toggle
  findPinInfoToggle() {
    return document.getElementById('togglePinInfo');
  }
}
