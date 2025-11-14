/**
 * Gemini-Flow TUI Entry Point
 */

import React from 'react';
import { render } from 'ink';
import App from './App.js';

/**
 * Launch TUI
 */
export function launchTUI(options = {}) {
  const { waitUntilExit } = render(<App {...options} />);
  return waitUntilExit();
}

// Export components for reuse
export { App } from './App.js';
export { ServiceGrid } from './components/ServiceGrid.js';
export { StatusPanel } from './components/StatusPanel.js';
export { WorkflowPanel } from './components/WorkflowPanel.js';

// Default export
export default launchTUI;
