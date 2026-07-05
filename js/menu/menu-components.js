/*
   menu-components.js - две кнопки: Приготовить (с оценкой) и Удалить
*/

let selectedMealsForRegenerate = new Set();
let reworkReasons = {};
let collapsedDays = new Set();

function showMenuTab() {
    const content = document.getElementById('content');
    if (!appData.weekStartDate) setWeekToCurrent();
    const weekRange = getWeekDateRange();
    const pickerDate = getDateForPicker();
    
    var html = '<h2>📅 Меню на неделю</h2>';
    
    html += '<div class="week-navigation-row">';
    html += '<button class="small-btn" onclick="prevWeek()">← Пред.</button>';
    html += '<span class="week-range-display">' + weekRange + '</span>';
    html += '<button class="small-btn" onclick="nextWeek()">След. →</button>';
    html += '<input type="date" id="weekPicker" value="' + pickerDate + '" onchange="setWeekFromPicker()" class="date-picker-hidden">';
    html += '<button class="small-btn" onclick="document.getElementById(\'weekPicker\').showPicker()">📅</button>';
    html += '<button class="small-btn" onclick="setWeekToCurrent()">📍</button>';
    html += '</div>';
    
    html += '<div class="menu-two-columns-layout equal-height">';
    html += '<div class="menu-left-column">';
    html += '<div class="week-selector-panel"><h3>📆 Приёмы пищи</h3>' + renderCompactWeekSelector() + '</div>';
    html += '<div class="quick-actions-panel"><h3>⚡ Действия</h3><div class="quick-actions-grid">';
    html += '<button class="small-btn" onclick="selectAllMeals()">✅ Все дни</button>';
    html += '<button class="small-btn" onclick="clearAllMeals()">❌ Очистить</button>';
    html += '<button class="small-btn" onclick="selectWeekdays()">📅 Будни</button>';
    html += '<button class="small-btn" onclick="selectWeekends()">🎉 Выходные</button>';
    html += '<button class="small-btn" onclick="selectAllMealsInMenu()">✅ Все блюда</button>';
    html += '<button class="small-btn" onclick="deselectAllMealsInMenu()">❌ Снять</button>';
    html += '<button class="small-btn" onclick="selectUncookedMeals()">🍳 Неприготовленные</button>';
    html += '<button class="small-btn" onclick="generateReplacementPrompt()">👎 Заменить</button>';
    html += '</div></div></div>';
    
    html += '<div class="menu-right-column">';
    html += '<div class="params-panel"><h3>👤 Параметры</h3><div class="params-horizontal">';
    html += '<input type="number" id="userHeight" placeholder="Рост" value="' + (appData.userHeight || '') + '">';
    html += '<input type="number" id="userWeight" placeholder="Вес" value="' + (appData.userWeight || '') + '">';
    html += '<input type="number" id="userCalories" placeholder="Ккал" value="' + (appData.userCalories || '') + '">';
    html += '<button class="small-btn" onclick="saveUserParams()">💾</button>';
    html += '</div></div>';
    
    html += '<div class="prompt-panel"><h3>🤖 Генерация</h3>';
    html += '<button class="plum-btn" onclick="generatePromptAndCopy()" style="width:100%;">🪄 Сгенерировать промт</button>';
    html += '<p class="prompt-hint">Промт скопируется в буфер</p>';
    html += '<textarea id="promptText" style="display:none;"></textarea>';
    html += '<button class="secondary-btn" onclick="downloadPrompt()" id="downloadPromptBtn" style="display:none;width:100%;margin-top:8px;">💾 Скачать</button>';
    html += '</div>';
    
    html += '<div class="today-stats-panel"><h3>📊 Сегодня</h3><div id="todayStatsContent">' + renderTodayStats() + '</div></div>';
    html += '</div></div>';
    
    html += '<div class="response-panel"><h3>📥 Ответ от DeepSeek</h3>';
    html += '<textarea id="claudeResponse" placeholder="Вставь JSON-ответ..." rows="2"></textarea>';
    html += '<div class="response-actions">';
    html += '<button class="primary-btn" onclick="parseClaudeResponse()">🔍 Распарсить</button>';
    html += '<label class="secondary-btn" style="cursor:pointer;">📂 Загрузить<input type="file" accept=".json,.txt" onchange="loadResponseFromFile(event)" style="display:none;"></label>';
    html += '</div></div>';
    
    html += '<div id="menuDisplay" class="menu-display"></div>';
    
    content.innerHTML = html;
    setTimeout(checkForSavedResponse, 100);
}

