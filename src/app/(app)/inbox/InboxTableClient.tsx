"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-display/DataTable";
import type { Ping402SvmNetwork } from "@/lib/solana/chain";
import { isSolanaTxSignature, solanaExplorerTxUrl } from "@/lib/solana/explorer";

type Status = "new" | "replied" | "archived";

type InboxMessage = {
  _id: string;
  createdAt: number;
  tier: "standard" | "priority" | "vip";
  payer: string;
  senderName?: string | null;
  senderContact?: string | null;
  body: string;
  status: "pending" | "new" | "replied" | "archived";
  paymentTxSig?: string | null;
};

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

export function InboxTableClient({
  messages,
  status,
  networkId,
  setStatusAction,
  initialSearch,
}: {
  messages: InboxMessage[];
  status: Status;
  networkId: Ping402SvmNetwork;
  setStatusAction: (formData: FormData) => Promise<void>;
  initialSearch?: string;
}) {
  const sorting = useMemo<SortingState>(() => [{ id: "createdAt", desc: true }], []);

  const columns = useMemo<ColumnDef<InboxMessage, unknown>[]>(() => {
    return [
      {
        id: "tier",
        accessorKey: "tier",
        header: "Tier",
        meta: { csvHeader: "Tier" },
        cell: ({ row }) => <Badge variant="secondary">{row.original.tier}</Badge>,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "When",
        meta: { csvHeader: "When" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatWhen(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "payer",
        accessorKey: "payer",
        header: "Payer",
        meta: { csvHeader: "Payer" },
        cell: ({ row }) => (
          <span className="font-mono text-xs">{shortAddress(row.original.payer)}</span>
        ),
      },
      {
        id: "from",
        header: "From",
        meta: { csvHeader: "From" },
        accessorFn: (row) => row.senderName || row.senderContact || "Anonymous",
        cell: ({ row }) => (
          <div className="min-w-[10rem]">
            {row.original.senderName ? (
              <div className="text-sm font-medium">{row.original.senderName}</div>
            ) : (
              <div className="text-sm text-muted-foreground">Anonymous</div>
            )}
            {row.original.senderContact ? (
              <div className="text-xs text-muted-foreground">{row.original.senderContact}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: "body",
        accessorKey: "body",
        header: "Message",
        meta: { csvHeader: "Message" },
        cell: ({ row }) => (
          <div className="max-w-[28rem] whitespace-pre-wrap text-sm leading-relaxed">
            {row.original.body}
          </div>
        ),
      },
      {
        id: "receipt",
        header: "Receipt",
        meta: { csvHeader: "Receipt tx" },
        accessorFn: (row) => row.paymentTxSig ?? "",
        cell: ({ row }) => {
          const sig = row.original.paymentTxSig ?? null;
          if (!sig) return <span className="text-muted-foreground">Settling…</span>;

          if (isSolanaTxSignature(sig)) {
            return (
              <Link
                className="whitespace-nowrap font-mono text-xs text-primary underline-offset-4 hover:underline"
                href={solanaExplorerTxUrl(sig, networkId)}
                target="_blank"
                rel="noreferrer"
              >
                {shortAddress(sig)}
              </Link>
            );
          }

          return <span className="font-mono text-xs text-muted-foreground">{shortAddress(sig)}</span>;
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        meta: { csvExport: false },
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/inbox/${encodeURIComponent(row.original._id)}`}>Open</Link>
            </Button>
            {row.original.status !== "replied" ? (
              <form action={setStatusAction}>
                <input type="hidden" name="messageId" value={row.original._id} />
                <input type="hidden" name="nextStatus" value="replied" />
                <input type="hidden" name="tab" value={status} />
                {initialSearch ? <input type="hidden" name="q" value={initialSearch} /> : null}
                <Button type="submit" size="sm">
                  Reply
                </Button>
              </form>
            ) : null}
            {row.original.status !== "archived" ? (
              <form action={setStatusAction}>
                <input type="hidden" name="messageId" value={row.original._id} />
                <input type="hidden" name="nextStatus" value="archived" />
                <input type="hidden" name="tab" value={status} />
                {initialSearch ? <input type="hidden" name="q" value={initialSearch} /> : null}
                <Button type="submit" size="sm" variant="secondary">
                  Archive
                </Button>
              </form>
            ) : null}
          </div>
        ),
      },
    ];
  }, [initialSearch, networkId, setStatusAction, status]);

  const searchFn = useMemo(() => {
    return (row: InboxMessage, query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const from = `${row.senderName ?? ""} ${row.senderContact ?? ""}`.toLowerCase();
      return (
        row.body.toLowerCase().includes(q) ||
        row.payer.toLowerCase().includes(q) ||
        row.tier.toLowerCase().includes(q) ||
        from.includes(q) ||
        (row.paymentTxSig ?? "").toLowerCase().includes(q)
      );
    };
  }, []);

  return (
    <DataTable
      data={messages}
      columns={columns}
      initialSorting={sorting}
      initialSearch={initialSearch ?? ""}
      searchPlaceholder="Search payer, sender, body, or receipt…"
      searchFn={searchFn}
      csv={{
        filename: `inbox-${status}.csv`,
        getCellValue: (row, columnId) => {
          if (columnId === "createdAt") return formatWhen(row.createdAt);
          if (columnId === "from") return row.senderName || row.senderContact || "Anonymous";
          if (columnId === "receipt") return row.paymentTxSig ?? "";
          return (row as unknown as Record<string, unknown>)[columnId];
        },
      }}
    />
  );
}
