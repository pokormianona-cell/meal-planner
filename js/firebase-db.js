/*
   firebase-db.js - работа с Firebase Firestore
*/

const firebaseOptions = firebase.app().options;
const FIRESTORE_ROOT = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(firebaseOptions.projectId) + '/databases/(default)';
const FIRESTORE_API_KEY = firebaseOptions.apiKey;

function firestoreUrl(path, query) {
    const params = new URLSearchParams(query || {});
    params.set('key', FIRESTORE_API_KEY);
    return FIRESTORE_ROOT + path + '?' + params.toString();
}

function firestoreValue(value) {
    if (value === null) return { nullValue: null };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'object') return { mapValue: { fields: firestoreFields(value) } };
    return { nullValue: null };
}

function firestoreFields(data) {
    const fields = {};
    Object.keys(data || {}).forEach(key => {
        if (data[key] !== undefined) fields[key] = firestoreValue(data[key]);
    });
    return fields;
}

function fromFirestoreValue(value) {
    if (!value || Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;
    if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
    if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue;
    if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
    if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);
    if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue;
    if (value.arrayValue) return (value.arrayValue.values || []).map(fromFirestoreValue);
    if (value.mapValue) return fromFirestoreFields(value.mapValue.fields || {});
    return null;
}

function fromFirestoreFields(fields) {
    const data = {};
    Object.keys(fields || {}).forEach(key => data[key] = fromFirestoreValue(fields[key]));
    return data;
}

function firestoreDocument(document) {
    const parts = document.name.split('/');
    return { id: parts[parts.length - 1], ...fromFirestoreFields(document.fields || {}) };
}

async function firestoreRequest(path, options, query) {
    const response = await fetch(firestoreUrl(path, query), options);
    if (response.status === 404) return null;
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error?.message || ('Firebase HTTP ' + response.status));
    }
    if (response.status === 204) return null;
    return response.json();
}

function firestoreDocumentPath(collection, id) {
    return '/documents/' + encodeURIComponent(collection) + '/' + encodeURIComponent(String(id));
}

async function firestoreList(collection) {
    let pageToken = '';
    const documents = [];
    do {
        const page = await firestoreRequest('/documents/' + encodeURIComponent(collection), null, { pageSize: '300', pageToken });
        (page.documents || []).forEach(document => documents.push(firestoreDocument(document)));
        pageToken = page.nextPageToken || '';
    } while (pageToken);
    return documents;
}

async function firestoreGet(collection, id) {
    const document = await firestoreRequest(firestoreDocumentPath(collection, id));
    return document ? firestoreDocument(document) : null;
}

async function firestoreSet(collection, id, data) {
    return firestoreRequest(firestoreDocumentPath(collection, id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: firestoreFields(data) })
    });
}

async function firestoreAdd(collection, data) {
    const document = await firestoreRequest('/documents/' + encodeURIComponent(collection), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: firestoreFields(data) })
    });
    return firestoreDocument(document);
}

async function firestoreDelete(collection, id) {
    await firestoreRequest(firestoreDocumentPath(collection, id), { method: 'DELETE' });
}

