"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { subscribeToOpeningList } from "@/lib/api/subscribe";
import { siteConfig } from "@/lib/config/site";

type Status = "idle" | "loading" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!EMAIL_PATTERN.test(email)) {
      setError("Enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    const result = await subscribeToOpeningList(email);

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setError(result.message ?? "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="font-body max-w-sm text-lg font-light text-secondary-light">
        You&apos;re on the list. We&apos;ll let you know first.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <input
            id={inputId}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === "error") setStatus("idle");
            }}
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? errorId : undefined}
            placeholder="Your email address"
            className="w-full border-b border-secondary/40 bg-transparent py-3 font-body text-base text-text placeholder:text-muted focus:border-secondary-light focus:outline-none sm:min-w-[320px]"
          />
          {status === "error" && error ? (
            <p id={errorId} role="alert" className="mt-2 text-sm text-secondary-light">
              {error}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Notify Me"}
        </Button>
      </form>

      {siteConfig.social.whatsapp ? (
        <a
          href={siteConfig.social.whatsapp}
          className="font-display mt-6 inline-block text-xs uppercase tracking-widest2 text-muted transition-colors hover:text-secondary-light"
          data-cursor="link"
        >
          Or reach us on WhatsApp
        </a>
      ) : null}
    </div>
  );
}
