/*
   menu-components.js - базовые компоненты меню
*/

let selectedMealsForRegenerate = new Set();
let reworkReasons = {};
let collapsedDays = new Set();

function showMenuTab() {
    const content = document.getElementById('content');
    if (!appData.weekStartDate) setWeekToCurrent();
    
    const weekRange = getWeekDateRange();
    const pickerDate = getDateForPicker();
    
    let html = `
        <h2>📅 Меню на неделю</h2>
        
        <div class="week-navigation-row">
            <button class="small-btn" onclick="prevWeek()">← Пред.</button>
            <span class="week-range-display">${weekRange}</span>
            <button class="small-btn" onclick="nextWeek()">След. →</button>
            <input type="date" id="weekPicker" value="${pickerDate}" onchange="setWeekFromPicker()" class="date-picker-hidden">
            <button class="small-btn" onclick="document.getElementById('weekPicker').showPicker()">📅</button>
            <button class="small-btn" onclick="setWeekToCurrent()">📍</button>
        </div>
        
        <div class="menu-two-columns-layout equal-height">
            <div class="menu-left-column">
                <div class="week-selector-panel">
                    <h3>📆 Приёмы пищи</h3>
                    ${renderCompactWeekSelector()}
                </div>
                <div class="quick-actions-panel">
                    <h3>⚡ Действия</h3>
                    <div class="quick-actions-grid">
                        <button class="small-btn" onclick="selectAllMeals()">✅ Все дни</button>
                        <button class="small-btn" onclick="clearAllMeals()">❌ Очистить</button>
                        <button class="small-btn" onclick="selectWeekdays()">📅 Будни</button>
                        <button class="small-btn" onclick="selectWeekends()">🎉 Выходные</button>
                        <button class="small-btn" onclick="selectAllMealsInMenu()">✅ Все блюда</button>
                        <button class="small-btn" onclick="deselectAllMealsInMenu()">❌ Снять</button>
                        <button class="small-btn" onclick="selectUncookedMeals()">🍳 Неприготовленные</button>
                        <button class="small-btn" onclick="generateReplacementPrompt()">👎 Заменить</button>
                    </div>
                </div>
            </div>
            
            <div class="menu-right-column">
                <div class="params-panel">
                    <h3>👤 Параметры</h3>
                    <div class="params-horizontal">
                        <input type="number" id="userHeight" placeholder="Рост" value="${appData.userHeight || ''}">
                        <input type="number" id="userWeight" placeholder="Вес" value="${appData.userWeight || ''}">
                        <input type="number" id="userCalories" placeholder="Ккал" value="${appData.userCalories || ''}">
                        <button class="small-btn" onclick="saveUserParams()">💾</button>
                    </div>
                </div>
                
                <div class="prompt-panel">
                    <h3>🤖 Генерация</h3>
                    <button class="plum-btn" onclick="generatePromptAndCopy()" style="width:100%;">
                        🪄 Сгенерировать промт
                    </button>
                    <p class="prompt-hint">Промт скопируется в буфер</p>
                    <textarea id="promptText" style="display:none;"></textarea>
                    <button class="secondary-btn" onclick="downloadPrompt()" id="downloadPromptBtn" style="display:none;width:100%;margin-top:8px;">💾 Скачать</button>
                </div>
                
                <div class="today-stats-panel">
                    <h3>📊 Сегодня</h3>
                    <div id="todayStatsContent">${renderTodayStats()}</div>
                </div>
            </div>
        </div>
        
        <div class="response-panel">
            <h3>📥 Ответ от DeepSeek</h3>
            <textarea id="claudeResponse" placeholder='Вставь JSON-ответ...' rows="2"></textarea>
            <div class="response-actions">
                <button class="primary-btn" onclick="parseClaudeResponse()">🔍 Распарсить</button>
                <label class="secondary-btn" style="cursor:pointer;">
                    📂 Загрузить
                    <input type="file" accept=".json,.txt" onchange="loadResponseFromFile(event)" style="display:none;">
                </label>
            </div>
        </div>
        
        <div id="menuDisplay" class="menu-display"></div>
    `;
    
    content.innerHTML = html;
    setTimeout(checkForSavedResponse, 100);
}

