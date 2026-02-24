import { DataProvider } from '../interfaces/DataProvider';
import { SystemMetrics } from '../models/GlobalSystemState';

export class IdentityTrustProvider implements DataProvider {
    public name = 'IdentityTrustSystem';

    public async fetchMetrics(): Promise<Partial<SystemMetrics>> {
        return {
            cooperativeEfficiencyScores: 85 + Math.random() * 10
        };
    }

    public async getHealthStatus(): Promise<'healthy' | 'degraded' | 'offline'> {
        return 'healthy';
    }
}
