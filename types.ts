export enum Priority {
  CRITICAL = 'Critical',
  ESSENTIAL = 'Essential',
  ADVANCED = 'Advanced',
  INNOVATIVE = 'Innovative',
  FUTURE = 'Future'
}

export type ModuleCategory = 
  | 'Grid & Trading' 
  | 'O&M & Analytics' 
  | 'Hydrogen & Storage' 
  | 'Advanced PV' 
  | 'Compute & Digital' 
  | 'Resilience';

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

export interface ApiIntegration {
  provider: string;
  protocol?: string;
  docsUrl?: string;
  endpoints?: ApiEndpoint[];
  codeSnippet?: string;
  rateLimit?: string;
  description?: string;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  priority: Priority;
  category: ModuleCategory;
  description: string;
  financialImpact: {
    npv?: string;
    roi?: string;
    savings?: string;
    revenue?: string;
  };
  apis: ApiIntegration[];
  phase: number;
}