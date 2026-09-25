import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="page-enter flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="kicker">Lost soul</p>
      <h1 className="mt-2 font-serif text-6xl text-bone">404</h1>
      <p className="mt-3 max-w-md text-[15px] text-bone-dim">
        This soul wandered off. The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn btn-fill mt-8">
        Back to BleachDex
      </Link>
    </main>
  );
}
