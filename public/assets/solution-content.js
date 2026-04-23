// ========================================================================
// TRENDZACT PARTNERS — DISCOVER PAGE CONTENT
// ========================================================================
//
// GRC1 ANCHOR:
//   GRC1 is a unified platform that understands and controls data exposure
//   in real time — based on what is visible, who is present, and where it
//   occurs.
//
// Single source of truth for all cards rendered on /discover.
//
// Renders into five card types:
//   - SOLUTION       (high-level business challenges)
//   - USE CASE       (specific scenarios partners sell into)
//   - THREAT VECTOR  (the lenses GRC1 uses to evaluate exposure)
//   - CASE STUDY     (anonymized industry reference stories)
//   - IDEAL BUYER    (personas partners pitch to)
//
// Edit this file to add/update/remove cards. No other file needs changing.
//
// ---------- Unified card shape ----------
//
// All card types render in the same shape:
//   1. Primary badge (SOLUTION / USE CASE / THREAT VECTOR / CASE STUDY / IDEAL BUYER)
//   2. Title
//   3. Summary (1 short sentence / paragraph)
//   4. Secondary chips (tags)
//   5. Bullets (type-specific content)
//   6. Links row (report / infographic / video — when present)
//
// Threat Vector cards use a two-column layout for
// Key Capabilities + Business Outcomes bullets.
//
// ---------- Common fields (all card types) ----------
//
//   id              — unique slug
//   title           — heading shown on the card
//   summary         — one short sentence shown under the title
//   tags            — array of strings shown as secondary chips
//   moreInfoUrl     — "More Info →" link target. Use "#" or omit to hide.
//
// ---------- Bullets (type-specific content) ----------
//
// For SOLUTIONS, USE CASES, CASE STUDIES, IDEAL BUYERS:
//   bullets — 3-4 strings
//     · Solutions    → symptoms / pain points this solution addresses
//     · Use Cases    → concrete trigger moments
//     · Case Studies → outcomes / results
//     · Ideal Buyers → priorities / pains this persona owns
//
// For THREAT VECTORS (two-column format):
//   capabilities — "Key Capabilities" bullets
//   outcomes     — "Business Outcomes" bullets
//
// ---------- Asset fields (all optional) ----------
//
//   technicalReport  — Firebase Storage path OR https:// URL
//   infographic      — Firebase Storage path OR https:// URL
//   vimeoUrl         — Vimeo URL
//
// ========================================================================

// Sample asset paths — placeholders. Today only `insider-risk` uses them.
const SAMPLE_REPORT      = 'Trendzact logo horizontal on navy backdrop.pdf';
const SAMPLE_INFOGRAPHIC = 'Trendzact logo stacked on navy backdrop.jpg';
const SAMPLE_VIDEO       = 'https://vimeo.com/1179002076/d44cd25dc9';

// Shared anchor tail used on most card summaries
const ANCHOR_TAIL = 'This allows organizations to understand, decide, and act at the exact moment exposure occurs, rather than relying on delayed detection and response.';

