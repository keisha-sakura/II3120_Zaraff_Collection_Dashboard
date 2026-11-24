import { SortItemPage } from "../sortir-item/page-content";
export function SortReturnPage({ id }: { id: string }) {
  return <SortItemPage id={id} initialReturn />;
}
