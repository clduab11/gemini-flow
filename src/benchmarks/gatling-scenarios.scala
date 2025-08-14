package googleservices.performance

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import scala.util.Random

/**
 * Gatling Performance Testing Scenarios for Google Services
 * 
 * Comprehensive load testing configurations with advanced scenarios
 * including spike testing, sustained load, and soak testing
 */
class GoogleServicesPerformanceSimulation extends Simulation {

  // Configuration
  val baseUrl = System.getProperty("base.url", "https://api.google.com")
  val apiKey = System.getProperty("api.key", "")
  val testDuration = System.getProperty("test.duration", "10").toInt.minutes
  
  // HTTP Protocol Configuration
  val httpProtocol = http
    .baseUrl(baseUrl)
    .header("Authorization", s"Bearer $apiKey")
    .header("Content-Type", "application/json")
    .header("Accept", "application/json")
    .acceptHeader("application/json")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .acceptEncodingHeader("gzip, deflate")
    .userAgentHeader("Gatling Performance Test Agent/1.0")
    .keepAliveHeader("keep-alive")
    .connectionHeader("keep-alive")
    .disableCaching

  // Custom Feeders for Test Data
  val streamingApiFeeder = Iterator.continually(Map(
    "requestId" -> Random.alphanumeric.take(10).mkString,
    "textPrompt" -> s"Generate response for test ${Random.nextInt(1000)}",
    "mediaType" -> Random.shuffle(List("video", "audio", "image")).head
  ))

  val agentSpaceFeeder = Iterator.continually(Map(
    "agentId" -> s"agent_${Random.alphanumeric.take(8).mkString}",
    "agentType" -> Random.shuffle(List("coordinator", "worker", "analyzer")).head,
    "taskComplexity" -> Random.shuffle(List("simple", "medium", "complex")).head
  ))

  val veo3Feeder = Iterator.continually(Map(
    "videoPrompt" -> Random.shuffle(List(
      "Create a nature documentary scene",
      "Generate a futuristic city landscape",
      "Produce an abstract art animation"
    )).head,
    "duration" -> Random.shuffle(List(30, 60, 120)).head,
    "resolution" -> Random.shuffle(List("720p", "1080p", "4k")).head
  ))

  val imagen4Feeder = Iterator.continually(Map(
    "imagePrompt" -> Random.shuffle(List(
      "A serene mountain landscape at dawn",
      "Futuristic robot in a cyberpunk city",
      "Abstract geometric patterns in vibrant colors"
    )).head,
    "style" -> Random.shuffle(List("photorealistic", "artistic", "cartoon")).head,
    "resolution" -> Random.shuffle(List("1024x1024", "2048x2048", "4096x4096")).head
  ))

  // Streaming API Scenarios
  object StreamingApiScenarios {
    val textStreamingBaseline = scenario("Streaming API - Text Baseline")
      .feed(streamingApiFeeder)
      .exec(
        http("text_streaming_request")
          .post("/api/v1/stream/text")
          .body(StringBody("""{"text": "${textPrompt}", "stream": true, "max_tokens": 1000}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(100)) // <100ms baseline
          .check(jsonPath("$.status").is("success"))
      )
      .pause(1, 3)

    val multimediaStreamingBaseline = scenario("Streaming API - Multimedia Baseline")
      .feed(streamingApiFeeder)
      .exec(
        http("multimedia_streaming_request")
          .post("/api/v1/stream/multimedia")
          .body(StringBody("""{"media_type": "${mediaType}", "quality": "hd", "stream": true}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(500)) // <500ms baseline
          .check(jsonPath("$.status").is("processing"))
      )
      .pause(2, 5)

    val streamingApiSpike = scenario("Streaming API - Spike Test")
      .feed(streamingApiFeeder)
      .exec(
        http("spike_text_request")
          .post("/api/v1/stream/text")
          .body(StringBody("""{"text": "${textPrompt}", "stream": true, "priority": "high"}"""))
          .check(status.in(200, 202, 429)) // Accept rate limiting
      )

    val streamingApiSoak = scenario("Streaming API - Soak Test")
      .feed(streamingApiFeeder)
      .forever(
        exec(
          http("soak_streaming_request")
            .post("/api/v1/stream/text")
            .body(StringBody("""{"text": "${textPrompt}", "stream": true}"""))
            .check(status.is(200))
        ).pause(30, 60) // Slower requests for soak testing
      )
  }

