"use client";

import { useTranslation, Trans } from "react-i18next";
import Link from "next/link";
import LiveInvoiceTicker from "@/components/LiveInvoiceTicker";

const HERO_STYLE = `
@keyframes heroFadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: no-preference) {
  .hero-animate {
    animation: heroFadeInUp 600ms ease both;
  }
}
`;

export default function Hero() {
  const { t } = useTranslation();

  return (
    <header className="pt-32 pb-20 px-8 bg-primary-container relative overflow-hidden">
      <style>{HERO_STYLE}</style>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="z-10">
          <div className="hero-animate inline-flex items-center gap-2 px-3 py-1 bg-surface-container-lowest/20 rounded-full text-xs font-bold text-on-primary-container mb-6 tracking-wide uppercase" style={{ animationDelay: "0ms" }}>
            <span className="material-symbols-outlined text-[14px]">sensors</span>
            {t("landing.testnetLive")}
          </div>
          <h1 className="hero-animate text-5xl lg:text-7xl font-medium text-on-primary-container leading-[1.1] mb-6 font-headline" style={{ animationDelay: "200ms" }}>
            <Trans i18nKey="landing.heroTitle" components={{ strong: <strong /> }} />
          </h1>
          <p className="hero-animate text-lg text-on-primary-container/80 max-w-xl mb-10 leading-relaxed font-body" style={{ animationDelay: "400ms" }}>
            {t("landing.heroSubtitle")}
          </p>
          <div className="hero-animate flex flex-wrap gap-4 mb-12" style={{ animationDelay: "600ms" }}>
            <Link href="/submit" className="bg-primary text-surface-container-lowest px-8 py-4 rounded-lg font-bold flex items-center gap-2 hover:translate-y-[-2px] transition-transform">
              {t("landing.submitInvoice")}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link href="/lp" className="border-2 border-outline-variant/40 text-on-primary-container px-8 py-4 rounded-lg font-bold hover:bg-surface-container-lowest/10 transition-colors">
              {t("landing.fundAsLP")}
            </Link>
          </div>
          <div className="hero-animate" style={{ animationDelay: "800ms" }}>
            <LiveInvoiceTicker />
          </div>
          <div className="hero-animate flex items-center gap-8 text-on-primary-container/60" style={{ animationDelay: "1000ms" }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {t("landing.builtOnStellar")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">code</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {t("landing.openSource")}
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="bg-surface-container-lowest/10 backdrop-blur-sm p-12 rounded-xl border border-outline-variant/20">
            <img
              className="rounded-lg shadow-2xl opacity-90 mix-blend-multiply"
              alt="abstract architectural visualization"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqIlwNMuQ-0dagaVXApB3Co1ckArbWO9b1rO_Zofm9vnD6IgSDZKehsyz-wOC3V_db6B5JYTgepJI-LHkzn0D0NS1-iPvoMsquVZJdWwcrWVQtwsf1LUfR02aqfyXV9n3-RYCcpqyXjUIBAZ4LP9xMNgyrFeq6_AcUHckbDqJTqIuudI93pKNYyfJp0gJY9roe-W3wQFtWSUnJWGj53wZF0GR44DCURkBFgqn_bMt_c3Gw9PBjkLmbUcDLv3jDufBGDRbdjLMjpcPm"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 w-full px-8">
                <div className="bg-surface-container-lowest p-4 rounded shadow-lg text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary mb-2">
                    person
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    {t("landing.flowDiagram.freelancer")}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-surface-container-lowest text-3xl">
                    swap_horiz
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded shadow-lg text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary mb-2">
                    account_balance
                  </span>
                  <span className="text-[10px] font-bold uppercase">LP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
