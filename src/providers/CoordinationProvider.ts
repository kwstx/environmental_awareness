import { DataProvider } from '../interfaces/DataProvider';
import { SystemMetrics } from '../models/GlobalSystemState';

export class CoordinationProvider implements DataProvider {
    public name = 'CoordinationLayer';

    public async fetchMetrics(): Promise<Partial<SystemMetrics>> {
        return {
            ongoingTaskDensity: Math.floor(200 + Math.random() * 200),
            networkComputeLoad: 0.3 + Math.random() * 0.4
        };
    }

    public async getHealthStatus(): Promise<'healthy' | 'degraded' | 'offline'> {
        return 'healthy';
    }
}
