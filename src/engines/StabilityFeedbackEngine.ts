import { EventEmitter } from 'events';
import { StateAggregationEngine } from './StateAggregationEngine';
import { RiskEscalationModule } from './RiskEscalationModule';
import { GlobalSystemState, SystemMetrics } from '../models/GlobalSystemState';
import { EscalationTier } from '../interfaces/RiskEscalation';

/**
 * StabilityAnalysis
 * 
 * Represents the results of analyzing an intervention's impact on system stability.
 */
export interface StabilityAnalysis {
    interventionId: string;
    type: 'escalation' | 'de-escalation';
    fromTier: EscalationTier;
    toTier: EscalationTier;
    timestamp: number;
    metricsAtStart: SystemMetrics;
    metricsAfterInterval: SystemMetrics;
    volatilityReduction: number;
    riskPropagationControl: number;
    treasuryPreservation: number;
    successScore: number; // Normalized score 0.0 to 1.0
}

/**
 * StabilityFeedbackEngine
 * 
 * Analyzes the effects of escalation events and environmental contractions.
 * Measures whether interventions reduce systemic volatility, risk propagation, and treasury depletion.
 * Refines escalation thresholds and contraction severity dynamically based on findings.
 */
export class StabilityFeedbackEngine extends EventEmitter {
    private aggregationEngine: StateAggregationEngine;
    private escalationModule: RiskEscalationModule;
    private stateHistory: GlobalSystemState[] = [];
    private analyses: StabilityAnalysis[] = [];

    // Configuration
    private readonly MAX_HISTORY = 100;
    private readonly ANALYSIS_WINDOW_MS = 2000; // Analysis interval after intervention (short for demo/test)

    constructor(aggregationEngine: StateAggregationEngine, escalationModule: RiskEscalationModule) {
        super();
        this.aggregationEngine = aggregationEngine;
        this.escalationModule = escalationModule;

        // Record states for trend analysis
        this.aggregationEngine.on('stateUpdated', (state: GlobalSystemState) => {
            this.recordState(state);
        });

        // Monitor for intervention events
        this.escalationModule.on('tierChanged', (data: { previousTier: EscalationTier, policy: any, timestamp: number }) => {
            this.handleIntervention(data);
        });
    }

    /**
     * Records state snapshots for historical analysis.
     */
    private recordState(state: GlobalSystemState): void {
        this.stateHistory.push(state);
        if (this.stateHistory.length > this.MAX_HISTORY) {
            this.stateHistory.shift();
        }
    }

    /**
     * Triggered when a risk tier change occurs. 
     * Schedules a post-intervention analysis.
     */
    private handleIntervention(data: { previousTier: EscalationTier, policy: any, timestamp: number }): void {
        const { previousTier, policy, timestamp } = data;
        const metricsAtStart = this.aggregationEngine.getCurrentState().metrics;

        console.log(`[StabilityFeedbackEngine] Analyzing intervention: ${EscalationTier[previousTier]} -> ${EscalationTier[policy.tier]}`);

        // Set a timer to evaluate the impact after the system has had time to react
        setTimeout(() => {
            const currentState = this.aggregationEngine.getCurrentState();
            const metricsAfter = currentState.metrics;
            this.performAnalysis(previousTier, policy.tier, metricsAtStart, metricsAfter, timestamp);
        }, this.ANALYSIS_WINDOW_MS);
    }