function renderCompactWeekSelector() {
    let html = '<div class="compact-week-selector">';
    DAYS.forEach((day, index) => {
        const dateStr = formatDateForDay(index, 'short');
        const isFullySelected = Object.keys(MEALS).every(mid => isDayMealSelected(index, mid));
        const isPartiallySelected = Object.keys(MEALS).some(mid => isDayMealSelected(index, mid)) && !isFullySelected;
        let dayClass = 'compact-day-row';
        if (isFullySelected) dayClass += ' fully-selected';
        else if (isPartiallySelected) dayClass += ' partially-selected';
        html += `<div class="${dayClass}"><div class="compact-day-header" onclick="toggleDayAllMeals(${index})"><span class="compact-day-name">${day}</span><span class="compact-day-date">${dateStr}</span><span class="compact-day-status">${isFullySelected ? '✅' : (isPartiallySelected ? '◐' : '○')}</span></div><div class="compact-meals">`;
        Object.keys(MEALS).forEach(mealId => {
            const checked = isDayMealSelected(index, mealId) ? 'checked' : '';
            html += `<label class="compact-meal-checkbox"><input type="checkbox" ${checked} onchange="toggleDayMeal(${index}, '${mealId}')"> ${MEALS[mealId]}</label>`;
        });
        html += `</div></div>`;
    });
    return html + '</div>';
}

function toggleDayAllMeals(dayIndex) {
    const allSelected = Object.keys(MEALS).every(mid => isDayMealSelected(dayIndex, mid));
    Object.keys(MEALS).forEach(mid => {
        if (allSelected && isDayMealSelected(dayIndex, mid)) toggleDayMeal(dayIndex, mid);
        else if (!allSelected && !isDayMealSelected(dayIndex, mid)) toggleDayMeal(dayIndex, mid);
    });
}

function renderTodayStats() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const todayName = DAYS[dayIndex];
    const todayMeals = appData.parsedMenu?.filter(m => m.day === todayName) || [];
    if (!todayMeals.length) return '<p class="empty-stats">На сегодня меню не запланировано</p>';
    let totalKcal = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0;
    todayMeals.forEach(m => { if(m.total) { totalKcal += m.total.kcal||0; totalProtein += m.total.protein||0; totalFat += m.total.fat||0; totalCarbs += m.total.carbs||0; } });
    const cookedCount = todayMeals.filter(m => m.cooked).length;
    const targetKcal = (parseInt(appData.userCalories) || 1650) - 140;
    const progress = Math.min(100, Math.round((totalKcal / targetKcal) * 100));
    return `<div class="today-meals-list">${todayMeals.map(m => `<div class="today-meal-item ${m.cooked?'cooked':''}"><span class="today-meal-type">${m.meal}</span><span class="today-meal-title">${m.title}</span><span class="today-meal-kcal">${m.total?.kcal||0} ккал</span>${m.cooked?'<span class="cooked-check">✅</span>':''}</div>`).join('')}</div>
        <div class="today-summary"><div class="today-summary-row"><span>Всего:</span><strong>${totalKcal} / ${targetKcal} ккал</strong></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%;"></div></div><div class="today-summary-row"><span>Б: ${totalProtein}г</span><span>Ж: ${totalFat}г</span><span>У: ${totalCarbs}г</span></div><div class="today-summary-row"><span>🍳 ${cookedCount}/${todayMeals.length}</span></div></div>`;
}

function isDayMealSelected(di, mi) { return appData.selectedMeals?.some(m => m.day === di && m.meal === mi) || false; }

async function toggleDayMeal(di, mi) { 
    if (!appData.selectedMeals) appData.selectedMeals = []; 
    const ex = appData.selectedMeals.findIndex(m => m.day === di && m.meal === mi); 
    ex > -1 ? appData.selectedMeals.splice(ex,1) : appData.selectedMeals.push({day:di, meal:mi}); 
    await dbSaveSetting('selectedMeals', appData.selectedMeals);
}

