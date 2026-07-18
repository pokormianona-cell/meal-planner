/*
   app.js - основные данные и общие функции
   Неделя: Воскресенье → Суббота
*/

const appData = {
    currentTab: 'products',
    products: [],
    weeklyMenu: [],
    shoppingList: [],
    userHeight: null,
    userWeight: null,
    userCalories: null,
    selectedMeals: [],
    lastPrompt: null,
    lastClaudeResponse: null,
    parsedMenu: [],
    mealRatings: {},
    menuHistory: [],
    lastAIRecommendations: null,
    weekStartDate: null
};

const categories = [
    { id: 'canned', name: '🥫 Консервы', icon: '🥫' },
    { id: 'frozen', name: '❄️ Заморозки', icon: '❄️' },
    { id: 'meat', name: '🥩 Мясо и рыба', icon: '🥩' },
    { id: 'groceries', name: '🍚 Бакалея', icon: '🍚' },
    { id: 'veggies', name: '🥕 Овощи и фрукты', icon: '🥕' },
    { id: 'dairy', name: '🥛 Молочное и яйца', icon: '🥛' },
    { id: 'other', name: '🧂 Разное', icon: '🧂' }
];

const DAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const MEALS = {
    'breakfast': '🍳 Завтрак',
    'lunch': '🍲 Обед',
    'dinner': '🥗 Ужин'
};

// ============================================
// ДАТЫ (НЕДЕЛЯ С ВОСКРЕСЕНЬЯ)
// ============================================

function getDateForDay(dayIndex) {
    if (!appData.weekStartDate) setWeekToCurrent();
    var startDate = new Date(appData.weekStartDate + 'T00:00:00');
    var targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + dayIndex);
    return targetDate;
}

function formatDateForDay(dayIndex, format) {
    format = format || 'short';
    var date = getDateForDay(dayIndex);
    if (format === 'short') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    if (format === 'full') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return date.toLocaleDateString('ru-RU');
}

function getWeekDateRange() {
    if (!appData.weekStartDate) setWeekToCurrent();
    var start = new Date(appData.weekStartDate + 'T00:00:00');
    var end = new Date(start);
    end.setDate(start.getDate() + 6);
    var startStr = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    var endStr = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return startStr + ' — ' + endStr;
}

function getSundayFromDate(date) {
    var d = new Date(date);
    var day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getDateForPicker() {
    if (!appData.weekStartDate) return new Date().toISOString().split('T')[0];
    return appData.weekStartDate;
}

// ============================================
// МЕНЮ ПО НЕДЕЛЯМ
// ============================================

async function saveCurrentMenu() {
    if (appData.parsedMenu && appData.parsedMenu.length > 0) {
        await dbSaveMenu(appData.parsedMenu, appData.weekStartDate);
    }
}

async function loadMenuForCurrentWeek() {
    if (!appData.weekStartDate) return false;
    var menu = await dbGetMenuForWeek(appData.weekStartDate);
    appData.parsedMenu = menu || [];
    return appData.parsedMenu.length > 0;
}

async function switchToWeek(newWeekStart) {
    if (appData.weekStartDate && appData.weekStartDate !== newWeekStart) {
        await saveCurrentMenu();
    }
    appData.weekStartDate = newWeekStart;
    await dbSaveSetting('weekStartDate', newWeekStart);
    await loadMenuForCurrentWeek();
    
    if (appData.currentTab === 'menu') {
        if (typeof showMenuTab === 'function') showMenuTab();
        setTimeout(function() {
            if (typeof displayMenu === 'function') displayMenu(appData.parsedMenu);
        }, 100);
    }
}

// ============================================
// НАВИГАЦИЯ ПО НЕДЕЛЯМ
// ============================================

async function nextWeek() {
    var currentStart = new Date(appData.weekStartDate + 'T00:00:00');
    currentStart.setDate(currentStart.getDate() + 7);
    await switchToWeek(currentStart.toISOString().split('T')[0]);
}

async function prevWeek() {
    var currentStart = new Date(appData.weekStartDate + 'T00:00:00');
    currentStart.setDate(currentStart.getDate() - 7);
    await switchToWeek(currentStart.toISOString().split('T')[0]);
}

async function setWeekToCurrent() {
    var today = new Date();
    var sunday = getSundayFromDate(today);
    await switchToWeek(sunday.toISOString().split('T')[0]);
}

async function setWeekFromPicker() {
    var picker = document.getElementById('weekPicker');
    if (!picker || !picker.value) return;
    var selectedDate = new Date(picker.value + 'T00:00:00');
    var sunday = getSundayFromDate(selectedDate);
    await switchToWeek(sunday.toISOString().split('T')[0]);
}

// ============================================
// ОСТАЛЬНОЕ
// ============================================

function getProductsByCategory(categoryId) {
    return appData.products.filter(function(p) { return p.category === categoryId; });
}

async function exportForTelegramBot() {
    var data = {
        exportDate: new Date().toISOString(),
        weekStartDate: appData.weekStartDate,
        parsedMenu: appData.parsedMenu,
        shoppingList: appData.shoppingList || [],
        products: appData.products,
        userHeight: appData.userHeight,
        userWeight: appData.userWeight,
        userCalories: appData.userCalories,
        mealRatings: appData.mealRatings
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'meal-data.json';
    a.click();
}

function showTab(tabName) {
    appData.currentTab = tabName;
    document.querySelectorAll('.tab').forEach(function(tab) {
        tab.classList.remove('active');
        var titles = { 'products': 'Продукты', 'menu': 'Меню', 'shopping': 'Покупки', 'stats': 'Статистика' };
        if (tab.textContent.includes(titles[tabName] || '')) tab.classList.add('active');
    });
    if (tabName === 'products' && typeof showProductsTab === 'function') showProductsTab();
    if (tabName === 'menu' && typeof showMenuTab === 'function') {
        showMenuTab();
        setTimeout(function() {
            if (typeof displayMenu === 'function') displayMenu(appData.parsedMenu);
        }, 100);
    }
    if (tabName === 'shopping' && typeof showShoppingTab === 'function') showShoppingTab();
    if (tabName === 'stats' && typeof showStatsTab === 'function') showStatsTab();
}

// ============================================
// ЗАПУСК
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof initApp === 'function') await initApp();
    
    if (appData.products.length === 0 && typeof MY_PRODUCTS !== 'undefined') {
        appData.products = MY_PRODUCTS.map(function(p, i) {
            return Object.assign({}, p, { id: (Date.now() + i).toString() });
        });
    }
    
    if (!appData.weekStartDate) {
        var today = new Date();
        var sunday = getSundayFromDate(today);
        appData.weekStartDate = sunday.toISOString().split('T')[0];
        await dbSaveSetting('weekStartDate', appData.weekStartDate);
    }
    
    await loadMenuForCurrentWeek();
    showTab('products');
});