export interface InventoryManifest {
  schemaVersion: 1;
  baselineCommit: '79927540a3c27d2c29b42d84c42b7e9abcb51800';
  productionSources: string[];
  stylesheets: string[];
  foundationInputs: string[];
}

export interface InventoryLedgerEntry {
  sourcePath: string;
  currentDependencies: string[];
  removedRuntimeCoupling: string[];
  responsiveConcerns: string[];
  accessibilityConcerns: string[];
  artifacts: Array<{
    id: string;
    description: string;
    disposition:
      | 'implemented'
      | `canonicalized into ${string}`
      | 'non-visual business boundary'
      | 'not ported: dead CSS or known defect'
      | 'inventory-only: void/crimson';
    canonicalExports: string[];
    caseIds: string[];
    requiredStates: string[];
    rationale: string;
    evidenceIds: string[];
  }>;
}
