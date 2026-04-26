# Discover Collateral Generation Prompts

This file is the single source prompt pack for creating Discover collateral for the Trendzact Partner Portal.

The content is written for non-technical decision makers. English may be their second language. Use short sentences, plain words, and clear business examples.

---

# 1. Collateral Scope

Create collateral by Discover card type.

| Card type | Executive Summary report | Infographic prompt | Video explainer outline | Audio podcast |
|---|---:|---:|---:|---:|
| Platform | Yes | Yes | Yes | Yes |
| Solution | Yes | Yes | Yes | No |
| Enhancement | Yes | No | No | No |
| Use Case | Yes | Yes | No | No |
| Case Study | Yes | No | No | No |

Important:

- Every card gets an Executive Summary report.
- Only Platform, Solution, and Use Case cards get an Infographic prompt.
- Infographic output is a prompt only, not the actual image.
- Only Platform and Solution cards get a Video explainer outline.
- Only Platform gets an Audio podcast asset.

---

# 2. Global Collateral Rules

## Audience

Write for non-technical business decision makers, executives, budget owners, risk leaders, compliance leaders, operations leaders, and partner sales teams.

Assume:

- The reader may not have a technical cybersecurity background.
- English may be their second language.
- They need clear business meaning, not technical depth.
- They want to understand the risk, the value, and the decision to make.

## Writing Style

Use:

- Simple, direct English
- Short sentences
- Plain business language
- Concrete examples
- Clear section headings
- Short paragraphs
- Business risk before technical detail
- Why this matters before how it works

Avoid:

- GRC1 language
- Long technical explanations
- Complex cybersecurity terms without explanation
- Fear-based language
- Hacker imagery
- Product-heavy claims
- Dense compliance language
- Overstated capabilities
- Assuming the reader knows DLP, IAM, EDR, SOC, or insider threat terms

## Platform Framing

Use this framing consistently:

Trendzact Sensitive Data Exposure Control Platform helps organizations control sensitive data exposure in real time. It works after access is granted and after sensitive information becomes visible.

Core message:

Access permission does not grant exposure permission.

Plain-English explanation:

A person may be allowed to open sensitive information. But that does not always mean it is safe for the information to be seen in that situation.

Operating model:

Understand -> Decide -> Act

Plain-English explanation:

- Understand what is happening
- Decide if the exposure is safe or risky
- Act immediately if control is needed

Canonical closing message:

Sensitive data exposure begins when information is seen. Trendzact turns that moment into a real-time control point.

## Plain-Language Substitutions

Use these substitutions for clarity:

| Instead of | Use |
|---|---|
| endpoint telemetry | signals from the user's computer |
| identity confidence | confidence that the right person is still present |
| data exfiltration | sensitive data leaving control |
| DLP | data loss prevention tools on first use |
| SOC | security team on first use |
| policy enforcement | applying company rules in real time |
| evidence preservation | saving proof for review |
| session context | what is happening during the user's work session |
| behavioral anomaly | activity that looks unusual or risky |

---

# 3. Storage and Naming Rules

All generated collateral must be stored in Firebase Storage under:

```text
gs://trendzact-partners-001.firebasestorage.app
```

Each Discover card gets its own folder using this folder pattern:

```text
/{chip}_{name}
```

Rules:

- Use lowercase folder names.
- Use underscores, not spaces or hyphens.
- Use the chip name first: `platform`, `solution`, `enhancement`, `usecase`, or `casestudy`.
- Use a short, stable name after the chip.
- Put all collateral for that card in its folder.
- Do not put collateral directly in the bucket root.

## Required Files by Card Type

### Platform folder

Required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
audio_podcast.md
```

Optional:

```text
exec_summary.pdf
video_script.md
audio_podcast_script.md
```

### Solution folder

Required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
```

Optional:

```text
exec_summary.pdf
video_script.md
```

### Enhancement folder

Required:

```text
exec_summary.md
```

Optional:

```text
exec_summary.pdf
```

### Use Case folder

Required:

```text
exec_summary.md
infographic_prompt.md
```

Optional:

```text
exec_summary.pdf
```

### Case Study folder

Required:

```text
exec_summary.md
```

Optional:

```text
exec_summary.pdf
```

Example full paths:

```text
gs://trendzact-partners-001.firebasestorage.app/platform_sdec/exec_summary.md
gs://trendzact-partners-001.firebasestorage.app/platform_sdec/infographic_prompt.md
gs://trendzact-partners-001.firebasestorage.app/platform_sdec/video_outline.md
gs://trendzact-partners-001.firebasestorage.app/platform_sdec/audio_podcast.md
```

---

# 4. Discover Card Manifest and Storage Folders

Use this manifest as the source list for collateral creation.

## Platform

### Trendzact Sensitive Data Exposure Control Platform

Chip: `platform`

Folder:

```text
/platform_sdec
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/platform_sdec/
```

Category: Platform

Collateral required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
audio_podcast.md
```

Focus:
Trendzact gives organizations a real-time data exposure control layer across the human edge. It controls sensitive data exposure after access is granted and the information becomes visible on screens, in workspaces, during collaboration, and across user workflows.

Key points:

- Controls sensitive data exposure after access is granted and data becomes visible
- Combines visibility, presence, workspace, meeting, behavior, application, timing, location, policy, and evidence context
- Uses Understand -> Decide -> Act as the operating model for real-time exposure control
- Turns silent exposure uncertainty into proof, context, and governable action

---

## Solutions

### Secure Workspace

Chip: `solution`

Folder:

```text
/solution_secure_workspace
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/solution_secure_workspace/
```

Category: Solution

Collateral required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
```

Focus:
Protect sensitive data when it is visible in physical, remote, shared, public, or uncontrolled workspaces. Secure Workspace focuses on the environment around the data, including observers, mobile phones, unattended sessions, nearby documents, and multi-screen exposure.

Key points:

- Detect workspace exposure from observers, phones, cameras, paper, secondary displays, or unattended workstations
- Support home, office, call center, public, travel, hotel, and shared-workspace environments
- Use webcam-enabled visual context
- Strengthen mission-critical deployments with the Trendzact Ultrawide Webcam
- Apply warnings, masking, lockout, escalation, or saving proof for review when workspace exposure risk appears

### Identity Recognition Assurance

Chip: `solution`

Folder:

```text
/solution_identity_assurance
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/solution_identity_assurance/
```

Category: Solution

Collateral required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
```

Focus:
Confirm the right person is present while sensitive information is visible. Identity Recognition Assurance separates login authentication from real-time identity confidence during an active exposure moment.

Key points:

- Verify user presence during sensitive work
- Confirm that the right person is still present
- Detect user absence, proxy work, session handoff, credential sharing, or another person taking over an active session
- Identify unknown observers, multiple people, or reduced identity confidence during regulated workflows
- Trigger step-up verification, session lock, escalation, or saving proof for review when assurance weakens

### Secure Virtual Meeting

Chip: `solution`

Folder:

```text
/solution_secure_virtual_meeting
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/solution_secure_virtual_meeting/
```

Category: Solution

Collateral required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
```

Focus:
Control sensitive data exposure during virtual meetings, screen sharing, recordings, participant changes, and external collaboration. Secure Virtual Meeting helps prevent authorized meetings from becoming unauthorized exposure events.

Key points:

- Detect sensitive information visible during screen sharing or collaboration
- Evaluate whether the meeting audience is appropriate for the data being exposed
- Identify external participants, unauthorized attendees, participant changes, or recording conditions
- Warn, mask, restrict, stop sharing, escalate, or save proof based on meeting context

### Insider Threat Management

Chip: `solution`

Folder:

```text
/solution_insider_threat_management
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/solution_insider_threat_management/
```

Category: Solution