function renderCompactWeekSelector() {
    var html = '<div class="compact-week-selector">';
    DAYS.forEach(function(day, index) {
        var dateStr = formatDateForDay(index, 'short');
        var isFullySelected = Object.keys(MEALS).every(function(mid) { return isDayMealSelected(index, mid); });
        var isPartiallySelected = Object.keys(MEALS).some(function(mid) { return isDayMealSelected(index, mid); }) && !isFullySelected;
        var dayClass = 'compact-day-row';
        if (isFullySelected) dayClass += ' fully-selected';
        else if (isPartiallySelected) dayClass += ' partially-selected';
        html += '<div class="' + dayClass + '">';
        html += '<div class="compact-day-header" onclick="toggleDayAllMeals(' + index + ')">';
        html += '<span class="compact-day-name">' + day + '</span>';
        html += '<span class="compact-day-date">' + dateStr + '</span>';
        html += '<span class="compact-day-status">' + (isFullySelected ? '✅' : (isPartiallySelected ? '◐' : '○')) + '</span>';
        html += '</div><div class="compact-meals">';
        Object.keys(MEALS).forEach(function(mealId) {
            var checked = isDayMealSelected(index, mealId) ? 'checked' : '';
            html += '<label class="compact-meal-checkbox"><input type="checkbox" ' + checked + ' onchange="toggleDayMeal(' + index + ',\'' + mealId + '\')"> ' + MEALS[mealId] + '</label>';
        });
        html += '</div></div>';
    });
    return html + '</div>';
}

function toggleDayAllMeals(dayIndex) {
    var allSelected = Object.keys(MEALS).every(function(mid) { return isDayMealSelected(dayIndex, mid); });
    Object.keys(MEALS).forEach(function(mid) {
        if (allSelected && isDayMealSelected(dayIndex, mid)) toggleDayMeal(dayIndex, mid);
        else if (!allSelected && !isDayMealSelected(dayIndex, mid)) toggleDayMeal(dayIndex, mid);
    });
}

function renderTodayStats() {
    var today = new Date();
    var dayOfWeek = today.getDay();
    var dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    var todayName = DAYS[dayIndex];
    var todayMeals = appData.parsedMenu ? appData.parsedMenu.filter(function(m) { return m.day === todayName; }) : [];
    if (!todayMeals.length) return '<p class="empty-stats">На сегодня меню не запланировано</p>';
    var totalKcal = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0;
    todayMeals.forEach(function(m) { if(m.total) { totalKcal += m.total.kcal||0; totalProtein += m.total.protein||0; totalFat += m.total.fat||0; totalCarbs += m.total.carbs||0; } });
    var cookedCount = todayMeals.filter(function(m) { return m.cooked; }).length;
    var targetKcal = (parseInt(appData.userCalories) || 1650) - 140;
    var progress = Math.min(100, Math.round((totalKcal / targetKcal) * 100));
    var listHtml = todayMeals.map(function(m) {
        return '<div class="today-meal-item' + (m.cooked?' cooked':'') + '"><span class="today-meal-type">' + m.meal + '</span><span class="today-meal-title">' + m.title + '</span><span class="today-meal-kcal">' + (m.total?.kcal||0) + ' ккал</span>' + (m.cooked?'<span class="cooked-check">✅</span>':'') + '</div>';
    }).join('');
    return '<div class="today-meals-list">' + listHtml + '</div><div class="today-summary"><div class="today-summary-row"><span>Всего:</span><strong>' + totalKcal + ' / ' + targetKcal + ' ккал</strong></div><div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%;"></div></div><div class="today-summary-row"><span>Б: ' + totalProtein + 'г</span><span>Ж: ' + totalFat + 'г</span><span>У: ' + totalCarbs + 'г</span></div><div class="today-summary-row"><span>🍳 ' + cookedCount + '/' + todayMeals.length + '</span></div></div>';
}

