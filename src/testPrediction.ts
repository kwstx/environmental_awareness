import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { RiskEscalationModule } from './engines/RiskEscalationModule';
import { StressForecastingEngine } from './engines/StressForecastingEngine';
import { GlobalStateAPI } from './api/GlobalStateAPI';
import { AdaptiveBehaviorEngine } from './engines/AdaptiveBehaviorEngine';
import { EscalationTier } from './interfaces/RiskEscalation';

/**
 * Mock System Provider to simulate environmental changes.
 */
class MockSystemProvider {
    public readonly name = 'MockSystemProvider';
    public risk = 100;
    public treasury = 10000000;
    public density = 10;
    public coop = 90;

    async fetchMetrics() {
        return {
            aggregateAgentRiskExposure: this.risk,
            totalTreasuryReserves: this.treasury,
            ongoingTaskDensity: this.density,
            cooperativeEfficiencyScores: this.coop,
            policyViolationFrequency: 0,
            networkComputeLoad: 0.1
        };
    }

    async getHealthStatus() {
        return 'healthy' as const;
    }
}

async function runTest() {
    console.log('=== Environmental Stress Prediction & Proactive Adaptation Test ===\n');

    // 1. Setup Engines
    const aggregationEngine = new StateAggregationEngine({ updateIntervalMs: 500 });
    const mockProvider = new MockSystemProvider();

    // Register the data source
    aggregationEngine.registerProvider(mockProvider as any);

    const escalationModule = new RiskEscalationModule(aggregationEngine);
    const stressEngine = new StressForecastingEngine(aggregationEngine, escalationModule);

    // API and Behavior Engine
    const api = new GlobalStateAPI(aggregationEngine, escalationModule);
    const behaviorEngine = new AdaptiveBehaviorEngine(api);

    // 2. Register Stress Engine as a source back into the aggregation engine
    // This allows RiskEscalationModule to see the 'predictiveStressLevel' metric
    aggregationEngine.registerProvider(stressEngine);

    // Listen for proactive tier changes
    escalationModule.on('tierChanged', (data) => {
        console.log(`\n[EVENT] Tier Escalation: ${EscalationTier[data.previousTier]} -> ${EscalationTier[data.policy.tier]}`);
        console.log(` > Rationale: ${data.policy.rationale}`);
    });

    // Helper to log behavior
    const logBehavior = async (label: string) => {
        const policy = await behaviorEngine.getBehaviorPolicy('agent_007');
        console.log(`[Behavior - ${label}] Freq Multiplier: ${policy.actionFrequencyMultiplier.toFixed(3)}, Mode: ${policy.priorityMode}`);
        console.log(` > Rationale: ${policy.rationale}`);
    };

    console.log('Starting monitoring loop...');
    await aggregationEngine.start();

    // Initial stability period
    await new Promise(r => setTimeout(r, 2000));
    console.log('--- System Stable ---');

    /**
     * SCENARIO 1: Rapid Treasury Depletion
     * We drop the treasury reserves significantly over a short period.
     * This should trigger the predictive model before the treasury actually hits a critical threshold.
     */
    console.log('\n[SCENARIO 1] Simulating Rapid Treasury Depletion (Leading to instability)...');
    for (let i = 0; i < 5; i++) {
        mockProvider.treasury -= 850000; // Total 4.25M drop
        console.log(` > Snapshot ${i + 1}: Treasury: ${mockProvider.treasury.toLocaleString()}`);
        await new Promise(r => setTimeout(r, 600));
        await logBehavior(`T+${(i + 1) * 600}ms`);
    }

    await new Promise(r => setTimeout(r, 2000));

    /**
     * SCENARIO 2: Task Density Explosion + Efficiency Drop
     * Simulates a surge in workload combined with friction.
     */
    console.log('\n[SCENARIO 2] Simulating Task Density Spike & Performance Degradation...');
    mockProvider.density = 300; // Significant jump
    mockProvider.coop = 40;     // Significant drop

    console.log(' > Density jumped to 300, Efficiency dropped to 40%');
    await new Promise(r => setTimeout(r, 1000));
    await logBehavior('Surge Active');

    await new Promise(r => setTimeout(r, 3000));
    await logBehavior('Post-Surge');

    console.log('\n--- Test Simulation Complete ---');
    const finalState = aggregationEngine.getCurrentState();
    console.log(`Final Forecasted Stress: ${(finalState.metrics.predictiveStressLevel * 100).toFixed(1)}%`);
    await logBehavior('Final');

    aggregationEngine.stop();
    process.exit(0);
}

runTest().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
