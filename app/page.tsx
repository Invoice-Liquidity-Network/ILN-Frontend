"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ParameterUpdateBanner from "@/components/ParameterUpdateBanner";
import PersonalizedDashboard from "@/components/PersonalizedDashboard";
import Stats from "@/components/Stats";
import RecentTransactionsPanel from "@/components/RecentTransactionsPanel";
import HowItWorks from "@/components/HowItWorks";
import ForFreelancers from "@/components/ForFreelancers";
import ForLPs from "@/components/ForLPs";
import ContractActions from "@/components/ContractActions";
import BuiltOnStellar from "@/components/BuiltOnStellar";
import OpenSource from "@/components/OpenSource";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Home() {
  useDocumentTitle({ pageTitle: "ILN Turn unpaid invoices into instant liquidity" });

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4">
        <ParameterUpdateBanner />
      </div>
      <Hero />
      <PersonalizedDashboard />
      <Stats />
      <RecentTransactionsPanel />
      <HowItWorks />
      <ForFreelancers />
      <ForLPs />
      <ContractActions />
      <BuiltOnStellar />
      <OpenSource />
      <Footer />
    </main>
  );
}
