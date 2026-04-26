// ========================================================================
// TRENDZACT PARTNERS — DISCOVER PAGE CONTENT
// ========================================================================
// Single source of truth for all cards rendered on /discover.
// Card types: Platform, Solutions, Use Cases, Exposure Vectors, Case Studies, Ideal Buyers.
// Optional icon fields supported by solution-render.js: iconImage, cardIcon, iconUrl, iconAlt.
// ========================================================================

const ANCHOR_TAIL = 'This allows organizations to understand, decide, and act at the exact moment exposure occurs, rather than relying on delayed detection and response.';
const ICON_BASE = 'gs://trendzact-partners-001.firebasestorage.app/icons/';
const REPORT_BASE = 'gs://trendzact-partners-001.firebasestorage.app/report-explainers/';

window.SOLUTION_CONTENT = {
  solutions: [
    {
      id: 'sdec-platform',
      title: 'Sensitive Data Exposure Control Platform',
      iconImage: ICON_BASE + 'Trendzact Favicon (green).png',
      iconAlt: 'Trendzact platform icon',
      summary: 'Trendzact gives organizations a real-time control layer for sensitive data exposure across the human edge—after access is granted and data becomes visible. ' + ANCHOR_TAIL,
      tags: ['Platform', 'SDEC', 'Human Edge', 'Real-Time Control', 'Governable Evidence'],
      bullets: [
        'Controls exposure after sensitive data becomes visible on screens, in workspaces, and during collaboration',
        'Combines visible-data, identity, workspace, meeting, behavior, application, timing, and policy context',
        'Uses the operating model Understand → Decide → Act in real time',
        'Turns silent exposure uncertainty into proof, context, and governable action'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'secure-workspace',
      title: 'Secure Workspace',
      iconImage: ICON_BASE + 'workspace-exposure-no-text-tight.png',
      iconAlt: 'Secure Workspace icon',
      summary: 'Protect sensitive data when it is visible in a physical, remote, shared, or uncontrolled workspace. ' + ANCHOR_TAIL,
      tags: ['SW', 'Workspace', 'Webcam Required', 'Ultrawide Recommended', 'Observer Risk'],
      bullets: [
        'Detect screens, documents, mobile phones, observers, and unattended workstations near sensitive data',
        'Reduce exposure in office, home, call center, public, travel, hotel, or shared-workspace environments',
        'Strengthen controls for mission-critical data with the Trendzact Ultrawide Webcam and 180-degree field of view',
        'Apply warning, masking, restriction, escalation, or evidence preservation when workspace risk appears'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'identity-recognition-assurance',
      title: 'Identity Recognition Assurance',
      iconImage: ICON_BASE + 'imposters-identity-spoofing-no-text-tight.png',
      iconAlt: 'Identity Recognition Assurance icon',
      summary: 'Confirm that the right person is present while sensitive information is visible, not only that someone authenticated earlier. ' + ANCHOR_TAIL,
      tags: ['IRA', 'Identity', 'Presence', 'Webcam Required', 'Active Session'],
      bullets: [
        'Verify user presence and identity confidence during sensitive work',
        'Detect when an authorized user leaves and another person continues the active session',
        'Identify unknown observers, multiple people, proxy work, or credential-sharing risk',
        'Trigger re-verification, lockout, escalation, or evidence preservation when identity confidence drops'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'secure-virtual-meeting',
      title: 'Secure Virtual Meeting',
      iconImage: ICON_BASE + 'virtual-meeting-screenshare-exposure-no-text-tight.png',
      iconAlt: 'Secure Virtual Meeting icon',
      summary: 'Control sensitive data exposure during virtual meetings, screen sharing, recordings, participant changes, and external collaboration. ' + ANCHOR_TAIL,
      tags: ['SVM', 'Screenshare', 'External Participants', 'Recording Risk', 'Collaboration'],
      bullets: [
        'Detect sensitive information exposed during screen sharing or collaboration',
        'Evaluate whether the meeting audience is appropriate for the visible data',
        'Identify external participants, unauthorized attendees, participant changes, or recording conditions',
        'Warn, mask, restrict, stop sharing, escalate, or preserve evidence based on meeting context'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'insider-threat-management',
      title: 'Insider Threat Management',
      iconImage: ICON_BASE + 'insider-risk-exfiltration-behavior-no-text-tight.png',
      iconAlt: 'Insider Threat Management icon',
      summary: 'Detect risky, privileged, negligent, stealth, or malicious exposure behaviors that may indicate misuse, policy evasion, or escalating risk. ' + ANCHOR_TAIL,
      tags: ['ITM', 'Insider Risk', 'Behavior', 'Privileged Users', 'SOC'],
      bullets: [
        'Detect risky behavior around screenshots, screen recordings, copy/paste, staging, or shadow tools',
        'Evaluate repeated or escalating exposure patterns across sessions and workflows',
        'Identify suspicious activity by privileged users or users in high-risk employment periods',
        'Create evidence-backed signals for security, compliance, HR, legal, and SOC review'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'exposure-data-loss-prevention',
      title: 'Exposure Data Loss Prevention',
      iconImage: ICON_BASE + 'on-screen-sensitive-data-exposure-no-text-tight.png',
      iconAlt: 'Exposure Data Loss Prevention icon',
      summary: 'Extend DLP beyond files and transfers to include visible data, user behavior, application activity, location, timing, workflow context, and governable evidence. ' + ANCHOR_TAIL,
      tags: ['EDLP', 'Visible Data', 'DLP Extension', 'Application Context', 'Evidence'],
      bullets: [
        'Detect sensitive data exposure even when no file is transferred',
        'Evaluate visible content, clipboard movement, application usage, workflow, time, location, and policy context',
        'Use workstation and laptop signals to provide additional context and evidence for control actions',
        'Convert exposure signals into real-time controls and audit-ready proof'
      ],
      infographic: '#', vimeoUrl: '#'
    }
  ],

  useCases: [
    {
      id: 'uc-secure-workspace',
      title: 'Secure Workspace: Protect Mission-Critical Workspaces',
      iconImage: ICON_BASE + 'clear-desk-workspace-compliance.png',
      iconAlt: 'Secure Workspace use case icon',
      summary: 'Protect board materials, M&A work, legal strategy, PHI, financial records, source code, and other mission-critical data when it is visible in the user workspace. ' + ANCHOR_TAIL,
      tags: ['solution:secure-workspace', 'SW', 'Workspace', 'Ultrawide Webcam', 'Mission Critical'],
      bullets: [
        'Sensitive screens are visible in home, office, call center, public, or travel workspaces',
        'Unknown observers, mobile phones, paper documents, or secondary displays create exposure risk',
        'Trendzact Ultrawide Webcam improves coverage where top corporate secrets require broader workspace context',
        'Policy actions can warn, mask, restrict, escalate, or preserve evidence during exposure'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'uc-identity-recognition-assurance',
      title: 'Identity Recognition Assurance: Stop Active-Session Misuse',
      iconImage: ICON_BASE + 'continuous-identity-assurance.png',
      iconAlt: 'Identity Recognition Assurance use case icon',
      summary: 'Confirm the authorized user is still present and in control when sensitive information is visible. ' + ANCHOR_TAIL,
      tags: ['solution:identity-recognition-assurance', 'IRA', 'Identity', 'Presence', 'Active Session'],
      bullets: [
        'A user authenticates successfully, then leaves the workstation while data remains visible',
        'Another person begins interacting with the active session or appears during sensitive work',
        'Presence confidence drops during privileged, regulated, or confidential workflows',
        'The platform can require re-verification, lock the session, escalate, or preserve evidence'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'uc-secure-virtual-meeting',
      title: 'Secure Virtual Meeting: Control Screen-Share Exposure',
      iconImage: ICON_BASE + 'screenshare-exposure-control.png',
      iconAlt: 'Secure Virtual Meeting use case icon',
      summary: 'Prevent authorized meetings from becoming unauthorized exposure events when sensitive data appears during screen share or collaboration. ' + ANCHOR_TAIL,
      tags: ['solution:secure-virtual-meeting', 'SVM', 'Screenshare', 'External Participants', 'Meeting Risk'],
      bullets: [
        'A user shares the wrong window or exposes restricted data during a vendor or customer meeting',
        'External participants or unknown attendees are present while confidential information is visible',
        'Meeting recording or screenshot activity creates governed evidence risk',
        'Trendzact can warn, mask, restrict exposure, stop sharing, escalate, or preserve evidence'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'uc-insider-threat-management',
      title: 'Insider Threat Management: Detect Repeated Risky Exposure Behavior',
      iconImage: ICON_BASE + 'insider-risk-exfiltration-behavior-no-text-tight.png',
      iconAlt: 'Insider Threat Management use case icon',
      summary: 'Detect repeated, privileged, negligent, stealth, or malicious behavior around visible sensitive data before exposure becomes data loss. ' + ANCHOR_TAIL,
      tags: ['solution:insider-threat-management', 'ITM', 'Behavior', 'Privileged Users', 'SOC'],
      bullets: [
        'A user repeatedly screenshots, records, copies, stages, or moves sensitive information',
        'Sensitive data is opened across multiple apps, displays, or personal transfer channels',
        'Activity escalates during resignation, layoff, dispute, privileged access, or high-risk workflow periods',
        'Workstation and laptop signals add context and evidence for investigative and control actions'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'uc-exposure-data-loss-prevention',
      title: 'Exposure Data Loss Prevention: Control Visible Data Without a File Transfer',
      iconImage: ICON_BASE + 'dlp-augmentation.png',
      iconAlt: 'Exposure Data Loss Prevention use case icon',
      summary: 'Extend DLP to the moment sensitive data is visible, copied, captured, handled, or exposed in the wrong context—even when no file leaves the system. ' + ANCHOR_TAIL,
      tags: ['solution:exposure-data-loss-prevention', 'EDLP', 'Visible Data', 'DLP Extension', 'Evidence'],
      bullets: [
        'Sensitive data appears in an application, dashboard, browser, document, report, or secondary display',
        'Clipboard, copy/paste, screenshot, recording, unauthorized app, or unusual workflow activity creates risk',
        'Location, time, role, policy, application, and workstation context determine whether exposure is appropriate',
        'The platform converts visible-data exposure into real-time control and governable evidence'
      ],
      infographic: '#', vimeoUrl: '#'
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
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-grc1-core.pdf', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'sia', title: 'Presence (Who is present)',
      iconImage: ICON_BASE + 'presence-who-is-present.png', iconAlt: 'Presence icon',
      summary: 'Understand who is present when data is exposed. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#sia',
      capabilities: ['Verify user identity during sessions', 'Detect identity changes or absence', 'Track presence confidence over time', 'Link identity to exposure events'],
      outcomes: ['Confirm identity during exposure', 'Prevent unauthorized presence', 'Provide auditable identity assurance'],
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-sia.pdf', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'swa', title: 'Environment (Where exposure occurs)',
      iconImage: ICON_BASE + 'environment-where-exposure-occurs.png', iconAlt: 'Environment icon',
      summary: 'Understand the environment where exposure occurs. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#swa',
      capabilities: ['Detect observers and workspace conditions', 'Identify uncontrolled environments', 'Monitor physical exposure risks', 'Evaluate environmental context'],
      outcomes: ['Reduce exposure from physical conditions', 'Enforce workspace compliance', 'Improve environmental risk control'],
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-swa.pdf', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'itm', title: 'Behavior (How exposure happens)',
      iconImage: ICON_BASE + 'behavior-how-exposure-happens.png', iconAlt: 'Behavior icon',
      summary: 'Understand how user behavior creates exposure risk. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#itm',
      capabilities: ['Track user actions and interactions', 'Detect risky behavioral patterns', 'Link behavior to exposure events', 'Evaluate intent and context'],
      outcomes: ['Identify risky behavior early', 'Reduce insider-driven exposure', 'Improve behavioral risk understanding'],
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-itm.pdf', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'edge-dlp', title: 'Control (Act in real time)',
      iconImage: ICON_BASE + 'control-act-in-real-time.png', iconAlt: 'Control icon',
      summary: 'Decide and act in real time to control exposure as it occurs—based on visibility, presence, and context. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#edge-dlp',
      capabilities: ['Evaluate exposure using combined visibility, presence, and context signals', 'Apply masking and blocking controls', 'Trigger real-time interventions', 'Enforce policy at the endpoint', 'Automate response actions'],
      outcomes: ['Stop exposure in real time', 'Reduce reliance on delayed detection', 'Prevent data loss before it happens'],
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-edge-dlp.pdf', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'vector-context', title: 'Context (Why exposure matters)',
      iconImage: ICON_BASE + 'context-why-exposure-matters.png', iconAlt: 'Context icon',
      summary: 'Evaluate why an exposure matters by incorporating data sensitivity, user role, and situational risk at the moment data is visible. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#vector-context',
      capabilities: ['Sensitivity label integration (AIP / MIP / DG)', 'Role- and policy-based risk context', 'Time/session-aware conditions', 'Contextual risk scoring'],
      outcomes: ['Prioritize high-impact exposures', 'Reduce noise from low-risk events', 'Align controls to real business risk'],
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-vector-context.pdf', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'vector-continuity', title: 'Continuity (Exposure over time)',
      iconImage: ICON_BASE + 'continuity-exposure-over-time.png', iconAlt: 'Continuity icon',
      summary: 'Track how exposure evolves across a session to detect persistence, escalation, and patterns—not just single events. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#vector-continuity',
      capabilities: ['Session timelines and sequence tracking', 'Persistence and repetition detection', 'Cross-event correlation within session', 'Countdown/suppression logic'],
      outcomes: ['Catch slow or repeated exposure patterns', 'Improve detection accuracy over time', 'Reduce alert fatigue via session context'],
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-vector-continuity.pdf', infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'vector-evidence', title: 'Evidence (What can be proven)',
      iconImage: ICON_BASE + 'evidence-what-can-be-proven.png', iconAlt: 'Evidence icon',
      summary: 'Generate audit-ready evidence tied to the exact moment of exposure, including visibility, presence, and actions taken. ' + ANCHOR_TAIL,
      tags: [], moreInfoUrl: '#vector-evidence',
      capabilities: ['Event-tied evidence capture (policy-gated)', 'Attributable timelines and artifacts', 'Privacy-aware minimization and redaction', 'Chain-of-custody logging'],
      outcomes: ['Defensible audit and investigation records', 'Faster, higher-confidence case resolution', 'Reduced data retention risk'],
      technicalReport: REPORT_BASE + 'report-explainers-exposure-vector-vector-evidence.pdf', infographic: '#', vimeoUrl: '#'
    }
  ],

  caseStudies: [
    {
      id: 'cs-secure-workspace-healthcare',
      title: 'Hospital System Protects PHI in Remote Workspaces',
      iconImage: ICON_BASE + 'hospital-system.png',
      iconAlt: 'Hospital system icon',
      summary: 'A regional health system used Secure Workspace to reduce PHI visibility risk across remote billing, coding, and claims workspaces. ' + ANCHOR_TAIL,
      tags: ['solution:secure-workspace', 'SW', 'Healthcare', 'PHI', 'Workspace'],
      bullets: [
        'PHI exposure detected in remote and hybrid workspaces',
        'Observer, mobile phone, paper, and unattended-screen risks identified during sensitive work',
        'Workspace policy enforced continuously instead of relying on training alone',
        'Evidence preserved for compliance and investigation review'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-identity-recognition-insurance',
      title: 'Insurance Carrier Strengthens Identity Assurance for Claims Adjusters',
      iconImage: ICON_BASE + 'insurance-carrier.png',
      iconAlt: 'Insurance carrier icon',
      summary: 'An insurance carrier used Identity Recognition Assurance to verify user presence during high-value claim approvals and PII access. ' + ANCHOR_TAIL,
      tags: ['solution:identity-recognition-assurance', 'IRA', 'Insurance', 'PII', 'Claims'],
      bullets: [
        'Identity verified when sensitive claim and PII data became visible',
        'Step-up verification applied when presence confidence dropped',
        'Credential sharing and proxy-use risk reduced during claims workflows',
        'Identity evidence preserved for fraud and audit review'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-secure-virtual-meeting-saas',
      title: 'SaaS Company Protects IP During Remote Collaboration',
      iconImage: ICON_BASE + 'saas-software-company.png',
      iconAlt: 'SaaS software company icon',
      summary: 'A SaaS company used Secure Virtual Meeting to reduce IP leakage during distributed product, roadmap, and engineering reviews. ' + ANCHOR_TAIL,
      tags: ['solution:secure-virtual-meeting', 'SVM', 'Technology', 'IP', 'Screenshare'],
      bullets: [
        'Sensitive product and engineering content detected during screen sharing',
        'External participant and recording risks evaluated in meeting context',
        'Screen exposure controlled without blocking normal collaboration',
        'IP exposure visibility extended across distributed teams'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-insider-threat-bank',
      title: 'Global Bank Reduces Insider Exposure Risk',
      iconImage: ICON_BASE + 'global-bank.png',
      iconAlt: 'Global bank icon',
      summary: 'A tier-1 bank used Insider Threat Management to identify risky data handling before sensitive information left controlled environments. ' + ANCHOR_TAIL,
      tags: ['solution:insider-threat-management', 'ITM', 'Financial Services', 'Insider Risk', 'SOC'],
      bullets: [
        'Sensitive data access and handling patterns evaluated in real time',
        'Clipboard, screen, screenshot, and external application behavior tied to exposure risk',
        'Workstation signals added context and evidence for action decisions',
        'SOC review focused on high-confidence exposure events'
      ],
      infographic: '#', vimeoUrl: '#'
    },
    {
      id: 'cs-edlp-utility',
      title: 'Utility Controls Visible OT-Adjacent Sensitive Data',
      iconImage: ICON_BASE + 'public-utilities.png',
      iconAlt: 'Public utilities icon',
      summary: 'A utility used Exposure Data Loss Prevention to reduce exposure of SCADA configuration, drawings, and engineering data on office and engineering endpoints. ' + ANCHOR_TAIL,
      tags: ['solution:exposure-data-loss-prevention', 'EDLP', 'Energy / Utilities', 'Engineering Data', 'Visible Data'],
      bullets: [
        'SCADA configuration and engineering drawings detected when visible',
        'Sensitive screens controlled on OT-adjacent endpoints',
        'Behavioral and application context evaluated without disrupting operations',
        'Governable evidence captured for regulatory and incident review'
      ],
      infographic: '#', vimeoUrl: '#'
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
