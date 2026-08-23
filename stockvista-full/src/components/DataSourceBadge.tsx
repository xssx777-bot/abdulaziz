import type { DataSource } from '@/lib/config';

/**
 * Marks where the numbers beside it came from.
 *
 * Sample prices are indistinguishable from real ones on screen, and on a
 * trading screen that is not a cosmetic problem — so the sample state is
 * always labelled, and a failed live call says why rather than failing quietly.
 */
export default function DataSourceBadge({
  source,
  warning,
}: {
  source: DataSource;
  warning?: string;
}) {
  if (source === 'live' && !warning) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
      title={warning ?? 'Sample data — no market data provider is configured.'}
    >
      <span aria-hidden="true">●</span>
      Sample data
    </span>
  );
}