Collateral required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
```

Focus:
Detect risky, privileged, negligent, stealth, or malicious behavior around visible sensitive data. Insider Threat Management focuses on repeated patterns, policy evasion, misuse, and escalating exposure behavior.

Key points:

- Detect risky behavior around screenshots, screen recordings, clipboard, staging, shadow tools, or unauthorized apps
- Evaluate repeated or escalating exposure patterns across sessions and workflows
- Identify suspicious activity by privileged users or users in high-risk employment periods
- Create proof-backed signals for security, compliance, HR, legal, and security team review

### Exposure Data Loss Prevention

Chip: `solution`

Folder:

```text
/solution_exposure_dlp
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/solution_exposure_dlp/
```

Category: Solution

Collateral required:

```text
exec_summary.md
infographic_prompt.md
video_outline.md
```

Focus:
Extend data loss prevention beyond files, transfers, and repositories to include visible data, user behavior, application activity, location, timing, workflow context, and governable evidence. Exposure Data Loss Prevention controls exposure even when no file leaves the system.

Key points:

- Detect sensitive data exposure when information is visible on screen, copied, captured, handled, or shown in the wrong context
- Evaluate visible content, clipboard movement, application usage, workflow, time, location, and policy context
- Use user computer context to support real-time control decisions
- Convert visible-data exposure into policy action and audit-ready proof

---

## Enhancements

### Trendzact Ultrawide Webcam

Chip: `enhancement`

Folder:

```text
/enhancement_ultrawide_webcam
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/enhancement_ultrawide_webcam/
```

Category: Enhancement

Collateral required:

```text
exec_summary.md
```

Focus:
For mission-critical sensitive data and top corporate secrets, the Trendzact Ultrawide Webcam expands workspace context with a 180-degree field of view. It is best suited for Secure Workspace deployments where narrow camera visibility is not enough.

Key points:

- Recommended for board materials, M&A, legal strategy, source code, regulated records, and top corporate secrets
- Improves detection of observers, mobile phones, secondary displays, nearby documents, and wider workspace conditions
- Strengthens Secure Workspace and identity-aware exposure decisions for high-value workflows
- Helps prove what was around the sensitive data at the moment exposure occurred

### Multi-Display Screen Recording

Chip: `enhancement`

Folder:

```text
/enhancement_multi_display_recording
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/enhancement_multi_display_recording/
```

Category: Enhancement

Collateral required:

```text
exec_summary.md
```

Focus:
Multi-Display Screen Recording preserves governed proof across one or more screens when exposure risk requires replayable context. Recording can be always-on for mission-critical workflows or alert-triggered when company rules escalate.

Key points:

- Supports always-on or alert-triggered capture depending on policy and risk tier
- Can preserve pre-alert and post-alert context where supported
- Optional obfuscation, masking, or redaction can reduce unnecessary sensitive image exposure
- Proof access can be restricted to highest-admin roles with audit trails and role-based review controls

### Computer Workstation / Laptop Scan

Chip: `enhancement`

Folder:

```text
/enhancement_workstation_laptop_scan
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/enhancement_workstation_laptop_scan/
```

Category: Enhancement

Collateral required:

```text
exec_summary.md
```

Focus:
Computer Workstation / Laptop Scan enriches exposure decisions with 100+ endpoint and work-session signals. These signals provide additional context and proof for why the platform allowed, warned, restricted, blocked, escalated, or saved an event for review.

Key points:

- Adds context from applications, windows, clipboard, displays, devices, session state, foreground activity, location, timing, and policy conditions
- Helps distinguish normal work from suspicious, negligent, policy-violating, or escalating behavior
- Improves explainability for automated controls and security team review
- Provides supporting proof for enforcement, investigation, audit, and compliance workflows

---

## Use Cases

### Secure Workspace: Protect Mission-Critical Workspaces

Chip: `usecase`

Folder:

```text
/usecase_secure_workspace_mission_critical
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/usecase_secure_workspace_mission_critical/
```

Category: Use Case

Collateral required:

```text
exec_summary.md
infographic_prompt.md
```

Focus:
Protect board materials, M&A work, legal strategy, PHI, financial records, source code, and other mission-critical data when it is visible in the user workspace.

Key points:

- Sensitive screens are visible in home, office, call center, public, or travel workspaces
- Unknown observers, mobile phones, paper documents, or secondary displays create exposure risk
- Trendzact Ultrawide Webcam improves coverage where top corporate secrets require broader workspace context
- Company-rule actions can warn, mask, restrict, escalate, or save proof during exposure

### Identity Recognition Assurance: Stop Active-Session Misuse

Chip: `usecase`

Folder:

```text
/usecase_identity_active_session_misuse
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/usecase_identity_active_session_misuse/
```

Category: Use Case

Collateral required:

```text
exec_summary.md
infographic_prompt.md
```

Focus:
Confirm the authorized user is still present and in control when sensitive information is visible.

Key points:

- A user authenticates successfully, then leaves the workstation while data remains visible
- Another person begins interacting with the active session or appears during sensitive work
- Presence confidence drops during privileged, regulated, or confidential workflows
- The platform can require re-verification, lock the session, escalate, or save proof for review

### Secure Virtual Meeting: Control Screen-Share Exposure

Chip: `usecase`

Folder:

```text
/usecase_virtual_meeting_screenshare_exposure
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/usecase_virtual_meeting_screenshare_exposure/
```

Category: Use Case

Collateral required:

```text
exec_summary.md
infographic_prompt.md
```

Focus:
Prevent authorized meetings from becoming unauthorized exposure events when sensitive data appears during screen share or collaboration.

Key points:

- A user shares the wrong window or exposes restricted data during a vendor, customer, partner, or executive meeting
- External participants or unknown attendees are present while confidential information is visible
- Meeting recording or screenshot activity creates proof and governance risk
- Trendzact can warn, mask, restrict exposure, stop sharing, escalate, or save proof for review

### Insider Threat Management: Detect Repeated Risky Exposure Behavior

Chip: `usecase`

Folder:

```text
/usecase_insider_repeated_risky_behavior
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/usecase_insider_repeated_risky_behavior/
```

Category: Use Case

Collateral required:

```text
exec_summary.md
infographic_prompt.md
```

Focus:
Detect repeated, privileged, negligent, stealth, or malicious behavior around visible sensitive data before exposure becomes data loss.

Key points:

- A user repeatedly screenshots, records, copies, stages, or moves sensitive information
- Sensitive data is opened across multiple apps, displays, or personal transfer channels
- Activity escalates during resignation, layoff, dispute, privileged access, or high-risk workflow periods
- Workstation and laptop signals add context and proof for investigative and control actions

### Exposure Data Loss Prevention: Control Visible Data Without a File Transfer

Chip: `usecase`

Folder:

```text
/usecase_visible_data_no_file_transfer
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/usecase_visible_data_no_file_transfer/
```

Category: Use Case

Collateral required:

```text
exec_summary.md
infographic_prompt.md
```

Focus:
Extend data loss prevention to the moment sensitive data is visible, copied, captured, handled, or exposed in the wrong context, even when no file leaves the system.

Key points:

- Sensitive data appears in an application, dashboard, browser, document, report, or secondary display
- Clipboard, copy/paste, screenshot, recording, unauthorized app, or unusual workflow activity creates risk
- Location, time, role, policy, application, and user computer context determine whether exposure is appropriate
- The platform converts visible-data exposure into real-time control and governable proof

---

## Case Studies

### Hospital System Protects PHI in Remote Workspaces

Chip: `casestudy`

Folder:

```text
/casestudy_hospital_phi_remote_workspace
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/casestudy_hospital_phi_remote_workspace/
```

Category: Case Study

Collateral required:

```text
exec_summary.md
```

Focus:
A regional health system used Secure Workspace to reduce PHI visibility risk across remote billing, coding, claims, and telework environments where sensitive data was visible beyond the application boundary.

Key points:

- PHI exposure detected in remote and hybrid workspaces
- Observer, mobile phone, paper, and unattended-screen risks identified during sensitive work
- Workspace policy enforced continuously instead of relying on training alone
- Proof saved for compliance and investigation review

### Insurance Carrier Strengthens Identity Assurance for Claims Adjusters

Chip: `casestudy`

Folder:

```text
/casestudy_insurance_identity_claims
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/casestudy_insurance_identity_claims/
```

Category: Case Study

Collateral required:

```text
exec_summary.md
```

Focus:
An insurance carrier used Identity Recognition Assurance to verify user presence and reduce active-session misuse risk during high-value claim approvals and PII access.

Key points:

- Identity verified when sensitive claim and PII data became visible
- Step-up verification applied when presence confidence dropped
- Credential sharing and proxy-use risk reduced during claims workflows
- Identity proof saved for fraud and audit review

### SaaS Company Protects IP During Remote Collaboration

Chip: `casestudy`

Folder:

```text
/casestudy_saas_ip_remote_collaboration
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/casestudy_saas_ip_remote_collaboration/
```

Category: Case Study

Collateral required:

```text
exec_summary.md
```

Focus:
A SaaS company used Secure Virtual Meeting to reduce IP leakage during distributed roadmap, product, engineering, customer, and partner collaboration sessions.

Key points:

- Sensitive product and engineering content detected during screen sharing
- External participant and recording risks evaluated in meeting context
- Screen exposure controlled without blocking normal collaboration
- IP exposure visibility extended across distributed teams

### Global Bank Reduces Insider Exposure Risk

Chip: `casestudy`

Folder:

```text
/casestudy_global_bank_insider_exposure
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/casestudy_global_bank_insider_exposure/
```

Category: Case Study

Collateral required:

```text
exec_summary.md
```

Focus:
A tier-1 bank used Insider Threat Management to identify risky handling of visible sensitive data before screenshots, clipboard movement, staging, or shadow tools became data loss.

Key points:

- Sensitive data access and handling patterns evaluated in real time
- Clipboard, screen, screenshot, and external application behavior tied to exposure risk
- Workstation signals added context and proof for action decisions
- Security team review focused on high-confidence exposure events

### Utility Controls Visible OT-Adjacent Sensitive Data

Chip: `casestudy`

Folder:

```text
/casestudy_utility_ot_visible_data
```

Full storage path:

```text
gs://trendzact-partners-001.firebasestorage.app/casestudy_utility_ot_visible_data/
```

Category: Case Study

Collateral required:

```text
exec_summary.md
```

Focus:
A utility used Exposure Data Loss Prevention to reduce exposure of SCADA configuration, drawings, engineering data, and OT-adjacent information visible on office and engineering endpoints.

Key points:

- SCADA configuration and engineering drawings detected when visible
- Sensitive screens controlled on OT-adjacent endpoints
- Behavioral and application context evaluated without disrupting operations
- Governable proof captured for regulatory and incident review

---

# 5. Executive Summary Report Prompt

Use this prompt for every card type: Platform, Solution, Enhancement, Use Case, and Case Study.

```text
Create a partner-facing Executive Summary report for the following Trendzact Discover card.

