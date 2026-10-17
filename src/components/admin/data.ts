import { useCallback, useEffect, useState } from "react";
import {
  adminListCharacters,
  adminListGuilds,
  adminRequest,
  type AdminCharacter,
  type AdminGuild,
  type AdminLevel,
  type AdminMeta,
  type AdminWeapon,
} from "@/lib/admin";
import { failureText } from "./ui";

/** Everything the admin tabs share, loaded once when the panel opens. */
export function useAdminData(level: AdminLevel | null) {
  const [guilds, setGuilds] = useState<AdminGuild[] | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [guildError, setGuildError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<AdminCharacter[] | null>(null);
  const [weapons, setWeapons] = useState<AdminWeapon[] | null>(null);
  const [meta, setMeta] = useState<AdminMeta | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const loadGuilds = useCallback(async () => {
    setGuildError(null);
    try {
      const r = await adminListGuilds();
      if (r.status === "ok") {
        setGuilds(r.data.guilds);
        setTotalMembers(r.data.total_members);
      } else {
        setGuildError(failureText(r));
      }
    } catch {
      setGuildError("The request failed.");
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalogError(null);
    try {
      const [c, w, m] = await Promise.all([
        adminListCharacters(),
        adminRequest<{ weapons: AdminWeapon[] }>("/internal/admin/weapons"),
        adminRequest<AdminMeta>("/internal/admin/meta"),
      ]);
      if (c.status === "ok") setCharacters(c.data.characters);
      else setCatalogError(failureText(c));
      if (w.status === "ok") setWeapons(w.data.weapons);
      else setCatalogError(failureText(w));
      if (m.status === "ok") setMeta(m.data);
    } catch {
      setCatalogError("The request failed.");
    }
  }, []);

  useEffect(() => {
    if (!level) return;
    void loadGuilds();
    void loadCatalog();
  }, [level, loadGuilds, loadCatalog]);

  return {
    guilds,
    totalMembers,
    guildError,
    loadGuilds,
    characters,
    setCharacters,
    weapons,
    setWeapons,
    meta,
    catalogError,
    loadCatalog,
  };
}

export type AdminData = ReturnType<typeof useAdminData>;
