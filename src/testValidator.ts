import { StateAggregationEngine } from './engines/StateAggregationEngine';
import { GlobalStateAPI } from './api/GlobalStateAPI';
import { PreExecutionValidator } from './engines/PreExecutionValidator';
import { ActionImpact } from './interfaces/ActionImpact';

async function runDemo() {
    console.log('--- Pre-Execution Environmental Validation Demo ---\n');

    // 1. SCENARIO: STABLE ENVIRONMENT
    console.log('>>> Scenario 1: Stable System (Standard Strictness)');
    const stableEngine = new StateAggregationEngine({
        updateIntervalMs: 10000,
        initialState: {
            totalTreasuryReserves: 5000000,
            pooledBudgetUtilization: 0.2,
            aggregateAgentRiskExposure: 500,
            networkComputeLoad: 0.3,
            policyViolationFrequency: 0.01,
            cooperativeEfficiencyScores: 95,
            ongoingTaskDensity: 100
        }
    });

    const api1 = new GlobalStateAPI(stableEngine);
    const validator1 = new PreExecutionValidator(api1);

    const moderateImpact: ActionImpact = {
        budgetRequired: 5000,
        riskLevel: 40,
        computeUnits: 0.02,
        description: 'Standard optimization task'
    };

    const result1 = await validator1.validateAction('agent_01', moderateImpact);
    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log('--------------------------------------------------\n');


    // 2. SCENARIO: STRESSED ENVIRONMENT
    console.log('>>> Scenario 2: Stressed System (Enhanced Strictness)');
    console.log('Conditions: High Risk Exposure (1800)');
    const stressedEngine = new StateAggregationEngine({
        updateIntervalMs: 10000,
        initialState: {
            totalTreasuryReserves: 4000000,
            pooledBudgetUtilization: 0.5,
            aggregateAgentRiskExposure: 1800, // Trigger for 'stressed'
            networkComputeLoad: 0.7,
            policyViolationFrequency: 0.04,
            cooperativeEfficiencyScores: 80,
            ongoingTaskDensity: 400
        }
    });

    const api2 = new GlobalStateAPI(stressedEngine);
    const validator2 = new PreExecutionValidator(api2);

    const result2 = await validator2.validateAction('agent_01', moderateImpact);
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log('Note: The same impact is now rejected because thresholds were halved.');
    console.log('--------------------------------------------------\n');


    // 3. SCENARIO: EMERGENCY ENVIRONMENT
    console.log('>>> Scenario 3: Critical/Emergency System (Emergency Strictness)');
    console.log('Conditions: Critical Risk (2500) and High Compute Load (0.9)');
    const emergencyEngine = new StateAggregationEngine({
        updateIntervalMs: 10000,
        initialState: {
            totalTreasuryReserves: 2000000,
            pooledBudgetUtilization: 0.95,
            aggregateAgentRiskExposure: 2500, // Trigger for 'critical'
            networkComputeLoad: 0.92,        // Trigger for 'high pressure'
            policyViolationFrequency: 0.15,
            cooperativeEfficiencyScores: 40,
            ongoingTaskDensity: 800
        }
    });

    const api3 = new GlobalStateAPI(emergencyEngine);
    const validator3 = new PreExecutionValidator(api3);

    const tinyImpact: ActionImpact = {
        budgetRequired: 500,
        riskLevel: 5,
        computeUnits: 0.005,
        description: 'Minor cleanup task'
    };

    const result3 = await validator3.validateAction('agent_01', tinyImpact);
    console.log('Result:', JSON.stringify(result3, null, 2));

    const riskyImpact: ActionImpact = {
        budgetRequired: 1000,
        riskLevel: 25,
        computeUnits: 0.01,
        description: 'Emergency patch with moderate risk'
    };
    const result4 = await validator3.validateAction('agent_01', riskyImpact);
    console.log('\nRisky Patch Result:', JSON.stringify(result4, null, 2));
    console.log('--------------------------------------------------\n');


    // 4. SCENARIO: TREASURY STRESS
    console.log('>>> Scenario 4: Treasury Stress (Enhanced Strictness)');
    console.log('Conditions: Low Treasury Reserves (1,500,000)');
    const treasuryStressedEngine = new StateAggregationEngine({
        updateIntervalMs: 10000,
        initialState: {
            totalTreasuryReserves: 1500000, // Trigger for 'stressed'
            pooledBudgetUtilization: 0.3,
            aggregateAgentRiskExposure: 500,
            networkComputeLoad: 0.2,
            policyViolationFrequency: 0.01,
            cooperativeEfficiencyScores: 90,
            ongoingTaskDensity: 100
        }
    });

    const api4 = new GlobalStateAPI(treasuryStressedEngine);
    const validator4 = new PreExecutionValidator(api4);

    const highCostAction: ActionImpact = {
        budgetRequired: 60000,
        riskLevel: 10,
        computeUnits: 0.01,
        description: 'Large capital deployment'
    };

    const result5 = await validator4.validateAction('agent_01', highCostAction);
    console.log('Result:', JSON.stringify(result5, null, 2));
    console.log('Note: Large budget request rejected due to treasury stress tightening thresholds.');
}

runDemo().catch(console.error);
