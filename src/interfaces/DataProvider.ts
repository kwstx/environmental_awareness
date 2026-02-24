import { SystemMetrics } from '../models/GlobalSystemState';

/**
 * Interface for modules that provide real-time metrics to the aggregation engine.
 */
export interface DataProvider {
    /**
     * Unique name of the provider.
     */
    name: string;

    /**
     * Fetches the latest metrics from the underlying module.
     * Returns a partial SystemMetrics object.
     */
    fetchMetrics(): Promise<Partial<SystemMetrics>>;

    /**
     * Returns the health status of the source module.
     */
    getHealthStatus(): Promise<'healthy' | 'degraded' | 'offline'>;
}
