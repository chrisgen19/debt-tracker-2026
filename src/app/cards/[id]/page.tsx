import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { CardDetailView } from "@/components/cards/card-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CardDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;

  const card = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
    include: {
      overrides: { orderBy: { monthNumber: "asc" } },
      statements: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });

  if (!card) notFound();

  return <CardDetailView card={card} />;
}
