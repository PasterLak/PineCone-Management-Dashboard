/**
 * Device Configuration
 * config for Device Table
 */
class DeviceConfig {
  // Column Definitions
  static COLUMNS = {
    ID: 0,
    IP: 1,
    DESCRIPTION: 2,
    LAST_SEEN: 3,
    ACTIONS: 4
  };

  // CSS Classes
  static CSS_CLASSES = {
    FLASH: 'flash',
    OFFLINE: 'offline',
    BLINK_ACTIVE: 'blink-active',
    PIN_DETAILS_ROW: 'pin-details-row',
    ACTIVE: 'active'
  };

  // Button Selectors
  static BUTTONS = {
    EDIT: '.edit-btn',
    DELETE: '.delete-btn',
    PINS: '.pins-btn',
    BLINK: '.blink-btn',
    OK: '.ok-btn',
    CANCEL: '.cancel-btn'
  };

  // API Endpoints
  static API = {
    DEVICES: '/api/devices',
    UPDATE_DESC: '/api/update_description',
    DELETE: '/api/delete_device',
    TOGGLE_BLINK: '/api/toggle_blink'
  };
}
