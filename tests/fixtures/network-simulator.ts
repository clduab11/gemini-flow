/**
 * Network Simulator for Integration Testing
 * 
 * Provides realistic network condition simulation including latency,
 * packet loss, bandwidth throttling, and jitter for testing Google
 * Services integration under various network conditions.
 */

import { EventEmitter } from 'events';
import express, { Express, Request, Response } from 'express';
import http from 'http';
import { promisify } from 'util';

export interface NetworkProfile {
  name: string;
  latency: number; // ms
  bandwidth: number; // bps
  packetLoss: number; // 0-1 probability
  jitter: number; // ms variance
  corruption: number; // 0-1 probability of data corruption
  duplication: number; // 0-1 probability of packet duplication
}

export interface NetworkConditions {
  downloadBandwidth: number; // bps
  uploadBandwidth: number; // bps
  latency: number; // ms
  packetLoss: number; // 0-1
  jitter: number; // ms
  corruption: number; // 0-1
}

export interface SimulationSession {
  id: string;
  profile: string;
  startTime: Date;
  duration?: number;
  conditions: NetworkConditions;
  metrics: SessionMetrics;
}

export interface SessionMetrics {
  packetsTransmitted: number;
  packetsReceived: number;
  packetsLost: number;
  packetsCorrupted: number;
  packetsDuplicated: number;
  averageLatency: number;
  jitterVariance: number;
  throughput: {
    download: number;
    upload: number;
  };
}

export class NetworkSimulator extends EventEmitter {
  private app: Express;
  private server: http.Server | null = null;
  private sessions: Map<string, SimulationSession> = new Map();
  private currentProfile: NetworkProfile;
  private isActive: boolean = false;
  
  private readonly profiles: Record<string, NetworkProfile> = {
    ideal: {
      name: 'ideal',
      latency: 5,
      bandwidth: 1000000000, // 1Gbps
      packetLoss: 0,
      jitter: 1,
      corruption: 0,
      duplication: 0
    },
    
    broadband: {
      name: 'broadband',
      latency: 20,
      bandwidth: 100000000, // 100Mbps
      packetLoss: 0.001,
      jitter: 5,
      corruption: 0.0001,
      duplication: 0
    },
    
    mobile_4g: {
      name: 'mobile_4g',
      latency: 50,
      bandwidth: 50000000, // 50Mbps
      packetLoss: 0.01,
      jitter: 20,
      corruption: 0.001,
      duplication: 0.001
    },
    
    mobile_3g: {
      name: 'mobile_3g',
      latency: 150,
      bandwidth: 2000000, // 2Mbps
      packetLoss: 0.02,
      jitter: 50,
      corruption: 0.002,
      duplication: 0.002
    },
    
    satellite: {
      name: 'satellite',
      latency: 600,
      bandwidth: 10000000, // 10Mbps
      packetLoss: 0.005,
      jitter: 100,
      corruption: 0.001,
      duplication: 0.001
    },
    
    degraded: {
      name: 'degraded',
      latency: 300,
      bandwidth: 100000, // 100Kbps
      packetLoss: 0.05,
      jitter: 100,
      corruption: 0.01,
      duplication: 0.005
    },
    
    poor: {
      name: 'poor',
      latency: 1000,
      bandwidth: 56000, // 56Kbps (dial-up speed)
      packetLoss: 0.1,
      jitter: 200,
      corruption: 0.02,
      duplication: 0.01
    }
  };
  
  constructor(
    private config: {
      profiles?: Record<string, NetworkProfile>;
      defaultProfile?: string;
      port?: number;
    } = {}
  ) {
    super();
    
    // Merge custom profiles
    if (config.profiles) {
      Object.assign(this.profiles, config.profiles);
    }
    
    this.currentProfile = this.profiles[config.defaultProfile || 'ideal'];
    this.app = express();
    this.setupAPI();
  }
  
