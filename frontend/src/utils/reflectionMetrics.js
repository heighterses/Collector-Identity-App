/**
 * Single source of truth for reflection counts and coverage.
 *
 * Both the Dashboard and the Reflections page derive their numbers from this
 * one selector, fed by the same read (`reflection.getAll()` — every reflection
 * belonging to the current user's artworks). Previously the Dashboard counted
 * `artworks.filter(a => a.has_reflection)`, a field the artwork API never
 * returns, so it always read 0 while the Reflections page (which reads the
 * reflections table directly) showed the real count.
 *
 * @param {Array<{artwork_id: string}>} reflections - rows from reflection.getAll()
 * @param {Array<{id: string}>} artworks - the user's artworks
 */
export const computeReflectionMetrics = (reflections = [], artworks = []) => {
  const worksCount = artworks.length;
  const artworkIds = new Set(artworks.map(a => a.id));

  // Total count: each reflection counts once.
  const totalReflections = reflections.filter(
    r => r && artworkIds.has(r.artwork_id)
  ).length;

  // Coverage: an artwork with one or more reflections counts once.
  const reflectedArtworkIds = new Set(
    reflections
      .map(r => r && r.artwork_id)
      .filter(id => artworkIds.has(id))
  );
  const reflectedWorksCount = reflectedArtworkIds.size;

  const coveragePct = worksCount
    ? Math.round((reflectedWorksCount / worksCount) * 100)
    : 0;

  return { worksCount, totalReflections, reflectedWorksCount, coveragePct };
};
