/*
   shopping.js - список покупок
*/

function showShoppingTab() {
    const content = document.getElementById('content');
    let html = `
        <h2>🛒 Список покупок</h2>
        <div class="shopping-actions">
            <button class="primary-btn" onclick="generateShoppingList()">🔄 Сгенерировать</button>
            <button class="olive-btn" onclick="openAddShoppingModal()">✏️ Добавить</button>
            <button class="secondary-btn" onclick="clearPurchasedItems()">🗑️ Очистить купленное</button>
        </div>
        <div id="shoppingContainer" class="shopping-container-artdeco">${renderShoppingList()}</div>
    `;
    content.innerHTML = html;
}

function renderShoppingList() {
    if (!appData.shoppingList?.length) return '<div class="empty-stats">🛍️ Список пуст</div>';
    const notPurchased = appData.shoppingList.filter(i => !i.purchased);
    const purchased = appData.shoppingList.filter(i => i.purchased);
    let html = `<div class="shopping-summary-artdeco">
        <div class="summary-card"><span class="summary-value">${appData.shoppingList.length}</span><span class="summary-label">Всего</span></div>
        <div class="summary-card"><span class="summary-value">${notPurchased.length}</span><span class="summary-label">Купить</span></div>
        <div class="summary-card"><span class="summary-value">${purchased.length}</span><span class="summary-label">Куплено</span></div>
    </div>`;
    const byCategory = {};
    appData.shoppingList.forEach(item => { const cat = item.category || 'other'; if (!byCategory[cat]) byCategory[cat] = []; byCategory[cat].push(item); });
    Object.keys(byCategory).sort().forEach(catId => {
        const items = byCategory[catId];
        html += `<div class="shopping-category-artdeco"><div class="category-header-shopping" onclick="toggleShoppingCategory('${catId}')"><span class="category-title">${catId}</span><span class="category-count">${items.length}</span><span class="category-toggle" id="shopping-toggle-${catId}">▼</span></div><div id="shopping-cat-${catId}" class="shopping-items-artdeco">`;
        items.forEach(item => html += `<div class="shopping-item-artdeco ${item.purchased?'purchased':''}"><label class="shopping-checkbox"><input type="checkbox" ${item.purchased?'checked':''} onchange="toggleShoppingItem(${item.id})"></label><div class="shopping-info"><span class="shopping-name">${item.name}</span>${item.amount?`<span class="shopping-amount">${item.amount} ${item.unit||'шт'}</span>`:''}</div><button class="action-btn delete" onclick="deleteShoppingItem(${item.id})">🗑️</button></div>`);
        html += `</div></div>`;
    });
    return html;
}

function toggleShoppingCategory(catId) { const c=document.getElementById(`shopping-cat-${catId}`),t=document.getElementById(`shopping-toggle-${catId}`); if(c.style.display==='none'){c.style.display='block';t.textContent='▼';}else{c.style.display='none';t.textContent='▶';} }
async function toggleShoppingItem(id) { const item=appData.shoppingList.find(i=>i.id===id); if(item){item.purchased=!item.purchased;await saveAppDataToDB();showShoppingTab();} }
function openAddShoppingModal() { const html=`<div id="shoppingModal" class="modal-overlay" onclick="if(event.target===this) closeShoppingModal()"><div class="modal-content"><h3>🛍️ Добавить</h3><div class="form-group"><label>Название</label><input type="text" id="shopName"></div><div class="form-row"><div class="form-group"><label>Кол-во</label><input type="number" id="shopAmount" value="1"></div><div class="form-group"><label>Ед.</label><input type="text" id="shopUnit" value="шт"></div></div><div class="modal-actions"><button class="primary-btn" onclick="saveShoppingItem()">💾 Сохранить</button><button class="secondary-btn" onclick="closeShoppingModal()">Отмена</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend',html); }
function closeShoppingModal() { document.getElementById('shoppingModal')?.remove(); }
async function saveShoppingItem() { const name=document.getElementById('shopName').value.trim(); if(!name){alert('Введи название');return;} if(!appData.shoppingList)appData.shoppingList=[]; appData.shoppingList.push({id:Date.now(),name,amount:parseFloat(document.getElementById('shopAmount').value)||1,unit:document.getElementById('shopUnit').value||'шт',purchased:false}); await saveAppDataToDB(); closeShoppingModal(); showShoppingTab(); }
async function deleteShoppingItem(id) { if(!confirm('Удалить?'))return; appData.shoppingList=appData.shoppingList.filter(i=>i.id!==id); await saveAppDataToDB(); showShoppingTab(); }
async function clearPurchasedItems() { const purchased=appData.shoppingList.filter(i=>i.purchased); if(!purchased.length){alert('Нет купленных');return;} if(!confirm(`Удалить ${purchased.length} товаров?`))return; appData.shoppingList=appData.shoppingList.filter(i=>!i.purchased); await saveAppDataToDB(); showShoppingTab(); }
async function generateShoppingList() { alert('🔄 Функция в разработке'); }