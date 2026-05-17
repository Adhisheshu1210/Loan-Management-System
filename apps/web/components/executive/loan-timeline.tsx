"use client";

export type LoanTimelineEvent = {
  at: string;
  type: string;
  actor?: string;
  note?: string;
  amount?: number;
  utrNumber?: string;
  transactionReference?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  balanceAfter?: number | null;
};

type LoanTimelineProps = {
  events?: LoanTimelineEvent[];
  emptyText?: string;
};

export function LoanTimeline({ events = [], emptyText = "No timeline available yet." }: LoanTimelineProps) {
  if (!events.length) {
    return <p className="text-xs text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="mt-3 rounded-xl border bg-background/70 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Loan Timeline</p>
      <div className="mt-2 grid gap-2">
        {events.map((event, index) => (
          <div key={`${event.type}-${index}`} className="rounded-lg border bg-secondary/20 p-2 text-xs">
            <p className="font-medium">{event.type.replaceAll("_", " ")}</p>
            <p className="text-muted-foreground">{new Date(event.at).toLocaleString()} · {event.actor ?? "System"}</p>
            {event.fromStatus || event.toStatus ? (
              <p className="text-muted-foreground">Status: {event.fromStatus ?? "-"} → {event.toStatus ?? "-"}</p>
            ) : null}
            {event.note ? <p className="text-muted-foreground">{event.note}</p> : null}
            {typeof event.amount === "number" ? <p className="text-muted-foreground">Amount: ₹{event.amount.toLocaleString()}</p> : null}
            {event.utrNumber ? <p className="text-muted-foreground">UTR: {event.utrNumber}</p> : null}
            {event.transactionReference ? <p className="text-muted-foreground">Reference: {event.transactionReference}</p> : null}
            {typeof event.balanceAfter === "number" ? <p className="text-muted-foreground">Balance: ₹{event.balanceAfter.toLocaleString()}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}