import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BOUNDLESS_DISCORD,
  CompanyLegalPage,
  LegalSection,
  companyLink,
} from "@/components/company-legal";

export const Route = createFileRoute("/company-terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Boundless Production" },
      {
        name: "description",
        content: "The terms for using the Boundless Production website.",
      },
    ],
  }),
  component: CompanyTerms,
});

function CompanyTerms() {
  return (
    <CompanyLegalPage title="Terms of Service">
      <LegalSection heading="What these terms cover">
        <p>
          These terms cover your use of the Boundless Production company website. Our products have
          their own terms. BleachDex’s terms are on{" "}
          <Link to="/bleachdex/terms" className={companyLink}>
            its Terms of Service page
          </Link>
          . By using this website you agree to these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Using the website">
        <p>
          You may browse the website for your own personal use. Do not try to break, overload or
          gain unauthorised access to the site, and do not use it for anything unlawful.
        </p>
      </LegalSection>

      <LegalSection heading="Our content">
        <p>
          The Boundless Production name, logo, text and design on this website belong to Boundless
          Production. Please do not copy or reuse them without our permission.
        </p>
      </LegalSection>

      <LegalSection heading="Links to other sites">
        <p>
          The website links to services we do not run, such as Discord, YouTube, TikTok and
          Instagram. Their own terms apply when you use them, and we are not responsible for their
          content.
        </p>
      </LegalSection>

      <LegalSection heading="No warranty">
        <p>
          The website is provided as is, without promises that it will always be available or free
          of errors. Information about upcoming games and bots may change.
        </p>
      </LegalSection>

      <LegalSection heading="Limit of liability">
        <p>
          To the extent the law allows, Boundless Production is not liable for losses that come from
          using, or being unable to use, this website.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update these terms. The date at the top shows when they last changed, and using
          the website after that means you accept the new version.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms? Message us in our{" "}
          <a href={BOUNDLESS_DISCORD} target="_blank" rel="noreferrer" className={companyLink}>
            Discord server
          </a>
          .
        </p>
      </LegalSection>
    </CompanyLegalPage>
  );
}
