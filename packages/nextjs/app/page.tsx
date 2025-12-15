// "use client";

// import Link from "next/link";
// import { Address } from "@scaffold-ui/components";
// import type { NextPage } from "next";
// import { hardhat } from "viem/chains";
// import { useAccount } from "wagmi";
// import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// import { useTargetNetwork } from "~~/hooks/scaffold-eth";

// const Home: NextPage = () => {
//   const { address: connectedAddress } = useAccount();
//   const { targetNetwork } = useTargetNetwork();

//   return (
//     <>
//       <div className="flex items-center flex-col grow pt-10">
//         <div className="px-5">
//           <h1 className="text-center">
//             <span className="block text-2xl mb-2">Welcome to</span>
//             <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
//           </h1>
//           <div className="flex justify-center items-center space-x-2 flex-col">
//             <p className="my-2 font-medium">Connected Address:</p>
//             <Address
//               address={connectedAddress}
//               chain={targetNetwork}
//               blockExplorerAddressLink={
//                 targetNetwork.id === hardhat.id ? `/blockexplorer/address/${connectedAddress}` : undefined
//               }
//             />
//           </div>
//           <p className="text-center text-lg">
//             Get started by editing{" "}
//             <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
//               packages/nextjs/app/page.tsx
//             </code>
//           </p>
//           <p className="text-center text-lg">
//             Edit your smart contract{" "}
//             <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
//               YourContract.sol
//             </code>{" "}
//             in{" "}
//             <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
//               packages/hardhat/contracts
//             </code>
//           </p>
//         </div>

//         <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
//           <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
//             <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
//               <BugAntIcon className="h-8 w-8 fill-secondary" />
//               <p>
//                 Tinker with your smart contract using the{" "}
//                 <Link href="/debug" passHref className="link">
//                   Debug Contracts
//                 </Link>{" "}
//                 tab.
//               </p>
//             </div>
//             <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
//               <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
//               <p>
//                 Explore your local transactions with the{" "}
//                 <Link href="/blockexplorer" passHref className="link">
//                   Block Explorer
//                 </Link>{" "}
//                 tab.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Home;
 

// 1ый вариант 


