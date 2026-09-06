


// =========== GLOBAL CONSTS and VARS ==========================================================================================================================


const apiUrl 		= "https://shustree.ru:17762/carbonvpnapi/";
const apiPayUrl 		= "https://shustree.ru:17762/carbonvpnpayapi/";
const apiIp 			= "https://shustree.ru:17762/carbonvpnapi/ip_auth";
const apiIfNotHostile = "https://shustree.ru:17762/carbonvpnapi/if_safe";
const apiSettings 	= "https://shustree.ru:17762/carbonvpnapi/settings";
const strTime 		= Date.now().toString();


// ------------ global vars coming from CarbonSERVER ------------------------------------------------------------------------------------------------------------------------------------------------------
// in case of a server crush:
var cookieName 		= "carbonvpn";
var proxyIp 			= "shustree.ru"
var htmlAboutInject 	= '<br><br><br><div style="text-align:left;margin-left:31px;width:100%;"><a class="mainlink" href="https://carbonvpn.tech" target="_blank" style="text-decoration: none;" rel="noopener noreferrer"><h1>Carbon-VPN.TECH</h1></a></div><br><br><br>';
var config 			= {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      host: "shustree.ru", 
      port: 1762
    },
  }
};


var configFree = config;


//---------- local vars ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

var logo 			= document.createElement("img");
var enabler 			= document.createElement("img");
var basement 		= document.createElement("img");
var connectStatus 	= 'disconnected';
var currentIp 		= "";
var carbonUid 		= "";
var carbonBalance 	= 0;
var carbonStatus 	= "";
var currentUrl 		= document.URL;
var curUrl 			= '';
var carbonCookie 	= getCookie("carbonvpn");
chrome.storage.sync.set({ 'carbonCookie': carbonCookie });
var tracked 			= false;
var apiRequest 		= new Object();
var apiPayRequest 	= new Object();
var apiChoiceRequest = new Object();
var userAction 		= "activation";
var planSelected 		= 3;
var defaultTimeOut 	= 149; //ms
var free_msecs 		= 317777;
var free_descr 		= "5 минут";
var uxtx 			= '';
var price1 			= "250";
var price3 			= "500";
var price12 			= "1500";
var toNotify 			= false;
var autoShow 		= true;
//var settingsShow 	= false;
var ifHostile 			= false;
let isApiLoading 		= false;


var uiLang = 'en';
var isForeignUser = true; // По умолчанию считаем иностранцем

try {
    // 1. Проверяем системный язык Chrome API
    const browserLang = chrome.i18n.getUILanguage().toLowerCase();
    
    // 2. Проверяем массив языков в браузере (ищет русскую/белорусскую раскладку или локаль)
    const allLanguages = (navigator.languages || []).map(l => l.toLowerCase());
    const hasLocalLocale = allLanguages.some(lang => lang.startsWith('ru') || lang.startsWith('be'));

    // 3. Проверяем системную таймзону устройства (11 часовых зон РФ + Беларусь)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const localTimeZones = [
        // UTC+2: Калининград
        "Europe/Kaliningrad",
        
        // UTC+3: Москва, Питер, Минск (Беларусь)
        "Europe/Moscow", "Europe/Kirov", "Europe/Volgograd", "Europe/Astrakhan", "Europe/Saratov", "Europe/Ulyanovsk", "Europe/Minsk",
        
        // UTC+4: Самара, Ижевск
        "Europe/Samara",
        
        // UTC+5: Екатеринбург, Пермь, Уфа
        "Asia/Yekaterinburg",
        
        // UTC+6: Омск
        "Asia/Omsk",
        
        // UTC+7: Красноярск, Новосибирск, Томск, Барнаул
        "Asia/Krasnoyarsk", "Asia/Novosibirsk", "Asia/Barnaul", "Asia/Tomsk", "Asia/Novokuznetsk",
        
        // UTC+8: Иркутск
        "Asia/Irkutsk",
        
        // UTC+9: Якутск, Чита, Благовещенск
        "Asia/Yakutsk", "Asia/Chita", "Asia/Khandyga",
        
        // UTC+10: Владивосток, Хабаровск
        "Asia/Vladivostok", "Asia/Ust-Nera",
        
        // UTC+11: Магадан, Сахалин
        "Asia/Magadan", "Asia/Sakhalin", "Asia/Srednekolymsk",
        
        // UTC+12: Камчатка, Анадырь
        "Asia/Kamchatka", "Asia/Anadyr"
    ];

    const isLocalTimeZone = localTimeZones.includes(timeZone);

    // Триггер: если язык русский/белорусский ИЛИ в системе есть такая локаль ИЛИ таймзона совпадает со списком
    if (browserLang.startsWith('ru') || browserLang.startsWith('be') || hasLocalLocale || isLocalTimeZone) {
        uiLang = 'ru';
        isForeignUser = false; // Локальный пользователь (РФ/РБ) — идет по коммерческой воронке
        console.log("[Shustree Check] Local environment detected:", { browserLang, timeZone });
    } else {
        console.log("[Shustree Check] Foreign environment verified. Granting extended global trial.");
    }
} catch (e) {
    // Безопасный фолбек на случай непредвиденных ошибок в старых версиях Chromium
    const webLang = (navigator.language || 'en').toLowerCase();
    if (webLang.startsWith('ru') || webLang.startsWith('be')) {
        uiLang = 'ru';
        isForeignUser = false;
    }
}


