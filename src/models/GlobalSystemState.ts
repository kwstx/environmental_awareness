/**
 * GlobalSystemState Model
 * 
 * Aggregates real-time system-wide metrics for the Environmental Awareness layer.
 * Designed for extensibility to allow new macro-level indicators without breaking compatibility.
 */

export interface SystemMetrics {
    /**
     * Total liquid assets and reserves held by the system treasury.
     */
    totalTreasuryReserves: number;

    /**
     * Percentage (0.0 to 1.0) of the pooled budget currently utilized across all agents.
     */
    pooledBudgetUtilization: number;

    /**
     * Cumulative risk value based on active agent operations and their potential impact.
     */
    aggregateAgentRiskExposure: number;

    /**
     * Current network-wide computational resource consumption (e.g., 0.0 to 1.0).
     */
    networkComputeLoad: number;

    /**
     * Measured frequency of policy violations across the ecosystem per time unit.
     */
    policyViolationFrequency: number;

    /**
     * Normalized score (e.g., 0-100) representing how efficiently agents are collaborating.
     */
    cooperativeEfficiencyScores: number;

    /**
     * Number of active/ongoing tasks relative to system capacity.
     */
    ongoingTaskDensity: number;

    /**
     * Extensibility point: Allow for any additional macro-level indicators.
     * This ensures new metrics can be added without breaking existing schema consumers.
     */
    [indicatorKey: string]: any;
}

export interface GlobalSystemStateData {
    id?: string;
    timestamp?: number;
    metrics: SystemMetrics;
    metadata?: Record<string, any>;
    version?: string;
}

export class GlobalSystemState {
    public readonly id: string;
    public readonly timestamp: number;
    public readonly version: string;
    public readonly metrics: SystemMetrics;
    public readonly metadata: Record<string, any>;

    constructor(data: GlobalSystemStateData) {
        this.id = data.id || `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.timestamp = data.timestamp || Date.now();
        this.version = data.version || '1.0.0';

        // Core metrics initialization
        this.metrics = {
            ...data.metrics
        };

        this.metadata = data.metadata || {};
    }

    /**
     * Creates a new snapshot of the global system state.
     */
    static snapshot(metrics: SystemMetrics, metadata?: Record<string, any>): GlobalSystemState {
        return new GlobalSystemState({ metrics, metadata });
    }

    /**
     * Returns a copy of the state with an additional or updated metric.
     * Demonstrates extensibility in practice.
     */
    public updateMetric(name: string, value: any): GlobalSystemState {
        return new GlobalSystemState({
            ...this,
            metrics: {
                ...this.metrics,
                [name]: value
            }
        });
    }

    /**
     * Validates the core metrics are present and within expected ranges.
     */
    public validate(): boolean {
        const required = [
            'totalTreasuryReserves',
            'pooledBudgetUtilization',
            'aggregateAgentRiskExposure',
            'networkComputeLoad',
            'policyViolationFrequency',
            'cooperativeEfficiencyScores',
            'ongoingTaskDensity'
        ];

        for (const key of required) {
            if (this.metrics[key] === undefined || this.metrics[key] === null) {
                return false;
            }
        }

        return true;
    }

    public toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            version: this.version,
            metrics: this.metrics,
            metadata: this.metadata
        };
    }
}
