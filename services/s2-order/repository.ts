import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;
const client = (tx?: Writer) => tx ?? db;

export const orderRepository = {
  findById: (id: string, tx?: Writer) =>
    client(tx).order.findUnique({
      where: { id },
      include: { items: true },
    }),

  list: (where: Record<string, unknown>) =>
    db.order.findMany({
      where,
      include: { items: true },
      orderBy: { dibuatPada: "desc" },
    }),

  create: (
    data: { customerId: string; status: string; subtotal: number; diskon: number; total: number; sumber: string },
    tx?: Writer,
  ) => client(tx).order.create({ data, include: { items: true } }),

  addItem: (data: { orderId: string; itemId: string; kode: string; harga: number }, tx?: Writer) =>
    client(tx).orderItem.create({ data }),

  updateStatus: (id: string, status: string, tx?: Writer) =>
    client(tx).order.update({ where: { id }, data: { status } }),

  updateTotals: (id: string, data: { subtotal: number; diskon: number; total: number }, tx?: Writer) =>
    client(tx).order.update({ where: { id }, data }),
};