console.log("[Shustree Check] uiLang, isForeignUser: ", { uiLang, isForeignUser });



const translationDictionary = {
    // ---------------- Настройки ----------------
    "autoTip": {
        ru: "Подключаться автоматически",
        en: "Connect automatically"
    },

    // ---------------- Страница СТАРТ (carbonStart) ----------------
    "balanceLabelX": {
        ru: "Баланс: ",
        en: "Balance: "
    },
    "charge1Text": {
        ru: "+ Пополнить",
        en: "+ Top up"
    },
    "accessLabel": {
        ru: "Доступ: ",
        en: "Access: "
    },
    "andOtherSites": {
        ru: "и другие сайты,",
        en: "and other websites,"
    },
    "notBannedInRU": {
        ru: "не запрещенные в РФ",
        en: "unrestricted worldwide"
    },

    // ---------------- Страница Оплаты (carbonCash) ----------------
    "buy1_duration": {
        ru: "1 мес",
        en: "1 mo"
    },
    "buy3_duration": {
        ru: "3 мес",
        en: "3 mo"
    },
    "buy12_duration": {
        ru: "12 мес",
        en: "12 mo"
    },
    "inputEmail": {
        ru: "укажите email ...",
        en: "enter email ..."
    },
    "payButtonText": {
        ru: "Оплатить",
        en: "Pay"
    },

    // ---------------- Страница Профиля (carbonMain) ----------------
    "balanceLabelY": {
        ru: "Баланс: ",
        en: "Balance: "
    },
    "charge2Text": {
        ru: "+ Пополнить",
        en: "+ Top up"
    },

    // ---------------- Страница Ввода ID (carbonRestoreId) ----------------
    "errorIdText": {
        ru: "Указан не валидный ID",
        en: "Invalid ID provided"
    },
    "inputCarbonId": {
        ru: "оплаченный ID ...",
        en: "paid ID ..."
    },
    "connectIdBtnText": {
        ru: "Подключить ID",
        en: "Connect ID"
    },

    // ---------------- Страница ТехПоддержки (carbonError) ----------------
    "techSupportText": {
        ru: `Если возникла проблема подключения:<br><br>
                      - убедитесь, что в Вашем браузере отключены расширения, блокирующие работу других сервисов,<br>
                      - отключите и включите расширение,<br>
                      - перезагрузите браузер.<br><br>
                      Если работоспособность не восстановлена, <br>пожалуйста, напишите на <a class="link" href="mailto:1@shustree.ru">1@shustree.ru</a> и укажите Ваш ID.
                      <br><br>
                      Мы обязательно решим Вашу проблему.`,
        en: `If you experience connection issues:<br><br>
                  - make sure that extensions blocking other services are disabled in your browser,<br>
                  - disable and re-enable the extension,<br>
                  - restart your browser.<br><br>
                  If the issue persists, please email us at 1@shustree.ru and include your ID.
                  <br><br>
                  We will be sure to help you resolve the problem!`
    },
    
    
        // ---------------- Страница Ошибки (carbonError) ----------------
    "errorBlockText": {
        ru: `Ошибка подключения.<br>
             Убедитесь, что в Вашем браузере отключены расширения, блокирующие работу других сервисов - обычно это расширения типа "hypertube", "uboost", "разгони Ютуб", онлайн-казино, бесплатные VPN, блокировщики рекламы и прочие вредоносные программы.<br>
             Удалите или отключите их и попробуйте подключиться еще раз.<br>
             По всем техническим вопросам <br>пишите на <a class="link" href="mailto:1@shustree.ru">1@shustree.ru</a>`,
        en: `Connection error.<br>
             Please make sure that extensions interfering with proxy routing (such as YouTube speed boosters, free VPNs, or ad blockers) are disabled in your browser.<br>
             Remove or disable them and try to reconnect.<br><br>
             For any technical support <br>contact <a class="link" href="mailto:1@shustree.ru">1@shustree.ru</a>`
    },

    // ---------------- Подвал (Footer) ----------------
    "inputAlreadyPaid": {
        ru: "Активировать оплаченный ID",
        en: "Activate paid ID"
    },
    "techSupport1": {
        ru: "Техподдержка (указывайте ID)",
        en: "Support (include your ID)"
    },
    "legalDetails": {
        ru: "Пользовательское соглашение",
        en: "Terms of Service"
    },
    "inputEmailError": {
        ru: "укажите корректный email...",
        en: "enter a valid email..."
    },
    "about1": {
        ru: "Инструкции",
        en: "Instructions"
    }
};