function isDayMealSelected(di, mi) { return (appData.selectedMeals || []).some(function(m) { return m.day === di && m.meal === mi; }); }

async function toggleDayMeal(di, mi) { 
    if (!appData.selectedMeals) appData.selectedMeals = []; 
    var ex = appData.selectedMeals.findIndex(function(m) { return m.day === di && m.meal === mi; }); 
    if (ex > -1) appData.selectedMeals.splice(ex,1); 
    else appData.selectedMeals.push({day:di, meal:mi}); 
    await dbSaveSetting('selectedMeals', appData.selectedMeals);
}

async function selectAllMeals() { appData.selectedMeals = []; for (var d=0; d<7; d++) Object.keys(MEALS).forEach(function(m) { appData.selectedMeals.push({day:d, meal:m}); }); await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }
async function clearAllMeals() { appData.selectedMeals = []; await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }
async function selectWeekdays() { appData.selectedMeals = []; for (var d=0; d<5; d++) Object.keys(MEALS).forEach(function(m) { appData.selectedMeals.push({day:d, meal:m}); }); await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }
async function selectWeekends() { appData.selectedMeals = []; for (var d=5; d<7; d++) Object.keys(MEALS).forEach(function(m) { appData.selectedMeals.push({day:d, meal:m}); }); await dbSaveSetting('selectedMeals', appData.selectedMeals); showMenuTab(); }

async function saveUserParams() {
    appData.userHeight = document.getElementById('userHeight').value;
    appData.userWeight = document.getElementById('userWeight').value;
    appData.userCalories = document.getElementById('userCalories').value;
    await saveAppDataToDB();
}

function getMealPreferencesForPrompt() {
    if (!appData.mealRatings || !Object.keys(appData.mealRatings).length) return '';
    var loved = [], hated = [];
    Object.entries(appData.mealRatings).forEach(function(e) {
        var title = e[0], data = e[1];
        if (data.liked > data.disliked) loved.push({title:title, liked:data.liked, disliked:data.disliked, tags:data.tags||[], comments:data.comments||''});
        else if (data.disliked > data.liked) hated.push({title:title, liked:data.liked, disliked:data.disliked, tags:data.tags||[], comments:data.comments||''});
    });
    var text = '';
    if (loved.length) { text += '\n🍽️ ЛЮБИМЫЕ БЛЮДА:\n'; loved.sort(function(a,b){return b.liked-a.liked}); loved.forEach(function(m){ var tt=m.tags.length?' [теги: '+m.tags.join(', ')+']':''; var ct=m.comments?'\n  💬 "'+m.comments+'"':''; text += '- '+m.title+' — 👍'+m.liked+' 👎'+m.disliked+tt+ct+'\n'; }); text += '→ Предлагай похожие блюда!\n'; }
    if (hated.length) { text += '\n🚫 НЕПОНРАВИВШИЕСЯ БЛЮДА:\n'; hated.sort(function(a,b){return b.disliked-a.disliked}); hated.forEach(function(m){ var tt=m.tags.length?' [теги: '+m.tags.join(', ')+']':''; var ct=m.comments?'\n  💬 "'+m.comments+'"':''; text += '- '+m.title+' — 👍'+m.liked+' 👎'+m.disliked+tt+ct+'\n'; }); text += '→ Избегай этих проблем!\n'; }
    return text;
}

function getLastWeekMenu() {
    if (!appData.menuHistory?.length) return '';
    var lastMenu = appData.menuHistory[appData.menuHistory.length-1];
    if (!lastMenu?.menu) return '';
    var text = '\n📋 ПРОШЛАЯ НЕДЕЛЯ:\n';
    lastMenu.menu.forEach(function(item) { text += '- ' + item.day + ' ' + item.meal + ': ' + item.title + '\n'; });
    return text;
}

