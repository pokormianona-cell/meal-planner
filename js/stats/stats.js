/*
   stats.js - статистика
*/

let editingMealTitle = null;

function showStatsTab() {
    const content = document.getElementById('content');
    let html = `
        <h2>📊 Статистика</h2>
        <div class="stats-actions-artdeco">
            <button class="primary-btn" onclick="showAllRatings()">📋 Все оценки</button>
            <button class="olive-btn" onclick="showLovedMeals()">⭐ Любимые</button>
            <button class="rose-btn" onclick="showHatedMeals()">👎 Непонравившиеся</button>
            <button class="secondary-btn" onclick="showMealHistory()">📅 История</button>
        </div>
        <div id="statsContainer" class="stats-container-artdeco">${renderAllRatings()}</div>
    `;
    content.innerHTML = html;
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
            <div class="rating-header"><span class="rating-title">${title}</span><span class="rating-score ${rating>=70?'good':(rating<=30?'bad':'neutral')}">${rating}%</span></div>
            <div class="rating-stats"><span>👍 ${data.liked}</span><span>👎 ${data.disliked}</span></div>
            <div class="rating-actions">
                <button class="small-btn" onclick="viewMealDetails('${title.replace(/'/g,"\\'")}')">🔍</button>
                <button class="small-btn" onclick="editMealRating('${title.replace(/'/g,"\\'")}')">✏️</button>
            </div></div>`;
    });
    return html + '</div>';
}

function showAllRatings() { document.getElementById('statsContainer').innerHTML = renderAllRatings(); }
function showLovedMeals() {
    const loved = Object.entries(appData.mealRatings).filter(([_,d]) => d.liked > d.disliked);
    if (!loved.length) { document.getElementById('statsContainer').innerHTML = '<div class="empty-stats">⭐ Пока нет любимых</div>'; return; }
    let html = '<h3>⭐ Любимые</h3><div class="ratings-list-artdeco">';
    loved.forEach(([t,d]) => html += `<div class="rating-item-artdeco loved"><div class="rating-header"><span class="rating-title">${t}</span><span class="rating-score good">${d.liked}👍</span></div></div>`);
    document.getElementById('statsContainer').innerHTML = html + '</div>';
}
function showHatedMeals() {
    const hated = Object.entries(appData.mealRatings).filter(([_,d]) => d.disliked > d.liked);
    if (!hated.length) { document.getElementById('statsContainer').innerHTML = '<div class="empty-stats">👎 Пока нет нелюбимых</div>'; return; }
    let html = '<h3>👎 Непонравившиеся</h3><div class="ratings-list-artdeco">';
    hated.forEach(([t,d]) => html += `<div class="rating-item-artdeco hated"><div class="rating-header"><span class="rating-title">${t}</span><span class="rating-score bad">${d.disliked}👎</span></div></div>`);
    document.getElementById('statsContainer').innerHTML = html + '</div>';
}
function showMealHistory() {
    if (!appData.menuHistory?.length) { document.getElementById('statsContainer').innerHTML = '<div class="empty-stats">📅 История пуста</div>'; return; }
    let html = '<h3>📅 История меню</h3><div class="history-list-artdeco">';
    [...appData.menuHistory].reverse().forEach(r => {
        html += `<div class="history-item-artdeco"><div><span class="history-date">${new Date(r.date).toLocaleDateString('ru-RU')}</span></div><button class="small-btn" onclick="viewHistoryDetails(${r.id})">🔍</button></div>`;
    });
    document.getElementById('statsContainer').innerHTML = html + '</div>';
}

async function viewMealDetails(title) {
    const ratings = await dbGetMealRatings(title);
    if (!ratings.length) { alert('Нет данных'); return; }
    let html = `<div class="meal-details-modal"><h3>${title}</h3>`;
    ratings.forEach(r => {
        html += `<div class="history-rating-item ${r.liked?'liked':'disliked'}"><span>${new Date(r.date).toLocaleString('ru-RU')}</span><span>${r.liked?'👍':'👎'}</span><span>Теги: ${r.tags?.join(', ')||'нет'}</span>${r.notes?`<p>📝 ${r.notes}</p>`:''}</div>`;
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
    Object.keys(byDay).forEach(day => { html += `<h4>${day}</h4>`; byDay[day].forEach(m => html += `<div class="history-meal">${m.meal}: ${m.title}</div>`); });
    html += `<button class="primary-btn" onclick="closeModal()">Закрыть</button></div>`;
    showModal(html);
}

function editMealRating(title) {
    editingMealTitle = title;
    const stats = appData.mealRatings[title] || { liked: 0, disliked: 0 };
    const html = `<div id="editRatingModal" class="modal-overlay" onclick="if(event.target===this) closeAllModals()"><div class="modal-content" style="max-width:450px;"><h3>✏️ Изменить оценку</h3><p><strong>${title}</strong></p><p>👍 ${stats.liked} | 👎 ${stats.disliked}</p><button class="like-btn" onclick="window.openAddRatingModal(true)">👍 Понравилось</button><button class="dislike-btn" onclick="window.openAddRatingModal(false)">👎 Не понравилось</button><button class="danger-btn" onclick="resetMealRating()">🗑️ Сбросить</button><button class="secondary-btn" onclick="closeAllModals()">Закрыть</button></div></div>`;
    showModal(html);
}

window.openAddRatingModal = function(liked) {
    if (!editingMealTitle) return;
    const categories = liked ? FEEDBACK_CATEGORIES.POSITIVE : FEEDBACK_CATEGORIES.NEGATIVE;
    let tagsHtml = ''; categories.forEach(t => tagsHtml += `<label class="tag-checkbox"><input type="checkbox" value="${t.id}"><span>${t.name}</span></label>`);
    const html = `<div id="addRatingModal" class="modal-overlay" onclick="if(event.target===this) closeAllModals()"><div class="modal-content"><h3>${liked?'👍 Что понравилось?':'👎 Что не понравилось?'}</h3><p><strong>${editingMealTitle}</strong></p><div class="rating-tags-list">${tagsHtml}</div><div class="form-group"><label>Заметки</label><textarea id="ratingNotes" rows="3"></textarea></div><div class="modal-actions"><button class="primary-btn" onclick="window.saveManualRating(${liked})">💾 Сохранить</button><button class="secondary-btn" onclick="closeAllModals()">Отмена</button></div></div></div>`;
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