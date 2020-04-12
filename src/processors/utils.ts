export function vectorsEqual(v1: string[], v2: string[]): boolean {
  if (v1.length !== v2.length) return false;
  v1 = v1.sort();
  v2 = v2.sort();
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] !== v2[i]) return false;
  }
  return true;
}
