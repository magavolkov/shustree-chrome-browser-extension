var notificationIdlePeriod = 187 * 1000;
var trialBalance = 0;
var carbonBalance = 0;
var notificationIdleTime = 0;
var expTime = Date.now();
var netBalanceFloat = 5;
var toNotify = false;



// RAM Credentials State
let ux = '';
let tx = '';
let uxtx = '';
let isCredsReady = false; // Флаг готовности кредов в RAM

var carbonCookie = 'default';
let isResettingSockets = false;

const CHECK_BALANCE_ALARM = "check_carbon_balance_alarm";

// --- KeepAlive ---
let keepAliveInterval = null;
function setupKeepAlive() {
    if (!keepAliveInterval) {
        keepAliveInterval = setInterval(() => {
            chrome.runtime.getPlatformInfo(() => {});
        }, 20e3);
    }
}
chrome.runtime.onStartup.addListener(setupKeepAlive);
setupKeepAlive();

// --- СИНХРОНИЗАЦИЯ КРЕДОВ И УПРАВЛЕНИЕ RAM ---

function applyCredentialsNow(rawUxtx) {
    if (rawUxtx && typeof rawUxtx === 'string' && rawUxtx.includes(':')) {
        uxtx = rawUxtx;
        const parts = uxtx.split(':');
        ux = parts[0] || '';
        tx = parts[1] || '';
        isCredsReady = true;
        console.log("[Shustree RAM Sync] Credentials ready in RAM:", ux);
    }
}

// Первоочередное СИНХРОННОЕ/БЫСТРОЕ чтение кредов при старте Service Worker
chrome.storage.sync.get(['uxtx'], (result) => {
    if (result.uxtx) {
        applyCredentialsNow(result.uxtx);
    }
});


// Слушатели мгновенных обновлений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "update_credentials_immediate" && message.uxtx) {
        applyCredentialsNow(message.uxtx);
        sendResponse({ status: "ok" });
    }
    return true;
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.uxtx && changes.uxtx.newValue) {
        applyCredentialsNow(changes.uxtx.newValue);
    }
});

// --- БЛОКИРОВКА СОКЕТОВ И СБРОС ПУЛА ---

function flushProxySockets() {
    if (isResettingSockets) return;
    isResettingSockets = true;

    // В .get() передается { incognito: false }, а НЕ scope!
    chrome.proxy.settings.get({ incognito: false }, (config) => {
        if (!config || !config.value) {
            isResettingSockets = false;
            return;
        }

        // А вот в .set() уже используется scope: 'regular'
        chrome.proxy.settings.set({ value: config.value, scope: 'regular' }, () => {
            isResettingSockets = false;
        });
    });
}



// Отслеживаем 407 статус от прокси и ошибки подключения
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.statusCode === 407) {
            console.warn("[Shustree] Detected 407 Proxy Auth Required. Flushing sockets...");
            flushProxySockets();
        }
    },
    { urls: ["<all_urls>"] }
);


chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
        if (details.error === "net::ERR_PROXY_AUTH_REQUESTED" || details.error === "net::ERR_TUNNEL_CONNECTION_FAILED") {
            console.warn("[Shustree] Proxy connection broken. Flushing sockets...");
            flushProxySockets();
        }
    },
    { urls: ["<all_urls>"] }
);


// --- СИНХРОННЫЙ ОБРАБОТЧИК АВТОРИЗАЦИИ (ЗАЩИТА ОТ СИСТЕМНОГО ОКНА) ---

chrome.webRequest.onAuthRequired.addListener(
    (details) => {
        if (details.isProxy) {
            // Если креды еще не вычитаны в RAM (загрузка SW) или отсутствуют — МГНОВЕННО режем сокет
            if (!isCredsReady || !ux || !tx) {
                console.warn("[Shustree] Credentials NOT in RAM yet. Blocking request to prevent native popup.");
                // Отсылаем сброс сокетов, чтобы при следующем автозапросе креды уже были в RAM
                flushProxySockets();
                return { cancel: true };
            }

            // Мгновенная отдача авторизации из оперативной памяти
            return {
                authCredentials: { username: ux, password: tx }
            };
        }
        return {};
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// --- ФОНОВЫЕ ТАЙМЕРЫ И СЕРВИСЫ ---

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.storage.sync.set({
            'atleastWatched': false,
            'zeroBalanceWatched': false,
            'paymentInfoWatched': false,
            'carbonBalanceExpiration': 0,
            'startDate': Date.now()
        });
    }
});

function getTrialData() {
    chrome.storage.sync.get(['trialBalance'], (trialData) => {
        trialBalance = trialData.trialBalance || 0;
    });
}

function getToNotifyValue() {
    chrome.storage.sync.get(['toNotify'], (notifyData) => {
        toNotify = notifyData.toNotify || false;
    });
}

function getBalance() {
    chrome.storage.sync.get(['carbonBalance'], (balanceData) => {
        carbonBalance = balanceData.carbonBalance || 0;
    });
}

function getData() {
    getTrialData();
    getToNotifyValue();
    getBalance();
}


function forceOpenDashboard() {
    const targetUrl = chrome.runtime.getURL("shustree_balance.html");
    
    chrome.tabs.query({ url: targetUrl }, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
            for (let i = 1; i < tabs.length; i++) {
                chrome.tabs.remove(tabs[i].id);
            }
        } else {
            chrome.tabs.create({ url: "shustree_balance.html", active: true });
        }
    });
}

function runStartupLogic() {
    getData(); 
    forceOpenDashboard();
}

function forceDisconnectProxy() {
    chrome.storage.sync.get(['connectStatus'], (data) => {
        if (data.connectStatus === 'disconnected') return;

        chrome.proxy.settings.clear({ scope: 'regular' }, () => {
            chrome.storage.sync.set({ 'connectStatus': 'disconnected' });
        });
    });
}

function scheduleExpirationCheck() {
    chrome.storage.sync.get(['carbonBalance', 'trialBalance', 'startDate', 'carbonBalanceExpiration', 'connectStatus'], (data) => {
        if (data.connectStatus === 'disconnected') {
            chrome.alarms.clear(CHECK_BALANCE_ALARM);
            return;
        }
        
        const now = Date.now();
        let expireAt = 0;

        if (data.carbonBalance > 0) {
            expireAt = data.carbonBalanceExpiration; 
        } else {
            const trialMs = data.trialBalance || 317777;
            expireAt = (data.startDate || now) + trialMs;
        }

        const timeLeft = expireAt - now;

        if (timeLeft <= 0) {
            forceDisconnectProxy();
        } else {
            chrome.alarms.create(CHECK_BALANCE_ALARM, { when: expireAt });
        }
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CHECK_BALANCE_ALARM) {
        forceDisconnectProxy();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        if (changes.connectStatus) {
            if (changes.connectStatus.newValue === 'disconnected') {
                chrome.alarms.clear(CHECK_BALANCE_ALARM);
            } else if (changes.connectStatus.newValue === 'connected') {
                scheduleExpirationCheck();
            }
        }
        if (changes.carbonBalance || changes.carbonBalanceExpiration || changes.startDate) {
            scheduleExpirationCheck();
        }
    }
});

chrome.runtime.onStartup.addListener(scheduleExpirationCheck);
chrome.runtime.onInstalled.addListener(scheduleExpirationCheck);

runStartupLogic();
setTimeout(getData, 3347);


