import { getCards } from "@/lib/actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const cards = await getCards();
  return <DashboardView cards={cards} />;
}