async function selectAllMeals() { appData.selectedMeals = []; for (let d=0; d<7; d++) Object.keys(MEALS).forEach(m => appData.selectedMeals.push({day:d, meal:m})); await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }
async function clearAllMeals() { appData.selectedMeals = []; await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }
async function selectWeekdays() { appData.selectedMeals = []; for (let d=0; d<5; d++) Object.keys(MEALS).forEach(m => appData.selectedMeals.push({day:d, meal:m})); await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }
async function selectWeekends() { appData.selectedMeals = []; for (let d=5; d<7; d++) Object.keys(MEALS).forEach(m => appData.selectedMeals.push({day:d, meal:m})); await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }

async function saveUserParams() {
    appData.userHeight = document.getElementById('userHeight').value;
    appData.userWeight = document.getElementById('userWeight').value;
    appData.userCalories = document.getElementById('userCalories').value;
    await saveAppDataToDB();
}

function getMealPreferencesForPrompt() {
    if (!appData.mealRatings || !Object.keys(appData.mealRatings).length) return '';
    const lovedMeals = [], hatedMeals = [];
    Object.entries(appData.mealRatings).forEach(([title, data]) => {
        if (data.liked > data.disliked) lovedMeals.push({title, liked: data.liked, disliked: data.disliked, tags: data.tags||[], comments: data.comments||''});
        else if (data.disliked > data.liked) hatedMeals.push({title, liked: data.liked, disliked: data.disliked, tags: data.tags||[], comments: data.comments||''});
    });
    let text = '';
    if (lovedMeals.length > 0) { text += '\n🍽️ ЛЮБИМЫЕ БЛЮДА:\n'; lovedMeals.sort((a,b) => b.liked - a.liked); lovedMeals.forEach(m => { const tt = m.tags.length ? ` [теги: ${m.tags.join(', ')}]` : ''; const ct = m.comments ? `\n  💬 "${m.comments}"` : ''; text += `- ${m.title} — 👍${m.liked} 👎${m.disliked}${tt}${ct}\n`; }); text += '→ Предлагай похожие блюда!\n'; }
    if (hatedMeals.length > 0) { text += '\n🚫 НЕПОНРАВИВШИЕСЯ БЛЮДА:\n'; hatedMeals.sort((a,b) => b.disliked - a.disliked); hatedMeals.forEach(m => { const tt = m.tags.length ? ` [теги: ${m.tags.join(', ')}]` : ''; const ct = m.comments ? `\n  💬 "${m.comments}"` : ''; text += `- ${m.title} — 👍${m.liked} 👎${m.disliked}${tt}${ct}\n`; }); text += '→ Избегай этих проблем!\n'; }
    return text;
}

function getLastWeekMenu() {
    if (!appData.menuHistory?.length) return '';
    const lastMenu = appData.menuHistory[appData.menuHistory.length-1];
    if (!lastMenu?.menu) return '';
    let text = '\n📋 ПРОШЛАЯ НЕДЕЛЯ:\n';
    lastMenu.menu.forEach(item => text += `- ${item.day} ${item.meal}: ${item.title}\n`);
    return text;
}