window.SOLUTION_CONTENT = {

  // ========================================================================
  // SOLUTIONS — high-level business challenges
  // ========================================================================
  solutions: [
    {
      id: 'insider-risk',
      title: 'Insider Risk & Data Protection',
      summary: 'Control insider-driven exposure at the moment data is seen across screens, behavior, and environment. ' + ANCHOR_TAIL,
      tags: ['Edge DLP', 'ITM', 'SIA'],
      bullets: [
        'Sensitive data becomes exposed through screens, clipboard, and visual channels',
        'Insider risk occurs during normal user behavior, not just malicious activity',
        'No real-time control when exposure happens',
        'Detection typically occurs after the fact'
      ],
      moreInfoUrl: '#',
      technicalReport: SAMPLE_REPORT,
      infographic: SAMPLE_INFOGRAPHIC,
      vimeoUrl: SAMPLE_VIDEO
    },
    {
      id: 'workforce-intelligence',
      title: 'Workforce Intelligence & HR Analytics',
      summary: 'Understand workforce behavior and exposure risk through real-time visibility into user activity and context. ' + ANCHOR_TAIL,
      tags: ['GRC1 Core', 'BI'],
      bullets: [
        'No visibility into how users interact with sensitive data',
        'Exposure risk tied to behavior is not understood',
        'Engagement and conduct risks emerge without early signals',
        'Privacy concerns limit traditional monitoring approaches'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'identity-access',
      title: 'Identity, Access & Workspace Security',
      summary: 'Ensure the right person is present and the environment is secure when sensitive data is visible. ' + ANCHOR_TAIL,
      tags: ['SIA', 'SWA', 'SVM'],
      bullets: [
        'Identity assurance stops at login, not during exposure',
        'Credential sharing goes undetected during active sessions',
        'Workspace and observer risks are not controlled',
        'Exposure occurs without validating presence or context'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'audit-readiness',
      title: 'Audit Readiness & Regulatory Adherence',
      summary: 'Provide continuous, real-time evidence of how exposure is controlled and managed. ' + ANCHOR_TAIL,
      tags: ['GRC1 Core', 'MSR'],
      bullets: [
        'No proof of what happened at the moment of exposure',
        'Evidence is collected after incidents occur',
        'Controls cannot be validated in real time',
        'Audit processes rely on incomplete or delayed data'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'enterprise-risk',
      title: 'Enterprise Risk & Ecosystem Oversight',
      summary: 'Extend exposure control across third parties, endpoints, and distributed environments. ' + ANCHOR_TAIL,
      tags: ['ITM', 'Edge DLP'],
      bullets: [
        'Third-party exposure occurs without visibility',
        'Shadow IT introduces unmanaged exposure points',
        'Behavioral risk is not captured across ecosystems',
        'Exposure events surface only after damage occurs'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'executive-governance',
      title: 'Executive Governance & Specialized Controls',
      summary: 'Control high-risk exposure for privileged users and sensitive environments. ' + ANCHOR_TAIL,
      tags: ['MSR', 'ITM'],
      bullets: [
        'Executive and privileged exposure is not monitored in real time',
        'High-value sessions lack visibility and control',
        'Sensitive environments require stronger exposure controls',
        'No attribution of who was present during critical exposure'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    }
  ],

  // ========================================================================
  // USE CASES — specific scenarios partners sell into
  // ========================================================================
  useCases: [
    {
      id: 'clear-desk',
      title: 'Clear Desk Compliance',
      summary: 'Control exposure from physical workspace conditions in real time. ' + ANCHOR_TAIL,
      tags: ['Secure Workspaces Anywhere'],
      bullets: [
        'Sensitive data visible in uncontrolled environments',
        'Observers present during exposure moments',
        'Workspace conditions create compliance risk',
        'Exposure occurs outside secure office settings'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'data-exfil',
      title: 'Advanced Data Exfiltration Prevention',
      summary: 'Prevent data exposure across visual, behavioral, and multi-screen activity. ' + ANCHOR_TAIL,
      tags: ['Edge DLP', 'ITM'],
      bullets: [
        'Data becomes exposed during normal user actions',
        'Clipboard, screenshot, and multi-screen activity create risk',
        'Exposure occurs before any transfer or logging',
        'No real-time control during the exposure moment'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'identity-assurance',
      title: 'Continuous Identity Assurance',
      summary: 'Ensure identity is verified at the moment sensitive data is visible. ' + ANCHOR_TAIL,
      tags: ['Session Identity Assurance'],
      bullets: [
        'Identity unknown during active sessions',
        'Credential sharing during exposure events',
        'No verification tied to sensitive actions',
        'Lack of session-level identity proof'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'secure-meetings',
      title: 'Secure Virtual Meetings',
      summary: 'Control exposure during meetings by validating presence and visibility. ' + ANCHOR_TAIL,
      tags: ['Secure Virtual Meetings'],
      bullets: [
        'Sensitive data shared in meetings without control',
        'External participants viewing confidential information',
        'Screenshots and recordings create exposure risk',
        'No awareness of who is present during sharing'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'privileged-user',
      title: 'Privileged User Monitoring',
      summary: 'Control exposure for admin, engineering, and executive accounts with explainable, attributable oversight at the moment it occurs. ' + ANCHOR_TAIL,
      tags: ['ITM', 'MSR'],
      bullets: [
        'Privileged accounts operate without real-time exposure visibility',
        'No attribution of exposure events to specific privileged users',
        'Black-box analytics leave legal and HR without defensible evidence',
        'Exposure during high-privilege actions surfaces only after the fact'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'contact-center',
      title: 'Contact Center Compliance',
      summary: 'Control exposure of PII and regulated data during agent sessions across visual, identity, and screen dimensions. ' + ANCHOR_TAIL,
      tags: ['MSR', 'SIA', 'Edge DLP'],
      bullets: [
        'Sensitive customer data visible on agent screens across many workflows',
        'No identity assurance during access to PII-bearing systems',
        'Screen capture and clipboard activity create uncontrolled exposure paths',
        'Multi-regulatory footprint requires unified evidence, not siloed recordings'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'dlp-augmentation',
      title: 'DLP Augmentation',
      summary: 'Add real-time exposure control at the endpoint to existing Purview or legacy DLP investments. ' + ANCHOR_TAIL,
      tags: ['Edge DLP'],
      bullets: [
        'Classification labels exist but exposure still occurs on screen',
        'Visual and clipboard channels uncovered by file-oriented DLP',
        'Legacy DLP creates high false-positive noise, not enforcement',
        'Existing investment needs real-time action, not just after-the-fact logs'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'audit-automation',
      title: 'Audit Trail Automation',
      summary: 'Generate continuous, policy-bound evidence tied to the exact moment of exposure. ' + ANCHOR_TAIL,
      tags: ['GRC1 Core'],
      bullets: [
        'Audit evidence still collected manually across disconnected tools',
        'No record of what was visible or who was present during exposure',
        'Point-in-time snapshots do not satisfy continuous-evidence requirements',
        'Controls cannot be proven effective without attributable timelines'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'screenshare-exposure',
      title: 'Screenshare Exposure Control',
      summary: 'Control exposure when sensitive data is shared on screen during meetings.',
      tags: ['SVM', 'Edge DLP'],
      bullets: [
        'Sensitive content visible during screenshare sessions',
        'External participants present in high-risk meetings',
        'Screenshot/recording risk during sharing',
        'Need for real-time masking or restriction'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'observer-detection',
      title: 'Unauthorized Observer Detection',
      summary: 'Detect and respond when unauthorized individuals can view sensitive data.',
      tags: ['SWA'],
      bullets: [
        'Additional people present near the workstation',
        'Work conducted in shared or public spaces',
        'Compliance requirement for observer controls',
        'Lack of visibility into physical presence'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'clipboard-screenshot',
      title: 'Clipboard & Screenshot Control',
      summary: 'Prevent exposure via clipboard, screenshots, and user-initiated capture actions.',
      tags: ['Edge DLP'],
      bullets: [
        'Copy/paste of sensitive data to unmanaged apps',
        'Frequent screenshot or recording behavior',
        'Invisible channels not covered by legacy DLP',
        'Need for real-time blocking or masking'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'multi-display-exfil',
      title: 'Multi-Display Exfiltration',
      summary: 'Detect exposure across multiple monitors and correlated on-screen activity.',
      tags: ['MSR', 'Edge DLP'],
      bullets: [
        'Sensitive data on one screen, transfer on another',
        'Secondary monitors used to bypass controls',
        'Lack of synchronized visibility across displays',
        'Need for cross-display correlation and control'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'shadow-capture',
      title: 'External Device / Shadow Capture',
      summary: 'Reduce exposure from external devices (phones/cameras) capturing on-screen data.',
      tags: ['SWA', 'SVM'],
      bullets: [
        'Phone cameras capturing screens or documents',
        'Unmanaged devices in proximity to sensitive data',
        'No control over off-device capture methods',
        'Need for detection and deterrence'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'exec-session',
      title: 'Executive Session Protection',
      summary: 'Protect high-sensitivity sessions (board, M&A, legal) with presence and visibility controls.',
      tags: ['SVM', 'SIA'],
      bullets: [
        'High-value discussions with sensitive content',
        'Mixed internal/external participant lists',
        'Need for identity assurance during sharing',
        'Requirement for attributable evidence'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    }
  ],

  // ========================================================================
  // THREAT VECTORS — the lenses GRC1 uses to evaluate exposure
  // ========================================================================
  // Each vector is one dimension of the exposure-control model. Cards use
  // the two-column layout (Key Capabilities + Business Outcomes).
  vectors: [
    {
      id: 'grc1-core',
      title: 'Visibility (What is visible)',
      summary: 'Understand what sensitive data is visible at any moment. ' + ANCHOR_TAIL,
      tags: [],
      moreInfoUrl: '#grc1-core',
      capabilities: [
        'Detect on-screen data visibility',
        'Identify sensitive content exposure',
        'Track screen and display context',
        'Capture exposure events in real time'
      ],
      outcomes: [
        'Know when and where data is exposed',
        'Reduce blind spots in visibility',
        'Improve exposure awareness across endpoints'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'sia',
      title: 'Presence (Who is present)',
      summary: 'Understand who is present when data is exposed. ' + ANCHOR_TAIL,
      tags: [],
      moreInfoUrl: '#sia',
      capabilities: [
        'Verify user identity during sessions',
        'Detect identity changes or absence',
        'Track presence confidence over time',
        'Link identity to exposure events'
      ],
      outcomes: [
        'Confirm identity during exposure',
        'Prevent unauthorized presence',
        'Provide auditable identity assurance'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'swa',
      title: 'Environment (Where exposure occurs)',
      summary: 'Understand the environment where exposure occurs. ' + ANCHOR_TAIL,
      tags: [],
      moreInfoUrl: '#swa',
      capabilities: [
        'Detect observers and workspace conditions',
        'Identify uncontrolled environments',
        'Monitor physical exposure risks',
        'Evaluate environmental context'
      ],
      outcomes: [
        'Reduce exposure from physical conditions',
        'Enforce workspace compliance',
        'Improve environmental risk control'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'itm',
      title: 'Behavior (How exposure happens)',
      summary: 'Understand how user behavior creates exposure risk. ' + ANCHOR_TAIL,
      tags: [],
      moreInfoUrl: '#itm',
      capabilities: [
        'Track user actions and interactions',
        'Detect risky behavioral patterns',
        'Link behavior to exposure events',
        'Evaluate intent and context'
      ],
      outcomes: [
        'Identify risky behavior early',
        'Reduce insider-driven exposure',
        'Improve behavioral risk understanding'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'edge-dlp',
      title: 'Control (Act in real time)',
      summary: 'Act immediately to control exposure when it occurs. ' + ANCHOR_TAIL,
      tags: [],
      moreInfoUrl: '#edge-dlp',
      capabilities: [
        'Apply masking and blocking controls',
        'Trigger real-time interventions',
        'Enforce policy at the endpoint',
        'Automate response actions'
      ],
      outcomes: [
        'Stop exposure in real time',
        'Reduce reliance on delayed detection',
        'Prevent data loss before it happens'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'vector-context',
      title: 'Context (Why exposure matters)',
      summary: 'Evaluate why an exposure matters by incorporating data sensitivity, user role, and situational risk at the moment data is visible.',
      tags: [],
      moreInfoUrl: '#vector-context',
      capabilities: [
        'Sensitivity/label awareness (e.g., AIP/MIP)',
        'Role- and policy-based risk context',
        'Time/session-aware conditions',
        'Contextual risk scoring'
      ],
      outcomes: [
        'Prioritize high-impact exposures',
        'Reduce noise from low-risk events',
        'Align controls to real business risk'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'vector-continuity',
      title: 'Continuity (Exposure over time)',
      summary: 'Track how exposure evolves across a session to detect persistence, escalation, and patterns — not just single events.',
      tags: [],
      moreInfoUrl: '#vector-continuity',
      capabilities: [
        'Session timelines and sequence tracking',
        'Persistence and repetition detection',
        'Cross-event correlation within session',
        'Countdown/suppression logic'
      ],
      outcomes: [
        'Catch slow or repeated exposure patterns',
        'Improve detection accuracy over time',
        'Reduce alert fatigue via session context'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'vector-evidence',
      title: 'Evidence (What can be proven)',
      summary: 'Generate audit-ready evidence tied to the exact moment of exposure, including visibility, presence, and actions taken.',
      tags: [],
      moreInfoUrl: '#vector-evidence',
      capabilities: [
        'Event-tied evidence capture (policy-gated)',
        'Attributable timelines and artifacts',
        'Privacy-aware minimization and redaction',
        'Chain-of-custody logging'
      ],
      outcomes: [
        'Defensible audit and investigation records',
        'Faster, higher-confidence case resolution',
        'Reduced data retention risk'
      ],
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    }
  ],

  // ========================================================================
  // CASE STUDIES — anonymized industry reference stories
  // ========================================================================
  caseStudies: [
    {
      id: 'cs-global-bank',
      title: 'Global Bank Reduces Exposure Risk',
      summary: 'A global bank reduced exposure by controlling data visibility and behavior in real time. ' + ANCHOR_TAIL,
      tags: ['Financial Services'],
      bullets: [
        'Exposure risk reduced significantly across endpoints',
        'Real-time controls replaced delayed detection',
        'Improved audit outcomes with clear evidence',
        'Consolidated multiple security tools'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    }
  ],

  // ========================================================================
  // IDEAL BUYERS — personas partners pitch to
  // ========================================================================
  buyers: [
    {
      id: 'ciso',
      title: 'CISO / Security Leadership',
      summary: 'Shift from system protection to real-time exposure control. ' + ANCHOR_TAIL,
      tags: ['Insider Risk', 'Data Protection'],
      bullets: [
        'Need to control risk at the moment it occurs',
        'Reduce reliance on delayed detection',
        'Improve visibility into real exposure',
        'Align security with modern work environments'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    },
    {
      id: 'cco',
      title: 'Chief Compliance Officer',
      summary: 'Prove exposure is controlled continuously — not just audited later. ' + ANCHOR_TAIL,
      tags: ['Audit Readiness'],
      bullets: [
        'Require real-time evidence of control',
        'Eliminate manual audit preparation',
        'Ensure compliance across environments',
        'Provide defensible audit trails'
      ],
      moreInfoUrl: '#',
      technicalReport: '#',
      infographic: '#',
      vimeoUrl: '#'
    }
  ]
};
