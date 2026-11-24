import { getSearchPages } from "../../config/navigation.ts";
import { canAccessPage } from "../../config/pages.ts";
import type { Role } from "@/config/roles";
import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
export type SearchResult = {
  id: string;
  label: string;
  description: string;
  href: string;
};
export function findSearchResults(
  role: Role,
  query: string,
  data?: { warehouse: WarehouseState; sales: SalesState },
): SearchResult[] {
  const term = query.trim().toLocaleLowerCase("id-ID");
  if (!term) return [];
  const results: SearchResult[] = getSearchPages(role, term)
    .filter((page) => !page.path.includes("["))
    .map((page) => ({
      id: page.id,
      label: page.title,
      description: "Halaman",
      href: page.path,
    }));
  const matches = (text: string) =>
    text.toLocaleLowerCase("id-ID").includes(term);
  if (data) {
    if (canAccessPage(role, "G10"))
      for (const item of data.warehouse.items)
        if (matches(`${item.id} ${item.category}`))
          results.push({
            id: `item-${item.id}`,
            label: item.id,
            description: `Barang · ${item.category}`,
            href: `/gudang/inventaris/${item.id}`,
          });
    if (canAccessPage(role, "P08") || canAccessPage(role, "D02"))
      for (const order of data.sales.orders)
        if (matches(order.id))
          results.push({
            id: `order-${order.id}`,
            label: order.id,
            description: "Pesanan",
            href: canAccessPage(role, "P08")
              ? `/penjualan/pesanan/${order.id}`
              : `/pengiriman/packing/${order.id}`,
          });
    if (canAccessPage(role, "P10"))
      for (const customer of data.sales.customers)
        if (matches(`${customer.name} ${customer.handle}`))
          results.push({
            id: `customer-${customer.id}`,
            label: customer.name,
            description: customer.handle,
            href: `/penjualan/pelanggan/${customer.id}`,
          });
    if (canAccessPage(role, "S03"))
      for (const location of data.warehouse.locations)
        if (matches(`${location.code} ${location.description}`))
          results.push({
            id: `location-${location.id}`,
            label: location.code,
            description: location.description,
            href: "/pengaturan/lokasi",
          });
  }
  return results.slice(0, 8);
}
