import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection, SUPPORT_URL } from "@/components/legal-page";
import { SITE_HOST } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · BleachDex" },
      {
        name: "description",
        content: "The rules for using the BleachDex Discord bot, website and Premium perks.",
      },
    ],
  }),
  component: TermsPage,
});

const link = "text-azure-bright underline underline-offset-2 hover:text-bone";

function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service">
      <LegalSection heading="Agreement">
        <p>
          By adding the BleachDex bot to a server or using {SITE_HOST} you agree to these
          terms and to Discord's Terms of Service and Community Guidelines. If you do not agree,
          do not use the service.
        </p>
      </LegalSection>

      <LegalSection heading="Fan project">
        <p>
          BleachDex is an unofficial fan project. Bleach and its characters belong to their
          respective owners, including Tite Kubo, Shueisha and Studio Pierrot. BleachDex is not
          affiliated with or endorsed by them.
        </p>
      </LegalSection>

      <LegalSection heading="Using the bot and site">
        <p>
          Do not exploit bugs, use scripts or self-bots to automate the game, trade game items for
          real money outside the official Premium options, or harass other players. We may reset
          progress, remove items or block accounts that break these rules.
        </p>
      </LegalSection>

      <LegalSection heading="Virtual items">
        <p>
          Souls, weapons, KAN and other in-game items are virtual, have no cash value, and remain
          the property of BleachDex. We may rebalance, change or remove items at any time.
        </p>
      </LegalSection>

      <LegalSection heading="Premium purchases">
        <p>
          Premium tiers are sold through Whop and are subject to Whop's terms. Perks apply to the
          Discord account used at checkout and may change over time. Refund requests are handled
          according to Whop's refund policy; contact us in the{" "}
          <a className={link} href={SUPPORT_URL} target="_blank" rel="noreferrer">
            support server
          </a>{" "}
          if something went wrong with a purchase.
        </p>
      </LegalSection>

      <LegalSection heading="Advertising">
        <p>
          The website shows ads served by Google AdSense. See our{" "}
          <a className={link} href="/privacy">Privacy Policy</a> for details.
        </p>
      </LegalSection>

      <LegalSection heading="No warranty">
        <p>
          The service is provided "as is" without warranties of any kind. We do not guarantee
          uptime, and we are not liable for lost progress, downtime or any indirect damages to the
          fullest extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and termination">
        <p>
          We may update these terms or stop the service at any time. We may suspend access for
          anyone who breaks these terms. Continued use after changes means you accept them.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions? Visit the <a className={link} href="/contact">Contact page</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
