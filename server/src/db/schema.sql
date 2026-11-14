CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADVOCATE', 'JUNIOR_ASSOCIATE', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_type_enum AS ENUM ('CIVIL', 'CRIMINAL', 'WRIT', 'COMMERCIAL', 'FAMILY', 'ARBITRATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_status_enum AS ENUM ('ACTIVE', 'DISPOSED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_category_enum AS ENUM ('PETITION', 'WRITTEN_STATEMENT', 'BAIL_APPLICATION', 'COURT_ORDER', 'LEGAL_NOTICE', 'CONTRACT', 'EVIDENCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ocr_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    bar_council_id VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'ADVOCATE',
    drafting_style_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
    case_title VARCHAR(500) NOT NULL,
    cnr_number VARCHAR(100),
    client_name VARCHAR(255) NOT NULL,
    opposing_party VARCHAR(255) NOT NULL,
    court_forum VARCHAR(255) NOT NULL,
    case_type case_type_enum NOT NULL DEFAULT 'CIVIL',
    status case_status_enum NOT NULL DEFAULT 'ACTIVE',
    outcome_summary TEXT,
    next_hearing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_next_hearing ON cases(next_hearing_date);

-- 3. Hearings table
CREATE TABLE IF NOT EXISTS hearings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
    hearing_date DATE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    judge_coram VARCHAR(255),
    order_summary TEXT NOT NULL,
    next_action_items TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_lawyer_id ON hearings(lawyer_id);

-- 4. Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    document_category document_category_enum NOT NULL DEFAULT 'PETITION',
    ocr_status ocr_status_enum NOT NULL DEFAULT 'PENDING',
    page_count INT DEFAULT 1,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_lawyer_id ON documents(lawyer_id);

-- 5. Document Chunks table (RAG Knowledge Store)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    section_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    search_vector TSVECTOR,
    embedding VECTOR(768),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Search and retrieval indexes
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_search_vector ON document_chunks USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_lawyer_case ON document_chunks (lawyer_id, case_id);

-- Auto-generated TSVECTOR trigger for BM25 keyword search
CREATE OR REPLACE FUNCTION document_chunks_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_chunks_search_vector ON document_chunks;
CREATE TRIGGER trg_document_chunks_search_vector
BEFORE INSERT OR UPDATE OF content ON document_chunks
FOR EACH ROW EXECUTE FUNCTION document_chunks_search_vector_update();

