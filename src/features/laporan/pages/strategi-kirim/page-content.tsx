"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form-field";
import { formatDate } from "@/lib/format";
import { monthLabel } from "../../model";
import { roleLabels } from "@/config/roles";
import { useReports } from "../../components/reports-provider";
import { ReportsLink } from "../../components/shared";
export function SendStrategyPage({ id }: { id: string }) {
  const { state, run, directory } = useReports();
  const strategyRecipients = directory.filter((row) => row.role !== "owner");
  const [recipients, setRecipients] = useState<string[]>(
    strategyRecipients.map((user) => user.id),
  );
  const strategy = state.strategies.find((strategy) => strategy.id === id);
  if (!strategy)
    return (
      <>
        <PageHeader title="Strategi tidak ditemukan" />
        <ReportsLink href="/laporan/strategi">
          Kembali ke daftar strategi
        </ReportsLink>
      </>
    );
  return (
    <>
      <PageHeader
        title="Kirim ke staf"
        description={`Strategi ${monthLabel(strategy.month)}`}
      />
      <div className="max-w-3xl space-y-4">
        <Card>
          <h2 className="mb-3 font-bold">Isi strategi</h2>
          <p className="text-sm leading-7 break-words whitespace-pre-wrap">
            {strategy.content}
          </p>
        </Card>
        {strategy.sentAt ? (
          <Card>
            <Alert tone="success" title="Pengiriman strategi tercatat">
              Simulasi dikirim ke {strategy.recipientIds.length} staf pada{" "}
              {formatDate(strategy.sentAt, true)}.
            </Alert>
            <ul className="my-4 space-y-2 text-sm">
              {strategyRecipients
                .filter((user) => strategy.recipientIds.includes(user.id))
                .map((user) => (
                  <li key={user.id}>
                    {user.name} · {roleLabels[user.role]}
                  </li>
                ))}
            </ul>
            <ReportsLink href="/laporan/strategi">
              Kembali ke daftar strategi
            </ReportsLink>
          </Card>
        ) : (
          <Card>
            <div className="space-y-3">
              {strategyRecipients.map((user) => (
                <Checkbox
                  key={user.id}
                  label={`${user.name} · ${roleLabels[user.role]}`}
                  checked={recipients.includes(user.id)}
                  onChange={(event) =>
                    setRecipients(
                      event.target.checked
                        ? [...recipients, user.id]
                        : recipients.filter((id) => id !== user.id),
                    )
                  }
                />
              ))}
            </div>
            <p className="text-muted mt-4 text-xs">
              Simulasi lokal; belum mengirim notifikasi ke akun staf.
            </p>
            <div className="border-border mt-5 flex flex-wrap items-center justify-end gap-4 border-t pt-4">
              <ReportsLink href="/laporan/strategi">Nanti saja</ReportsLink>
              <Button
                disabled={!recipients.length}
                onClick={async () =>
                  await run({
                    type: "send-strategy",
                    strategyId: id,
                    recipientIds: recipients,
                  })
                }
              >
                Kirim ke {recipients.length} staf
              </Button>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
