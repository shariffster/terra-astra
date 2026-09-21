/** Selected approach lengths, in radians, for the existing illustrative hubs.
 * These replace several short display segments, never a source endpoint. */
export function marineApproachReach(point: readonly [number, number]) {
  const [lat,lon]=point;
  if(lat===35.875&&lon===-6.375)return .040; // Gibraltar's western approach
  if(lat===35.375&&lon===14.125)return .060; // Sicily / central Mediterranean
  if(lat===48.875&&lon===-3.875)return .035; // Western Channel
  if(lat===50.875&&lon===-12.875)return .060; // Atlantic approach west of Ireland
  if(lat===54.875&&lon===3.125)return .045; // North Sea
  if(lat===33.875&&lon===142.125)return .085; // Japan offshore
  if(lat===11.875&&lon===145.125)return .085; // Guam offshore
  if(lat===21.875&&lon===-156.875)return .095; // Hawaii offshore
  if(lat===36.875&&lon===-124.875)return .070; // Northern California offshore
  if(lat===31.875&&lon===-119.875)return .060; // Southern California offshore
  return 0;
}
