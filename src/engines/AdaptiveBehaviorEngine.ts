import { GlobalStateAPI } from '../api/GlobalStateAPI';
import { SystemMetrics } from '../models/GlobalSystemState';
import { BehaviorPolicy } from '../interfaces/AgentBehavior';

/**
 * AdaptiveBehaviorEngine
 * 
 * Dynamically adjusts agent behavior based on environmental signals.
 * Logic implementation for:
 * - Scaling down action frequency during high-risk periods.
 * - Prioritizing cooperation when treasury reserves are low.
 * - Reallocating budgets toward high-impact tasks when resources are abundant.
 */
export class AdaptiveBehaviorEngine {
    private api: GlobalStateAPI;

    // Configuration constants for behavior adaptation
    private readonly THRESHOLDS = {
        CRITICAL_TREASURY: 1000000,   // $1M
        ABUNDANT_TREASURY: 10000000, // $10M
        HIGH_RISK_EXPOSURE: 2000,
        LOW_BUDGET_UTILIZATION: 0.3,
        CRITICAL_COMPUTE_LOAD: 0.85
    };

    constructor(api: GlobalStateAPI) {
        this.api = api;
    }

    /**
     * Computes the recommended behavior policy for a specific agent 
     * based on current global system state.
     */
    public async getBehaviorPolicy(agentId: string): Promise<BehaviorPolicy> {
        // Query the state (requires no specific permissions for macro awareness)
        const state = await this.api.queryState(agentId);
        const { metrics, macroAwareness } = state;

        // Since queryState might filter metrics, we might need to access the engine 
        // directly if we want raw metrics for internal engine logic.
        // However, usually engines have full visibility.
        // For this implementation, we'll assume the engine has internal helper logic 
        // that handles the full state if needed, but let's see if we can use ScopedState.
        // Wait, ScopedState only has permitted metrics. Behavior engine should probably 
        // use the full state under the hood.

        // I will use properties from macroAwareness as much as possible, 
        // and raw metrics if they are essential.

        const policy: BehaviorPolicy = {
            actionFrequencyMultiplier: 1.0,
            priorityMode: 'balanced',
            budgetReallocationFactor: 1.0,
            riskToleranceLimit: 100,
            rationale: 'System is operating within normal parameters.'
        };

        const rationales: string[] = [];

        // 1. Scale down action frequency during high-risk periods
        if (macroAwareness.governanceStrictness === 'emergency') {
            policy.actionFrequencyMultiplier = 0.2;
            policy.riskToleranceLimit = 20;
            rationales.push('EMERGENCY: Frequency heavily throttled for safety.');
        } else if (macroAwareness.governanceStrictness === 'enhanced') {
            policy.actionFrequencyMultiplier = 0.6;
            policy.riskToleranceLimit = 60;
            rationales.push('ENHANCED: Frequency scaled back due to system stress.');
        }

        // 1b. Proactive throttling based on forecasted stress (Leading Indicator)
        const predictiveStress = metrics.predictiveStressLevel;
        if (predictiveStress !== undefined && predictiveStress > 0.3) {
            // Apply a progressive reduction based on stress level if not already throttled by governance
            const forecastReduction = Math.max(0.3, 1.0 - predictiveStress);
            if (forecastReduction < policy.actionFrequencyMultiplier) {
                policy.actionFrequencyMultiplier = forecastReduction;
                policy.riskToleranceLimit = Math.floor(100 * forecastReduction);
                rationales.push(`FORECAST: Proactive throttling due to rising ${(predictiveStress * 100).toFixed(0)}% stress signal.`);
            }
        }

        // 2. Prioritize cooperative over competitive actions when treasury reserves are low
        // Note: queryState might not return totalTreasuryReserves if not permitted.
        // But the BehaviorEngine logic usually runs with system-level permissions.
        // We'll use the macroAwareness labels if metrics are missing.

        const treasury = metrics.totalTreasuryReserves;
        if (treasury !== undefined) {
            if (treasury < this.THRESHOLDS.CRITICAL_TREASURY) {
                policy.priorityMode = 'cooperative';
                rationales.push('TREASURY LOW: Ensuring ecosystem stability via cooperation.');
            } else if (treasury > this.THRESHOLDS.ABUNDANT_TREASURY) {
                policy.priorityMode = 'competitive'; // Allow more aggressive optimization
                rationales.push('TREASURY ABUNDANT: Encouraging competitive performance.');
            }
        } else if (macroAwareness.systemStability === 'critical') {
            policy.priorityMode = 'cooperative';
            rationales.push('STABILITY CRITICAL: Defaulting to cooperative mode.');
        }

        // 3. Reallocate budgets toward high-impact tasks when resources are abundant
        const budgetUtil = metrics.pooledBudgetUtilization;
        if (budgetUtil !== undefined && treasury !== undefined) {
            if (budgetUtil < this.THRESHOLDS.LOW_BUDGET_UTILIZATION && treasury > this.THRESHOLDS.ABUNDANT_TREASURY) {
                policy.budgetReallocationFactor = 1.5;
                rationales.push('SURPLUS DETECTED: Scaling budget for high-impact growth tasks.');
            }
        }

        // Update rationale
        if (rationales.length > 0) {
            policy.rationale = rationales.join(' ');
        }

        return policy;
    }
}
