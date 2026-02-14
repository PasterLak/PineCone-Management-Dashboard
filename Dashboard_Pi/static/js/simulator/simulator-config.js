// Configuration constants for simulators
// Contains defaults, CSS classes, and example JSON payloads
class SimulatorConfig {
  // Default values
  static DEFAULTS = {
    INTERVAL: 10,
    POLL_INTERVAL: 20,
    AUTO_UPDATE: true
  };

  // CSS classes
  static CSS_CLASSES = {
    CARD: 'simulator-card',
    RUNNING: 'sim-status--running',
    STOPPED: 'sim-status--stopped',
    VISIBLE: 'visible',
    ACTIVE: 'active',
    SHOW: 'show'
  };

  // Field identifiers
  static FIELDS = {
    NAME: 'name',
    INTERVAL: 'interval',
    JSON: 'json',
    AUTO_UPDATE: 'autoUpdate'
  };

  // Actions
  static ACTIONS = {
    START: 'start',
    STOP: 'stop',
    SEND: 'send',
    CLEAR: 'clear',
    REMOVE: 'remove',
    APPROVE_JSON: 'approve-json',
    DISCARD_JSON: 'discard-json'
  };

  // API endpoints
  static API = {
    START: '/api/simulator/start',
    STOP: '/api/simulator/stop',
    SEND: '/api/simulator/send',
    STATUS: '/api/simulator/status',
    UPDATE: '/api/simulator/update'
  };

  // Example payloads
  static EXAMPLES = {
    button: {
      node_id: "PineCone_001",
      description: "Button Device",
      pins: {
        GPIO0: { name: "button", mode: "pullup", value: "1" }
      }
    },
    led: {
      node_id: "PineCone_002",
      description: "LED Controller",
      pins: {
        GPIO1: { name: "led_red", mode: "output", value: "0" },
        GPIO2: { name: "led_green", mode: "output", value: "1" },
        GPIO3: { name: "led_blue", mode: "output", value: "0" }
      }
    },
    sensor: {
      node_id: "PineCone_003",
      description: "Sensor Module",
      pins: {
        GPIO4: { name: "temp_sensor", mode: "input", value: "23" },
        GPIO5: { name: "motion_detect", mode: "pulldown", value: "0" }
      }
    }
  };

  // Get example by type
  static getExample(type) {
    return this.EXAMPLES[type] || null;
  }

  // Get available example types
  static getExampleTypes() {
    return Object.keys(this.EXAMPLES);
  }
}
