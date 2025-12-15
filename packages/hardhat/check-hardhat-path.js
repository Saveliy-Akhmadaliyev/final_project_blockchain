const hre = require('hardhat');

async function main() {
    console.log('Запускаем Hardhat...');
    
    // Пробуем получить информацию о конфигурации
    const config = hre.config;
    console.log('Solidity версия:', config.solidity.compilers[0].version);
    
    // Пробуем скомпилировать что-то простое
    const simpleCode = 'pragma solidity ^0.8.20; contract Test {}';
    
    try {
        const result = await hre.artifacts.require('Test').deploy();
        console.log('Успех!');
    } catch (error) {
        console.log('Ошибка:', error.message);
        console.log('Полный стек:', error.stack);
    }
}

main().catch(console.error);
