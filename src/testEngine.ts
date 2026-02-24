import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { EconomicProvider } from './providers/EconomicProvider';
import { IdentityTrustProvider } from './providers/IdentityTrustProvider';
import { RiskProvider } from './providers/RiskProvider';
import { AuditProvider } from './providers/AuditProvider';
import { CoordinationProvider } from './providers/CoordinationProvider';

async function main() {
    console.log('--- Environmental Awareness: StateAggregationEngine Test ---\n');

    // 1. Initialize Engine
    const engine = new StateAggregationEngine({
        updateIntervalMs: 2000 // 2 seconds
    });

    // 2. Register Providers
    engine.registerProvider(new EconomicProvider());
    engine.registerProvider(new IdentityTrustProvider());
    engine.registerProvider(new RiskProvider());
    engine.registerProvider(new AuditProvider());
    engine.registerProvider(new CoordinationProvider());

    // 3. Listen for state updates
    engine.on('stateUpdated', (state: any) => {
        console.log('\n[EVENT] New Global System State:');
        console.log(`Timestamp: ${new Date(state.timestamp).toISOString()}`);
        console.log(`Version: ${state.version}`);
        console.log(`Treasury: ${state.metrics.totalTreasuryReserves.toFixed(2)}`);
        console.log(`Risk Exposure: ${state.metrics.aggregateAgentRiskExposure.toFixed(2)}`);
        console.log(`Cooperation Score: ${state.metrics.cooperativeEfficiencyScores.toFixed(2)}`);
        console.log(`Task Density: ${state.metrics.ongoingTaskDensity}`);
        console.log(`Network Load: ${(state.metrics.networkComputeLoad * 100).toFixed(1)}%`);
        console.log('--------------------------------------------------');
    });

    // 4. Start Engine
    await engine.start();

    // Let it run for 10 seconds, then stop
    setTimeout(() => {
        console.log('\nStopping engine after 10 seconds...');
        engine.stop();
        process.exit(0);
    }, 10500);
}

main().catch(console.error);
