import { SystemicStabilityIntelligence } from './engines/SystemicStabilityIntelligence';
import { DataProvider } from './interfaces/DataProvider';
import { SystemMetrics } from './models/GlobalSystemState';
import { EscalationTier } from './interfaces/RiskEscalation';

/**
 * MockSystemSignalProvider
 * 
 * Simulates volatile system signals to demonstrate SSI's 
 * proactive stabilization and unified awareness.
 */
class MockSystemSignalProvider implements DataProvider {
    public readonly name = 'MockSignalProvider';
    private currentMetrics: Partial<SystemMetrics> = {
        totalTreasuryReserves: 5000000,
        pooledBudgetUtilization: 0.1,
        aggregateAgentRiskExposure: 100,
        networkComputeLoad: 0.2,
        policyViolationFrequency: 0.01,
        cooperativeEfficiencyScores: 90,
        ongoingTaskDensity: 0.1
    };

    public async fetchMetrics(): Promise<Partial<SystemMetrics>> {
        return this.currentMetrics;
    }

    public async getHealthStatus() { return 'healthy' as const; }

    public setSignal(metrics: Partial<SystemMetrics>): void {
        this.currentMetrics = { ...this.currentMetrics, ...metrics };
    }
}

async function runSSIDemo() {
    console.log("--- SYSTEMIC STABILITY INTELLIGENCE (SSI) INTEGRATION DEMO ---");

    // 1. Initialize the Unified SSI Module
    const ssi = new SystemicStabilityIntelligence();
    const mockProvider = new MockSystemSignalProvider();
    ssi.getAggregationEngine().registerProvider(mockProvider);

    // 2. Start the System
    await ssi.start();

    // 3. Define a sequence of environmental events
    const scenarios = [
        {
            name: "NORMAL OPERATIONS",
            signals: { aggregateAgentRiskExposure: 200, networkComputeLoad: 0.3 }
        },
        {
            name: "RISING ANOMALIES (Proactive Trigger)",
            signals: { aggregateAgentRiskExposure: 1200, policyViolationFrequency: 0.04, ongoingTaskDensity: 0.5 }
        },
        {
            name: "SYSTEMIC STRESS (Escalation to ELEVATED)",
            signals: { aggregateAgentRiskExposure: 1600, networkComputeLoad: 0.75, totalTreasuryReserves: 2800000 }
        },
        {
            name: "HIGH VOLATILITY (Escalation to HIGH)",
            signals: { aggregateAgentRiskExposure: 3200, policyViolationFrequency: 0.18, networkComputeLoad: 0.88 }
        },
        {
            name: "RECOVERY (Adaptive De-escalation)",
            signals: { aggregateAgentRiskExposure: 400, policyViolationFrequency: 0.02, ongoingTaskDensity: 0.2, totalTreasuryReserves: 4500000 }
        }
    ];

    let step = 0;
    const interval = setInterval(async () => {
        if (step >= scenarios.length) {
            clearInterval(interval);
            ssi.stop();
            console.log("\n--- DEMO COMPLETED ---");
            return;
        }

        const scenario = scenarios[step];
        console.log(`\n>>> SCENARIO: ${scenario.name}`);
        mockProvider.setSignal(scenario.signals);

        // Wait a bit for engines to process (Aggregation -> Forecasting -> Escalation)
        setTimeout(async () => {
            const snapshot = ssi.getStabilitySnapshot();

            console.log(`[Snapshot] Tier: ${EscalationTier[snapshot.governance.tier]}`);
            console.log(`[Snapshot] Forecasted Stress: ${(snapshot.forecast.predictiveStress * 100).toFixed(1)}%`);
            console.log(`[Snapshot] Authority Factor: ${snapshot.authority.contractionFactor.toFixed(2)}x`);
            console.log(`[Snapshot] Economic Multiplier: ${snapshot.economic.systemicBudgetMultiplier.toFixed(2)}x`);

            // Show agent-level policy derivation
            const agentPolicy = await ssi.getAgentPolicy("agent_007");
            console.log(`[Agent Policy] Mode: ${agentPolicy.priorityMode}, Frequency Multiplier: ${agentPolicy.actionFrequencyMultiplier.toFixed(2)}x`);
            console.log(`[Rationale] ${agentPolicy.rationale}`);

            step++;
        }, 1500);

    }, 3000);
}

runSSIDemo().catch(console.error);
