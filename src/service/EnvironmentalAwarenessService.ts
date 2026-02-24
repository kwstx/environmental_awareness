import express, { Request, Response } from 'express';
import { StateAggregationEngine } from '../engines/StateAggregationEngine';
import { RiskEscalationModule } from '../engines/RiskEscalationModule';
import { GlobalStateAPI } from '../api/GlobalStateAPI';
import { EscalationTier } from '../interfaces/RiskEscalation';
import { EnvironmentAuditLedger } from '../engines/EnvironmentAuditLedger';
import { AuditEventType } from '../interfaces/AuditLog';

/**
 * EnvironmentalAwarenessService
 * 
 * A standalone microservice that provides real-time system-wide visibility 
 * and risk assessment via standardized REST endpoints.
 * 
 * Designed to be decoupled from specific agent frameworks, allowing it to
 * plug into any orchestration or governance system.
 */
export class EnvironmentalAwarenessService {
    private app = express();
    private port: number;
    private aggregationEngine: StateAggregationEngine;
    private riskModule: RiskEscalationModule;
    private api: GlobalStateAPI;

    constructor(
        port: number,
        aggregationEngine: StateAggregationEngine,
        riskModule: RiskEscalationModule
    ) {
        this.port = port;
        this.aggregationEngine = aggregationEngine;
        this.riskModule = riskModule;
        this.api = new GlobalStateAPI(aggregationEngine, riskModule);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventForwarding();
    }

    private setupMiddleware() {
        this.app.use(express.json());

        // Basic logging middleware
        this.app.use((req, res, next) => {
            console.log(`[Service] ${req.method} ${req.url}`);
            next();
        });
    }

    private setupRoutes() {
        /**
         * GET /state
         * Returns the current global system state.
         * Optional: X-Agent-ID header for scoped state access.
         */
        this.app.get('/state', async (req: Request, res: Response) => {
            try {
                const agentId = req.headers['x-agent-id'] as string || 'system';
                const state = await this.api.queryState(agentId);
                res.json(state);
            } catch (error) {
                res.status(500).json({ error: 'Failed to retrieve global state' });
            }
        });

        /**
         * GET /risk-tier
         * Returns the current risk escalation tier and the active policy.
         */
        this.app.get('/risk-tier', (req: Request, res: Response) => {
            const tier = this.riskModule.getCurrentTier();
            const policy = this.riskModule.getActivePolicy();
            res.json({
                tier: EscalationTier[tier],
                tierValue: tier,
                policy,
                timestamp: Date.now()
            });
        });

        /**
         * GET /predict-stress
         * Returns the current predictive stress level forecast.
         */
        this.app.get('/predict-stress', (req: Request, res: Response) => {
            const state = this.aggregationEngine.getCurrentState();
            res.json({
                stressLevel: state.metrics.predictiveStressLevel || 0,
                confidence: 0.85, // Mock confidence
                timestamp: state.timestamp,
                indicators: {
                    volatility: state.metrics.aggregateAgentRiskExposure > 2000 ? 'high' : 'normal',
                    resourcePressure: state.metrics.networkComputeLoad > 0.8 ? 'critical' : 'stable'
                }
            });
        });

        /**
         * POST /notify-escalation-change
         * Endpoint for external orchestration or governance systems to signal 
         * an escalation requirement or manual override.
         */
        this.app.post('/notify-escalation-change', (req: Request, res: Response) => {
            const { requestedTier, reason, externalSource, secretMode } = req.body;

            if (!requestedTier && requestedTier !== 0) {
                return res.status(400).json({ error: 'Missing requestedTier in body' });
            }

            console.log(`[Service] External escalation signal received from ${externalSource || 'unknown controller'}`);
            console.log(`[Service] Requested Tier: ${requestedTier} | Reason: ${reason}`);

            // Log this external intersection to the audit ledger
            EnvironmentAuditLedger.getInstance().logEvent({
                eventType: AuditEventType.STATE_CHANGE,
                contributingMetrics: this.aggregationEngine.getCurrentState().metrics,
                description: `External escalation signal received from ${externalSource || 'orchestrator'}.`,
                metadata: {
                    requestedTier,
                    reason,
                    externalSource
                }
            });

            // In a production system, this might trigger a specific re-validation or 
            // a manual override in the RiskEscalationModule.
            // For this design, we acknowledge the message as part of the "plug and play" interoperability.

            res.status(202).json({
                status: 'accepted',
                message: 'Escalation signal integrated into awareness layer',
                currentTier: EscalationTier[this.riskModule.getCurrentTier()]
            });
        });

        /**
         * GET /health
         */
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({
                status: 'healthy',
                service: 'environmental-awareness',
                uptime: process.uptime(),
                version: '1.0.0'
            });
        });
    }

    private setupEventForwarding() {
        // We can forward internal module events to external subscribers if needed
        this.riskModule.on('tierChanged', (data) => {
            console.log(`[Service] Internal Tier Change Event: ${EscalationTier[data.previousTier]} -> ${EscalationTier[data.policy.tier]}`);
            // Logic to POST to registered webhooks would go here
        });
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log('=====================================================');
            console.log(' ENVIRONMENTAL AWARENESS STANDALONE SERVICE         ');
            console.log(` Listening on http://localhost:${this.port}          `);
            console.log('=====================================================');
        });
    }
}