function generatePrompt() {
    if (!appData.userHeight || !appData.userWeight || !appData.userCalories) { alert('⚠️ Заполни параметры'); return null; }
    if (!appData.selectedMeals?.length) { alert('⚠️ Выбери приёмы'); return null; }
    const productsList = appData.products.map(p => {
        let notes = [];
        if (p.isOpened) notes.push('ОТКРЫТО');
        if (p.isFrozen) notes.push('ЗАМОРОЖЕНО');
        if (p.category === 'canned') notes.push('КОНСЕРВЫ');
        if (p.isOpened && (p.category==='dairy'||p.category==='meat') && !p.isFrozen) notes.push('СКОРОПОРТ');
        return `- ${p.name}: ${p.amount} ${p.unit}${notes.length ? ' ['+notes.join('|')+']' : ''}`;
    }).join('\n');
    const selectedDaysList = appData.selectedMeals.map(m => `${DAYS[m.day]} (${formatDateForDay(m.day, 'full')}) - ${MEALS[m.meal]}`).join('\n');
    const dailyCalories = parseInt(appData.userCalories) || 1650;
    const remainingCalories = dailyCalories - 140;
    const bCal = Math.round(remainingCalories * 0.25), lCal = Math.round(remainingCalories * 0.40), dCal = Math.round(remainingCalories * 0.35);
    return `Привет! Ты - шеф-повар. Составь меню на ${getWeekDateRange()}.

=== ПРОДУКТЫ ===
${productsList}

${getMealPreferencesForPrompt()}

=== НУЖНО МЕНЮ ===
${selectedDaysList}
${getLastWeekMenu()}

=== ОБО МНЕ ===
Женщина, ${appData.userHeight}см/${appData.userWeight}кг, ${dailyCalories}ккал/день (вкл. колу 140).
Завтрак ~${bCal}ккал, Обед ~${lCal}ккал, Ужин ~${dCal}ккал.
Завтраки быстрые, ужин-салаты, в обеде/ужине белок. Хлеб не покупаю.
Аэрогриль, вафельница, плита, духовка, блендер.

=== ФОРМАТ JSON ===
[{"day":"Пн","meal":"Завтрак","title":"...","recipe":["..."],"ingredients":[{"name":"...","amount":"100г","kcal":120,"protein":10,"fat":5,"carbs":8}],"total":{"kcal":${bCal},"protein":30,"fat":20,"carbs":50}}]`;
}

function generatePromptAndCopy() {
    const p = generatePrompt(); if (!p) return;
    document.getElementById('promptText').value = p;
    navigator.clipboard?.writeText(p).then(() => { document.getElementById('downloadPromptBtn').style.display = 'block'; }).catch(() => { document.execCommand('copy'); document.getElementById('downloadPromptBtn').style.display = 'block'; });
    appData.lastPrompt = p; dbSaveSetting('lastPrompt', p);
}