ITEM:
[PASTE ITEM NAME]

CATEGORY:
[PASTE CATEGORY]

CHIP:
[PASTE CHIP]

COLLATERAL FOLDER:
[PASTE FOLDER, e.g. /solution_identity_assurance]

STORAGE PATH:
[PASTE FULL STORAGE PATH]

ITEM FOCUS:
[PASTE ITEM FOCUS]

KEY POINTS:
[PASTE KEY POINTS]

Audience:
Non-technical business decision makers. English may be their second language.

Use simple, clear English. Keep sentences short. Explain the business problem first. Avoid jargon. If a technical term is needed, explain it in plain language.

Use the following platform framing:
Trendzact Sensitive Data Exposure Control Platform helps organizations control sensitive data exposure in real time. It works after access is granted and after sensitive information becomes visible.

Core message:
Access permission does not grant exposure permission.

Explain this simply:
A person may be allowed to open sensitive information. But that does not always mean it is safe for the information to be seen in that situation.

Operating model:
Understand -> Decide -> Act

Explain this simply:
- Understand what is happening
- Decide if the exposure is safe or risky
- Act immediately if control is needed

Output requirements:
- Create file: exec_summary.md
- Store under: [PASTE FULL STORAGE PATH]
- Optional PDF export: exec_summary.pdf

