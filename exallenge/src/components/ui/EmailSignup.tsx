"use client";

import {
  type CSSProperties,
  type FormEvent,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { submitWaitlist } from "@/lib/tracking";

type EmailSignupProps = {
  source: string;
  className?: string;
  layout?: "stack" | "inline";
  submitLabel?: string;
};

type Status = "idle" | "loading" | "success" | "error";

const inputBaseStyle: CSSProperties = {
  boxSizing: "border-box",
  display: "block",
  width: "100%",
  height: 52,
  minHeight: 52,
  maxHeight: 52,
  margin: 0,
  padding: "0 18px",
  border: "2px solid #dbe7f5",
  borderRadius: 12,
  backgroundColor: "#ffffff",
  color: "#0B1020",
  WebkitTextFillColor: "#0B1020",
  caretColor: "#0B1020",
  fontSize: 16,
  fontWeight: 500,
  lineHeight: "normal",
  outline: "none",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
  WebkitAppearance: "none",
  appearance: "none",
};

const inputFocusStyle: CSSProperties = {
  border: "2px solid #4F9CF9",
  boxShadow:
    "0 0 0 4px rgba(79, 156, 249, 0.28), 0 8px 24px rgba(0, 0, 0, 0.25)",
};

export function EmailSignup({
  source,
  className = "",
  layout = "inline",
  submitLabel = "Get Free Access",
}: EmailSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const result = await submitWaitlist({ email, placement: source });
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      setMessage(
        result.message ??
          "Thanks — check your inbox. We'll send access instructions soon.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p
        className={`rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success ${className}`}
        role="status"
      >
        {message}
      </p>
    );
  }

  const isInline = layout === "inline";

  return (
    <form
      onSubmit={onSubmit}
      className={`${isInline ? "flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch" : "flex w-full flex-col gap-3"} ${className}`}
      noValidate
    >
      <style>{`
        #email-${source}::placeholder {
          color: #64748b;
          opacity: 1;
        }
        #email-${source}:-webkit-autofill,
        #email-${source}:-webkit-autofill:hover,
        #email-${source}:-webkit-autofill:focus {
          -webkit-text-fill-color: #0B1020;
          box-shadow: 0 0 0 1000px #ffffff inset, 0 8px 24px rgba(0, 0, 0, 0.25);
        }
      `}</style>
      <label className="sr-only" htmlFor={`email-${source}`}>
        Email address
      </label>
      <input
        id={`email-${source}`}
        type="email"
        name="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@email.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (status === "error") setStatus("idle");
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={isInline ? "sm:min-w-0 sm:flex-1" : undefined}
        style={{
          ...inputBaseStyle,
          ...(focused ? inputFocusStyle : null),
        }}
      />
      <Button
        type="submit"
        size="lg"
        disabled={status === "loading"}
        className={isInline ? "w-full shrink-0 sm:w-auto" : "w-full"}
      >
        {status === "loading" ? "Sending..." : submitLabel}
      </Button>
      {status === "error" ? (
        <p className="text-sm text-danger sm:basis-full" role="alert">
          {message}
        </p>
      ) : (
        <p className="text-xs text-muted sm:basis-full">
          Leave your email — we&apos;ll send access instructions.
        </p>
      )}
    </form>
  );
}