function generatePrompt() {
    if (!appData.userHeight || !appData.userWeight || !appData.userCalories) { alert('⚠️ Заполни параметры'); return null; }
    if (!appData.selectedMeals?.length) { alert('⚠️ Выбери приёмы'); return null; }
    var productsList = appData.products.map(function(p) {
        var notes = [];
        if (p.isOpened) notes.push('ОТКРЫТО');
        if (p.isFrozen) notes.push('ЗАМОРОЖЕНО');
        if (p.category === 'canned') notes.push('КОНСЕРВЫ');
        if (p.isOpened && (p.category==='dairy'||p.category==='meat') && !p.isFrozen) notes.push('СКОРОПОРТ');
        return '- ' + p.name + ': ' + p.amount + ' ' + p.unit + (notes.length ? ' ['+notes.join('|')+']' : '');
    }).join('\n');
    var selectedDaysList = appData.selectedMeals.map(function(m) { return DAYS[m.day] + ' (' + formatDateForDay(m.day, 'full') + ') - ' + MEALS[m.meal]; }).join('\n');
    var dailyCalories = parseInt(appData.userCalories) || 1650;
    var remainingCalories = dailyCalories - 140;
    var bCal = Math.round(remainingCalories * 0.25), lCal = Math.round(remainingCalories * 0.40), dCal = Math.round(remainingCalories * 0.35);
    return 'Привет! Ты - шеф-повар мирового уровня вроде Джейми Оливера и Гордона Рамзи. Ты считаешь что все имеют право питаться вкусно и здорово, даже если не умеют готовить на твоем уровне. Составь меню на ' + getWeekDateRange() + '.\n\n=== ПРОДУКТЫ (бери в расчет именно этот список!) ===\n' + productsList + '\n\n' + getMealPreferencesForPrompt() + '\n\n=== НУЖНО МЕНЮ ===\n' + selectedDaysList + '\n' + getLastWeekMenu() + '\n\n=== ОБО МНЕ ===\nЖенщина, ' + appData.userHeight + 'см/' + appData.userWeight + 'кг, ' + dailyCalories + 'ккал/день (вкл. колу 140).\nЗавтрак ~' + bCal + 'ккал, Обед ~' + lCal + 'ккал, Ужин ~' + dCal + 'ккал.\nЗавтраки быстрые, в обеде/ужине белок. Хлеб не покупаю.\nАэрогриль, вафельница, плита, духовка, блендер, вакууматор и СУВИД. Делай акцент на интересные и разнообразные рецепты, позволяющие сохранять КБЖУ. \n\n=== ФОРМАТ JSON ===\n[{"day":"Пн","meal":"Завтрак","title":"...","recipe":["..."],"ingredients":[{"name":"...","amount":"100г","kcal":120,"protein":10,"fat":5,"carbs":8}],"total":{"kcal":' + bCal + ',"protein":30,"fat":20,"carbs":50}}]';
}

function generatePromptAndCopy() {
    var p = generatePrompt(); if (!p) return;
    document.getElementById('promptText').value = p;
    if (navigator.clipboard) { navigator.clipboard.writeText(p).then(function() { document.getElementById('downloadPromptBtn').style.display = 'block'; }); }
    else { document.getElementById('downloadPromptBtn').style.display = 'block'; }
    appData.lastPrompt = p; dbSaveSetting('lastPrompt', p);
}

function downloadPrompt() { var b = new Blob([document.getElementById('promptText').value], {type:'text/plain'}); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'prompt.txt'; a.click(); }

function loadResponseFromFile(e) { var f = e.target.files[0]; if(!f) return; var r = new FileReader(); r.onload = function(ev) { document.getElementById('claudeResponse').value = ev.target.result; }; r.readAsText(f); }
function checkForSavedResponse() { if(appData.lastClaudeResponse) document.getElementById('claudeResponse').value = appData.lastClaudeResponse; }