Report requirements:
- Length: 2 to 3 pages equivalent
- Audience: executives, business owners, risk leaders, compliance leaders, and partner sales teams
- Style: simple, clear, business-focused, decision-maker ready
- Do not mention GRC1
- Do not use technical filler
- Do not overstate capabilities
- Make the business value easy to understand

Structure the report as:

# [ITEM NAME]

## Executive Summary
Explain the problem in plain English. Describe why the issue matters to business leaders.

## The Business Risk
Explain what can go wrong when sensitive data is visible in the wrong place, to the wrong person, or at the wrong time.

## Why Current Tools May Not Be Enough
Explain in simple terms why login controls, file controls, endpoint tools, meeting tools, and training may miss this problem.

Use plain explanations:
- Login tools know who signed in.
- File tools know when files move.
- Meeting tools know a meeting is happening.
- But they may not know who can actually see the sensitive information.

## What Trendzact Helps Understand
Describe the key questions Trendzact helps answer. Use only questions relevant to this item.

## How Trendzact Helps Decide
Explain how Trendzact helps determine whether the situation is safe, risky, or against policy.

## How Trendzact Can Act
Describe simple control actions. Only include actions relevant to this item.

## Business Value
Explain the value in plain business terms.

## Partner Sales Angle
Explain how a partner should talk about this item with a buyer.

