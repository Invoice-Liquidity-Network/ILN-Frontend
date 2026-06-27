/**
 * Integration Example: Using useWallet Hook
 *
 * This file demonstrates how to integrate the useWallet hook
 * into your components for wallet connection and authentication.
 */

"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";

/**
 * Example 1: Simple Wallet Connection Component
 */
export function WalletConnectionExample() {
  const { isConnected, publicKey, connect, disconnect } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (isConnected) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-sm font-medium text-green-900">
          ✓ Connected: {publicKey?.substring(0, 6)}...{publicKey?.substring(-4)}
        </p>
        <button
          onClick={handleDisconnect}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
    </div>
  );
}

/**
 * Example 2: Authenticated API Calls with JWT
 */
export function UserProfileExample() {
  const { isConnected, jwt } = useWallet();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!isConnected || !jwt) {
      setError("Not connected or authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <p className="text-gray-600">Connect your wallet to view profile</p>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={fetchProfile}
        disabled={isLoading || !jwt}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? "Loading..." : "Load Profile"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {profileData && (
        <div className="p-4 bg-gray-100 rounded">
          <pre>{JSON.stringify(profileData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Transaction Signing Component
 */
export function TransactionSigningExample() {
  const { isConnected, publicKey, signTransaction } = useWallet();
  const [txXdr, setTxXdr] = useState("");
  const [signedTx, setSignedTx] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    if (!txXdr.trim()) {
      setError("Please enter a transaction XDR");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await signTransaction(txXdr);
      setSignedTx(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign transaction");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <p className="text-gray-600">Connect your wallet to sign transactions</p>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-2">
          Transaction XDR:
        </label>
        <textarea
          value={txXdr}
          onChange={(e) => setTxXdr(e.target.value)}
          placeholder="Paste transaction XDR here..."
          className="w-full h-32 p-2 border rounded font-mono text-xs"
        />
      </div>

      <button
        onClick={handleSign}
        disabled={isLoading || !txXdr.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? "Signing..." : "Sign Transaction"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {signedTx && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm font-medium text-green-900 mb-2">
            ✓ Transaction Signed
          </p>
          <textarea
            value={signedTx}
            readOnly
            className="w-full h-24 p-2 border rounded font-mono text-xs"
          />
          <button
            onClick={() => navigator.clipboard.writeText(signedTx)}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Authentication Status Component
 */
export function AuthStatusExample() {
  const { isConnected, publicKey, jwt } = useWallet();

  return (
    <div className="p-4 bg-gray-100 rounded space-y-2 text-sm">
      <div>
        <span className="font-medium">Wallet Connected:</span>
        <span className={isConnected ? "text-green-600" : "text-red-600"}>
          {isConnected ? " Yes" : " No"}
        </span>
      </div>

      <div>
        <span className="font-medium">Public Key:</span>
        <span className="font-mono text-xs">
          {publicKey ? ` ${publicKey.substring(0, 6)}...${publicKey.substring(-4)}` : " -"}
        </span>
      </div>

      <div>
        <span className="font-medium">Authenticated (JWT):</span>
        <span className={jwt ? "text-green-600" : "text-red-600"}>
          {jwt ? " Yes" : " No"}
        </span>
      </div>

      {jwt && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <p className="font-medium mb-1">JWT Payload (decoded):</p>
          <pre className="font-mono overflow-x-auto">
            {JSON.stringify(
              JSON.parse(atob(jwt.split(".")[1])),
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Protected Component (Only works when authenticated)
 */
interface ProtectedComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedComponent({
  children,
  fallback = (
    <p className="text-yellow-600">
      Please connect and authenticate to access this content
    </p>
  ),
}: ProtectedComponentProps) {
  const { isConnected, jwt } = useWallet();

  if (!isConnected || !jwt) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Example 6: Complete App Integration
 *
 * Usage:
 * ```tsx
 * import { WalletProvider } from "@/context/WalletContext";
 * import { CompleteAppExample } from "@/path/to/this/file";
 *
 * export default function App() {
 *   return (
 *     <WalletProvider>
 *       <CompleteAppExample />
 *     </WalletProvider>
 *   );
 * }
 * ```
 */
export function CompleteAppExample() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Wallet Integration Example</h1>

        {/* Status Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Authentication Status</h2>
          <AuthStatusExample />
        </section>

        {/* Connection Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Connection</h2>
          <WalletConnectionExample />
        </section>

        {/* Protected Content Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Protected Content</h2>
          <ProtectedComponent>
            <div className="space-y-4">
              <UserProfileExample />
              <TransactionSigningExample />
            </div>
          </ProtectedComponent>
        </section>
      </div>
    </div>
  );
}
