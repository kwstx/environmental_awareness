/**
 * ActionImpact represents the projected consumption or risk 
 * of an agent action before it is executed.
 */
export interface ActionImpact {
    /**
     * Estimated monetary cost of the action.
     */
    budgetRequired: number;

    /**
     * Estimated risk units this action adds to the system.
     */
    riskLevel: number;

    /**
     * Estimated computational resources required (e.g. 0.0 to 1.0).
     */
    computeUnits: number;

    /**
     * Whether this action involves delegating authority or tasks to another agent.
     */
    isDelegationAction?: boolean;

    /**
     * Optional description of the action.
     */
    description?: string;
}

export interface ValidationResult {
    approved: boolean;
    reason?: string;
    metricsChecked: string[];
    thresholdsApplied: Record<string, any>;
}
