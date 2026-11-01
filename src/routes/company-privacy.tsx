import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BOUNDLESS_DISCORD,
  CompanyLegalPage,
  LegalSection,
  companyLink,
} from "@/components/company-legal";

export const Route = createFileRoute("/company-privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Boundless Production" },
      {
        name: "description",
        content: "How the Boundless Production website handles information.",
      },
    ],
  }),
  component: CompanyPrivacy,
});

function CompanyPrivacy() {
  return (
    <CompanyLegalPage title="Privacy Policy">
      <LegalSection heading="What this policy covers">
        <p>
          This policy covers the Boundless Production company website: the home, what we make,
          games, bots, projects and contact pages. It does not cover our products. Each product
          has its own privacy policy. BleachDex’s policy is at{" "}
          <Link to="/privacy" className={companyLink}>
            its Privacy Policy page
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <p>
          The company pages have no accounts, sign-in or forms, so we do not ask you for personal
          information here. Like most websites, our hosting provider may keep standard server logs
          (such as IP address, browser type, the pages requested and the time) to run and secure the
          site.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and advertising">
        <p>
          Google AdSense ads appear on almost all pages of this website. Google and its advertising
          partners may use cookies or similar identifiers to show and measure ads, including ads
          based on your earlier visits to this and other sites. You can manage ad personalisation in
          your Google ad settings, and control cookies in your browser settings.
        </p>
        <p>
          The same applies to our product websites, such as BleachDex, which are covered by their
          own privacy policies.
        </p>
      </LegalSection>

      <LegalSection heading="Links to other sites">
        <p>
          We link to Discord, YouTube, TikTok and Instagram. Those services collect their own data
          under their own privacy policies, and we are not responsible for how they handle it.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          The website is not directed at children under 13, and we do not knowingly collect
          information from them.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update this policy. The date at the top shows when it last changed, and the new
          version applies once it is posted here.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this policy? Message us in our{" "}
          <a href={BOUNDLESS_DISCORD} target="_blank" rel="noreferrer" className={companyLink}>
            Discord server
          </a>
          .
        </p>
      </LegalSection>
    </CompanyLegalPage>
  );
}
