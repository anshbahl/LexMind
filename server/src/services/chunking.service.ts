export interface RawLegalChunk {
  chunk_index: number;
  section_type: string;
  content: string;
}

export class LegalChunkingService {
  // Indian legal structural boundary regex markers
  private readonly sectionPatterns = [
    { type: 'PRAYER', regex: /(?:PRAYER|RELIEF SOUGHT|PRAYER CLAUSE|IT IS THEREFORE PRAYED)[\s:]+/i },
    { type: 'GROUNDS', regex: /(?:GROUNDS|GROUNDS FOR BAIL|GROUNDS OF CHALLENGE|GROUNDS FOR RELIEF)[\s:]+/i },
    { type: 'FACTS', regex: /(?:MOST RESPECTFULLY SHOWETH|MOST RESPECTFULLY SHEWETH|FACTS OF THE CASE|BRIEF FACTS|FACTUAL MATRIX)[\s:]+/i },
    { type: 'INDEMNITY', regex: /(?:INDEMNITY|INDEMNIFICATION|LIMITATION OF LIABILITY)[\s:]+/i },
    { type: 'ORDER_OPERATIVE_PART', regex: /(?:OPERATIVE PART|CORAM|DIRECTIONS ISSUED|ACCORDINGLY ORDERED|IT IS ORDERED)[\s:]+/i },
    { type: 'CONTRACT_TERMS', regex: /(?:NOW THEREFORE THIS AGREEMENT WITNESSETH|AND WHEREAS|WHEREAS|TERMS AND CONDITIONS)[\s:]+/i },
  ];

  /**
   * Chunks legal text according to Indian pleading and contract structures.
   * Target ~600 tokens (~2400 characters) with ~100 tokens (~400 characters) overlap.
   */
  chunkLegalDocument(text: string): RawLegalChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const normalizedText = text.replace(/\r\n/g, '\n').trim();

    // 1. First divide text into major legal sections by matching legal markers
    const sections = this.splitIntoStructuralSections(normalizedText);

    const chunks: RawLegalChunk[] = [];
    let chunkCounter = 0;

    const TARGET_CHUNK_SIZE = 2400; // ~600 tokens
    const OVERLAP_SIZE = 400; // ~100 tokens

    for (const section of sections) {
      const sectionContent = section.content.trim();
      if (sectionContent.length <= TARGET_CHUNK_SIZE + 200) {
        // Fits comfortably in one chunk
        chunks.push({
          chunk_index: chunkCounter++,
          section_type: section.section_type,
          content: sectionContent,
        });
      } else {
        // Split section along legal paragraphs or sentences with overlap
        const subChunks = this.splitSectionWithOverlap(
          sectionContent,
          section.section_type,
          TARGET_CHUNK_SIZE,
          OVERLAP_SIZE
        );
        for (const sub of subChunks) {
          chunks.push({
            chunk_index: chunkCounter++,
            section_type: sub.section_type,
            content: sub.content,
          });
        }
      }
    }

    return chunks;
  }

  private splitIntoStructuralSections(text: string): Array<{ section_type: string; content: string }> {
    const markers: Array<{ index: number; type: string; matchLength: number }> = [];

    // Find occurrences of all section patterns
    for (const pattern of this.sectionPatterns) {
      const regex = new RegExp(pattern.regex.source, 'gi');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        markers.push({
          index: match.index,
          type: pattern.type,
          matchLength: match[0].length,
        });
      }
    }

    // Sort markers by position in text
    markers.sort((a, b) => a.index - b.index);

    if (markers.length === 0) {
      // No explicit markers found; treat as general pleadings or detect from content
      return [{
        section_type: this.guessSectionType(text),
        content: text,
      }];
    }

    const sections: Array<{ section_type: string; content: string }> = [];

    // Any text preceding the first marker (e.g. Court Memo, Cause Title)
    if (markers[0].index > 0) {
      const preamble = text.slice(0, markers[0].index).trim();
      if (preamble.length > 50) {
        sections.push({
          section_type: 'CAUSE_TITLE',
          content: preamble,
        });
      }
    }

    for (let i = 0; i < markers.length; i++) {
      const current = markers[i];
      const startIndex = current.index;
      const endIndex = i < markers.length - 1 ? markers[i + 1].index : text.length;
      const content = text.slice(startIndex, endIndex).trim();

      if (content.length > 20) {
        sections.push({
          section_type: current.type,
          content,
        });
      }
    }

    return sections;
  }

  private splitSectionWithOverlap(
    content: string,
    sectionType: string,
    targetSize: number,
    overlapSize: number
  ): Array<{ section_type: string; content: string }> {
    // Split on numbered legal paragraphs: "1. ", "2. ", "3. ", or double newlines
    const paragraphs = content.split(/(?=\n\s*(?:(?:\d+\.|\([a-z0-9]+\))\s+|[A-Z\s]{4,}:))/g);

    const result: Array<{ section_type: string; content: string }> = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      if ((currentChunk + '\n\n' + trimmedPara).length > targetSize && currentChunk.length > 0) {
        result.push({
          section_type: sectionType,
          content: currentChunk.trim(),
        });

        // Compute overlap from end of current chunk
        const overlapStart = Math.max(0, currentChunk.length - overlapSize);
        const overlapText = currentChunk.slice(overlapStart).trim();
        currentChunk = overlapText + '\n\n' + trimmedPara;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      }
    }

    if (currentChunk.trim().length > 0) {
      result.push({
        section_type: sectionType,
        content: currentChunk.trim(),
      });
    }

    return result;
  }

  private guessSectionType(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('prayer') || lower.includes('in the premises, it is prayed')) return 'PRAYER';
    if (lower.includes('grounds') || lower.includes('grave prejudice') || lower.includes('arbitrary')) return 'GROUNDS';
    if (lower.includes('showeth') || lower.includes('brief facts') || lower.includes('petitioner submits that')) return 'FACTS';
    if (lower.includes('order') || lower.includes('directed to') || lower.includes('held that')) return 'ORDER_OPERATIVE_PART';
    if (lower.includes('whereas') || lower.includes('witnesseth') || lower.includes('parties agree')) return 'CONTRACT_TERMS';
    return 'GENERAL_PLEADINGS';
  }
}

export const legalChunkingService = new LegalChunkingService();

