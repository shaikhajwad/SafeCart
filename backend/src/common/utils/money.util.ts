/**
 * Money utilities – amounts stored as integer minor units (paisa).
 * 1 BDT = 100 paisa
 */

export function bdtToPaisa(bdt: number): number {
  return Math.round(bdt * 100);
}

export function paisaToBdt(paisa: number): number {
  return paisa / 100;
}

export function formatBdt(paisa: number): string {
  return `৳${(paisa / 100).toFixed(2)}`;
}

export function addPaisa(a: number, b: number): number {
  return a + b;
}

export function subtractPaisa(a: number, b: number): number {
  return a - b;
}
