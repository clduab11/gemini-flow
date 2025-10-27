/**
 * ASCII Chart Utilities
 *
 * Creates beautiful ASCII visualizations using █▓▒░ characters
 */

export interface BarChartOptions {
  maxWidth?: number;
  showValue?: boolean;
  showPercentage?: boolean;
  color?: 'full' | 'gradient' | 'simple';
}

export interface SparklineOptions {
  width?: number;
  height?: number;
  min?: number;
  max?: number;
}

export class ASCIICharts {
  // Bar chart characters (from full to empty)
  private static readonly BAR_CHARS = ['█', '▓', '▒', '░'];
  private static readonly SPARKLINE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  /**
   * Create a horizontal bar chart
   */
  static barChart(value: number, max: number, options: BarChartOptions = {}): string {
    const {
      maxWidth = 20,
      showValue = true,
      showPercentage = false,
      color = 'gradient',
    } = options;

    if (max === 0) return '░'.repeat(maxWidth);

    const percentage = Math.min(value / max, 1);
    const filledWidth = Math.floor(percentage * maxWidth);
    const partialChar = Math.floor((percentage * maxWidth - filledWidth) * 4);

    let bar = '';

    if (color === 'full') {
      // Use only full blocks
      bar = '█'.repeat(filledWidth) + '░'.repeat(maxWidth - filledWidth);
    } else if (color === 'gradient') {
      // Use gradient from full to empty
      for (let i = 0; i < maxWidth; i++) {
        if (i < filledWidth) {
          bar += '█';
        } else if (i === filledWidth && partialChar > 0) {
          bar += this.BAR_CHARS[4 - partialChar];
        } else {
          bar += '░';
        }
      }
    } else {
      // Simple mode
      bar = '█'.repeat(filledWidth) + ' '.repeat(maxWidth - filledWidth);
    }

    if (showValue || showPercentage) {
      const valueStr = showValue ? `${value}` : '';
      const percentStr = showPercentage ? ` (${(percentage * 100).toFixed(1)}%)` : '';
      bar += ` ${valueStr}${percentStr}`;
    }

    return bar;
  }

  /**
   * Create a sparkline (miniature line chart)
   */
  static sparkline(values: number[], options: SparklineOptions = {}): string {
    const { width = values.length, min, max } = options;

    if (values.length === 0) return '';

    const dataMin = min ?? Math.min(...values);
    const dataMax = max ?? Math.max(...values);
    const range = dataMax - dataMin || 1;

    // Normalize values to 0-7 range for sparkline chars
    const normalized = values.map(v => {
      const norm = (v - dataMin) / range;
      const index = Math.floor(norm * 7);
      return Math.min(7, Math.max(0, index));
    });

    // If width is less than values length, sample the data
    let sampled = normalized;
    if (width < normalized.length) {
      const step = normalized.length / width;
      sampled = [];
      for (let i = 0; i < width; i++) {
        const index = Math.floor(i * step);
        sampled.push(normalized[index]);
      }
    }

    return sampled.map(i => this.SPARKLINE_CHARS[i]).join('');
  }

  /**
   * Create a vertical bar chart (histogram)
   */
  static histogram(values: number[], options: { height?: number; maxWidth?: number } = {}): string {
    const { height = 5, maxWidth = 20 } = options;

    if (values.length === 0) return '';

    const max = Math.max(...values);
    const rows: string[] = [];

    for (let row = height - 1; row >= 0; row--) {
      const threshold = (max / height) * (row + 1);
      let line = '';

      for (const value of values.slice(0, maxWidth)) {
        if (value >= threshold) {
          line += '█ ';
        } else if (value >= threshold - (max / height) / 2) {
          line += '▄ ';
        } else {
          line += '  ';
        }
      }

      rows.push(line);
    }

    return rows.join('\n');
  }

  /**
   * Create a percentage gauge
   */
  static gauge(value: number, max: number, options: { width?: number } = {}): string {
    const { width = 20 } = options;
    const percentage = Math.min(value / max, 1);

    const filled = Math.floor(percentage * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    const percent = (percentage * 100).toFixed(1);

    return `${bar} ${percent}%`;
  }

  /**
   * Create a status indicator
   */
  static statusIndicator(status: 'active' | 'idle' | 'error' | 'stale' | 'unknown'): string {
    const indicators = {
      active: '● Active',
      idle: '○ Idle',
      error: '✗ Error',
      stale: '◐ Stale',
      unknown: '? Unknown',
    };

    return indicators[status] || indicators.unknown;
  }

  /**
   * Create a health bar with color gradient
   */
  static healthBar(health: number, options: { width?: number } = {}): string {
    const { width = 15 } = options;
    const percentage = Math.min(health, 100) / 100;
    const filled = Math.floor(percentage * width);

    let bar = '';
    for (let i = 0; i < width; i++) {
      if (i < filled) {
        if (percentage > 0.75) bar += '█'; // Healthy
        else if (percentage > 0.5) bar += '▓'; // Moderate
        else if (percentage > 0.25) bar += '▒'; // Warning
        else bar += '░'; // Critical
      } else {
        bar += '░';
      }
    }

    return `${bar} ${health.toFixed(1)}%`;
  }

  /**
   * Create a multi-value stacked bar
   */
  static stackedBar(
    values: { value: number; char?: string }[],
    max: number,
    options: { width?: number } = {}
  ): string {
    const { width = 20 } = options;

    const totalValue = values.reduce((sum, v) => sum + v.value, 0);
    const scale = width / max;

    let bar = '';
    for (const item of values) {
      const segmentWidth = Math.floor(item.value * scale);
      const char = item.char || '█';
      bar += char.repeat(segmentWidth);
    }

    // Fill remaining with empty
    const remaining = width - bar.length;
    if (remaining > 0) {
      bar += '░'.repeat(remaining);
    }

    return bar.substring(0, width);
  }

  /**
   * Format a metric with a trend indicator
   */
  static metricWithTrend(
    current: number,
    previous: number,
    options: { format?: (n: number) => string } = {}
  ): string {
    const { format = (n) => n.toFixed(2) } = options;

    const diff = current - previous;
    const trend = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    const diffStr = Math.abs(diff).toFixed(2);

    return `${format(current)} ${trend} ${diffStr}`;
  }

  /**
   * Create a simple box plot
   */
  static boxPlot(values: number[], options: { width?: number } = {}): string {
    if (values.length === 0) return '';

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    const { width = 40 } = options;
    const range = max - min || 1;

    const scale = (value: number) => Math.floor(((value - min) / range) * width);

    const minPos = 0;
    const q1Pos = scale(q1);
    const medianPos = scale(median);
    const q3Pos = scale(q3);
    const maxPos = width;

    const plot = ' '.repeat(width);
    const plotArr = plot.split('');

    // Draw whiskers
    for (let i = minPos; i < q1Pos; i++) plotArr[i] = '─';
    for (let i = q3Pos; i < maxPos; i++) plotArr[i] = '─';

    // Draw box
    for (let i = q1Pos; i < q3Pos; i++) plotArr[i] = '█';

    // Draw median
    if (medianPos >= 0 && medianPos < width) {
      plotArr[medianPos] = '│';
    }

    // Draw endpoints
    if (minPos >= 0 && minPos < width) plotArr[minPos] = '├';
    if (maxPos - 1 >= 0 && maxPos - 1 < width) plotArr[maxPos - 1] = '┤';

    return plotArr.join('');
  }
}
