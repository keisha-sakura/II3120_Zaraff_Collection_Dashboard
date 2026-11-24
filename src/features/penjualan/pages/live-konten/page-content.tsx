"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
} from "@/components/ui/form-field";
import { liveHosts, promotionChannels } from "../../model";
import { useSales } from "../../components/sales-provider";
import { LiveSteps, CancelDraft, toWibInput } from "../../components/shared";
export function LiveContentPage() {
  const { state, run, go } = useSales();
  const draft = state.draft;
  const [channels, setChannels] = useState<string[]>(
    draft?.promotionChannels ?? [],
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (
      run({
        type: "save-content",
        input: {
          title: String(values.get("title")),
          content: String(values.get("content")),
          scheduledAt: `${values.get("scheduled")}+07:00`,
          hostId: String(values.get("host")),
          promotionChannels: channels,
        },
      })
    )
      go("/penjualan/live/baru/barang");
  }
  return (
    <>
      <PageHeader title="Jadwalkan live" />
      <LiveSteps step="content" />
      <Card className="max-w-4xl">
        <form onSubmit={submit} className="space-y-5">
          <FormField id="live-title" label="Judul">
            <Input
              id="live-title"
              name="title"
              defaultValue={draft?.title}
              required
              minLength={3}
              maxLength={150}
            />
          </FormField>
          <FormField id="live-content" label="Isi promosi">
            <Textarea
              id="live-content"
              name="content"
              defaultValue={draft?.content}
              required
              minLength={3}
              maxLength={5000}
            />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="live-scheduled" label="Tanggal dan jam (WIB)">
              <Input
                id="live-scheduled"
                name="scheduled"
                type="datetime-local"
                defaultValue={toWibInput(draft?.scheduledAt ?? "")}
                required
              />
            </FormField>
            <FormField id="live-platform" label="Platform live">
              <Select id="live-platform" defaultValue="tiktok">
                <option value="tiktok">TikTok Live</option>
              </Select>
            </FormField>
          </div>
          <FormField id="live-host" label="Host">
            <Select
              id="live-host"
              name="host"
              defaultValue={draft?.hostId ?? liveHosts[0].id}
            >
              {liveHosts.map((host) => (
                <option key={host.id} value={host.id}>
                  {host.name}
                </option>
              ))}
            </Select>
          </FormField>
          <fieldset>
            <legend className="mb-3 font-semibold">
              Kanal publikasi promosi
            </legend>
            <div className="flex flex-wrap gap-5">
              {promotionChannels.map((channel) => (
                <Checkbox
                  key={channel}
                  label={channel}
                  checked={channels.includes(channel)}
                  onChange={(event) =>
                    setChannels(
                      event.target.checked
                        ? [...channels, channel]
                        : channels.filter((value) => value !== channel),
                    )
                  }
                />
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap justify-end gap-3">
            <CancelDraft />
            <Button type="submit">Lanjut pilih barang</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
