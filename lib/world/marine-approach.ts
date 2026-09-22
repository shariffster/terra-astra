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
  if(lat===33.875&&lon===128.125)return .040; // Korean / Kyushu offshore approach
  if(lat===29.875&&lon===124.125)return .040; // East China Sea
  if(lat===23.875&&lon===123.125)return .040; // East of Taiwan
  if(lat===-5.125&&lon===43.125)return .090; // East African offshore convergence
  if(lat===-36.125&&lon===19.125)return .100; // Cape, across the two ocean approaches
  if(lat===4.375&&lon===80.125)return .075; // South of Sri Lanka
  if(lat===11.875&&lon===63.125)return .085; // Arabian Sea shared stem
  if(lat===12.375&&lon===45.125)return .045; // Gulf of Aden
  if(lat===22.875&&lon===60.125)return .055; // Oman offshore
  if(lat===38.875&&lon===-70.875)return .070; // Western North Atlantic
  if(lat===-8.125&&lon===-31.875)return .085; // Northeastern Brazil offshore fan
  if(lat===13.875&&lon===-18.875)return .065; // West African approach
  return 0;
}
