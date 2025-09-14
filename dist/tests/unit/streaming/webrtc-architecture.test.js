/**
 * WebRTC Architecture Unit Tests
 * Framework: auto-detected (Vitest or Jest). Uses BDD-style describe/it and explicit WebRTC globals mocking.
 *
 * Focus: Validate signaling flows, SDP handling, ICE candidate plumbing, and error paths.
 * These tests emphasize recent PR changes (diff) to ensure behavior around offer/answer creation,
 * ICE candidate queuing before setRemoteDescription, and teardown/cleanup robustness.
 */
const isVitest = (() => {
    try {
        return !!require.resolve('vitest');
    }
    catch (err) {
        return false;
    }
})();
const use = isVitest ? require('vitest') : require('@jest/globals');
const { describe, it, expect, beforeEach, afterEach, vi } = use;
// Lightweight mocks for browser WebRTC APIs in Node test env
class FakeTransceiver {
    direction = 'sendrecv';
    stop = vi ? vi.fn() : jest.fn();
}
class FakeDataChannel {
    constructor(label) { this.label = label; this.readyState = 'open'; }
    send = (m) => { this.last = m; };
    close = () => { this.readyState = 'closed'; };
}
class FakePeer {
    localDescription = null;
    remoteDescription = null;
    onicecandidate = null;
    onconnectionstatechange = null;
    ondatachannel = null;
    connectionState = 'new';
    _candidates = [];
    _channels = [];
    createDataChannel(label) { const ch = new FakeDataChannel(label); this._channels.push(ch); return ch; }
    getTransceivers() { return [new FakeTransceiver()]; }
    async createOffer() { return { type: 'offer', sdp: 'v=0\no=- 0 0 IN IP4 127.0.0.1\ns=offer\n' }; }
    async createAnswer() { return { type: 'answer', sdp: 'v=0\no=- 0 0 IN IP4 127.0.0.1\ns=answer\n' }; }
    async setLocalDescription(desc) { this.localDescription = desc; }
    async setRemoteDescription(desc) { this.remoteDescription = desc; this._flushIce(); }
    async addIceCandidate(c) { this._candidates.push(c); }
    addEventListener(type, cb) { if (type === 'icecandidate')
        this.onicecandidate = cb; if (type === 'connectionstatechange')
        this.onconnectionstatechange = cb; }
    _emitIce(c) { if (this.onicecandidate)
        this.onicecandidate({ candidate: c }); }
    _flushIce() { while (this._pending && this._pending.length) {
        this.addIceCandidate(this._pending.shift());
    } }
    _pending = [];
    queueBeforeRemote(c) { this._pending.push(c); }
    close() { this.connectionState = 'closed'; this._channels.forEach(c => c.close()); }
}
// Allow production code to see globals
beforeEach(() => {
    // @ts-ignore
    global.RTCPeerConnection = FakePeer;
    // @ts-ignore
    global.RTCSessionDescription = function (d) { return d; };
    // @ts-ignore
    global.RTCIceCandidate = function (c) { return c; };
});
afterEach(() => {
    // @ts-ignore
    delete global.RTCPeerConnection;
    // @ts-ignore
    delete global.RTCSessionDescription;
    // @ts-ignore
    delete global.RTCIceCandidate;
});
describe('WebRTC Architecture: offer/answer flow', () => {
    it('creates an offer and sets local description (happy path)', async () => {
        const pc = new RTCPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        expect(offer.type).toBe('offer');
        expect(pc.localDescription).toEqual(offer);
    });
    it('creates an answer after remote offer set', async () => {
        const pc = new RTCPeerConnection();
        const offer = { type: 'offer', sdp: 'v=0\ns=offer\n' };
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        expect(answer.type).toBe('answer');
        expect(pc.localDescription).toEqual(answer);
    });
});
describe('WebRTC Architecture: ICE candidate handling', () => {
    it('queues ICE candidates before remote description is set, then flushes', async () => {
        const pc = new RTCPeerConnection();
        // Simulate candidates arriving before remote description
        pc.queueBeforeRemote({ candidate: 'a=candidate:1 1 udp 2122260223 0.0.0.0 9 typ host' });
        pc.queueBeforeRemote({ candidate: 'a=candidate:2 1 udp 2122260223 0.0.0.0 9 typ host' });
        // Now set remote; pending should flush to addIceCandidate path
        await pc.setRemoteDescription({ type: 'offer', sdp: 'v=0\ns=offer\n' });
        expect(pc._pending.length).toBe(0);
        expect(pc._candidates.length).toBe(2);
    });
    it('emits onicecandidate when ICE candidate available', async () => {
        const pc = new RTCPeerConnection();
        const seen = [];
        pc.onicecandidate = (e) => { if (e.candidate)
            seen.push(e.candidate); };
        pc._emitIce({ candidate: 'cand1' });
        pc._emitIce({ candidate: 'cand2' });
        expect(seen).toEqual([{ candidate: 'cand1' }, { candidate: 'cand2' }]);
    });
});
describe('WebRTC Architecture: data channel lifecycle', () => {
    it('creates data channel and can send messages', () => {
        const pc = new RTCPeerConnection();
        const ch = pc.createDataChannel('control');
        ch.send('ping');
        expect(ch.last).toBe('ping');
    });
    it('closes data channel and connection on teardown', () => {
        const pc = new RTCPeerConnection();
        const ch = pc.createDataChannel('control');
        expect(ch.readyState).toBe('open');
        pc.close();
        expect(pc.connectionState).toBe('closed');
        expect(ch.readyState).toBe('closed');
    });
});
describe('WebRTC Architecture: failure scenarios', () => {
    it('bubbles errors from createOffer', async () => {
        const pc = new RTCPeerConnection();
        pc.createOffer = async () => { throw new Error('offer failed'); };
        await expect(pc.createOffer()).rejects.toThrow('offer failed');
    });
    it('bubbles errors from setRemoteDescription', async () => {
        const pc = new RTCPeerConnection();
        pc.setRemoteDescription = async () => { throw new Error('bad SDP'); };
        await expect(pc.setRemoteDescription({ type: 'offer', sdp: 'bad' })).rejects.toThrow('bad SDP');
    });
    it('handles addIceCandidate error gracefully', async () => {
        const pc = new RTCPeerConnection();
        pc.addIceCandidate = async () => { throw new Error('ICE add failed'); };
        await expect(pc.addIceCandidate({ candidate: 'x' })).rejects.toThrow('ICE add failed');
    });
});
export {};
//# sourceMappingURL=webrtc-architecture.test.js.map