async function parseClaudeResponse() {
    var r = document.getElementById('claudeResponse').value.trim();
    if (!r) { alert('⚠️ Вставь JSON'); return; }
    r = r.replace(/[^\x20-\x7E\u0400-\u04FF]/g, '');
    appData.lastClaudeResponse = r; await dbSaveSetting('lastClaudeResponse', r);
    try {
        var j = r.replace(/```json\s*/gi, '').replace(/```/g, '');
        var s = j.indexOf('['), e = j.lastIndexOf(']');
        if (s === -1 || e === -1) throw new Error('JSON не найден');
        var menu = JSON.parse(j.substring(s, e+1));
        menu.forEach(function(m) { m.cooked = m.cooked || false; m.liked = m.liked != null ? m.liked : null; });
        appData.parsedMenu = menu;
        await dbSaveMenu(menu, appData.weekStartDate);
        appData.menuHistory = await dbGetMenuHistory();
        selectedMealsForRegenerate.clear(); reworkReasons = {}; collapsedDays.clear();
        displayMenu(menu);
        if (document.getElementById('todayStatsContent')) document.getElementById('todayStatsContent').innerHTML = renderTodayStats();
        alert('✅ Меню сохранено! ' + menu.length + ' блюд.');
    } catch (ex) { alert('❌ Ошибка JSON: ' + ex.message); }
}

function calculateDayKbju(day) {
    var meals = (appData.parsedMenu || []).filter(function(m) { return m.day === day; });
    var kcal=0, prot=0, fat=0, carb=0;
    meals.forEach(function(m) { if(m.total) { kcal+=m.total.kcal||0; prot+=m.total.protein||0; fat+=m.total.fat||0; carb+=m.total.carbs||0; } });
    return { kcal: kcal, prot: prot, fat: fat, carb: carb };
}

function toggleDayCollapse(day) { if(collapsedDays.has(day)) collapsedDays.delete(day); else collapsedDays.add(day); displayMenu(appData.parsedMenu); }