// =========== TRACKING INSTALLS and ENABLES / DISABLES ========================================================================================================



function getUserAgent() {
    const userAgent = window.navigator.userAgent;
    chrome.storage.sync.set({ 'userAgent': userAgent });
    return userAgent;
}



// to set a carbonvpn Cookie- expiring in 1000 days
function setCookie(cvalue) {
    const d 			= new Date();
    d.setTime(d.getTime() + (10000*24*60*60*1000));
    let expires 		= "expires="+ d.toUTCString();
    document.cookie 	= "carbonvpn" + "=" + cvalue + ";" + expires + ";path=/";
}



// to get a specific Cookie
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      var x = c.substring(name.length, c.length);
      return x;
      
    }
  }
  return "";
}







// =========== PROXYING FUNCTIONS ======================================================================================================================



function checkConnect(x) {
  if ( x == "connected" ) {
    userAction 											= "disable";
  } else {
    userAction 											= "enable";
  };
}



function getIp(x) {
    fetch(apiIp)
      .then(response => response.json())
      .then(data => {
        console.log('Your public IP address is:', data.ip);
        document.getElementById('shustreeIP').innerHTML  = data.ip;
        if (x == 'c') {
          document.getElementById('shustreeIP').style.color  = 'rgb(149,225,255)';
        } else {
          document.getElementById('shustreeIP').style.color  = 'rgb(175,175,255)';
        }
      })
      .catch(error => {
        console.error('Error fetching IP:', error);
      });
}



function DEPRconnect(config) {  
  chrome.proxy.settings.set(
      {value: config, scope: 'regular'},
      function() { getIp('c'); }
  );
  connectStatus = 'connected';
  enablerView('enabled');
};



