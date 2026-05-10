/*
   products.js - работа с продуктами через Firebase
*/

function showProductsTab() {
    const content = document.getElementById('content');
    let html = `<h2>📦 Продукты в наличии</h2><div class="products-actions"><button class="add-btn" onclick="openAddProductModal()">➕ Добавить продукт</button></div>`;
    categories.forEach(cat => {
        const prods = getProductsByCategory(cat.id);
        html += `<div class="category-block">
            <div class="category-header" onclick="toggleCategory('${cat.id}')">
                <span class="category-title">${cat.icon} ${cat.name}</span>
                <span class="category-count">${prods.length}</span>
                <span class="category-toggle" id="toggle-${cat.id}">▶</span>
            </div>
            <div id="category-${cat.id}" class="category-content" style="display:none;">${renderProductTable(cat.id)}</div>
        </div>`;
    });
    content.innerHTML = html;
}

function renderProductTable(catId) {
    const prods = getProductsByCategory(catId);
    if (!prods.length) return '<p class="empty-message">Нет продуктов</p>';
    let html = `<table class="products-table"><thead><tr><th>Продукт</th><th>Кол-во</th><th>Начато</th><th>❄️</th><th></th></tr></thead><tbody>`;
    prods.forEach(p => {
        html += `<tr>
            <td>${p.name}</td>
            <td>${p.amount} ${p.unit}</td>
            <td><input type="checkbox" ${p.isOpened?'checked':''} onchange="toggleOpened('${p.id}')"></td>
            <td><input type="checkbox" ${p.isFrozen?'checked':''} onchange="toggleFrozen('${p.id}')"></td>
            <td class="action-buttons">
                <button class="action-btn edit" onclick="openEditProductModal('${p.id}')">✏️</button>
                <button class="action-btn delete" onclick="deleteProduct('${p.id}')">🗑️</button>
            </td>
        </tr>`;
    });
    return html + `</tbody></table>`;
}

function toggleCategory(catId) {
    const cont = document.getElementById(`category-${catId}`);
    const tog = document.getElementById(`toggle-${catId}`);
    if (cont.style.display === 'none') { cont.style.display = 'block'; tog.textContent = '▼'; }
    else { cont.style.display = 'none'; tog.textContent = '▶'; }
}

// ============================================
// МОДАЛЬНЫЕ ОКНА
// ============================================

