/* * QUEUECUT APP - Lógica Completa v4 */

let map = null;
let waiterMap = null;
let routeLine = null;
let currentUserMode = 'client'; 

const App = {
    // --- NAVEGAÇÃO & LOGIN ---
    login: (role) => {
        currentUserMode = role;
        if (role === 'client') {
            App.navigateTo('view-map');
            document.getElementById('user-role-label').innerText = 'Modo Cliente';
            document.getElementById('switch-mode-text').innerText = 'Mudar para Waiter';
        } else {
            App.navigateTo('view-waiter-home');
            document.getElementById('user-role-label').innerText = 'Modo Waiter';
            document.getElementById('switch-mode-text').innerText = 'Mudar para Cliente';
        }
    },

    switchMode: () => {
        if (currentUserMode === 'client') App.login('waiter');
        else App.login('client');
    },

    navigateTo: (viewId) => {
        App.toggleSidebar(false);
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');

        if (viewId === 'view-map') setTimeout(() => { App.initMap(); }, 100);
        if (viewId === 'view-waiter-home') setTimeout(() => { WaiterApp.initWaiterMap(); }, 100);
    },

    toggleSidebar: (show) => {
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (show) { sidebar.classList.add('active'); overlay.classList.add('active'); } 
        else { sidebar.classList.remove('active'); overlay.classList.remove('active'); }
    },

    logout: () => {
        if(confirm("Sair da conta?")) { App.toggleSidebar(false); App.navigateTo('view-login'); }
    },

    // --- MAPA DO CLIENTE ---
    initMap: () => {
        if (map) { map.invalidateSize(); return; }
        map = L.map('map-container', { zoomControl: false }).setView([38.697056, -9.206637], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);
        
        const userIcon = L.divIcon({ className: 'custom-pin', html: '<div class="user-pin" style="color:#003B70; font-size:32px;"><i class="fas fa-map-marker-alt"></i></div>', iconSize: [40, 40], iconAnchor: [20, 40] });
        const waiterIcon = L.divIcon({ className: 'custom-pin', html: '<div class="waiter-pin" style="color:#FF8A00; background:white; border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-person"></i></div>', iconSize: [30, 30], iconAnchor: [15, 15] });

        L.marker([38.697056, -9.206637], {icon: userIcon}).addTo(map); 
        L.marker([38.6975, -9.2070], {icon: waiterIcon}).addTo(map); 
        L.marker([38.6965, -9.2060], {icon: waiterIcon}).addTo(map); 
    },

    openRequest: (locationName) => {
        document.getElementById('selected-location-name').innerText = locationName;
        App.switchPanelState('bottom-sheet-client', 'panel-request');
        if (map && locationName.includes('Jerónimos')) {
            const dest = [38.697056, -9.206637];
            const waiter = [38.6975, -9.2070];
            map.flyTo(dest, 17);
            if (routeLine) map.removeLayer(routeLine);
            routeLine = L.polyline([dest, waiter], {color:'#003B70', weight:4, dashArray:'10,10'}).addTo(map);
            map.fitBounds(routeLine.getBounds(), {padding:[50,50]});
        }
    },

    startMatching: () => {
        App.switchPanelState('bottom-sheet-client', 'panel-matching');
        setTimeout(() => { App.switchPanelState('bottom-sheet-client', 'panel-found'); App.showToast("Waiter encontrado!", "success"); }, 3000);
    },

    resetPanel: () => {
        App.switchPanelState('bottom-sheet-client', 'panel-search');
        if (routeLine) map.removeLayer(routeLine);
        if(map) map.flyTo([38.697056, -9.206637], 16);
    },

    switchPanelState: (sheetId, panelId) => {
        const sheet = document.getElementById(sheetId);
        if(!sheet) return;
        sheet.querySelectorAll('.panel-state').forEach(el => el.classList.remove('active'));
        const panel = document.getElementById(panelId);
        if(panel) panel.classList.add('active');
    },

    // --- UTILITÁRIOS ---
    showToast: (msg, type='info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.animation='fadeOut 0.3s forwards'; setTimeout(()=>toast.remove(),300); }, 3000);
    },

    toggleDarkMode: (cb) => { document.body.classList.toggle('dark-mode', cb.checked); },
    openModal: (id) => { document.getElementById(id).classList.add('open'); },
    closeModal: () => { document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('open')); },
    savePayment: () => { App.showToast("Cartão salvo!", "success"); App.closeModal(); },
    addPromo: () => { 
        const v = document.getElementById('promo-input').value.toUpperCase();
        if(v==="QUEUECUT20") { App.showToast("Promo aplicada!", "success"); document.getElementById('promo-input').value=""; }
        else App.showToast("Código inválido", "error");
    },
    editProfile: () => { const n = prompt("Novo nome:"); if(n) App.showToast("Nome alterado para "+n, "success"); },
    changePassword: () => { prompt("Nova password:"); App.showToast("Password alterada", "success"); },
    toggleFAQ: (el) => { el.classList.toggle('open'); }
};