  async start(port: number = 9090): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        this.isActive = true;
        console.log(`Network Simulator API listening on port ${port}`);
        this.emit('started', { port });
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }
  
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.isActive = false;
      
      if (this.server) {
        this.server.close(() => {
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  async setProfile(profileName: string): Promise<void> {
    const profile = this.profiles[profileName];
    if (!profile) {
      throw new Error(`Profile '${profileName}' not found`);
    }
    
    const previousProfile = this.currentProfile.name;
    this.currentProfile = profile;
    
    this.emit('profileChanged', {
      from: previousProfile,
      to: profileName,
      conditions: this.getNetworkConditions()
    });
    
    // Simulate network reconfiguration delay
    await this.delay(100);
  }
  
  getCurrentProfile(): NetworkProfile {
    return { ...this.currentProfile };
  }
  
  getAvailableProfiles(): string[] {
    return Object.keys(this.profiles);
  }
  
  getNetworkConditions(): NetworkConditions {
    return {
      downloadBandwidth: this.currentProfile.bandwidth,
      uploadBandwidth: this.currentProfile.bandwidth * 0.8, // Typical asymmetry
      latency: this.currentProfile.latency,
      packetLoss: this.currentProfile.packetLoss,
      jitter: this.currentProfile.jitter,
      corruption: this.currentProfile.corruption
    };
  }
  
  /**
   * Create a simulation session for testing
   */
  async createSession(options: {
    profileName?: string;
    duration?: number;
    customConditions?: Partial<NetworkConditions>;
  } = {}): Promise<string> {
    const sessionId = this.generateSessionId();
    const profile = options.profileName ? this.profiles[options.profileName] : this.currentProfile;
    
    if (!profile) {
      throw new Error(`Profile '${options.profileName}' not found`);
    }
    
    const conditions = {
      downloadBandwidth: profile.bandwidth,
      uploadBandwidth: profile.bandwidth * 0.8,
      latency: profile.latency,
      packetLoss: profile.packetLoss,
      jitter: profile.jitter,
      corruption: profile.corruption,
      ...options.customConditions
    };
    
    const session: SimulationSession = {
      id: sessionId,
      profile: profile.name,
      startTime: new Date(),
      duration: options.duration,
      conditions,
      metrics: {
        packetsTransmitted: 0,
        packetsReceived: 0,
        packetsLost: 0,
        packetsCorrupted: 0,
        packetsDuplicated: 0,
        averageLatency: 0,
        jitterVariance: 0,
        throughput: { download: 0, upload: 0 }
      }
    };
    
    this.sessions.set(sessionId, session);
    
    // Auto-cleanup session if duration is specified
    if (options.duration) {
      setTimeout(() => {
        this.endSession(sessionId);
      }, options.duration);
    }
    
    this.emit('sessionCreated', { sessionId, conditions });
    
    return sessionId;
  }
  
  /**
   * End a simulation session
   */
  async endSession(sessionId: string): Promise<SessionMetrics | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    this.sessions.delete(sessionId);
    this.emit('sessionEnded', { sessionId, metrics: session.metrics });
    
    return session.metrics;
  }
  
  /**
   * Simulate network request with current conditions
   */
  async simulateRequest(options: {
    size: number; // bytes
    direction: 'upload' | 'download';
    sessionId?: string;
  }): Promise<{
    success: boolean;
    actualLatency: number;
    throughput: number;
    corrupted: boolean;
    duplicated: boolean;
    error?: string;
  }> {
    const { size, direction, sessionId } = options;
    const session = sessionId ? this.sessions.get(sessionId) : null;
    const conditions = session?.conditions || this.getNetworkConditions();
    
    // Simulate packet loss
    if (Math.random() < conditions.packetLoss) {
      this.updateSessionMetrics(sessionId, 'lost');
      return {
        success: false,
        actualLatency: 0,
        throughput: 0,
        corrupted: false,
        duplicated: false,
        error: 'Packet lost'
      };
    }
    
    // Calculate actual latency with jitter
    const jitterVariation = (Math.random() - 0.5) * conditions.jitter * 2;
    const actualLatency = Math.max(0, conditions.latency + jitterVariation);
    
    // Calculate throughput based on bandwidth
    const bandwidth = direction === 'download' ? conditions.downloadBandwidth : conditions.uploadBandwidth;
    const transmissionTime = (size * 8) / bandwidth * 1000; // Convert to milliseconds
    
    // Simulate data corruption
    const corrupted = Math.random() < conditions.corruption;
    
    // Simulate packet duplication
    const duplicated = Math.random() < (this.currentProfile.duplication || 0);
    
    // Apply delay
    const totalDelay = actualLatency + transmissionTime;
    await this.delay(totalDelay);
    
    // Update session metrics
    this.updateSessionMetrics(sessionId, 'success', {
      latency: actualLatency,
      throughput: bandwidth,
      corrupted,
      duplicated
    });
    
    return {
      success: true,
      actualLatency,
      throughput: size / (totalDelay / 1000), // bytes per second
      corrupted,
      duplicated
    };
  }
  
  /**
   * Simulate gradual network degradation
   */
  async simulateDegradation(options: {
    fromProfile: string;
    toProfile: string;
    duration: number; // milliseconds
    steps?: number;
  }): Promise<void> {
    const { fromProfile, toProfile, duration, steps = 10 } = options;
    
    const from = this.profiles[fromProfile];
    const to = this.profiles[toProfile];
    
    if (!from || !to) {
      throw new Error('Invalid profile names');
    }
    
    const stepDuration = duration / steps;
    
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      
      // Interpolate network conditions
      const interpolatedProfile: NetworkProfile = {
        name: `degradation_step_${i}`,
        latency: this.interpolate(from.latency, to.latency, progress),
        bandwidth: this.interpolate(from.bandwidth, to.bandwidth, progress),
        packetLoss: this.interpolate(from.packetLoss, to.packetLoss, progress),
        jitter: this.interpolate(from.jitter, to.jitter, progress),
        corruption: this.interpolate(from.corruption, to.corruption, progress),
        duplication: this.interpolate(from.duplication || 0, to.duplication || 0, progress)
      };
      
      this.currentProfile = interpolatedProfile;
      this.emit('degradationStep', { step: i, progress, conditions: this.getNetworkConditions() });
      
      await this.delay(stepDuration);
    }
    
    // Set final profile
    this.currentProfile = to;
    this.emit('degradationComplete', { finalProfile: toProfile });
  }
  
  private setupAPI(): void {
    this.app.use(express.json());
    
    // Get current profile
    this.app.get('/profile', (req, res) => {
      res.json({
        current: this.currentProfile.name,
        conditions: this.getNetworkConditions(),
        available: this.getAvailableProfiles()
      });
    });
    
    // Set profile
    this.app.post('/profile/:name', async (req, res) => {
      try {
        await this.setProfile(req.params.name);
        res.json({ success: true, profile: this.currentProfile.name });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    });
    
    // Create session
    this.app.post('/session', async (req, res) => {
      try {
        const sessionId = await this.createSession(req.body);
        res.json({ sessionId });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    });
    
    // End session
    this.app.delete('/session/:id', async (req, res) => {
      const metrics = await this.endSession(req.params.id);
      if (metrics) {
        res.json({ metrics });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    });
    
    // Simulate request
    this.app.post('/simulate', async (req, res) => {
      try {
        const result = await this.simulateRequest(req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    });
    
    // Start degradation
    this.app.post('/degradation', async (req, res) => {
      try {
        // Run degradation in background
        this.simulateDegradation(req.body).catch(error => {
          this.emit('error', error);
        });
        res.json({ success: true, message: 'Degradation started' });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    });
    
    // Get metrics
    this.app.get('/metrics', (req, res) => {
      const allMetrics = Array.from(this.sessions.entries()).map(([id, session]) => ({
        sessionId: id,
        profile: session.profile,
        duration: Date.now() - session.startTime.getTime(),
        metrics: session.metrics
      }));
      
      res.json({
        activeSessions: this.sessions.size,
        currentProfile: this.currentProfile.name,
        sessions: allMetrics
      });
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: this.isActive ? 'active' : 'inactive',
        uptime: process.uptime(),
        currentProfile: this.currentProfile.name,
        activeSessions: this.sessions.size
      });
    });
  }
  
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private interpolate(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
  }
  
  private updateSessionMetrics(
    sessionId: string | undefined,
    result: 'success' | 'lost' | 'corrupted',
    data?: {
      latency?: number;
      throughput?: number;
      corrupted?: boolean;
      duplicated?: boolean;
    }
  ): void {
    if (!sessionId) return;
    
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const metrics = session.metrics;
    metrics.packetsTransmitted++;
    
    switch (result) {
      case 'success':
        metrics.packetsReceived++;
        if (data) {
          if (data.latency !== undefined) {
            metrics.averageLatency = (metrics.averageLatency * (metrics.packetsReceived - 1) + data.latency) / metrics.packetsReceived;
          }
          if (data.throughput !== undefined) {
            metrics.throughput.download = data.throughput;
          }
          if (data.corrupted) {
            metrics.packetsCorrupted++;
          }
          if (data.duplicated) {
            metrics.packetsDuplicated++;
          }
        }
        break;
        
      case 'lost':
        metrics.packetsLost++;
        break;
        
      case 'corrupted':
        metrics.packetsReceived++;
        metrics.packetsCorrupted++;
        break;
    }
  }
  
  /**
   * Create custom network profile
   */
  addProfile(name: string, profile: Omit<NetworkProfile, 'name'>): void {
    this.profiles[name] = { ...profile, name };
  }
  
  /**
   * Remove custom network profile
   */
  removeProfile(name: string): boolean {
    if (this.currentProfile.name === name) {
      throw new Error('Cannot remove currently active profile');
    }
    
    return delete this.profiles[name];
  }
  
  /**
   * Get session metrics
   */
  getSessionMetrics(sessionId: string): SessionMetrics | null {
    const session = this.sessions.get(sessionId);
    return session ? { ...session.metrics } : null;
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.sessions.clear();
    this.emit('metricsReset');
  }
}

export default NetworkSimulator;
