/** Shared offshore shoulders for the Japan–East Asia study.
 * Geographic illustrations, checked against the incumbent relief mask. */
type Location = readonly [number, number];
const japan: Location = [33.875,142.125];
const korea: Location = [33.875,128.125];
const shanghai: Location = [29.875,124.125];
const taiwan: Location = [23.875,123.125];
// Separate Pacific and East China Sea sides of Japan meet south of Kyushu.
export const japanSouth: readonly Location[] = [japan,[33.6,140],[33.3,138.4],[32.7,135.6],[31.8,133.3],[30.7,132.2],[30.2,130.8]];
export const kyushuWest: readonly Location[] = [[30.2,130.8],[30.4,129.8],[31.1,129.2],[32.125,129.125],[33,128.7],korea];
export const eastChina: readonly Location[] = [korea,[33.1,127.3],[32.3,126.1],[31.3,124.9],shanghai];
export const ryukyu: readonly Location[] = [[30.2,130.8],[29,129.4],[27.8,128.5],[26.5,127],[25.5,125],[24.6,123.8],taiwan];
export const taiwanNorth: readonly Location[] = [[25.375,121.625],[25.6,122.2],[25.5,123],[25.1,123.6],[24.6,123.8],taiwan];
export const eastAsiaSpines: readonly (readonly Location[])[] = [
 [...japanSouth,...kyushuWest.slice(1)],
 [...japanSouth,...ryukyu.slice(1)],
 eastChina,
 [shanghai,[28.5,124.1],[27,123.9],[25.5,123.4],[24.6,123.8],taiwan],
 [[35.125,139.625],[34.8,139.9],[34.1,140.3],[33.65,141],japan],
 [[38.125,141.125],[37.8,141.6],[36.8,142.2],[35.5,142.5],japan],
 [[34.625,137.375],[34.1,137.6],[33.5,138.4],[33.6,140],japan],
 [[34.125,134.875],[33.5,134.8],[32.7,135.6],[33.3,138.4],[33.6,140],japan],
 [[34.125,134.875],[33.5,134.8],[32.7,135.6],...japanSouth.slice(4),...kyushuWest.slice(1)],
 [[35.125,129.375],[34.7,129.4],[34.2,128.95],korea],
 [[33.875,130.375],[34.1,129.8],[34.1,129],[33.875,128.125]],
 [[26.125,127.625],[26.1,127.1],[25.5,125],[24.6,123.8],taiwan],
 taiwanNorth,
 [[27.625,121.125],[27.8,121.7],[28.4,122.6],[29.2,123.4],shanghai],
 [[25.875,119.875],[26.3,120.8],[27.1,122.1],[28.4,123.3],shanghai],
];
