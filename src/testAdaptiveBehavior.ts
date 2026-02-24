import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { GlobalStateAPI } from './api/GlobalStateAPI';
import { AdaptiveBehaviorEngine } from './engines/AdaptiveBehaviorEngine';
import { SystemMetrics } from './models/GlobalSystemState';

/**
 * Test script for AdaptiveBehaviorEngine.
 * Demonstrates how agent behavior is adjusted based on environmental signals.
 */
async function testEngine() {
    console.log('--- Environmental Awareness: AdaptiveBehaviorEngine Test ---\n');

    // 1. Setup Base Components
    const engine = new StateAggregationEngine({
        updateIntervalMs: 10000 // Slow updates for manual testing
    });

    const api = new GlobalStateAPI(engine);
    const behaviorEngine = new AdaptiveBehaviorEngine(api);

    // Give the engine system-level data permissions for this test
    api.setAccessPolicy({
        agentId: 'system_monitor',
        permittedMetrics: [
            'totalTreasuryReserves',
            'pooledBudgetUtilization',
            'aggregateAgentRiskExposure',
            'networkComputeLoad'
        ],
        description: 'Internal behavioral monitoring'
    });

    // 2. Define Scenarios
    const scenarios: { name: string, metrics: SystemMetrics }[] = [
        {
            name: 'NORMAL OPERATING CONDITIONS',
            metrics: {
                totalTreasuryReserves: 5000000,
                pooledBudgetUtilization: 0.5,
                aggregateAgentRiskExposure: 1000,
                networkComputeLoad: 0.4,
                policyViolationFrequency: 0.01,
                cooperativeEfficiencyScores: 85,
                ongoingTaskDensity: 200
            }
        },
        {
            name: 'HIGH RISK & STRESS (Low Frequency Expected)',
            metrics: {
                totalTreasuryReserves: 5000000,
                pooledBudgetUtilization: 0.8,
                aggregateAgentRiskExposure: 2500, // Very High
                networkComputeLoad: 0.9,    // High
                policyViolationFrequency: 0.08,
                cooperativeEfficiencyScores: 70,
                ongoingTaskDensity: 450
            }
        },
        {
            name: 'TREASURY DEPLETION (Cooperation Prioritized)',
            metrics: {
                totalTreasuryReserves: 400000,    // Critical (< $1M)
                pooledBudgetUtilization: 0.6,
                aggregateAgentRiskExposure: 800,
                networkComputeLoad: 0.3,
                policyViolationFrequency: 0.01,
                cooperativeEfficiencyScores: 90,
                ongoingTaskDensity: 150
            }
        },
        {
            name: 'ABUNDANT RESOURCES (Growth Mode)',
            metrics: {
                totalTreasuryReserves: 15000000, // Abundant (> $10M)
                pooledBudgetUtilization: 0.2,    // Low utilization (< 0.3)
                aggregateAgentRiskExposure: 500,
                networkComputeLoad: 0.2,
                policyViolationFrequency: 0.005,
                cooperativeEfficiencyScores: 95,
                ongoingTaskDensity: 100
            }
        }
    ];

    // 3. Execute Scenarios
    for (const scenario of scenarios) {
        console.log(`>>> SCENARIO: ${scenario.name}`);

        // Manually update the engine's internal state for the test
        // @ts-ignore - accessing private for testing purposes
        engine.currentMetrics = scenario.metrics;

        const policy = await behaviorEngine.getBehaviorPolicy('system_monitor');

        console.log(`- Action Frequency: ${policy.actionFrequencyMultiplier.toFixed(2)}x`);
        console.log(`- Priority Mode:   ${policy.priorityMode.toUpperCase()}`);
        console.log(`- Budget Factor:   ${policy.budgetReallocationFactor.toFixed(2)}x`);
        console.log(`- Risk Tolerance:  ${policy.riskToleranceLimit}`);
        console.log(`- Rationale:       ${policy.rationale}`);
        console.log('--------------------------------------------------\n');
    }

    // 4. Cleanup
    engine.stop();
    console.log('Test Complete.');
}

testEngine().catch(console.error);
