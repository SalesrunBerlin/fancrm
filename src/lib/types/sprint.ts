
// Define types for Sprint and Ticket objects
export interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  field_values: Record<string, any>;
}

export interface Ticket {
  id: string;
  sprint_id: string;
  topic: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  created_at: string;
  updated_at: string;
  field_values: Record<string, any>;
}

export interface SprintAnalysis {
  sprint: Sprint;
  tickets: Ticket[];
  summary: {
    totalTickets: number;
    completedTickets: number;
    openTickets: number;
    blockedTickets: number;
  };
  recommendedActions: string[];
}

// Type for Sprint analysis request
export interface SprintAnalysisRequest {
  sprintId: string;
  includeRecommendations?: boolean;
}

// Type for Ticket resolution plan
export interface TicketResolutionPlan {
  ticket: Ticket;
  steps: {
    order: number;
    description: string;
    estimatedTime?: string;
  }[];
  dependencies: string[];
  risks: {
    description: string;
    mitigation?: string;
  }[];
}
