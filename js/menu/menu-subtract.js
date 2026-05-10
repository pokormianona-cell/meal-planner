/*
   menu-subtract.js - списание ингредиентов
*/

function parseAmount(amountStr) {
    if (!amountStr) return { value: 0, unit: '' };
    const str = amountStr.toString().trim();
    const match = str.match(/^([\d.,]+)\s*([a-zA-Zа-яА-Я]*)$/);
    if (match) return { value: parseFloat(match[1].replace(',', '.')), unit: match[2] || '' };
    return { value: 0, unit: '' };
}

function normalizeUnit(unit) {
    const map = { 'шт':'шт','банка':'банка','упаковка':'упаковка','пакет':'пакет','зубчик':'зубчик','головка':'головка','пучок':'пучок','г':'г','кг':'кг','мл':'мл','л':'л' };
    return map[unit.toLowerCase()] || unit;
}

function findMatchingProduct(name, products) {
    const s = name.toLowerCase().trim();
    let m = products.find(p => p.name.toLowerCase().includes(s) || s.includes(p.name.toLowerCase()));
    if (m) return m;
    const kw = s.split(' ').filter(w => w.length > 2);
    for (let k of kw) { m = products.find(p => p.name.toLowerCase().includes(k)); if (m) return m; }
    return null;
}

function calculateSubtractAmount(required, requiredUnit, product) {
    const rn = normalizeUnit(requiredUnit), pn = normalizeUnit(product.unit);
    if (rn === pn) return required;
    if ((rn === 'г' || rn === 'мл') && product.weight > 0) return required / product.weight;
    if (rn === 'кг' && pn === 'г') return required * 1000;
    if (rn === 'г' && pn === 'кг') return required / 1000;
    return required;
}

function prepareSubtractData(mealInfo) {
    const fullMeal = appData.parsedMenu?.find(m => m.day === mealInfo.day && m.meal === mealInfo.meal && m.title === mealInfo.title);
    if (!fullMeal?.ingredients) return { mealInfo: fullMeal, items: [] };
    const items = [];
    for (const ing of fullMeal.ingredients) {
        const name = ing.name || ing.ingredient || '', amount = ing.amount || '';
        if (!name || !amount) continue;
        const parsed = parseAmount(amount);
        const product = findMatchingProduct(name, appData.products);
        if (!product) { items.push({ id: Date.now()+Math.random(), ingredient: name, required: amount, found: false, isCustom: false }); continue; }
        const subVal = calculateSubtractAmount(parsed.value, parsed.unit, product);
        items.push({ id: Date.now()+Math.random(), ingredient: name, required: amount, product, selectedProductId: product.id, productName: product.name, productAmount: product.amount, productUnit: product.unit, subtractValue: subVal, isEnough: product.amount >= subVal, found: true, isCustom: false });
    }
    return { mealInfo: fullMeal, items };
}

async function executeSubtract(confirmData) {
    const { mealInfo, items } = confirmData;
    const subtracted = [];
    for (const item of items) {
        if (!item.selectedProductId) continue;
        const product = appData.products.find(p => p.id === item.selectedProductId);
        if (!product || product.amount < item.subtractValue) continue;
        product.amount = Math.max(0, product.amount - item.subtractValue);
        product.amount = Math.round(product.amount * 100) / 100;
        if (product.amount <= 0.001) { appData.products = appData.products.filter(p => p.id !== product.id); await dbDeleteProduct(product.id); }
        else { await dbSaveProduct(product); }
        subtracted.push({ name: product.name, subtracted: item.subtractValue, unit: product.unit, remaining: product.amount, removed: product.amount <= 0.001 });
    }
    mealInfo.cooked = true; mealInfo.cookedDate = new Date().toISOString();
    await dbSaveMenu(appData.parsedMenu, appData.weekStartDate);
    return subtracted;
}

let currentSubtractData = null;
let pendingRating = null;

