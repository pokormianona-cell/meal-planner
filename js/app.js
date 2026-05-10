/*
   app.js - основные данные и общие функции
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

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MEALS = {
    'breakfast': '🍳 Завтрак',
    'lunch': '🍲 Обед',
    'dinner': '🥗 Ужин'
};

// Даты
function getDateForDay(dayIndex) {
    if (!appData.weekStartDate) setWeekToCurrent();
    const startDate = new Date(appData.weekStartDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + dayIndex);
    return targetDate;
}

function formatDateForDay(dayIndex, format = 'short') {
    const date = getDateForDay(dayIndex);
    if (format === 'short') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    if (format === 'full') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return date.toLocaleDateString('ru-RU');
}

function getWeekDateRange() {
    if (!appData.weekStartDate) return '';
    const start = new Date(appData.weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

function getMondayFromDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getDateForPicker() {
    if (!appData.weekStartDate) return new Date().toISOString().split('T')[0];
    return appData.weekStartDate;
}

// Меню по неделям
async function saveCurrentMenu() {
    if (appData.parsedMenu && appData.parsedMenu.length > 0) {
        await dbSaveMenu(appData.parsedMenu, appData.weekStartDate);
    }
}

async function loadMenuForCurrentWeek() {
    if (!appData.weekStartDate) return false;
    const menu = await dbGetMenuForWeek(appData.weekStartDate);
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
        setTimeout(() => {
            if (typeof displayMenu === 'function') displayMenu(appData.parsedMenu);
        }, 100);
    }
}

async function nextWeek() {
    const currentStart = new Date(appData.weekStartDate || new Date());
    currentStart.setDate(currentStart.getDate() + 7);
    await switchToWeek(currentStart.toISOString().split('T')[0]);
}

async function prevWeek() {
    const currentStart = new Date(appData.weekStartDate || new Date());
    currentStart.setDate(currentStart.getDate() - 7);
    await switchToWeek(currentStart.toISOString().split('T')[0]);
}

async function setWeekToCurrent() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    if (dayOfWeek === 0) monday.setDate(today.getDate() - 6);
    else monday.setDate(today.getDate() - (dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    await switchToWeek(monday.toISOString().split('T')[0]);
}

async function setWeekFromPicker() {
    const picker = document.getElementById('weekPicker');
    if (!picker || !picker.value) return;
    const monday = getMondayFromDate(new Date(picker.value));
    monday.setHours(0, 0, 0, 0);
    await switchToWeek(monday.toISOString().split('T')[0]);
}

function getProductsByCategory(categoryId) { return appData.products.filter(p => p.category === categoryId); }

async function exportForTelegramBot() {
    const data = {
        exportDate: new Date().toISOString(), weekStartDate: appData.weekStartDate,
        parsedMenu: appData.parsedMenu, shoppingList: appData.shoppingList || [],
        products: appData.products, userHeight: appData.userHeight,
        userWeight: appData.userWeight, userCalories: appData.userCalories,
        mealRatings: appData.mealRatings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'meal-data.json'; a.click();
}

function showTab(tabName) {
    appData.currentTab = tabName;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        const titles = { 'products': 'Продукты', 'menu': 'Меню', 'shopping': 'Покупки', 'stats': 'Статистика' };
        if (tab.textContent.includes(titles[tabName] || '')) tab.classList.add('active');
    });
    if (tabName === 'products' && typeof showProductsTab === 'function') showProductsTab();
    if (tabName === 'menu' && typeof showMenuTab === 'function') { showMenuTab(); setTimeout(() => { if (typeof displayMenu === 'function') displayMenu(appData.parsedMenu); }, 100); }
    if (tabName === 'shopping' && typeof showShoppingTab === 'function') showShoppingTab();
    if (tabName === 'stats' && typeof showStatsTab === 'function') showStatsTab();
}

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof initApp === 'function') await initApp();
    if (appData.products.length === 0 && typeof MY_PRODUCTS !== 'undefined') {
        appData.products = MY_PRODUCTS.map((p, i) => ({ ...p, id: Date.now() + i }));
    }
    if (!appData.weekStartDate) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        if (dayOfWeek === 0) monday.setDate(today.getDate() - 6);
        else monday.setDate(today.getDate() - (dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        appData.weekStartDate = monday.toISOString().split('T')[0];
        await dbSaveSetting('weekStartDate', appData.weekStartDate);
    }
    await loadMenuForCurrentWeek();
    showTab('products');
});