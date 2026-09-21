/** Selected approach lengths, in radians, for the existing illustrative hubs.
 * These replace several short display segments, never a source endpoint. */
export function marineApproachReach(point: readonly [number, number]) {
  const [lat,lon]=point;
  if(lat===35.875&&lon===-6.375)return .040; // Gibraltar's western approach
  if(lat===35.375&&lon===14.125)return .060; // Sicily / central Mediterranean
  if(lat===48.875&&lon===-3.875)return .035; // Western Channel
  return 0;
}
