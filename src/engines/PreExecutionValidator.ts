import { GlobalStateAPI } from '../api/GlobalStateAPI';
import { RiskEscalationModule } from './RiskEscalationModule';
import { ActionImpact, ValidationResult } from '../interfaces/ActionImpact';
import { EscalationTier } from '../interfaces/RiskEscalation';
import { IdentityTrustProvider } from '../providers/IdentityTrustProvider';

/**
 * PreExecutionValidator
 * 
 * Evaluates projected action impacts against real-time system-wide constraints.
 * Automatically adjusts strictness based on the Environmental Awareness layer.
 */
export class PreExecutionValidator {
    private api: GlobalStateAPI;
    private escalationModule?: RiskEscalationModule;
    private trustProvider?: IdentityTrustProvider;

    // Baseline thresholds (when system is stable and pressure is low)
    private readonly baseThresholds = {
        maxBudget: 100000,   // $100k
        maxRisk: 100,        // 100 risk units
        maxCompute: 0.1,     // 10% cpu impact
        minTrustScore: 40,   // Default minimum trust score
    };

    constructor(api: GlobalStateAPI, escalationModule?: RiskEscalationModule, trustProvider?: IdentityTrustProvider) {
        this.api = api;
        this.escalationModule = escalationModule;
        this.trustProvider = trustProvider;
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
        let multiplier = this.calculateStrictnessMultiplier(macroAwareness.governanceStrictness);
        let budgetMultiplier = multiplier;
        let authorityMultiplier = 1.0;
        let delegationMultiplier = 1.0;
        let trustMultiplier = 1.0;
        let validationDepth = 0;
        let multiAgentRequired = false;

        if (this.escalationModule) {
            const policy = this.escalationModule.getActivePolicy();
            budgetMultiplier = policy.budgetCeilingMultiplier;
            authorityMultiplier = policy.authorityLimitMultiplier;
            delegationMultiplier = policy.delegationRightsContractionFactor;
            trustMultiplier = policy.trustGatingMultiplier;
            validationDepth = policy.validationDepthBonus;
            multiAgentRequired = policy.multiAgentConfirmationRequired;

            // Use authority multiplier as base for risk/compute
            multiplier = authorityMultiplier;
        }

        const dynamicThresholds = {
            budget: this.baseThresholds.maxBudget * budgetMultiplier,
            risk: this.baseThresholds.maxRisk * multiplier,
            compute: this.baseThresholds.maxCompute * multiplier,
            trust: this.baseThresholds.minTrustScore * trustMultiplier,
            delegationRiskLimit: 100 * delegationMultiplier
        };

        // 3. Perform validation checks
        const violations: string[] = [];

        // Economic constraint check
        if (impact.budgetRequired > dynamicThresholds.budget) {
            violations.push(`ECONOMIC CONSTRAINT: Budget impact (${impact.budgetRequired}) exceeds current threshold (${dynamicThresholds.budget.toFixed(2)})`);
        }

        // Risk and Compute checks
        if (impact.riskLevel > dynamicThresholds.risk) {
            violations.push(`RISK CONSTRAINT: Risk level (${impact.riskLevel}) exceeds current threshold (${dynamicThresholds.risk.toFixed(2)})`);
        }

        if (impact.computeUnits > dynamicThresholds.compute) {
            violations.push(`RESOURCE CONSTRAINT: Compute impact (${impact.computeUnits}) exceeds current threshold (${dynamicThresholds.compute.toFixed(2)})`);
        }

        // Delegation rights contraction check
        if (impact.isDelegationAction) {
            if (impact.riskLevel > dynamicThresholds.delegationRiskLimit) {
                violations.push(`DELEGATION CONTRACTION: High-risk delegation (${impact.riskLevel}) blocked by current contraction factor (${delegationMultiplier.toFixed(2)})`);
            }
        }

        // Trust-based gating check
        if (this.trustProvider) {
            const agentTrust = await this.trustProvider.getAgentTrustScore(agentId);
            if (agentTrust < dynamicThresholds.trust) {
                violations.push(`TRUST GATING: Agent trust score (${agentTrust.toFixed(2)}) is below required threshold (${dynamicThresholds.trust.toFixed(2)}) for current risk tier.`);
            }
        }

        // 4. Special "Hard Stop" for emergency mode
        if (macroAwareness.governanceStrictness === 'emergency' && impact.riskLevel > 20) {
            violations.push('EMERGENCY MODE: High-risk actions are strictly prohibited.');
        }

        // 5. Multi-agent confirmation check
        if (multiAgentRequired && impact.riskLevel > 10) {
            violations.push(`MULTI-AGENT CONSENSUS REQUIRED: Action risk (${impact.riskLevel}) exceeds consensus-free threshold during ${EscalationTier[macroAwareness.escalationTier]} tier.`);
        }

        const approved = violations.length === 0;

        console.log(`[PreExecutionValidator] Agent ${agentId} action validation: ${approved ? 'APPROVED' : 'REJECTED'}`);
        if (!approved) {
            console.log(`[PreExecutionValidator] Violations: ${violations.join(', ')}`);
        }

        return {
            approved,
            reason: approved ? undefined : violations.join('; '),
            metricsChecked: ['treasury', 'risk', 'compute', 'trust', 'delegation'],
            thresholdsApplied: {
                budgetLimit: dynamicThresholds.budget,
                riskLimit: dynamicThresholds.risk,
                computeLimit: dynamicThresholds.compute,
                trustThreshold: dynamicThresholds.trust,
                delegationLimit: dynamicThresholds.delegationRiskLimit,
                strictnessMultiplier: multiplier,
                validationDepth,
                multiAgentRequired
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