function downloadPrompt() { const b = new Blob([document.getElementById('promptText').value], {type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'prompt.txt'; a.click(); }

function loadResponseFromFile(e) { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ev => document.getElementById('claudeResponse').value = ev.target.result; r.readAsText(f); }
function checkForSavedResponse() { if(appData.lastClaudeResponse) document.getElementById('claudeResponse').value = appData.lastClaudeResponse; }

async function parseClaudeResponse() {
    let r = document.getElementById('claudeResponse').value.trim();
    if (!r) { alert('⚠️ Вставь JSON'); return; }
    r = r.replace(/[^\x20-\x7E\u0400-\u04FF]/g, '');
    appData.lastClaudeResponse = r; await dbSaveSetting('lastClaudeResponse', r);
    try {
        let j = r.replace(/```json\s*/gi, '').replace(/```/g, '');
        const s = j.indexOf('['), e = j.lastIndexOf(']');
        if (s === -1 || e === -1) throw new Error('JSON не найден');
        const menu = JSON.parse(j.substring(s, e+1));
        menu.forEach(m => { m.cooked = m.cooked || false; m.liked = m.liked ?? null; });
        appData.parsedMenu = menu;
        await dbSaveMenu(menu, appData.weekStartDate);
        appData.menuHistory = await dbGetMenuHistory();
        selectedMealsForRegenerate.clear(); reworkReasons = {}; collapsedDays.clear();
        displayMenu(menu);
        if (document.getElementById('todayStatsContent')) document.getElementById('todayStatsContent').innerHTML = renderTodayStats();
        alert(`✅ Меню сохранено! ${menu.length} блюд.`);
    } catch (ex) { alert('❌ Ошибка JSON: ' + ex.message); }
}

function calculateDayKbju(day) {
    const meals = appData.parsedMenu?.filter(m => m.day === day) || [];
    let kcal=0, prot=0, fat=0, carb=0;
    meals.forEach(m => { if(m.total) { kcal+=m.total.kcal||0; prot+=m.total.protein||0; fat+=m.total.fat||0; carb+=m.total.carbs||0; } });
    return { kcal, prot, fat, carb };
}

function toggleDayCollapse(day) { collapsedDays.has(day) ? collapsedDays.delete(day) : collapsedDays.add(day); displayMenu(appData.parsedMenu); }

function displayMenu(parsedMenu) {
    const display = document.getElementById('menuDisplay');
    if (!display) return;
    if (!parsedMenu?.length) { parsedMenu = appData.parsedMenu?.length ? appData.parsedMenu : []; if (!parsedMenu.length) { display.innerHTML = '<div class="empty-message">Меню не создано</div>'; return; } }
    appData.parsedMenu = parsedMenu;
    const menuByDay = {}; parsedMenu.forEach(m => { if(!menuByDay[m.day]) menuByDay[m.day] = []; menuByDay[m.day].push(m); });
    let html = `<div class="menu-header-actions"><h3>📋 Меню</h3><div><span id="selectedCount">Выбрано: ${selectedMealsForRegenerate.size}</span></div></div>`;
    Object.keys(menuByDay).sort((a,b) => DAYS.indexOf(a)-DAYS.indexOf(b)).forEach(day => {
        const dayKbju = calculateDayKbju(day);
        const isCollapsed = collapsedDays.has(day);
        html += `<div class="menu-day-block"><div class="menu-day-header" onclick="toggleDayCollapse('${day}')" style="cursor:pointer;"><h4 class="menu-day-title">${isCollapsed?'▶':'▼'} 📌 ${day} <span class="menu-day-date">— ${formatDateForDay(DAYS.indexOf(day), 'full')}</span></h4><div class="day-kbju"><span>🔥${dayKbju.kcal}</span><span>🍗${dayKbju.prot}</span><span>🧈${dayKbju.fat}</span><span>🍚${dayKbju.carb}</span></div></div>`;
        if (!isCollapsed) {
            menuByDay[day].forEach(item => {
                const mealId = `${item.day}_${item.meal}_${item.title.replace(/[^a-zA-Z0-9]/g,'_')}`;
                const isSelected = selectedMealsForRegenerate.has(mealId);
                const likedClass = item.liked===true?'liked':(item.liked===false?'disliked':'');
                const cookedClass = item.cooked?'cooked':'';
                const recipeHtml = Array.isArray(item.recipe) ? item.recipe.map(s => `<li>${s}</li>`).join('') : `<li>${item.recipe}</li>`;
                let ingredientsHtml = item.ingredients ? item.ingredients.map(ing => `<li><span>${ing.name||''}</span><span>${ing.amount||''}</span><span class="ingredient-kbju">${ing.kcal||0}ккал</span></li>`).join('') : '';
                const total = item.total || {};
                const mealData = JSON.stringify({day:item.day, meal:item.meal, title:item.title}).replace(/"/g,'&quot;');
                html += `<div class="menu-item-wrapper"><div class="menu-item-selector"><input type="checkbox" ${isSelected?'checked':''} onchange="toggleMealSelection('${mealId}')"></div><div class="menu-item ${likedClass} ${cookedClass}"><div class="menu-item-header"><span class="menu-meal">${item.meal}</span><span class="menu-title">${item.title} ${item.liked===true?'👍':(item.liked===false?'👎':'')}</span><span class="menu-kcal">${total.kcal||0}ккал</span>${item.cooked?'<span class="cooked-badge">✅</span>':''}</div><div class="menu-two-columns"><div class="menu-ingredients"><strong>🥗</strong><ul>${ingredientsHtml}</ul></div><div class="menu-recipe"><strong>📝</strong><ol class="recipe-steps">${recipeHtml}</ol></div></div><div class="menu-kbju"><span>🔥${total.kcal||0}</span><span>🍗${total.protein||0}</span><span>🧈${total.fat||0}</span><span>🍚${total.carbs||0}</span></div><div class="menu-actions">${!item.cooked?`<button class="cook-btn" onclick='markAsCooked(${mealData})'>🍳</button>`:''}<button class="like-btn" onclick='markAsCookedAndRate(${mealData},true)'>👍</button><button class="dislike-btn" onclick='markAsCookedAndRate(${mealData},false)'>👎</button><button class="delete-meal-btn" onclick='deleteMealFromMenu("${mealId}",${mealData})'>🗑️</button></div></div></div>`;
            });
        }
        html += `</div>`;
    });
    html += `<div class="menu-footer-actions"><div><button class="primary-btn" onclick="deleteSelectedMeals()" ${selectedMealsForRegenerate.size?'':'disabled'}>🗑️ Удалить</button><button class="primary-btn" onclick="generateReworkPrompt()" ${selectedMealsForRegenerate.size?'':'disabled'}>🔄 Доработать</button></div></div>`;
    display.innerHTML = html;
}

function toggleMealSelection(mealId) { selectedMealsForRegenerate.has(mealId) ? selectedMealsForRegenerate.delete(mealId) : selectedMealsForRegenerate.add(mealId); displayMenu(appData.parsedMenu); }
function selectAllMealsInMenu() { appData.parsedMenu?.forEach(item => selectedMealsForRegenerate.add(`${item.day}_${item.meal}_${item.title.replace(/[^a-zA-Z0-9]/g,'_')}`)); displayMenu(appData.parsedMenu); }
function deselectAllMealsInMenu() { selectedMealsForRegenerate.clear(); displayMenu(appData.parsedMenu); }
function selectUncookedMeals() { selectedMealsForRegenerate.clear(); appData.parsedMenu?.forEach(item => { if (!item.cooked) selectedMealsForRegenerate.add(`${item.day}_${item.meal}_${item.title.replace(/[^a-zA-Z0-9]/g,'_')}`); }); displayMenu(appData.parsedMenu); }

async function deleteMealFromMenu(mealId, mealInfo) {
    if (!confirm(`Удалить "${mealInfo.title}"?`)) return;
    const idx = appData.parsedMenu.findIndex(m => m.day===mealInfo.day && m.meal===mealInfo.meal && m.title===mealInfo.title);
    if (idx > -1) { appData.parsedMenu.splice(idx,1); selectedMealsForRegenerate.delete(mealId); delete reworkReasons[mealId]; await dbSaveMenu(appData.parsedMenu, appData.weekStartDate); displayMenu(appData.parsedMenu); }
}
async function deleteSelectedMeals() {
    if (!selectedMealsForRegenerate.size) { alert('⚠️ Выбери блюда'); return; }
    if (!confirm(`Удалить ${selectedMealsForRegenerate.size} блюд?`)) return;
    appData.parsedMenu = appData.parsedMenu.filter(item => !selectedMealsForRegenerate.has(`${item.day}_${item.meal}_${item.title.replace(/[^a-zA-Z0-9]/g,'_')}`));
    selectedMealsForRegenerate.clear(); reworkReasons = {};
    await dbSaveMenu(appData.parsedMenu, appData.weekStartDate); displayMenu(appData.parsedMenu);
}

function generateReworkPrompt() {
    if (!selectedMealsForRegenerate.size) { alert('⚠️ Выбери блюда'); return; }
    const selected = appData.parsedMenu.filter(item => selectedMealsForRegenerate.has(`${item.day}_${item.meal}_${item.title.replace(/[^a-zA-Z0-9]/g,'_')}`));
    let p = `Замени:\n${selected.map(m => `- ${m.day} ${m.meal}: ${m.title}`).join('\n')}\n\nФормат JSON.`;
    document.getElementById('promptText').value = p;
    navigator.clipboard?.writeText(p).then(() => alert('✅ Скопировано'));
}
function generateReplacementPrompt() {
    const disliked = appData.parsedMenu?.filter(m => m.liked === false) || [];
    if (!disliked.length) { alert('Нет непонравившихся'); return; }
    selectedMealsForRegenerate.clear();
    disliked.forEach(m => selectedMealsForRegenerate.add(`${m.day}_${m.meal}_${m.title.replace(/[^a-zA-Z0-9]/g,'_')}`));
    generateReworkPrompt();
}