function displayMenu(parsedMenu) {
    var display = document.getElementById('menuDisplay');
    if (!display) return;
    if (!parsedMenu?.length) { parsedMenu = appData.parsedMenu?.length ? appData.parsedMenu : []; if (!parsedMenu.length) { display.innerHTML = '<div class="empty-message">Меню не создано</div>'; return; } }
    appData.parsedMenu = parsedMenu;
    var menuByDay = {}; parsedMenu.forEach(function(m) { if(!menuByDay[m.day]) menuByDay[m.day] = []; menuByDay[m.day].push(m); });
    var html = '<div class="menu-header-actions"><h3>📋 Меню</h3><div><span id="selectedCount">Выбрано: ' + selectedMealsForRegenerate.size + '</span></div></div>';
    Object.keys(menuByDay).sort(function(a,b){return DAYS.indexOf(a)-DAYS.indexOf(b)}).forEach(function(day) {
        var dayKbju = calculateDayKbju(day);
        var isCollapsed = collapsedDays.has(day);
        html += '<div class="menu-day-block">';
        html += '<div class="menu-day-header" onclick="toggleDayCollapse(\'' + day + '\')" style="cursor:pointer;">';
        html += '<h4 class="menu-day-title">' + (isCollapsed?'▶':'▼') + ' 📌 ' + day + ' <span class="menu-day-date">— ' + formatDateForDay(DAYS.indexOf(day), 'full') + '</span></h4>';
        html += '<div class="day-kbju"><span>🔥' + dayKbju.kcal + '</span><span>🍗' + dayKbju.prot + '</span><span>🧈' + dayKbju.fat + '</span><span>🍚' + dayKbju.carb + '</span></div>';
        html += '</div>';
        if (!isCollapsed) {
            menuByDay[day].forEach(function(item) {
                var mealId = item.day + '_' + item.meal + '_' + item.title.replace(/[^a-zA-Z0-9]/g,'_');
                var isSelected = selectedMealsForRegenerate.has(mealId);
                var likedClass = item.liked===true?'liked':(item.liked===false?'disliked':'');
                var cookedClass = item.cooked?'cooked':'';
                var recipeHtml = Array.isArray(item.recipe) ? item.recipe.map(function(s){return '<li>'+s+'</li>'}).join('') : '<li>'+item.recipe+'</li>';
                var ingredientsHtml = item.ingredients ? item.ingredients.map(function(ing){return '<li><span>'+ (ing.name||'') +'</span><span>'+ (ing.amount||'') +'</span><span class="ingredient-kbju">'+ (ing.kcal||0) +'ккал</span></li>'}).join('') : '';
                var total = item.total || {};
                var mealData = JSON.stringify({day:item.day, meal:item.meal, title:item.title}).replace(/"/g,'&quot;');
                
                var statusBadge = '';
                if (item.cooked && item.liked === true) statusBadge = '<span class="meal-status done-liked">👍 Приготовлено</span>';
                else if (item.cooked && item.liked === false) statusBadge = '<span class="meal-status done-disliked">👎 Приготовлено</span>';
                else if (item.cooked) statusBadge = '<span class="meal-status done">✅ Приготовлено</span>';
                
                html += '<div class="menu-item-wrapper"><div class="menu-item-selector"><input type="checkbox" ' + (isSelected?'checked':'') + ' onchange="toggleMealSelection(\'' + mealId + '\')"></div>';
                html += '<div class="menu-item ' + likedClass + ' ' + cookedClass + '">';
                html += '<div class="menu-item-header"><span class="menu-meal">' + item.meal + '</span><span class="menu-title">' + item.title + '</span><span class="menu-kcal">' + (total.kcal||0) + 'ккал</span>' + statusBadge + '</div>';
                html += '<div class="menu-two-columns"><div class="menu-ingredients"><strong>🥗</strong><ul>' + ingredientsHtml + '</ul></div><div class="menu-recipe"><strong>📝</strong><ol class="recipe-steps">' + recipeHtml + '</ol></div></div>';
                html += '<div class="menu-kbju"><span>🔥' + (total.kcal||0) + '</span><span>🍗' + (total.protein||0) + '</span><span>🧈' + (total.fat||0) + '</span><span>🍚' + (total.carbs||0) + '</span></div>';
                
                html += '<div class="menu-actions">';
                if (!item.cooked) {
                    html += '<button class="cook-btn-main" onclick="markAsCookedAndRate(' + mealData + ', null)">🍳 Приготовить</button>';
                } else {
                    html += '<button class="rate-btn" onclick="openRatingModal(' + mealData + ', true)">👍</button>';
                    html += '<button class="rate-btn dislike" onclick="openRatingModal(' + mealData + ', false)">👎</button>';
                }
                html += '<button class="delete-meal-btn-new" onclick="deleteMealFromMenu(\'' + mealId + '\',' + mealData + ')">🗑️</button>';
                html += '</div>';
                
                html += '</div></div>';
            });
        }
        html += '</div>';
    });
    html += '<div class="menu-footer-actions"><div><button class="primary-btn" onclick="deleteSelectedMeals()" ' + (selectedMealsForRegenerate.size?'':'disabled') + '>🗑️ Удалить выбранные</button><button class="primary-btn" onclick="generateReworkPrompt()" ' + (selectedMealsForRegenerate.size?'':'disabled') + '>🔄 Доработать</button></div></div>';
    display.innerHTML = html;
}

function toggleMealSelection(mealId) { if(selectedMealsForRegenerate.has(mealId)) selectedMealsForRegenerate.delete(mealId); else selectedMealsForRegenerate.add(mealId); displayMenu(appData.parsedMenu); }
function selectAllMealsInMenu() { appData.parsedMenu?.forEach(function(item) { selectedMealsForRegenerate.add(item.day + '_' + item.meal + '_' + item.title.replace(/[^a-zA-Z0-9]/g,'_')); }); displayMenu(appData.parsedMenu); }
function deselectAllMealsInMenu() { selectedMealsForRegenerate.clear(); displayMenu(appData.parsedMenu); }
function selectUncookedMeals() { selectedMealsForRegenerate.clear(); appData.parsedMenu?.forEach(function(item) { if (!item.cooked) selectedMealsForRegenerate.add(item.day + '_' + item.meal + '_' + item.title.replace(/[^a-zA-Z0-9]/g,'_')); }); displayMenu(appData.parsedMenu); }

async function deleteMealFromMenu(mealId, mealInfo) {
    if (!confirm('Удалить "' + mealInfo.title + '"?')) return;
    var idx = appData.parsedMenu.findIndex(function(m) { return m.day===mealInfo.day && m.meal===mealInfo.meal && m.title===mealInfo.title; });
    if (idx > -1) { appData.parsedMenu.splice(idx,1); selectedMealsForRegenerate.delete(mealId); delete reworkReasons[mealId]; await dbSaveMenu(appData.parsedMenu, appData.weekStartDate); displayMenu(appData.parsedMenu); }
}

async function deleteSelectedMeals() {
    if (!selectedMealsForRegenerate.size) { alert('⚠️ Выбери блюда'); return; }
    if (!confirm('Удалить ' + selectedMealsForRegenerate.size + ' блюд?')) return;
    appData.parsedMenu = appData.parsedMenu.filter(function(item) { return !selectedMealsForRegenerate.has(item.day + '_' + item.meal + '_' + item.title.replace(/[^a-zA-Z0-9]/g,'_')); });
    selectedMealsForRegenerate.clear(); reworkReasons = {};
    await dbSaveMenu(appData.parsedMenu, appData.weekStartDate); displayMenu(appData.parsedMenu);
}

function generateReworkPrompt() {
    if (!selectedMealsForRegenerate.size) { alert('⚠️ Выбери блюда'); return; }
    var selected = appData.parsedMenu.filter(function(item) { return selectedMealsForRegenerate.has(item.day + '_' + item.meal + '_' + item.title.replace(/[^a-zA-Z0-9]/g,'_')); });
    var p = 'Замени:\n' + selected.map(function(m) { return '- ' + m.day + ' ' + m.meal + ': ' + m.title; }).join('\n') + '\n\nФормат JSON.';
    document.getElementById('promptText').value = p;
    if (navigator.clipboard) navigator.clipboard.writeText(p);
}

function generateReplacementPrompt() {
    var disliked = (appData.parsedMenu || []).filter(function(m) { return m.liked === false; });
    if (!disliked.length) { alert('Нет непонравившихся'); return; }
    selectedMealsForRegenerate.clear();
    disliked.forEach(function(m) { selectedMealsForRegenerate.add(m.day + '_' + m.meal + '_' + m.title.replace(/[^a-zA-Z0-9]/g,'_')); });
    generateReworkPrompt();
}

// НОВАЯ ФУНКЦИЯ ДЛЯ КНОПКИ "ПРИГОТОВИТЬ" С ПОСЛЕДУЮЩЕЙ ОЦЕНКОЙ
function markAsCookedAndRate(mealInfo, liked) {
    if (!mealInfo) return;
    var fullMeal = (appData.parsedMenu || []).find(function(m) { return m.day === mealInfo.day && m.meal === mealInfo.meal && m.title === mealInfo.title; });
    if (!fullMeal) return;
    if (fullMeal.cooked) {
        if (liked !== null && typeof openRatingModal === 'function') openRatingModal(mealInfo, liked);
        return;
    }
    var data = prepareSubtractData(mealInfo);
    if (!data.items.length) {
        fullMeal.cooked = true; fullMeal.cookedDate = new Date().toISOString();
        dbSaveMenu(appData.parsedMenu, appData.weekStartDate); displayMenu(appData.parsedMenu);
        if (liked !== null && typeof openRatingModal === 'function') openRatingModal(mealInfo, liked);
        return;
    }
    window._pendingRating = liked;
    showSubtractConfirmModal(data);
}
