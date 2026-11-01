<<<<<<< HEAD
import { createFileRoute, redirect } from "@tanstack/react-router";
=======
import { createFileRoute } from "@tanstack/react-router";
import { ABOUT_TEXT, BpLayout, PageHead } from "@/components/bp-layout";
>>>>>>> 1b6b405a67324b36d9de831190e529232c97c2c5

// The About page was folded into the home page.
export const Route = createFileRoute("/about")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
<<<<<<< HEAD
=======

function About() {
  return (
    <BpLayout>
      <PageHead kicker="About" title="Boundless Production">
        {ABOUT_TEXT}
      </PageHead>
    </BpLayout>
  );
}
>>>>>>> 1b6b405a67324b36d9de831190e529232c97c2c5
