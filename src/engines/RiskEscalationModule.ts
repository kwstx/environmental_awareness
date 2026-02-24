import { EventEmitter } from 'events';
import { StateAggregationEngine } from './StateAggregationEngine';
import { GlobalSystemState } from '../models/GlobalSystemState';
import { EscalationTier, RiskEscalationPolicy } from '../interfaces/RiskEscalation';

/**
 * RiskEscalationModule
 * 
 * Monitors global risk indicators and automatically activates predefined escalation tiers.
 * Each tier defines stricter authority limits, reduced budget ceilings, 
 * increased validation depth, and mandatory multi-agent confirmation.
 */
export class RiskEscalationModule extends EventEmitter {
    private engine: StateAggregationEngine;
    private currentTier: EscalationTier = EscalationTier.STABLE;
    private activePolicy: RiskEscalationPolicy;

    // Thresholds for triggering escalation
    private THRESHOLDS = {
        CRITICAL: {
            riskExposure: 5000,
            violationFrequency: 0.3,
            treasuryMin: 500000,
            computeLoad: 0.95
        },
        HIGH: {
            riskExposure: 3000,
            violationFrequency: 0.15,
            treasuryMin: 1500000,
            computeLoad: 0.85
        },
        ELEVATED: {
            riskExposure: 1500,
            violationFrequency: 0.05,
            treasuryMin: 3000000,
            computeLoad: 0.70
        }
    };

    private TIER_DEFINITIONS: Record<EscalationTier, Omit<RiskEscalationPolicy, 'rationale'>> = {
        [EscalationTier.STABLE]: {
            tier: EscalationTier.STABLE,
            authorityLimitMultiplier: 1.0,
            delegationRightsContractionFactor: 1.0,
            budgetCeilingMultiplier: 1.0,
            trustGatingMultiplier: 1.0,
            validationDepthBonus: 0,
            multiAgentConfirmationRequired: false
        },
        [EscalationTier.ELEVATED]: {
            tier: EscalationTier.ELEVATED,
            authorityLimitMultiplier: 0.75, // 25% reduction in authority scope
            delegationRightsContractionFactor: 0.80, // 20% reduction in delegation
            budgetCeilingMultiplier: 0.85, // 15% reduction in budget
            trustGatingMultiplier: 1.1,     // 10% stricter trust gating
            validationDepthBonus: 1,        // +1 validation check
            multiAgentConfirmationRequired: false
        },
        [EscalationTier.HIGH]: {
            tier: EscalationTier.HIGH,
            authorityLimitMultiplier: 0.40, // 60% reduction in authority
            delegationRightsContractionFactor: 0.50, // 50% reduction in delegation
            budgetCeilingMultiplier: 0.50, // 50% reduction in budget
            trustGatingMultiplier: 1.5,     // 50% stricter trust gating
            validationDepthBonus: 3,        // +3 validation checks
            multiAgentConfirmationRequired: true  // Consensus required
        },
        [EscalationTier.CRITICAL]: {
            tier: EscalationTier.CRITICAL,
            authorityLimitMultiplier: 0.10, // 90% reduction (minimal autonomy)
            delegationRightsContractionFactor: 0.20, // 80% reduction in delegation
            budgetCeilingMultiplier: 0.20, // 80% reduction (emergency only)
            trustGatingMultiplier: 2.5,     // 150% stricter trust gating
            validationDepthBonus: 6,        // Extreme validation depth
            multiAgentConfirmationRequired: true  // Absolute consensus
        }
    };

    constructor(engine: StateAggregationEngine) {
        super();
        this.engine = engine;
        this.activePolicy = this.createPolicy(EscalationTier.STABLE, 'System initialized in STABLE mode.');

        // Listen for state updates from the aggregation engine
        this.engine.on('stateUpdated', (state: GlobalSystemState) => {
            this.evaluateRisk(state);
        });
    }

