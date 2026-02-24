import { DataProvider } from '../interfaces/DataProvider';
import { SystemMetrics } from '../models/GlobalSystemState';

export class RiskProvider implements DataProvider {
    public name = 'RiskEngine';

    public async fetchMetrics(): Promise<Partial<SystemMetrics>> {
        return {
            aggregateAgentRiskExposure: 1500 + Math.random() * 500
        };
    }

    public async getHealthStatus(): Promise<'healthy' | 'degraded' | 'offline'> {
        return 'healthy';
    }
}
