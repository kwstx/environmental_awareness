import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { RiskEscalationModule } from './engines/RiskEscalationModule';
import { GlobalStateAPI } from './api/GlobalStateAPI';
import { PreExecutionValidator } from './engines/PreExecutionValidator';
import { EscalationTier } from './interfaces/RiskEscalation';

/**
 * Mock Provider to simulate different risk environments
 */
class DynamicRiskProvider {
    name = 'DynamicRiskProvider';
    private risk = 100;
    private violationFreq = 0.01;
    private treasury = 10000000;
    private load = 0.1;

    async fetchMetrics() {
        return {
            aggregateAgentRiskExposure: this.risk,
            policyViolationFrequency: this.violationFreq,
            totalTreasuryReserves: this.treasury,
            networkComputeLoad: this.load
        };
    }

    setRisk(val: number) { this.risk = val; }
    setViolation(val: number) { this.violationFreq = val; }
    setTreasury(val: number) { this.treasury = val; }
    setLoad(val: number) { this.load = val; }
}

async function runTest() {
    console.log('=== Risk Escalation Module Integration Test ===\n');

    // 1. Setup Infrastructure
    const engine = new StateAggregationEngine({ updateIntervalMs: 500 });
    const riskProvider = new DynamicRiskProvider();
    engine.registerProvider(riskProvider as any);

    const escalationModule = new RiskEscalationModule(engine);
    const api = new GlobalStateAPI(engine, escalationModule);
    const validator = new PreExecutionValidator(api, escalationModule);

    // 2. Monitoring Tier Changes
    escalationModule.on('tierChanged', (data) => {
        console.log(`\n[EVENT] Tier Escalated to ${EscalationTier[data.policy.tier]}`);
        console.log(` > Rationale: ${data.policy.rationale}`);
        console.log(` > Multiplier: ${data.policy.authorityLimitMultiplier}`);
        console.log(` > Multi-Agent Target: ${data.policy.multiAgentConfirmationRequired}`);
    });

    await engine.start();

    const testAction = {
        budgetRequired: 50000,
        riskLevel: 30,
        computeUnits: 0.02,
        description: 'Standard Operation'
    };

    const runValidation = async (label: string) => {
        console.log(`\n--- ${label} ---`);
        const result = await validator.validateAction('agent-001', testAction);
        console.log(`Validation: ${result.approved ? 'APPROVED' : 'REJECTED'}`);
        if (result.reason) console.log(`Reason: ${result.reason}`);
        console.log(`Applied Budget Limit: ${result.thresholdsApplied.budgetLimit}`);
        console.log(`Consensus Required: ${result.thresholdsApplied.multiAgentRequired}`);
    };

    // --- Scenario 1: Stable ---
    await runValidation('Scenario 1: Stable Operations');

    // --- Scenario 2: Elevated Risk ---
    console.log('\n[Simulating] Rising Risk Exposure...');
    riskProvider.setRisk(2000);
    await new Promise(r => setTimeout(r, 600)); // wait for engine cycle
    await runValidation('Scenario 2: Elevated Risk (Tier 1)');

    // --- Scenario 3: High Risk / Consensus Required ---
    console.log('\n[Simulating] System Stress & High Risk...');
    riskProvider.setRisk(4000);
    riskProvider.setLoad(0.9);
    await new Promise(r => setTimeout(r, 600));
    await runValidation('Scenario 3: High Risk (Tier 2)');

    // --- Scenario 4: Critical / Treasury Depletion ---
    console.log('\n[Simulating] Treasury Depletion & Emergency...');
    riskProvider.setTreasury(400000);
    await new Promise(r => setTimeout(r, 600));
    await runValidation('Scenario 4: Critical Emergency (Tier 3)');

    engine.stop();
    console.log('\nTest completed.');
    process.exit(0);
}

runTest().catch(console.error);
