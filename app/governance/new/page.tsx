"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { useTransaction } from "@/hooks/useTransaction";
import { useBalances } from "@/hooks/useBalances";
import {
  fetchProtocolParameters,
  createProposal,
  CreateProposalFormType,
  AcceptedToken,
  ProtocolParameters,
  isValidStellarAddress,
  lookupToken,
} from "@/utils/governance";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { Loader2 } from "lucide-react";

interface FormData {
  formType: CreateProposalFormType | "";
  title: string;
  description: string;
  newValueBps: string;
  tokenAddress: string;
  removeTokenAddress: string;
}

export default function NewGovernanceProposalPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { execute, loading: txLoading } = useTransaction();
  const { balances, loading: balancesLoading } = useBalances(address);

  const [formData, setFormData] = useState<FormData>({
    formType: "",
    title: "",
    description: "",
    newValueBps: "",
    tokenAddress: "",
    removeTokenAddress: "",
  });
  const [protocolParams, setProtocolParams] = useState<ProtocolParameters | null>(null);
  const [loadingParams, setLoadingParams] = useState(true);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [resolvedToken, setResolvedToken] = useState<AcceptedToken | null>(null);
  const [tokenLookupError, setTokenLookupError] = useState<string | null>(null);

  const userILNBalance = useMemo(() => {
    // Assuming ILN token balance is available in balances array
    // For now, mocking as 1250 ILN from governance.ts mock
    return 1250; 
  }, [balances]);

  useEffect(() => {
    const getParams = async () => {
      setLoadingParams(true);
      const params = await fetchProtocolParameters();
      setProtocolParams(params);
      setLoadingParams(false);
    };
    getParams();
  }, []);

  useEffect(() => {
    setResolvedToken(null);
    setTokenLookupError(null);
    const debounceLookup = setTimeout(async () => {
      const address = formData.tokenAddress.trim();
      if (formData.formType === "AddToken" && address) {
        try {
          const token = await lookupToken(address);
          setResolvedToken(token);
        } catch (e: any) {
          setTokenLookupError(e.message);
        }
      }
    }, 500);
    return () => clearTimeout(debounceLookup);
  }, [formData.tokenAddress, formData.formType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for the field being edited
    setFormErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const validateForm = useCallback(() => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.formType) errors.formType = "Action Type is required.";
    if (!formData.title.trim()) errors.title = "Title is required.";
    if (!formData.description.trim()) errors.description = "Description is required.";

    if (formData.formType === "FeeRate" || formData.formType === "MaxDiscountRate") {
      const value = parseInt(formData.newValueBps);
      if (isNaN(value) || value < 0 || value > 5000) {
        errors.newValueBps = "Proposed Value must be between 0 and 5000 basis points.";
      }
    }

    if (formData.formType === "AddToken") {
      if (!formData.tokenAddress.trim()) {
        errors.tokenAddress = "Token address is required.";
      } else if (!isValidStellarAddress(formData.tokenAddress.trim())) {
        errors.tokenAddress = "Invalid Stellar address format.";
      } else if (tokenLookupError) {
        errors.tokenAddress = tokenLookupError;
      }
    }

    if (formData.formType === "RemoveToken") {
      if (!formData.removeTokenAddress.trim()) {
        errors.removeTokenAddress = "Token address is required.";
      } else if (!protocolParams?.acceptedTokens.some(t => t.address === formData.removeTokenAddress)) {
        errors.removeTokenAddress = "Token not found in accepted tokens.";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, protocolParams, tokenLookupError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert("Please connect your wallet.");
      return;
    }
    if (!protocolParams) {
      alert("Protocol parameters not loaded.");
      return;
    }
    if (!validateForm()) {
      return;
    }

    const ipfsHash = "QmTg...mock"; // Mock IPFS CID generation

    try {
      const payload = {
        formType: formData.formType as CreateProposalFormType,
        title: formData.title,
        description: formData.description + `

IPFS Hash: ${ipfsHash}`,
        newValueBps: formData.newValueBps ? parseInt(formData.newValueBps) : undefined,
        tokenAddress: resolvedToken?.address,
        tokenName: resolvedToken?.name,
        removeTokenAddress: formData.removeTokenAddress,
      };

      // Mock the createProposal to return a Transaction for useTransaction
      // For now, directly calling the mock createProposal utility
      const { proposalId } = await createProposal(payload, address, async (xdr) => xdr);

      // In a real scenario, this would involve building a transaction, signing it, and submitting.
      // For now, we simulate the redirect.
      router.push(`/governance/${proposalId}`);

    } catch (e: any) {
      alert(`Failed to create proposal: ${e.message}`);
    }
  };

  const isSubmitDisabled = useMemo(() => {
    const hasErrors = Object.keys(formErrors).length > 0;
    const isFormEmpty = !formData.formType || !formData.title || !formData.description;
    const insufficientBalance = protocolParams && userILNBalance < protocolParams.minProposalILN;
    return hasErrors || isFormEmpty || insufficientBalance || txLoading || loadingParams || balancesLoading;
  }, [formErrors, formData, protocolParams, userILNBalance, txLoading, loadingParams, balancesLoading]);

  const currentParameterValue = useMemo(() => {
    if (!protocolParams) return "";
    switch (formData.formType) {
      case "FeeRate":
        return `${protocolParams.feeRateBps} (${protocolParams.feeRateBps / 100}%)`;
      case "MaxDiscountRate":
        return `${protocolParams.maxDiscountRateBps} (${protocolParams.maxDiscountRateBps / 100}%)`;
      case "AddToken":
      case "RemoveToken":
        return `[${protocolParams.acceptedTokens.map((t) => t.symbol).join(", ")}]`;
      default:
        return "";
    }
  }, [formData.formType, protocolParams]);

  const proposedParameterValue = useMemo(() => {
    if (!protocolParams) return "";
    switch (formData.formType) {
      case "FeeRate":
      case "MaxDiscountRate": {
        const value = formData.newValueBps ? parseInt(formData.newValueBps) : undefined;
        return value !== undefined ? `${value} (${value / 100}%)` : "";
      }
      case "AddToken": {
        if (!resolvedToken) return "";
        const existing = protocolParams.acceptedTokens.map(t => t.symbol);
        return `[${[...existing, resolvedToken.symbol].join(", ")}]`;
      }
      case "RemoveToken": {
        const tokenToRemove = protocolParams.acceptedTokens.find(t => t.address === formData.removeTokenAddress);
        if (!tokenToRemove) return "";
        const remaining = protocolParams.acceptedTokens.filter(t => t.address !== formData.removeTokenAddress).map(t => t.symbol);
        return `[${remaining.join(", ")}]`;
      }
      default:
        return "";
    }
  }, [formData, protocolParams, resolvedToken]);

  if (loadingParams) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading protocol parameters...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Create New Governance Proposal</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block">
          <span className="text-zinc-700 dark:text-zinc-300">Action Type</span>
          <Select
            name="formType"
            value={formData.formType}
            onChange={handleChange}
            className="mt-1 block w-full"
            required
          >
            <option value="">Select an action type</option>
            <option value="FeeRate">Update Fee Rate</option>
            <option value="MaxDiscountRate">Update Max Discount Rate</option>
            <option value="AddToken">Add Accepted Token</option>
            <option value="RemoveToken">Remove Accepted Token</option>
          </Select>
          {formErrors.formType && <p className="text-red-500 text-sm mt-1">{formErrors.formType}</p>}
        </label>

        <label className="block">
          <span className="text-zinc-700 dark:text-zinc-300">Title</span>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full"
            placeholder="e.g., Reduce Base Discount Rate to 3.5%"
            required
          />
          {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
        </label>

        <label className="block">
          <span className="text-zinc-700 dark:text-zinc-300">Description</span>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full"
            rows={5}
            placeholder="Provide a detailed explanation for your proposal..."
            required
          />
          {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
        </label>

        {(formData.formType === "FeeRate" || formData.formType === "MaxDiscountRate") && (
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Proposed Value (Basis Points)</span>
            <Input
              type="number"
              name="newValueBps"
              value={formData.newValueBps}
              onChange={handleChange}
              className="mt-1 block w-full"
              placeholder="e.g., 350 for 3.5% (0-5000)"
              min={0}
              max={5000}
              required
            />
            {formErrors.newValueBps && <p className="text-red-500 text-sm mt-1">{formErrors.newValueBps}</p>}
          </label>
        )}

        {formData.formType === "AddToken" && (
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Token Address (G...)</span>
            <Input
              type="text"
              name="tokenAddress"
              value={formData.tokenAddress}
              onChange={handleChange}
              className="mt-1 block w-full"
              placeholder="e.g., G... (Stellar asset issuer address)"
              required
            />
            {resolvedToken && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Resolved: {resolvedToken.name} ({resolvedToken.symbol})
              </p>
            )}
            {formErrors.tokenAddress && <p className="text-red-500 text-sm mt-1">{formErrors.tokenAddress}</p>}
          </label>
        )}

        {formData.formType === "RemoveToken" && ( 
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Token to Remove</span>
            <Select
              name="removeTokenAddress"
              value={formData.removeTokenAddress}
              onChange={handleChange}
              className="mt-1 block w-full"
              required
            >
              <option value="">Select a token to remove</option>
              {protocolParams?.acceptedTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.name} ({token.symbol})
                </option>
              ))}
            </Select>
            {formErrors.removeTokenAddress && <p className="text-red-500 text-sm mt-1">{formErrors.removeTokenAddress}</p>}
          </label>
        )}

        {isConnected && protocolParams && userILNBalance < protocolParams.minProposalILN && (
          <div className="text-red-500 text-sm">
            Your current ILN balance ({userILNBalance}) is below the minimum required to submit a proposal ({protocolParams.minProposalILN}).
          </div>
        )}

        {(formData.formType && formData.title && proposedParameterValue) && (
          <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Live Preview</h3>
            <p className="text-blue-700 dark:text-blue-300">
              This proposal will change <span className="font-medium">[{formData.formType}]</span> from 
              <span className="font-medium"> {currentParameterValue}</span> to 
              <span className="font-medium"> {proposedParameterValue}</span>.
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitDisabled || !isConnected || !address}>
          {(txLoading || loadingParams || balancesLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Proposal
        </Button>
      </form>
    </div>
  );
}
