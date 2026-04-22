// ========================================================================
// TRENDZACT PARTNERS — DISCOVER PAGE CONTENT
// ========================================================================
//
// Single source of truth for all cards rendered on /discover.
//
// Renders into five card types:
//   - SOLUTION    (high-level business challenges)
//   - USE CASE    (specific scenarios partners sell into)
//   - PRODUCT     (the modules partners sell — shown with bullets)
//   - CASE STUDY  (anonymized industry reference stories)
//   - IDEAL BUYER (personas partners pitch to)
//
// Edit this file to add/update/remove cards. No other file needs changing.
//
// ---------- Common card fields ----------
//
//   id              — unique slug (letters, digits, dashes). Used as
//                     the DOM id on product cards so in-page anchor
//                     links work (e.g. `#grc1-core`).
//   title           — heading shown on the card
//   tags            — small chip labels
//   moreInfoUrl     — "More Info →" link target. Use "#" or omit to hide.
//                     Product cards link to same-page anchors (e.g.
//                     `#grc1-core`) so the link scrolls to the card.
//
// ---------- Asset fields (all optional) ----------
//
//   technicalReport  — Firebase Storage path OR https:// URL → Report icon
//   infographic      — Firebase Storage path OR https:// URL → Infographic icon
//   vimeoUrl         — Vimeo URL                              → Video icon
//
//   Omit a field to hide that icon. Don't use empty strings.
//
// ---------- Solution / Use Case / Buyer fields ----------
//
//   description     — 1-3 sentences shown on the card.
//
// ---------- Product-only fields ----------
//
//   category        — "CORE" | "MODULE" | "ENHANCE"
//                     Shown as the pill tag category on the card.
//
//   summary         — Single short sentence under the title. Shorter
//                     and snappier than `description`.
//
//   capabilities    — Array of strings rendered as "Key Capabilities"
//                     bullets. 4-8 items is the sweet spot.
//
//   outcomes        — Array of strings rendered as "Business Outcomes"
//                     bullets. 3-5 items.
//
// ---------- Tips for editors ----------
//
//   - The SAMPLE_* constants below let you drop placeholder assets onto
//     a card temporarily: e.g. `technicalReport: SAMPLE_REPORT`
//   - Missing commas between items are the #1 cause of breakage — when in
//     doubt, copy an existing block and edit it.
// ========================================================================

// Sample asset paths — available as placeholders if you need one temporarily.
// Today only the `insider-risk` and `swa` cards use them.
const SAMPLE_REPORT      = 'Trendzact logo horizontal on navy backdrop.pdf';
const SAMPLE_INFOGRAPHIC = 'Trendzact logo stacked on navy backdrop.jpg';
const SAMPLE_VIDEO       = 'https://vimeo.com/1179002076/d44cd25dc9';

