/* today.js — главный экран ежедневного сценария */

function renderTodayIngredients(meal) {
    const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    if (!ingredients.length) return '<p class="today-recipe-empty">Ингредиенты для этого блюда не указаны.</p>';

    return '<ul class="today-ingredients-list">' + ingredients.map(ingredient =>
        '<li><span>' + escapeHtml(ingredient.name || ingredient.ingredient || '') + '</span><b>' + escapeHtml(ingredient.amount || '') + '</b></li>'
    ).join('') + '</ul>';
}

function renderTodayRecipe(meal) {
    const steps = Array.isArray(meal.recipe) ? meal.recipe : (meal.recipe ? [meal.recipe] : []);
    if (!steps.length) return '<p class="today-recipe-empty">Для этого блюда пока нет шагов приготовления.</p>';

    return '<ol class="today-recipe-steps">' + steps.map(step => '<li>' + escapeHtml(step) + '</li>').join('') + '</ol>';
}

function showTodayTab() {
    const content = document.getElementById('content');
    const dayName = DAYS[new Date().getDay()];
    const meals = (appData.parsedMenu || []).filter(meal => meal.day === dayName);
    const cooked = meals.filter(meal => meal.cooked).length;
    const totals = meals.reduce((sum, meal) => {
        const total = meal.total || {};
        sum.kcal += Number(total.kcal) || 0;
        sum.protein += Number(total.protein) || 0;
        sum.fat += Number(total.fat) || 0;
        sum.carbs += Number(total.carbs) || 0;
        return sum;
    }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });
    const calorieGoal = Math.max(1, (Number(appData.userCalories) || 1650) - 140);
    const progress = Math.min(100, Math.round(totals.kcal / calorieGoal * 100));
    const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

    const mealsHtml = meals.length ? meals.map(meal => {
        const total = meal.total || {};
        const action = meal.cooked
            ? '<span class="today-done">✓ Готово</span><button class="small-btn" onclick="openRatingModal(' + inlineArg({ day: meal.day, meal: meal.meal, title: meal.title }) + ', true)">Оценить</button>'
            : '<button class="primary-btn" onclick="markAsCookedAndRate(' + inlineArg({ day: meal.day, meal: meal.meal, title: meal.title }) + ', null)">Приготовить</button>';
        return '<article class="today-meal-card ' + (meal.cooked ? 'is-cooked' : '') + '">' +
            '<div class="today-meal-summary"><div class="today-meal-time">' + escapeHtml(meal.meal) + '</div>' +
            '<div class="today-meal-copy"><h3>' + escapeHtml(meal.title) + '</h3><p>' + (Number(total.kcal) || 0) + ' ккал · Б ' + (Number(total.protein) || 0) + ' г · Ж ' + (Number(total.fat) || 0) + ' г · У ' + (Number(total.carbs) || 0) + ' г</p></div>' +
            '<div class="today-meal-action">' + action + '</div></div>' +
            '<div class="today-recipe"><section class="today-recipe-ingredients"><h4>Ингредиенты</h4>' + renderTodayIngredients(meal) + '</section>' +
            '<section class="today-recipe-method"><h4>Пошаговый рецепт</h4>' + renderTodayRecipe(meal) + '</section></div></article>';
    }).join('') : '<div class="today-empty"><strong>На сегодня ещё нет меню.</strong><p>Соберите план на неделю — и здесь появятся блюда с понятным порядком действий.</p><button class="primary-btn" onclick="showTab(\'menu\')">Собрать план</button></div>';

    content.innerHTML = '<section class="today-page">' +
        '<header class="today-hero"><div><span class="today-kicker">' + escapeHtml(date) + '</span><h2>Сегодня · ' + escapeHtml(dayName) + '</h2><p>Один экран для всего, что нужно приготовить и купить сегодня.</p></div><div class="today-hero-actions"><button class="small-btn" onclick="showTab(\'menu\')">План недели</button><button class="small-btn" onclick="showTab(\'shopping\')">Список покупок</button></div></header>' +
        '<div class="today-layout"><section class="today-plan"><div class="today-section-heading"><h3>Что приготовить</h3><span>' + cooked + ' из ' + meals.length + ' готово</span></div><div class="today-meals">' + mealsHtml + '</div></section>' +
        '<aside class="today-balance"><h3>Баланс дня</h3><div class="today-calories"><strong>' + totals.kcal + '</strong><span> / ' + calorieGoal + ' ккал</span></div><div class="today-progress"><span style="width:' + progress + '%"></span></div><div class="today-macros"><span>Б <b>' + totals.protein + ' г</b></span><span>Ж <b>' + totals.fat + ' г</b></span><span>У <b>' + totals.carbs + ' г</b></span></div><div class="today-next"><h4>Следующий шаг</h4><p>' + (meals.length ? (cooked === meals.length ? 'День закрыт — отметьте впечатления от блюд.' : 'Выберите ближайшее блюдо и отметьте его после приготовления.') : 'Добавьте меню на неделю, чтобы видеть план дня.') + '</p></div></aside></div></section>';
}
