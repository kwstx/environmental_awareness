/**
 * EscalationTier defines the severity levels of system risk.
 */
export enum EscalationTier {
    /**
     * TIER_0: Normal operations. Baseline constraints apply.
     */
    STABLE = 0,

    /**
     * TIER_1: Elevated risk detected. Tightening authority and limits.
     */
    ELEVATED = 1,

    /**
     * TIER_2: High risk environment. Significantly reduced budgets and deep validation.
     */
    HIGH = 2,

    /**
     * TIER_3: Multi-dimensional crisis or extreme risk. Maximum restrictions and mandatory consensus.
     */
    CRITICAL = 3
}

/**
 * RiskEscalationPolicy defines the governance constraints for a specific tier.
 */
export interface RiskEscalationPolicy {
    tier: EscalationTier;

    /**
     * Multiplier for authority permissions (0.0 to 1.0).
     * e.g., 0.5 means agents only have half their usual delegation scope.
     */
    authorityLimitMultiplier: number;

    /**
     * Contraction factor for delegation rights. 
     * Higher values (0.0 to 1.0) indicate how much of the delegation right is preserved.
     */
    delegationRightsContractionFactor: number;

    /**
     * Multiplier for the maximum budget an agent can request/utilize (0.0 to 1.0).
     */
    budgetCeilingMultiplier: number;

    /**
     * Scaling factor for trust-based gating. 
     * Values > 1.0 increase the required trust score for actions.
     */
    trustGatingMultiplier: number;

    /**
     * Number of additional validation checks or "depth" required for execution.
     */
    validationDepthBonus: number;

    /**
     * Whether high-impact actions MUST be confirmed by multiple independent agents.
     */
    multiAgentConfirmationRequired: boolean;

    /**
     * Human-readable rationale for the escalation tier activation.
     */
    rationale: string;
}
