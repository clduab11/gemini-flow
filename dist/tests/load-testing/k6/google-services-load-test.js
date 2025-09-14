/**
 * K6 Load Testing Configuration for Google Services Integration
 *
 * Comprehensive load testing scenarios for Google AI services including
 * streaming APIs, video generation, image creation, and audio processing.
 */
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
// Custom Metrics
const streamingLatency = new Trend('streaming_latency', true);
const videoGenerationTime = new Trend('video_generation_time', true);
const imageGenerationTime = new Trend('image_generation_time', true);
const audioGenerationTime = new Trend('audio_generation_time', true);
const errorRate = new Rate('error_rate');
const concurrentUsers = new Gauge('concurrent_users');
const throughputCounter = new Counter('requests_per_second');
// Test Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080';
const TEST_DURATION = __ENV.TEST_DURATION || '5m';
const MAX_VUS = parseInt(__ENV.MAX_VUS || '50');
const RAMP_DURATION = __ENV.RAMP_DURATION || '1m';
// Test Scenarios
export const options = {
    scenarios: {
        // Streaming API Load Test
        streaming_load: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: RAMP_DURATION, target: Math.floor(MAX_VUS * 0.3) },
                { duration: TEST_DURATION, target: Math.floor(MAX_VUS * 0.3) },
                { duration: '30s', target: 0 }
            ],
            exec: 'streamingLoadTest',
            tags: { test_type: 'streaming' }
        },
        // Video Generation Stress Test
        video_generation_stress: {
            executor: 'constant-vus',
            vus: Math.floor(MAX_VUS * 0.2),
            duration: TEST_DURATION,
            exec: 'videoGenerationTest',
            tags: { test_type: 'video_generation' }
        },
        // Image Generation Burst Test
        image_generation_burst: {
            executor: 'ramping-arrival-rate',
            startRate: 1,
            timeUnit: '1s',
            stages: [
                { duration: '30s', target: 5 },
                { duration: '1m', target: 20 },
                { duration: '30s', target: 50 },
                { duration: '1m', target: 20 },
                { duration: '30s', target: 5 }
            ],
            exec: 'imageGenerationTest',
            tags: { test_type: 'image_generation' }
        },
        // Audio Processing Load Test
        audio_processing_load: {
            executor: 'constant-arrival-rate',
            rate: 10,
            timeUnit: '1s',
            duration: TEST_DURATION,
            preAllocatedVUs: Math.floor(MAX_VUS * 0.2),
            exec: 'audioProcessingTest',
            tags: { test_type: 'audio_processing' }
        },
        // Mixed Workload Scenario
        mixed_workload: {
            executor: 'per-vu-iterations',
            vus: Math.floor(MAX_VUS * 0.3),
            iterations: 10,
            exec: 'mixedWorkloadTest',
            tags: { test_type: 'mixed_workload' }
        }
    },
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
        http_req_failed: ['rate<0.05'], // Less than 5% error rate
        streaming_latency: ['p(95)<500'], // 95% of streaming requests under 500ms
        video_generation_time: ['p(95)<30000'], // 95% of video generation under 30s
        image_generation_time: ['p(95)<5000'], // 95% of image generation under 5s
        audio_generation_time: ['p(95)<10000'], // 95% of audio generation under 10s
        error_rate: ['rate<0.1'] // Less than 10% overall error rate
    },
    ext: {
        loadimpact: {
            projectID: 3506079,
            name: 'Google Services Integration Load Test'
        }
    }
};
// Test Data
const TEST_PROMPTS = {
    video: [
        'Create a professional product demonstration video',
        'Generate a cinematic landscape sequence',
        'Produce an animated explainer video',
        'Create a time-lapse construction video',
        'Generate a corporate presentation video'
    ],
    image: [
        'Generate a high-resolution product photo',
        'Create a technical diagram illustration',
        'Produce a scientific research figure',
        'Generate a marketing banner design',
        'Create an infographic visualization'
    ],
    audio: [
        'Synthesize professional narration voice',
        'Generate uplifting background music',
        'Create ambient soundscape audio',
        'Produce podcast intro music',
        'Generate nature sounds ambiance'
    ]
};
// Setup Function
export function setup() {
    console.log('🚀 Starting Google Services Load Test');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Max VUs: ${MAX_VUS}`);
    console.log(`Test Duration: ${TEST_DURATION}`);
    // Health check
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
        'health check status is 200': (r) => r.status === 200
    });
    return {
        baseUrl: BASE_URL,
        wsUrl: WS_URL,
        startTime: Date.now()
    };
}
// Streaming API Load Test
export function streamingLoadTest(data) {
    group('Streaming API Load Test', function () {
        concurrentUsers.add(1);
        // Create streaming session
        const sessionPayload = {
            type: 'multimodal',
            userId: `user-${__VU}-${__ITER}`,
            userPreferences: { qualityPriority: 'balanced' },
            deviceCapabilities: { cpu: { cores: 4 } },
            networkConditions: { bandwidth: { download: 10000000 } }
        };
        const sessionStart = Date.now();
        const sessionRes = http.post(`${BASE_URL}/v1/streaming/sessions`, JSON.stringify(sessionPayload), {
            headers: { 'Content-Type': 'application/json' }
        });
        const sessionCreated = check(sessionRes, {
            'session created successfully': (r) => r.status === 200,
            'session has valid response': (r) => r.json('success') === true
        });
        if (sessionCreated) {
            const sessionId = sessionRes.json('data.id');
            const sessionLatency = Date.now() - sessionStart;
            streamingLatency.add(sessionLatency);
            // Start video stream
            const videoStreamPayload = {
                id: `stream-${__VU}-${__ITER}`,
                source: 'camera',
                quality: { level: 'medium' },
                constraints: { video: { width: { ideal: 1280 }, height: { ideal: 720 } } }
            };
            const videoStreamRes = http.post(`${BASE_URL}/v1/streaming/sessions/${sessionId}/video`, JSON.stringify(videoStreamPayload), { headers: { 'Content-Type': 'application/json' } });
            check(videoStreamRes, {
                'video stream started': (r) => r.status === 200,
                'video stream response valid': (r) => r.json('success') === true
            });
            // Simulate streaming duration
            sleep(randomIntBetween(2, 5));
            // WebSocket streaming test
            testWebSocketStreaming(data.wsUrl, sessionId);
            // End session
            const endRes = http.del(`${BASE_URL}/v1/streaming/sessions/${sessionId}`);
            check(endRes, {
                'session ended successfully': (r) => r.status === 200
            });
        }
        throughputCounter.add(1);
        errorRate.add(!sessionCreated);
        concurrentUsers.add(-1);
    });
}
// Video Generation Test
export function videoGenerationTest(data) {
    group('Video Generation Test', function () {
        const prompt = TEST_PROMPTS.video[randomIntBetween(0, TEST_PROMPTS.video.length - 1)];
        const videoPayload = {
            prompt: prompt,
            duration: randomIntBetween(5000, 15000),
            quality: ['low', 'medium', 'high'][randomIntBetween(0, 2)],
            style: {
                type: ['realistic', 'animated', 'cinematic'][randomIntBetween(0, 2)],
                mood: 'professional'
            }
        };
        const startTime = Date.now();
        const videoRes = http.post(`${BASE_URL}/v1/video:generate`, JSON.stringify(videoPayload), {
            headers: { 'Content-Type': 'application/json' },
            timeout: '60s'
        });
        const videoSuccess = check(videoRes, {
            'video generation started': (r) => r.status === 200,
            'video generation response valid': (r) => r.json('success') === true,
            'video ID provided': (r) => r.json('data.videoId') !== undefined
        });
        if (videoSuccess) {
            const videoId = videoRes.json('data.videoId');
            // Poll for completion
            let completed = false;
            let attempts = 0;
            const maxAttempts = 30;
            while (!completed && attempts < maxAttempts) {
                sleep(2);
                attempts++;
                const statusRes = http.get(`${BASE_URL}/v1/video/${videoId}/status`);
                const status = statusRes.json('status');
                if (status === 'completed') {
                    completed = true;
                    const totalTime = Date.now() - startTime;
                    videoGenerationTime.add(totalTime);
                    // Test download
                    const downloadRes = http.get(`${BASE_URL}/v1/video/${videoId}/download`, {
                        timeout: '30s'
                    });
                    check(downloadRes, {
                        'video download successful': (r) => r.status === 200,
                        'video file not empty': (r) => r.body.length > 0
                    });
                }
                else if (status === 'failed') {
                    completed = true;
                    errorRate.add(1);
                }
            }
            if (!completed) {
                errorRate.add(1);
                console.warn(`Video generation timeout for ${videoId}`);
            }
        }
        else {
            errorRate.add(1);
        }
        throughputCounter.add(1);
    });
}
// Image Generation Test
export function imageGenerationTest(data) {
    group('Image Generation Test', function () {
        const prompt = TEST_PROMPTS.image[randomIntBetween(0, TEST_PROMPTS.image.length - 1)];
        const imagePayload = {
            prompt: prompt,
            style: ['realistic', 'artistic', 'technical_diagram'][randomIntBetween(0, 2)],
            format: ['png', 'jpg', 'webp'][randomIntBetween(0, 2)],
            dimensions: {
                width: [512, 1024, 2048][randomIntBetween(0, 2)],
                height: [512, 1024, 2048][randomIntBetween(0, 2)]
            }
        };
        const startTime = Date.now();
        const imageRes = http.post(`${BASE_URL}/v1/images:generate`, JSON.stringify(imagePayload), {
            headers: { 'Content-Type': 'application/json' },
            timeout: '30s'
        });
        const imageSuccess = check(imageRes, {
            'image generation successful': (r) => r.status === 200,
            'image generation response valid': (r) => r.json('success') === true,
            'image URL provided': (r) => r.json('data.imageUrl') !== undefined
        });
        if (imageSuccess) {
            const generationTime = Date.now() - startTime;
            imageGenerationTime.add(generationTime);
            const imageId = imageRes.json('data.imageId');
            // Test image download
            const downloadRes = http.get(`${BASE_URL}/v1/images/${imageId}`, {
                timeout: '15s'
            });
            check(downloadRes, {
                'image download successful': (r) => r.status === 200,
                'image file not empty': (r) => r.body.length > 0,
                'correct content type': (r) => r.headers['Content-Type'].includes('image')
            });
        }
        else {
            errorRate.add(1);
        }
        throughputCounter.add(1);
    });
}
// Audio Processing Test
export function audioProcessingTest(data) {
    group('Audio Processing Test', function () {
        // Test both speech synthesis and music generation
        const testType = randomIntBetween(0, 1) === 0 ? 'speech' : 'music';
        if (testType === 'speech') {
            testSpeechSynthesis();
        }
        else {
            testMusicGeneration();
        }
        throughputCounter.add(1);
    });
}
// Mixed Workload Test
export function mixedWorkloadTest(data) {
    group('Mixed Workload Test', function () {
        const workloadTypes = ['streaming', 'video', 'image', 'audio'];
        const selectedType = workloadTypes[randomIntBetween(0, workloadTypes.length - 1)];
        switch (selectedType) {
            case 'streaming':
                streamingLoadTest(data);
                break;
            case 'video':
                videoGenerationTest(data);
                break;
            case 'image':
                imageGenerationTest(data);
                break;
            case 'audio':
                audioProcessingTest(data);
                break;
        }
        // Add some variation in timing
        sleep(randomIntBetween(1, 3));
    });
}
// Helper Functions
function testWebSocketStreaming(wsUrl, sessionId) {
    const wsEndpoint = `${wsUrl}/stream?sessionId=${sessionId}`;
    const wsRes = ws.connect(wsEndpoint, {}, function (socket) {
        socket.on('open', function () {
            // Start streaming
            socket.send(JSON.stringify({
                type: 'start_stream',
                streamId: `ws-stream-${__VU}-${__ITER}`,
                mediaType: 'video',
                duration: 5000
            }));
        });
        let chunkCount = 0;
        socket.on('message', function (message) {
            const data = JSON.parse(message);
            if (data.type === 'stream_chunk') {
                chunkCount++;
            }
            else if (data.type === 'stream_complete') {
                socket.close();
            }
        });
        socket.setTimeout(function () {
            socket.close();
        }, 10000);
    });
    check(wsRes, {
        'websocket connection successful': (r) => r && r.status === 101
    });
}
function testSpeechSynthesis() {
    const prompt = TEST_PROMPTS.audio[randomIntBetween(0, TEST_PROMPTS.audio.length - 1)];
    const speechPayload = {
        text: prompt,
        voice: ['professional', 'conversational', 'narrator'][randomIntBetween(0, 2)],
        language: 'en-US',
        speed: 1.0,
        emotion: ['neutral', 'confident', 'friendly'][randomIntBetween(0, 2)]
    };
    const startTime = Date.now();
    const speechRes = http.post(`${BASE_URL}/v1/speech:synthesize`, JSON.stringify(speechPayload), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '20s'
    });
    const speechSuccess = check(speechRes, {
        'speech synthesis successful': (r) => r.status === 200,
        'speech synthesis response valid': (r) => r.json('success') === true,
        'audio content provided': (r) => r.json('data.audioContent') !== undefined
    });
    if (speechSuccess) {
        const generationTime = Date.now() - startTime;
        audioGenerationTime.add(generationTime);
    }
    else {
        errorRate.add(1);
    }
}
function testMusicGeneration() {
    const musicPayload = {
        style: ['corporate', 'cinematic', 'uplifting', 'dramatic'][randomIntBetween(0, 3)],
        mood: 'professional',
        duration: randomIntBetween(10000, 30000),
        instruments: ['piano', 'strings'],
        tempo: randomIntBetween(80, 140)
    };
    const startTime = Date.now();
    const musicRes = http.post(`${BASE_URL}/v1/music:generate`, JSON.stringify(musicPayload), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '45s'
    });
    const musicSuccess = check(musicRes, {
        'music generation started': (r) => r.status === 200,
        'music generation response valid': (r) => r.json('success') === true,
        'music ID provided': (r) => r.json('data.musicId') !== undefined
    });
    if (musicSuccess) {
        const musicId = musicRes.json('data.musicId');
        // Poll for completion (simplified)
        let attempts = 0;
        let completed = false;
        while (!completed && attempts < 10) {
            sleep(3);
            attempts++;
            const statusRes = http.get(`${BASE_URL}/v1/music/${musicId}/status`);
            const status = statusRes.json('status');
            if (status === 'completed') {
                completed = true;
                const totalTime = Date.now() - startTime;
                audioGenerationTime.add(totalTime);
            }
            else if (status === 'failed') {
                completed = true;
                errorRate.add(1);
            }
        }
    }
    else {
        errorRate.add(1);
    }
}
// Teardown Function
export function teardown(data) {
    const testDuration = Date.now() - data.startTime;
    console.log(`✅ Google Services Load Test completed in ${testDuration}ms`);
    // Final health check
    const healthRes = http.get(`${BASE_URL}/health`);
    console.log(`Final health status: ${healthRes.status}`);
}
//# sourceMappingURL=google-services-load-test.js.map