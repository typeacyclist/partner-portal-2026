// ========================================================================
// TRENDZACT PARTNERS — DISCOVER PAGE CONTENT
// ========================================================================
// Single source of truth for all cards rendered on /discover.
// Card types: Solutions, Use Cases, Exposure Vectors, Case Studies, Ideal Buyers.
// Optional icon fields supported by solution-render.js: iconImage, cardIcon, iconUrl, iconAlt.
// ========================================================================

const SAMPLE_REPORT      = 'Trendzact logo horizontal on navy backdrop.pdf';
const SAMPLE_INFOGRAPHIC = 'Trendzact logo stacked on navy backdrop.jpg';
const SAMPLE_VIDEO       = 'https://vimeo.com/1179002076/d44cd25dc9';

const ANCHOR_TAIL = 'This allows organizations to understand, decide, and act at the exact moment exposure occurs, rather than relying on delayed detection and response.';
const ICON_BASE = 'gs://trendzact-partners-001.firebasestorage.app/icons/';

window.SOLUTION_CONTENT = {
  solutions: [
    {
      id: 'workspace-exposure',
      title: 'Workspace Exposure',
      iconImage: ICON_BASE + 'workspace-exposure-no-text-tight.png',
      iconAlt: 'Workspace exposure icon',
      summary: 'Protect sensitive data where it is physically visible in the workspace—across phones, paper, unattended screens, observers, and uncontrolled environments. ' + ANCHOR_TAIL,
      tags: ['primary:environment', 'SWA', 'SIA', 'Workspace', 'Observer Risk'],
      bullets: [
        'Phone, camera, or recording device visible near sensitive work',
        'Paper documents, handwritten notes, or exposed materials near the user',
        'Sensitive screen visible while workstation is unattended',
        'Unauthorized observer, shoulder-surfing, or unknown person present'
      ],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'meeting-screenshare-exposure',
      title: 'Virtual Meeting & Screenshare Exposure',
      iconImage: ICON_BASE + 'virtual-meeting-screenshare-exposure-no-text-tight.png',
      iconAlt: 'Virtual meeting and screenshare exposure icon',
      summary: 'Control sensitive data exposure during meetings and screen sharing, including external participants, recordings, and MIP/AIP-labeled content. ' + ANCHOR_TAIL,
      tags: ['primary:visibility', 'SVM', 'Teams', 'Purview', 'Screenshare'],
      bullets: [
        'Sensitive data exposed during screen sharing',
        'MIP/AIP or Microsoft Purview-labeled content visible in meeting context',
        'External or unauthorized participant present while restricted data is visible',
        'Meeting recording or evidence governance risk'
      ],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'imposters-identity-spoofing',
      title: 'Imposters & Identity Spoofing',
      iconImage: ICON_BASE + 'imposters-identity-spoofing-no-text-tight.png',
      iconAlt: 'Imposters and identity spoofing icon',
      summary: 'Verify that the right person is present during sensitive work—not just at login, but throughout the session. ' + ANCHOR_TAIL,
      tags: ['primary:presence', 'SIA', 'Identity', 'Presence', 'Liveness'],
      bullets: [
        'Logged-in user does not match the person present',
        'Authorized user leaves and another person continues the session',
        'Credential sharing, proxy work, or session handoff suspected',
        'Step-up verification required due to identity uncertainty'
      ],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'on-screen-data-exposure',
      title: 'On-Screen Sensitive Data Exposure',
      iconImage: ICON_BASE + 'on-screen-sensitive-data-exposure-no-text-tight.png',
      iconAlt: 'On-screen sensitive data exposure icon',
      summary: 'Detect and control sensitive data the instant it becomes visible on screen—before visual exposure becomes an incident. ' + ANCHOR_TAIL,
      tags: ['primary:visibility', 'eDLP', 'Purview', 'Screen Exposure'],
      bullets: [
        'Sensitive information appears on screen',
        'Labeled or restricted data becomes visible',
        'Sensitive content appears on secondary displays',
        'Unauthorized screenshot, screen capture, or recording condition detected'
      ],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'insider-exfiltration-behavior',
      title: 'Insider Risk & Exfiltration Behavior',
      iconImage: ICON_BASE + 'insider-risk-exfiltration-behavior-no-text-tight.png',
      iconAlt: 'Insider risk and exfiltration behavior icon',
      summary: 'Detect negligent, malicious, or collusive behavior before it becomes data loss, using exposure-aware behavioral context. ' + ANCHOR_TAIL,
      tags: ['primary:behavior', 'ITM', 'EUBA', 'Exfiltration', 'SOC'],
      bullets: [
        'User accesses sensitive data outside normal pattern',
        'Sensitive files or screens staged before transfer',
        'High-risk application sequence observed',
        'Clipboard, screenshot, upload, or external app behavior indicates risk'
      ],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'evidence-audit-reconstruction',
      title: 'Evidence, Audit & Reconstruction',
      iconImage: ICON_BASE + 'evidence-audit-reconstruction-no-text-tight.png',
      iconAlt: 'Evidence audit and reconstruction icon',
      summary: 'Capture defensible evidence when exposure occurs so teams can prove what happened, who was present, and what action was taken. ' + ANCHOR_TAIL,
      tags: ['primary:evidence', 'MSR', 'Audit', 'Compliance', 'Reconstruction'],
      bullets: [
        'Exposure event requires defensible evidence',
        'Screen activity must be reconstructed across one or more displays',
        'Alert-triggered event requires linked screen evidence',
        'Compliance review requires retained proof and attributable timelines'
      ],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    }
  ],

  useCases: [
    {
      id: 'clear-desk-workspace-compliance',
      title: 'Clear Desk & Workspace Compliance',
      iconImage: ICON_BASE + 'clear-desk-workspace-compliance.png',
      iconAlt: 'Clear desk and workspace compliance icon',
      summary: 'Control physical exposure when sensitive data is visible in real-world workspaces. ' + ANCHOR_TAIL,
      tags: ['solution:workspace-exposure', 'SWA', 'Workspace', 'Clear Desk', 'Physical Exposure'],
      bullets: ['Sensitive screens left visible while users step away', 'Paper, notes, or documents exposed near sensitive work', 'Workspace conditions violate clean-screen or clear-desk policy', 'Exposure occurs in home, office, shared, or public environments'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'phone-camera-shadow-capture',
      title: 'Phone Camera / Shadow Capture',
      iconImage: ICON_BASE + 'phone-camera-shadow-capture.png',
      iconAlt: 'Phone camera and shadow capture icon',
      summary: 'Detect and reduce exposure from phones, cameras, and unmanaged devices capturing sensitive screens or documents. ' + ANCHOR_TAIL,
      tags: ['solution:workspace-exposure', 'SWA', 'Phone Camera', 'Shadow Capture', 'Physical Exposure'],
      bullets: ['Phone cameras pointed at sensitive screens', 'Unmanaged devices present near confidential work', 'Screens or documents captured outside monitored systems', 'No traditional DLP control over off-device capture'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'screenshare-exposure-control',
      title: 'Screenshare Exposure Control',
      iconImage: ICON_BASE + 'screenshare-exposure-control.png',
      iconAlt: 'Screenshare exposure control icon',
      summary: 'Control sensitive data exposure during screen sharing before meetings become data leakage events. ' + ANCHOR_TAIL,
      tags: ['solution:meeting-screenshare-exposure', 'SVM', 'Teams', 'Screenshare', 'Meeting Exposure'],
      bullets: ['Sensitive content appears during screen sharing', 'Screen sharing continues after restricted data becomes visible', 'Screenshots or recordings create uncontrolled exposure', 'Real-time masking, restriction, or alerting is required'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'external-participant-meeting-risk',
      title: 'External Participant Meeting Risk',
      iconImage: ICON_BASE + 'external-participant-meeting-risk.png',
      iconAlt: 'External participant meeting risk icon',
      summary: 'Protect sensitive information when external participants, guests, or unknown attendees are present during meetings. ' + ANCHOR_TAIL,
      tags: ['solution:meeting-screenshare-exposure', 'SVM', 'Teams', 'External Participants', 'Purview'],
      bullets: ['External participants view confidential information', 'Unknown attendees are present while restricted content is shared', 'MIP/AIP or Purview-labeled data appears in meeting context', 'Meeting recordings create evidence and retention risk'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'continuous-identity-assurance',
      title: 'Continuous Identity Assurance',
      iconImage: ICON_BASE + 'continuous-identity-assurance.png',
      iconAlt: 'Continuous identity assurance icon',
      summary: 'Verify that the authorized person is still present when sensitive data is visible. ' + ANCHOR_TAIL,
      tags: ['solution:imposters-identity-spoofing', 'SIA', 'Identity', 'Presence', 'Liveness'],
      bullets: ['Identity assurance stops at login', 'The authorized user leaves while the session remains active', 'Sensitive activity occurs without confirmed user presence', 'Step-up verification is required when identity confidence drops'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'proxy-work-credential-sharing',
      title: 'Proxy Work & Credential Sharing',
      iconImage: ICON_BASE + 'continuous-identity-assurance.png',
      iconAlt: 'Proxy work and credential sharing icon',
      summary: 'Detect when valid credentials are used by the wrong person during sensitive work. ' + ANCHOR_TAIL,
      tags: ['solution:imposters-identity-spoofing', 'SIA', 'Credential Sharing', 'Proxy Work', 'Identity Risk'],
      bullets: ['Logged-in user does not match the person present', 'Credential sharing or session handoff is suspected', 'Proxy workers operate under another user’s identity', 'Imposter presence is detected during sensitive activity'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'dlp-augmentation',
      title: 'DLP Augmentation',
      iconImage: ICON_BASE + 'dlp-augmentation.png',
      iconAlt: 'DLP augmentation icon',
      summary: 'Extend existing DLP and Microsoft Purview investments into the moment sensitive data becomes visible on screen. ' + ANCHOR_TAIL,
      tags: ['solution:on-screen-data-exposure', 'eDLP', 'Purview', 'MIP/AIP', 'Screen Exposure'],
      bullets: ['Classification labels exist but exposure still occurs on screen', 'Visual, clipboard, screenshot, and screen-capture channels remain exposed', 'Sensitive content appears on secondary displays or unmanaged contexts', 'Existing controls need real-time action, not only after-the-fact logs'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'audit-trail-exposure-reconstruction',
      title: 'Audit Trail & Exposure Reconstruction',
      iconImage: ICON_BASE + 'audit-trail-exposure-reconstruction.png',
      iconAlt: 'Audit trail and exposure reconstruction icon',
      summary: 'Capture defensible evidence tied to the exact moment sensitive data exposure occurs. ' + ANCHOR_TAIL,
      tags: ['solution:evidence-audit-reconstruction', 'MSR', 'Audit', 'Evidence', 'Reconstruction'],
      bullets: ['No proof of what was visible during an exposure event', 'No clear record of who was present or what action was taken', 'Screen activity must be reconstructed across one or more displays', 'Compliance review requires retained, attributable evidence'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    }
  ],

  vectors: [
    {
      id: 'grc1-core', title: 'Visibility (What is visible)',
      iconImage: ICON_BASE + 'visibility-what-is-visible.png', iconAlt: 'Visibility icon',
      summary: 'Understand what sensitive data is visible at any moment. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#grc1-core',
      capabilities: ['Detect on-screen data visibility', 'Identify sensitive content exposure', 'Track screen and display context', 'Capture exposure events in real time'],
      outcomes: ['Know when and where data is exposed', 'Reduce blind spots in visibility', 'Improve exposure awareness across endpoints'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'sia', title: 'Presence (Who is present)',
      iconImage: ICON_BASE + 'presence-who-is-present.png', iconAlt: 'Presence icon',
      summary: 'Understand who is present when data is exposed. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#sia',
      capabilities: ['Verify user identity during sessions', 'Detect identity changes or absence', 'Track presence confidence over time', 'Link identity to exposure events'],
      outcomes: ['Confirm identity during exposure', 'Prevent unauthorized presence', 'Provide auditable identity assurance'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'swa', title: 'Environment (Where exposure occurs)',
      iconImage: ICON_BASE + 'environment-where-exposure-occurs.png', iconAlt: 'Environment icon',
      summary: 'Understand the environment where exposure occurs. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#swa',
      capabilities: ['Detect observers and workspace conditions', 'Identify uncontrolled environments', 'Monitor physical exposure risks', 'Evaluate environmental context'],
      outcomes: ['Reduce exposure from physical conditions', 'Enforce workspace compliance', 'Improve environmental risk control'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'itm', title: 'Behavior (How exposure happens)',
      iconImage: ICON_BASE + 'behavior-how-exposure-happens.png', iconAlt: 'Behavior icon',
      summary: 'Understand how user behavior creates exposure risk. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#itm',
      capabilities: ['Track user actions and interactions', 'Detect risky behavioral patterns', 'Link behavior to exposure events', 'Evaluate intent and context'],
      outcomes: ['Identify risky behavior early', 'Reduce insider-driven exposure', 'Improve behavioral risk understanding'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'edge-dlp', title: 'Control (Act in real time)',
      iconImage: ICON_BASE + 'control-act-in-real-time.png', iconAlt: 'Control icon',
      summary: 'Decide and act in real time to control exposure as it occurs—based on visibility, presence, and context. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#edge-dlp',
      capabilities: ['Evaluate exposure using combined visibility, presence, and context signals', 'Apply masking and blocking controls', 'Trigger real-time interventions', 'Enforce policy at the endpoint', 'Automate response actions'],
      outcomes: ['Stop exposure in real time', 'Reduce reliance on delayed detection', 'Prevent data loss before it happens'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'vector-context', title: 'Context (Why exposure matters)',
      iconImage: ICON_BASE + 'context-why-exposure-matters.png', iconAlt: 'Context icon',
      summary: 'Evaluate why an exposure matters by incorporating data sensitivity, user role, and situational risk at the moment data is visible. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#vector-context',
      capabilities: ['Sensitivity label integration (AIP / MIP / DG)', 'Role- and policy-based risk context', 'Time/session-aware conditions', 'Contextual risk scoring'],
      outcomes: ['Prioritize high-impact exposures', 'Reduce noise from low-risk events', 'Align controls to real business risk'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'vector-continuity', title: 'Continuity (Exposure over time)',
      iconImage: ICON_BASE + 'continuity-exposure-over-time.png', iconAlt: 'Continuity icon',
      summary: 'Track how exposure evolves across a session to detect persistence, escalation, and patterns—not just single events. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#vector-continuity',
      capabilities: ['Session timelines and sequence tracking', 'Persistence and repetition detection', 'Cross-event correlation within session', 'Countdown/suppression logic'],
      outcomes: ['Catch slow or repeated exposure patterns', 'Improve detection accuracy over time', 'Reduce alert fatigue via session context'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'vector-evidence', title: 'Evidence (What can be proven)',
      iconImage: ICON_BASE + 'evidence-what-can-be-proven.png', iconAlt: 'Evidence icon',
      summary: 'Generate audit-ready evidence tied to the exact moment of exposure, including visibility, presence, and actions taken. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#vector-evidence',
      capabilities: ['Event-tied evidence capture (policy-gated)', 'Attributable timelines and artifacts', 'Privacy-aware minimization and redaction', 'Chain-of-custody logging'],
      outcomes: ['Defensible audit and investigation records', 'Faster, higher-confidence case resolution', 'Reduced data retention risk'],
      technicalReport: '#', infographic: '#', vimeoUrl: '#'
    }
  ],

  caseStudies: [
    {
      id: 'cs-global-bank', title: 'Global Bank Reduces Insider Exfiltration Risk',
      iconImage: ICON_BASE + 'global-bank.png', iconAlt: 'Global bank icon',
      summary: 'A tier-1 bank used Insider Risk & Exfiltration Behavior coverage to identify risky data handling before sensitive information left controlled environments. ' + ANCHOR_TAIL,
      tags: ['solution:insider-exfiltration-behavior', 'ITM', 'eDLP', 'MSR', 'Financial Services'],
      bullets: ['Sensitive data access and handling patterns evaluated in real time', 'Clipboard, screen, and external application behavior tied to exposure risk', 'Evidence captured before investigation ambiguity increased', 'SOC review focused on high-confidence exposure events'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-hospital-phi', title: 'Hospital System Strengthens PHI Workspace Controls',
      iconImage: ICON_BASE + 'hospital-system.png', iconAlt: 'Hospital system icon',
      summary: 'A regional health system used Workspace Exposure coverage to reduce PHI visibility risk across remote billing and coding workspaces. ' + ANCHOR_TAIL,
      tags: ['solution:workspace-exposure', 'SWA', 'SIA', 'MSR', 'Healthcare'],
      bullets: ['PHI exposure detected in remote and hybrid workspaces', 'Observer, paper, and unattended-screen risks identified during sensitive work', 'Workspace policy enforced continuously instead of relying on training alone', 'Evidence preserved for compliance and investigation review'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-bpo-regulatory', title: 'Global BPO Unifies Regulated Exposure Evidence',
      iconImage: ICON_BASE + 'global-bpo-contact-center.png', iconAlt: 'Global BPO contact center icon',
      summary: 'A global BPO used Evidence, Audit & Reconstruction coverage with identity assurance to support regulated customer-data workflows across distributed agents. ' + ANCHOR_TAIL,
      tags: ['solution:evidence-audit-reconstruction', 'MSR', 'SIA', 'eDLP', 'BPO / Contact Center'],
      bullets: ['Sensitive customer data exposure reconstructed across agent workflows', 'Identity assurance linked user presence to regulated screen activity', 'Multi-screen evidence captured for review and compliance validation', 'Fragmented recording and DLP tooling consolidated into one exposure record'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-public-sector-audit', title: 'Federal Agency Gains Continuous Audit Readiness',
      iconImage: ICON_BASE + 'public-sector-agency.png', iconAlt: 'Public sector agency icon',
      summary: 'A public-sector organization used Evidence, Audit & Reconstruction coverage to replace delayed evidence collection with exposure-linked audit records. ' + ANCHOR_TAIL,
      tags: ['solution:evidence-audit-reconstruction', 'MSR', 'CORE', 'Audit', 'Public Sector'],
      bullets: ['Audit evidence tied to the moment sensitive data became visible', 'Manual evidence collection reduced across disconnected tools', 'Control execution proved through continuous exposure records', 'Attributable timelines supported audit and incident review'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-saas-ip', title: 'SaaS Company Protects IP During Remote Collaboration',
      iconImage: ICON_BASE + 'saas-software-company.png', iconAlt: 'SaaS software company icon',
      summary: 'A SaaS company used Virtual Meeting & Screenshare Exposure coverage to reduce IP leakage during distributed product and engineering reviews. ' + ANCHOR_TAIL,
      tags: ['solution:meeting-screenshare-exposure', 'SVM', 'eDLP', 'SIA', 'Technology'],
      bullets: ['Sensitive product and engineering content detected during screen sharing', 'External participant and recording risks evaluated in meeting context', 'Screen exposure controlled without blocking normal collaboration', 'IP exposure visibility extended across distributed teams'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-manufacturing-trade-secrets', title: 'Regulated Manufacturer Protects Trade Secrets',
      iconImage: ICON_BASE + 'high-tech-manufacturer.png', iconAlt: 'High tech manufacturer icon',
      summary: 'A regulated manufacturer used Insider Risk & Exfiltration Behavior coverage to detect anomalous engineering activity before trade-secret exposure became data loss. ' + ANCHOR_TAIL,
      tags: ['solution:insider-exfiltration-behavior', 'ITM', 'MSR', 'eDLP', 'Manufacturing'],
      bullets: ['Engineering access patterns evaluated against expected behavior', 'Sensitive drawings and configuration exposure identified in session', 'Staging behavior detected before outbound transfer occurred', 'Evidence tied user behavior to exposure events for review'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-insurance-sia', title: 'Carrier Strengthens Identity Assurance for Claims Adjusters',
      iconImage: ICON_BASE + 'insurance-carrier.png', iconAlt: 'Insurance carrier icon',
      summary: 'An insurance carrier used Imposters & Identity Spoofing coverage to verify user presence during high-value claim approvals and PII access. ' + ANCHOR_TAIL,
      tags: ['solution:imposters-identity-spoofing', 'SIA', 'eDLP', 'MSR', 'Insurance'],
      bullets: ['Identity verified when sensitive claim and PII data became visible', 'Step-up verification applied when presence confidence dropped', 'Credential sharing and proxy-use risk reduced during claims workflows', 'Identity evidence preserved for fraud and audit review'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-law-firm-workspace', title: 'Am Law 100 Firm Extends Workspace Controls to Remote Associates',
      iconImage: ICON_BASE + 'court-system.png', iconAlt: 'Legal and court system icon',
      summary: 'A global law firm used Workspace Exposure coverage to protect confidential client matters across hybrid associate workspaces. ' + ANCHOR_TAIL,
      tags: ['solution:workspace-exposure', 'SWA', 'SIA', 'MSR', 'Legal'],
      bullets: ['Client-confidential information protected in remote workspaces', 'Observer-driven exposure and visible-paper risks detected', 'Clear-desk and clean-screen policies enforced continuously', 'Workspace evidence supported client-confidentiality compliance'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-utility-ot-adjacent', title: 'Utility Protects OT-Adjacent Sensitive Screens',
      iconImage: ICON_BASE + 'public-utilities.png', iconAlt: 'Public utilities icon',
      summary: 'A utility used On-Screen Sensitive Data Exposure coverage to reduce exposure of SCADA configuration, drawings, and engineering data on office and engineering endpoints. ' + ANCHOR_TAIL,
      tags: ['solution:on-screen-data-exposure', 'eDLP', 'ITM', 'MSR', 'Energy / Utilities'],
      bullets: ['SCADA configuration and engineering drawings detected when visible', 'Sensitive screens controlled on OT-adjacent endpoints', 'Behavioral risk evaluated without disrupting operations', 'Evidence captured for regulatory and incident review'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    }
  ],

  buyers: [
    {
      id: 'ciso',
      title: 'CISO / Security Leadership',
      summary: 'Shift from system protection to real-time exposure control. ' + ANCHOR_TAIL,
      tags: ['Insider Risk', 'Data Protection'],
      bullets: ['Need to control risk at the moment it occurs', 'Reduce reliance on delayed detection', 'Improve visibility into real exposure', 'Align security with modern work environments'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cco',
      title: 'Chief Compliance Officer',
      summary: 'Prove exposure is controlled continuously—not just audited later. ' + ANCHOR_TAIL,
      tags: ['Audit Readiness'],
      bullets: ['Require real-time evidence of control', 'Eliminate manual audit preparation', 'Ensure compliance across environments', 'Provide defensible audit trails'],
      moreInfoUrl: '#', technicalReport: '#', infographic: '#', vimeoUrl: '#'
    }
  ]
};
