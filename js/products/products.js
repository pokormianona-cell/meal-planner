/*
   products.js - с весом одной единицы и количеством упаковок
*/

function showProductsTab() {
    const content = document.getElementById('content');
    let html = `<h2>📦 Продукты в наличии</h2><div class="products-actions"><button class="add-btn" onclick="openAddProductModal()">➕ Добавить продукт</button></div>`;
    categories.forEach(cat => {
        const prods = getProductsByCategory(cat.id);
        const totalWeight = prods.reduce((sum, p) => {
            if (p.unitWeight && p.unitWeight > 0) return sum + (p.amount * p.unitWeight);
            return sum;
        }, 0);
        html += `<div class="category-block">
            <div class="category-header" onclick="toggleCategory('${cat.id}')">
                <span class="category-title">${cat.icon} ${cat.name}</span>
                <span class="category-count">${prods.length} поз.</span>
                ${totalWeight > 0 ? `<span class="category-weight">${totalWeight > 1000 ? (totalWeight/1000).toFixed(1)+' кг' : totalWeight+' г'}</span>` : ''}
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
    let html = `<table class="products-table"><thead><tr><th>Продукт</th><th>Кол-во</th><th>Вес 1 ед.</th><th>Общий вес</th><th>Начато</th><th>❄️</th><th></th></tr></thead><tbody>`;
    prods.forEach(p => {
        const unitWeight = p.unitWeight || 0;
        const totalWeight = unitWeight > 0 ? (p.amount * unitWeight) : 0;
        const totalWeightStr = totalWeight > 0 ? (totalWeight >= 1000 ? (totalWeight/1000).toFixed(2)+' кг' : totalWeight+' г') : '—';
        const unitWeightStr = unitWeight > 0 ? (unitWeight >= 1000 ? (unitWeight/1000).toFixed(1)+' кг' : unitWeight+' г') : '—';
        
        html += `<tr>
            <td><span class="product-name">${p.name}</span></td>
            <td>${p.amount} ${p.unit}</td>
            <td>${unitWeightStr}</td>
            <td>${totalWeightStr}</td>
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
            <div class="modal-content" style="max-width:550px;">
                <h3>➕ Новый продукт</h3>
                
                <div class="form-group">
                    <label>Название</label>
                    <input type="text" id="prodName" placeholder="Например: Гречка">
                </div>
                
                <div class="form-row">
                    <div class="form-group" style="flex:1.5;">
                        <label>Количество</label>
                        <input type="number" id="prodAmount" value="1" min="0" step="0.01">
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label>Ед. измерения</label>
                        <select id="prodUnit">
                            <option value="г">г</option><option value="кг">кг</option>
                            <option value="мл">мл</option><option value="л">л</option>
                            <option value="шт">шт</option><option value="банка">банка</option>
                            <option value="упаковка">упаковка</option>
                            <option value="пакет">пакет</option>
                            <option value="пучок">пучок</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex:1.5;">
                        <label>Вес 1 ед. (г)</label>
                        <input type="number" id="prodUnitWeight" value="0" min="0" step="1" placeholder="0 = не указывать">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Категория</label>
                    <select id="prodCat">${catsHtml}</select>
                </div>
                
                <div class="checkboxes">
                    <label class="checkbox-label"><input type="checkbox" id="prodOpened"> Начато / открыто</label>
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
            <div class="modal-content" style="max-width:550px;">
                <h3>✏️ Редактировать</h3>
                
                <div class="form-group">
                    <label>Название</label>
                    <input type="text" id="prodName" value="${p.name.replace(/"/g,'&quot;')}">
                </div>
                
                <div class="form-row">
                    <div class="form-group" style="flex:1.5;">
                        <label>Количество</label>
                        <input type="number" id="prodAmount" value="${p.amount}" min="0" step="0.01">
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label>Ед. измерения</label>
                        <select id="prodUnit">
                            <option ${p.unit==='г'?'selected':''}>г</option>
                            <option ${p.unit==='кг'?'selected':''}>кг</option>
                            <option ${p.unit==='мл'?'selected':''}>мл</option>
                            <option ${p.unit==='л'?'selected':''}>л</option>
                            <option ${p.unit==='шт'?'selected':''}>шт</option>
                            <option ${p.unit==='банка'?'selected':''}>банка</option>
                            <option ${p.unit==='упаковка'?'selected':''}>упаковка</option>
                            <option ${p.unit==='пакет'?'selected':''}>пакет</option>
                            <option ${p.unit==='пучок'?'selected':''}>пучок</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex:1.5;">
                        <label>Вес 1 ед. (г)</label>
                        <input type="number" id="prodUnitWeight" value="${p.unitWeight || 0}" min="0" step="1">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Категория</label>
                    <select id="prodCat">${catsHtml}</select>
                </div>
                
                <div class="checkboxes">
                    <label class="checkbox-label"><input type="checkbox" id="prodOpened" ${p.isOpened?'checked':''}> Начато / открыто</label>
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

function closeProductModal() { document.getElementById('productModal')?.remove(); }

// ============================================
// СОХРАНЕНИЕ
// ============================================

async function saveNewProduct() {
    const name = document.getElementById('prodName').value.trim();
    if (!name) { alert('Введи название'); return; }
    
    const amount = parseFloat(document.getElementById('prodAmount').value);
    if (isNaN(amount) || amount < 0) { alert('Введи количество'); return; }
    
    const product = {
        name, amount,
        unit: document.getElementById('prodUnit').value,
        unitWeight: parseFloat(document.getElementById('prodUnitWeight').value) || 0,
        weightUnit: 'г',
        category: document.getElementById('prodCat').value,
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
    p.unitWeight = parseFloat(document.getElementById('prodUnitWeight').value) || 0;
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