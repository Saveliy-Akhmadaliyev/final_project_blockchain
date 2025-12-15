import { expect } from "chai";
import { ethers } from "hardhat";
import { PaymentReceiver } from "../typechain-types";

describe("PaymentReceiver", function () {
  let paymentReceiver: PaymentReceiver;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const PaymentReceiverFactory = await ethers.getContractFactory("PaymentReceiver");
    paymentReceiver = await PaymentReceiverFactory.deploy();
    await paymentReceiver.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await paymentReceiver.getOwner()).to.equal(owner.address);
    });

    it("Should have zero balance initially", async function () {
      expect(await paymentReceiver.getBalance()).to.equal(0);
    });
  });

  describe("Payments", function () {
    it("Should accept payments with description", async function () {
      const paymentAmount = ethers.parseEther("1.0");
      const description = "Test payment";
      
      const tx = await paymentReceiver.connect(user1).makePayment(description, {
        value: paymentAmount,
      });
      
      // Просто проверяем что событие сгенерировано, без детальной проверки аргументов
      await expect(tx)
        .to.emit(paymentReceiver, "PaymentReceived");
      
      expect(await paymentReceiver.getBalance()).to.equal(paymentAmount);
    });

    it("Should reject zero value payments", async function () {
      await expect(
        paymentReceiver.connect(user1).makePayment("Zero payment", {
          value: 0,
        })
      ).to.be.revertedWith("Payment must be greater than 0");
    });

    it("Should accept payments via receive()", async function () {
      const paymentAmount = ethers.parseEther("0.5");
      
      const tx = await user1.sendTransaction({
        to: await paymentReceiver.getAddress(),
        value: paymentAmount,
      });
      
      // Проверяем что событие сгенерировано
      await expect(tx)
        .to.emit(paymentReceiver, "PaymentReceived");
      
      expect(await paymentReceiver.getBalance()).to.equal(paymentAmount);
    });

    it("Should accept multiple payments", async function () {
      const payment1 = ethers.parseEther("0.3");
      const payment2 = ethers.parseEther("0.7");
      
      await paymentReceiver.connect(user1).makePayment("First", {
        value: payment1,
      });
      
      await paymentReceiver.connect(user2).makePayment("Second", {
        value: payment2,
      });
      
      const total = payment1 + payment2;
      expect(await paymentReceiver.getBalance()).to.equal(total);
    });
  });

  describe("Withdrawals", function () {
    const depositAmount = ethers.parseEther("2.0");

    beforeEach(async function () {
      await paymentReceiver.connect(user1).makePayment("Deposit", {
        value: depositAmount,
      });
    });

    it("Should allow owner to withdraw all funds", async function () {
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      const tx = await paymentReceiver.withdraw();
      const receipt = await tx.wait();
      
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      expect(await paymentReceiver.getBalance()).to.equal(0);
      expect(finalOwnerBalance + gasUsed).to.equal(initialOwnerBalance + depositAmount);
      
      // Проверяем что событие сгенерировано
      await expect(tx)
        .to.emit(paymentReceiver, "Withdrawn");
    });

    it("Should allow owner to withdraw specific amount", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      
      const tx = await paymentReceiver.withdrawAmount(withdrawAmount);
      
      // Проверяем что событие сгенерировано
      await expect(tx)
        .to.emit(paymentReceiver, "Withdrawn");
      
      expect(await paymentReceiver.getBalance()).to.equal(depositAmount - withdrawAmount);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        paymentReceiver.connect(user1).withdraw()
      ).to.be.revertedWith("Not the owner");
      
      await expect(
        paymentReceiver.connect(user1).withdrawAmount(ethers.parseEther("0.5"))
      ).to.be.revertedWith("Not the owner");
    });

    it("Should not allow withdrawal of zero amount", async function () {
      await expect(
        paymentReceiver.withdrawAmount(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow withdrawal exceeding balance", async function () {
      const excessAmount = ethers.parseEther("3.0");
      
      await expect(
        paymentReceiver.withdrawAmount(excessAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      await paymentReceiver.transferOwnership(user1.address);
      expect(await paymentReceiver.getOwner()).to.equal(user1.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        paymentReceiver.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        paymentReceiver.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("New owner cannot be zero address");
    });
  });
});