import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection, SUPPORT_URL } from "@/components/legal-page";
import { SITE_HOST } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · BleachDex" },
      {
        name: "description",
        content:
          "How BleachDex collects, uses and protects data, including Discord login, cookies and Google AdSense advertising.",
      },
    ],
  }),
  component: PrivacyPage,
});

const link = "text-azure-bright underline underline-offset-2 hover:text-bone";

function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy">
      <LegalSection heading="Who we are">
        <p>
          BleachDex is a Discord bot and companion website at {SITE_HOST}. This policy
          explains what information the website and bot collect, why, and the choices you have.
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <p>
          <strong className="text-bone">Discord login.</strong> If you log in with Discord, we
          receive your Discord user ID, username and avatar through Discord's OAuth. We do not
          receive your Discord password or your messages.
        </p>
        <p>
          <strong className="text-bone">Game data.</strong> The bot stores your Discord user ID and
          your in-game progress: collected souls, weapons, currency, teams, boss results and
          purchase status for Premium perks.
        </p>
        <p>
          <strong className="text-bone">Technical data.</strong> Our hosting provider (Vercel)
          and our database provider process standard request data such as IP address, browser type
          and pages visited, to deliver the site and keep it secure.
        </p>
        <p>
          <strong className="text-bone">Payments.</strong> Premium purchases are processed by Whop.
          We never see or store your card details; we only receive confirmation that a purchase
          was made for your Discord account.
        </p>
      </LegalSection>

      <LegalSection heading="How we use information">
        <p>
          To run the bot and website, show your collection after you log in, deliver Premium
          perks, prevent abuse, fix bugs, and keep the service funded through advertising.
        </p>
      </LegalSection>

      <LegalSection heading="Advertising and cookies">
        <p>
          We use Google AdSense to show ads. Google and its partners use cookies and similar
          technologies to serve ads based on your visits to this and other websites. Google's use
          of advertising cookies lets it and its partners serve ads to you based on your visit to
          our site and other sites on the internet.
        </p>
        <p>
          You can opt out of personalised advertising at{" "}
          <a className={link} href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">
            Google Ads Settings
          </a>{" "}
          or at{" "}
          <a className={link} href="https://www.aboutads.info" target="_blank" rel="noreferrer">
            aboutads.info
          </a>
          . To learn how Google uses data from sites that use its services, see{" "}
          <a
            className={link}
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noreferrer"
          >
            policies.google.com/technologies/partner-sites
          </a>
          .
        </p>
        <p>
          We also use essential cookies and local storage to keep you logged in. You can clear
          these in your browser at any time, but you will need to log in again.
        </p>
      </LegalSection>

      <LegalSection heading="Sharing">
        <p>
          We do not sell your personal information. We share data only with the services needed to
          operate BleachDex: Discord (login), Vercel (hosting), our database providers, Whop
          (payments) and Google (advertising), or when required by law.
        </p>
      </LegalSection>

      <LegalSection heading="Retention and deletion">
        <p>
          We keep game data while your account is active. To ask for your data to be deleted or
          exported, message us in the{" "}
          <a className={link} href={SUPPORT_URL} target="_blank" rel="noreferrer">
            support server
          </a>{" "}
          from the Discord account in question.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          BleachDex is not directed to children under 13, and Discord itself requires users to be
          at least 13. We do not knowingly collect data from children under 13.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update this policy. The date at the top shows the latest revision; continued use
          of the site means you accept the updated policy.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about privacy? Reach us in the{" "}
          <a className={link} href={SUPPORT_URL} target="_blank" rel="noreferrer">
            BleachDex support server
          </a>{" "}
          or on the <a className={link} href="/contact">Contact page</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
