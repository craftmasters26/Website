import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection, SUPPORT_URL } from "@/components/legal-page";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · BleachDex" },
      {
        name: "description",
        content: "Get help with BleachDex, report a bug, or ask about privacy and purchases.",
      },
    ],
  }),
  component: ContactPage,
});

const link = "text-azure-bright underline underline-offset-2 hover:text-bone";

function ContactPage() {
  return (
    <LegalPage eyebrow="Support" title="Contact">
      <LegalSection heading="Fastest way to reach us">
        <p>
          Join the{" "}
          <a className={link} href={SUPPORT_URL} target="_blank" rel="noreferrer">
            BleachDex support server on Discord
          </a>{" "}
          and post in the support channel or open a ticket. That is where we answer bug reports,
          purchase issues, data deletion requests and general questions.
        </p>
      </LegalSection>

      <LegalSection heading="What to include">
        <p>
          Tell us your Discord username, what you expected to happen, what happened instead, and a
          screenshot if you have one. For purchase problems, include the email or receipt shown on
          your Whop order.
        </p>
      </LegalSection>

      <LegalSection heading="Policies">
        <p>
          Read our <a className={link} href="/privacy">Privacy Policy</a> and{" "}
          <a className={link} href="/terms">Terms of Service</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
