import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { RiskEscalationModule } from './engines/RiskEscalationModule';
import { GlobalStateAPI } from './api/GlobalStateAPI';
import { PreExecutionValidator } from './engines/PreExecutionValidator';
import { EscalationTier } from './interfaces/RiskEscalation';
import { IdentityTrustProvider } from './providers/IdentityTrustProvider';

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
    console.log('=== Multi-Layer Risk Integration Test ===\n');

    // 1. Setup Infrastructure
    const engine = new StateAggregationEngine({ updateIntervalMs: 500 });
    const riskProvider = new DynamicRiskProvider();
    engine.registerProvider(riskProvider as any);

    const trustProvider = new IdentityTrustProvider();

    const escalationModule = new RiskEscalationModule(engine);
    const api = new GlobalStateAPI(engine, escalationModule);
    const validator = new PreExecutionValidator(api, escalationModule, trustProvider);

    await engine.start();

    const runValidation = async (agentId: string, action: any, label: string) => {
        console.log(`\n--- ${label} ---`);
        console.log(`Agent: ${agentId}, Action: ${action.description}`);
        const result = await validator.validateAction(agentId, action);
        console.log(`Result: ${result.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
        if (result.reason) console.log(`Reason: ${result.reason}`);
        console.log(`Trust Threshold: ${result.thresholdsApplied.trustThreshold.toFixed(2)}`);
        console.log(`Delegation Limit: ${result.thresholdsApplied.delegationLimit.toFixed(2)}`);
        console.log(`Budget Limit: ${result.thresholdsApplied.budgetLimit.toFixed(2)}`);
    };

    // --- Scenario 1: Stable Operations / Normal Agent ---
    const normalAction = { budgetRequired: 10000, riskLevel: 5, computeUnits: 0.01, description: 'Routine Maintenance' };
    const delegationAction = { budgetRequired: 20000, riskLevel: 40, computeUnits: 0.02, isDelegationAction: true, description: 'Delegate Sub-task' };

    await runValidation('agent-alpha', normalAction, 'STABLE: Normal Action');
    await runValidation('agent-alpha', delegationAction, 'STABLE: Delegation Action');

    // --- Scenario 2: Elevated Risk / Trust Comparison ---
    console.log('\n[Simulating] Rising Risk Exposure (ELEVATED)...');
    riskProvider.setRisk(2000);
    await new Promise(r => setTimeout(r, 600));

    // Agent with lower trust (agent-low-trust maps to a lower score in our mock)
    // seed for 'agent-low-trust' = 97+103+101+110+116+45+108+111+119+45+116+114+117+115+116 = 1573
    // 1573 % 61 = 48. 40 + 48 = 88. Wait, I need to find a low trust ID.
    // Let's use 'X' -> 88 % 61 = 27. 40 + 27 = 67.
    // Elevted Trust Threshold = 40 * 1.1 = 44. Still approved.

    // Tier HIGH: Trust Gating Multiplier = 1.5. Threshold = 40 * 1.5 = 60.
    // Tier CRITICAL: Trust Gating Multiplier = 2.5. Threshold = 40 * 2.5 = 100. (All fail except 100)

    await runValidation('agent-alpha', normalAction, 'ELEVATED: Normal Action (Should Pass)');
    await runValidation('agent-alpha', delegationAction, 'ELEVATED: Delegation Action (Contracted?)');
    // Elevated Delegation Limit = 100 * 0.8 = 80. Action risk 40 < 80, should pass.

    // --- Scenario 3: High Risk / Contraction & Gating ---
    console.log('\n[Simulating] System Stress (HIGH)...');
    riskProvider.setRisk(4000);
    await new Promise(r => setTimeout(r, 600));

    const highRiskDelegation = { budgetRequired: 30000, riskLevel: 60, computeUnits: 0.05, isDelegationAction: true, description: 'Complex Delegation' };
    await runValidation('agent-alpha', highRiskDelegation, 'HIGH: High-Risk Delegation (Should Fail)');
    // High Delegation Limit = 100 * 0.5 = 50. Action risk 60 > 50, should fail.

    // --- Scenario 4: Critical Emergency ---
    console.log('\n[Simulating] CRITICAL EMERGENCY...');
    riskProvider.setTreasury(400000);
    await new Promise(r => setTimeout(r, 600));

    await runValidation('agent-alpha', normalAction, 'CRITICAL: Even routine actions might fail trust gating (Threshold 100)');

    // --- Scenario 5: Recovery / Reversibility ---
    console.log('\n[Simulating] Environment Recovery...');
    riskProvider.setRisk(100);
    riskProvider.setTreasury(10000000);
    await new Promise(r => setTimeout(r, 600));

    await runValidation('agent-alpha', highRiskDelegation, 'RECOVERY: Delegation Action (Should Pass again)');

    engine.stop();
    console.log('\nIntegration test completed.');
    process.exit(0);
}

runTest().catch(console.error);
