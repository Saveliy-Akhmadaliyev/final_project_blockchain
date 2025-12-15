const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== ПРИНУДИТЕЛЬНАЯ НАСТРОЙКА КЕША HARDAHT ===\n');

// 1. Определяем ВСЕ возможные пути кеша
const homeDir = os.homedir();
const possibleCachePaths = [
    path.join(process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'), 'hardhat-nodejs', 'Cache', 'compilers', 'windows-amd64'),
    path.join(homeDir, '.cache', 'hardhat-nodejs', 'compilers', 'windows-amd64'),
    path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'hardhat-nodejs', 'Cache', 'compilers', 'windows-amd64'),
    path.join(os.tmpdir(), 'hardhat-nodejs', 'Cache', 'compilers', 'windows-amd64'),
    path.join(__dirname, '..', 'node_modules', '.cache', 'hardhat-nodejs', 'compilers', 'windows-amd64'),
    path.join(__dirname, '..', '..', 'node_modules', '.cache', 'hardhat-nodejs', 'compilers', 'windows-amd64'),
];

// 2. Наш источник кеша (откуда копировать)
const sourceCachePath = path.join(process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'), 'hardhat-nodejs', 'Cache', 'compilers', 'windows-amd64');

// 3. Проверяем, есть ли у нас исходный кеш
if (!fs.existsSync(sourceCachePath)) {
    console.error('❌ Исходный кеш не найден! Создайте его сначала.');
    process.exit(1);
}

console.log('Источник кеша:', sourceCachePath);
console.log('Файлы в источнике:', fs.readdirSync(sourceCachePath).join(', '));

// 4. Копируем во все возможные пути
console.log('\nКопирование кеша:');
let copiedCount = 0;
for (const destPath of possibleCachePaths) {
    try {
        // Создаем директорию
        fs.mkdirSync(destPath, { recursive: true });
        
        // Копируем файлы
        const files = fs.readdirSync(sourceCachePath);
        for (const file of files) {
            const srcFile = path.join(sourceCachePath, file);
            const destFile = path.join(destPath, file);
            fs.copyFileSync(srcFile, destFile);
        }
        console.log(`✅ ${destPath}`);
        copiedCount++;
    } catch (error) {
        console.log(`❌ ${destPath}: ${error.message}`);
    }
}

console.log(`\nСкопировано в ${copiedCount} из ${possibleCachePaths.length} мест`);

// 5. Запускаем Hardhat с отключенным скачиванием
console.log('\n=== ЗАПУСК КОМПИЛЯЦИИ ===');
process.env.HARDHAT_DISABLE_COMPILER_DOWNLOAD = "true";
process.env.HARDHAT_COMPILER_CACHE_PATH = path.join(process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'), 'hardhat-nodejs', 'Cache');

try {
    console.log('Выполняем yarn hardhat compile...');
    const result = execSync('yarn hardhat compile --show-stack-traces', {
        cwd: __dirname,
        stdio: 'inherit',
        encoding: 'utf8'
    });
    console.log('\n✅ КОМПИЛЯЦИЯ УСПЕШНА!');
} catch (error) {
    console.error('\n❌ Ошибка компиляции:', error.message);
    console.error('\nДля диагностики выполните:');
    console.error('1. Проверьте путь: ' + sourceCachePath);
    console.error('2. Убедитесь, что list.json валиден');
    console.error('3. Проверьте права доступа к файлам');
}
