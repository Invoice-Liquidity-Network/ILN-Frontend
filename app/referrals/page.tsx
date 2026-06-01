"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet } from "@/context/WalletContext";
import { generateReferralCode, getReferralLink } from "@/utils/referrals";
import { useReferralStats } from "@/hooks/useReferralStats";
import { formatUSDC } from "@/utils/format";
import { useToast } from "@/context/ToastContext";

export default function ReferralsPage() {
  const { address, isConnected, connect } = useWallet();
  const { addToast } = useToast();
  const [referralCode, setReferralCode] = useState<string>("");
  
  const { data: stats, isLoading: statsLoading } = useReferralStats(referralCode);

  useEffect(() => {
    async function init() {
      if (address) {
        const code = await generateReferralCode(address);
        setReferralCode(code);
      }
    }
    init();
  }, [address]);

  const handleCopyLink = async () => {
    const link = getReferralLink(referralCode);
    try {
      await navigator.clipboard.writeText(link);
      addToast({
        type: "success",
        title: "Link copied",
        message: "Referral link copied to clipboard.",
      });
    } catch {
      addToast({
        type: "error",
        title: "Copy failed",
        message: "Please copy the link manually.",
      });
    }
  };

  const shareTwitter = () => {
    const link = getReferralLink(referralCode);
    const text = `Join the Invoice Layer Network and get instant payment for your invoices! Use my referral link: ${link}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareEmail = () => {
    const link = getReferralLink(referralCode);
    const subject = "Join Invoice Layer Network";
    const body = `Hi,\n\nI've been using Invoice Layer Network to get paid instantly for my work. You should check it out!\n\nUse my referral link to get started: ${link}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <section className="pt-32 pb-16 px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-headline mb-4">Referral Program</h1>
            <p className="text-on-surface-variant mb-8">
              Connect your wallet to generate your unique referral code and start earning rewards.
            </p>
            <button
              onClick={connect}
              className="rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-surface shadow-lg hover:bg-primary/90 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <section className="pt-32 pb-16 px-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <h1 className="text-3xl font-headline mb-2">Your Referral Dashboard</h1>
            <p className="text-on-surface-variant">
              Grow the protocol and earn rewards for every new user you refer.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 mb-10">
            <div className="bg-surface-container-lowest p-6 rounded-[28px] border border-outline-variant/15 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Your Referral Code</p>
              <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                <span className="font-mono text-xl font-bold">{referralCode || "..."}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    addToast({ type: "success", title: "Code copied" });
                  }}
                  className="p-2 hover:bg-surface-variant/20 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-4">
                Derived deterministically from your wallet address.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-[28px] border border-outline-variant/15 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Referral Stats</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{stats?.total_invoices ?? 0}</p>
                  <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Total Invoices</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats ? formatUSDC(stats.total_volume) : "0 USDC"}</p>
                  <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Total Volume</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-4">
                {statsLoading ? "Loading stats..." : "Stats are updated in real-time from the contract."}
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-[28px] border border-outline-variant/15 shadow-sm mb-10">
            <h2 className="text-xl font-bold mb-6">Share Your Link</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <input
                  readOnly
                  value={getReferralLink(referralCode)}
                  className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-primary text-surface px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                >
                  Copy Link
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={shareTwitter}
                  className="flex items-center gap-2 bg-[#1DA1F2] text-white px-5 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  Share on X
                </button>
                <button
                  onClick={shareEmail}
                  className="flex items-center gap-2 bg-surface-container-high text-on-surface px-5 py-3 rounded-xl text-sm font-bold hover:bg-surface-variant transition-all border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Send via Email
                </button>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
            <h3 className="text-primary font-bold flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
              How it works
            </h3>
            <ul className="text-sm text-on-surface-variant space-y-3 list-disc pl-5">
              <li>Share your unique referral link with freelancers or payers.</li>
              <li>When they submit an invoice using your link, the referral code is recorded on-chain.</li>
              <li>You receive a portion of the protocol fees as a reward for every successful settlement.</li>
              <li>Rewards are automatically sent to your connected wallet.</li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
