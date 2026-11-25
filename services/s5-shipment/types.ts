import type { Shipment, ShipmentEvent } from "@prisma/client";
export type ShipmentStatus = "diserahkan" | "dalam perjalanan" | "diterima";
export type ShipmentDetail = Shipment & { events: ShipmentEvent[] };
export const SHIPMENT_TRANSITIONS: Record<
  ShipmentStatus,
  readonly ShipmentStatus[]
> = {
  diserahkan: ["dalam perjalanan"],
  "dalam perjalanan": ["diterima"],
  diterima: [],
};
