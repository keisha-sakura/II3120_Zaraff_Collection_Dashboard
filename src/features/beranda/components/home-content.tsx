import type { HomeDashboardData } from "../contracts";
import { OwnerHomePage } from "../pages/owner/page-content";
import { AdminHomePage } from "../pages/admin/page-content";
import { SorterHomePage } from "../pages/penyortir/page-content";
import { PackingHomePage } from "../pages/packing/page-content";
import { HostHomePage } from "../pages/live-host/page-content";

/** Render only the selected role; other role payloads never become client props. */
export function HomeContent({ data }: { data: HomeDashboardData }) {
  switch (data.role) {
    case "owner":
      return <OwnerHomePage data={data} />;
    case "admin":
      return <AdminHomePage data={data} />;
    case "penyortir":
      return <SorterHomePage data={data} />;
    case "packing":
      return <PackingHomePage data={data} />;
    case "live-host":
      return <HostHomePage data={data} />;
  }
}
