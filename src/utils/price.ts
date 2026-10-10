export function parsePrice(text: string): number {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(value)) throw new Error(`Cannot parse price from "${text}"`);
  return value;
}

export const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);
