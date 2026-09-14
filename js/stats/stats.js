/*
   stats.js - статистика
*/

let editingMealTitle = null;

function showStatsTab() {
    const content = document.getElementById('content');
    let html = `
        <div class="page-intro"><div><h2>♥️ Вкусы и открытия</h2><p>Оценки помогают следующему меню становиться интереснее и точнее.</p></div></div>
        <div class="stats-actions-artdeco">
            <button class="primary-btn" onclick="showRecipeLibrary()">📚 Библиотека блюд</button>
            <button class="olive-btn" onclick="showCulinaryDiary()">📔 Кулинарный дневник</button>
            <button class="secondary-btn" onclick="showAllRatings()">📋 Все оценки</button>
            <button class="olive-btn" onclick="showLovedMeals()">⭐ Любимые</button>
            <button class="rose-btn" onclick="showHatedMeals()">👎 Непонравившиеся</button>
        </div>
        <div id="statsContainer" class="stats-container-artdeco"></div>
    `;
    content.innerHTML = html;
    showRecipeLibrary();
}

function getRecipeLibrary() {
    const recipes = new Map();
    const addRecipe = meal => {
        if (!meal?.title) return;
        const key = meal.title.trim().toLocaleLowerCase('ru-RU');
        if (!recipes.has(key)) recipes.set(key, meal);
    };
    (appData.parsedMenu || []).forEach(addRecipe);
    (appData.menuHistory || []).forEach(record => (record.menu || []).forEach(addRecipe));
    return Array.from(recipes.values()).sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

function getRecipeByTitle(title) {
    return getRecipeLibrary().find(recipe => recipe.title === title);
}

function showRecipeLibrary() {
    const container = document.getElementById('statsContainer');
    if (!container) return;
    const recipes = getRecipeLibrary();
    if (!recipes.length) { container.innerHTML = '<div class="empty-stats">📚 Здесь появятся блюда из созданных меню.</div>'; return; }
    container.innerHTML = '<div class="library-heading"><div><h3>📚 Библиотека блюд</h3><p>Все рецепты, которые уже были в твоём меню.</p></div><span>' + recipes.length + ' блюд</span></div><div class="recipe-library-grid">' + recipes.map(recipe => {
        const total = recipe.total || {};
        const rating = appData.mealRatings[recipe.title] || { liked: 0, disliked: 0 };
        const score = rating.liked + rating.disliked ? Math.round(rating.liked / (rating.liked + rating.disliked) * 100) : null;
        return '<article class="library-recipe-card"><div class="library-card-top"><span>' + escapeHtml(recipe.meal || 'Блюдо') + '</span><span>' + (Number(total.kcal) || 0) + ' ккал</span></div><h3>' + escapeHtml(recipe.title) + '</h3><div class="library-card-meta"><span>Б ' + (Number(total.protein) || 0) + ' г</span><span>Ж ' + (Number(total.fat) || 0) + ' г</span><span>У ' + (Number(total.carbs) || 0) + ' г</span></div><div class="library-card-footer">' + (score === null ? '<span>ещё без оценки</span>' : '<span>♥ ' + score + '%</span>') + '<button class="small-btn" onclick="openLibraryRecipe(' + inlineArg(recipe.title) + ')">Рецепт</button></div></article>';
    }).join('') + '</div>';
}

function openLibraryRecipe(title) {
    const recipe = getRecipeByTitle(title);
    if (!recipe) return;
    const ingredients = (recipe.ingredients || []).map(item => '<li><span>' + escapeHtml(item.name || item.ingredient || '') + '</span><b>' + escapeHtml(item.amount || '') + '</b></li>').join('');
    const steps = (recipe.recipe || []).map(step => '<li>' + escapeHtml(step) + '</li>').join('');
    const total = recipe.total || {};
    const html = '<div class="library-recipe-modal"><span class="library-modal-label">' + escapeHtml(recipe.meal || 'Блюдо') + '</span><h3>' + escapeHtml(recipe.title) + '</h3><div class="library-modal-kbju">🔥 ' + (Number(total.kcal) || 0) + ' · Б ' + (Number(total.protein) || 0) + ' · Ж ' + (Number(total.fat) || 0) + ' · У ' + (Number(total.carbs) || 0) + '</div><div class="library-modal-columns"><div><h4>Ингредиенты</h4><ul>' + ingredients + '</ul></div><div><h4>Как готовить</h4><ol>' + steps + '</ol></div></div><button class="primary-btn" onclick="closeModal()">Закрыть</button></div>';
    showModal(html);
}

async function showCulinaryDiary() {
    const container = document.getElementById('statsContainer');
    if (!container) return;
    container.innerHTML = '<div class="empty-stats">Загружаю дневник…</div>';
    const entries = await dbGetAllRatings();
    if (!entries.length) { container.innerHTML = '<div class="empty-stats">📔 Приготовь блюдо и оставь впечатление — так начнётся твой кулинарный дневник.</div>'; return; }
    entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    container.innerHTML = '<div class="library-heading"><div><h3>📔 Кулинарный дневник</h3><p>Впечатления, открытия и заметки после готовки.</p></div><span>' + entries.length + ' записей</span></div><div class="culinary-diary">' + entries.map(entry => '<article class="diary-entry ' + (entry.liked ? 'liked' : 'disliked') + '"><div class="diary-entry-mark">' + (entry.liked ? '♥' : '✦') + '</div><div class="diary-entry-copy"><div><h3>' + escapeHtml(entry.title) + '</h3><span>' + new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ' · ' + escapeHtml(entry.meal || 'блюдо') + '</span></div>' + (entry.tags?.length ? '<div class="diary-tags">' + entry.tags.map(tag => '<span>' + escapeHtml(tag) + '</span>').join('') + '</div>' : '') + (entry.notes ? '<p>' + escapeHtml(entry.notes) + '</p>' : '<p class="diary-empty-note">Без заметки</p>') + '</div><button class="small-btn" onclick="openLibraryRecipe(' + inlineArg(entry.title) + ')">Рецепт</button></article>').join('') + '</div>';
}

function renderAllRatings() {
    if (!appData.mealRatings || !Object.keys(appData.mealRatings).length) {
        return `<div class="empty-stats">✨ Пока нет оценок</div>`;
    }
    const sorted = Object.entries(appData.mealRatings).sort((a, b) => (b[1].liked + b[1].disliked) - (a[1].liked + a[1].disliked));
    let html = `<div class="ratings-summary-artdeco">
        <div class="summary-card"><span class="summary-value">${Object.keys(appData.mealRatings).length}</span><span class="summary-label">Оценено</span></div>
        <div class="summary-card"><span class="summary-value">${Object.values(appData.mealRatings).filter(d=>d.liked>d.disliked).length}</span><span class="summary-label">👍 Любимые</span></div>
        <div class="summary-card"><span class="summary-value">${Object.values(appData.mealRatings).filter(d=>d.disliked>d.liked).length}</span><span class="summary-label">👎 Нелюбимые</span></div>
    </div><div class="ratings-list-artdeco">`;
    
    sorted.forEach(([title, data]) => {
        const total = data.liked + data.disliked;
        const rating = total > 0 ? Math.round((data.liked / total) * 100) : 0;
        html += `<div class="rating-item-artdeco">
            <div class="rating-header"><span class="rating-title">${escapeHtml(title)}</span><span class="rating-score ${rating>=70?'good':(rating<=30?'bad':'neutral')}">${rating}%</span></div>
            <div class="rating-stats"><span>👍 ${data.liked}</span><span>👎 ${data.disliked}</span></div>
            <div class="rating-actions">
                <button class="small-btn" onclick="viewMealDetails(${inlineArg(title)})">🔍</button>
                <button class="small-btn" onclick="editMealRating(${inlineArg(title)})">✏️</button>
            </div></div>`;
    });
    return html + '</div>';
}

function showAllRatings() { document.getElementById('statsContainer').innerHTML = renderAllRatings(); }
function showLovedMeals() {
    const loved = Object.entries(appData.mealRatings).filter(([_,d]) => d.liked > d.disliked);
    if (!loved.length) { document.getElementById('statsContainer').innerHTML = '<div class="empty-stats">⭐ Пока нет любимых</div>'; return; }
    let html = '<h3>⭐ Любимые</h3><div class="ratings-list-artdeco">';
    loved.forEach(([t,d]) => html += `<div class="rating-item-artdeco loved"><div class="rating-header"><span class="rating-title">${escapeHtml(t)}</span><span class="rating-score good">${d.liked}👍</span></div></div>`);
    document.getElementById('statsContainer').innerHTML = html + '</div>';
}
function showHatedMeals() {
    const hated = Object.entries(appData.mealRatings).filter(([_,d]) => d.disliked > d.liked);
    if (!hated.length) { document.getElementById('statsContainer').innerHTML = '<div class="empty-stats">👎 Пока нет нелюбимых</div>'; return; }
    let html = '<h3>👎 Непонравившиеся</h3><div class="ratings-list-artdeco">';
    hated.forEach(([t,d]) => html += `<div class="rating-item-artdeco hated"><div class="rating-header"><span class="rating-title">${escapeHtml(t)}</span><span class="rating-score bad">${d.disliked}👎</span></div></div>`);
    document.getElementById('statsContainer').innerHTML = html + '</div>';
}
function showMealHistory() {
    if (!appData.menuHistory?.length) { document.getElementById('statsContainer').innerHTML = '<div class="empty-stats">📅 История пуста</div>'; return; }
    let html = '<h3>📅 История меню</h3><div class="history-list-artdeco">';
    [...appData.menuHistory].reverse().forEach(r => {
        html += `<div class="history-item-artdeco"><div><span class="history-date">${new Date(r.date).toLocaleDateString('ru-RU')}</span></div><button class="small-btn" onclick="viewHistoryDetails(${inlineArg(r.id)})">🔍</button></div>`;
    });
    document.getElementById('statsContainer').innerHTML = html + '</div>';
}

async function viewMealDetails(title) {
    const ratings = await dbGetMealRatings(title);
    if (!ratings.length) { alert('Нет данных'); return; }
    let html = `<div class="meal-details-modal"><h3>${escapeHtml(title)}</h3>`;
    ratings.forEach(r => {
        html += `<div class="history-rating-item ${r.liked?'liked':'disliked'}"><span>${new Date(r.date).toLocaleString('ru-RU')}</span><span>${r.liked?'👍':'👎'}</span><span>Теги: ${escapeHtml(r.tags?.join(', ')||'нет')}</span>${r.notes?`<p>📝 ${escapeHtml(r.notes)}</p>`:''}</div>`;
    });
    html += `<button class="primary-btn" onclick="closeModal()">Закрыть</button></div>`;
    showModal(html);
}

function viewHistoryDetails(id) {
    const record = appData.menuHistory.find(r => r.id === id);
    if (!record?.menu) return;
    let html = `<div class="history-menu-modal"><h3>📅 ${new Date(record.date).toLocaleDateString('ru-RU')}</h3>`;
    const byDay = {};
    record.menu.forEach(m => { if (!byDay[m.day]) byDay[m.day] = []; byDay[m.day].push(m); });
    Object.keys(byDay).forEach(day => { html += `<h4>${escapeHtml(day)}</h4>`; byDay[day].forEach(m => html += `<div class="history-meal">${escapeHtml(m.meal)}: ${escapeHtml(m.title)}</div>`); });
    html += `<button class="primary-btn" onclick="closeModal()">Закрыть</button></div>`;
    showModal(html);
}

function editMealRating(title) {
    editingMealTitle = title;
    const stats = appData.mealRatings[title] || { liked: 0, disliked: 0 };
    const html = `<div id="editRatingModal" class="modal-overlay" onclick="if(event.target===this) closeAllModals()"><div class="modal-content" style="max-width:450px;"><h3>✏️ Изменить оценку</h3><p><strong>${escapeHtml(title)}</strong></p><p>👍 ${stats.liked} | 👎 ${stats.disliked}</p><button class="like-btn" onclick="window.openAddRatingModal(true)">👍 Понравилось</button><button class="dislike-btn" onclick="window.openAddRatingModal(false)">👎 Не понравилось</button><button class="danger-btn" onclick="resetMealRating()">🗑️ Сбросить</button><button class="secondary-btn" onclick="closeAllModals()">Закрыть</button></div></div>`;
    showModal(html);
}

window.openAddRatingModal = function(liked) {
    if (!editingMealTitle) return;
    const categories = liked ? FEEDBACK_CATEGORIES.POSITIVE : FEEDBACK_CATEGORIES.NEGATIVE;
    let tagsHtml = ''; categories.forEach(t => tagsHtml += `<label class="tag-checkbox"><input type="checkbox" value="${t.id}"><span>${t.name}</span></label>`);
    const html = `<div id="addRatingModal" class="modal-overlay" onclick="if(event.target===this) closeAllModals()"><div class="modal-content"><h3>${liked?'👍 Что понравилось?':'👎 Что не понравилось?'}</h3><p><strong>${escapeHtml(editingMealTitle)}</strong></p><div class="rating-tags-list">${tagsHtml}</div><div class="form-group"><label>Заметки</label><textarea id="ratingNotes" rows="3"></textarea></div><div class="modal-actions"><button class="primary-btn" onclick="window.saveManualRating(${liked})">💾 Сохранить</button><button class="secondary-btn" onclick="closeAllModals()">Отмена</button></div></div></div>`;
    document.getElementById('editRatingModal')?.remove();
    showModal(html);
};

window.saveManualRating = async function(liked) {
    if (!editingMealTitle) return;
    const tags = Array.from(document.querySelectorAll('#addRatingModal .tag-checkbox input:checked')).map(cb => cb.value);
    const notes = document.querySelector('#addRatingModal #ratingNotes')?.value || '';
    await dbSaveMealRating(editingMealTitle, {day:'Вручную',meal:'Вручную',title:editingMealTitle}, liked, tags, notes);
    if (!appData.mealRatings[editingMealTitle]) appData.mealRatings[editingMealTitle] = {title:editingMealTitle,liked:0,disliked:0,tags:[],comments:''};
    liked ? appData.mealRatings[editingMealTitle].liked++ : appData.mealRatings[editingMealTitle].disliked++;
    if (tags.length) appData.mealRatings[editingMealTitle].tags = [...new Set([...(appData.mealRatings[editingMealTitle].tags||[]), ...tags])];
    if (notes) appData.mealRatings[editingMealTitle].comments = notes;
    appData.mealRatings[editingMealTitle].lastRated = new Date().toISOString();
    await saveAppDataToDB();
    closeAllModals(); showStatsTab(); alert('✅ Сохранено!');
};

async function resetMealRating() {
    if (!editingMealTitle || !confirm('Сбросить все оценки?')) return;
    const ratings = await dbGetMealRatings(editingMealTitle);
    for (const r of ratings) await deleteFromStore('mealRatings', r.id);
    delete appData.mealRatings[editingMealTitle];
    await saveAppDataToDB();
    closeAllModals(); showStatsTab();
}

async function clearMealHistory() {
    if (!confirm('Удалить всю историю?')) return;
    await clearStore('menuHistory');
    appData.menuHistory = [];
    await saveAppDataToDB();
    showMealHistory();
}

function showModal(content) { closeAllModals(); document.body.insertAdjacentHTML('beforeend', `<div id="statsModal" class="modal-overlay" onclick="if(event.target===this) closeAllModals()">${content}</div>`); }
function closeAllModals() { document.getElementById('statsModal')?.remove(); document.getElementById('editRatingModal')?.remove(); document.getElementById('addRatingModal')?.remove(); }
function closeModal() { closeAllModals(); }