async function connect(config) {  
    // 1. Промисифицируем установку настроек прокси, чтобы дождаться 100% применения
    await new Promise((resolve) => {
        chrome.proxy.settings.set({ value: config, scope: 'regular' }, resolve);
    });

    // Небольшая пауза (50ms) для гарантированной инициализации сетевого стека Chrome
    await new Promise(resolve => setTimeout(resolve, 50));

    // 2. Метод с ретраями (до 5 попыток)
    const MAX_RETRIES = 5;
    const TIMEOUT_MS = 4000; // Таймаут 4 сек на одну попытку
    let isSafe = true;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            // cache: 'no-store' предотвращает кеширование ответа при смене прокси
            const response = await fetch(apiIfNotHostile, { 
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (typeof data.if_safe === 'boolean') {
                    isSafe = data.if_safe;
                    lastError = null;
                    break; // Успех — выходим из цикла ретраев
                }
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;
            console.warn(`Попытка ${attempt}/${MAX_RETRIES} не удалась:`, error.message);

            // Если это не последняя попытка — делаем паузу с увеличением интервала
            if (attempt < MAX_RETRIES) {
                const delay = attempt * 300; // 300ms, 600ms, 900ms, 1200ms
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // 3. Обработка итогового результата
    if (lastError !== null) {
        console.error(`Все ${MAX_RETRIES} попыток завершились ошибкой. Последняя ошибка:`, lastError);
        
        // Рекомендуемое поведение при падении прокси (ERR_PROXY_CONNECTION_FAILED):
        // Обязательно отключаем неработающий прокси, иначе у пользователя "ломается" весь интернет
        if (typeof disconnect === 'function') {
            await disconnect(); 
        }
        
        return;
    }

    // Проверка if_safe
    if (isSafe === true) {
        getIp('c');
        connectStatus = 'connected';
        enablerView('enabled');
    } else {
        // Соединение перехвачено сторонним софтом
        showHostileOverlay();
    }
}




function disconnect() {
    chrome.proxy.settings.clear({scope:'regular'}, () => {
        console.log('Proxy Removed');
        // Запрашиваем IP только после того, как Chrome подтвердил очистку прокси!
        setTimeout(() => {
            getIp('x');
        }, 100);
    });
    connectStatus = 'disconnected';
    enablerView('disabled');
};





// =========== UTILITY FUNCTIONS ========================================================================================================================



function makeid(length) {
    let result 						= '';
    const characters 				= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength 		= characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
};









// =========== VIEWS FUNCTIONS =========================================================================================================================

/**
 * Автоматически переводит весь интерфейс на английский, 
 * если язык браузера отличается от русского.
 */
function DEPRapplyLocalization() {
    try {
        uiLang = chrome.i18n.getUILanguage().toLowerCase();
        // Если интерфейс браузера русский — ничего не переводим (оставляем родной HTML)
        if (uiLang.startsWith('ru')) {
            return;
        }
    } catch (e) {
        // Запасной вариант для обычного веб-контекста
        const webLang = (navigator.language || 'en').toLowerCase();
        if (webLang.startsWith('ru')) return;
    }

    // Рекурсивная функция обхода текстовых узлов (чтобы не ломать HTML-верстку и обработчики событий)
    function translateNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue.trim();
            if (text && translationDictionary[text]) {
                node.nodeValue = node.nodeValue.replace(text, translationDictionary[text]);
            }
        } else {
            // Не переводим внутренности тегов <script> и <style>
            if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
                for (let child of node.childNodes) {
                    translateNode(child);
                }
            }
        }
    }

    // Запуск перевода со всего body
    translateNode(document.body);
    
    // Переводим placeholder-атрибуты у инпутов (если они есть)
    document.querySelectorAll('[placeholder]').forEach(element => {
        const placeholderText = element.getAttribute('placeholder').trim();
        if (translationDictionary[placeholderText]) {
            element.setAttribute('placeholder', translationDictionary[placeholderText]);
        }
    });
}



function DEPR2applyLocalization() {
    // Перебираем ключи (ID элементов) из нашего словаря
    for (const elementId in translationDictionary) {
        const element = document.getElementById(elementId);
        
        if (element) {
            const translations = translationDictionary[elementId];
            // Берем перевод для текущего uiLang, либо откатываемся на английский
            const translatedText = translations[uiLang] || translations['en'];
            
            // Если у элемента есть свойство value (например, кнопки input), меняем его, иначе innerHTML
            if (element.tagName === 'INPUT' && (element.type === 'button' || element.type === 'submit')) {
                element.value = translatedText;
            } else {
                element.innerHTML = translatedText;
            }
        }
    }
}



