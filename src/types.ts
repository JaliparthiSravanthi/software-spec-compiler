export interface AppIntent {
  rawPrompt: string;
  projectName: string;
  coreDescription: string;
  domains: string[];
  keyActions: string[];
  userRoles: string[];
  tierAccessLevelNeeded: boolean;
  assumptionsMade: string[];
}

export interface SystemDesign {
  architecturePattern: string;
  dataFlowDescription: string;
  entities: string[];
  relationships: {
    fromEntity: string;
    toEntity: string;
    relationshipType: "one-to-one" | "one-to-many" | "many-to-many";
    description: string;
  }[];
  rolesMatrix: {
    role: string;
    permissions: string[];
  }[];
}

export interface UIField {
  id: string;
  label: string;
  type: "text" | "number" | "email" | "select" | "boolean";
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select dropdowns
}

export interface UIComponent {
  id: string;
  type: "table" | "form" | "kpi-card" | "chart" | "action-button";
  title: string;
  associatedApiEndpoint?: string; // Must match API endpoint path
  fields?: UIField[]; // For forms or headers of tables
  submitButtonText?: string;
  targetRole?: string; // Gated visibility
}

export interface UIPage {
  route: string;
  title: string;
  icon: string;
  layout: "dashboard" | "form-layout" | "list-view" | "grid";
  components: UIComponent[];
  gatedRoles: string[];
}

export interface UISchema {
  pages: UIPage[];
  theme: {
    primaryColor: string;
    backgroundColor: string;
    sidebarColor: string;
  };
}

export interface APIEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  description: string;
  requiredFields: {
    name: string;
    type: "string" | "number" | "boolean";
    required: boolean;
    validationRegex?: string;
  }[];
  responseType: "JSON" | "MSG";
  mockResponseJSON: Record<string, any>;
  permittedRoles: string[];
  requiresPremium: boolean;
}

export interface APISchema {
  baseUrl: string;
  endpoints: APIEndpoint[];
}

export interface DBColumn {
  name: string;
  type: "VARCHAR" | "INTEGER" | "DECIMAL" | "BOOLEAN" | "TIMESTAMP" | "TEXT";
  isPrimary: boolean;
  isNullable: boolean;
  defaultValue?: string;
  foreignKeyRelation?: {
    targetTable: string;
    targetColumn: string;
  };
}

export interface DBTable {
  tableName: string;
  columns: DBColumn[];
  description: string;
}

export interface DBSchema {
  dialect: "POSTGRESQL";
  tables: DBTable[];
}

export interface AuthRule {
  role: string;
  permittedRoutes: string[];
  restrictedEndpoints: string[];
  canAccessAnalytics: boolean;
  canAccessPayments: boolean;
}

export interface CompleteOutputSchema {
  projectName: string;
  intent: AppIntent;
  systemDesign: SystemDesign;
  ui: UISchema;
  api: APISchema;
  db: DBSchema;
  auth: {
    rules: AuthRule[];
  };
}

export interface ValidationError {
  stage: string;
  code: string;
  message: string;
  severity: "error" | "warning";
  path: string;
}

export interface ValidationReport {
  score: number; // 0 to 100
  passed: boolean;
  errors: ValidationError[];
}

export interface CompileStepLog {
  stage: "intent" | "design" | "schema" | "refinement" | "validation" | "repair";
  message: string;
  timestamp: string;
  retryIndex?: number;
  payload?: any;
}

export interface CompileResult {
  id: string;
  success: boolean;
  prompt: string;
  schema?: CompleteOutputSchema;
  logs: CompileStepLog[];
  metrics: {
    totalLatencyMs: number;
    stageLatencies: Record<string, number>;
    retriesCount: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
  validationReport?: ValidationReport;
}

export interface EvaluationItem {
  id: string;
  title: string;
  prompt: string;
  category: "standard" | "edge-case";
  expectedRoles: string[];
  expectedEntities: string[];
  complexity: "Simple" | "Medium" | "Complex";
}
