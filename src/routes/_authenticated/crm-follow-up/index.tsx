import { ArrowRight, Megaphone, PhoneCall, Users } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { CrmFilters } from "@/components/crm-follow-up/CrmFilters";
import { CrmFollowUpTable } from "@/components/crm-follow-up/CrmFollowUpTable";
import { CrmStatsCards } from "@/components/crm-follow-up/CrmStatsCards";
import { Button } from "@/components/ui/button";
import { useCrmFollowUpStore } from "@/store/crmFollowUpStore";

export const Route = createFileRoute("/_authenticated/crm-follow-up/")({
  component: CrmFollowUpOverviewPage,
});

function CrmFollowUpOverviewPage() {
  const followUps = useCrmFollowUpStore((state) => state.followUps);
  const leads = useCrmFollowUpStore((state) => state.leads);

  const stats = useMemo(() => {
    const internal = followUps.filter((item) => item.sourceType === "INTERNAL").length;
    const external = followUps.filter((item) => item.sourceType === "EXTERNAL").length;
    const converted = leads.filter((lead) => lead.status === "Converted").length;

    return {
      internal,
      external,
      leads: leads.length,
      dueToday: followUps.filter((item) => item.nextDate && item.nextDate === new Date().toISOString().slice(0, 10)).length,
      overdue: followUps.filter((item) => item.status === "Pending" || item.status === "Scheduled").length,
      converted,
    };
  }, [followUps, leads]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <header className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CRM</p>
          <h1 className="mt-2 text-2xl font-semibold">Follow Up Module</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage internal follow-ups, external callbacks, and lead conversion in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/crm-follow-up/internal">
              <Users className="mr-2 h-4 w-4" />
              Internal
            </Link>
          </Button>
          <Button asChild>
            <Link to="/crm-follow-up/external">
              <PhoneCall className="mr-2 h-4 w-4" />
              External
            </Link>
          </Button>
        </div>
      </header>

      <CrmStatsCards {...stats} />
      <CrmFilters search="" onSearchChange={() => undefined} status="ALL" onStatusChange={() => undefined} />

      <div className="grid gap-4 lg:grid-cols-3">
        <LinkCard
          title="Internal Follow Up"
          description="Registered patients and in-house follow-ups handled from the hospital system."
          href="/crm-follow-up/internal"
          icon={<Users className="h-5 w-5" />}
        />
        <LinkCard
          title="External Follow Up"
          description="Excel-based and manually added external patient follow-ups and callbacks."
          href="/crm-follow-up/external"
          icon={<PhoneCall className="h-5 w-5" />}
        />
        <LinkCard
          title="Leads"
          description="Promotional leads and social media conversions tracked for patient engagement."
          href="/crm-follow-up/leads"
          icon={<Megaphone className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-medium">Recent follow-ups</h2>
            <p className="text-xs text-muted-foreground">Current CRM follow-up list with the same status pattern as the existing follow-up module.</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/crm-follow-up/internal">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="p-2">
          <CrmFollowUpTable source="INTERNAL" rows={followUps.slice(0, 4)} />
        </div>
      </div>
    </div>
  );
}

function LinkCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: React.ReactNode }) {
  return (
    <Link
      to={href}
      className="group block rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