  // AgentSpace Scenarios
  object AgentSpaceScenarios {
    val agentCoordinationBaseline = scenario("AgentSpace - Coordination Baseline")
      .feed(agentSpaceFeeder)
      .exec(
        http("agent_spawn")
          .post("/api/v1/agents/spawn")
          .body(StringBody("""{"agent_type": "${agentType}", "capabilities": ["coordination"], "memory_limit": "256MB"}"""))
          .check(status.is(201))
          .check(responseTimeInMillis.lt(200)) // <200ms spawn time
          .check(jsonPath("$.agent_id").saveAs("agentId"))
      )
      .pause(100.milliseconds, 500.milliseconds)
      .exec(
        http("agent_coordinate")
          .post("/api/v1/agents/coordinate")
          .body(StringBody("""{"agent_id": "${agentId}", "task": "coordinate_peers", "complexity": "${taskComplexity}"}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(50)) // <50ms coordination overhead
      )
      .pause(1, 2)

    val agentCommunicationBaseline = scenario("AgentSpace - Communication Baseline")
      .feed(agentSpaceFeeder)
      .exec(
        http("agent_message")
          .post("/api/v1/agents/communicate")
          .body(StringBody("""{"from_agent": "${agentId}", "to_agent": "coordinator", "message": "status_update", "priority": "normal"}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(25)) // <25ms message latency
      )

    val massiveAgentScale = scenario("AgentSpace - Massive Scale Test")
      .feed(agentSpaceFeeder)
      .exec(
        http("spawn_multiple_agents")
          .post("/api/v1/agents/batch-spawn")
          .body(StringBody("""{"count": 100, "agent_type": "${agentType}", "distribute": true}"""))
          .check(status.in(200, 202))
          .check(jsonPath("$.spawned_count").greaterThan(90)) // At least 90% success rate
      )
  }

  // Veo3 Video Generation Scenarios
  object Veo3Scenarios {
    val videoGenerationBaseline = scenario("Veo3 - Video Generation Baseline")
      .feed(veo3Feeder)
      .exec(
        http("video_generation_request")
          .post("/api/v1/veo3/generate")
          .body(StringBody("""{"prompt": "${videoPrompt}", "duration": ${duration}, "resolution": "${resolution}", "fps": 30}"""))
          .check(status.is(202)) // Async processing
          .check(responseTimeInMillis.lt(5000)) // <5s to start processing
          .check(jsonPath("$.job_id").saveAs("jobId"))
      )
      .pause(30.seconds) // Wait for processing
      .exec(
        http("video_status_check")
          .get("/api/v1/veo3/status/${jobId}")
          .check(status.is(200))
          .check(jsonPath("$.status").in("completed", "processing"))
      )

    val videoQualityStress = scenario("Veo3 - Quality Stress Test")
      .feed(veo3Feeder)
      .exec(
        http("high_quality_video")
          .post("/api/v1/veo3/generate")
          .body(StringBody("""{"prompt": "${videoPrompt}", "duration": 120, "resolution": "4k", "fps": 60, "quality": "ultra"}"""))
          .check(status.in(200, 202))
          .check(responseTimeInMillis.lt(30000)) // <30s/minute baseline
      )
  }

