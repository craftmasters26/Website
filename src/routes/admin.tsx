import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Crown, Gift, Megaphone, Rocket, Server, Sword, Users, Wrench } from "lucide-react";
import { NotFound } from "@/components/not-found";
import { useAdminAccess } from "@/lib/admin-access";
import type { AdminCharacter, AdminLevel, AdminWeapon } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { BlacklistTab } from "@/components/admin/blacklist";
import { BroadcastTab } from "@/components/admin/broadcast";
import { CatalogTab } from "@/components/admin/catalog";
import { useAdminData } from "@/components/admin/data";
import { GiveTab } from "@/components/admin/give";
import { PremiumTab } from "@/components/admin/premium";
import { ServersTab } from "@/components/admin/servers";
import { SpawnsTab } from "@/components/admin/spawns";
import { ToolsTab } from "@/components/admin/tools";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin · BleachDex" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

type Tab = "servers" | "characters" | "weapons" | "spawns" | "give" | "premium" | "blacklist" | "message" | "tools";

const TABS: { id: Tab; label: string; icon: typeof Server; full?: boolean }[] = [
  { id: "servers", label: "Servers", icon: Server },
  { id: "characters", label: "Characters", icon: Users },
  { id: "weapons", label: "Weapons", icon: Sword },
  { id: "spawns", label: "Spawns", icon: Rocket },
  { id: "give", label: "Give", icon: Gift, full: true },
  { id: "premium", label: "Premium", icon: Crown, full: true },
  { id: "blacklist", label: "Blacklist", icon: Ban, full: true },
  { id: "message", label: "Message", icon: Megaphone, full: true },
  { id: "tools", label: "Tools", icon: Wrench, full: true },
];

function AdminPage() {
  const access = useAdminAccess();
  const [tab, setTab] = useState<Tab>("servers");
  const data = useAdminData(access.level);

  if (access.loading) {
    return (
      <main className="page-enter py-24 text-center font-mono text-[13px] text-bone-faint">
        Checking access…
      </main>
    );
  }
  // Looks like any other missing page to everyone who isn't on the bot's admin list.
  if (!access.level) return <NotFound />;

  const level: AdminLevel = access.level;
  const tabs = TABS.filter((t) => !t.full || level === "full");
  const guilds = data.guilds ?? [];

  return (
    <main className="page-enter py-12 md:py-20">
      <div className="wrap">
        <div className="kicker">Admin</div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-[34px] leading-tight md:text-[38px]">Control panel.</h1>
          <span className="rounded-full border border-line-bright px-3 py-1 font-mono text-[11.5px] text-bone-dim">
            {level === "full" ? "Full admin" : "Limited admin · spawn only"}
          </span>
        </div>

        <div className="-mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-2 border-b border-line">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-[13.5px] font-semibold",
                  tab === id
                    ? "border-azure-bright text-bone"
                    : "border-transparent text-bone-faint hover:text-bone",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "servers" ? (
          <ServersTab
            guilds={data.guilds}
            totalMembers={data.totalMembers}
            error={data.guildError}
            onReload={() => void data.loadGuilds()}
            canInvite={level === "full"}
          />
        ) : null}
        {tab === "characters" ? (
          <CatalogTab
            kind="character"
            level={level}
            rows={data.characters}
            setRows={data.setCharacters as never}
            guilds={guilds}
            meta={data.meta}
            error={data.catalogError}
          />
        ) : null}
        {tab === "weapons" ? (
          <CatalogTab
            kind="weapon"
            level={level}
            rows={data.weapons}
            setRows={data.setWeapons as never}
            guilds={guilds}
            meta={data.meta}
            error={data.catalogError}
          />
        ) : null}
        {tab === "spawns" ? <SpawnsTab guilds={guilds} meta={data.meta} /> : null}
        {tab === "give" ? (
          <GiveTab
            characters={(data.characters ?? []) as AdminCharacter[]}
            weapons={(data.weapons ?? []) as AdminWeapon[]}
            meta={data.meta}
          />
        ) : null}
        {tab === "blacklist" ? <BlacklistTab /> : null}
        {tab === "premium" ? <PremiumTab guilds={guilds} /> : null}
        {tab === "message" ? <BroadcastTab guilds={guilds} /> : null}
        {tab === "tools" ? (
          <ToolsTab
            characters={(data.characters ?? []) as AdminCharacter[]}
            weapons={(data.weapons ?? []) as AdminWeapon[]}
            meta={data.meta}
          />
        ) : null}
      </div>
    </main>
  );
}