function renderProductSelect(item, index) {
    if (!appData.products.length) return '<select disabled><option>Нет продуктов</option></select>';
    let opts = '<option value="">-- Выбери --</option>';
    const cats = {};
    appData.products.forEach(p => { if (!cats[p.category]) cats[p.category] = []; cats[p.category].push(p); });
    Object.keys(cats).sort().forEach(cid => {
        opts += `<optgroup label="${categories.find(c=>c.id===cid)?.name||cid}">`;
        cats[cid].forEach(p => opts += `<option value="${p.id}" ${item.selectedProductId===p.id?'selected':''}>${p.name} (${p.amount}${p.unit})</option>`);
        opts += '</optgroup>';
    });
    return `<select id="productSelect${index}" onchange="updateProductSelection(${index}, this.value)" style="width:100%;">${opts}</select>`;
}

function updateProductSelection(index, val) {
    if (!currentSubtractData) return;
    const item = currentSubtractData.items[index]; if (!item) return;
    if (!val) { item.selectedProductId = null; item.found = false; const row = document.querySelector(`#subtractRow${index}`); if(row){row.querySelector('.product-cell').innerHTML='❌';row.querySelector('.subtract-cell').innerHTML='—';} }
    else {
        const p = appData.products.find(x => x.id === parseInt(val));
        if (p) {
            item.selectedProductId = p.id; item.product = p; item.productName = p.name; item.productAmount = p.amount; item.productUnit = p.unit; item.found = true;
            item.subtractValue = calculateSubtractAmount(item.requiredValue || parseAmount(item.required).value, item.requiredUnit || parseAmount(item.required).unit, p);
            item.isEnough = p.amount >= item.subtractValue;
            const row = document.querySelector(`#subtractRow${index}`);
            if (row) { row.querySelector('.product-cell').innerHTML = `${p.name} (${p.amount}${p.unit})`; row.querySelector('.subtract-cell').innerHTML = item.isEnough ? `<input type="number" value="${item.subtractValue.toFixed(2)}" onchange="updateSubtractValue(${index}, this.value)" style="width:80px;"> ${p.unit}` : '⚠️'; }
        }
    }
    updateConfirmButton();
}

