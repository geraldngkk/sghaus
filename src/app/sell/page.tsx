import Header from "@/components/header";
import Footer from "@/components/footer";

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <Header activeNav="sell" />

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-5 py-20 text-center sm:px-10">
          <h1
            className="font-display text-3xl text-charcoal sm:text-4xl"
            style={{ lineHeight: 1.2 }}
          >
            Seller tools are coming soon.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate leading-relaxed">
            We&rsquo;re building a pricing tool for HDB sellers — same
            data-backed approach, designed to help you price your flat right.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
