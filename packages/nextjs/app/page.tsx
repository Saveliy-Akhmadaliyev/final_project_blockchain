// "use client";

// import { useState } from "react";
// import { useAccount } from "wagmi";

// export default function Home() {
//   const { address: connectedAddress } = useAccount();
//   const [paymentDescription, setPaymentDescription] = useState("");
//   const [paymentAmount, setPaymentAmount] = useState("0.01");

//   const formatAddress = (addr: string) => {
//     return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
//   };

//   return (
//     <div className="flex items-center flex-col flex-grow pt-10">
//       <div className="px-5 w-full max-w-4xl">
//         <h1 className="text-center mb-8">
//           <span className="block text-4xl font-bold">Payment Receiver Contract</span>
//           <span className="block text-2xl mb-2">Send and receive payments on Ethereum</span>
//         </h1>

//         <div className="bg-base-100 shadow-lg shadow-secondary border border-base-300 rounded-2xl p-6">
//           <h2 className="text-2xl font-bold mb-4">Make a Payment</h2>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-2">Payment Description (optional)</label>
//               <input
//                 type="text"
//                 placeholder="e.g., 'For services rendered'"
//                 className="input input-bordered w-full"
//                 value={paymentDescription}
//                 onChange={(e) => setPaymentDescription(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-2">Custom Amount (ETH)</label>
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   placeholder="0.01"
//                   className="input input-bordered flex-grow"
//                   value={paymentAmount}
//                   onChange={(e) => setPaymentAmount(e.target.value)}
//                 />
//                 <button className="btn btn-primary">
//                   Send
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {connectedAddress && (
//           <div className="mt-8 bg-base-100 shadow-lg shadow-secondary border border-base-300 rounded-2xl p-6">
//             <h2 className="text-2xl font-bold mb-4">Your Info</h2>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="font-semibold">Your Address:</span>
//                 <span className="font-mono">{formatAddress(connectedAddress)}</span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Address } from "@scaffold-ui/components";
import { useScaffoldContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";

export default function Home() {
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("0.001");
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [contractOwner, setContractOwner] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { data: deployedContractData } = useDeployedContractInfo("PaymentReceiver");
  
  const { data: readContract } = useScaffoldContract({
    contractName: "PaymentReceiver",
  });

  const { data: writeContract } = useScaffoldContract({
    contractName: "PaymentReceiver",
    walletClient: walletClient || undefined,
  });

  // Загружаем данные контракта
  useEffect(() => {
    const loadData = async () => {
      if (readContract) {
        try {
          const balance = await readContract.read.getBalance();
          const owner = await readContract.read.getOwner();
          setContractBalance((Number(balance) / 10 ** 18).toFixed(6));
          setContractOwner(owner as string);
        } catch (error) {
          console.error("Error loading contract data:", error);
        }
      }
    };
    
    if (readContract) {
      loadData();
    }
  }, [readContract]);

  const handleMakePayment = async () => {
    // Сброс ошибок
    setError("");
    setTxHash("");
    
    // Проверки
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }
    
    if (!walletClient) {
      setError("Wallet client not available. Try reconnecting.");
      return;
    }
    
    if (!writeContract) {
      setError("Contract not loaded. Please refresh the page.");
      return;
    }
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError("Please enter a valid amount (greater than 0)");
      return;
    }

    setIsLoading(true);
    
    try {
      // Конвертируем ETH в wei
      const amountInWei = BigInt(Math.floor(parseFloat(paymentAmount) * 10 ** 18));
      
      console.log("=== Transaction Details ===");
      console.log("From:", connectedAddress);
      console.log("To (contract):", deployedContractData?.address);
      console.log("Amount:", paymentAmount, "ETH");
      console.log("Amount in wei:", amountInWei.toString());
      console.log("Description:", paymentDescription || "(empty)");
      
      // Вызываем метод контракта
      console.log("Calling makePayment...");
      
      const hash = await writeContract.write.makePayment(
        [paymentDescription || ""],
        { 
          value: amountInWei 
        }
      );
      
      setTxHash(hash);
      console.log("✅ Transaction sent! Hash:", hash);
      
      // Обновляем баланс через 3 секунды
      setTimeout(async () => {
        if (readContract) {
          try {
            const newBalance = await readContract.read.getBalance();
            setContractBalance((Number(newBalance) / 10 ** 18).toFixed(6));
            console.log("Balance updated");
          } catch (e) {
            console.error("Failed to update balance:", e);
          }
        }
      }, 3000);
      
      setPaymentDescription("");
      setPaymentAmount("0.001");
      
    } catch (error: any) {
      console.error("❌ Transaction error:", error);
      
      let errorMsg = "Transaction failed";
      
      if (error.code === 4001) {
        errorMsg = "Transaction rejected by user";
      } else if (error.code === -32603) {
        errorMsg = "Internal JSON-RPC error";
      } else if (error.message?.includes("user rejected")) {
        errorMsg = "You rejected the transaction in MetaMask";
      } else if (error.message?.includes("insufficient funds")) {
        errorMsg = "Insufficient funds for this transaction";
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setError(errorMsg);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-2xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Payment Receiver</span>
          <span className="block text-lg mt-2">
            {!isConnected ? "🔴 Connect your wallet to start" : "🟢 Wallet connected"}
          </span>
        </h1>

        {/* Статус подключения */}
        <div className="bg-base-100 shadow-lg border border-base-300 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">Status: </span>
              {isConnected ? (
                <span className="text-success">Connected ✅</span>
              ) : (
                <span className="text-error">Not connected ❌</span>
              )}
            </div>
            <div>
              <span className="font-semibold">Wallet: </span>
              {walletClient ? "Available ✅" : "Not available ❌"}
            </div>
            <div>
              <span className="font-semibold">Contract: </span>
              {writeContract ? "Loaded ✅" : "Not loaded ❌"}
            </div>
          </div>
        </div>

        {/* Информация о контракте */}
        <div className="bg-base-100 shadow-lg border border-base-300 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Contract Info</h2>
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Address: </span>
              <Address address={deployedContractData?.address} />
            </div>
            <div>
              <span className="font-semibold">Owner: </span>
              <Address address={contractOwner} />
            </div>
            <div>
              <span className="font-semibold">Balance: </span>
              <span className="font-mono">{contractBalance} ETH</span>
            </div>
            {connectedAddress && (
              <div>
                <span className="font-semibold">Your Address: </span>
                <Address address={connectedAddress} />
                {contractOwner === connectedAddress && (
                  <span className="ml-2 badge badge-success">You are the owner</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Форма платежа */}
        <div className="bg-base-100 shadow-lg border border-base-300 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">Make a Payment</h2>
          
          <div className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <label className="block mb-2">Description (optional)</label>
              <input
                type="text"
                placeholder="What is this payment for?"
                className="input input-bordered w-full"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                disabled={isLoading || !isConnected}
              />
            </div>
            
            <div>
              <label className="block mb-2">Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.001"
                className="input input-bordered w-full"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={isLoading || !isConnected}
              />
              <p className="text-sm text-gray-500 mt-1">Minimum: 0.001 ETH</p>
            </div>
            
            <button
              onClick={handleMakePayment}
              className="btn btn-primary w-full"
              disabled={isLoading || !isConnected || !walletClient}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Processing...
                </>
              ) : (
                "Send Payment"
              )}
            </button>
            
            {!isConnected && (
              <div className="alert alert-warning">
                <span>Please connect your wallet using the button in the top right corner</span>
              </div>
            )}
            
            {txHash && (
              <div className="mt-4 p-4 bg-base-200 rounded">
                <p className="text-sm font-semibold">✅ Transaction sent successfully!</p>
                <p className="text-xs font-mono break-all mt-2">Hash: {txHash}</p>
                <a 
                  href={`/blockexplorer/transaction/${txHash}`}
                  className="text-primary underline text-sm mt-2 inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View in Block Explorer
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Отладочная информация (можно скрыть позже) */}
        <details className="mt-8">
          <summary className="cursor-pointer font-semibold">Debug Info</summary>
          <div className="mt-2 p-4 bg-base-200 rounded text-sm">
            <p><strong>isConnected:</strong> {isConnected.toString()}</p>
            <p><strong>walletClient:</strong> {walletClient ? "✅" : "❌"}</p>
            <p><strong>writeContract:</strong> {writeContract ? "✅" : "❌"}</p>
            <p><strong>readContract:</strong> {readContract ? "✅" : "❌"}</p>
            <p><strong>Contract Address:</strong> {deployedContractData?.address}</p>
          </div>
        </details>
      </div>
    </div>
  );
}