## Questions to Ask the Buyer
Provide 8 to 10 simple discovery questions.

## What to Show in a Demo
List simple proof points that a partner or sales engineer can show.

## Closing Message
End with:
Sensitive data exposure begins when information is seen. Trendzact turns that moment into a real-time control point.
```

---

# 6. Infographic Prompt Asset

Use this prompt only for Platform, Solution, and Use Case cards.

This creates an infographic prompt file only. It does not create the actual image.

```text
Create an infographic image-generation prompt for the following Trendzact Discover card.

ITEM:
[PASTE ITEM NAME]

CATEGORY:
[PASTE CATEGORY]

CHIP:
[PASTE CHIP]

COLLATERAL FOLDER:
[PASTE FOLDER, e.g. /solution_identity_assurance]

STORAGE PATH:
[PASTE FULL STORAGE PATH]

ITEM FOCUS:
[PASTE ITEM FOCUS]

KEY POINTS:
[PASTE KEY POINTS]

Audience:
Non-technical business decision makers. English may be their second language.

Output requirements:
- Create file: infographic_prompt.md
- Store under: [PASTE FULL STORAGE PATH]
- Do not create the actual image.
- The output must be a reusable image-generation prompt.

Prompt requirements:
- Format target: 16:9 landscape infographic image
- Style: clean executive business infographic
- Use simple labels
- Use minimal text
- Use plain English
- Avoid technical diagrams
- Avoid complex architecture
- Avoid dark hacker imagery
- Avoid fear-based visuals
- Avoid real sensitive data
- Do not include GRC1
- Do not include third-party logos

The generated infographic prompt should direct the image model to show one simple business idea:
Sensitive data may be allowed to open, but it still needs control when it becomes visible.

Required visual structure:
- Top headline: [ITEM NAME]
- Subheadline: Control sensitive data exposure in real time
- Center visual: a simple scene related to the item
- Three-step flow: Understand -> Decide -> Act
- Simple labels: What is visible? Who is present? Where is it happening? Is this safe or risky? What action is needed?

For this specific item, emphasize:
[PASTE ITEM FOCUS]

Keep the final prompt practical, specific, and ready to paste into an image-generation tool.
```

---

# 7. Video Explainer Outline Prompt

Use this prompt only for Platform and Solution cards.

```text
Create a concise executive video explainer outline for the following Trendzact Discover card.

ITEM:
[PASTE ITEM NAME]

CATEGORY:
[PASTE CATEGORY]

CHIP:
[PASTE CHIP]

COLLATERAL FOLDER:
[PASTE FOLDER, e.g. /solution_identity_assurance]

STORAGE PATH:
[PASTE FULL STORAGE PATH]

ITEM FOCUS:
[PASTE ITEM FOCUS]

KEY POINTS:
[PASTE KEY POINTS]

Audience:
Non-technical business decision makers. English may be their second language.

Use simple, clear English. Avoid jargon. Use short sentences. Explain the business problem before the technology.

Use the following platform framing:
Trendzact Sensitive Data Exposure Control Platform helps organizations control sensitive data exposure in real time. It works after access is granted and after sensitive information becomes visible.

Core message:
Access permission does not grant exposure permission.

Operating model:
Understand -> Decide -> Act

Output requirements:
- Create file: video_outline.md
- Optional script file: video_script.md
- Store under: [PASTE FULL STORAGE PATH]

Requirements:
- Format: video explainer outline
- Do not include timing
- Do not include speaker names
- Do not include scene timestamps
- Use clear section headings
- Include suggested visuals for each section
- Include optional narration copy
- Tone: clear, simple, calm, credible
- Do not mention GRC1
- Avoid exaggerated claims
- Avoid fear-based language
- Avoid technical detail unless needed

Structure:

# [ITEM NAME] - Video Explainer Outline