    /**
     * Evaluates the current system state against risk thresholds.
     */
    private evaluateRisk(state: GlobalSystemState): void {
        const { metrics } = state;
        let newTier = EscalationTier.STABLE;
        let reason = 'System is operating within normal parameters.';

        // Tier 3: Critical
        if (
            metrics.aggregateAgentRiskExposure >= this.THRESHOLDS.CRITICAL.riskExposure ||
            metrics.policyViolationFrequency >= this.THRESHOLDS.CRITICAL.violationFrequency ||
            metrics.totalTreasuryReserves <= this.THRESHOLDS.CRITICAL.treasuryMin ||
            metrics.networkComputeLoad >= this.THRESHOLDS.CRITICAL.computeLoad
        ) {
            newTier = EscalationTier.CRITICAL;
            reason = 'CRITICAL: Massive risk detected. Immediate emergency restrictions applied.';
        }
        // Tier 2: High
        else if (
            metrics.aggregateAgentRiskExposure >= this.THRESHOLDS.HIGH.riskExposure ||
            metrics.policyViolationFrequency >= this.THRESHOLDS.HIGH.violationFrequency ||
            metrics.totalTreasuryReserves <= this.THRESHOLDS.HIGH.treasuryMin ||
            metrics.networkComputeLoad >= this.THRESHOLDS.HIGH.computeLoad
        ) {
            newTier = EscalationTier.HIGH;
            reason = 'HIGH: Significant system stress detected. Multi-agent confirmation activated.';
        }
        // Tier 1: Elevated
        else if (
            metrics.aggregateAgentRiskExposure >= this.THRESHOLDS.ELEVATED.riskExposure ||
            metrics.policyViolationFrequency >= this.THRESHOLDS.ELEVATED.violationFrequency ||
            metrics.totalTreasuryReserves <= this.THRESHOLDS.ELEVATED.treasuryMin ||
            metrics.networkComputeLoad >= this.THRESHOLDS.ELEVATED.computeLoad
        ) {
            newTier = EscalationTier.ELEVATED;
            reason = 'ELEVATED: Preemptive risk mitigation active. Authority limits tightened.';
        }

        // Only update if there's a change to avoid churn
        if (newTier !== this.currentTier) {
            const oldTier = this.currentTier;
            this.currentTier = newTier;
            this.activePolicy = this.createPolicy(newTier, reason);

            console.log(`[RiskEscalationModule] TIER CHANGE: ${EscalationTier[oldTier]} -> ${EscalationTier[newTier]}`);
            console.log(`[RiskEscalationModule] Rationale: ${reason}`);

            this.emit('tierChanged', {
                policy: this.activePolicy,
                previousTier: oldTier,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Helper to create a full policy object for a tier.
     */
    private createPolicy(tier: EscalationTier, rationale: string): RiskEscalationPolicy {
        return {
            ...this.TIER_DEFINITIONS[tier],
            rationale
        };
    }

    /**
     * Returns the currently active escalation policy.
     */
    public getActivePolicy(): RiskEscalationPolicy {
        return this.activePolicy;
    }

    /**
     * Returns the current escalation tier.
     */
    public getCurrentTier(): EscalationTier {
        return this.currentTier;
    }

    /**
     * Updates the escalation thresholds for a specific level.
     */
    public updateThresholds(level: 'ELEVATED' | 'HIGH' | 'CRITICAL', newThresholds: Partial<typeof this.THRESHOLDS['CRITICAL']>): void {
        this.THRESHOLDS[level] = {
            ...this.THRESHOLDS[level],
            ...newThresholds
        };
        console.log(`[RiskEscalationModule] Thresholds updated for ${level}`);
    }

    /**
     * Updates the definition of a specific escalation tier.
     */
    public updateTierDefinition(tier: EscalationTier, definition: Partial<Omit<RiskEscalationPolicy, 'rationale'>>): void {
        this.TIER_DEFINITIONS[tier] = {
            ...this.TIER_DEFINITIONS[tier],
            ...definition
        } as Omit<RiskEscalationPolicy, 'rationale'>;

        // If we are currently in this tier, update the active policy
        if (this.currentTier === tier) {
            this.activePolicy = this.createPolicy(tier, this.activePolicy.rationale);
        }

        console.log(`[RiskEscalationModule] Tier definition updated for ${EscalationTier[tier]}`);
    }

    /**
     * Returns the current thresholds.
     */
    public getThresholds(): typeof this.THRESHOLDS {
        return JSON.parse(JSON.stringify(this.THRESHOLDS));
    }

    /**
     * Returns the current tier definitions.
     */
    public getTierDefinitions(): Record<EscalationTier, Omit<RiskEscalationPolicy, 'rationale'>> {
        return JSON.parse(JSON.stringify(this.TIER_DEFINITIONS));
    }
}
