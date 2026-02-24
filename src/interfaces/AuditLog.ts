
export enum AuditEventType {
    STATE_CHANGE = 'STATE_CHANGE',
    ESCALATION_TRIGGER = 'ESCALATION_TRIGGER',
    ADAPTIVE_CONTRACTION = 'ADAPTIVE_CONTRACTION',
    STABILITY_RESTORED = 'STABILITY_RESTORED'
}

export interface AuditRecord {
    id: string;
    timestamp: number;
    eventType: AuditEventType;
    contributingMetrics: Record<string, number>;
    affectedAgents?: string[];
    behavioralAdjustments?: Record<string, any>;
    description: string;
    metadata?: Record<string, any>;
}