    /**
     * Evaluates the impact of the intervention using multiple stability indicators.
     */
    private performAnalysis(
        from: EscalationTier,
        to: EscalationTier,
        start: SystemMetrics,
        end: SystemMetrics,
        timestamp: number
    ): void {
        const isEscalation = to > from;

        // 1. Risk Propagation Control
        const riskDelta = end.aggregateAgentRiskExposure - start.aggregateAgentRiskExposure;
        let riskControlScore = 0;
        if (isEscalation) {
            riskControlScore = riskDelta <= 0 ? 1.0 : Math.max(0, 1 - (riskDelta / Math.max(start.aggregateAgentRiskExposure, 100)));
        } else {
            riskControlScore = end.aggregateAgentRiskExposure < start.aggregateAgentRiskExposure * 1.1 ? 1.0 : 0.5;
        }

        // 2. Treasury Preservation
        const treasuryDelta = end.totalTreasuryReserves - start.totalTreasuryReserves;
        let treasuryScore = 1.0;
        if (treasuryDelta < 0) {
            treasuryScore = Math.max(0, 1 - (Math.abs(treasuryDelta) / Math.max(start.totalTreasuryReserves, 1000)));
        }

        // 3. Systemic Volatility Reduction (Variance-based)
        // We look at the history leading up to the analysis point
        const windowSize = Math.floor(this.ANALYSIS_WINDOW_MS / 500); // approx snapshots in window
        const relevantHistory = this.stateHistory.slice(-windowSize);

        let volatilityScore = 1.0;
        if (relevantHistory.length > 2) {
            const computeValues = relevantHistory.map(s => s.metrics.networkComputeLoad);
            const mean = computeValues.reduce((a, b) => a + b, 0) / computeValues.length;
            const variance = computeValues.reduce((a, b) => a + (b - mean) ** 2, 0) / computeValues.length;

            // Lower variance = Higher stability
            volatilityScore = Math.max(0, 1 - (variance * 10)); // Scaled
        }

        // Aggregate Success Score
        const successScore = (riskControlScore * 0.4) + (treasuryScore * 0.3) + (volatilityScore * 0.3);

        const analysis: StabilityAnalysis = {
            interventionId: `inv_${timestamp}`,
            type: isEscalation ? 'escalation' : 'de-escalation',
            fromTier: from,
            toTier: to,
            timestamp,
            metricsAtStart: start,
            metricsAfterInterval: end,
            volatilityReduction: volatilityScore,
            riskPropagationControl: riskControlScore,
            treasuryPreservation: treasuryScore,
            successScore
        };

        this.analyses.push(analysis);

        console.log(`[StabilityFeedbackEngine] Intervention Result: ${analysis.type.toUpperCase()}`);
        console.log(` > Success Score: ${(analysis.successScore * 100).toFixed(1)}%`);
        console.log(` > Risk Control: ${riskControlScore.toFixed(2)}`);
        console.log(` > Volatility Score: ${volatilityScore.toFixed(2)}`);

        // Use findings to refine engine parameters
        if (isEscalation) {
            this.refineParameters(analysis);
        }

        this.emit('analysisCompleted', analysis);
    }

    /**
     * Generates high-level stability insights based on recent analyses.
     */
    public getStabilityInsights() {
        if (this.analyses.length === 0) return "No data available.";

        const avgSuccess = this.analyses.reduce((a, b) => a + b.successScore, 0) / this.analyses.length;
        const trend = this.analyses.length > 1
            ? (this.analyses[this.analyses.length - 1].successScore > this.analyses[this.analyses.length - 2].successScore ? 'improving' : 'declining')
            : 'stable';

        return {
            overallStabilityIndex: avgSuccess,
            trend,
            recentInterventions: this.analyses.length,
            recommendation: avgSuccess < 0.6 ? "Increase contraction severity" : "Maintain current levels"
        };
    }

    /**
     * Dynamically adjusts escalation thresholds and contraction severity.
     */
    private refineParameters(analysis: StabilityAnalysis): void {
        const { toTier, successScore } = analysis;

        // REFINEMENT LOGIC
        // If success is low (< 50%), the intervention wasn't strict enough
        if (successScore < 0.5) {
            console.log(`[StabilityFeedbackEngine] !!! LOW EFFECTIVENESS DETECTED. Tightening system response.`);

            // 1. Lower the threshold for this tier so it triggers EARLIER next time
            const thresholds = this.escalationModule.getThresholds();
            let tierKey: 'ELEVATED' | 'HIGH' | 'CRITICAL' | null = null;
            if (toTier === EscalationTier.ELEVATED) tierKey = 'ELEVATED';
            if (toTier === EscalationTier.HIGH) tierKey = 'HIGH';
            if (toTier === EscalationTier.CRITICAL) tierKey = 'CRITICAL';

            if (tierKey) {
                const currentRiskThreshold = thresholds[tierKey].riskExposure;
                this.escalationModule.updateThresholds(tierKey, {
                    riskExposure: Math.max(currentRiskThreshold * 0.85, 500) // 15% more sensitive
                });
            }

            // 2. Increase contraction severity (lower the multipliers)
            const tierDefs = this.escalationModule.getTierDefinitions();
            const currentDef = tierDefs[toTier];
            this.escalationModule.updateTierDefinition(toTier, {
                authorityLimitMultiplier: Math.max(currentDef.authorityLimitMultiplier * 0.8, 0.05),
                budgetCeilingMultiplier: Math.max(currentDef.budgetCeilingMultiplier * 0.8, 0.05)
            });
        }
        // If success is extremely high (> 90%), we might be over-restricting. 
        // We can slightly relax for autonomy.
        else if (successScore > 0.9) {
            console.log(`[StabilityFeedbackEngine] High effectiveness. Relaxing constraints for efficiency.`);
            const tierDefs = this.escalationModule.getTierDefinitions();
            const currentDef = tierDefs[toTier];
            this.escalationModule.updateTierDefinition(toTier, {
                authorityLimitMultiplier: Math.min(currentDef.authorityLimitMultiplier * 1.05, 1.0),
                budgetCeilingMultiplier: Math.min(currentDef.budgetCeilingMultiplier * 1.05, 1.0)
            });
        }
    }

    /**
     * Returns the analysis history.
     */
    public getAnalysisHistory(): StabilityAnalysis[] {
        return [...this.analyses];
    }
}
