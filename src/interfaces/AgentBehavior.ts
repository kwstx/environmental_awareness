/**
 * AgentBehavior defines the dynamic adjustments proposed by the 
 * AdaptiveBehaviorEngine for an agent's operational parameters.
 */
export interface BehaviorPolicy {
    /**
     * Multiplier for the frequency of actions (0.0 to 1.0).
     * Used to throttle agents during high-risk or high-load periods.
     */
    actionFrequencyMultiplier: number;

    /**
     * Recommended mode for choosing between cooperative and competitive actions.
     */
    priorityMode: 'cooperative' | 'balanced' | 'competitive';

    /**
     * Factor to scale the allocated budget for high-impact tasks (e.g. 1.0 = baseline).
     */
    budgetReallocationFactor: number;

    /**
     * Suggested maximum risk per action.
     */
    riskToleranceLimit: number;

    /**
     * Human-readable rationale for the current policy.
     */
    rationale: string;
}
