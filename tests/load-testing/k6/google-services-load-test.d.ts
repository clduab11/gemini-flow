export function setup(): {
    baseUrl: any;
    wsUrl: any;
    startTime: number;
};
export function streamingLoadTest(data: any): void;
export function videoGenerationTest(data: any): void;
export function imageGenerationTest(data: any): void;
export function audioProcessingTest(data: any): void;
export function mixedWorkloadTest(data: any): void;
export function teardown(data: any): void;
export namespace options {
    namespace scenarios {
        namespace streaming_load {
            let executor: string;
            let startVUs: number;
            let stages: {
                duration: any;
                target: number;
            }[];
            let exec: string;
            namespace tags {
                let test_type: string;
            }
        }
        namespace video_generation_stress {
            let executor_1: string;
            export { executor_1 as executor };
            export let vus: number;
            export { TEST_DURATION as duration };
            let exec_1: string;
            export { exec_1 as exec };
            export namespace tags_1 {
                let test_type_1: string;
                export { test_type_1 as test_type };
            }
            export { tags_1 as tags };
        }
        namespace image_generation_burst {
            let executor_2: string;
            export { executor_2 as executor };
            export let startRate: number;
            export let timeUnit: string;
            let stages_1: {
                duration: string;
                target: number;
            }[];
            export { stages_1 as stages };
            let exec_2: string;
            export { exec_2 as exec };
            export namespace tags_2 {
                let test_type_2: string;
                export { test_type_2 as test_type };
            }
            export { tags_2 as tags };
        }
        namespace audio_processing_load {
            let executor_3: string;
            export { executor_3 as executor };
            export let rate: number;
            let timeUnit_1: string;
            export { timeUnit_1 as timeUnit };
            export { TEST_DURATION as duration };
            export let preAllocatedVUs: number;
            let exec_3: string;
            export { exec_3 as exec };
            export namespace tags_3 {
                let test_type_3: string;
                export { test_type_3 as test_type };
            }
            export { tags_3 as tags };
        }
        namespace mixed_workload {
            let executor_4: string;
            export { executor_4 as executor };
            let vus_1: number;
            export { vus_1 as vus };
            export let iterations: number;
            let exec_4: string;
            export { exec_4 as exec };
            export namespace tags_4 {
                let test_type_4: string;
                export { test_type_4 as test_type };
            }
            export { tags_4 as tags };
        }
    }
    namespace thresholds {
        let http_req_duration: string[];
        let http_req_failed: string[];
        let streaming_latency: string[];
        let video_generation_time: string[];
        let image_generation_time: string[];
        let audio_generation_time: string[];
        let error_rate: string[];
    }
    namespace ext {
        namespace loadimpact {
            let projectID: number;
            let name: string;
        }
    }
}
declare const TEST_DURATION: any;
export {};
//# sourceMappingURL=google-services-load-test.d.ts.map