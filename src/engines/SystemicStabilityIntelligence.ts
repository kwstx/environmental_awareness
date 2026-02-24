import { EventEmitter } from 'events';
import { StateAggregationEngine } from './StateAggregationEngine';
import { RiskEscalationModule } from './RiskEscalationModule';
import { StabilityFeedbackEngine } from './StabilityFeedbackEngine';
import { StressForecastingEngine } from './StressForecastingEngine';
import { AdaptiveBehaviorEngine } from './AdaptiveBehaviorEngine';
import { GlobalStateAPI, ScopedState } from '../api/GlobalStateAPI';
import { GlobalSystemState, SystemMetrics } from '../models/GlobalSystemState';
import { EscalationTier, RiskEscalationPolicy } from '../interfaces/RiskEscalation';
import { BehaviorPolicy } from '../interfaces/AgentBehavior';

/**
 * MacroStabilitySnapshot
 * 
 * A comprehensive view of the system's stability, combining current metrics,
 * future forecasts, governance state, and economic parameters.
 */
export interface MacroStabilitySnapshot {
    timestamp: number;
    rawMetrics: SystemMetrics;
    forecast: {
        predictiveStress: number;
        stabilityTrend: 'improving' | 'declining' | 'stable';
    };
    governance: {
        tier: EscalationTier;
        policy: RiskEscalationPolicy;
    };
    economic: {
        systemicBudgetMultiplier: number;
        treasuryHealth: 'abundant' | 'decent' | 'stressed' | 'critical';
    };
    authority: {
        contractionFactor: number;
        validationDepth: number;
    };
}

/**
 * SystemicStabilityIntelligence (SSI)
 * 
 * The central orchestrator for environmental awareness and proactive governance.
 * SSI uniquely unifies aggregation, forecasting, escalation, behavior adaptation, 
 * and feedback loops into a single autonomous stability organism.
 */
export class SystemicStabilityIntelligence extends EventEmitter {
    private aggregationEngine: StateAggregationEngine;
    private forecastingEngine: StressForecastingEngine;
    private escalationModule: RiskEscalationModule;
    private feedbackEngine: StabilityFeedbackEngine;
    private behaviorEngine: AdaptiveBehaviorEngine;
    private stateAPI: GlobalStateAPI;

    constructor() {
        super();

        // 1. Initialize State Aggregation (The Foundation)
        this.aggregationEngine = new StateAggregationEngine({
            updateIntervalMs: 1000,
            initialState: {
                totalTreasuryReserves: 5000000,
                pooledBudgetUtilization: 0.1,
                aggregateAgentRiskExposure: 0,
                networkComputeLoad: 0.1,
                policyViolationFrequency: 0,
                cooperativeEfficiencyScores: 85,
                ongoingTaskDensity: 0.0,
                predictiveStressLevel: 0
            }
        });

        // 2. Initialize Risk Escalation (The Governance Layer)
        this.escalationModule = new RiskEscalationModule(this.aggregationEngine);

        // 3. Initialize Forecasting (The Proactive Brain)
        // Note: ForecastingEngine acts as a provider back to the AggregationEngine
        this.forecastingEngine = new StressForecastingEngine(this.aggregationEngine, this.escalationModule);
        this.aggregationEngine.registerProvider(this.forecastingEngine);

        // 4. Initialize Feedback Engine (The Learning Loop)
        this.feedbackEngine = new StabilityFeedbackEngine(this.aggregationEngine, this.escalationModule);

        // 5. Initialize API and Behavior Engine (The Interaction Layer)
        this.stateAPI = new GlobalStateAPI(this.aggregationEngine, this.escalationModule);
        this.behaviorEngine = new AdaptiveBehaviorEngine(this.stateAPI);

        // Internal wiring for proactive stabilization
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.aggregationEngine.on('stateUpdated', (state: GlobalSystemState) => {
            this.emit('stabilitySnapshot', this.getStabilitySnapshot());
        });

        this.escalationModule.on('tierChanged', (data) => {
            console.log(`[SSI] Governance Escalation Detected: ${EscalationTier[data.policy.tier]}`);
            this.emit('governanceChange', data);
        });

        this.feedbackEngine.on('analysisCompleted', (analysis) => {
            console.log(`[SSI] Stability Feedback Processed. Success: ${(analysis.successScore * 100).toFixed(1)}%`);
            this.emit('optimizationCompleted', analysis);
        });
    }

    /**
     * Starts the entire stability organism.
     */
    public async start(): Promise<void> {
        console.log('[SSI] Booting Systemic Stability Intelligence Layer...');
        await this.aggregationEngine.start();
        console.log('[SSI] Macro-Stability Awareness Online.');
    }

    /**
     * Stops the stability organism.
     */
    public stop(): void {
        this.aggregationEngine.stop();
        console.log('[SSI] Layer Offline.');
    }

    /**
     * Returns a unified snapshot of system stability.
     * This embodies "Real-Time Macro-Awareness" by combining all engines' data.
     */
    public getStabilitySnapshot(): MacroStabilitySnapshot {
        const state = this.aggregationEngine.getCurrentState();
        const policy = this.escalationModule.getActivePolicy();
        const insights = this.feedbackEngine.getStabilityInsights();

        return {
            timestamp: state.timestamp,
            rawMetrics: state.metrics,
            forecast: {
                predictiveStress: state.metrics.predictiveStressLevel || 0,
                stabilityTrend: typeof insights === 'string' ? 'stable' : (insights.trend as any)
            },
            governance: {
                tier: this.escalationModule.getCurrentTier(),
                policy: policy
            },
            economic: {
                systemicBudgetMultiplier: policy.budgetCeilingMultiplier,
                treasuryHealth: this.deriveTreasuryHealth(state.metrics.totalTreasuryReserves)
            },
            authority: {
                contractionFactor: policy.authorityLimitMultiplier,
                validationDepth: policy.validationDepthBonus
            }
        };
    }

    /**
     * Computes a tailored behavior policy for an agent.
     * Combines reactive governance (tier) with proactive adaptation (forecast).
     */
    public async getAgentPolicy(agentId: string): Promise<BehaviorPolicy> {
        return this.behaviorEngine.getBehaviorPolicy(agentId);
    }

    /**
     * Directly interacts with the Aggregation Engine to inject simulation data
     * or register external providers.
     */
    public getAggregationEngine(): StateAggregationEngine {
        return this.aggregationEngine;
    }

    /**
     * Provides the Scoped API for agent queries.
     */
    public getAPI(): GlobalStateAPI {
        return this.stateAPI;
    }

    private deriveTreasuryHealth(reserves: number): 'abundant' | 'decent' | 'stressed' | 'critical' {
        if (reserves >= 10000000) return 'abundant';
        if (reserves >= 5000000) return 'decent';
        if (reserves >= 2000000) return 'stressed';
        return 'critical';
    }
}
