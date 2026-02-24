import { DataProvider } from '../interfaces/DataProvider';
import { SystemMetrics } from '../models/GlobalSystemState';

export class AuditProvider implements DataProvider {
    public name = 'AuditLogSystem';

    public async fetchMetrics(): Promise<Partial<SystemMetrics>> {
        return {
            policyViolationFrequency: Math.random() * 0.05
        };
    }

    public async getHealthStatus(): Promise<'healthy' | 'degraded' | 'offline'> {
        return 'healthy';
    }
}
