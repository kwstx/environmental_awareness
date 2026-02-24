import { GlobalStateAPI } from '../api/GlobalStateAPI';
import { ActionImpact, ValidationResult } from '../interfaces/ActionImpact';

/**
 * PreExecutionValidator
 * 
 * Evaluates projected action impacts against real-time system-wide constraints.
 * Automatically adjusts strictness based on the Environmental Awareness layer.
 */
export class PreExecutionValidator {
    private api: GlobalStateAPI;

    // Baseline thresholds (when system is stable and pressure is low)
    private readonly baseThresholds = {
        maxBudget: 100000,   // $100k
        maxRisk: 100,        // 100 risk units
        maxCompute: 0.1,     // 10% cpu impact
    };

    constructor(api: GlobalStateAPI) {
        this.api = api;
    }

    /**
     * Validates an action before execution by evaluating its impact 
     * against current environmental conditions.
     */
    public async validateAction(agentId: string, impact: ActionImpact): Promise<ValidationResult> {
        // 1. Get current environmental awareness
        const state = await this.api.queryState(agentId);
        const { macroAwareness } = state;

        // 2. Calculate dynamic threshold multipliers
        const multiplier = this.calculateStrictnessMultiplier(macroAwareness.governanceStrictness);

        const dynamicThresholds = {
            budget: this.baseThresholds.maxBudget * multiplier,
            risk: this.baseThresholds.maxRisk * multiplier,
            compute: this.baseThresholds.maxCompute * multiplier
        };

        // 3. Perform validation checks
        const violations: string[] = [];

        if (impact.budgetRequired > dynamicThresholds.budget) {
            violations.push(`Budget impact (${impact.budgetRequired}) exceeds current threshold (${dynamicThresholds.budget.toFixed(2)})`);
        }

        if (impact.riskLevel > dynamicThresholds.risk) {
            violations.push(`Risk level (${impact.riskLevel}) exceeds current threshold (${dynamicThresholds.risk.toFixed(2)})`);
        }

        if (impact.computeUnits > dynamicThresholds.compute) {
            violations.push(`Compute impact (${impact.computeUnits}) exceeds current threshold (${dynamicThresholds.compute.toFixed(2)})`);
        }

        // 4. Special "Hard Stop" for emergency mode
        if (macroAwareness.governanceStrictness === 'emergency' && impact.riskLevel > 20) {
            violations.push('EMERGENCY MODE: High-risk actions are strictly prohibited.');
        }

        const approved = violations.length === 0;

        console.log(`[PreExecutionValidator] Agent ${agentId} action validation: ${approved ? 'APPROVED' : 'REJECTED'}`);
        if (!approved) {
            console.log(`[PreExecutionValidator] Violations: ${violations.join(', ')}`);
        }

        return {
            approved,
            reason: approved ? undefined : violations.join('; '),
            metricsChecked: ['treasury', 'risk', 'compute'],
            thresholdsApplied: {
                budgetLimit: dynamicThresholds.budget,
                riskLimit: dynamicThresholds.risk,
                computeLimit: dynamicThresholds.compute,
                strictnessMultiplier: multiplier
            }
        };
    }

    /**
     * Determines the tightening factor based on governance strictness.
     */
    private calculateStrictnessMultiplier(strictness: string): number {
        switch (strictness) {
            case 'emergency':
                return 0.1; // 90% reduction in thresholds
            case 'enhanced':
                return 0.5; // 50% reduction in thresholds
            case 'standard':
            default:
                return 1.0; // Normal thresholds
        }
    }
}
