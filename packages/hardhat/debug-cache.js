const path = require('path');
const os = require('os');

console.log('=== Диагностика путей кеша Hardhat ===\n');

// 1. Путь к глобальному кешу (который мы редактировали)
const globalCache = path.join(os.homedir(), '.cache', 'hardhat-nodejs');
console.log('1. Глобальный кеш (homedir):', globalCache);

// 2. Альтернативный путь к глобальному кешу (через LOCALAPPDATA)
const appDataCache = path.join(process.env.LOCALAPPDATA, 'hardhat-nodejs');
console.log('2. Кеш (LOCALAPPDATA):', appDataCache);

// 3. Проверяем существование папок
const fs = require('fs');
console.log('\n--- Проверка существования ---');
[globalCache, appDataCache].forEach(p => {
    console.log(`* ${p}:`, fs.existsSync(p) ? '✅ Существует' : '❌ Нет');
    if (fs.existsSync(p)) {
        console.log(`  Содержимое:`, fs.readdirSync(p).join(', '));
    }
});

// 4. Конкретный путь к компиляторам, который мы создали
const ourCompilerPath = path.join(process.env.LOCALAPPDATA, 'hardhat-nodejs', 'Cache', 'compilers', 'windows-amd64');
console.log('\n3. Наш путь к компилятору:', ourCompilerPath);
console.log('   Существует?:', fs.existsSync(ourCompilerPath) ? '✅ Да' : '❌ Нет');
if (fs.existsSync(ourCompilerPath)) {
    console.log('   Файлы внутри:', fs.readdirSync(ourCompilerPath).join(', '));
    
    // Проверяем list.json
    const listPath = path.join(ourCompilerPath, 'list.json');
    if (fs.existsSync(listPath)) {
        console.log('\n4. Проверка list.json:');
        try {
            const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
            console.log('   ✅ JSON валиден');
            console.log('   Содержит версию 0.8.20?:', list.releases && list.releases['0.8.20'] ? '✅ Да' : '❌ Нет');
            if (list.releases && list.releases['0.8.20']) {
                const expectedName = list.releases['0.8.20'].path;
                const compilerExists = fs.existsSync(path.join(ourCompilerPath, expectedName));
                console.log(`   Файл "${expectedName}" существует?:`, compilerExists ? '✅ Да' : '❌ Нет');
            }
        } catch (e) {
            console.log('   ❌ Ошибка в JSON:', e.message);
        }
    } else {
        console.log('   ❌ list.json не найден');
    }
}