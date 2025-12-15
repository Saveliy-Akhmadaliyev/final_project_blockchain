// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentReceiver {
    // Владелец контракта
    address payable public owner;
    
    // Событие для записи платежей
    event PaymentReceived(
        address indexed from,
        uint256 amount,
        string description,
        uint256 timestamp
    );
    
    // Событие для вывода средств
    event Withdrawn(
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );
    
    // Модификатор для проверки владельца
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    // Конструктор
    constructor() {
        owner = payable(msg.sender);
    }
    
    // Функция для приема платежей с описанием
    function makePayment(string memory description) external payable {
        require(msg.value > 0, "Payment must be greater than 0");
        
        emit PaymentReceived(
            msg.sender,
            msg.value,
            description,
            block.timestamp
        );
    }
    
    // Функция для приема платежей без описания (fallback)
    receive() external payable {
        emit PaymentReceived(
            msg.sender,
            msg.value,
            "Payment via receive()",
            block.timestamp
        );
    }
    
    // Функция для вывода всех средств
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(owner, balance, block.timestamp);
    }
    
    // Функция для вывода определенной суммы
    function withdrawAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient balance");
        
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(owner, amount, block.timestamp);
    }
    
    // Функция для получения баланса контракта
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Функция для получения адреса владельца
    function getOwner() external view returns (address) {
        return owner;
    }
    
    // Функция для передачи владения (только владельцем)
    function transferOwnership(address payable newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}