function applyLocalization() {
    // Если язык 'ru' — ничего не делаем, HTML по умолчанию русский
    if (uiLang === 'ru') {
        return;
    }

    for (const elementId in translationDictionary) {
        const element = document.getElementById(elementId);
        if (element) {
            const translations = translationDictionary[elementId];
            const translatedText = translations[uiLang] || translations['en'];

            // 1. Если это инпут или текстовое поле (textarea), переводим placeholder
            if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                if (element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translatedText);
                }
            } else {
                // 2. Для обычных тегов обновляем внутреннее содержимое
                element.innerHTML = translatedText;
            }
        }
    }
}




function getPrice(p) {
  planSelected = p;
  var allPayButtons = document.getElementsByClassName("excite"); // get all the pay buttons
  for (let index = 0; index < allPayButtons.length; ++index) {
    const element = allPayButtons[index];
    element.style.opacity = 0.545;
  };
  var allBuyByes = document.getElementsByClassName("buyLine"); // get all the pay buttons
  for (let index = 0; index < allBuyByes.length; ++index) {
    const element = allBuyByes[index];
    element.style.opacity = 0;
  };
  var c = 'buy' + p.toString();
  var d = 'buy'+ p.toString() + 'png';
  document.getElementById(c).style.opacity = 1;
  document.getElementById(d).style.opacity = 0.47;
  document.getElementById("inputEmail").focus();
};



function itemDisable(item) {
    item.style.display 				= "none";
};




function getTrialHumanized(h, currentLang) {
  const lang = currentLang || uiLang;
  
  // 1. Если осталось больше 24 часов — показываем в ДНЯХ
  if (h > 24 * 60 * 60 * 1000) {
      const days = Math.floor(h / (24 * 60 * 60 * 1000));
      if (lang === 'ru') {
          if (days % 10 === 1 && days % 100 !== 11) return days + ' день';
          if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return days + ' дня';
          return days + ' дней';
      } else {
          return days === 1 ? '1 day' : days + ' days';
      }
  }

  // 2. Если осталось меньше 24 часов, но больше 1 часа — показываем ЧАСЫ + МИНУТЫ
  if (h > 60 * 60 * 1000) {
      const hours = Math.floor(h / (60 * 60 * 1000));
      const mins = Math.floor((h % (60 * 60 * 1000)) / 60000);
      if (lang === 'ru') {
          return hours + ' ч. ' + mins + ' мин.';
      } else {
          return hours + ' h ' + mins + ' min';
      }
  }

  // 3. Если осталось меньше часа — показываем только МИНУТЫ (чистые, без % 100)
  var hm = Math.floor(h / 60000);
  if (hm < 0) hm = 0;
  
  var hfr = '';
  if (lang == 'ru') {
      var lastDigit = hm % 10;
      var lastTwoDigits = hm % 100;
      
      if (lastDigit === 1 && lastTwoDigits !== 11) {
          hfr = hm.toString() + ' минута';
      } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
          hfr = hm.toString() + ' минуты';
      } else {
          hfr = hm.toString() + ' минут';
      }
  } else {
      hfr = hm.toString() + ' min';
  }
  
  return hfr.toString();
}


function shutDownAll() {
    var allPages = document.getElementsByClassName("page"); // Получаем все странички
    for (let index = 0; index < allPages.length; ++index) {
      const element = allPages[index];
      itemDisable(element);
    };
    document.getElementById("getMain").style.display 	= "none";
};



function view(page) {
    // на время интеграции международной кассы
    if ( page == 'carbonCash' && isForeignUser ) {
        page = 'shustreeWorldwide';
    }
    carbonLoader("hide");
    var allPages = document.getElementsByClassName("page"); // Получаем все странички
    for (let index = 0; index < allPages.length; ++index) {
      const element = allPages[index];
      itemDisable(element);
    }
    var currentPage 				= document.getElementById(page);
    currentPage.style.display 		= "block";
    fadeIn(currentPage, 1000, 'flex');
};



function carbonLoader(x) {
  const loader = document.getElementById("carbon_loader");
  //if (!loader) return;
  if (x == "show") {
    shutDownAll();
    //setTimeout(loaderShow, 100);
    document.getElementById('carbon_loader').style.display 	= "block";
  } else if (x == "hide") {
    document.getElementById('carbon_loader').style.display 	= "none";
  };
}



