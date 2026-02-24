import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { RiskEscalationModule } from './engines/RiskEscalationModule';
import { StressForecastingEngine } from './engines/StressForecastingEngine';
import { EnvironmentalAwarenessService } from './service/EnvironmentalAwarenessService';

/**
 * Main entry point for the Environmental Awareness microservice.
 * Initializes all required engines and starts the HTTP service.
 */
async function bootstrap() {
    console.log('[Bootstrap] Initializing Environmental Awareness Layer...');

    // 1. Initialize Aggregation Engine
    const aggregationEngine = new StateAggregationEngine({
        updateIntervalMs: 5000 // 5 second resolution for production-like feel
    });

    // 2. Initialize Core Modules
    const riskModule = new RiskEscalationModule(aggregationEngine);
    const stressEngine = new StressForecastingEngine(aggregationEngine, riskModule);

    // 3. Register Modules as Data Providers to the Aggregation Engine
    // This allows the stress engine to feed its predictions back into the global state
    aggregationEngine.registerProvider(stressEngine);

    // 4. Start the collection loop
    await aggregationEngine.start();

    // 5. Start the Standalone Service
    const port = parseInt(process.env.PORT || '3000', 10);
    const service = new EnvironmentalAwarenessService(port, aggregationEngine, riskModule);

    service.start();

    console.log('[Bootstrap] Systems operational.');
}

bootstrap().catch((error) => {
    console.error('[Bootstrap] Critical failure during startup:', error);
    process.exit(1);
});