  // Imagen4 Image Generation Scenarios
  object Imagen4Scenarios {
    val imageGenerationBaseline = scenario("Imagen4 - Image Generation Baseline")
      .feed(imagen4Feeder)
      .exec(
        http("image_generation_request")
          .post("/api/v1/imagen4/generate")
          .body(StringBody("""{"prompt": "${imagePrompt}", "style": "${style}", "resolution": "${resolution}"}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(3000)) // <3s generation baseline
          .check(jsonPath("$.image_url").exists)
          .check(jsonPath("$.quality_score").greaterThan(95)) // 95%+ quality
      )
      .pause(1, 3)

    val batchImageGeneration = scenario("Imagen4 - Batch Generation Test")
      .feed(imagen4Feeder)
      .exec(
        http("batch_image_generation")
          .post("/api/v1/imagen4/batch")
          .body(StringBody("""{"prompts": ["${imagePrompt}", "Variation 1", "Variation 2"], "count": 10, "style": "${style}"}"""))
          .check(status.is(202))
          .check(jsonPath("$.batch_id").saveAs("batchId"))
      )
      .pause(10.seconds)
      .exec(
        http("batch_status_check")
          .get("/api/v1/imagen4/batch/${batchId}")
          .check(status.is(200))
          .check(jsonPath("$.completed_count").greaterThan(8)) // At least 80% success
      )
  }

  // Co-Scientist Scenarios
  object CoScientistScenarios {
    val hypothesisValidationBaseline = scenario("Co-Scientist - Hypothesis Validation")
      .exec(
        http("hypothesis_validation")
          .post("/api/v1/co-scientist/validate")
          .body(StringBody("""{"hypothesis": "Increasing temperature improves reaction rate", "data_points": 100, "confidence_level": 0.95}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(5000)) // <5s validation baseline
          .check(jsonPath("$.validation_score").greaterThan(80))
      )
      .pause(3, 7)

    val dataAnalysisBaseline = scenario("Co-Scientist - Data Analysis")
      .exec(
        http("data_analysis")
          .post("/api/v1/co-scientist/analyze")
          .body(StringBody("""{"dataset": "experiment_results", "analysis_type": "statistical", "method": "regression"}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(3000)) // <3s analysis baseline
          .check(jsonPath("$.accuracy").greaterThan(92)) // 92%+ accuracy
      )
  }

  // Chirp Audio Generation Scenarios
  object ChirpScenarios {
    val audioSynthesisBaseline = scenario("Chirp - Audio Synthesis")
      .exec(
        http("audio_synthesis")
          .post("/api/v1/chirp/synthesize")
          .body(StringBody("""{"text": "Hello, this is a performance test", "voice": "natural", "language": "en-US", "speed": 1.0}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(1000)) // <1s generation baseline
          .check(jsonPath("$.audio_url").exists)
          .check(jsonPath("$.quality_score").greaterThan(96)) // 96%+ quality
      )
      .pause(500.milliseconds, 2.seconds)

    val voiceCloningStress = scenario("Chirp - Voice Cloning Stress")
      .exec(
        http("voice_cloning")
          .post("/api/v1/chirp/clone")
          .body(StringBody("""{"reference_audio": "base64_audio_data", "text": "Cloned voice test", "similarity_target": 90}"""))
          .check(status.is(200))
          .check(jsonPath("$.similarity_score").greaterThan(90))
      )
  }

  // Lyria Music Composition Scenarios
  object LyriaScenarios {
    val musicCompositionBaseline = scenario("Lyria - Music Composition")
      .exec(
        http("music_composition")
          .post("/api/v1/lyria/compose")
          .body(StringBody("""{"genre": "ambient", "duration": 60, "tempo": 120, "key": "C_major", "complexity": "medium"}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(5000)) // <5s composition baseline
          .check(jsonPath("$.composition_url").exists)
          .check(jsonPath("$.harmony_accuracy").greaterThan(92)) // 92%+ harmony accuracy
      )
      .pause(2, 5)

    val genreAdaptationTest = scenario("Lyria - Genre Adaptation")
      .exec(
        http("genre_adaptation")
          .post("/api/v1/lyria/adapt")
          .body(StringBody("""{"base_composition": "composition_id", "target_genres": ["jazz", "electronic", "classical"], "blend_factor": 0.7}"""))
          .check(status.is(200))
          .check(jsonPath("$.adaptations").exists)
      )
  }

  // Mariner Web Automation Scenarios
  object MarinerScenarios {
    val pageNavigationBaseline = scenario("Mariner - Page Navigation")
      .exec(
        http("page_navigation")
          .post("/api/v1/mariner/navigate")
          .body(StringBody("""{"url": "https://example.com", "wait_for": "page_load", "timeout": 10000}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(2000)) // <2s automation cycle baseline
          .check(jsonPath("$.navigation_success").is(true))
      )
      .pause(1, 3)

    val elementInteractionStress = scenario("Mariner - Element Interaction Stress")
      .exec(
        http("element_interaction")
          .post("/api/v1/mariner/interact")
          .body(StringBody("""{"action": "click", "selector": "#submit-button", "wait_time": 1000, "retry_count": 3}"""))
          .check(status.is(200))
          .check(responseTimeInMillis.lt(300)) // <300ms action execution
      )
  }

  // Load Simulation Definitions
  setUp(
    // Baseline Load Tests (1K users)
    StreamingApiScenarios.textStreamingBaseline.inject(
      rampUsers(500).during(5.minutes),
      constantUsersPerSec(100).during(testDuration)
    ),
    StreamingApiScenarios.multimediaStreamingBaseline.inject(
      rampUsers(300).during(5.minutes),
      constantUsersPerSec(50).during(testDuration)
    ),
    AgentSpaceScenarios.agentCoordinationBaseline.inject(
      rampUsers(200).during(3.minutes),
      constantUsersPerSec(30).during(testDuration)
    ),
    Imagen4Scenarios.imageGenerationBaseline.inject(
      rampUsers(100).during(5.minutes),
      constantUsersPerSec(20).during(testDuration)
    ),
    ChirpScenarios.audioSynthesisBaseline.inject(
      rampUsers(150).during(4.minutes),
      constantUsersPerSec(25).during(testDuration)
    ),

    // High Load Tests (10K users)
    StreamingApiScenarios.textStreamingBaseline.inject(
      rampUsers(5000).during(10.minutes),
      constantUsersPerSec(500).during(testDuration)
    ).protocols(httpProtocol.disableWarmUp),

    // Spike Tests (Sudden 10x load increase)
    StreamingApiScenarios.streamingApiSpike.inject(
      nothingFor(30.seconds),
      atOnceUsers(10000) // Sudden spike
    ),
    AgentSpaceScenarios.massiveAgentScale.inject(
      nothingFor(1.minute),
      atOnceUsers(5000)
    ),

    // Soak Tests (24-hour sustained load simulation)
    StreamingApiScenarios.streamingApiSoak.inject(
      rampUsers(100).during(1.hour),
      constantUsersPerSec(10).during(23.hours)
    ).protocols(httpProtocol.disableWarmUp),

    // Stress Tests for Resource-Intensive Services
    Veo3Scenarios.videoGenerationBaseline.inject(
      rampUsers(50).during(10.minutes),
      constantUsersPerSec(5).during(testDuration)
    ),
    Veo3Scenarios.videoQualityStress.inject(
      rampUsers(20).during(5.minutes),
      constantUsersPerSec(2).during(30.minutes)
    ),

    // Complex Workflow Tests
    CoScientistScenarios.hypothesisValidationBaseline.inject(
      rampUsers(75).during(5.minutes),
      constantUsersPerSec(10).during(testDuration)
    ),
    LyriaScenarios.musicCompositionBaseline.inject(
      rampUsers(50).during(5.minutes),
      constantUsersPerSec(8).during(testDuration)
    ),

    // Web Automation Tests
    MarinerScenarios.pageNavigationBaseline.inject(
      rampUsers(200).during(5.minutes),
      constantUsersPerSec(25).during(testDuration)
    ),
    MarinerScenarios.elementInteractionStress.inject(
      rampUsers(500).during(3.minutes),
      constantUsersPerSec(75).during(testDuration)
    )

  ).protocols(httpProtocol)
   .maxDuration(testDuration + 5.minutes)
   .assertions(
     // Global assertions
     global.responseTime.max.lt(30000),
     global.responseTime.percentile3.lt(10000),
     global.responseTime.percentile4.lt(15000),
     global.successfulRequests.percent.gt(95),
     
     // Service-specific assertions
     details("text_streaming_request").responseTime.percentile3.lt(100),
     details("multimedia_streaming_request").responseTime.percentile3.lt(500),
     details("agent_coordinate").responseTime.max.lt(50),
     details("image_generation_request").responseTime.max.lt(3000),
     details("audio_synthesis").responseTime.max.lt(1000),
     details("music_composition").responseTime.max.lt(5000),
     details("hypothesis_validation").responseTime.max.lt(5000),
     details("page_navigation").responseTime.max.lt(2000)
   )
}

/**
 * Custom Simulation for 24-Hour Soak Testing
 * Designed to detect memory leaks and resource exhaustion
 */
class GoogleServicesSoakTestSimulation extends Simulation {
  val baseUrl = System.getProperty("base.url", "https://api.google.com")
  val apiKey = System.getProperty("api.key", "")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .header("Authorization", s"Bearer $apiKey")
    .header("Content-Type", "application/json")
    .keepAliveHeader("keep-alive")
    .connectionHeader("keep-alive")

  val soakTestScenario = scenario("24-Hour Soak Test")
    .forever(
      exec(
        http("streaming_api_soak")
          .post("/api/v1/stream/text")
          .body(StringBody("""{"text": "Soak test message", "stream": true}"""))
          .check(status.is(200))
      ).pause(30, 60) // 30-60 second intervals
    )

  setUp(
    soakTestScenario.inject(
      rampUsers(100).during(1.hour), // Gradual ramp-up
      constantUsersPerSec(50).during(23.hours) // Sustained load
    )
  ).protocols(httpProtocol)
   .maxDuration(24.hours)
   .assertions(
     global.successfulRequests.percent.gt(98), // Higher success rate for soak
     global.responseTime.percentile4.lt(5000)
   )
}