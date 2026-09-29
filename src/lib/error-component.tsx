import type { ErrorComponentProps } from "@tanstack/react-router";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <main className="wrap py-24 text-center">
      <h1 className="font-serif text-[34px] text-bone">Something went wrong</h1>
      <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-6 text-bone-dim">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <button type="button" className="btn btn-outline mt-8 px-6 py-3 text-sm" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
