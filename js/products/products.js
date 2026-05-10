/*
   products.js - с актуальными продуктами
*/

const MY_PRODUCTS = [
    // Консервы
    { category: 'canned', name: 'Нут', amount: 7, unit: 'банок', weight: 400, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Кукуруза', amount: 9, unit: 'банок', weight: 340, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Зеленый горошек', amount: 8, unit: 'банок', weight: 400, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Красная фасоль в соусе барбекю', amount: 3, unit: 'банки', weight: 400, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Белая фасоль в соусе чили', amount: 1, unit: 'банка', weight: 400, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Паштет из трески', amount: 1, unit: 'банка', weight: 120, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Ананас', amount: 1, unit: 'банка', weight: 565, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Томатный соус', amount: 0.5, unit: 'банки', weight: 350, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'canned', name: 'Песто', amount: 0.5, unit: 'банки', weight: 190, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'canned', name: 'Томаты в собственном соку', amount: 1, unit: 'банка', weight: 400, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'canned', name: 'Консервированные луковички в уксусе', amount: 0.5, unit: 'банки', weight: 300, weightUnit: 'г', isOpened: true, isFrozen: false },
    
    // Заморозки
    { category: 'frozen', name: 'Фасоль зеленая', amount: 500, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Лук в кубиках', amount: 350, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Гавайская смесь', amount: 200, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Смесь на завтрак', amount: 200, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Ягоды смесь', amount: 1000, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Облепиха', amount: 200, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Сырники', amount: 4, unit: 'шт', weight: 75, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Гуакамоле', amount: 200, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Шпинат резанный', amount: 500, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Зеленый горошек', amount: 750, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Кукуруза', amount: 1000, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'frozen', name: 'Бобы эдамеме', amount: 1000, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    
    // Мясо и рыба
    { category: 'meat', name: 'Стейк из свинины', amount: 400, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'meat', name: 'Филе грудки индейки в сливочном соусе', amount: 250, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'meat', name: 'Бекон сырокопченный', amount: 250, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'meat', name: 'Мидии в собственном соку', amount: 450, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'meat', name: 'Тунец замороженный', amount: 1350, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    { category: 'meat', name: 'Медальоны из панганиуса', amount: 200, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: true },
    
    // Бакалея
    { category: 'groceries', name: 'Паста спагетти', amount: 1000, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Паста птитим', amount: 1000, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Белый рис в пакетиках', amount: 5, unit: 'пакетов', weight: 125, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Бурый рис в пакетиках', amount: 10, unit: 'пакетов', weight: 125, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Гречка в пакетиках', amount: 4, unit: 'пакета', weight: 125, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Листья для лазаньи', amount: 1, unit: 'упаковка', weight: 250, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Паста гнезда', amount: 1, unit: 'упаковка', weight: 250, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Паста ракушки большие', amount: 1, unit: 'упаковка', weight: 500, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Кускус', amount: 1000, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Кускус с вялеными томатами', amount: 1, unit: 'упаковка', weight: 250, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Yelli суп итальянский', amount: 1, unit: 'упаковка', weight: 200, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Yelli ризотто с томатами', amount: 1, unit: 'упаковка', weight: 200, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Yelli паста римская со шпинатом', amount: 1, unit: 'упаковка', weight: 200, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Yelli рис со шпинатом по-гречески', amount: 1, unit: 'упаковка', weight: 200, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Yelli кхао пад', amount: 1, unit: 'упаковка', weight: 200, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Суп Грибной из Икеи', amount: 500, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'groceries', name: 'Лапша удон', amount: 1, unit: 'упаковка', weight: 300, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'groceries', name: 'Мюсли', amount: 5000, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    
    // Овощи и фрукты
    { category: 'veggies', name: 'Картофель бэби', amount: 1250, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'veggies', name: 'Чеснок', amount: 3, unit: 'головки', weight: 30, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'veggies', name: 'Лимоны', amount: 2, unit: 'шт', weight: 100, weightUnit: 'г', isOpened: true, isFrozen: false },
    
    // Молочное и яйца
    { category: 'dairy', name: 'Сыр пармезан', amount: 120, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'dairy', name: 'Йогурт греческий', amount: 1, unit: 'банка', weight: 130, weightUnit: 'г', isOpened: false, isFrozen: false },
    { category: 'dairy', name: 'Сербская брынза', amount: 140, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false },
    { category: 'dairy', name: 'Яйца', amount: 6, unit: 'шт', weight: 50, weightUnit: 'г', isOpened: false, isFrozen: false },
    
    // Разное
    { category: 'other', name: 'Подсолнечное масло', amount: 1000, unit: 'мл', weight: 1, weightUnit: 'мл', isOpened: true, isFrozen: false },
    { category: 'other', name: 'Оливковое масло', amount: 1000, unit: 'мл', weight: 1, weightUnit: 'мл', isOpened: true, isFrozen: false },
    { category: 'other', name: 'Репейное масло', amount: 250, unit: 'мл', weight: 1, weightUnit: 'мл', isOpened: true, isFrozen: false },
    { category: 'other', name: 'Чесночное масло', amount: 250, unit: 'мл', weight: 1, weightUnit: 'мл', isOpened: true, isFrozen: false },
    { category: 'other', name: 'Специи разные', amount: 1, unit: 'набор', weight: 0, weightUnit: '', isOpened: true, isFrozen: false },
    { category: 'other', name: 'Соевый соус', amount: 1, unit: 'бутылка', weight: 250, weightUnit: 'мл', isOpened: true, isFrozen: false },
    { category: 'other', name: 'Заправки для салатов', amount: 1, unit: 'набор', weight: 0, weightUnit: '', isOpened: true, isFrozen: false },
    { category: 'other', name: 'Соус гуакамоле', amount: 30, unit: 'г', weight: 1, weightUnit: 'г', isOpened: true, isFrozen: false }
];

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================

function showProductsTab() {
    const content = document.getElementById('content');
    let html = `<h2>📦 Продукты в наличии</h2><div class="products-actions"><button class="add-btn" onclick="openAddProductModal()">➕ Добавить продукт</button></div>`;
    categories.forEach(cat => {
        const prods = getProductsByCategory(cat.id);
        html += `<div class="category-block"><div class="category-header" onclick="toggleCategory('${cat.id}')"><span class="category-title">${cat.icon} ${cat.name}</span><span class="category-count">${prods.length}</span><span class="category-toggle" id="toggle-${cat.id}">▼</span></div><div id="category-${cat.id}" class="category-content" style="display:block;">${renderProductTable(cat.id)}</div></div>`;
    });
    content.innerHTML = html;
}

function renderProductTable(catId) {
    const prods = getProductsByCategory(catId);
    if (!prods.length) return '<p class="empty-message">Нет продуктов</p>';
    let html = `<table class="products-table"><thead><tr><th>Продукт</th><th>Кол-во</th><th>Начато</th><th>❄️</th><th></th></tr></thead><tbody>`;
    prods.forEach(p => {
        html += `<tr><td>${p.name}</td><td>${p.amount} ${p.unit}</td><td><input type="checkbox" ${p.isOpened?'checked':''} onchange="toggleOpened(${p.id})"></td><td><input type="checkbox" ${p.isFrozen?'checked':''} onchange="toggleFrozen(${p.id})"></td><td class="action-buttons"><button class="action-btn edit" onclick="openEditProductModal(${p.id})">✏️</button><button class="action-btn delete" onclick="deleteProduct(${p.id})">🗑️</button></td></tr>`;
    });
    return html + `</tbody></table>`;
}

function toggleCategory(catId) {
    const cont = document.getElementById(`category-${catId}`), tog = document.getElementById(`toggle-${catId}`);
    if (cont.style.display === 'none') { cont.style.display = 'block'; tog.textContent = '▼'; }
    else { cont.style.display = 'none'; tog.textContent = '▶'; }
}

function openAddProductModal() {
    let catsHtml = ''; categories.forEach(c => catsHtml += `<option value="${c.id}">${c.icon} ${c.name}</option>`);
    const html = `<div id="productModal" class="modal-overlay" onclick="if(event.target===this) closeProductModal()"><div class="modal-content"><h3>➕ Новый продукт</h3>
        <div class="form-group"><label>Название</label><input type="text" id="prodName"></div>
        <div class="form-row"><div class="form-group"><label>Кол-во</label><input type="number" id="prodAmount" value="1"></div><div class="form-group"><label>Ед.</label><select id="prodUnit"><option>г</option><option>кг</option><option>мл</option><option>л</option><option>шт</option><option>банка</option><option>упаковка</option></select></div></div>
        <div class="form-group"><label>Категория</label><select id="prodCat">${catsHtml}</select></div>
        <div class="checkboxes"><label class="checkbox-label"><input type="checkbox" id="prodOpened"> Начато</label><label class="checkbox-label"><input type="checkbox" id="prodFrozen"> ❄️ Морозильник</label></div>
        <div class="modal-actions"><button class="primary-btn" onclick="saveNewProduct()">💾 Сохранить</button><button class="secondary-btn" onclick="closeProductModal()">Отмена</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function openEditProductModal(id) {
    const p = appData.products.find(x => x.id === id); if (!p) return;
    let catsHtml = ''; categories.forEach(c => catsHtml += `<option value="${c.id}" ${p.category===c.id?'selected':''}>${c.icon} ${c.name}</option>`);
    const html = `<div id="productModal" class="modal-overlay" onclick="if(event.target===this) closeProductModal()"><div class="modal-content"><h3>✏️ Редактировать</h3>
        <div class="form-group"><label>Название</label><input type="text" id="prodName" value="${p.name.replace(/"/g,'&quot;')}"></div>
        <div class="form-row"><div class="form-group"><label>Кол-во</label><input type="number" id="prodAmount" value="${p.amount}"></div><div class="form-group"><label>Ед.</label><select id="prodUnit"><option ${p.unit==='г'?'selected':''}>г</option><option ${p.unit==='кг'?'selected':''}>кг</option><option ${p.unit==='мл'?'selected':''}>мл</option><option ${p.unit==='л'?'selected':''}>л</option><option ${p.unit==='шт'?'selected':''}>шт</option><option ${p.unit==='банка'?'selected':''}>банка</option><option ${p.unit==='упаковка'?'selected':''}>упаковка</option></select></div></div>
        <div class="form-group"><label>Категория</label><select id="prodCat">${catsHtml}</select></div>
        <div class="checkboxes"><label class="checkbox-label"><input type="checkbox" id="prodOpened" ${p.isOpened?'checked':''}> Начато</label><label class="checkbox-label"><input type="checkbox" id="prodFrozen" ${p.isFrozen?'checked':''}> ❄️ Морозильник</label></div>
        <div class="modal-actions"><button class="primary-btn" onclick="saveEditedProduct(${p.id})">💾 Сохранить</button><button class="secondary-btn" onclick="closeProductModal()">Отмена</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeProductModal() { document.getElementById('productModal')?.remove(); }

async function saveNewProduct() {
    const name = document.getElementById('prodName').value.trim();
    if (!name) { alert('Введи название'); return; }
    const p = { id: Date.now(), category: document.getElementById('prodCat').value, name, amount: parseFloat(document.getElementById('prodAmount').value)||1, unit: document.getElementById('prodUnit').value, weight: 0, weightUnit: '', isOpened: document.getElementById('prodOpened').checked, isFrozen: document.getElementById('prodFrozen').checked };
    await dbSaveProduct(p); appData.products.push(p);
    closeProductModal(); showProductsTab(); alert('✅ Добавлено');
}

async function saveEditedProduct(id) {
    const p = appData.products.find(x => x.id === id); if (!p) return;
    p.name = document.getElementById('prodName').value.trim();
    p.amount = parseFloat(document.getElementById('prodAmount').value)||1;
    p.unit = document.getElementById('prodUnit').value;
    p.category = document.getElementById('prodCat').value;
    p.isOpened = document.getElementById('prodOpened').checked;
    p.isFrozen = document.getElementById('prodFrozen').checked;
    await dbSaveProduct(p); closeProductModal(); showProductsTab(); alert('✅ Сохранено');
}

async function deleteProduct(id) { if(confirm('Удалить?')) { await dbDeleteProduct(id); appData.products = appData.products.filter(p => p.id !== id); showProductsTab(); } }
async function toggleOpened(id) { const p = appData.products.find(x => x.id === id); if(p) { p.isOpened = !p.isOpened; await dbSaveProduct(p); } }
async function toggleFrozen(id) { const p = appData.products.find(x => x.id === id); if(p) { p.isFrozen = !p.isFrozen; await dbSaveProduct(p); } }