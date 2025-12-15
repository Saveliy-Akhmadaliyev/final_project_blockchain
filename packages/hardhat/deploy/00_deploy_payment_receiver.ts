import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const deployPaymentReceiver: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  await deploy("PaymentReceiver", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Получаем контракт с правильными типами
  const paymentReceiverContract = await ethers.getContractAt(
    "PaymentReceiver",
    (
      await get("PaymentReceiver")
    ).address
  );

  console.log(
    "PaymentReceiver deployed to:",
    await paymentReceiverContract.getAddress()
  );
  console.log(
    "Contract owner:",
    await paymentReceiverContract.getOwner()
  );
};

export default deployPaymentReceiver;
deployPaymentReceiver.tags = ["PaymentReceiver"];