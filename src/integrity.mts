// Canonical JSON and SHA-256 extracted from bu08_worker/src/store.ts.
type JsonValue = null | boolean | number | string | JsonValue[] | {[key: string]: JsonValue};

const encoder = new TextEncoder();

export async function hash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
}
export function canonical(value: JsonValue): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}