## 1. The Simple Problem
Explain the issue in plain English.

## 2. Why Access Is Not Enough
Explain that permission to open data does not always mean the situation is safe.

## 3. The Exposure Moment
Describe the specific risk moment for this item.

## 4. What Trendzact Understands
Explain the context Trendzact checks. Use simple questions relevant to this item.

## 5. How Trendzact Decides
Explain that Trendzact compares the situation to company policy and risk context.

## 6. How Trendzact Acts
Describe relevant actions in plain language.

## 7. Why This Matters to Leaders
Explain the business value.

## 8. Closing Message
End with:
Sensitive data exposure begins when information is seen. Trendzact turns that moment into a real-time control point.
```

---

# 8. Audio Podcast Prompt

Use this prompt only for the Platform card.

```text
Create an executive audio podcast outline and script for the Trendzact Sensitive Data Exposure Control Platform.

ITEM:
Trendzact Sensitive Data Exposure Control Platform

CATEGORY:
Platform

CHIP:
platform

COLLATERAL FOLDER:
/platform_sdec

STORAGE PATH:
gs://trendzact-partners-001.firebasestorage.app/platform_sdec/

Audience:
Non-technical business decision makers. English may be their second language.

Use simple, clear English. Keep sentences short. Use plain business examples. Avoid technical jargon.

Podcast goal:
Help executives understand why sensitive data needs control after access is granted and after information becomes visible.

Core message:
Access permission does not grant exposure permission.

Operating model:
Understand -> Decide -> Act

Output requirements:
- Create file: audio_podcast.md
- Optional full script file: audio_podcast_script.md
- Store under: gs://trendzact-partners-001.firebasestorage.app/platform_sdec/

Requirements:
- Format: podcast outline plus optional script
- No timestamps required
- No speaker names required unless using a simple host/interviewer format
- Tone: calm, executive, clear, practical
- Do not mention GRC1
- Do not use fear-based language
- Do not overstate capabilities

Structure:

# Trendzact Sensitive Data Exposure Control Platform - Audio Podcast

## Podcast Summary
Explain the episode in 3 to 5 short sentences.

## Opening
Introduce the problem: sensitive data is protected before it opens, but can still be exposed when it becomes visible.

## Plain-English Explanation
Explain:
A person may be allowed to access data. But that does not always mean the situation is safe for the data to be seen.

## Business Examples
Include examples:
- A screen visible to another person
- A sensitive document shared in the wrong meeting
- A user walks away while data is still open
- A mobile phone near confidential information
- A user copies or records sensitive information

## Trendzact Approach
Explain Understand -> Decide -> Act in simple terms.

## Why Leaders Should Care
Explain business value:
- Less uncertainty
- Better proof
- Faster response
- Stronger compliance
- Better control of remote and hybrid work
- Lower risk from mistakes or misuse

## Closing Message
End with:
Sensitive data exposure begins when information is seen. Trendzact turns that moment into a real-time control point.
```

---

# 9. Upload Checklist

For each card folder, confirm only the required files for that card type exist.

## Platform

```text
exec_summary.md
infographic_prompt.md
video_outline.md
audio_podcast.md
```

## Solution

```text
exec_summary.md
infographic_prompt.md
video_outline.md
```

## Enhancement

```text
exec_summary.md
```

## Use Case

```text
exec_summary.md
infographic_prompt.md
```

## Case Study

```text
exec_summary.md
```

Optional files where useful:

```text
exec_summary.pdf
video_script.md
audio_podcast_script.md
```

---

# 10. Quality Checklist

Before finalizing each collateral asset, check:

- Does it avoid GRC1 language?
- Does it use simple English?
- Would a non-technical executive understand it quickly?
- Does it explain the business risk before the technology?
- Does it show why access control alone is not enough?
- Does it use Access permission does not grant exposure permission correctly?
- Does it connect back to Understand -> Decide -> Act?
- Does it avoid fear-based or hacker imagery?
- Does it avoid overstated product claims?
- Does it end with a clear business value?
- Does it use proof for review instead of overly technical evidence language?
- Does it use the correct folder pattern: /{chip}_{name}?
- Is the asset stored under gs://trendzact-partners-001.firebasestorage.app?
- Is the asset type allowed for that card type?
