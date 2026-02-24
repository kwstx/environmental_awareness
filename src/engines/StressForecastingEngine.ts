import { DataProvider } from '../interfaces/DataProvider';
import { GlobalSystemState, SystemMetrics } from '../models/GlobalSystemState';
import { StateAggregationEngine } from './StateAggregationEngine';
import { RiskEscalationModule } from './RiskEscalationModule';
import { EscalationTier } from '../interfaces/RiskEscalation';

/**
 * StressForecastingEngine
 * 
 * Predicts future environmental stress by analyzing trends in treasury, task density, 
 * cooperative performance, and risk escalation frequency.
 * Enables proactive constraint adjustment (pre-instability).
 */
export class StressForecastingEngine implements DataProvider {
    public readonly name = 'StressForecastingEngine';

    private stateHistory: GlobalSystemState[] = [];
    private escalationEvents: { timestamp: number, tier: EscalationTier }[] = [];
    private currentForecastedStress: number = 0;

    // Configuration
    private readonly MAX_HISTORY = 60; // 1 minute if updates are every 1s
    private readonly ESCALATION_WINDOW_MS = 300000; // 5 minutes for frequency analysis
    private readonly TREND_WINDOW = 10; // Samples to look back for short-term trend

    constructor(
        private aggregationEngine: StateAggregationEngine,
        private escalationModule: RiskEscalationModule
    ) {
        // Subscribe to state updates to build history and update predictions
        this.aggregationEngine.on('stateUpdated', (state: GlobalSystemState) => {
            this.recordState(state);
            this.calculateForecast();
        });

        // Subscribe to escalation events
        this.escalationModule.on('tierChanged', (data: { previousTier: EscalationTier, policy: any, timestamp: number }) => {
            if (data.policy.tier > data.previousTier) {
                this.escalationEvents.push({
                    timestamp: data.timestamp,
                    tier: data.policy.tier
                });
                this.cleanEscalationEvents();
            }
        });
    }

    /**
     * DataProvider Interface: Returns the forecasted stress level.
     */
    public async fetchMetrics(): Promise<Partial<SystemMetrics>> {
        return {
            predictiveStressLevel: this.currentForecastedStress
        };
    }

    /**
     * DataProvider Interface: Returns health status.
     */
    public async getHealthStatus(): Promise<'healthy' | 'degraded' | 'offline'> {
        return this.stateHistory.length > 0 ? 'healthy' : 'degraded';
    }

    /**
     * Records state snapshots for historical trend analysis.
     */
    private recordState(state: GlobalSystemState): void {
        this.stateHistory.push(state);
        if (this.stateHistory.length > this.MAX_HISTORY) {
            this.stateHistory.shift();
        }
    }

    /**
     * Removes old escalation events from history.
     */
    private cleanEscalationEvents(): void {
        const now = Date.now();
        this.escalationEvents = this.escalationEvents.filter(e => now - e.timestamp < this.ESCALATION_WINDOW_MS);
    }

    /**
     * Core prediction logic: Analyzes multiple vectors to forecast stress.
     */
    private calculateForecast(): void {
        if (this.stateHistory.length < 5) return;

        const current = this.stateHistory[this.stateHistory.length - 1].metrics;
        const previous = this.stateHistory[this.stateHistory.length - this.TREND_WINDOW]
            || this.stateHistory[0];

        const deltaT = (this.stateHistory[this.stateHistory.length - 1].timestamp - previous.timestamp) / 1000;
        if (deltaT <= 0) return;

        // 1. Treasury Fluctuation (Negative Trend = Stress)
        const treasuryDelta = current.totalTreasuryReserves - previous.metrics.totalTreasuryReserves;
        const treasuryVelocity = treasuryDelta / deltaT;
        let treasuryStress = 0;
        if (treasuryVelocity < 0) {
            // High depletion rate increases stress (scaled: 1M depletion / sec is high)
            treasuryStress = Math.min(1.0, Math.abs(treasuryVelocity) / 500000);
        }

        // 2. Task Density Trend (Positive Trend = Stress)
        const densityDelta = current.ongoingTaskDensity - previous.metrics.ongoingTaskDensity;
        const densityVelocity = densityDelta / deltaT;
        let densityStress = 0;
        if (densityVelocity > 0) {
            // Rising task density suggests impending bottlenecks
            densityStress = Math.min(1.0, densityVelocity * 5); // 0.2 units/sec is high
        }

        // 3. Cooperative Performance Deterioration
        const coopDelta = current.cooperativeEfficiencyScores - previous.metrics.cooperativeEfficiencyScores;
        let coopStress = 0;
        if (coopDelta < 0) {
            // Dropping efficiency indicates friction or resource contention
            coopStress = Math.min(1.0, Math.abs(coopDelta) / 20); // 20 point drop is significant
        }

        // 4. Escalation Frequency
        this.cleanEscalationEvents();
        // 3+ escalations in 5 mins is high frequency
        const escalationStress = Math.min(1.0, this.escalationEvents.length / 3);

        // Weighted Aggregation
        // - Treasury is a lagging but fatal indicator (0.3)
        // - Task Density is a leading indicator (0.3)
        // - Coop Efficiency is a health indicator (0.2)
        // - Escalation Frequency is a volatility indicator (0.2)

        const rawStress = (treasuryStress * 0.3) +
            (densityStress * 0.3) +
            (coopStress * 0.2) +
            (escalationStress * 0.2);

        // Apply smoothing to avoid jitter
        this.currentForecastedStress = (this.currentForecastedStress * 0.8) + (rawStress * 0.2);

        if (this.currentForecastedStress > 0.1) {
            console.log(`[StressForecastingEngine] Forecast updated: ${(this.currentForecastedStress * 100).toFixed(1)}%`);
            if (treasuryStress > 0.5) console.log(` -> Warning: Rapid treasury depletion`);
            if (densityStress > 0.5) console.log(` -> Warning: Task density spike`);
            if (escalationStress > 0.5) console.log(` -> Warning: High escalation frequency`);
        }
    }

    /**
     * Returns the current components of the stress forecast for debugging/UI.
     */
    public getForecastBreakdown() {
        return {
            overall: this.currentForecastedStress,
            indicators: {
                treasuryDepletion: "Analyzing history...",
                taskDensitySurge: "Analyzing history...",
                efficiencyLoss: "Analyzing history...",
                volatility: this.escalationEvents.length > 1 ? "Elevated" : "Normal"
            }
        };
    }
}
