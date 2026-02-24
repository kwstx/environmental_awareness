import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { RiskEscalationModule } from './engines/RiskEscalationModule';
import { StabilityFeedbackEngine } from './engines/StabilityFeedbackEngine';
import { EscalationTier } from './interfaces/RiskEscalation';

/**
 * Mock Provider for testing
 */
class TestingRiskProvider {
    name = 'TestingRiskProvider';
    public risk = 100;
    public violations = 0;
    public treasury = 5000000;
    public load = 0.1;

    async fetchMetrics() {
        return {
            aggregateAgentRiskExposure: this.risk,
            policyViolationFrequency: this.violations,
            totalTreasuryReserves: this.treasury,
            networkComputeLoad: this.load
        };
    }
}

async function runTest() {
    console.log('=== Stability Feedback Engine Integration Test ===\n');

    // 1. Setup
    const aggregationEngine = new StateAggregationEngine({ updateIntervalMs: 500 });
    const riskProvider = new TestingRiskProvider();
    aggregationEngine.registerProvider(riskProvider as any);

    const escalationModule = new RiskEscalationModule(aggregationEngine);
    const feedbackEngine = new StabilityFeedbackEngine(aggregationEngine, escalationModule);

    // Monitor for analysis events
    feedbackEngine.on('analysisCompleted', (analysis) => {
        console.log(`\n[STABILITY REPORT] Intervention ID: ${analysis.interventionId}`);
        console.log(` > Result: ${analysis.successScore < 0.5 ? 'FAILURE (Insufficient Mitigation)' : 'SUCCESS'}`);
        console.log(` > Score: ${(analysis.successScore * 100).toFixed(1)}%`);
        console.log(` > Risk Propagation Control: ${analysis.riskPropagationControl.toFixed(2)}`);

        // Check if thresholds updated
        const thresholds = escalationModule.getThresholds();
        console.log(` > Current ELEVATED Risk Threshold: ${thresholds.ELEVATED.riskExposure.toFixed(0)}`);

        const tierDefs = escalationModule.getTierDefinitions();
        console.log(` > ELEVATED Auth Multiplier: ${tierDefs[EscalationTier.ELEVATED].authorityLimitMultiplier.toFixed(3)}`);
    });

    await aggregationEngine.start();

    // --- Scenario 1: Trigger Escalation that FAILS to stop risk growth ---
    console.log('\n[Simulating] Rapidly rising risk (Scenario: Weak Intervention)');
    riskProvider.risk = 1600; // Above ELEVATED (1500)

    // Wait for tier change and analysis window
    // Tier change happens at 500ms
    // Analysis window is 2000ms
    await new Promise(r => setTimeout(r, 1000));

    console.log('[Simulating] Risk continues to grow despite escalation...');
    riskProvider.risk = 2500; // Still increasing!
    riskProvider.violations = 0.2;

    await new Promise(r => setTimeout(r, 2000));

    // --- Scenario 2: Risk drops (Scenario: Effective Intervention) ---
    console.log('\n[Simulating] Risk dropping due to tightened rules...');
    riskProvider.risk = 1000;
    riskProvider.violations = 0.01;

    await new Promise(r => setTimeout(r, 3000)); // wait for stabilization

    aggregationEngine.stop();
    console.log('\nTest completed.');
    process.exit(0);
}

runTest().catch(console.error);
