/*
   firebase-db.js - работа с Firebase Firestore
*/

const db = window.firebaseDB;

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
    const snapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function dbSaveProduct(product) {
    if (product.id) {
        await db.collection(COLLECTIONS.PRODUCTS).doc(product.id.toString()).set(product, { merge: true });
    } else {
        const docRef = await db.collection(COLLECTIONS.PRODUCTS).add(product);
        product.id = docRef.id;
    }
}

async function dbSaveManyProducts(products) {
    const batch = db.batch();
    products.forEach(p => {
        const ref = p.id ? db.collection(COLLECTIONS.PRODUCTS).doc(p.id.toString()) : db.collection(COLLECTIONS.PRODUCTS).doc();
        batch.set(ref, p);
    });
    await batch.commit();
}

async function dbDeleteProduct(id) {
    await db.collection(COLLECTIONS.PRODUCTS).doc(id.toString()).delete();
}

// НАСТРОЙКИ
async function dbSaveSetting(key, value) {
    await db.collection(COLLECTIONS.USER_SETTINGS).doc(key).set({ value });
}

async function dbGetSetting(key) {
    const doc = await db.collection(COLLECTIONS.USER_SETTINGS).doc(key).get();
    return doc.exists ? doc.data().value : null;
}

async function dbGetAllSettings() {
    const snapshot = await db.collection(COLLECTIONS.USER_SETTINGS).get();
    const result = {};
    snapshot.docs.forEach(doc => result[doc.id] = doc.data().value);
    return result;
}

// МЕНЮ
async function dbSaveMenu(menuItems, weekStart) {
    const weekKey = weekStart || appData.weekStartDate;
    const menuCopy = menuItems.map(m => ({ ...m, cooked: m.cooked || false, liked: m.liked ?? null }));
    const existing = await db.collection(COLLECTIONS.MENU_HISTORY).where('weekStart', '==', weekKey).get();
    if (!existing.empty) {
        await db.collection(COLLECTIONS.MENU_HISTORY).doc(existing.docs[0].id).update({ menu: menuCopy, date: new Date().toISOString() });
    } else {
        await db.collection(COLLECTIONS.MENU_HISTORY).add({ date: new Date().toISOString(), weekStart: weekKey, menu: menuCopy });
    }
}

async function dbGetMenuForWeek(weekStart) {
    const snapshot = await db.collection(COLLECTIONS.MENU_HISTORY).where('weekStart', '==', weekStart).get();
    return snapshot.empty ? null : snapshot.docs[0].data().menu;
}

async function dbGetMenuHistory() {
    const snapshot = await db.collection(COLLECTIONS.MENU_HISTORY).orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ОЦЕНКИ
async function dbSaveMealRating(title, mealInfo, liked, tags = [], notes = '') {
    await db.collection(COLLECTIONS.MEAL_RATINGS).add({
        title, meal: mealInfo.meal || '', day: mealInfo.day || '',
        liked, tags, notes, date: new Date().toISOString()
    });
}

async function dbGetMealRatings(title) {
    const snapshot = await db.collection(COLLECTIONS.MEAL_RATINGS).where('title', '==', title).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function dbGetAllRatings() {
    const snapshot = await db.collection(COLLECTIONS.MEAL_RATINGS).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// УДАЛЕНИЕ
async function deleteFromStore(collection, id) {
    await db.collection(collection).doc(id.toString()).delete();
}

async function clearStore(collection) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
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

async function loadAllDataToAppData() {
    appData.products = await dbGetAllProducts();
    const ratings = await dbGetAllRatings();
    appData.mealRatings = {};
    ratings.forEach(r => {
        const key = r.title;
        if (!appData.mealRatings[key]) appData.mealRatings[key] = { title: r.title, liked: 0, disliked: 0, lastRated: null, tags: [], comments: '' };
        r.liked ? appData.mealRatings[key].liked++ : appData.mealRatings[key].disliked++;
        if (r.tags?.length) appData.mealRatings[key].tags = [...new Set([...(appData.mealRatings[key].tags||[]), ...r.tags])];
        if (r.notes) appData.mealRatings[key].comments = r.notes;
        if (!appData.mealRatings[key].lastRated || r.date > appData.mealRatings[key].lastRated) appData.mealRatings[key].lastRated = r.date;
    });
    const settings = await dbGetAllSettings();
    appData.userHeight = settings.userHeight || null;
    appData.userWeight = settings.userWeight || null;
    appData.userCalories = settings.userCalories || null;
    appData.selectedMeals = settings.selectedMeals || [];
    appData.menuHistory = await dbGetMenuHistory();
    appData.shoppingList = settings.shoppingList || [];
    appData.weekStartDate = settings.weekStartDate || null;
    if (appData.weekStartDate) appData.parsedMenu = await dbGetMenuForWeek(appData.weekStartDate) || [];
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
    await initializeDefaultProducts();
    await loadAllDataToAppData();
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
            if (data.products) { await clearStore(COLLECTIONS.PRODUCTS); await dbSaveManyProducts(data.products); }
            if (data.ratings) { await clearStore(COLLECTIONS.MEAL_RATINGS); for (const r of data.ratings) await db.collection(COLLECTIONS.MEAL_RATINGS).add(r); }
            if (data.settings) { for (const [k, v] of Object.entries(data.settings)) await dbSaveSetting(k, v); }
            await loadAllDataToAppData();
            alert('✅ Восстановлено!');
            showTab(appData.currentTab);
        } catch (err) { alert('❌ Ошибка: ' + err.message); }
    };
    reader.readAsText(file);
}