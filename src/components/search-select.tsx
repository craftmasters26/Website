import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; hint?: string };

/**
 * A dropdown with a search box on top — for the long lists in the admin panel
 * (servers, channels, characters…). Type to filter, tap to pick. Renders in a
 * portal so it never gets clipped by the card it sits in.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Choose…",
  searchPlaceholder = "Search…",
  emptyText = "No match.",
  disabled,
  loading,
  className,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-line-bright bg-void px-3.5 py-2.5 text-left text-[14px] outline-none focus:border-azure-bright disabled:cursor-not-allowed disabled:opacity-50",
            selected ? "text-bone" : "text-bone-faint",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {loading ? "Loading…" : selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-bone-faint" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[220px] overflow-hidden rounded-md border border-line-bright bg-void-raised shadow-2xl"
        >
          <Command
            // cmdk's default filter is fuzzy; we match on the label + hint text.
            filter={(itemValue, search) =>
              itemValue.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
            }
          >
            <Command.Input
              autoFocus
              placeholder={searchPlaceholder}
              className="w-full border-b border-line bg-transparent px-3.5 py-3 text-[14px] text-bone outline-none placeholder:text-bone-faint"
            />
            <Command.List className="max-h-64 overflow-y-auto overscroll-contain p-1">
              <Command.Empty className="px-3 py-6 text-center font-mono text-[12.5px] text-bone-faint">
                {emptyText}
              </Command.Empty>
              {options.map((o) => (
                <Command.Item
                  key={o.value}
                  value={`${o.label} ${o.hint ?? ""} ${o.value}`}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded px-3 py-2.5 text-[13.5px] text-bone-dim data-[selected=true]:bg-void-raised-2 data-[selected=true]:text-bone"
                >
                  <Check
                    className={cn("size-4 shrink-0", o.value === value ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint ? (
                    <span className="shrink-0 font-mono text-[11px] text-bone-faint">{o.hint}</span>
                  ) : null}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
