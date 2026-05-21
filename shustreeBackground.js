var notificationIdlePeriod 	= 187 * 1000; //187 seconds
var trialBalance 			= 0; //0 minutes by default 
var carbonBalance 		= 0; // 0 minutes by default
var notificationIdleTime 	= 0;
var expTime 			= Date.now();
var netBalanceFloat 		= 5;
var toNotify 				= false;
let ux 					= '';
let tx 					= '';
let uxtx 					= '';
var carbonCookie 		= 'default';
// Константа имени аларма
const CHECK_BALANCE_ALARM = "check_carbon_balance_alarm";




const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();




chrome.webRequest.onAuthRequired.addListener(
    (details) => { 
        if (details.isProxy) {
            console.log("Providing auth for proxy:", details.challenger.host);
            if (!ux || !tx) return {}; 
            return {
                authCredentials: { 
                    username: ux, 
                    password: tx 
                }
            };
        }
        return {}; 
    },
    { urls: ["<all_urls>"] },
    ["blocking"] 
);




chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.uxtx) {
      const oldValue 		= changes.uxtx.oldValue;
      var upduxtx 					= changes.uxtx.newValue;
      if ( upduxtx !== undefined ) {
        uxtx 					= changes.uxtx.newValue;
        const creds 			= uxtx.split(":");
        ux 					= creds[0];
        tx 					= creds[1];
    }
  }
});





chrome.runtime.onInstalled.addListener((details) => {
    // Проверяем, что это именно установка (или обновление)
    if (details.reason === "install") {
        console.log("Shustree: Первая установка. Инициализация хранилища...");
        
        // Объединяем все записи в одну операцию
        chrome.storage.sync.set({
            'atleastWatched': false,
            'zeroBalanceWatched': false,
            'carbonBalanceExpiration': 0,
            'startDate': Date.now()
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка инициализации:", chrome.runtime.lastError);
            } else {
                console.log("Данные успешно инициализированы.");
            }
        });

    } else if (details.reason === "update") {
        console.log("Shustree: Расширение обновлено до версии " + chrome.runtime.getManifest().version);
        // Здесь можно добавить миграцию данных, если формат изменился
    }
});






// --- 3. Инициализация при старте (считываем из кеша) ---
chrome.storage.sync.get(['uxtx'], (result) => {
    if (result.uxtx) {
        const creds = result.uxtx.split(":");
        ux = creds[0];
        tx = creds[1];
        console.log("Initial auth loaded:", ux);
    }
});





// FUNCTIONS

function getTrialData() {
    chrome.storage.sync.get(['trialBalance'], function ( trialData ) {
        trialBalance 			= trialData.trialBalance;
    });
}



function getToNotifyValue() {
    chrome.storage.sync.get(['toNotify'], function ( notifyData ) {
        toNotify 			= notifyData.toNotify;
    });
}



function getBalance() {
    chrome.storage.sync.get(['carbonBalance'], function ( balanceData ) {
        carbonBalance 		= balanceData.carbonBalance;
    });
}



function getData() {
    getTrialData();
    getToNotifyValue();
    getBalance();
}



function closeShustreeTabs() {
  chrome.tabs.query( { "url":[ 
      "chrome-extension://fjancimbiajbfljkoggkchelcfmknkoo/shustree_balance.html" 
  ] }, function( tabs ){ 
    tabs.forEach(function(tab) {
        chrome.tabs.remove(tab.id);
    });
  })
}



// 1. Функция, которая гарантированно открывает вкладку
function forceOpenDashboard() {
    
    closeShustreeTabs();
    //console.log("Attempting to open dashboard...");

    // Get the full internal URL of your extension page
    const targetUrl = chrome.runtime.getURL("shustree_balance.html");

    // 1. Find all tabs matching your extension's specific URL
    chrome.tabs.query({ url: targetUrl }, function(tabs) {


        // 3. Small timeout to ensure the browser has registered the closure
        setTimeout(() => {
            chrome.tabs.create({ 
                url: "shustree_balance.html",
                active: true 
            }, (tab) => {
                if (chrome.runtime.lastError) {
                    console.error("Tab creation failed:", chrome.runtime.lastError);
                } else {
                    console.log("Dashboard opened successfully, tab ID:", tab.id);
                }
            });
        }, 200);
    });
}






// 2. "умный" запуск
function runStartupLogic() {
    // Проверяем баланс и данные
    getData(); 
    closeShustreeTabs();
    // Вызываем открытие
    forceOpenDashboard();
}




// Функция для отключения прокси (теперь она в background)
function forceDisconnectProxy() {
    // Сначала проверяем, не отключен ли он уже, чтобы избежать двойного вызова
    chrome.storage.sync.get(['connectStatus'], (data) => {

        if (data.connectStatus === 'disconnected') {
            // Уже отключен, ничего делать не нужно
            return;
        }

        chrome.proxy.settings.clear({ scope: 'regular' }, () => {
            console.log('Proxy disabled automatically due to expiration');
            chrome.storage.sync.set({ 'connectStatus': 'disconnected' });
        });

    });

}



// Функция для расчета времени отключения
function scheduleExpirationCheck() {

    chrome.storage.sync.get(['carbonBalance', 'trialBalance', 'startDate', 'carbonBalanceExpiration'], (data) => {

        // Если прокси и так выключен пользователем или системой, алармы нам не нужны
        if (data.connectStatus === 'disconnected') {
            chrome.alarms.clear(CHECK_BALANCE_ALARM);
            return;
        }
        
        const now = Date.now();
        let expireAt = 0;

        if (data.carbonBalance > 0) {
            // Если есть платный баланс
            expireAt = data.carbonBalanceExpiration; 
        } else {
            // Если используем триал
            const trialMs = data.trialBalance || 317777;
            expireAt = data.startDate + trialMs;
        }

        const timeLeft = expireAt - now;

        if (timeLeft <= 0) {
            // Время уже вышло
            forceDisconnectProxy();
        } else {
            // Создаем аларм на точное время (алармы принимают время в миллисекундах для "when")
            chrome.alarms.create(CHECK_BALANCE_ALARM, { when: expireAt });
            console.log(`Disconnection scheduled in ${Math.round(timeLeft/1000)}s`);
        }

    });
}



// Следим за изменениями в хранилище
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        // Если изменился статус подключения (например, юзер сам нажал выкл)
        if (changes.connectStatus) {
            if (changes.connectStatus.newValue === 'disconnected') {
                // Если отключились — убираем аларм проверки, чтобы он не стрелял вхолостую
                chrome.alarms.clear(CHECK_BALANCE_ALARM);
            } else if (changes.connectStatus.newValue === 'connected') {
                // Если подключились — планируем проверку
                scheduleExpirationCheck();
            }
        }
        
        // Если изменились параметры времени при активном подключении — пересчитываем аларм
        if (changes.carbonBalance || changes.carbonBalanceExpiration || changes.startDate) {
            scheduleExpirationCheck();
        }
    }
});

// Запускаем проверку при старте
chrome.runtime.onStartup.addListener(scheduleExpirationCheck);
// И при установке/обновлении
chrome.runtime.onInstalled.addListener(scheduleExpirationCheck);






// 3. САМОЕ ВАЖНОЕ: Точка входа
runStartupLogic();


//  4. updating basic data 
setTimeout( getData, 3347 );



