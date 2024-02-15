import { Position } from 'geojson';

/**
 * Returns the distance between two coordinates in miles (or optionally kms or nautical miles).
 */
export function distanceBetweenCoordinates(x: Position, y: Position, unit?: 'K' | 'N'): number {
  if (x[0] === y[0] && x[1] === y[1]) {
    return 0;
  } else {
    const radlat1 = (Math.PI * x[0]) / 180;
    const radlat2 = (Math.PI * y[0]) / 180;
    const theta = x[1] - y[1];
    const radtheta = (Math.PI * theta) / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'K') {
      dist = dist * 1.609344;
    }
    if (unit === 'N') {
      dist = dist * 0.8684;
    }
    return dist;
  }
}
