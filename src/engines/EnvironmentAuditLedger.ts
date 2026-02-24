import { AuditRecord, AuditEventType } from '../interfaces/AuditLog';
import * as fs from 'fs';
import * as path from 'path';

/**
 * EnvironmentAuditLedger
 * 
 * Manages immutable audit records for environmental state changes, 
 * escalation triggers, and adaptive contractions.
 */
export class EnvironmentAuditLedger {
    private static instance: EnvironmentAuditLedger;
    private records: AuditRecord[] = [];
    private readonly logFilePath: string;

    private constructor() {
        this.logFilePath = path.join(process.cwd(), 'audit_ledger.json');
        this.initializeLedger();
    }

    public static getInstance(): EnvironmentAuditLedger {
        if (!EnvironmentAuditLedger.instance) {
            EnvironmentAuditLedger.instance = new EnvironmentAuditLedger();
        }
        return EnvironmentAuditLedger.instance;
    }

    /**
     * Initializes the ledger by creating the log file if it doesn't exist.
     */
    private initializeLedger(): void {
        if (!fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, JSON.stringify([], null, 2));
        } else {
            try {
                const data = fs.readFileSync(this.logFilePath, 'utf8');
                this.records = JSON.parse(data);
            } catch (error) {
                console.error('[EnvironmentAuditLedger] Failed to load existing ledger:', error);
                this.records = [];
            }
        }
    }

    /**
     * Appends a new record to the ledger immutably.
     */
    public logEvent(record: Omit<AuditRecord, 'id' | 'timestamp'>): AuditRecord {
        const fullRecord: AuditRecord = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...record
        };

        // Add to in-memory store
        this.records.push(fullRecord);

        // Persist to file (simulating immutability by appending or rewriting the full history)
        // In a real system, this would be an append-only stream or a blockchain transaction.
        try {
            fs.writeFileSync(this.logFilePath, JSON.stringify(this.records, null, 2));
        } catch (error) {
            console.error('[EnvironmentAuditLedger] Failed to persist audit record:', error);
        }

        console.log(`[EnvironmentAuditLedger] LOGGED: ${fullRecord.eventType} - ${fullRecord.description}`);
        return fullRecord;
    }

    /**
     * Retrieves all records from the ledger.
     */
    public getRecords(): AuditRecord[] {
        return [...this.records];
    }

    /**
     * Retrieves records by type.
     */
    public getRecordsByType(type: AuditEventType): AuditRecord[] {
        return this.records.filter(r => r.eventType === type);
    }
}
