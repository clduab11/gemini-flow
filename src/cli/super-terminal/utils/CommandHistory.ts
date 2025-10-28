import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface HistoryEntry {
  command: string;
  timestamp: number;
}

export class CommandHistory {
  private history: HistoryEntry[] = [];
  private historyFile: string;
  private maxHistorySize: number = 1000;
  private currentIndex: number = -1;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.gemini-flow');
    this.historyFile = path.join(configDir, 'history.json');
    this.loadHistory();
  }

  /**
   * Load history from file
   */
  private async loadHistory(): Promise<void> {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.historyFile);
      await fs.mkdir(configDir, { recursive: true });

      // Load existing history
      try {
        const data = await fs.readFile(this.historyFile, 'utf-8');
        const parsed = JSON.parse(data);
        this.history = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        // File doesn't exist or is invalid, start with empty history
        this.history = [];
      }

      // Reset current index
      this.currentIndex = -1;
    } catch (error) {
      console.warn('Failed to load command history:', error);
      this.history = [];
    }
  }

  /**
   * Save history to file
   */
  private async saveHistory(): Promise<void> {
    try {
      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(-this.maxHistorySize);
      }

      await fs.writeFile(
        this.historyFile,
        JSON.stringify(this.history, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('Failed to save command history:', error);
    }
  }

  /**
   * Add a command to history
   */
  async add(command: string): Promise<void> {
    if (!command.trim()) return;

    // Don't add duplicate consecutive commands
    if (this.history.length > 0 && this.history[this.history.length - 1].command === command) {
      return;
    }

    this.history.push({
      command,
      timestamp: Date.now(),
    });

    this.currentIndex = -1; // Reset navigation
    await this.saveHistory();
  }

  /**
   * Navigate backward in history (up arrow)
   */
  getPrevious(currentInput: string = ''): string | null {
    if (this.history.length === 0) return null;

    // If we're at the start of navigation, save current input
    if (this.currentIndex === -1) {
      this.currentIndex = this.history.length;
    }

    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex].command;
    }

    return null;
  }

  /**
   * Navigate forward in history (down arrow)
   */
  getNext(): string | null {
    if (this.currentIndex === -1) return null;

    this.currentIndex++;

    if (this.currentIndex >= this.history.length) {
      this.currentIndex = -1;
      return ''; // Return to current input
    }

    return this.history[this.currentIndex].command;
  }

  /**
   * Search history with a query (Ctrl+R)
   */
  search(query: string): string[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const matches: string[] = [];
    const seen = new Set<string>();

    // Search backwards through history
    for (let i = this.history.length - 1; i >= 0; i--) {
      const cmd = this.history[i].command;
      if (cmd.toLowerCase().includes(lowerQuery) && !seen.has(cmd)) {
        matches.push(cmd);
        seen.add(cmd);
      }
    }

    return matches;
  }

  /**
   * Get autocomplete suggestions for partial command
   */
  getAutocompleteSuggestions(partial: string): string[] {
    if (!partial.trim()) return [];

    const matches: string[] = [];
    const seen = new Set<string>();

    // Search backwards for commands starting with partial
    for (let i = this.history.length - 1; i >= 0; i--) {
      const cmd = this.history[i].command;
      if (cmd.startsWith(partial) && !seen.has(cmd)) {
        matches.push(cmd);
        seen.add(cmd);
      }
    }

    return matches;
  }

  /**
   * Get all history entries
   */
  getAll(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Clear all history
   */
  async clear(): Promise<void> {
    this.history = [];
    this.currentIndex = -1;
    await this.saveHistory();
  }

  /**
   * Get history statistics
   */
  getStats(): {
    totalCommands: number;
    uniqueCommands: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    const uniqueCommands = new Set(this.history.map(h => h.command)).size;
    const timestamps = this.history.map(h => h.timestamp);

    return {
      totalCommands: this.history.length,
      uniqueCommands,
      oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  /**
   * Reset navigation index
   */
  resetNavigation(): void {
    this.currentIndex = -1;
  }
}
