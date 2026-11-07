import { createFileRoute } from "@tanstack/react-router";
import { jsonLd, seo } from "@/lib/seo";
import { CHANGELOG } from "@/data/changelog";

export const Route = createFileRoute("/bleachdex/updates")({
  head: () => ({
    ...seo({
      title: "BleachDex updates: what's new",
      description: "Recent changes to the BleachDex bot and website, newest first.",
      path: "/bleachdex/updates",
    }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "BleachDex updates",
        itemListElement: CHANGELOG.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.title,
        })),
      }),
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  return (
    <main className="page-enter py-16 md:py-20">
      <div className="wrap max-w-3xl">
        <p className="eyebrow">Updates</p>
        <h1 className="mt-2 font-serif text-[40px] leading-tight md:text-[48px]">What's new</h1>
        <p className="lede mt-4">The latest changes to BleachDex and this site, newest first.</p>
        <ol className="mt-10 space-y-6">
          {CHANGELOG.map((entry) => (
            <li key={entry.date + entry.title} className="panel p-6">
              <time dateTime={entry.date} className="font-mono text-[12px] text-ember-bright">
                {new Date(entry.date + "T00:00:00Z").toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
              <h2 className="mt-1 text-[20px] font-bold text-bone">{entry.title}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14.5px] leading-6 text-bone-dim">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