"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const { address: connectedAddress } = useAccount();
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("0.01");

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Payment Receiver Contract</span>
          <span className="block text-2xl mb-2">Send and receive payments on Ethereum</span>
        </h1>

        <div className="bg-base-100 shadow-lg shadow-secondary border border-base-300 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">Make a Payment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payment Description (optional)</label>
              <input
                type="text"
                placeholder="e.g., 'For services rendered'"
                className="input input-bordered w-full"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Custom Amount (ETH)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0.01"
                  className="input input-bordered flex-grow"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <button className="btn btn-primary">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {connectedAddress && (
          <div className="mt-8 bg-base-100 shadow-lg shadow-secondary border border-base-300 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Your Info</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold">Your Address:</span>
                <span className="font-mono">{formatAddress(connectedAddress)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//ВАРИАНТ 2

// "use client";

// import { useState, useEffect } from "react";

// // Адрес вашего контракта
// const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// export default function Home() {
//   const [account, setAccount] = useState<string | null>(null);
//   const [amount, setAmount] = useState("0.01");
//   const [loading, setLoading] = useState(false);
//   const [contractBalance, setContractBalance] = useState("0");

//   // Проверяем подключение MetaMask
//   useEffect(() => {
//     checkConnection();
//   }, []);

//   const checkConnection = async () => {
//     if (typeof window.ethereum !== "undefined") {
//       try {
//         const accounts = await window.ethereum.request({ method: "eth_accounts" });
//         if (accounts.length > 0) {
//           setAccount(accounts[0]);
//         }
//       } catch (error) {
//         console.log("MetaMask не подключен");
//       }
//     }
//   };

//   const connectWallet = async () => {
//     if (typeof window.ethereum !== "undefined") {
//       try {
//         const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
//         setAccount(accounts[0]);
//       } catch (error) {
//         console.error("Ошибка подключения:", error);
//       }
//     } else {
//       alert("Установите MetaMask!");
//     }
//   };

//   const sendPayment = async () => {
//     if (!account) {
//       alert("Подключите MetaMask!");
//       return;
//     }

//     try {
//       setLoading(true);
      
//       // Отправляем транзакцию через MetaMask
//       const txHash = await window.ethereum.request({
//         method: "eth_sendTransaction",
//         params: [{
//           from: account,
//           to: CONTRACT_ADDRESS,
//           value: ethersToWei(amount), // Конвертируем ETH в wei
//           gas: "21000", // Базовый лимит газа
//         }]
//       });
      
//       alert(`✅ Платёж отправлен!\nХеш: ${txHash.substring(0, 10)}...`);
//     } catch (error: any) {
//       console.error("Ошибка:", error);
//       alert(`❌ Ошибка: ${error.message || "Не удалось отправить"}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Функция для конвертации ETH в wei
//   const ethersToWei = (eth: string) => {
//     return "0x" + (parseFloat(eth) * 1e18).toString(16);
//   };

//   // Форматирование адреса
//   const formatAddress = (addr: string) => {
//     return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen p-8">
//       <h1 className="text-4xl font-bold mb-8">💰 ETH Payment Contract</h1>
      
//       {/* Кнопка подключения */}
//       {!account ? (
//         <button
//           onClick={connectWallet}
//           className="mb-8 py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-lg"
//         >
//           🔗 Подключить MetaMask
//         </button>
//       ) : (
//         <div className="mb-8 p-4 bg-green-100 text-green-800 rounded-xl">
//           ✅ Подключен: {formatAddress(account)}
//         </div>
//       )}
      
//       {/* Информация */}
//       <div className="card bg-base-200 p-6 shadow-xl w-full max-w-lg mb-8">
//         <h2 className="text-2xl font-semibold mb-4">📊 Информация о контракте</h2>
//         <div className="space-y-3">
//           <div className="flex justify-between">
//             <span>Адрес контракта:</span>
//             <span className="font-mono text-sm">
//               {formatAddress(CONTRACT_ADDRESS)}
//             </span>
//           </div>
//           <div className="flex justify-between">
//             <span>Баланс контракта:</span>
//             <span className="font-bold">{contractBalance} ETH</span>
//           </div>
//           <div className="text-sm text-gray-500 mt-4">
//             Сеть: Hardhat Local (Chain ID: 31337)
//           </div>
//         </div>
//       </div>
      
//       {/* Отправка платежа */}
//       <div className="card bg-base-200 p-6 shadow-xl w-full max-w-lg">
//         <h2 className="text-2xl font-semibold mb-4">⚡ Отправить платёж</h2>
        
//         <div className="mb-6">
//           <label className="block mb-2 font-medium">Сумма для отправки (ETH):</label>
//           <div className="flex gap-2 mb-4">
//             <input
//               type="number"
//               step="0.001"
//               min="0.001"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               className="flex-grow p-3 bg-white border border-gray-300 rounded-lg shadow-sm"
//               placeholder="0.01"
//             />
//             <button
//               onClick={() => setAmount("0.01")}
//               className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
//             >
//               0.01
//             </button>
//             <button
//               onClick={() => setAmount("0.1")}
//               className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
//             >
//               0.1
//             </button>
//           </div>
//         </div>
        
//         <button
//           onClick={sendPayment}
//           disabled={!account || loading}
//           className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-all"
//         >
//           {loading ? (
//             <span className="flex items-center justify-center">
//               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//               Отправка транзакции...
//             </span>
//           ) : (
//             `📤 Отправить ${amount} ETH на контракт`
//           )}
//         </button>
        
//         {!account && (
//           <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-center">
//             ⚠️ Сначала подключите MetaMask
//           </div>
//         )}
//       </div>
      
//       {/* Инструкция */}
//       <div className="mt-12 text-center text-gray-600">
//         <h3 className="font-bold mb-2">📋 Инструкция по настройке:</h3>
//         <ol className="text-left list-decimal pl-5 space-y-1">
//           <li>Установите расширение MetaMask</li>
//           <li>Добавьте сеть Hardhat:
//             <ul className="list-disc pl-5 text-sm">
//               <li>Название: <code>Hardhat</code></li>
//               <li>RPC URL: <code>http://127.0.0.1:8545</code></li>
//               <li>Chain ID: <code>31337</code></li>
//             </ul>
//           </li>
//           <li>Импортируйте тестовый аккаунт:
//             <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
//               Приватный ключ: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
//             </div>
//           </li>
//         </ol>
//       </div>
      
//       <footer className="mt-8 text-center text-gray-500 text-sm">
//         <p>Проект: Payment Contract DApp | Scaffold-ETH 2</p>
//         <p>Все тесты пройдены ✅ | Контракт задеплоен ✅</p>
//       </footer>
//     </div>
//   );
// }

// // Объявляем глобальный объект ethereum для TypeScript
// declare global {
//   interface Window {
//     ethereum?: any;
//   }
// }