function openAddProductModal() {
    let catsHtml = ''; 
    categories.forEach(c => catsHtml += `<option value="${c.id}">${c.icon} ${c.name}</option>`);
    
    const html = `
        <div id="productModal" class="modal-overlay" onclick="if(event.target===this) closeProductModal()">
            <div class="modal-content">
                <h3>➕ Новый продукт</h3>
                <div class="form-group"><label>Название</label><input type="text" id="prodName" placeholder="Название"></div>
                <div class="form-row">
                    <div class="form-group" style="flex:2;"><label>Количество</label><input type="number" id="prodAmount" value="1" min="0" step="0.01"></div>
                    <div class="form-group" style="flex:1;"><label>Ед.</label><select id="prodUnit"><option>г</option><option>кг</option><option>мл</option><option>л</option><option>шт</option><option>банка</option><option>упаковка</option></select></div>
                </div>
                <div class="form-group"><label>Категория</label><select id="prodCat">${catsHtml}</select></div>
                <div class="checkboxes">
                    <label class="checkbox-label"><input type="checkbox" id="prodOpened"> Начато</label>
                    <label class="checkbox-label"><input type="checkbox" id="prodFrozen"> ❄️ Морозильник</label>
                </div>
                <div class="modal-actions">
                    <button class="primary-btn" onclick="saveNewProduct()">💾 Сохранить</button>
                    <button class="secondary-btn" onclick="closeProductModal()">Отмена</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function openEditProductModal(productId) {
    const p = appData.products.find(x => x.id == productId || x.id === productId);
    if (!p) { alert('Продукт не найден'); return; }
    
    let catsHtml = ''; 
    categories.forEach(c => catsHtml += `<option value="${c.id}" ${p.category===c.id?'selected':''}>${c.icon} ${c.name}</option>`);
    
    const html = `
        <div id="productModal" class="modal-overlay" onclick="if(event.target===this) closeProductModal()">
            <div class="modal-content">
                <h3>✏️ Редактировать</h3>
                <div class="form-group"><label>Название</label><input type="text" id="prodName" value="${p.name.replace(/"/g,'&quot;')}"></div>
                <div class="form-row">
                    <div class="form-group" style="flex:2;"><label>Количество</label><input type="number" id="prodAmount" value="${p.amount}" min="0" step="0.01"></div>
                    <div class="form-group" style="flex:1;"><label>Ед.</label><select id="prodUnit">
                        <option ${p.unit==='г'?'selected':''}>г</option><option ${p.unit==='кг'?'selected':''}>кг</option>
                        <option ${p.unit==='мл'?'selected':''}>мл</option><option ${p.unit==='л'?'selected':''}>л</option>
                        <option ${p.unit==='шт'?'selected':''}>шт</option><option ${p.unit==='банка'?'selected':''}>банка</option>
                        <option ${p.unit==='упаковка'?'selected':''}>упаковка</option>
                    </select></div>
                </div>
                <div class="form-group"><label>Категория</label><select id="prodCat">${catsHtml}</select></div>
                <div class="checkboxes">
                    <label class="checkbox-label"><input type="checkbox" id="prodOpened" ${p.isOpened?'checked':''}> Начато</label>
                    <label class="checkbox-label"><input type="checkbox" id="prodFrozen" ${p.isFrozen?'checked':''}> ❄️ Морозильник</label>
                </div>
                <div class="modal-actions">
                    <button class="primary-btn" onclick="saveEditedProduct('${p.id}')">💾 Сохранить</button>
                    <button class="secondary-btn" onclick="closeProductModal()">Отмена</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeProductModal() { 
    document.getElementById('productModal')?.remove(); 
}

// ============================================
// СОХРАНЕНИЕ
// ============================================

async function saveNewProduct() {
    const name = document.getElementById('prodName').value.trim();
    if (!name) { alert('Введи название'); return; }
    
    const amount = parseFloat(document.getElementById('prodAmount').value);
    if (isNaN(amount) || amount < 0) { alert('Введи количество'); return; }
    
    const product = {
        name: name,
        amount: amount,
        unit: document.getElementById('prodUnit').value,
        category: document.getElementById('prodCat').value,
        weight: 0,
        weightUnit: '',
        isOpened: document.getElementById('prodOpened').checked,
        isFrozen: document.getElementById('prodFrozen').checked
    };
    
    await dbSaveProduct(product);
    appData.products = await dbGetAllProducts();
    
    closeProductModal();
    showProductsTab();
}

async function saveEditedProduct(productId) {
    const p = appData.products.find(x => x.id == productId || x.id === productId);
    if (!p) { alert('Продукт не найден'); return; }
    
    p.name = document.getElementById('prodName').value.trim();
    p.amount = parseFloat(document.getElementById('prodAmount').value) || 1;
    p.unit = document.getElementById('prodUnit').value;
    p.category = document.getElementById('prodCat').value;
    p.isOpened = document.getElementById('prodOpened').checked;
    p.isFrozen = document.getElementById('prodFrozen').checked;
    
    await dbSaveProduct(p);
    appData.products = await dbGetAllProducts();
    
    closeProductModal();
    showProductsTab();
}

async function deleteProduct(productId) {
    if (!confirm('Удалить продукт?')) return;
    await dbDeleteProduct(productId);
    appData.products = await dbGetAllProducts();
    showProductsTab();
}

async function toggleOpened(productId) {
    const p = appData.products.find(x => x.id == productId || x.id === productId);
    if (p) { p.isOpened = !p.isOpened; await dbSaveProduct(p); }
}

async function toggleFrozen(productId) {
    const p = appData.products.find(x => x.id == productId || x.id === productId);
    if (p) { p.isFrozen = !p.isFrozen; await dbSaveProduct(p); }
}