function updateSubtractValue(index, val) { if(!currentSubtractData)return; const item=currentSubtractData.items[index]; if(!item?.product)return; const v=parseFloat(val); if(isNaN(v)||v<0)return; item.subtractValue=v; item.isEnough=item.productAmount>=v; updateConfirmButton(); }
function updateConfirmButton() { const btn=document.getElementById('confirmSubtractBtn'); if(!btn||!currentSubtractData)return; const ok=currentSubtractData.items.some(i=>i.selectedProductId&&i.product&&i.isEnough); btn.disabled=!ok; btn.style.opacity=ok?'1':'0.5'; }
function showSubtractConfirmModal(data) {
    currentSubtractData = data;
    const { mealInfo, items } = data;
    let rows = '';
    items.forEach((item, i) => {
        const prod = item.found && item.product ? `${item.productName} (${item.productAmount}${item.productUnit})` : renderProductSelect(item, i);
        const sub = item.found && item.product && item.isEnough ? `<input type="number" value="${item.subtractValue.toFixed(2)}" onchange="updateSubtractValue(${i}, this.value)" style="width:80px;"> ${item.productUnit}` : '—';
        rows += `<tr id="subtractRow${i}"><td>${item.ingredient}</td><td>${item.required}</td><td class="product-cell">${prod}</td><td class="subtract-cell">${sub}</td><td><button class="delete-meal-btn" onclick="removeSubtractItem(${i})">🗑️</button></td></tr>`;
    });
    const html = `<div id="subtractConfirmModal" class="modal-overlay" onclick="if(event.target===this) closeSubtractModal()"><div class="modal-content subtract-modal"><h3>🍳 Списание</h3><p><strong>${mealInfo.title}</strong> (${mealInfo.day} • ${mealInfo.meal})</p><div class="subtract-table-container"><table class="subtract-table"><thead><tr><th>Ингредиент</th><th>Нужно</th><th>Продукт</th><th>Списать</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><button class="secondary-btn" onclick="addCustomItem()" style="width:100%;margin:12px 0;">➕ Добавить</button><div class="modal-actions"><button id="confirmSubtractBtn" class="primary-btn" onclick="confirmSubtract()">✅ Подтвердить</button><button class="secondary-btn" onclick="skipSubtractAndRate()">⏭️ Пропустить</button><button class="secondary-btn" onclick="closeSubtractModal()">❌ Отмена</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    updateConfirmButton();
}

function closeSubtractModal() { document.getElementById('subtractConfirmModal')?.remove(); currentSubtractData = null; pendingRating = null; }
async function confirmSubtract() { if(!currentSubtractData)return; const sub=await executeSubtract(currentSubtractData); closeSubtractModal(); if(typeof displayMenu==='function')displayMenu(appData.parsedMenu); if(sub.length){let m='✅ Списано:\n';sub.forEach(i=>m+=`• ${i.name}: -${i.subtracted.toFixed(2)}${i.unit} ${i.removed?'(удалён)':`(ост.${i.remaining.toFixed(2)})`}\n`);alert(m);} if(pendingRating){const{mealInfo,liked}=pendingRating;pendingRating=null;if(typeof openRatingModal==='function')openRatingModal(mealInfo,liked);} }
function skipSubtractAndRate() { const{mealInfo}=currentSubtractData||{}; const p=pendingRating; closeSubtractModal(); if(mealInfo){mealInfo.cooked=true;mealInfo.cookedDate=new Date().toISOString();dbSaveMenu(appData.parsedMenu,appData.weekStartDate);if(typeof displayMenu==='function')displayMenu(appData.parsedMenu);if(p)openRatingModal(p.mealInfo,p.liked);} }
function addCustomItem() { if(!currentSubtractData)return; const item={id:Date.now()+Math.random(),ingredient:'',required:'',product:null,selectedProductId:null,found:false,isCustom:true,subtractValue:0,isEnough:false}; currentSubtractData.items.push(item); const tbody=document.querySelector('#subtractConfirmModal tbody'); const i=currentSubtractData.items.length-1; tbody.insertAdjacentHTML('beforeend',`<tr id="subtractRow${i}"><td><input type="text" onchange="currentSubtractData.items[${i}].ingredient=this.value" style="width:100%;"></td><td><input type="text" onchange="currentSubtractData.items[${i}].required=this.value" style="width:100%;"></td><td class="product-cell">${renderProductSelect(item,i)}</td><td class="subtract-cell">—</td><td><button class="delete-meal-btn" onclick="removeSubtractItem(${i})">🗑️</button></td></tr>`); }
function removeSubtractItem(i) { if(currentSubtractData){currentSubtractData.items.splice(i,1);document.querySelector(`#subtractRow${i}`)?.remove();updateConfirmButton();} }

async function markAsCooked(mealInfo) {
    if (!mealInfo) return;
    const fullMeal = appData.parsedMenu?.find(m => m.day === mealInfo.day && m.meal === mealInfo.meal && m.title === mealInfo.title);
    if (!fullMeal) return;
    if (fullMeal.cooked) { alert('Уже приготовлено'); return; }
    const data = prepareSubtractData(mealInfo);
    if (!data.items.length) { fullMeal.cooked = true; await dbSaveMenu(appData.parsedMenu, appData.weekStartDate); displayMenu(appData.parsedMenu); return; }
    showSubtractConfirmModal(data);
}

function markAsCookedAndRate(mealInfo, liked) {
    if (!mealInfo) return;
    const fullMeal = appData.parsedMenu?.find(m => m.day === mealInfo.day && m.meal === mealInfo.meal && m.title === mealInfo.title);
    if (!fullMeal) return;
    if (fullMeal.cooked) { if (typeof openRatingModal === 'function') openRatingModal(mealInfo, liked); return; }
    const data = prepareSubtractData(mealInfo);
    if (!data.items.length) { fullMeal.cooked = true; dbSaveMenu(appData.parsedMenu, appData.weekStartDate); displayMenu(appData.parsedMenu); if (typeof openRatingModal === 'function') openRatingModal(mealInfo, liked); return; }
    pendingRating = { mealInfo, liked };
    showSubtractConfirmModal(data);
}