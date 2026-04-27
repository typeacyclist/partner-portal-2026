// Trendzact Partners Portal - Discover asset path enrichment
// Keeps content editing simple: leave an asset as '#' to show a disabled gray icon,
// or set it to an exact Firebase Storage asset path to show an active green icon.
//
// This file intentionally uses explicit exact-match mappings from the current
// Firebase Storage asset inventory. It does not generate guessed filenames.
// If an exact infographic is not mapped, generic group-level infographics are used.

(function () {
  const content = window.SOLUTION_CONTENT;
  const bases = window.SOLUTION_ASSET_BASES;
  if (!content || !bases) return;

  const iconMap = {
    'sdec-platform': bases.siteIcons + 'workspace-exposure-no-text-tight.png'
  };

  const genericInfographics = {
    solutions: bases.infoGraphics + 'INFOGRAPHIC for Solutions.jpeg',
    enhancements: bases.infoGraphics + 'INFOGRAPHIC for Enhancements.jpeg',
    vectors: bases.infoGraphics + 'INFOGRAPHIC for Exposure Vectors.jpeg',
    caseStudies: bases.infoGraphics + 'INFOGRAPHIC for Case Study.jpeg'
  };

  const assetMap = {
    'sdec-platform': {
      audioExplainer: bases.audioExplainer + 'AUDIO OVERVIEW for Platform-SDEC.m4a',
      summaryReports: bases.summaryReports + 'platform_sdec.pdf',
      infoGraphics: bases.infoGraphics + 'INFOGRAPHIC for Platform-SDEC.jpg',
      slideDecks: bases.slideDecks + 'SLIDE DECK for Platform-SDEC (short form).pdf',
      videoExplainers: bases.videoExplainers + 'VIDEO EXPLAINER for Platform-SDEC.mp4'
    },

    'secure-workspace': {
      audioExplainer: bases.audioExplainer + 'AUDIO OVERVIEW for Solution-SW.m4a',
      summaryReports: bases.summaryReports + 'solution_secure_workspace.pdf',
      infoGraphics: bases.infoGraphics + 'INFOGRAPHIC for Solution-SW.jpg',
      slideDecks: bases.slideDecks + 'SLIDE DECK for Solution-SW.pdf',
      videoExplainers: bases.videoExplainers + 'VIDEO EXPLAINER for Solution-SW.mp4'
    },
    'identity-recognition-assurance': {
      audioExplainer: bases.audioExplainer + 'AUDIO OVERVIEW for Solution-IRA.m4a',
      summaryReports: bases.summaryReports + 'solution_identity_assurance.pdf',
      infoGraphics: bases.infoGraphics + 'INFOGRAPHIC for Solution-IRA.jpg',
      slideDecks: bases.slideDecks + 'SLIDE DECK for Solution-IRA.pdf',
      videoExplainers: bases.videoExplainers + 'VIDEO EXPLAINER for Solution-IRA.mp4'
    },
    'secure-virtual-meeting': {
      audioExplainer: bases.audioExplainer + 'AUDIO OVERVIEW for Solution-SVM.m4a',
      summaryReports: bases.summaryReports + 'solution_secure_virtual_meeting.pdf',
      infoGraphics: bases.infoGraphics + 'INFOGRAPHIC for Solution-SVM.jpg',
      slideDecks: bases.slideDecks + 'SLIDE DECK for Solution-SVM.pdf',
      videoExplainers: bases.videoExplainers + 'VIDEO EXPLAINER for Solution-SVM.mp4'
    },
    'insider-threat-management': {
      audioExplainer: bases.audioExplainer + 'AUDIO OVERVIEW for Solution-ITM.m4a',
      summaryReports: bases.summaryReports + 'solution_insider_threat_management.pdf',
      infoGraphics: bases.infoGraphics + 'INFOGRAPHIC for Solution-ITM.jpg',
      slideDecks: bases.slideDecks + 'SLIDE DECK for Solution-ITM.pdf',
      videoExplainers: bases.videoExplainers + 'VIDEO EXPLAINER for Solution-ITM.mp4'
    },
    'exposure-data-loss-prevention': {
      audioExplainer: bases.audioExplainer + 'AUDIO OVERVIEW for Solution-EDLP.m4a',
      summaryReports: bases.summaryReports + 'solution_exposure_dlp.pdf',
      infoGraphics: bases.infoGraphics + 'INFOGRAPHIC for Solution-EDLP.jpg',
      slideDecks: bases.slideDecks + 'SLIDE DECK for Solution-EDLP.pdf',
      videoExplainers: bases.videoExplainers + 'VIDEO EXPLAINER for Solution-EDLP.mp4'
    },

    'enh-ultrawide-webcam': {
      summaryReports: bases.summaryReports + 'enhancement_ultrawide_webcam.pdf'
    },
    'enh-multi-display-screen-recording': {
      summaryReports: bases.summaryReports + 'enhancement_multi_display_recording.pdf'
    },
    'enh-workstation-laptop-scan': {
      summaryReports: bases.summaryReports + 'enhancement_workstation_laptop_scan.pdf'
    },

    'uc-secure-workspace': {
      summaryReports: bases.summaryReports + 'usecase_secure_workspace_mission_critical.pdf'
    },
    'uc-identity-recognition-assurance': {
      summaryReports: bases.summaryReports + 'usecase_identity_active_session_misuse.pdf'
    },
    'uc-secure-virtual-meeting': {
      summaryReports: bases.summaryReports + 'usecase_virtual_meeting_screenshare_exposure.pdf'
    },
    'uc-insider-threat-management': {
      summaryReports: bases.summaryReports + 'usecase_insider_repeated_risky_behavior.pdf'
    },
    'uc-exposure-data-loss-prevention': {
      summaryReports: bases.summaryReports + 'usecase_visible_data_no_file_transfer.pdf'
    },

    'cs-secure-workspace-healthcare': {
      summaryReports: bases.summaryReports + 'casestudy_hospital_phi_remote_workspace.pdf'
    },
    'cs-identity-recognition-insurance': {
      summaryReports: bases.summaryReports + 'casestudy_insurance_identity_claims.pdf'
    },
    'cs-secure-virtual-meeting-saas': {
      summaryReports: bases.summaryReports + 'casestudy_saas_ip_remote_collaboration.pdf'
    },
    'cs-insider-threat-bank': {
      summaryReports: bases.summaryReports + 'casestudy_global_bank_insider_exposure.pdf'
    },
    'cs-edlp-utility': {
      summaryReports: bases.summaryReports + 'casestudy_utility_ot_visible_data.pdf'
    }
  };

  const assetFields = [
    'moreInfo',
    'audioExplainer',
    'summaryReports',
    'infoGraphics',
    'slideDecks',
    'videoExplainers'
  ];

  function eachCard(callback) {
    Object.keys(content).forEach(function (groupKey) {
      const group = content[groupKey];
      if (!Array.isArray(group)) return;
      group.forEach(function (card) {
        callback(card, groupKey);
      });
    });
  }

  function resolveFieldValue(field, mappedAssets, groupKey) {
    if (mappedAssets[field]) return mappedAssets[field];
    if (field === 'infoGraphics' && genericInfographics[groupKey]) return genericInfographics[groupKey];
    return '#';
  }

  eachCard(function (card, groupKey) {
    if (!card || !card.id) return;

    if (iconMap[card.id]) {
      card.iconImage = iconMap[card.id];
    }

    const mappedAssets = assetMap[card.id] || {};
    assetFields.forEach(function (field) {
      card[field] = resolveFieldValue(field, mappedAssets, groupKey);
    });
  });
})();
