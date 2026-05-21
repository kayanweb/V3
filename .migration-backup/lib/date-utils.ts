export function safeToDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  return new Date();
}
