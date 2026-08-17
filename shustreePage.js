

// *********************** EXECUTION *****************************************************************************************************************************************************************

// Запускаем локализацию сразу после загрузки DOM
document.addEventListener('DOMContentLoaded', applyLocalization);



// if cookie is not set 
if ( carbonCookie == "") {
        // to set a cookie
        carbonCookie 				= makeid(80) + strTime;
        setCookie(carbonCookie);
        carbonCookie 				= getCookie(cookieName);
        chrome.storage.sync.set({ 'carbonCookie': carbonCookie });
};




// send USER DATA to carbonvpn server and get all the data needed
async function postToCarbonAPI(toConnect) {
  // Если запрос уже выполняется, игнорируем повторный вызов
  if (isApiLoading) {
    console.log("API request is already in progress. Skipping duplicate call.");
    carbonLoader("hide");
    return;
  }
  
  isApiLoading = true; // Блокируем повторные вызовы
  carbonLoader("show");
  let postPromise 				= new Promise(function(resolve) {
    apiRequest["extension"] 		= "CARBON";
    apiRequest["useragent"] 		= getUserAgent();
    apiRequest["carbonCookie"] 	= carbonCookie;
    apiRequest["carbonURL"] 		= curUrl;
    apiRequest["connectStatus"] 	= connectStatus;
    apiRequest['action'] 			= userAction;
    apiRequest['uiLang'] 			= uiLang;
    apiRequest['isForeignUser'] 	= isForeignUser;
    var xhr 						= new XMLHttpRequest();
    xhr.open('POST', apiUrl, true);
    xhr.setRequestHeader('Content-type', 'text/plain');  
    // --- УСТАНОВКА ТАЙМАУТА ---
    xhr.timeout = 39762;
    xhr.onload 					= function () {
      carbonLoader("hide");
      isApiLoading = false;
      var respJson 					= JSON.parse(this.response);
      // get and parsed main vars from server
      currentIp 					= respJson["current_ip"].trim();
      carbonUid 					= respJson["carbon_uid"].trim();
      carbonBalance 				= respJson["balance"];
      chrome.storage.sync.set({ 'carbonBalance': carbonBalance });
      carbonHumanBalance 			= respJson["human_balance"];
      carbonCookie 				= respJson["carbonCookie"];
      carbonBalanceExpiration 		= respJson["expiration_time"];
      cookieName 					= respJson["carbon_config"]["cookieName"];
      proxyIp 						= respJson["carbon_config"]["proxyIp"];
      carbonPixelUrl 				= respJson["carbon_config"]["carbonPixelUrl"];
      htmlAboutInject 				= respJson["carbon_config"]["htmlAboutInject"];
      config 						= respJson["carbon_config"]["configProxy"];
      //console.log(config);
      toNotify 						= respJson["carbon_config"]["to_notify"];
      chrome.storage.sync.set({ 'toNotify': toNotify });
      configFree 					= respJson["carbon_config"]["configProxyFree"];
      console.log(configFree);
      if (isForeignUser) {
          free_msecs 				= respJson["carbon_config"]["freetrial"]["value_milsecs_new_market"];
      } else {
          free_msecs 				= respJson["carbon_config"]["freetrial"]["value_milsecs"];
      };
      chrome.storage.sync.set({ 'trialBalance': free_msecs });
      free_descr 					= respJson["carbon_config"]["freetrial"]["value_descr"];
      price1 						= respJson["carbon_config"]["pricing"]["1"];
      price3 						= respJson["carbon_config"]["pricing"]["3"];
      price12 						= respJson["carbon_config"]["pricing"]["12"];
      const notifyFrequency 		= respJson["carbon_config"]["notify_frequency"];
      chrome.storage.sync.set({ 'notifyFrequency': notifyFrequency });
      uxtx 							= respJson["carbon_config"]["authCredentials"]["ux"];
      console.log('пароль:', uxtx);
      // 1. Сохраняем в storage для следующих перезапусков
      chrome.storage.sync.set({ 'uxtx': uxtx });
      // 2. Отправляем в background.js МГНОВЕННО через runtime.sendMessage
      chrome.runtime.sendMessage({
          action: "update_credentials",
          uxtx: uxtx
      });
      const supportUrl 				= respJson["carbon_config"]["tech_support"];
      const shustreeHeadline 		= respJson["carbon_config"]["shustree_headline"];
      document.getElementById("price1").innerHTML 		= price1.toString() + ' р';
      document.getElementById("price3").innerHTML 		= price3.toString() + ' р';
      document.getElementById("price12").innerHTML 		= price12.toString() + ' р';
      document.getElementById("shustreeHeadline").innerHTML 		= shustreeHeadline;

      // updating plain data
      document.getElementById("whatCarbonIsAbout").innerHTML 		= htmlAboutInject;

      document.getElementById("carbonUid").innerHTML = carbonUid.trim();
      if (currentIp == proxyIp) {
        connectStatus 				= "connected";
      } else {
        connectStatus 				= "disconnected";
      };

      // show settings sections if not
      if ( settingsShow === false) {
          settingsShow 				= true;
          document.getElementById("settingsBox").style.display 	= "block";
      }

      // updating complex data
      // 1. if a balance is unpaid: 
      if ( carbonBalance === 0 ) {
            carbonLoader("hide");
            //console.log('===========================================');
            resolve();
            // get startDate
            chrome.storage.sync.get(['startDate'], function (data) {
              var startDate = data.startDate;
              var curTime = Date.now();
              //perform async set of carbon cached test balance
              trialUpdate(startDate + free_msecs);
              // 1.1 and if startDate is < trial ago:
              if ( ( curTime - startDate ) < free_msecs ) {
                var tb = free_msecs - curTime + startDate;
                chrome.storage.sync.set({ 'carbonBalanceExpiration': startDate });
                // TODO сделать двуязычным
                carbonHumanBalance = getTrialHumanized( tb ); //free_descr;
                //connect
                if (toConnect === true) {

                  setTimeout(function () {
                      connect(configFree);
                      view("carbonStart");
                      document.getElementById("getMain").style.display 	= "block";

                  }, defaultTimeOut);

                } else {
                  disconnect();
                  view("carbonMain");
                  document.getElementById("getMain").style.display 	= "none";
                };
                //view 1st page with no footer
                getFooter("on");
              // 1.2 if a trial has been expired
              } else {
                //to disconnect
                disconnect();
                carbonLoader("hide");
      
                //view default page with a footer
                getFooter("on");
                view("carbonMain");
                document.getElementById("getMain").style.display 	= "none";
                chrome.storage.sync.set({ 'carbonBalanceExpiration': startDate });
                //chrome.storage.sync.set({ 'zeroBalanceWatched': true });
              };
              // set balance
              document.getElementById("carbonBalanceX").innerHTML 			= carbonHumanBalance;
              document.getElementById("carbonBalanceY").innerHTML 			= carbonHumanBalance;
            });

          // 2. if balance is paid: 
      } else if ( carbonBalance > 0 ) {
            //connect
            resolve();
            carbonLoader("hide");
            chrome.storage.sync.set({ 'carbonBalanceExpiration': carbonBalanceExpiration });
            document.getElementById("carbonBalanceX").innerHTML 			= carbonHumanBalance;
            document.getElementById("carbonBalanceY").innerHTML 			= carbonHumanBalance;
            setTimeout(function () {
              if (toConnect === true) {
                  connect(config);
              } else {
                  disconnect();
              };
              view("carbonMain");
              document.getElementById("getMain").style.display 	= "none";
            }, defaultTimeOut);
            //view default page with footer
      };

      getFooter("on");
      carbonLoader("hide");
      document.getElementById("inputEmail").focus();
      document.getElementById("inputCarbonId").focus();
      resolve();   
    };

    // --- ОБРАБОТКА ТАЙМАУТА ---
    xhr.ontimeout = function (e) {
      console.error("Shustree API timeout reached (39.762s). Forcing disconnect.");
      carbonLoader("hide");
      // Принудительный вызов disconnect
      disconnect();
      view("carbonError");
      resolve(); // Завершаем промис, чтобы не "подвешивать" await
    };

    // Обработка обычных ошибок сети (DNS, No Route)
    xhr.onerror = function () {
      console.error("Network error during postToCarbonAPI");
      carbonLoader("hide");
      disconnect();
      view("carbonError");
      resolve();
    };

    try {
            xhr.send(JSON.stringify(apiRequest));
    } catch (sendErr) {
            console.error("XHR Send failed:", sendErr);
            carbonLoader("hide");
            try {
                carbonLoader("hide");
                disconnect();
                view("carbonError");
            } catch (err) {
                console.error("UI error during failure handling:", err);
            }
            // 3. Resolve the promise so 'await' doesn't hang forever
            resolve();
            carbonLoader("hide");
    }
  });
  await postPromise;
  carbonLoader("hide");
};

    
// set wathced Popup at least Once trigger
chrome.storage.sync.set({ 'atleastWatched': true });



