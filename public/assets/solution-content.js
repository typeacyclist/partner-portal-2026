// ========================================================================
// TRENDZACT PARTNERS — DISCOVER PAGE CONTENT
// ========================================================================
//
// Single source of truth for all cards rendered on /discover.
//
// Renders into five card types:
//   - SOLUTION    (high-level business challenges)
//   - USE CASE    (specific scenarios partners sell into)
//   - PRODUCT     (the modules partners sell — shown with two-col bullets)
//   - CASE STUDY  (anonymized industry reference stories)
//   - IDEAL BUYER (personas partners pitch to)
//
// Edit this file to add/update/remove cards. No other file needs changing.
//
// ---------- Unified card shape ----------
//
// All card types render in the same shape on Discover:
//   1. Primary badge (the type: SOLUTION, USE CASE, etc.)
//   2. Title
//   3. Summary (1 short sentence, ~15-25 words)
//   4. Secondary chips (tags — modules, industries, personas)
//   5. Bullets (type-specific content, see below)
//   6. Links row (report / infographic / video — only rendered when present)
//
// Product cards render the same shape but use a two-column layout for
// the bullets (Key Capabilities + Business Outcomes) because there's
// more content.
//
// ---------- Common fields (all card types) ----------
//
//   id              — unique slug (letters, digits, dashes). Used as the
//                     DOM id on product cards so anchor links like
//                     `#grc1-core` scroll to the card.
//   title           — heading shown on the card
//   summary         — single short sentence shown under the title
//   tags            — array of strings shown as secondary chips
//   moreInfoUrl     — "More Info →" link target. Use "#" or omit to hide.
//                     Product cards link to same-page anchors (e.g. `#grc1-core`).
//
// ---------- Bullets (type-specific content) ----------
//
// For SOLUTIONS, USE CASES, CASE STUDIES, and IDEAL BUYERS:
//   bullets  — array of 3-4 strings with type-appropriate content:
//     · Solutions    → symptoms/pain points this solution addresses
//     · Use Cases    → concrete trigger moments for partners to raise it
//     · Case Studies → outcomes/results from the deployment
//     · Ideal Buyers → priorities/pains this persona owns
//
// For PRODUCTS (uses the existing two-column format):
//   capabilities — array → "Key Capabilities" bullets (4-8 items)
//   outcomes     — array → "Business Outcomes" bullets (3-5 items)
//   category     — "CORE" | "MODULE" | "ENHANCE" pill
//   description  — kept for legacy reasons; not rendered on Discover
//
// ---------- Asset fields (all optional, any card type) ----------
//
//   technicalReport  — Firebase Storage path OR https:// URL → Report icon
//   infographic      — Firebase Storage path OR https:// URL → Infographic icon
//   vimeoUrl         — Vimeo URL                              → Video icon
//
//   Omit a field to hide that icon. Don't use empty strings.
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
  // Bullets describe the symptoms / pain points this solution addresses.
  solutions: [
    {
      id: 'insider-risk',
      title: 'Insider Risk & Data Protection',
      summary: 'Detect and prevent insider-driven exposure in real time — combining behavior, sensitivity context, and edge enforcement.',
      tags: ['Edge DLP', 'ITM', 'SIA'],
      bullets: [
        'Legacy DLP misses visual, clipboard, and screen-based exposure',
        'Analysts drowning in false positives from log-only analytics',
        'No defensible evidence trail when insider incidents happen',
        'Cloud-only controls leave the endpoint unprotected'
      ],
      moreInfoUrl: '#',
      technicalReport: SAMPLE_REPORT,
      infographic: SAMPLE_INFOGRAPHIC,
      vimeoUrl: SAMPLE_VIDEO
    },
    {
      id: 'workforce-intelligence',
      title: 'Workforce Intelligence & HR Analytics',
      summary: 'Privacy-aware insight into productivity, focus, engagement, and conduct risk through objective behavioral context.',
      tags: ['GRC1 Core', 'BI'],
      bullets: [
        'Leadership has no objective view of distributed workforce productivity',
        'Engagement and focus trends only visible after retention damage is done',
        'Conduct risk signals scattered across unrelated systems',
        'Privacy concerns block traditional monitoring approaches'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'identity-access',
      title: 'Identity, Access & Workspace Security',
      summary: 'Identity assurance, workspace controls, and endpoint context to reduce risk after login and across the physical environment.',
      tags: ['SIA', 'SWA', 'SVM'],
      bullets: [
        'Credentials pass at login but no assurance of who is actually present',
        'Credential sharing and session hijack invisible to SSO and MFA',
        'Physical workspace risks (observers, unattended screens) uncovered',
        'Zero Trust strategy stalls at the endpoint and in collaboration'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'audit-readiness',
      title: 'Audit Readiness & Regulatory Adherence',
      summary: 'From audit scramble to continuous readiness with governed evidence, policy workflows, and traceability.',
      tags: ['GRC1 Core', 'MSR'],
      bullets: [
        'Audit cycles are a quarterly fire drill rather than continuous',
        'Evidence scattered across logs, spreadsheets, and screenshots',
        'Controls exist on paper but cannot be proven effective',
        'Regulators want traceable, attributable records — not summaries'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'enterprise-risk',
      title: 'Enterprise Risk & Ecosystem Oversight',
      summary: 'Endpoint, workspace, and behavioral signals for supplier, third-party, shadow IT, and operational risk.',
      tags: ['ITM', 'Edge DLP'],
      bullets: [
        'Third-party and supplier endpoints are black boxes',
        'Shadow IT emerges faster than procurement can track it',
        'Operational risk owners lack ground-truth behavior data',
        'Ecosystem exposures surface only after damage is done'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'executive-governance',
      title: 'Executive Governance & Specialized Controls',
      summary: 'Board-level visibility, privileged user monitoring, and high-assurance controls for specialized environments.',
      tags: ['MSR', 'ITM'],
      bullets: [
        'Privileged users operate with oversight gaps invisible to standard tools',
        'Board wants assurance — not aggregated dashboards and trust',
        'Specialized environments (trading, legal, R&D) need tailored controls',
        'Executive sessions and sensitive meetings lack attribution'
      ],
      moreInfoUrl: '#'
    }
  ],

  // ========================================================================
  // USE CASES — specific scenarios partners sell into
  // ========================================================================
  // Bullets describe the concrete trigger moments for raising this use case.
  useCases: [
    {
      id: 'clear-desk',
      title: 'Clear Desk Compliance',
      summary: 'Continuous workspace validation for sensitive paper, devices, and unauthorized observers in remote and hybrid environments.',
      tags: ['Secure Workspaces Anywhere'],
      bullets: [
        'Remote workforce handling sensitive paper or devices',
        'Regulator or auditor flagged workspace policy gaps',
        'Observer detection required for PCI, HIPAA, or SOC 2',
        'Executive or privileged roles working outside controlled space'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'data-exfil',
      title: 'Advanced Data Exfiltration Prevention',
      summary: 'Visual, clipboard, USB, and cross-display exposure prevention with real-time masking and interruption at the endpoint.',
      tags: ['Edge DLP', 'ITM'],
      bullets: [
        'Known exfiltration incident or near-miss in the last 12 months',
        'Legacy DLP failing on visual, clipboard, or screen-based channels',
        'R&D, trading, or M&A teams with concentrated IP exposure',
        'Competitive insider-threat concerns tied to attrition'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'identity-assurance',
      title: 'Continuous Identity Assurance',
      summary: 'Risk-gated biometric step-up for sensitive activity — reduces credential sharing and session misuse.',
      tags: ['Session Identity Assurance'],
      bullets: [
        'Regulated workflows (claims, financial approvals) needing step-up assurance',
        'Evidence of credential sharing among contractors or offshore teams',
        'Zero Trust initiative expanding beyond login-time MFA',
        'Compliance frameworks requiring session-level identity proof'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'secure-meetings',
      title: 'Secure Virtual Meetings',
      summary: 'Meeting-aware masking, watermarking, recording triggers, and screenshot control for collaboration environments.',
      tags: ['Secure Virtual Meetings'],
      bullets: [
        'Sensitive information routinely shared on Teams, Zoom, or Meet',
        'Engineering, product, or board reviews conducted remotely',
        'External participants joining confidential discussions',
        'Leak or screenshot incident tied to virtual collaboration'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'privileged-user',
      title: 'Privileged User Monitoring',
      summary: 'Governed, attributable oversight for admin, engineering, and executive accounts with explainable detection logic.',
      tags: ['ITM', 'MSR'],
      bullets: [
        'Admin and engineering accounts with broad privileged access',
        'Recent privileged-user incident or audit finding',
        'Legal, HR, or executive need for defensible evidence',
        'Insider risk program requiring explainable (not black-box) controls'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'contact-center',
      title: 'Contact Center Compliance',
      summary: 'Screen and session recording, identity confidence, and PII masking for BPO and regulated contact operations.',
      tags: ['MSR', 'SIA', 'Edge DLP'],
      bullets: [
        'BPO or contact center handling PCI, HIPAA, or regional PII',
        'Multi-regulatory footprint needing unified evidence handling',
        'Agent screen-capture or recording requirement from client SLA',
        'Fraud or PII-mishandling incident in the last 12 months'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'dlp-augmentation',
      title: 'DLP Augmentation',
      summary: 'Add real-time edge enforcement and behavioral context to existing Microsoft Purview or legacy DLP investments.',
      tags: ['Edge DLP'],
      bullets: [
        'Existing Purview or Symantec/Forcepoint DLP with visible gaps',
        'High false-positive rate frustrating end users and reviewers',
        'Classification investment not producing enforcement outcomes',
        'Visual and clipboard channels uncovered by current tooling'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'audit-automation',
      title: 'Audit Trail Automation',
      summary: 'Policy-bound records with evidence handling, case workflows, and control execution visibility.',
      tags: ['GRC1 Core'],
      bullets: [
        'Audit prep consuming weeks of manual evidence collection',
        'Controls framework rollout (SOC 2, ISO 27001, NIST) in flight',
        'Regulator asking for continuous evidence, not point-in-time snapshots',
        'GRC or compliance lead looking for detection-to-evidence pipeline'
      ],
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
  // Bullets describe outcomes / results from the deployment.
  // `tags[0]` is the industry label; remaining tags are the module mix.
  caseStudies: [
    {
      id: 'cs-global-bank',
      title: 'Global Bank Reduces Insider Exfiltration by 72%',
      summary: 'Tier-1 bank deployed Edge DLP + ITM across 28,000 endpoints to close visual and clipboard exposure gaps in trading and research.',
      tags: ['Financial Services', 'Edge DLP', 'ITM'],
      bullets: [
        '28,000 endpoints protected across trading and research',
        '72% reduction in insider exfiltration events year over year',
        'Consolidated three legacy DLP and monitoring tools',
        'Auditor sign-off achieved on new control framework'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-hospital-phi',
      title: 'Hospital System Strengthens PHI Workspace Controls',
      summary: 'Regional health system used Secure Workspaces Anywhere to enforce clear-desk and observer detection for remote billing and coding staff.',
      tags: ['Healthcare', 'SWA'],
      bullets: [
        'Clear-desk compliance extended to 3,400 remote staff',
        'Observer detection closed a HIPAA audit finding',
        'PHI exposure incidents reduced to zero in quarter-over-quarter review',
        'Workspace compliance program documented for regulator'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-bpo-regulatory',
      title: 'Global BPO Compliant Across Six Regulatory Regimes',
      summary: 'Multi-Screen Recording + SIA deployed to 12,000 agents, enabling PCI, HIPAA, and regional PII compliance without platform fragmentation.',
      tags: ['BPO / Contact Center', 'MSR', 'SIA', 'Edge DLP'],
      bullets: [
        '12,000 agents covered under a single compliance platform',
        'PCI, HIPAA, GDPR, and three regional PII regimes satisfied',
        'Replaced four siloed recording and DLP tools',
        'Client SLA audit pass rate reached 100% in first post-deploy review'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-fed-audit',
      title: 'Federal Agency Gains Continuous Audit Readiness',
      summary: 'GRC1 Core and governed workflows replaced a patchwork of logging and spreadsheet evidence processes, improving audit cycle times by 65%.',
      tags: ['Public Sector', 'GRC1 Core'],
      bullets: [
        'Audit cycle time reduced 65% vs prior spreadsheet-based process',
        'Evidence collection moved from quarterly scramble to continuous',
        'Replaced siloed logging and manual evidence capture',
        'Control attestations now policy-bound and timestamped'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-saas-ip',
      title: 'SaaS Company Protects IP During Remote Collaboration',
      summary: 'Secure Virtual Meetings stopped sensitive screenshare exposure and screenshots during product and engineering reviews across distributed teams.',
      tags: ['Technology', 'SVM', 'Edge DLP'],
      bullets: [
        'Screenshare and screenshot exposure eliminated in sensitive reviews',
        'Engineering and product meetings protected without blocking collaboration',
        'Roadmap and code leak events dropped to zero post-deploy',
        'Control rolled out to 4,200 distributed team members in 8 weeks'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-manufacturer-trade-secrets',
      title: 'Regulated Manufacturer Protects Trade Secrets',
      summary: 'Privileged user monitoring with ITM and MSR identified anomalous engineering access patterns before IP exfiltration could occur.',
      tags: ['Manufacturing', 'ITM', 'MSR'],
      bullets: [
        'Anomalous engineering access patterns detected pre-exfiltration',
        'Privileged user oversight extended across R&D and IP repositories',
        'Explainable detection satisfied legal and HR review requirements',
        'Trade-secret incident rate dropped to zero in first year'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-insurance-sia',
      title: 'Carrier Strengthens Identity Assurance for Claims Adjusters',
      summary: 'SIA deployed to 4,500 adjusters, adding risk-gated biometric step-up for high-value claim approvals and PII access.',
      tags: ['Insurance', 'SIA'],
      bullets: [
        '4,500 claims adjusters covered under risk-based step-up',
        'Credential sharing on high-value approvals eliminated',
        'PII access events now carry identity-assured audit trail',
        'Fraud loss reduction tied directly to identity control rollout'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-law-firm-remote',
      title: 'Am Law 100 Firm Extends Workspace Controls to Remote Associates',
      summary: 'Observer detection and clear desk enforcement added to hybrid working associates handling confidential client matters.',
      tags: ['Legal', 'SWA', 'Edge DLP'],
      bullets: [
        'Hybrid-work associates covered with observer detection',
        'Client-confidentiality controls extended off-premises',
        'Workspace policy enforcement now continuous, not training-based',
        'Client reference program added firm as a privacy-controls example'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cs-utility-ot-adjacent',
      title: 'Utility Adds Edge Enforcement to OT-Adjacent Systems',
      summary: 'GRC1 deployed on office and engineering endpoints adjacent to OT networks, preventing exposure of SCADA configuration and drawings.',
      tags: ['Energy / Utilities', 'Edge DLP', 'ITM'],
      bullets: [
        'SCADA configuration and engineering drawings protected at the edge',
        'Office-to-OT exposure path closed without touching OT network',
        'NERC CIP-adjacent control evidence captured continuously',
        'Incident response time for OT-adjacent events halved'
      ],
      moreInfoUrl: '#'
    }
  ],

  // ========================================================================
  // IDEAL BUYERS — personas partners pitch to
  // ========================================================================
  // Bullets describe priorities / pains this persona owns.
  buyers: [
    {
      id: 'ciso',
      title: 'CISO / Security Leadership',
      summary: 'Consolidate fragmented insider risk, DLP, and workspace tooling into one operating model with edge enforcement.',
      tags: ['Insider Risk', 'Data Protection'],
      bullets: [
        'Consolidating fragmented insider risk and DLP tooling',
        'Reducing SOC false-positive noise and investigation drag',
        'Providing board-ready risk posture and incident reporting',
        'Extending Zero Trust strategy to the endpoint and workspace'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'cco',
      title: 'Chief Compliance Officer',
      summary: 'Continuous audit readiness, policy-bound evidence, and governance workflows across distributed workforces.',
      tags: ['Audit Readiness'],
      bullets: [
        'Moving from audit-prep scramble to continuous readiness',
        'Proving controls are effective — not just present on paper',
        'Handling evidence across multiple regulatory regimes',
        'Defensible policy workflows and attestations'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'iam-head',
      title: 'Head of IAM / Zero Trust',
      summary: 'Answer "who is actually present" during sensitive activity with risk-gated biometric step-up.',
      tags: ['Identity Assurance'],
      bullets: [
        'Extending identity assurance beyond login-time MFA',
        'Addressing credential sharing in regulated and contractor workflows',
        'Meeting session-level assurance requirements from compliance',
        'Advancing Zero Trust maturity without user friction'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'soc',
      title: 'SOC / Security Operations',
      summary: 'Reduce false positives, improve triage quality, and add edge enforcement to existing detection pipelines.',
      tags: ['ITM', 'Case Management'],
      bullets: [
        'Reducing false-positive volume from existing detection stack',
        'Triaging insider-risk cases with explainable evidence',
        'Adding edge enforcement to detection pipelines',
        'Coordinating response across security, legal, HR, and compliance'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'vp-risk',
      title: 'VP Risk / ERM Lead',
      summary: 'Third-party, operational, and ecosystem risk visibility backed by endpoint and behavioral signal collection.',
      tags: ['Enterprise Risk'],
      bullets: [
        'Visibility into third-party and supplier endpoint behavior',
        'Shadow IT and unmanaged tool discovery',
        'Operational risk signals tied to actual user behavior',
        'Board-level ecosystem risk reporting'
      ],
      moreInfoUrl: '#'
    },
    {
      id: 'vp-people',
      title: 'VP People / HR Analytics',
      summary: 'Objective workforce intelligence, conduct risk signals, and productivity trending — privacy-aware by design.',
      tags: ['Workforce Intelligence'],
      bullets: [
        'Objective productivity and engagement trending at scale',
        'Early detection of disengagement or attrition signals',
        'Conduct risk surfacing without privacy overreach',
        'Partnering with security on insider-risk investigations'
      ],
      moreInfoUrl: '#'
    }
  ]
};