// --- APP WAITER ---
const WaiterApp = {
    isOnline: false,
    jobStep: 0,
    jobSteps: ["Cheguei ao Local", "Estou na Fila", "Tenho a Senha", "Cliente Chegou", "Concluir"],

    initWaiterMap: () => {
        if (waiterMap) { waiterMap.invalidateSize(); return; }
        waiterMap = L.map('map-container-waiter', { zoomControl: false }).setView([38.697056, -9.206637], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(waiterMap);
        L.marker([38.697056, -9.206637], {icon: L.divIcon({html: '<i class="fas fa-location-arrow" style="font-size:24px; color:#003B70; transform: rotate(-45deg);"></i>', className:'my-pos'})}).addTo(waiterMap);
    },

    toggleOnline: () => {
        const btn = document.getElementById('go-online-btn');
        WaiterApp.isOnline = !WaiterApp.isOnline;
        if (WaiterApp.isOnline) {
            btn.classList.add('online');
            btn.querySelector('.go-button').innerText = "STOP";
            btn.querySelector('.go-status').innerText = "ONLINE";
            App.showToast("Estás Online!", "success");
            setTimeout(() => { App.switchPanelState('bottom-sheet-waiter', 'panel-job-offer'); }, 3000);
        } else {
            btn.classList.remove('online');
            btn.querySelector('.go-button').innerText = "GO";
            btn.querySelector('.go-status').innerText = "OFFLINE";
            App.switchPanelState('bottom-sheet-waiter', 'panel-hidden');
        }
    },

    acceptJob: () => {
        App.switchPanelState('bottom-sheet-waiter', 'panel-job-active');
        document.getElementById('go-online-btn').style.display = 'none';
        WaiterApp.jobStep = 0;
        WaiterApp.updateJobUI();
    },

    rejectJob: () => { App.switchPanelState('bottom-sheet-waiter', 'panel-hidden'); App.showToast("Recusado", "error"); },

    nextStep: () => {
        WaiterApp.jobStep++;
        if (WaiterApp.jobStep >= WaiterApp.jobSteps.length) {
            App.showToast("Trabalho concluído! +12.50€", "success");
            document.getElementById('go-online-btn').style.display = 'block';
            App.switchPanelState('bottom-sheet-waiter', 'panel-hidden');
            return;
        }
        WaiterApp.updateJobUI();
    },

    updateJobUI: () => {
        document.getElementById('job-action-btn').innerText = WaiterApp.jobSteps[WaiterApp.jobStep];
        const statuses = ["A ir para o local...", "À espera na fila...", "Na fila (com senha)...", "À espera do cliente...", "A finalizar..."];
        document.getElementById('job-status-text').innerText = statuses[WaiterApp.jobStep];
        document.querySelectorAll('.step-dot').forEach((d,i) => i <= WaiterApp.jobStep ? d.classList.add('active') : d.classList.remove('active'));
    }
};