//set logo & name
logo.src = chrome.runtime.getURL("img/Shustree_vertical.png");
logo.style.width = '70px';
logo.style.opacity = 0.545;
document.getElementById("logo").appendChild(logo);
document.getElementById('basement').style.opacity = 0.545;
document.getElementById('titleShustree').style.opacity = 0.545;



//set central enabler button
enabler.src = chrome.runtime.getURL("img/enabler_off.png");
enabler.style.width = '70px';
document.getElementById("enabler").appendChild(enabler);


//set basement image
basement.src = chrome.runtime.getURL("img/basement_narrowed.png");
basement.style.width = '100%';
document.getElementById("basement").appendChild(basement);


//set 3 pay images
var pay1img = document.createElement("img");
var pay2img = document.createElement("img");
var pay3img = document.createElement("img");

pay1img.src = chrome.runtime.getURL("img/pay_line_1.png");
pay1img.id = 'pay1img';
document.getElementById("buy1png").appendChild(pay1img);
document.getElementById("pay1img").classList.add('zeroCredit');

pay2img.src = chrome.runtime.getURL("img/pay_line_2.png");
pay2img.id = 'pay3img';
document.getElementById("buy3png").appendChild(pay2img);
document.getElementById("pay3img").classList.add('zeroCredit');

pay3img.src = chrome.runtime.getURL("img/pay_line_3.png");
pay3img.id = 'pay12img';
document.getElementById("buy12png").appendChild(pay3img);
document.getElementById("pay12img").classList.add('zeroCredit');



