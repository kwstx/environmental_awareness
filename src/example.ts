import { GlobalSystemState, SystemMetrics } from './models/GlobalSystemState';

/**
 * Example usage of the GlobalSystemState model.
 * Demonstrates the core metrics and the extensibility of the schema.
 */

async function runExample() {
    console.log('--- Environmental Awareness Layer: GlobalSystemState Demo ---\n');

    // 1. Initialize with real-time aggregated metrics
    const realTimeMetrics: SystemMetrics = {
        totalTreasuryReserves: 5000000,          // $5M in reserves
        pooledBudgetUtilization: 0.62,           // 62% of budget used
        aggregateAgentRiskExposure: 2450.5,      // Arbitrary risk units
        networkComputeLoad: 0.44,                // 44% load
        policyViolationFrequency: 0.02,          // 2% violation rate
        cooperativeEfficiencyScores: 94.5,       // High cooperation
        ongoingTaskDensity: 342                  // 342 active tasks
    };

    const state = GlobalSystemState.snapshot(realTimeMetrics, {
        source: 'AggregatorService_v1',
        region: 'global-main'
    });

    console.log('Initial Snapshot Created:');
    console.log(`[${state.id}] At ${new Date(state.timestamp).toISOString()}`);
    console.log(`Treasury: ${state.metrics.totalTreasuryReserves}`);
    console.log(`Cooperation Score: ${state.metrics.cooperativeEfficiencyScores}`);
    console.log('--------------------------------------------------\n');

    // 2. Demonstrate Extensibility
    // Suppose a new metric "ecosystemResilience" is introduced
    console.log('Adding a new macro-level indicator: "ecosystemResilience"...');

    const extendedState = state.updateMetric('ecosystemResilience', 0.88);

    console.log('Extended Snapshot:');
    console.log(`Ecosystem Resilience: ${extendedState.metrics.ecosystemResilience}`);
    console.log(`Aggregate Risk: ${extendedState.metrics.aggregateAgentRiskExposure}`);

    if (extendedState.validate()) {
        console.log('\nState Validation: PASSED');
    } else {
        console.log('\nState Validation: FAILED');
    }

    console.log('\nJSON Representation:');
    console.log(JSON.stringify(extendedState.toJSON(), null, 2));
}

runExample().catch(console.error);
