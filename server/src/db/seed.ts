import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { embeddingService } from '../services/embedding.service.js';

export async function seedDatabase() {
  console.log('🌱 Starting LexMind realistic Indian legal database seeding...');

  try {
    // 1. Create Sample Advocate
    const email = 'vikramaditya.sen@delhibar.in';
    await pool.query('DELETE FROM lawyers WHERE email = $1', [email]);

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('advocate123', salt);

    const lawyerProfile = {
      preferredSalutation: 'MOST RESPECTFULLY SHOWETH',
      courtAddressingHonorific: 'This Hon’ble Court',
      formattingPreferences: {
        useNumberedParagraphs: true,
        includeVerificationClause: true,
        prayerStyle: 'traditional',
      },
      recurringPhrasing: [
        'grave prejudice and irreparable injury',
        'settled proposition of law',
        'bona fide exercise of rights',
        'abuse of judicial process',
        'three-fold test of prima facie case',
        'balance of convenience',
      ],
      firmHeader: 'CHAMBERS OF VIKRAMADITYA SEN, ADVOCATE | HIGH COURT OF DELHI',
    };

    const lawyerInsert = await pool.query(
      `INSERT INTO lawyers (full_name, bar_council_id, email, password_hash, role, drafting_style_profile)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email`,
      [
        'Adv. Vikramaditya Sen',
        'D/1429/2011',
        email,
        password_hash,
        'ADVOCATE',
        JSON.stringify(lawyerProfile),
      ]
    );

    const lawyerId = lawyerInsert.rows[0].id;
    console.log(`✅ Seeded Advocate: ${lawyerInsert.rows[0].full_name} (${lawyerId})`);

    // Helper to calculate future hearing dates
    const getFutureDate = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toISOString().split('T')[0];
    };

    const getPastDate = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    // ==========================================
    // CASE 1: Criminal Anticipatory Bail
    // ==========================================
    const case1Res = await pool.query(
      `INSERT INTO cases (
        lawyer_id, case_title, cnr_number, client_name, opposing_party, 
        court_forum, case_type, status, outcome_summary, next_hearing_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        lawyerId,
        'Verma v. State of NCT of Delhi & Anr.',
        'DLHC010045212025',
        'Rajeev Verma (Managing Director, SysLogix India)',
        'State (Govt. of NCT of Delhi) & Ashok Singhania',
        'High Court of Delhi',
        'CRIMINAL',
        'ACTIVE',
        'Ad-interim protection from coercive action granted subject to joining investigation before IO on alternate Saturdays.',
        getFutureDate(5),
      ]
    );
    const case1Id = case1Res.rows[0].id;

    // Hearings for Case 1
    await pool.query(
      `INSERT INTO hearings (case_id, lawyer_id, hearing_date, purpose, judge_coram, order_summary, next_action_items)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7),
       ($1, $2, $3, $8, $5, $9, $10)`,
      [
        case1Id,
        lawyerId,
        getPastDate(12),
        'First Listing & Ad-Interim Protection',
        "Hon'ble Mr. Justice Sanjeev Narula",
        'Notice issued to the State. Learned APP accepts notice. Investigating Officer directed not to take coercive steps against the petitioner till next date. Petitioner directed to join investigation as and when called.',
        'File affidavit of compliance confirming cooperation with IO at P.S. Barakhamba Road.',
        'Status Report by State',
        'State sought two weeks time to file detailed status report regarding electronic transactions. Interim order extended.',
        'Prepare rejoinder to police status report once supplied.',
      ]
    );

    // Document 1 for Case 1
    const doc1Res = await pool.query(
      `INSERT INTO documents (case_id, lawyer_id, file_name, file_url, document_category, ocr_status, page_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        case1Id,
        lawyerId,
        'Bail_Application_Verma_Sec438_CrPC.pdf',
        '/uploads/Bail_Application_Verma_Sec438_CrPC.pdf',
        'BAIL_APPLICATION',
        'COMPLETED',
        6,
      ]
    );
    const doc1Id = doc1Res.rows[0].id;

    // Document Chunks for Case 1
    const chunksCase1 = [
      {
        section_type: 'FACTS',
        content: `IN THE HIGH COURT OF DELHI AT NEW DELHI\nBAIL APPLN. NO. 1420 OF 2025\n\nIN THE MATTER OF:\nRAJEEV VERMA ...APPLICANT\nVERSUS\nSTATE (NCT OF DELHI) & ANR. ...RESPONDENTS\n\nAPPLICATION UNDER SECTION 438 CR.P.C. (CORRESPONDING TO S. 482 BNSS) FOR GRANT OF ANTICIPATORY BAIL IN FIR NO. 88/2025 UNDER SECTIONS 420/406/120B IPC REGISTERED AT P.S. BARAKHAMBA ROAD, NEW DELHI.\n\nMOST RESPECTFULLY SHOWETH:\n1. That the Applicant is a law-abiding citizen and senior executive of SysLogix India, having unblemished personal reputation and roots in Delhi. The Applicant has never been convicted or involved in any criminal case.\n2. That the present FIR has been engineered by Respondent No. 2 as a pressure tactic arising purely out of a contractual joint-venture dispute involving software license royalties, which is essentially of a civil commercial character.\n3. That the Applicant has preserved all bank statements, email correspondences, and audit reports proving transparent handling of company finances.`,
      },
      {
        section_type: 'GROUNDS',
        content: `GROUNDS FOR ANTICIPATORY BAIL:\nA. Because the dispute between the parties is purely civil and commercial in nature, arising out of interpretation of clause 14 of the Master Services Agreement. It is a settled proposition of law that civil disputes cannot be converted into criminal proceedings to exert undue commercial pressure.\nB. Because no custodial interrogation of the Applicant is required as the entirety of the dispute turns on documentary evidence already seized or ready to be tendered to the Investigating Officer.\nC. Because as mandated by the Hon'ble Supreme Court in Arnesh Kumar v. State of Bihar (2014) 8 SCC 273 and Satender Kumar Antil v. CBI (2022) 10 SCC 51, arrest must not be made routinely where the alleged offences carry punishment under 7 years.\nD. Because the Applicant undertakes to join investigation at any hour and shall furnish solvent sureties to the satisfaction of This Hon'ble Court.`,
      },
      {
        section_type: 'PRAYER',
        content: `PRAYER:\nWherefore, in light of the facts and grounds submitted hereinabove, it is most respectfully prayed that This Hon'ble Court may graciously be pleased to:\n(a) Direct that in the event of arrest of the Applicant in FIR No. 88/2025, P.S. Barakhamba Road, he be released on anticipatory bail on such terms and conditions as this Hon'ble Court may deem fit;\n(b) Grant ad-interim ex-parte protection from arrest during pendency of the present application;\n(c) Pass any such further order(s) as this Hon'ble Court may deem just and equitable.`,
      },
    ];

    for (let i = 0; i < chunksCase1.length; i++) {
      const c = chunksCase1[i];
      const emb = await embeddingService.generateEmbedding(c.content);
      await pool.query(
        `INSERT INTO document_chunks (document_id, case_id, lawyer_id, chunk_index, section_type, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
        [
          doc1Id,
          case1Id,
          lawyerId,
          i,
          c.section_type,
          c.content,
          `[${emb.join(',')}]`,
          JSON.stringify({
            case_title: 'Verma v. State of NCT of Delhi',
            court_forum: 'High Court of Delhi',
            case_type: 'CRIMINAL',
            file_name: 'Bail_Application_Verma_Sec438_CrPC.pdf',
            outcome_summary: 'Interim protection granted',
          }),
        ]
      );
    }

    // ==========================================
    // CASE 2: Section 138 NI Act Complaint
    // ==========================================
    const case2Res = await pool.query(
      `INSERT INTO cases (
        lawyer_id, case_title, cnr_number, client_name, opposing_party, 
        court_forum, case_type, status, outcome_summary, next_hearing_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        lawyerId,
        'Apex Logistics Pvt. Ltd. v. Rajesh Kumar (Kumar Freightways)',
        'DLSW020089122024',
        'Apex Logistics Pvt. Ltd. (Through AR Mr. Manish Gupta)',
        'Rajesh Kumar, Proprietor M/s Kumar Freightways',
        'Metropolitan Magistrate (NI Act Special Court), Patiala House Courts, New Delhi',
        'COMMERCIAL',
        'ACTIVE',
        'Summoning order issued under Section 138 NI Act; Bailable warrants issued against accused upon default of appearance.',
        getFutureDate(11),
      ]
    );
    const case2Id = case2Res.rows[0].id;

    // Hearings for Case 2
    await pool.query(
      `INSERT INTO hearings (case_id, lawyer_id, hearing_date, purpose, judge_coram, order_summary, next_action_items)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7),
       ($1, $2, $3, $8, $5, $9, $10)`,
      [
        case2Id,
        lawyerId,
        getPastDate(30),
        'Pre-Summoning Evidence under S. 145 NI Act',
        'Metropolitan Magistrate-02 (NI Act), PHC',
        'Complainant tendered evidence by way of affidavit Ex. CW1/A along with original cheque, return memo, and statutory demand notice. Prima facie case made out. Accused summoned for next date.',
        'File process fee and speed post envelopes for service of summons.',
        'Appearance of Accused',
        'Accused failed to appear despite service of summons. Bailable warrant in the sum of Rs. 20,000/- issued through SHO concerned.',
        'Coordinate with execution cell for warrant service.',
      ]
    );

    // Document for Case 2
    const doc2Res = await pool.query(
      `INSERT INTO documents (case_id, lawyer_id, file_name, file_url, document_category, ocr_status, page_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        case2Id,
        lawyerId,
        'Sec138_NI_Act_Complaint_Petition.pdf',
        '/uploads/Sec138_NI_Act_Complaint_Petition.pdf',
        'PETITION',
        'COMPLETED',
        8,
      ]
    );
    const doc2Id = doc2Res.rows[0].id;

    const chunksCase2 = [
      {
        section_type: 'FACTS',
        content: `IN THE COURT OF METROPOLITAN MAGISTRATE (NI ACT SPECIAL COURT), PATIALA HOUSE COURTS, NEW DELHI\n\nCOMPLAINT CASE NO. 1204/2024\n\nIN THE MATTER OF:\nAPEX LOGISTICS PVT. LTD. ...COMPLAINANT\nVERSUS\nRAJESH KUMAR (PROP. KUMAR FREIGHTWAYS) ...ACCUSED\n\nCOMPLAINT UNDER SECTION 138 READ WITH SECTIONS 141 & 142 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881 FOR OFFENCE OF DISHONOUR OF CHEQUE.\n\nMOST RESPECTFULLY SHOWETH:\n1. That the Complainant is a private limited company engaged in domestic freight transportation and warehouse logistics.\n2. That towards discharge of admitted commercial liability for transportation consignments executed between January and March 2024, the Accused issued Cheque No. 402911 dated 15.04.2024 for an amount of Rs. 48,50,000/- drawn on HDFC Bank, Connaught Place Branch.\n3. That upon presentation by the Complainant through its banker ICICI Bank, the cheque was returned dishonoured on 18.04.2024 with the memo "Funds Insufficient".`,
      },
      {
        section_type: 'GROUNDS',
        content: `GROUNDS OF LIABILITY UNDER SECTIONS 138 & 139 OF NI ACT:\nA. Because the statutory presumption under Section 118 and Section 139 of the Negotiable Instruments Act operates squarely in favor of the holder of the cheque that it was received for the discharge in whole or in part of a debt or liability.\nB. Because the Complainant strictly adhered to statutory mandates by dispatching a Legal Demand Notice dated 29.04.2024 via Registered Speed Post within 30 days of dishonour, which was delivered on 03.05.2024.\nC. Because despite expiry of 15 statutory days from date of receipt of notice, the Accused deliberately failed to pay the dishonoured cheque amount, thereby completing the commission of the offence under Section 138 NI Act.\nD. Because as held in Dashrath Rupsingh Rathod v. State of Maharashtra and Section 142(2) NI Act, this Hon'ble Court holds territorial jurisdiction as the Complainant maintains its bank account within the local jurisdiction of this Court.`,
      },
      {
        section_type: 'PRAYER',
        content: `PRAYER:\nIt is therefore most respectfully prayed that This Hon'ble Court may be pleased to:\n(a) Summon the Accused to face trial for offence under Section 138 of the Negotiable Instruments Act, 1881;\n(b) Try and convict the Accused in accordance with law and sentence him to maximum imprisonment;\n(c) Award compensation to the Complainant under Section 357(3) CrPC equivalent to twice the cheque amount, i.e., Rs. 97,00,000/-;\n(d) Award actual litigation costs incurred by the Complainant.`,
      },
    ];

    for (let i = 0; i < chunksCase2.length; i++) {
      const c = chunksCase2[i];
      const emb = await embeddingService.generateEmbedding(c.content);
      await pool.query(
        `INSERT INTO document_chunks (document_id, case_id, lawyer_id, chunk_index, section_type, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
        [
          doc2Id,
          case2Id,
          lawyerId,
          i,
          c.section_type,
          c.content,
          `[${emb.join(',')}]`,
          JSON.stringify({
            case_title: 'Apex Logistics v. Rajesh Kumar',
            court_forum: 'Patiala House Courts, New Delhi',
            case_type: 'COMMERCIAL',
            file_name: 'Sec138_NI_Act_Complaint_Petition.pdf',
            outcome_summary: 'Summoning issued, bailable warrants executed',
          }),
        ]
      );
    }

    // ==========================================
    // CASE 3: Commercial Lease & Injunction (Order 39)
    // ==========================================
    const case3Res = await pool.query(
      `INSERT INTO cases (
        lawyer_id, case_title, cnr_number, client_name, opposing_party, 
        court_forum, case_type, status, outcome_summary, next_hearing_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        lawyerId,
        'M/s Heritage Retailers v. DLF Emporium Holdings Ltd.',
        'DLHC010078902024',
        'M/s Heritage Retailers Pvt. Ltd.',
        'DLF Emporium Holdings Ltd.',
        'High Court of Delhi (Commercial Division)',
        'COMMERCIAL',
        'ACTIVE',
        'Status quo order in force restraining defendant landlord from obstructing tenant retail showroom access or disconnecting air conditioning.',
        getFutureDate(18),
      ]
    );
    const case3Id = case3Res.rows[0].id;

    // Hearings for Case 3
    await pool.query(
      `INSERT INTO hearings (case_id, lawyer_id, hearing_date, purpose, judge_coram, order_summary, next_action_items)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7)`,
      [
        case3Id,
        lawyerId,
        getPastDate(15),
        'Application for Ad-Interim Injunction (O. 39 R. 1 & 2 CPC)',
        "Hon'ble Ms. Justice Rekha Palli",
        'Defendant appeared on caveat. Counsel for defendant undertakes not to disconnect essential utilities (HVAC and electricity) or create third-party lease rights till next date. Matter referred to Delhi High Court Mediation Centre for exploring amicable resolution.',
        'Attend joint mediation session at Delhi High Court Mediation Centre on Thursday.',
      ]
    );

    // Document for Case 3
    const doc3Res = await pool.query(
      `INSERT INTO documents (case_id, lawyer_id, file_name, file_url, document_category, ocr_status, page_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        case3Id,
        lawyerId,
        'Application_Order39_Rules1and2_CPC_Injunction.pdf',
        '/uploads/Application_Order39_Rules1and2_CPC_Injunction.pdf',
        'PETITION',
        'COMPLETED',
        10,
      ]
    );
    const doc3Id = doc3Res.rows[0].id;

    const chunksCase3 = [
      {
        section_type: 'FACTS',
        content: `IN THE HIGH COURT OF DELHI AT NEW DELHI\nCOMMERCIAL DIVISION\nCS (COMM) NO. 312 OF 2024\n\nHERITAGE RETAILERS PVT. LTD. ...PLAINTIFF\nVERSUS\nDLF EMPORIUM HOLDINGS LTD. ...DEFENDANT\n\nAPPLICATION UNDER ORDER XXXIX RULES 1 AND 2 READ WITH SECTION 151 OF THE CODE OF CIVIL PROCEDURE, 1908 FOR AD-INTERIM EX-PARTE TEMPORARY INJUNCTION.\n\nMOST RESPECTFULLY SHOWETH:\n1. That the Plaintiff is a luxury retail brand operating its flagship store in Delhi since 2018 pursuant to a registered 9-year Lease Deed dated 12.02.2018.\n2. That the Plaintiff has consistently paid monthly lease rentals of Rs. 14,00,000/- plus common area maintenance charges without default.\n3. That the Defendant has issued an unlawful termination letter dated 02.10.2024 attempting to evict the Plaintiff without adhering to the 180-day cure period stipulated under Clause 22.3 of the Lease Deed, and threatened to shut off centralized chiller air-conditioning.`,
      },
      {
        section_type: 'GROUNDS',
        content: `GROUNDS FOR TEMPORARY INJUNCTION (THREE-FOLD TEST):\nA. PRIMA FACIE CASE: The Plaintiff has demonstrated an unimpeachable legal right of continuous possession under a validly stamped, registered lease deed whose lock-in period has not expired. The purported termination is ex-facie illegal and unilateral.\nB. BALANCE OF CONVENIENCE: The balance of convenience tilts overwhelmingly in favor of the Plaintiff, who employs over 45 staff members and holds inventory exceeding Rs. 12 Crores at the store. Conversely, Defendant suffers no monetary prejudice since rent is tendered on time.\nC. IRREPARABLE LOSS & INJURY: As established in Gujarat Bottling Co. Ltd. v. Coca Cola Co. (1995) 5 SCC 545, where unilateral eviction or disconnection of utilities threatens ruinous disruption of business, damages cannot provide adequate restitution.\nD. Because Section 9 of the Arbitration and Conciliation Act and Section 151 CPC empower this Court to grant urgent interim protection pending substantive arbitral adjudication.`,
      },
      {
        section_type: 'PRAYER',
        content: `PRAYER:\nIn view of the facts and grounds stated above, it is most respectfully prayed that This Hon'ble Court may be pleased to:\n(a) Grant an ex-parte ad-interim injunction restraining the Defendant, its officers, agents, and mall management from evicting, locking out, or interfering with Plaintiff's peaceful possession of Store No. GF-12, Ground Floor;\n(b) Restrain the Defendant from disrupting or disconnecting essential amenities including electrical supply, HVAC chiller units, and security access;\n(c) Restrain Defendant from creating any third-party rights, licensee rights, or sub-leases over the suit premises.`,
      },
    ];

    for (let i = 0; i < chunksCase3.length; i++) {
      const c = chunksCase3[i];
      const emb = await embeddingService.generateEmbedding(c.content);
      await pool.query(
        `INSERT INTO document_chunks (document_id, case_id, lawyer_id, chunk_index, section_type, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
        [
          doc3Id,
          case3Id,
          lawyerId,
          i,
          c.section_type,
          c.content,
          `[${emb.join(',')}]`,
          JSON.stringify({
            case_title: 'Heritage Retailers v. DLF Emporium',
            court_forum: 'High Court of Delhi (Commercial Division)',
            case_type: 'COMMERCIAL',
            file_name: 'Application_Order39_Rules1and2_CPC_Injunction.pdf',
            outcome_summary: 'Status quo granted, mediation ongoing',
          }),
        ]
      );
    }

    // ==========================================
    // CASE 4: Civil Writ Petition (Article 226)
    // ==========================================
    const case4Res = await pool.query(
      `INSERT INTO cases (
        lawyer_id, case_title, cnr_number, client_name, opposing_party, 
        court_forum, case_type, status, outcome_summary, next_hearing_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        lawyerId,
        'Dr. Anita Rao v. Union of India & AIIMS New Delhi',
        'DLHC010023412025',
        'Dr. Anita Rao (Professor of Cardiology, AIIMS)',
        'Union of India (Ministry of Health) & Director, AIIMS',
        'High Court of Delhi (Writ Jurisdiction)',
        'WRIT',
        'ACTIVE',
        'Writ of Certiorari admitted; Impugned transfer order dated 14.01.2025 stayed until further orders.',
        getFutureDate(24),
      ]
    );
    const case4Id = case4Res.rows[0].id;

    // Hearings for Case 4
    await pool.query(
      `INSERT INTO hearings (case_id, lawyer_id, hearing_date, purpose, judge_coram, order_summary, next_action_items)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7)`,
      [
        case4Id,
        lawyerId,
        getPastDate(8),
        'Preliminary Hearing & Stay of Transfer Order',
        "Hon'ble The Acting Chief Justice & Justice Subramonium Prasad",
        'Notice of motion issued to Respondent Nos. 1 & 2. Rule DB issued. Prima facie, the impugned office memorandum violates statutory transfer regulations of 2019. Operation and implementation of the impugned transfer order dated 14.01.2025 shall remain stayed till the next date of hearing.',
        'Serve dasti notices to AIIMS Standing Counsel and Ministry of Health.',
      ]
    );

    // Document for Case 4
    const doc4Res = await pool.query(
      `INSERT INTO documents (case_id, lawyer_id, file_name, file_url, document_category, ocr_status, page_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        case4Id,
        lawyerId,
        'Civil_Writ_Petition_Article226_Transfer_Challenge.pdf',
        '/uploads/Civil_Writ_Petition_Article226_Transfer_Challenge.pdf',
        'PETITION',
        'COMPLETED',
        14,
      ]
    );
    const doc4Id = doc4Res.rows[0].id;

    const chunksCase4 = [
      {
        section_type: 'FACTS',
        content: `IN THE HIGH COURT OF DELHI AT NEW DELHI\nEXTRAORDINARY WRIT JURISDICTION\nW.P. (C) NO. 819 OF 2025\n\nIN THE MATTER OF:\nDR. ANITA RAO ...PETITIONER\nVERSUS\nUNION OF INDIA & ORS. ...RESPONDENTS\n\nWRIT PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA FOR ISSUANCE OF A WRIT OF CERTIORARI/MANDAMUS CHALLENGING THE IMPUGNED TRANSFER OFFICE MEMORANDUM DATED 14.01.2025.\n\nMOST RESPECTFULLY SHOWETH:\n1. That the Petitioner is a distinguished Professor and Head of Unit (Cardiology) at AIIMS, New Delhi, having served for 22 years and leading critical ICMR national cardiology clinical trials.\n2. That vide impugned Office Memorandum dated 14.01.2025, Respondent No. 2 abruptly transferred the Petitioner to an administrative post at AIIMS Kalyani in the middle of ongoing clinical trials and academic semester.\n3. That the impugned order has been passed without the recommendation of the statutory Central Faculty Placement Committee and in blatant violation of the AIIMS Rotational Headship Guidelines 2019.`,
      },
      {
        section_type: 'GROUNDS',
        content: `GROUNDS OF WRIT CHALLENGE UNDER ARTICLE 226:\nA. Because the impugned transfer is manifestly arbitrary, punitive in nature, and violative of Article 14 of the Constitution of India. It has been passed with malice in law to accommodate a junior faculty member.\nB. Because administrative action must be supported by reason. As held by the Hon'ble Supreme Court in Kranti Associates Pvt. Ltd. v. Masood Ahmed Khan (2010) 9 SCC 496, unreasoned and arbitrary orders affect substantive career rights and are liable to be quashed.\nC. Because mid-tenure transfer disrupting sanctioned ICMR research violates legitimate expectation and public interest in ongoing medical research.\nD. Because the Petitioner has exhausted all administrative remedies by filing a detailed representation dated 16.01.2025, which has met with complete inaction from the Respondent authorities.`,
      },
      {
        section_type: 'PRAYER',
        content: `PRAYER:\nWherefore, in the facts and circumstances stated above, it is most respectfully prayed that This Hon'ble Court may be pleased to:\n(a) Issue a Writ of Certiorari or any other appropriate writ, order, or direction quashing and setting aside the impugned Office Memorandum dated 14.01.2025 issued by Respondent No. 2;\n(b) Issue a Writ of Mandamus directing the Respondents to allow the Petitioner to continue discharging her duties as Professor of Cardiology at AIIMS, New Delhi with all consequential benefits;\n(c) Grant ad-interim ex-parte stay of the operation of the impugned Office Memorandum dated 14.01.2025 during the pendency of the present petition.`,
      },
    ];

    for (let i = 0; i < chunksCase4.length; i++) {
      const c = chunksCase4[i];
      const emb = await embeddingService.generateEmbedding(c.content);
      await pool.query(
        `INSERT INTO document_chunks (document_id, case_id, lawyer_id, chunk_index, section_type, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
        [
          doc4Id,
          case4Id,
          lawyerId,
          i,
          c.section_type,
          c.content,
          `[${emb.join(',')}]`,
          JSON.stringify({
            case_title: 'Dr. Anita Rao v. Union of India & AIIMS',
            court_forum: 'High Court of Delhi (Writ Jurisdiction)',
            case_type: 'WRIT',
            file_name: 'Civil_Writ_Petition_Article226_Transfer_Challenge.pdf',
            outcome_summary: 'Transfer stayed, rule DB issued',
          }),
        ]
      );
    }

    console.log('🎉 Seeding successfully completed! 4 Indian cases, hearings, documents, and 768-dim vector chunks inserted.');
  } catch (error) {
    console.error('❌ Database seeding error:', error);
    throw error;
  }
}

// Allow direct execution
if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