//set default pay plan
getPrice(3);



//START EXTENSION FUNCTIONALITY
postAutoConnectChoice('undefined', true)



// Обработка нажатия Enter на поле ввода ID (теперь это input)
const inputIdField = document.getElementById('inputCarbonId');
if (inputIdField) {
    inputIdField.addEventListener("keydown", function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            rechargeId(); // Твоя функция активации ID
        }
    });
}

// Обработка нажатия Enter на поле ввода Email (теперь это input)
const inputEmailField = document.getElementById('inputEmail');
if (inputEmailField) {
    inputEmailField.addEventListener("keydown", function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            getEmail(); // Твоя функция обработки Email и отправки на оплату
        }
    });
}



function enableFunction() {
  if ( connectStatus == 'connected' ) {
    disconnect();
  } else {
    postToCarbonAPI(true);
  }
};



//set events for actual view udated
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('getMain').addEventListener("click", function() {
    document.getElementById("getMain").style.display 	= "none";
    view("carbonMain");
    getFooter("on");
  });
  document.getElementById('charge1').addEventListener("click", function() {
    document.getElementById("getMain").style.display 	= "block";
    view("carbonCash");
    getFooter("on");
    getPrice(3);
  });
  document.getElementById('charge2').addEventListener("click", function() {
    document.getElementById("getMain").style.display 	= "block";
    view("carbonCash");
    getFooter("on");
    getPrice(3);
  });
  document.getElementById('about1').addEventListener("click", function() {
    document.getElementById("getMain").style.display 	= "block";
    view("carbonAbout");
  });
  document.getElementById('techSupport1').addEventListener("click", function() {
    document.getElementById("getMain").style.display 	= "block";
    view("carbonTechSupport");
  });
  document.getElementById('inputAlreadyPaid').addEventListener("click", function() {
    document.getElementById("getMain").style.display 	= "block";
    document.getElementById('errorId').style.display 		= "none";
    view("carbonRestoreId");
    document.getElementById("inputCarbonId").focus();
  });
  document.getElementById("buy1").addEventListener("click", function() {
    getPrice(1);
  });
  document.getElementById("buy3").addEventListener("click", function() {
    getPrice(3);
  });
  document.getElementById("buy12").addEventListener("click", function() {
    getPrice(12);
  });
  document.getElementById("theMetalFundamentals").addEventListener("click", function() {
    postPaymentRequest(planSelected);
  });
  document.getElementById("getRecharged").addEventListener("click", function() {
    rechargeId();
  });
  document.getElementById("enabler").addEventListener("click", function() {
    enableFunction();
  });
  document.getElementById("refYouTube").addEventListener("click", function() {
    openUrl("https://youtube.com");
  });
  document.getElementById("refGemini").addEventListener("click", function() {
    openUrl("https://gemini.google.com");
  });
  document.getElementById("refChatGPT").addEventListener("click", function() {
    openUrl("https://chatgpt.com");
  });
  document.getElementById("refByDefault").addEventListener("click", function() {
    openUrl("https://youtube.com");
  });
  autoConnectCheckBox.addEventListener('change', function() {
        if (autoConnectCheckBox.checked) {
            autoShow = true;
            postAutoConnectChoice(true, false);
            postToCarbonAPI(true);
        } else {
            postAutoConnectChoice(false, false);
            autoShow = false;
        }
    });
});



//reconnect if a tab is reactivated 
document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "visible" && autoShow === true) {
    // code when page is visible
    postToCarbonAPI(true);
  }
});




chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.connectStatus) {
        if (changes.connectStatus.newValue === 'disconnected') {
            // Обновляем UI вкладки, если она открыта
            enablerView('disabled');
            getIp('x');
        }
    }
});




