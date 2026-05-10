/*
   database.js - работа с IndexedDB
*/

const DB_NAME = 'MealPlannerDB';
const DB_VERSION = 3;

const STORES = {
    PRODUCTS: 'products',
    MENU_HISTORY: 'menuHistory',
    MEAL_RATINGS: 'mealRatings',
    USER_SETTINGS: 'userSettings',
    SHOPPING_LIST: 'shoppingList',
    FEEDBACK_TAGS: 'feedbackTags'
};

const FEEDBACK_CATEGORIES = {
    NEGATIVE: [
        { id: 'too_fatty', name: '🫒 Слишком жирно' },
        { id: 'too_complicated', name: '🤯 Слишком сложно' },
        { id: 'too_dry', name: '🏜️ Пересушено' },
        { id: 'overcooked', name: '🔥 Пережарено' },
        { id: 'undercooked', name: '🧊 Недоготовлено' },
        { id: 'too_salty', name: '🧂 Пересолено' },
        { id: 'too_spicy', name: '🌶️ Слишком остро' },
        { id: 'bland', name: '😐 Пресно/безвкусно' },
        { id: 'takes_too_long', name: '⏰ Слишком долго' },
        { id: 'weird_combination', name: '🤔 Странное сочетание' }
    ],
    POSITIVE: [
        { id: 'delicious', name: '😋 Очень вкусно' },
        { id: 'quick', name: '⚡ Быстро готовить' },
        { id: 'easy', name: '👍 Легко готовить' },
        { id: 'healthy', name: '🥗 Полезно' },
        { id: 'balanced', name: '⚖️ Сбалансированно' },
        { id: 'filling', name: '🍽️ Сытно' },
        { id: 'budget', name: '💰 Бюджетно' },
        { id: 'looks_good', name: '📸 Красивая подача' },
        { id: 'family_loved', name: '👨‍👩‍👧 Всем понравилось' },
        { id: 'restaurant_quality', name: '⭐ Как в ресторане' }
    ]
};

let db = null;

function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { db = request.result; console.log('✅ База открыта'); resolve(db); };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
                const s = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
                s.createIndex('category', 'category', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.MENU_HISTORY)) {
                const s = db.createObjectStore(STORES.MENU_HISTORY, { keyPath: 'id' });
                s.createIndex('weekStart', 'weekStart', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.MEAL_RATINGS)) {
                const s = db.createObjectStore(STORES.MEAL_RATINGS, { keyPath: 'id' });
                s.createIndex('title', 'title', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
                db.createObjectStore(STORES.USER_SETTINGS, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORES.SHOPPING_LIST)) {
                db.createObjectStore(STORES.SHOPPING_LIST, { keyPath: 'id' });
            }
        };
    });
}

async function dbTransaction(storeName, mode, callback) {
    if (!db) await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        let request;
        try { request = callback(store); } catch (e) { reject(e); return; }
        if (request && request instanceof IDBRequest) {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } else {
            transaction.oncomplete = () => resolve(request);
            transaction.onerror = () => reject(transaction.error);
        }
    });
}

async function getAllFromStore(storeName) { return dbTransaction(storeName, 'readonly', (store) => store.getAll()); }
async function putInStore(storeName, item) { return dbTransaction(storeName, 'readwrite', (store) => store.put(item)); }
async function deleteFromStore(storeName, key) { return dbTransaction(storeName, 'readwrite', (store) => store.delete(key)); }
async function clearStore(storeName) { return dbTransaction(storeName, 'readwrite', (store) => store.clear()); }
async function getByIndex(storeName, indexName, value) { return dbTransaction(storeName, 'readonly', (store) => store.index(indexName).getAll(value)); }

// Продукты
async function dbGetAllProducts() { return getAllFromStore(STORES.PRODUCTS); }
async function dbSaveProduct(product) { return putInStore(STORES.PRODUCTS, product); }
async function dbSaveManyProducts(products) { for (const p of products) await putInStore(STORES.PRODUCTS, p); }
async function dbDeleteProduct(id) { return deleteFromStore(STORES.PRODUCTS, id); }

// Настройки
async function dbSaveSetting(key, value) { return putInStore(STORES.USER_SETTINGS, { key, value }); }
async function dbGetSetting(key) { const r = await dbTransaction(STORES.USER_SETTINGS, 'readonly', (s) => s.get(key)); return r ? r.value : null; }
async function dbGetAllSettings() { const s = await getAllFromStore(STORES.USER_SETTINGS); const r = {}; s.forEach(x => r[x.key] = x.value); return r; }

// Меню с привязкой к неделям
async function dbSaveMenu(menuItems, weekStart) {
    const weekKey = weekStart || appData.weekStartDate;
    const menuCopy = menuItems.map(m => ({ ...m, cooked: m.cooked || false, liked: m.liked ?? null }));
    const allHistory = await getAllFromStore(STORES.MENU_HISTORY);
    const existingIndex = allHistory.findIndex(r => r.weekStart === weekKey);
    if (existingIndex >= 0) {
        allHistory[existingIndex].menu = menuCopy;
        allHistory[existingIndex].date = new Date().toISOString();
        await putInStore(STORES.MENU_HISTORY, allHistory[existingIndex]);
    } else {
        await putInStore(STORES.MENU_HISTORY, {
            id: Date.now(), date: new Date().toISOString(), weekStart: weekKey, menu: menuCopy
        });
    }
}