window.SOLUTION_CONTENT = {

  // ========================================================================
  // SOLUTIONS — high-level business challenges
  // ========================================================================
  solutions: [
    {
      id: 'insider-risk',
      title: 'Insider Risk & Data Protection',
      description: 'Detect and prevent insider-driven exposure in real time — combining behavior, sensitivity context, and edge enforcement.',
      tags: ['Edge DLP', 'ITM', 'SIA'],
      moreInfoUrl: '#',
      technicalReport: SAMPLE_REPORT,
      infographic: SAMPLE_INFOGRAPHIC,
      vimeoUrl: SAMPLE_VIDEO
    },
    {
      id: 'workforce-intelligence',
      title: 'Workforce Intelligence & HR Analytics',
      description: 'Privacy-aware insight into productivity, focus, engagement, and conduct risk through objective behavioral context.',
      tags: ['GRC1 Core', 'BI'],
      moreInfoUrl: '#'
    },
    {
      id: 'identity-access',
      title: 'Identity, Access & Workspace Security',
      description: 'Identity assurance, workspace controls, and endpoint context to reduce risk after login and across the physical environment.',
      tags: ['SIA', 'SWA', 'SVM'],
      moreInfoUrl: '#'
    },
    {
      id: 'audit-readiness',
      title: 'Audit Readiness & Regulatory Adherence',
      description: 'From audit scramble to continuous readiness with governed evidence, policy workflows, and traceability.',
      tags: ['GRC1 Core', 'MSR'],
      moreInfoUrl: '#'
    },
    {
      id: 'enterprise-risk',
      title: 'Enterprise Risk & Ecosystem Oversight',
      description: 'Endpoint, workspace, and behavioral signals for supplier, third-party, shadow IT, and operational risk.',
      tags: ['ITM', 'Edge DLP'],
      moreInfoUrl: '#'
    },
    {
      id: 'executive-governance',
      title: 'Executive Governance & Specialized Controls',
      description: 'Board-level visibility, privileged user monitoring, and high-assurance controls for specialized environments.',
      tags: ['MSR', 'ITM'],
      moreInfoUrl: '#'
    }
  ],

  // ========================================================================
  // USE CASES — specific scenarios partners sell into
  // ========================================================================
  useCases: [
    {
      id: 'clear-desk',
      title: 'Clear Desk Compliance',
      description: 'Continuous workspace validation for sensitive paper, devices, and unauthorized observers in remote and hybrid environments.',
      tags: ['Secure Workspaces Anywhere'],
      moreInfoUrl: '#'
    },
    {
      id: 'data-exfil',
      title: 'Advanced Data Exfiltration Prevention',
      description: 'Visual, clipboard, USB, and cross-display exposure prevention with real-time masking and interruption at the endpoint.',
      tags: ['Edge DLP', 'ITM'],
      moreInfoUrl: '#'
    },
    {
      id: 'identity-assurance',
      title: 'Continuous Identity Assurance',
      description: 'Risk-gated biometric step-up for sensitive activity — reduces credential sharing and session misuse.',
      tags: ['Session Identity Assurance'],
      moreInfoUrl: '#'
    },
    {
      id: 'secure-meetings',
      title: 'Secure Virtual Meetings',
      description: 'Meeting-aware masking, watermarking, recording triggers, and screenshot control for collaboration environments.',
      tags: ['Secure Virtual Meetings'],
      moreInfoUrl: '#'
    },
    {
      id: 'privileged-user',
      title: 'Privileged User Monitoring',
      description: 'Governed, attributable oversight for admin, engineering, and executive accounts with explainable detection logic.',
      tags: ['ITM', 'MSR'],
      moreInfoUrl: '#'
    },
    {
      id: 'contact-center',
      title: 'Contact Center Compliance',
      description: 'Screen and session recording, identity confidence, and PII masking for BPO and regulated contact operations.',
      tags: ['MSR', 'SIA', 'Edge DLP'],
      moreInfoUrl: '#'
    },
    {
      id: 'dlp-augmentation',
      title: 'DLP Augmentation',
      description: 'Add real-time edge enforcement and behavioral context to existing Microsoft Purview or legacy DLP investments.',
      tags: ['Edge DLP'],
      moreInfoUrl: '#'
    },
    {
      id: 'audit-automation',
      title: 'Audit Trail Automation',
      description: 'Policy-bound records with evidence handling, case workflows, and control execution visibility.',
      tags: ['GRC1 Core'],
      moreInfoUrl: '#'
    }
  ],

  // ========================================================================
  // PRODUCTS — the modules partners sell
  // ========================================================================
  // Product cards render the full format: badge / title / summary / tags /
  // Key Capabilities + Business Outcomes bullets / More Info / asset row.
  // moreInfoUrl uses same-page anchors (#<id>) because the render function
  // sets `id="<card.id>"` on each product card's <article>.
  products: [
    {
      id: 'grc1-core',
      title: 'GRC1 Core',
      category: 'CORE',
      description: 'Required foundation: policies, telemetry, detection, scoring, workflows, playbooks, evidence, and reporting.',
      summary: 'The required operational and governance foundation for every GRC1 deployment.',
      tags: [],
      moreInfoUrl: '#grc1-core',
      capabilities: [
        'Policy and use-case configuration',
        'Telemetry ingestion and normalization',
        'Detection and scoring frameworks',
        'Case and triage workflows',
        'Playbook governance and execution logging',
        'Evidence handling and reporting',
        'RBAC, approvals, and auditability',
        'Integration framework for connected systems'
      ],
      outcomes: [
        'Consolidate fragmented controls into one operating model',
        'Improve audit readiness and investigation quality',
        'Standardize detection-to-action across the program',
        'Establish the scalable foundation for adding modules'
      ]
    },
    {
      id: 'swa',
      title: 'Secure Workspaces Anywhere',
      category: 'MODULE',
      description: 'Workspace object detection, observer detection, unattended sessions, and clear desk enforcement.',
      summary: 'Continuous workspace compliance for distributed and regulated environments.',
      tags: [],
      moreInfoUrl: '#swa',
      capabilities: [
        'Workspace object detection',
        'Observer detection',
        'Unattended workstation detection',
        'Clear desk and policy-driven workspace checks',
        'Workspace risk scoring',
        'Privacy-aware image handling',
        'On-screen user prompts and policy notifications'
      ],
      outcomes: [
        'Enforce clear desk and workspace policy at scale',
        'Detect and deter unauthorized observers',
        'Strengthen controls in regulated environments',
        'Protect executive and privileged workspaces'
      ],
      technicalReport: SAMPLE_REPORT,
      infographic: SAMPLE_INFOGRAPHIC,
      vimeoUrl: SAMPLE_VIDEO
    },
    {
      id: 'sia',
      title: 'Session Identity Assurance',
      category: 'MODULE',
      description: 'Facial biometric authentication as a risk-based MFA factor, continuous confidence, liveness, and identity drift.',
      summary: 'Risk-based facial biometric authentication for sensitive activity.',
      tags: [],
      moreInfoUrl: '#sia',
      capabilities: [
        'Risk-triggered biometric step-up authentication',
        'Continuous confidence scoring',
        'Liveness checks',
        'Session identity drift detection',
        'Privacy-safe biometric handling',
        'Audit trails for sensitive access events'
      ],
      outcomes: [
        'Reduce uncertainty about who is actually present after login',
        'Deter credential sharing and session misuse',
        'Strengthen Zero Trust and step-up strategies',
        'Support higher-assurance workflows in regulated environments'
      ]
    },
    {
      id: 'msr',
      title: 'Multi-Screen Recording',
      category: 'MODULE',
      description: 'Synchronized evidence across single- and multi-display workstations with policy-bound capture.',
      summary: 'Defensible, synchronized evidence across single- and multi-display workstations.',
      tags: [],
      moreInfoUrl: '#msr',
      capabilities: [
        'Single- and multi-display enumeration',
        'Continuous, burst, and event-based capture modes',
        'Synchronized cross-display timelines',
        'Offline buffering and compression',
        'Intelligent redaction and evidence shaping',
        'Investigator playback and review'
      ],
      outcomes: [
        'Reduce blind spots in high-value workflows',
        'Improve evidence quality during investigations',
        'Support compliance recording requirements',
        'Strengthen controls for screens and meetings'
      ]
    },
    {
      id: 'edge-dlp',
      title: 'Edge DLP',
      category: 'MODULE',
      description: 'Visual, behavioral, and label-aware exposure prevention at the endpoint with masking and interruption.',
      summary: 'Visual, behavioral, and label-aware exposure prevention at the endpoint.',
      tags: [],
      moreInfoUrl: '#edge-dlp',
      capabilities: [
        'Sensitivity-aware enforcement',
        'Visual exposure intelligence',
        'Behavior-linked exposure analytics',
        'Cross-display exposure correlation',
        'Policy-driven masking, restriction, interruption',
        'Evidence timelines for review and audit'
      ],
      outcomes: [
        'Reduce false positives with stronger context',
        'Prevent insider-driven exposure in real time',
        'Add edge enforcement to existing classification investments',
        'Extend DLP coverage beyond files in motion'
      ]
    },
    {
      id: 'itm',
      title: 'Insider Threat Management',
      category: 'MODULE',
      description: 'Deterministic detection, explainable signatures, risk scoring, case workflows, and governed response playbooks.',
      summary: 'Deterministic detection, explainable signatures, and governed response.',
      tags: [],
      moreInfoUrl: '#itm',
      capabilities: [
        'Behavior-driven detections',
        'Explainable signatures and thresholds',
        'Risk scoring and prioritization',
        'Case creation and triage workflows',
        'Governed response playbooks',
        'Evidence handling and executive reporting'
      ],
      outcomes: [
        'Reduce mean time to detect and triage',
        'Improve explainability over black-box analytics',
        'Strengthen SOC, legal, compliance, and HR coordination',
        'Build a more defensible insider risk program'
      ]
    },
    {
      id: 'svm',
      title: 'Secure Virtual Meetings',
      category: 'MODULE',
      description: 'Meeting-aware masking, dynamic watermarking, and identity-aware controls for sensitive collaboration.',
      summary: 'Meeting-aware masking, watermarking, and identity-aware collaboration controls.',
      tags: [],
      moreInfoUrl: '#svm',
      capabilities: [
        'Meeting detection and context awareness',
        'Screenshare-aware masking',
        'Dynamic watermarking',
        'Risk-triggered recording',
        'Screenshot and exposure controls',
        'Identity-aware controls for sensitive sharing'
      ],
      outcomes: [
        'Reduce screenshare and recording risk',
        'Protect high-sensitivity meetings',
        'Strengthen compliance posture during remote collaboration',
        'Extend data protection into real collaboration workflows'
      ]
    }
  ],

  // ========================================================================
  // CASE STUDIES — anonymized industry reference stories
  // ========================================================================
  // Use these in discovery, solution shaping, and objection handling.
  // `tags[0]` is the industry label; remaining tags are the module mix.
  caseStudies: [
    {
      id: 'cs-global-bank',
      title: 'Global Bank Reduces Insider Exfiltration by 72%',
      description: 'Tier-1 bank deployed Edge DLP + ITM across 28,000 endpoints to close visual and clipboard exposure gaps in trading and research.',
      tags: ['Financial Services', 'Edge DLP', 'ITM'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-hospital-phi',
      title: 'Hospital System Strengthens PHI Workspace Controls',
      description: 'Regional health system used Secure Workspaces Anywhere to enforce clear-desk and observer detection for remote billing and coding staff.',
      tags: ['Healthcare', 'SWA'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-bpo-regulatory',
      title: 'Global BPO Compliant Across Six Regulatory Regimes',
      description: 'Multi-Screen Recording + SIA deployed to 12,000 agents, enabling PCI, HIPAA, and regional PII compliance without platform fragmentation.',
      tags: ['BPO / Contact Center', 'MSR', 'SIA', 'Edge DLP'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-fed-audit',
      title: 'Federal Agency Gains Continuous Audit Readiness',
      description: 'GRC1 Core and governed workflows replaced a patchwork of logging and spreadsheet evidence processes, improving audit cycle times by 65%.',
      tags: ['Public Sector', 'GRC1 Core'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-saas-ip',
      title: 'SaaS Company Protects IP During Remote Collaboration',
      description: 'Secure Virtual Meetings stopped sensitive screenshare exposure and screenshots during product and engineering reviews across distributed teams.',
      tags: ['Technology', 'SVM', 'Edge DLP'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-manufacturer-trade-secrets',
      title: 'Regulated Manufacturer Protects Trade Secrets',
      description: 'Privileged user monitoring with ITM and MSR identified anomalous engineering access patterns before IP exfiltration could occur.',
      tags: ['Manufacturing', 'ITM', 'MSR'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-insurance-sia',
      title: 'Carrier Strengthens Identity Assurance for Claims Adjusters',
      description: 'SIA deployed to 4,500 adjusters, adding risk-gated biometric step-up for high-value claim approvals and PII access.',
      tags: ['Insurance', 'SIA'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-law-firm-remote',
      title: 'Am Law 100 Firm Extends Workspace Controls to Remote Associates',
      description: 'Observer detection and clear desk enforcement added to hybrid working associates handling confidential client matters.',
      tags: ['Legal', 'SWA', 'Edge DLP'],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-utility-ot-adjacent',
      title: 'Utility Adds Edge Enforcement to Operational Technology Adjacent Systems',
      description: 'GRC1 deployed on office and engineering endpoints adjacent to OT networks, preventing exposure of SCADA configuration and drawings.',
      tags: ['Energy / Utilities', 'Edge DLP', 'ITM'],
      moreInfoUrl: '#'
    }
  ],

  // ========================================================================
  // IDEAL BUYERS — personas partners pitch to
  // ========================================================================
  buyers: [
    {
      id: 'ciso',
      title: 'CISO / Security Leadership',
      description: 'Consolidate fragmented insider risk, DLP, and workspace tooling into one operating model with edge enforcement.',
      tags: ['Insider Risk', 'Data Protection'],
      moreInfoUrl: '#'
    },
    {
      id: 'cco',
      title: 'Chief Compliance Officer',
      description: 'Continuous audit readiness, policy-bound evidence, and governance workflows across distributed workforces.',
      tags: ['Audit Readiness'],
      moreInfoUrl: '#'
    },
    {
      id: 'iam-head',
      title: 'Head of IAM / Zero Trust',
      description: 'Answer "who is actually present" during sensitive activity with risk-gated biometric step-up.',
      tags: ['Identity Assurance'],
      moreInfoUrl: '#'
    },
    {
      id: 'soc',
      title: 'SOC / Security Operations',
      description: 'Reduce false positives, improve triage quality, and add edge enforcement to existing detection pipelines.',
      tags: ['ITM', 'Case Management'],
      moreInfoUrl: '#'
    },
    {
      id: 'vp-risk',
      title: 'VP Risk / ERM Lead',
      description: 'Third-party, operational, and ecosystem risk visibility backed by endpoint and behavioral signal collection.',
      tags: ['Enterprise Risk'],
      moreInfoUrl: '#'
    },
    {
      id: 'vp-people',
      title: 'VP People / HR Analytics',
      description: 'Objective workforce intelligence, conduct risk signals, and productivity trending — privacy-aware by design.',
      tags: ['Workforce Intelligence'],
      moreInfoUrl: '#'
    }
  ]
};
