// Console DOM Elements
const ConsoleDOM = {
  output: null,
  clearBtn: null,
  scrollBtn: null,

  init() {
    this.output = document.getElementById('consoleOutput');
    this.clearBtn = document.getElementById('consoleClearBtn');
    this.scrollBtn = document.getElementById('consoleScrollBtn');
  }
};