async function dbGetMenuForWeek(weekStart) {
    const allHistory = await getAllFromStore(STORES.MENU_HISTORY);
    const record = allHistory.find(r => r.weekStart === weekStart);
    return record ? record.menu : null;
}

async function dbGetMenuHistory() { return getAllFromStore(STORES.MENU_HISTORY); }

// Оценки
async function dbSaveMealRating(title, mealInfo, liked, tags = [], notes = '') {
    await putInStore(STORES.MEAL_RATINGS, {
        id: Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title, meal: mealInfo.meal || '', day: mealInfo.day || '',
        liked, tags, notes, date: new Date().toISOString()
    });
}
async function dbGetMealRatings(title) { return getByIndex(STORES.MEAL_RATINGS, 'title', title); }
async function dbGetAllRatings() { return getAllFromStore(STORES.MEAL_RATINGS); }

// Бекап
async function exportAllDataToJSON() {
    return {
        version: 1, exportDate: new Date().toISOString(),
        products: await dbGetAllProducts(),
        menuHistory: await dbGetMenuHistory(),
        ratings: await dbGetAllRatings(),
        settings: await dbGetAllSettings()
    };
}

async function importAllDataFromJSON(data) {
    if (data.products) { await clearStore(STORES.PRODUCTS); await dbSaveManyProducts(data.products); }
    if (data.ratings) { await clearStore(STORES.MEAL_RATINGS); for (const r of data.ratings) await putInStore(STORES.MEAL_RATINGS, r); }
    if (data.settings) { for (const [k, v] of Object.entries(data.settings)) await dbSaveSetting(k, v); }
}

async function downloadBackup() {
    const data = await exportAllDataToJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
}

async function uploadBackup(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            await importAllDataFromJSON(JSON.parse(e.target.result));
            await loadAllDataToAppData();
            alert('✅ Восстановлено!');
            showTab(appData.currentTab);
        } catch (err) { alert('❌ Ошибка: ' + err.message); }
    };
    reader.readAsText(file);
}

// Инициализация
async function initializeDefaultProducts() {
    const existing = await dbGetAllProducts();
    if (existing.length === 0 && typeof MY_PRODUCTS !== 'undefined') {
        const products = MY_PRODUCTS.map((p, i) => ({ ...p, id: Date.now() + i }));
        await dbSaveManyProducts(products);
        return products;
    }
    return existing;
}

async function loadAllDataToAppData() {
    appData.products = await dbGetAllProducts();
    
    const ratings = await dbGetAllRatings();
    appData.mealRatings = {};
    ratings.forEach(r => {
        const key = r.title;
        if (!appData.mealRatings[key]) {
            appData.mealRatings[key] = { title: r.title, liked: 0, disliked: 0, lastRated: null, tags: [], comments: '' };
        }
        r.liked ? appData.mealRatings[key].liked++ : appData.mealRatings[key].disliked++;
        if (r.tags?.length) appData.mealRatings[key].tags = [...new Set([...(appData.mealRatings[key].tags||[]), ...r.tags])];
        if (r.notes) appData.mealRatings[key].comments = r.notes;
        if (!appData.mealRatings[key].lastRated || r.date > appData.mealRatings[key].lastRated) {
            appData.mealRatings[key].lastRated = r.date;
        }
    });
    
    const settings = await dbGetAllSettings();
    appData.userHeight = settings.userHeight || null;
    appData.userWeight = settings.userWeight || null;
    appData.userCalories = settings.userCalories || null;
    appData.selectedMeals = settings.selectedMeals || [];
    appData.menuHistory = await dbGetMenuHistory();
    appData.shoppingList = settings.shoppingList || [];
    appData.weekStartDate = settings.weekStartDate || null;
    
    if (appData.weekStartDate) {
        const menu = await dbGetMenuForWeek(appData.weekStartDate);
        appData.parsedMenu = menu || [];
    }
}

async function saveAppDataToDB() {
    const s = appData;
    if (s.userHeight) await dbSaveSetting('userHeight', s.userHeight);
    if (s.userWeight) await dbSaveSetting('userWeight', s.userWeight);
    if (s.userCalories) await dbSaveSetting('userCalories', s.userCalories);
    if (s.selectedMeals) await dbSaveSetting('selectedMeals', s.selectedMeals);
    if (s.shoppingList) await dbSaveSetting('shoppingList', s.shoppingList);
    if (s.lastPrompt) await dbSaveSetting('lastPrompt', s.lastPrompt);
    if (s.lastClaudeResponse) await dbSaveSetting('lastClaudeResponse', s.lastClaudeResponse);
    if (s.weekStartDate) await dbSaveSetting('weekStartDate', s.weekStartDate);
}

async function initApp() {
    await initDatabase();
    await initializeDefaultProducts();
    await loadAllDataToAppData();
    return appData;
}