function warnOn() {
  var input = document.getElementById('inputEmail');
  input.value = '';
  
  // Берем перевод из словаря в зависимости от текущего языка uiLang
  var errorPlaceholder = translationDictionary["inputEmailError"][uiLang] || translationDictionary["inputEmailError"]["en"];
  
  input.placeholder = errorPlaceholder; 
  input.focus();
}


function getFooter(zx) {
  if ( zx == "off" ) {
    document.getElementById("footer").style.display = "none";
  } else {
    document.getElementById("footer").style.display = "block";
  } 
}




function rechargeId() {
  var restoredId = document.getElementById('inputCarbonId').value;
  postRestoredId(restoredId);
}




async function enablerView(xy) {
  let enablerPromise = new Promise(function(resolve) {
    const logoContainer = document.getElementById("logo");
    const enablerContainer = document.getElementById("enabler");
    const basementContainer = document.getElementById("basement");
    
    // Получаем элементы страницы для смены состояния
    const pageElements = document.querySelectorAll('.page');

    if (xy === 'enabled') {
      // style logo
      logo.src = chrome.runtime.getURL("img/Shustree.png");
      logo.style.opacity = 1;
      
      // style enabler
      enabler.src = chrome.runtime.getURL("img/enabler_on.png");
      
      // style basement
      basement.src = chrome.runtime.getURL("img/basement_enhanced.png");
      document.getElementById('titleShustree').style.opacity = 1;
      document.getElementById('basement').style.opacity = 1;

      // Переключаем в состояние 'enabled' (убираем класс .disabled)
      //pageElements.forEach(page => page.classList.remove('disabled'));
      pageElements.forEach(page => page.classList.add('enabled'));

    } else {
      // style logo
      logo.src = chrome.runtime.getURL("img/Shustree_vertical.png");
      logo.style.opacity = 0.545;
      
      // style enabler
      enabler.src = chrome.runtime.getURL("img/enabler_off.png");
      
      // style basement
      basement.src = chrome.runtime.getURL("img/basement_narrowed.png");
      document.getElementById('titleShustree').style.opacity = 0.545;
      document.getElementById('basement').style.opacity = 0.887;

      // Переключаем в состояние 'disabled' (убираем класс .enabled)
      //pageElements.forEach(page => page.classList.add('disabled'));
      pageElements.forEach(page => page.classList.remove('enabled'));

    }

    // Вставляем элементы только если контейнер еще пуст
    if (logoContainer && !logoContainer.contains(logo)) logoContainer.appendChild(logo);
    if (enablerContainer && !enablerContainer.contains(enabler)) enablerContainer.appendChild(enabler);
    if (basementContainer && !basementContainer.contains(basement)) basementContainer.appendChild(basement);

    resolve();
  });
  await enablerPromise;
}



async function fadeIn(el, timeout, display) {
  let viewPromise 					= new Promise(function(resolve) {
    el.style.opacity = 0;
    el.style.display = display || 'block';
    el.style.transition = `opacity ${timeout}ms`;
    setTimeout(() => {
      el.style.opacity = 1;
    }, 10);
  });
  await viewPromise;
};



const fadeOut = (el, timeout) => {
  el.style.opacity = 1;
  el.style.transition = `opacity ${timeout}ms`;
  el.style.opacity = 0;
  setTimeout(() => {
    el.style.display = 'none';
  }, timeout);
};




