import {
  Lawyer,
  Case,
  Hearing,
  CaseDocument,
  DocumentChunk,
  RetrievedPrecedent,
  ChamberBrief,
  DraftingStyleProfile,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('lexmind_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('lexmind_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('lexmind_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<{ token: string; lawyer: Lawyer }> => {
      const data = await request<{ token: string; lawyer: Lawyer }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(data.token);
      return data;
    },
    register: async (payload: {
      full_name: string;
      email: string;
      password: string;
      bar_council_id?: string;
    }): Promise<{ token: string; lawyer: Lawyer }> => {
      const data = await request<{ token: string; lawyer: Lawyer }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(data.token);
      return data;
    },
    me: async (): Promise<{ lawyer: Lawyer }> => {
      return request<{ lawyer: Lawyer }>('/auth/me');
    },
    updateProfile: async (payload: {
      full_name?: string;
      bar_council_id?: string;
      drafting_style_profile?: DraftingStyleProfile;
    }): Promise<{ lawyer: Lawyer }> => {
      return request<{ lawyer: Lawyer }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
  },

  // Cases
  cases: {
    list: async (filters: { status?: string; case_type?: string; search?: string } = {}): Promise<{ cases: Case[] }> => {
      const query = new URLSearchParams();
      if (filters.status) query.set('status', filters.status);
      if (filters.case_type) query.set('case_type', filters.case_type);
      if (filters.search) query.set('search', filters.search);
      return request<{ cases: Case[] }>(`/cases?${query.toString()}`);
    },
    getOverviewStats: async (): Promise<{
      activeCases: number;
      disposedCases: number;
      archivedCases: number;
      totalCases: number;
      totalDocuments: number;
      totalChunksIndexed: number;
      upcomingHearingsCount: number;
      forumDistribution: Array<{ court_forum: string; count: number }>;
      typeDistribution: Array<{ case_type: string; count: number }>;
      upcomingHearings: Hearing[];
    }> => {
      return request('/cases/stats/overview');
    },
    get: async (id: string): Promise<{ case: Case; hearings: Hearing[]; documents: CaseDocument[] }> => {
      return request<{ case: Case; hearings: Hearing[]; documents: CaseDocument[] }>(`/cases/${id}`);
    },
    create: async (data: Partial<Case>): Promise<{ case: Case }> => {
      return request<{ case: Case }>('/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<Case>): Promise<{ case: Case }> => {
      return request<{ case: Case }>(`/cases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<{ id: string }> => {
      return request<{ id: string }>(`/cases/${id}`, {
        method: 'DELETE',
      });
    },
    getChamberBrief: async (id: string): Promise<{ brief: ChamberBrief }> => {
      return request<{ brief: ChamberBrief }>(`/cases/${id}/chamber-brief`, {
        method: 'POST',
      });
    },
  },

  // Hearings
  hearings: {
    getUpcoming: async (): Promise<{ hearings: Hearing[] }> => {
      return request<{ hearings: Hearing[] }>('/hearings/upcoming');
    },
    create: async (caseId: string, data: Partial<Hearing> & { next_hearing_date?: string }): Promise<{ hearing: Hearing }> => {
      return request<{ hearing: Hearing }>(`/hearings/case/${caseId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<Hearing>): Promise<{ hearing: Hearing }> => {
      return request<{ hearing: Hearing }>(`/hearings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<{ id: string }> => {
      return request<{ id: string }>(`/hearings/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Documents
  documents: {
    upload: async (
      caseId: string,
      formData: FormData
    ): Promise<{ message: string; document: CaseDocument; chunks_count: number }> => {
      return request(`/documents/case/${caseId}`, {
        method: 'POST',
        body: formData,
      });
    },
    getChunks: async (documentId: string): Promise<{ document: CaseDocument; chunks: DocumentChunk[] }> => {
      return request(`/documents/${documentId}/chunks`);
    },
    delete: async (id: string): Promise<{ id: string }> => {
      return request(`/documents/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Precedents & Hybrid RAG
  precedents: {
    search: async (params: {
      query: string;
      case_type?: string;
      court_forum?: string;
      limit?: number;
    }): Promise<{ count: number; precedents: RetrievedPrecedent[] }> => {
      return request('/precedents/search', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  },

  // AI Co-Counsel
  ai: {
    refine: async (params: {
      clause_text: string;
      action: 'make_numbered' | 'make_concise' | 'harden_assertions';
      tone?: string;
    }): Promise<{ original: string; refined: string }> => {
      return request('/ai/refine', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  },
};

/**
 * Real-time SSE streaming client for AI Drafting
 */
export async function streamLegalDraft(
  params: {
    case_id: string;
    drafting_intent: string;
    selected_text?: string;
  },
  callbacks: {
    onMeta?: (meta: { highestSimilarity: number; isBelowThreshold: boolean; precedents: any[] }) => void;
    onToken?: (token: string) => void;
    onDone?: () => void;
    onError?: (error: string) => void;
  }
): Promise<void> {
  const token = getAuthToken();
  const response = await fetch('/api/ai/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify({
      ...params,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({ error: 'Streaming request failed' }));
    callbacks.onError?.(errorJson.error || 'Drafting failed');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.('Unable to open stream reader');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.type === 'meta') {
            callbacks.onMeta?.(payload);
          } else if (payload.type === 'token') {
            callbacks.onToken?.(payload.token);
          } else if (payload.type === 'done') {
            callbacks.onDone?.();
          } else if (payload.type === 'error') {
            callbacks.onError?.(payload.error);
          }
        } catch {
          // Continue
        }
      }
    }
  }

  callbacks.onDone?.();
}

