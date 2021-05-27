function intersection(a: string[], b: string[]): string[] {
  const x: string[] = [];
  const check = function (e: string) {
    if (~b.indexOf(e)) {
      x.push(e);
    }
  };

  a.forEach(check);
  return x;
}

/*
 * Return distinct elements from both input sets
 */
function union(a: string[], b: string[]): string[] {
  const x: string[] = [];
  const check = function (e: string) {
    if (!~x.indexOf(e)) {
      x.push(e);
    }
  };

  a.forEach(check);
  b.forEach(check);
  return x;
}

/*
 * Similarity
 */
export function jaccard(a: string[], b: string[]): number {
  return intersection(a, b).length / union(a, b).length;
}
