import { StateAggregationEngine } from '../engines/StateAggregationEngine';
import { GlobalSystemState, SystemMetrics } from '../models/GlobalSystemState';

/**
 * AccessPolicy defines what metrics an agent is allowed to view.
 */
export interface AccessPolicy {
    agentId: string;
    permittedMetrics: (keyof SystemMetrics | string)[];
    description?: string;
}

/**
 * ScopedState is the filtered view of the global system state returned to an agent.
 */
export interface ScopedState {
    id: string;
    timestamp: number;
    metrics: Partial<SystemMetrics>;
    macroAwareness: {
        systemStability: 'stable' | 'stressed' | 'critical';
        resourcePressure: 'low' | 'moderate' | 'high';
        governanceStrictness: 'standard' | 'enhanced' | 'emergency';
    };
    version: string;
}

/**
 * GlobalStateAPI
 * 
 * Provides a secure, scoped interface for agents to query system conditions.
 * Ensures agents only see data they are permitted to access while maintaining 
 * enough situational awareness for intelligent adaptation.
 */
export class GlobalStateAPI {
    private engine: StateAggregationEngine;
    private policies: Map<string, AccessPolicy> = new Map();

    constructor(engine: StateAggregationEngine) {
        this.engine = engine;
    }

    /**
     * Configures access permissions for a specific agent.
     */
    public setAccessPolicy(policy: AccessPolicy): void {
        this.policies.set(policy.agentId, policy);
        console.log(`[GlobalStateAPI] Access policy configured for agent: ${policy.agentId}`);
    }

    /**
     * Executes a query against the current system state.
     * The result is automatically filtered based on the agent's registered policy.
     */
    public async queryState(agentId: string): Promise<ScopedState> {
        const fullState = this.engine.getCurrentState();
        const policy = this.policies.get(agentId);

        // If no policy exists, the agent receives only macro-level awareness data
        const permittedMetrics = policy ? policy.permittedMetrics : [];
        const filteredMetrics: Partial<SystemMetrics> = {};

        for (const key of permittedMetrics) {
            if (fullState.metrics[key as string] !== undefined) {
                filteredMetrics[key as any] = fullState.metrics[key as string];
            }
        }

        return {
            id: fullState.id,
            timestamp: fullState.timestamp,
            version: fullState.version,
            metrics: filteredMetrics,
            macroAwareness: this.deriveMacroAwareness(fullState),
        };
    }

    /**
     * Derives high-level system indicators from raw metrics.
     * This provides the "system-level awareness" even for restricted agents.
     */
    private deriveMacroAwareness(state: GlobalSystemState): ScopedState['macroAwareness'] {
        const { metrics } = state;

        // 1. System Stability
        let stability: 'stable' | 'stressed' | 'critical' = 'stable';

        // Adjusting thresholds based on project baseline (e.g. Risk > 2000 is critical)
        const riskLevel = metrics.aggregateAgentRiskExposure;
        const violationRate = metrics.policyViolationFrequency;

        if (riskLevel > 2000 || violationRate > 0.1) {
            stability = 'critical';
        } else if (riskLevel > 1750 || violationRate > 0.05) {
            stability = 'stressed';
        }

        // 2. Resource Pressure
        let pressure: 'low' | 'moderate' | 'high' = 'low';
        const computeLoad = metrics.networkComputeLoad;
        const budgetUsage = metrics.pooledBudgetUtilization;

        if (computeLoad > 0.85 || budgetUsage > 0.9) {
            pressure = 'high';
        } else if (computeLoad > 0.6 || budgetUsage > 0.7) {
            pressure = 'moderate';
        }

        // 3. Governance Strictness
        // Automatically derives how strictly the system should be governed based on conditions.
        let strictness: 'standard' | 'enhanced' | 'emergency' = 'standard';
        if (stability === 'critical' || pressure === 'high') {
            strictness = 'emergency';
        } else if (stability === 'stressed' || pressure === 'moderate') {
            strictness = 'enhanced';
        }

        return {
            systemStability: stability,
            resourcePressure: pressure,
            governanceStrictness: strictness
        };
    }

    /**
     * Utility to check if an agent has access to a specific metric.
     */
    public hasAccess(agentId: string, metricKey: keyof SystemMetrics): boolean {
        const policy = this.policies.get(agentId);
        return policy ? policy.permittedMetrics.includes(metricKey) : false;
    }

    /**
     * Returns all registered access policies.
     */
    public getAllPolicies(): AccessPolicy[] {
        return Array.from(this.policies.values());
    }
}
