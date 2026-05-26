"use client";

import Link from "next/link";
import { formatAddress } from "@/utils/format";
import { isOracleVerifiedAddress } from "@/utils/oracleVerification";
import VerificationBadge from "./VerificationBadge";

export default function PayerIdentity({
  address,
  className = "",
}: {
  address: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <Link href={`/profile/${address}`} className="font-mono text-on-surface hover:underline">
        {formatAddress(address)}
      </Link>
      <VerificationBadge verified={isOracleVerifiedAddress(address)} />
    </span>
  );
}
