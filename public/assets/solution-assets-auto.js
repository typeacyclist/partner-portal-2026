// Trendzact Partners Portal - Discover asset path enrichment
// Keeps content editing simple: leave an asset as '#' to show a disabled gray icon,
// or set it to any asset path/URL to show an active green icon.
//
// For current generated media libraries, this file auto-populates media fields
// that are still '#', using each card id as the filename stem.

(function () {
  const content = window.SOLUTION_CONTENT;
  const bases = window.SOLUTION_ASSET_BASES;
  if (!content || !bases) return;

  const generatedAssets = [
    { field: 'audioExplainer', base: bases.audioExplainer, ext: '.m4a' },
    { field: 'summaryReports', base: bases.summaryReports, ext: '.pdf' },
    { field: 'infoGraphics', base: bases.infoGraphics, ext: '.jpg' },
    { field: 'slideDecks', base: bases.slideDecks, ext: '.pdf' },
    { field: 'videoExplainers', base: bases.videoExplainers, ext: '.mp4' }
  ];

  function shouldAutofill(value) {
    return value == null || value === '#';
  }

  function eachCard(callback) {
    Object.keys(content).forEach(function (groupKey) {
      const group = content[groupKey];
      if (!Array.isArray(group)) return;
      group.forEach(callback);
    });
  }

  eachCard(function (card) {
    if (!card || !card.id) return;
    generatedAssets.forEach(function (asset) {
      if (shouldAutofill(card[asset.field])) {
        card[asset.field] = asset.base + card.id + asset.ext;
      }
    });
  });
})();
