export interface CaptureSnapshotAuditChange {
  readonly key: string;
  readonly fields: readonly {
    readonly path: string;
    readonly previous: unknown;
    readonly next: unknown;
  }[];
}

export interface NewCaptureSnapshotAudit {
  readonly runId: string;
  readonly snapshotId: string;
  readonly previousRawInputChecksum: string;
  readonly nextRawInputChecksum: string;
  readonly previousCalculatedOutputChecksum: string;
  readonly nextCalculatedOutputChecksum: string;
  readonly addedJiraKeys: readonly string[];
  readonly removedJiraKeys: readonly string[];
  readonly changedJiraKeys: readonly CaptureSnapshotAuditChange[];
  readonly calculatedPaths: readonly string[];
  readonly summary: Record<string, unknown>;
}

export interface CaptureSnapshotAudit extends NewCaptureSnapshotAudit {
  readonly id: string;
  readonly createdAt: Date;
}

export interface CaptureSnapshotAuditRepository {
  record(input: NewCaptureSnapshotAudit): Promise<CaptureSnapshotAudit>;
}
