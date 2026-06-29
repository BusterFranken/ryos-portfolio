import type { TimeRange } from "./constants";
import type { StockQuote } from "./types";

/**
 * STATIC BUILD: the `/api/stocks` backend proxy (Yahoo Finance) was removed,
 * so the stocks widget has no live data source. These functions resolve to
 * empty results instead of firing a request; the widget renders its empty
 * state. Signatures are preserved so the widget compiles unchanged.
 */

export async function fetchQuotes(_symbols: string[]): Promise<StockQuote[]> {
  return [];
}

export async function fetchChart(
  _symbol: string,
  _range: TimeRange
): Promise<{ history: number[]; timestamps: number[] }> {
  return { history: [], timestamps: [] };
}