// Функция создания оверлея о враждебном расширении
function showHostileOverlay() {
    // Создаем элемент оверлея, если его еще нет
    let overlay = document.getElementById('hostileOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'hostileOverlay';
        overlay.innerHTML = `
            <div class="hostile-content">
                <h2>Внимание!</h2>
                <p>Ваше интернет-соединение контролирует стороннее расширение.</p>
                <p class="sub-text">Обычно это расширения "hypertube", "uboost", другие клоны "разгони Ютуб", онлайн-казино, бесплатные VPN, блокировщики рекламы и прочие вредоносные программы.</p>
                <p>Для нормальной работы Shustree отключите или удалите их и попробуйте снова.</p>
                <button class="okCarbon" id="closeOverlayBtn">ОК</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('closeOverlayBtn').onclick = () => {
            overlay.style.display = 'none';
            // Можно также вызвать сброс прокси здесь, если нужно
        };
    }
    overlay.style.display = 'flex';
}



// =========== CONTROLLER & DATA MODELS FUNCTIONS ===================================================================================================

function getEmail() {
  var email 	= document.getElementById('inputEmail').value;
  if (validateEmail(email)) {  
    document.getElementById("getMain").style.display 	= "none";
    carbonLoader("show");
  } else {
    warnOn();
  }
  return email;
}


// 
async function redirectPayment(paymentUrl) {
  let redirectPromise 				= new Promise(function(resolve) {
    setTimeout(function () {
        carbonLoader("hide");
        window.open(paymentUrl, '_blank');
        view("carbonMain");
    }, 545);
  });
  await redirectPromise;
};


const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};



function openUrl(xUrl) {
  carbonLoader("show");
  setTimeout(function () {
        carbonLoader("hide");
        window.open(xUrl, '_blank');
        view("carbonMain");
  }, 2762);  
}



// send USER DATA to carbonvpn server and get all the data needed
async function postPaymentRequest(m) {
  //disconnect();
  let postPayPromise 					= new Promise(function(resolve) {
    apiPayRequest["extension"] 		= "CARBON";
    apiPayRequest["uid"] 				= carbonUid;
    apiPayRequest["carbonCookie"] 		= carbonCookie;
    apiPayRequest["email"] 			= getEmail();
    apiPayRequest["periodSubscribed"] 	= m;
    var xhr 							= new XMLHttpRequest();
    xhr.open('POST', apiPayUrl, true);
    xhr.setRequestHeader('Content-type', 'text/plain');  
    xhr.onload 						= function () {
      var respJson 						= JSON.parse(this.response);
      var paymentUrl 					= respJson["payment_url"];
      redirectPayment(paymentUrl);
    };
    xhr.send(JSON.stringify(apiPayRequest));
  });
  await postPayPromise;
};




async function trialUpdate(t) {
  let trialPromise 					= new Promise(function(resolve) {
    chrome.storage.sync.set({ 'carbonBalanceExpiration': t });
  });
  await trialPromise;
};




// send USER DATA to restore access
async function postRestoredId(restoredId) {
  let postRestorePromise 				= new Promise(function(resolve) {
    apiPayRequest["extension"] 		= "CARBON";
    apiPayRequest["uid"] 				= carbonUid;
    apiPayRequest["restoredUid"] 		= restoredId;
    apiPayRequest["carbonCookie"] 		= carbonCookie;
    var xhr 							= new XMLHttpRequest();
    xhr.open('POST', apiPayUrl + 'recharge', true);
    xhr.setRequestHeader('Content-type', 'text/plain');  
    xhr.onload 						= function () {
      var respJson 						= JSON.parse(this.response);
      var response 						= respJson["status"];
      if (response == 'success') {
        carbonUid = restoredId;
        postToCarbonAPI(true);
        getFooter("on");
        document.getElementById("getMain").style.display 	= "none";
      } else {
        document.getElementById('errorId').style.display 	= "block";
        document.getElementById("inputCarbonId").focus();
      }
    };
    xhr.send(JSON.stringify(apiPayRequest));
  });
  await postRestorePromise;
};



// Обработчик вызова страницы пополнения
function openTopUpFlow() {
    chrome.storage.sync.get(['paymentInfoWatched'], (result) => {
        if (result.paymentInfoWatched) {
            // Если уже смотрел — переводим сразу на экран с тарифами
            view("carbonCash");
        } else {
            // Первый раз — показываем инфо-экран
            view("carbonPaymentIntro");
        }
    });
}



// Пи получении новых кредов:
function onCredentialsReceived(newUxtx) {
    // 1. МГНОВЕННО обновляем RAM в Background Service Worker
    chrome.runtime.sendMessage({ 
        action: "update_credentials_immediate", 
        uxtx: newUxtx 
    });

    // 2. Асинхронно сохраняем в Storage для смены сессий/перезапуска
    chrome.storage.sync.set({ uxtx: newUxtx });
}





