"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Address } from "@scaffold-ui/components";
import { useScaffoldContract, useDeployedContractInfo, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { hardhat } from "viem/chains";

export default function Home() {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  
  const [paymentDescription, setPaymentDescription] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("0.001");
  
  // Состояния для данных контракта
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [contractOwner, setContractOwner] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState(false);

  const { data: deployedContractData } = useDeployedContractInfo("PaymentReceiver");
  
  const { data: readContract } = useScaffoldContract({
    contractName: "PaymentReceiver",
  });

  const { data: writeContract } = useScaffoldContract({
    contractName: "PaymentReceiver",
    walletClient: walletClient || undefined,
  });

  // Функция для загрузки данных контракта
  const loadContractData = async () => {
    if (!readContract) {
      setError("Contract not loaded. Please refresh page or check network.");
      return;
    }

    setIsLoadingData(true);
    setError("");
    
    try {
      const [balance, owner] = await Promise.all([
        readContract.read.getBalance(),
        readContract.read.getOwner(),
      ]);
      
      const balanceEth = (Number(balance) / 10 ** 18).toFixed(6);
      setContractBalance(balanceEth);
      setContractOwner(owner as string);
      setIsOwner(connectedAddress === owner);
      setDataLoaded(true);
      
    } catch (error: any) {
      console.error("Error loading contract data:", error);
      setError(`Failed to load contract data: ${error.message || "Network timeout"}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 1. Функция для отправки платежа
  const handleMakePayment = async (amountInEth: string) => {
    setError("");
    setTxHash("");

    if (!writeContract || !walletClient) {
      setError("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    try {
      const amountInWei = BigInt(Math.floor(parseFloat(amountInEth) * 10 ** 18));
      
      const hash = await writeContract.write.makePayment(
        [paymentDescription || ""],
        { value: amountInWei }
      );
      
      setTxHash(hash);
      console.log("Payment successful:", hash);
      
      // Обновляем данные через 3 секунды
      setTimeout(() => {
        loadContractData();
      }, 3000);
      
      setPaymentDescription("");
      
    } catch (error: any) {
      console.error("Payment failed:", error);
      let errorMsg = "Payment failed";
      if (error.code === 4001) errorMsg = "Transaction rejected";
      else if (error.message?.includes("insufficient funds")) errorMsg = "Insufficient funds";
      else errorMsg = error.message || errorMsg;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Функция для вывода всех средств
  const handleWithdrawAll = async () => {
    setError("");
    setTxHash("");

    if (!writeContract || !isOwner) {
      setError("Only contract owner can withdraw");
      return;
    }

    setIsLoading(true);
    try {
      const hash = await writeContract.write.withdraw();
      setTxHash(hash);
      console.log("Withdrawal successful:", hash);
      
      setTimeout(() => {
        loadContractData();
      }, 3000);
      
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      let errorMsg = "Withdrawal failed";
      if (error.code === 4001) errorMsg = "Transaction rejected";
      else errorMsg = error.message || errorMsg;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Функция для вывода определенной суммы
  const handleWithdrawAmount = async () => {
    setError("");
    setTxHash("");

    if (!writeContract || !isOwner) {
      setError("Only contract owner can withdraw");
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const amountInWei = BigInt(Math.floor(parseFloat(withdrawAmount) * 10 ** 18));
      
      const hash = await writeContract.write.withdrawAmount([amountInWei]);
      setTxHash(hash);
      console.log("Specific withdrawal successful:", hash);
      
      setTimeout(() => {
        loadContractData();
        setWithdrawAmount("");
      }, 3000);
      
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      let errorMsg = "Withdrawal failed";
      if (error.code === 4001) errorMsg = "Transaction rejected";
      else if (error.message?.includes("Insufficient balance")) errorMsg = "Contract has insufficient balance";
      else errorMsg = error.message || errorMsg;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Функция для передачи владения
  const handleTransferOwnership = async () => {
    setError("");
    setTxHash("");

    if (!writeContract || !isOwner) {
      setError("Only contract owner can transfer ownership");
      return;
    }

    if (!newOwner || !newOwner.startsWith("0x") || newOwner.length !== 42) {
      setError("Please enter a valid Ethereum address (0x...)");
      return;
    }

    setIsLoading(true);
    try {
      const hash = await writeContract.write.transferOwnership([newOwner]);
      setTxHash(hash);
      console.log("Ownership transfer successful:", hash);
      
      setTimeout(() => {
        loadContractData();
        setNewOwner("");
      }, 3000);
      
    } catch (error: any) {
      console.error("Transfer failed:", error);
      let errorMsg = "Transfer failed";
      if (error.code === 4001) errorMsg = "Transaction rejected";
      else errorMsg = error.message || errorMsg;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Payment Receiver Contract</h1>
            <p className="text-xl mt-2 text-base-content/70">Send and receive payments on Ethereum</p>
          </div>
          <button 
            onClick={loadContractData}
            className="btn btn-sm btn-outline"
            disabled={isLoadingData || isLoading}
          >
            {isLoadingData ? "🔄 Loading..." : dataLoaded ? "🔄 Refresh Data" : "📥 Load Contract Data"}
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {!dataLoaded ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-xl font-semibold mb-4">Contract Data Not Loaded</p>
            <p className="text-base-content/70 mb-6">
              Click "Load Contract Data" to fetch current contract information
            </p>
            <button 
              onClick={loadContractData}
              className="btn btn-primary"
              disabled={isLoadingData}
            >
              {isLoadingData ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Loading...
                </>
              ) : (
                "📥 Load Contract Data"
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Контракт информация */}
            <div className="card bg-base-100 shadow-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">📋 Contract Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Contract Address:</span>
                    <div className="mt-1">
                      <Address 
                        address={deployedContractData?.address} 
                        blockExplorerAddressLink={
                          targetNetwork.id === hardhat.id 
                            ? `/blockexplorer/address/${deployedContractData?.address}` 
                            : undefined
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Contract Owner:</span>
                    <div className="mt-1">
                      <Address 
                        address={contractOwner} 
                        blockExplorerAddressLink={
                          targetNetwork.id === hardhat.id && contractOwner
                            ? `/blockexplorer/address/${contractOwner}` 
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Contract Balance:</span>
                    <div className="mt-1">
                      <span className="font-mono text-2xl eth-amount">{contractBalance} ETH</span>
                    </div>
                  </div>
                  {connectedAddress && (
                    <div>
                      <span className="font-semibold">Your Address:</span>
                      <div className="mt-1">
                        <Address 
                          address={connectedAddress} 
                          blockExplorerAddressLink={
                            targetNetwork.id === hardhat.id
                              ? `/blockexplorer/address/${connectedAddress}` 
                            : undefined
                          }
                        />
                        {isOwner && (
                          <span className="ml-2 badge badge-success">Owner</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Основной функционал в сетке */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Левый столбец: Платежи (доступно всем) */}
              <div className="space-y-8">
                {/* Отправить платеж */}
                <div className="card bg-base-100 shadow-xl p-6">
                  <h2 className="text-2xl font-bold mb-4">💳 Make a Payment</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Payment Description (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., 'For services rendered'"
                        className="input input-bordered w-full"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Custom Amount (ETH)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="0.001"
                          className="input input-bordered flex-grow"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleMakePayment(paymentAmount)}
                          disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) <= 0 || !walletClient}
                        >
                          {isLoading ? "🔄 Processing..." : "Send"}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {["0.001", "0.01", "0.1"].map((amount) => (
                        <button
                          key={amount}
                          className="btn btn-outline"
                          onClick={() => handleMakePayment(amount)}
                          disabled={isLoading || !walletClient}
                        >
                          Send {amount} ETH
                        </button>
                      ))}
                    </div>
                    
                    <div className="text-sm text-base-content/70 mt-2">
                      {!walletClient 
                        ? "🔌 Please connect your wallet to make payments" 
                        : "📝 Payments are recorded on-chain as events"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Правый столбец: Функции владельца (только для owner) */}
              <div className="space-y-8">
                {/* Вывод средств (только для владельца) */}
                {isOwner ? (
                  <>
                    <div className="card bg-base-100 shadow-xl p-6 border-2 border-primary/20">
                      <div className="flex items-center mb-4">
                        <h2 className="text-2xl font-bold">👑 Owner Functions</h2>
                        <span className="ml-2 badge badge-primary">Owner Only</span>
                      </div>
                      
                      {/* Вывод всех средств */}
                      <div className="mb-6 p-4 bg-primary/5 rounded-lg">
                        <h3 className="font-bold mb-2">Withdraw All Funds</h3>
                        <p className="text-sm text-base-content/70 mb-3">
                          Withdraw the entire contract balance ({contractBalance} ETH)
                        </p>
                        <button
                          className="btn btn-success w-full"
                          onClick={handleWithdrawAll}
                          disabled={isLoading || parseFloat(contractBalance) <= 0 || !walletClient}
                        >
                          {isLoading ? "⏳ Processing..." : `Withdraw All (${contractBalance} ETH)`}
                        </button>
                      </div>

                      {/* Вывод определенной суммы */}
                      <div className="mb-6 p-4 bg-primary/5 rounded-lg">
                        <h3 className="font-bold mb-2">Withdraw Specific Amount</h3>
                        <p className="text-sm text-base-content/70 mb-3">
                          Withdraw a specific amount from the contract
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Amount in ETH"
                            className="input input-bordered flex-grow"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            disabled={isLoading}
                          />
                          <button
                            className="btn btn-warning"
                            onClick={handleWithdrawAmount}
                            disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !walletClient}
                          >
                            {isLoading ? "⏳" : "Withdraw"}
                          </button>
                        </div>
                      </div>

                      {/* Передача владения */}
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <h3 className="font-bold mb-2">Transfer Ownership</h3>
                        <p className="text-sm text-base-content/70 mb-3">
                          Transfer contract ownership to another address
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="New owner address (0x...)"
                            className="input input-bordered flex-grow font-mono text-sm"
                            value={newOwner}
                            onChange={(e) => setNewOwner(e.target.value)}
                            disabled={isLoading}
                          />
                          <button
                            className="btn btn-error"
                            onClick={handleTransferOwnership}
                            disabled={isLoading || !newOwner || !walletClient}
                          >
                            {isLoading ? "⏳" : "Transfer"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card bg-base-100 shadow-xl p-6">
                    <h2 className="text-2xl font-bold mb-4">🔒 Owner Functions</h2>
                    <div className="text-center p-8">
                      <div className="text-5xl mb-4">👑</div>
                      <p className="text-lg font-semibold mb-2">Owner functions are locked</p>
                      <p className="text-base-content/70 mb-4">
                        Only the contract owner can withdraw funds or transfer ownership.
                      </p>
                      <div className="stats shadow">
                        <div className="stat">
                          <div className="stat-title">Contract Owner</div>
                          <div className="stat-value text-sm font-mono truncate">{contractOwner}</div>
                          <div className="stat-desc">Connect as owner to access these functions</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Транзакция успешна */}
            {txHash && (
              <div className="mt-8 card bg-success/10 border-success/30 p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">✅</div>
                  <div>
                    <h3 className="font-bold text-lg">Transaction Successful!</h3>
                    <p className="text-sm opacity-80">Your transaction has been submitted to the blockchain.</p>
                  </div>
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="font-mono text-xs break-all mb-2">{txHash}</p>
                  <a 
                    href={`/blockexplorer/transaction/${txHash}`}
                    className="link text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🔍 View in Block Explorer
                  </a>
                </div>
              </div>
            )}

            {/* Инструкция */}
            <div className="mt-8 card bg-base-100 shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4">📖 How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">For Everyone</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Connect your wallet using the button in the top right corner</li>
                    <li>Send ETH payments to the contract with optional descriptions</li>
                    <li>All payments are recorded as on-chain events</li>
                    <li>Anyone can send payments, no permissions required</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">For Contract Owner</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Only the owner can withdraw funds from the contract</li>
                    <li>Owner can withdraw all funds or specific amounts</li>
                    <li>Owner can transfer ownership to another address</li>
                    <li>All owner actions require wallet confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Отладочная информация */}
            <details className="mt-8">
              <summary className="cursor-pointer font-semibold text-lg mb-2">🔧 Debug Information</summary>
              <div className="card bg-base-200 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-semibold">Wallet Connected</div>
                    <div className={walletClient ? "text-success" : "text-error"}>
                      {walletClient ? "✅ Yes" : "❌ No"}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">Is Owner</div>
                    <div className={isOwner ? "text-success" : "text-warning"}>
                      {isOwner ? "✅ Yes" : "❌ No"}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">Write Contract</div>
                    <div className={writeContract ? "text-success" : "text-error"}>
                      {writeContract ? "✅ Loaded" : "❌ Not loaded"}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">Network</div>
                    <div>{targetNetwork.name}</div>
                  </div>
                </div>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}