const COLLECTIONS = {
    PRODUCTS: 'products',
    MENU_HISTORY: 'menuHistory',
    MEAL_RATINGS: 'mealRatings',
    USER_SETTINGS: 'userSettings',
    SHOPPING_LIST: 'shoppingList'
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

// ПРОДУКТЫ
async function dbGetAllProducts() {
    return firestoreList(COLLECTIONS.PRODUCTS);
}

async function dbSaveProduct(product) {
    if (product.id) {
        await firestoreSet(COLLECTIONS.PRODUCTS, product.id, product);
    } else {
        const saved = await firestoreAdd(COLLECTIONS.PRODUCTS, product);
        product.id = saved.id;
        await firestoreSet(COLLECTIONS.PRODUCTS, product.id, product);
    }
}

async function dbSaveManyProducts(products) {
    for (const product of products) await dbSaveProduct(product);
}

async function dbDeleteProduct(id) {
    await firestoreDelete(COLLECTIONS.PRODUCTS, id);
}

// НАСТРОЙКИ
async function dbSaveSetting(key, value) {
    await firestoreSet(COLLECTIONS.USER_SETTINGS, key, { value });
}

async function dbGetSetting(key) {
    const document = await firestoreGet(COLLECTIONS.USER_SETTINGS, key);
    return document ? document.value : null;
}

async function dbGetAllSettings() {
    const documents = await firestoreList(COLLECTIONS.USER_SETTINGS);
    const result = {};
    documents.forEach(document => result[document.id] = document.value);
    return result;
}

// МЕНЮ
async function dbSaveMenu(menuItems, weekStart) {
    const weekKey = weekStart || appData.weekStartDate;
    const menuCopy = menuItems.map(m => ({ ...m, cooked: m.cooked || false, liked: m.liked ?? null }));
    await firestoreSet(COLLECTIONS.MENU_HISTORY, weekKey, { date: new Date().toISOString(), weekStart: weekKey, menu: menuCopy });
}

async function dbGetMenuForWeek(weekStart) {
    const document = await firestoreGet(COLLECTIONS.MENU_HISTORY, weekStart);
    if (document) return document.menu;
    // Compatibility with records created before weekStart became the document id.
    const history = await firestoreList(COLLECTIONS.MENU_HISTORY);
    const legacy = history.find(record => record.weekStart === weekStart);
    return legacy ? legacy.menu : null;
}

async function dbGetMenuHistory() {
    const history = await firestoreList(COLLECTIONS.MENU_HISTORY);
    return history.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

// ОЦЕНКИ
async function dbSaveMealRating(title, mealInfo, liked, tags = [], notes = '') {
    await firestoreAdd(COLLECTIONS.MEAL_RATINGS, {
        title, meal: mealInfo.meal || '', day: mealInfo.day || '',
        liked, tags, notes, date: new Date().toISOString()
    });
}

async function dbGetMealRatings(title) {
    const ratings = await firestoreList(COLLECTIONS.MEAL_RATINGS);
    return ratings.filter(rating => rating.title === title);
}

async function dbGetAllRatings() {
    return firestoreList(COLLECTIONS.MEAL_RATINGS);
}

// УДАЛЕНИЕ
async function deleteFromStore(collection, id) {
    await firestoreDelete(collection, id);
}

async function clearStore(collection) {
    const documents = await firestoreList(collection);
    for (const document of documents) await firestoreDelete(collection, document.id);
}

// ИНИЦИАЛИЗАЦИЯ
async function initializeDefaultProducts() {
    const existing = await dbGetAllProducts();
    if (existing.length === 0 && typeof MY_PRODUCTS !== 'undefined') {
        const products = MY_PRODUCTS.map((p, i) => ({ ...p, id: (Date.now() + i).toString() }));
        await dbSaveManyProducts(products);
        return products;
    }
    return existing;
}

async function loadAllDataToAppData(preloadedProducts) {
    const loaded = await Promise.all([
        preloadedProducts || dbGetAllProducts(),
        dbGetAllRatings(),
        dbGetAllSettings(),
        dbGetMenuHistory()
    ]);
    appData.products = loaded[0];
    const ratings = loaded[1];
    appData.mealRatings = {};
    ratings.forEach(r => {
        const key = r.title;
        if (!appData.mealRatings[key]) appData.mealRatings[key] = { title: r.title, liked: 0, disliked: 0, lastRated: null, tags: [], comments: '' };
        r.liked ? appData.mealRatings[key].liked++ : appData.mealRatings[key].disliked++;
        if (r.tags?.length) appData.mealRatings[key].tags = [...new Set([...(appData.mealRatings[key].tags||[]), ...r.tags])];
        if (r.notes) appData.mealRatings[key].comments = r.notes;
        if (!appData.mealRatings[key].lastRated || r.date > appData.mealRatings[key].lastRated) appData.mealRatings[key].lastRated = r.date;
    });
    const settings = loaded[2];
    appData.userHeight = settings.userHeight || null;
    appData.userWeight = settings.userWeight || null;
    appData.userCalories = settings.userCalories || null;
    appData.selectedMeals = settings.selectedMeals || [];
    appData.menuHistory = loaded[3];
    appData.shoppingList = settings.shoppingList || [];
    const storedWeekStart = settings.weekStartDate || null;
    appData.weekStartDate = normalizeWeekStartDate(storedWeekStart);
    if (appData.weekStartDate) {
        const sourceWeekStart = storedWeekStart || appData.weekStartDate;
        appData.parsedMenu = normalizeMenu(await dbGetMenuForWeek(sourceWeekStart));
        if (appData.weekStartDate !== storedWeekStart) {
            await dbSaveSetting('weekStartDate', appData.weekStartDate);
            if (appData.parsedMenu.length) await dbSaveMenu(appData.parsedMenu, appData.weekStartDate);
        }
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
    const products = await initializeDefaultProducts();
    await loadAllDataToAppData(products);
    return appData;
}

// БЕКАП
async function downloadBackup() {
    const data = { version: 1, exportDate: new Date().toISOString(), products: await dbGetAllProducts(), menuHistory: await dbGetMenuHistory(), ratings: await dbGetAllRatings(), settings: await dbGetAllSettings() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
}

async function uploadBackup(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object' || !Array.isArray(data.products) || !Array.isArray(data.menuHistory) || !Array.isArray(data.ratings) || !data.settings || typeof data.settings !== 'object') {
                throw new Error('Неверный формат бэкапа');
            }
            if (data.products) { await clearStore(COLLECTIONS.PRODUCTS); await dbSaveManyProducts(data.products); }
            if (data.ratings) { await clearStore(COLLECTIONS.MEAL_RATINGS); for (const r of data.ratings) await firestoreAdd(COLLECTIONS.MEAL_RATINGS, r); }
            await clearStore(COLLECTIONS.MENU_HISTORY);
            for (const record of data.menuHistory) {
                if (!record.weekStart || !Array.isArray(record.menu)) throw new Error('Повреждённая запись меню');
                await firestoreSet(COLLECTIONS.MENU_HISTORY, record.weekStart, { date: record.date || new Date().toISOString(), weekStart: record.weekStart, menu: record.menu });
            }
            if (data.settings) { for (const [k, v] of Object.entries(data.settings)) await dbSaveSetting(k, v); }
            await loadAllDataToAppData();
            alert('✅ Восстановлено!');
            showTab(appData.currentTab);
        } catch (err) { alert('❌ Ошибка: ' + err.message); }
    };
    reader.readAsText(file);
}
