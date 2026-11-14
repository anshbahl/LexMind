export type UserRole = 'ADVOCATE' | 'JUNIOR_ASSOCIATE' | 'ADMIN';

export type CaseType = 'CIVIL' | 'CRIMINAL' | 'WRIT' | 'COMMERCIAL' | 'FAMILY' | 'ARBITRATION';

export type CaseStatus = 'ACTIVE' | 'DISPOSED' | 'ARCHIVED';

export type DocumentCategory =
  | 'PETITION'
  | 'WRITTEN_STATEMENT'
  | 'BAIL_APPLICATION'
  | 'COURT_ORDER'
  | 'LEGAL_NOTICE'
  | 'CONTRACT'
  | 'EVIDENCE';

export type OcrStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DraftingStyleProfile {
  preferredSalutation?: string;
  courtAddressingHonorific?: string;
  formattingPreferences?: {
    useNumberedParagraphs?: boolean;
    includeVerificationClause?: boolean;
    prayerStyle?: 'traditional' | 'concise';
  };
  recurringPhrasing?: string[];
  firmHeader?: string;
}

export interface Lawyer {
  id: string;
  full_name: string;
  bar_council_id?: string | null;
  email: string;
  role: UserRole;
  drafting_style_profile: DraftingStyleProfile;
  created_at: string;
}

export interface Case {
  id: string;
  lawyer_id: string;
  case_title: string;
  cnr_number?: string | null;
  client_name: string;
  opposing_party: string;
  court_forum: string;
  case_type: CaseType;
  status: CaseStatus;
  outcome_summary?: string | null;
  next_hearing_date?: string | null;
  created_at: string;
  hearings_count?: number;
  documents_count?: number;
}

export interface Hearing {
  id: string;
  case_id: string;
  lawyer_id: string;
  hearing_date: string;
  purpose: string;
  judge_coram?: string | null;
  order_summary: string;
  next_action_items?: string | null;
  created_at: string;
  case_title?: string;
  court_forum?: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  lawyer_id: string;
  file_name: string;
  file_url: string;
  document_category: DocumentCategory;
  ocr_status: OcrStatus;
  page_count: number;
  uploaded_at: string;
  chunks_count?: number;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  case_id: string;
  chunk_index: number;
  section_type: string;
  content: string;
  metadata: {
    case_type?: CaseType;
    outcome_summary?: string;
    court_forum?: string;
    file_name?: string;
    case_title?: string;
  };
  created_at: string;
}

export interface RetrievedPrecedent {
  chunk_id: string;
  document_id: string;
  case_id: string;
  case_title: string;
  court_forum: string;
  case_type: CaseType;
  file_name: string;
  document_category: DocumentCategory;
  section_type: string;
  content: string;
  outcome_summary?: string | null;
  semantic_similarity: number;
  lexical_rank?: number;
  rrf_score: number;
  citation_label: string;
}

export interface ChamberBrief {
  case_id: string;
  case_title: string;
  cnr_number?: string | null;
  court_forum: string;
  judge_coram?: string | null;
  next_hearing_date?: string | null;
  generated_at: string;
  hearing_timeline: Array<{
    hearing_date: string;
    purpose: string;
    judge_coram?: string | null;
    order_summary: string;
    next_action_items?: string | null;
  }>;
  last_operative_court_direction: string;
  pending_compliance_deadlines: string[];
  recommended_agenda_for_ndoh: string[];
  key_precedent_citations: string[];
}

