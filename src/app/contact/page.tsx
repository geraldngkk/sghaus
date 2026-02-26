"use client";

import { useState } from "react";
import { submitContactForm } from "@/actions/contact";
import Header from "@/components/header";
import Footer from "@/components/footer";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");

    const result = await submitContactForm(name, email, message);

    if (result.success) {
      setState("success");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setState("error");
      setErrorMsg(result.error || "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-fog">
      <Header activeNav="contact" />

      <div className="mx-auto w-full max-w-[720px] flex-1 px-5 py-16 sm:px-10 sm:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest">Contact</p>
        <h1
          className="mt-2 font-display text-3xl text-charcoal sm:text-4xl"
          style={{ lineHeight: 1.15 }}
        >
          Get in touch
        </h1>
        <p className="mt-4 text-base text-slate leading-relaxed" style={{ maxWidth: "50ch" }}>
          Have a question, feedback, or partnership enquiry? We&apos;d love to hear from you.
        </p>

        <div className="mt-10" style={{ maxWidth: "480px" }}>
          {state === "success" ? (
            <div className="rounded-xl border border-meadow/40 bg-mist/30 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white text-xl">
                &#10003;
              </div>
              <h2 className="mt-4 font-display text-xl text-charcoal">Message sent</h2>
              <p className="mt-2 text-sm text-slate">
                Thanks for reaching out. We&apos;ll get back to you as soon as we can.
              </p>
              <button
                onClick={() => setState("idle")}
                className="mt-6 text-sm font-medium text-forest transition-colors hover:text-forest/80"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-charcoal">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-charcoal">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
              </div>

              {state === "error" && errorMsg && (
                <p className="text-sm text-[#EF4444]">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={state === "submitting"}
                className="rounded-[10px] bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-forest/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {state === "submitting" ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
