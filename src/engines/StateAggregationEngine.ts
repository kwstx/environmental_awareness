import { EventEmitter } from 'events';
import { GlobalSystemState, SystemMetrics } from '../models/GlobalSystemState';
import { DataProvider } from '../interfaces/DataProvider';
import { EnvironmentAuditLedger } from './EnvironmentAuditLedger';
import { AuditEventType } from '../interfaces/AuditLog';

export interface EngineConfig {
    updateIntervalMs: number;
    initialState?: Partial<SystemMetrics>;
}

/**
 * StateAggregationEngine
 * 
 * Continuously collects metrics from various data providers and 
 * aggregates them into a standardized GlobalSystemState.
 */
export class StateAggregationEngine extends EventEmitter {
    private providers: DataProvider[] = [];
    private currentMetrics: SystemMetrics;
    private timer: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private config: EngineConfig;

    constructor(config: EngineConfig) {
        super();
        this.config = config;
        this.currentMetrics = this.getEmptyMetrics();
        if (config.initialState) {
            this.currentMetrics = { ...this.currentMetrics, ...config.initialState };
        }
    }

    private getEmptyMetrics(): SystemMetrics {
        return {
            totalTreasuryReserves: 0,
            pooledBudgetUtilization: 0,
            aggregateAgentRiskExposure: 0,
            networkComputeLoad: 0,
            policyViolationFrequency: 0,
            cooperativeEfficiencyScores: 0,
            ongoingTaskDensity: 0,
            predictiveStressLevel: 0
        };
    }

    /**
     * Registers a new data provider.
     */
    public registerProvider(provider: DataProvider): void {
        this.providers.push(provider);
        console.log(`[StateAggregationEngine] Provider registered: ${provider.name}`);
    }

    /**
     * Starts the continuous collection loop.
     */
    public async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log(`[StateAggregationEngine] Engine started. Update interval: ${this.config.updateIntervalMs}ms`);

        // Perform initial collection immediately
        await this.collect();

        this.timer = setInterval(() => this.collect(), this.config.updateIntervalMs);
    }

    /**
     * Stops the continuous collection loop.
     */
    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        console.log('[StateAggregationEngine] Engine stopped.');
    }

    /**
     * Collects data from all registered providers and updates the global state.
     */
    private async collect(): Promise<void> {
        try {
            const collectionPromises = this.providers.map(async (provider) => {
                try {
                    const metrics = await provider.fetchMetrics();
                    return { name: provider.name, metrics };
                } catch (error) {
                    console.error(`[StateAggregationEngine] Failed to fetch metrics from ${provider.name}:`, error);
                    return { name: provider.name, metrics: {} };
                }
            });

            const results = await Promise.all(collectionPromises);

            // Aggregate and normalize heterogeneous metrics
            const aggregatedMetrics = this.normalize(results);

            // Update internal state
            this.currentMetrics = {
                ...this.currentMetrics,
                ...aggregatedMetrics
            };

            const newState = GlobalSystemState.snapshot(this.currentMetrics, {
                activeProviders: this.providers.length,
                lastCollectionTime: Date.now()
            });

            // Log state change to immutable ledger
            EnvironmentAuditLedger.getInstance().logEvent({
                eventType: AuditEventType.STATE_CHANGE,
                contributingMetrics: { ...this.currentMetrics },
                description: `Environmental state updated via aggregation from ${this.providers.length} providers.`,
                metadata: {
                    activeProviders: this.providers.length
                }
            });

            this.emit('stateUpdated', newState);
        } catch (criticalError) {
            console.error('[StateAggregationEngine] Critical error during state aggregation:', criticalError);
        }
    }

    /**
   * Normalizes metrics from different sources into a standardized format.
   * This is where heterogeneous data mapping and standardization occurs.
   */
    private normalize(rawResults: Array<{ name: string, metrics: Partial<SystemMetrics> }>): Partial<SystemMetrics> {
        const combined: Partial<SystemMetrics> = {};
        const contributions: Record<string, number[]> = {};

        for (const result of rawResults) {
            const { metrics } = result;

            for (const [key, value] of Object.entries(metrics)) {
                if (value === undefined || value === null || typeof value !== 'number') continue;

                // Collect contributions for averaging if multiple providers report the same metric
                if (!contributions[key]) {
                    contributions[key] = [];
                }
                contributions[key].push(value);
            }
        }

        // Process collected contributions
        for (const [key, values] of Object.entries(contributions)) {
            // For most metrics, we take the average or the max depending on the context.
            // Here we use a switch to define standardization rules per metric type.
            let finalValue: number;

            switch (key) {
                case 'aggregateAgentRiskExposure':
                    // For risk, we take the maximum reported exposure for safety
                    finalValue = Math.max(...values);
                    break;

                case 'totalTreasuryReserves':
                    // Treasury is usually a single source of truth, but if multiple report, we might sum or take most recent.
                    // Here we take the first available.
                    finalValue = values[0];
                    break;

                case 'pooledBudgetUtilization':
                case 'networkComputeLoad':
                    // Average utilization across reporting nodes
                    finalValue = values.reduce((a, b) => a + b, 0) / values.length;
                    finalValue = Math.min(Math.max(finalValue, 0), 1); // Clamp 0-1
                    break;

                case 'cooperativeEfficiencyScores':
                    // Average cooperation score
                    finalValue = values.reduce((a, b) => a + b, 0) / values.length;
                    finalValue = Math.min(Math.max(finalValue, 0), 100); // Clamp 0-100
                    break;

                default:
                    // Default to average
                    finalValue = values.reduce((a, b) => a + b, 0) / values.length;
            }

            combined[key] = finalValue;
        }

        return combined;
    }

    /**
     * Returns the most recent snapshot of the system state.
     */
    public getCurrentState(): GlobalSystemState {
        return GlobalSystemState.snapshot(this.currentMetrics);
    }
}
