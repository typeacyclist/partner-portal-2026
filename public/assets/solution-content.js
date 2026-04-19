// ========================================================================
// TRENDZACT PARTNERS — SOLUTION BUILDER CONTENT
// ========================================================================
//
// Edit this file to add/update/remove cards on the Solution Builder page.
// No other file needs changing — the render script reads from here.
//
// ---------- Asset fields (all optional per card) ----------
//
//   moreInfoUrl      — link text "More Info →" at bottom of card.
//                      Can be a page URL or "#" if none. Omit to hide.
//
//   technicalReport  — Firebase Storage path OR a direct https:// URL.
//                      Rendered as a document icon. Omit to hide icon.
//                      Example (Storage): "reports/insider-risk-brief.pdf"
//                      Example (URL):     "https://example.com/report.pdf"
//
//   infographic      — Same format as technicalReport. Image icon.
//                      Omit to hide icon.
//
//   vimeoUrl         — Full Vimeo URL. Play icon. Omit to hide icon.
//                      Example: "https://vimeo.com/123456789"
//
// ---------- Tips for editors ----------
//
//   - As real assets become available, add them to the right card by
//     pasting the Firebase Storage path (or URL) into technicalReport /
//     infographic / vimeoUrl.
//   - Prefer to OMIT a field rather than leave an empty string. An empty
//     string will render a broken icon.
//   - The SAMPLE_* constants below are kept so you can drop a placeholder
//     back onto any card temporarily by writing e.g. `technicalReport: SAMPLE_REPORT`.
//   - Missing commas between items are the #1 cause of breakage — when in
//     doubt, copy an existing block and edit it rather than writing from scratch.
// ========================================================================

// Sample asset paths — available as placeholders if you need one temporarily.
// Today only the `insider-risk` card uses them.
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
  products: [
    {
      id: 'grc1-core',
      title: 'GRC1 Core',
      description: 'Required foundation: policies, telemetry, detection, scoring, workflows, playbooks, evidence, and reporting.',
      tags: [],
      moreInfoUrl: '/products.html#core'
    },
    {
      id: 'swa',
      title: 'Secure Workspaces Anywhere',
      description: 'Workspace object detection, observer detection, unattended sessions, and clear desk enforcement.',
      tags: [],
      moreInfoUrl: '/products.html#swa'
    },
    {
      id: 'sia',
      title: 'Session Identity Assurance',
      description: 'Facial biometric authentication as a risk-based MFA factor, continuous confidence, liveness, and identity drift.',
      tags: [],
      moreInfoUrl: '/products.html#sia'
    },
    {
      id: 'msr',
      title: 'Multi-Screen Recording',
      description: 'Synchronized evidence across single- and multi-display workstations with policy-bound capture.',
      tags: [],
      moreInfoUrl: '/products.html#msr'
    },
    {
      id: 'edge-dlp',
      title: 'Edge DLP',
      description: 'Visual, behavioral, and label-aware exposure prevention at the endpoint with masking and interruption.',
      tags: [],
      moreInfoUrl: '/products.html#edge-dlp'
    },
    {
      id: 'itm',
      title: 'Insider Threat Management',
      description: 'Deterministic detection, explainable signatures, risk scoring, case workflows, and governed response playbooks.',
      tags: [],
      moreInfoUrl: '/products.html#itm'
    },
    {
      id: 'svm',
      title: 'Secure Virtual Meetings',
      description: 'Meeting-aware masking, dynamic watermarking, and identity-aware controls for sensitive collaboration.',
      tags: [],
      moreInfoUrl: '/products.html#svm'
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