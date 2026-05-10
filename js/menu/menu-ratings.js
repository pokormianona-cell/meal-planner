/*
   menu-ratings.js - оценки блюд
*/

let currentRatingMeal = null;

function renderMealStats() { return ''; }
function showFullStats() { showTab('stats'); }

function openRatingModal(mealInfo, liked) {
    currentRatingMeal = mealInfo;
    const categories = liked ? FEEDBACK_CATEGORIES.POSITIVE : FEEDBACK_CATEGORIES.NEGATIVE;
    let tagsHtml = '';
    categories.forEach(tag => {
        tagsHtml += `<label class="tag-checkbox"><input type="checkbox" value="${tag.id}"><span>${tag.name}</span></label>`;
    });
    
    const modalHtml = `
        <div id="ratingModal" class="modal-overlay" onclick="if(event.target===this) closeRatingModal()">
            <div class="modal-content">
                <h3>${liked ? '👍 Что понравилось?' : '👎 Что не понравилось?'}</h3>
                <p class="modal-meal-title">${mealInfo.title}</p>
                <p class="modal-meal-subtitle">${mealInfo.day} • ${mealInfo.meal}</p>
                <div class="rating-tags-section">
                    <p>Выбери теги:</p>
                    <div class="rating-tags-list">${tagsHtml}</div>
                </div>
                <div class="form-group">
                    <label>Заметки</label>
                    <textarea id="ratingNotes" placeholder="Твои заметки..." rows="3"></textarea>
                </div>
                <div class="modal-actions">
                    <button class="primary-btn" onclick="submitRating(${liked})">💾 Сохранить</button>
                    <button class="secondary-btn" onclick="submitQuickRating(${liked})">⚡ Только ${liked ? '👍' : '👎'}</button>
                    <button class="secondary-btn" onclick="closeRatingModal()">❌ Отмена</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeRatingModal() {
    document.getElementById('ratingModal')?.remove();
    currentRatingMeal = null;
}

async function submitRating(liked) {
    if (!currentRatingMeal) return;
    const checkboxes = document.querySelectorAll('#ratingModal .tag-checkbox input:checked');
    const selectedTags = Array.from(checkboxes).map(cb => cb.value);
    const notes = document.getElementById('ratingNotes')?.value || '';
    
    await dbSaveMealRating(currentRatingMeal.title, currentRatingMeal, liked, selectedTags, notes);
    
    const mealItem = appData.parsedMenu.find(m => m.day === currentRatingMeal.day && m.meal === currentRatingMeal.meal && m.title === currentRatingMeal.title);
    if (mealItem) mealItem.liked = liked;
    
    if (!appData.mealRatings[currentRatingMeal.title]) {
        appData.mealRatings[currentRatingMeal.title] = { title: currentRatingMeal.title, liked: 0, disliked: 0, tags: [], comments: '' };
    }
    liked ? appData.mealRatings[currentRatingMeal.title].liked++ : appData.mealRatings[currentRatingMeal.title].disliked++;
    if (selectedTags.length) {
        const existing = appData.mealRatings[currentRatingMeal.title].tags || [];
        appData.mealRatings[currentRatingMeal.title].tags = [...new Set([...existing, ...selectedTags])];
    }
    if (notes) appData.mealRatings[currentRatingMeal.title].comments = notes;
    appData.mealRatings[currentRatingMeal.title].lastRated = new Date().toISOString();
    
    await dbSaveMenu(appData.parsedMenu, appData.weekStartDate);
    await saveAppDataToDB();
    closeRatingModal();
    displayMenu(appData.parsedMenu);
    alert('✅ Оценка сохранена!');
}

async function submitQuickRating(liked) {
    if (!currentRatingMeal) return;
    await dbSaveMealRating(currentRatingMeal.title, currentRatingMeal, liked, [], '');
    
    const mealItem = appData.parsedMenu.find(m => m.day === currentRatingMeal.day && m.meal === currentRatingMeal.meal && m.title === currentRatingMeal.title);
    if (mealItem) mealItem.liked = liked;
    
    if (!appData.mealRatings[currentRatingMeal.title]) {
        appData.mealRatings[currentRatingMeal.title] = { title: currentRatingMeal.title, liked: 0, disliked: 0, tags: [], comments: '' };
    }
    liked ? appData.mealRatings[currentRatingMeal.title].liked++ : appData.mealRatings[currentRatingMeal.title].disliked++;
    appData.mealRatings[currentRatingMeal.title].lastRated = new Date().toISOString();
    
    await dbSaveMenu(appData.parsedMenu, appData.weekStartDate);
    await saveAppDataToDB();
    closeRatingModal();
    displayMenu(appData.parsedMenu);
}