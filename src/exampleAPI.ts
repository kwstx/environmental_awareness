import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { GlobalStateAPI } from './api/GlobalStateAPI';
import { EconomicProvider } from './providers/EconomicProvider';
import { RiskProvider } from './providers/RiskProvider';
import { IdentityTrustProvider } from './providers/IdentityTrustProvider';

/**
 * Example demonstration of the GlobalStateAPI.
 * Shows how different agents receive filtered views of the system state
 * based on their permissions, while all maintaining macro-level situational awareness.
 */
async function runExample() {
    console.log('--- Environmental Awareness: GlobalStateAPI Demo ---\n');

    // 1. Setup Engine and Providers
    const engine = new StateAggregationEngine({
        updateIntervalMs: 5000
    });
    engine.registerProvider(new EconomicProvider());
    engine.registerProvider(new RiskProvider());
    engine.registerProvider(new IdentityTrustProvider());

    // Perform initial collection
    await engine.start();

    // 2. Initialize GlobalStateAPI
    const api = new GlobalStateAPI(engine);

    // 3. Configure many-tiered Access Policies
    api.setAccessPolicy({
        agentId: 'agent_finance_01',
        permittedMetrics: ['totalTreasuryReserves', 'pooledBudgetUtilization'],
        description: 'Financial auditor agent'
    });

    api.setAccessPolicy({
        agentId: 'agent_ops_node_22',
        permittedMetrics: ['networkComputeLoad', 'ongoingTaskDensity', 'cooperativeEfficiencyScores'],
        description: 'Operations management agent'
    });

    // 4. Test Queries for different agents
    const agents = [
        { id: 'agent_finance_01', name: 'Finance Auditor' },
        { id: 'agent_ops_node_22', name: 'Operations Mgr' },
        { id: 'unknown_agent_X', name: 'Unauthorized Agent' }
    ];

    console.log('\n--- Executing Scoped Queries ---\n');

    for (const agent of agents) {
        const result = await api.queryState(agent.id);

        console.log(`Query results for: ${agent.name} (${agent.id})`);
        console.log(`[ID: ${result.id}] [Time: ${new Date(result.timestamp).toLocaleTimeString()}]`);

        console.log('Permitted Metrics:');
        if (Object.keys(result.metrics).length === 0) {
            console.log('  <No specific metrics permitted (Restricted Policy)>');
        } else {
            for (const [key, value] of Object.entries(result.metrics)) {
                console.log(`  - ${key}: ${value}`);
            }
        }

        console.log('System-Level Awareness (Always Visible):');
        console.log(`  - Stability: ${result.macroAwareness.systemStability.toUpperCase()}`);
        console.log(`  - Resource Pressure: ${result.macroAwareness.resourcePressure.toUpperCase()}`);
        console.log(`  - Governance Strictness: ${result.macroAwareness.governanceStrictness.toUpperCase()}`);
        console.log('--------------------------------------------------\n');
    }

    // Stop engine
    engine.stop();
}

runExample().catch(console.error);
