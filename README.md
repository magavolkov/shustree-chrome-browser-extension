# shustree-chrome-browser-extension


## English

## Shustree Chrome Browser Extension (v1.7.4)


* **Chrome Web Store:** [Chrome Extension Shustree](https://chromewebstore.google.com/detail/shustree/fjancimbiajbfljkoggkchelcfmknkoo)
* **Website:** [shustree.ru](https://shustree.ru)

A lightweight, highly customizable Google Chrome extension designed for advanced routing of browser traffic. This production-ready release showcases advanced `chrome.proxy` API implementations, tailored for developers who need robust routing control with zero heavy third-party overhead.

---

## 🚀 Features & Russian Network Specifics  
* **Multi-Protocol Support:** Configure and route traffic seamlessly through HTTP, HTTPS, and SOCKS5 proxy protocols.  
* **Highly Customizable API Routing:** Advanced, custom API calls for handling proxy dynamic configuration, authentication, and routing rules. You can easily advance or simplify the rules based on your infrastructure requirements.  
* **Bilingual Support (EN/RU):** Full native localization for both English and Russian markets. The extension dynamically adapts its UI, troubleshooting guides, and system messages based on the user's browser language environment.
* **Russia Network Compliance:** > ⚠️ **Warning:** SOCKS5 protocols are heavily DPI-blocked (Deep Packet Inspection) or throttled within the Russian Federation. If you are deploying nodes targeting users in Russia, it is highly recommended to use HTTP/HTTPS proxy protocols instead of SOCKS5.  

---

## ⚡ Zero-Dependency Architecture & Custom UI Framework

Unlike many modern extensions weighed down by heavy external libraries, Shustree is built from the ground up for maximum responsiveness and security:

* **Vanilla JS + Native APIs:** Written entirely in pure, vanilla JavaScript utilizing native Chrome extension APIs.
* **Custom Micro-Framework:** The extension utilizes a proprietary lightweight UI framework that pre-renders the entire application instantly. There is no usage of jQuery, React, or other bloated runtime engines.
* **Privacy-First & No Third-Party Requests:** The UI is truly blazing fast and responsive. More importantly, the extension makes **zero third-party network requests** — all communications are strictly limited to your own dedicated service API, completely protecting user data from external leakage or telemetry tracking.

---

## 🛠️ Recommended Server-Side Backends  
To pair with this extension, you can easily deploy your own proxy servers using standard Linux packages:
* **HTTP:** Use [Squid Proxy](http://www.squid-cache.org/) — the industry standard for robust, high-performance caching and HTTP proxy routing with flexible access control.
* **SOCKS5:** Use [Dante](https://www.inet.no/dante/) — a top-tier, highly stable SOCKS server (ideal for setups deployed outside of Russian DPI-restricted zones).
* **HTTPS (Secure):** For secure, encrypted TLS proxying, we recommend pairing Squid/Dante with a reverse-proxy TLS wrapper (like [Nginx](https://nginx.org/) or [Stunnel](https://www.stunnel.org/)) to handle the encryption handshake before passing clean traffic to your proxy daemon, or utilizing specialized secure tunneling.

---

## 💻 Extension Configuration Examples  
The core of the routing relies on Chrome's `chrome.proxy.settings` API. Below are code templates demonstrating how to structure the internal JSON configuration parameters within `background.js` (or your service worker) for different proxy setups.  

### 1. HTTP Proxy Configuration  
Routes all standard HTTP and fallback traffic through an unencrypted HTTP proxy server.  

```javascript
const httpConfig = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "http",
      host: "your.http-proxy-server.com",
      port: 3128 // Default Squid port
    },
    bypassList: ["localhost", "127.0.0.1", "<all_urls>"] // Exclude local domains
  }
};

chrome.proxy.settings.set({ value: httpConfig, scope: "regular" }, () => {
  console.log("HTTP Proxy configured successfully.");
});
```

__2. HTTPS (Secure) Proxy Configuration__  
Encrypts the connection handshake and payload between your browser and the proxy server using TLS/SSL.  
```JavaScript
const httpsConfig = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "https",
      host: "your.secure-proxy-server.com",
      port: 443
    },
    bypassList: ["localhost", "127.0.0.1"]
  }
};

chrome.proxy.settings.set({ value: httpsConfig, scope: "regular" }, () => {
  console.log("Secure HTTPS Proxy configured successfully.");
});
```

__3. SOCKS5 Configuration__  
Routes traffic through a SOCKS5 proxy server. (Note: Remember the blocking restrictions inside Russia).  
```JavaScript
const socks5Config = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "socks5",
      host: "your.socks5-server.com",
      port: 1080 // Default Dante/SOCKS5 port
    },
    bypassList: ["localhost", "127.0.0.1"]
  }
};

chrome.proxy.settings.set({ value: socks5Config, scope: "regular" }, () => {
  console.log("SOCKS5 Proxy configured successfully.");
});
```

__4. Proxy Authentication Handling (Manifest V3)__  
If your Dante or Squid proxies require authentication, the extension handles background proxy credentials via the chrome.webRequest API.  
```JavaScript
// In your background.js
chrome.webRequest.onAuthRequired.addListener(
  (details) => {
    if (details.isProxy) {
      return {
        authCredentials: {
          username: "your_shustree_username",
          password: "your_secure_password"
        }
      };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"] // Required for credential injection
);
```


__⚙️ Installation & Developer Setup__  
    1. Clone this repository:  
       ```bash
   git clone https://github.com/magavolkov/shustree-chrome-browser-extension.git
       ```  
    2. Navigate to Chrome's Extension Manager by typing chrome://extensions/ in the URL bar.  
    3. Enable Developer mode (toggle in the top-right corner).  
    4. Click Load unpacked in the top-left corner.  
    5. Select the root directory of the cloned repository (shustree-chrome-browser-extension).  
    6. Open your browser console or the extension service worker background console to view active routing outputs.  

__License__  
This project is open-sourced under the MIT License. Feel free to modify, simplify, or scale the API logic to match your custom proxy architectures.






---


## Расширение Shustree для браузера Chrome (v1.7.4)

## Shustree Chrome Browser Extension (v1.7.4)


* **Расширение в Chrome Web Store:** [Chrome Extension Shustree](https://chromewebstore.google.com/detail/shustree/fjancimbiajbfljkoggkchelcfmknkoo)
* **Вебсайт:** [shustree.ru](https://shustree.ru)

Легковесное, гибко настраиваемое расширение для Google Chrome, разработанное для продвинутой маршрутизации браузерного трафика. Готовый к продакшену релиз демонстрирует глубокое использование API chrome.proxy и предназначен для разработчиков, которым нужен полный контроль над маршрутизацией без использования тяжелых сторонних фреймворков.



---

## 🚀 Возможности и специфика сетей в РФ:  
* **Поддержка мультипротокольности:** Настройка и маршрутизация трафика через прокси-протоколы HTTP, HTTPS и SOCKS5.  
* **Гибко настраиваемая API-маршрутизация:** Продвинутые кастомные API-вызовы для динамической конфигурации прокси, аутентификации и правил маршрутизации. Вы можете легко усложнять или упрощать правила под требования своей инфраструктуры.  
* **Двуязычность (EN/RU):** Полноценная нативная локализация для англоязычного и русскоязычного рынков. Расширение динамически адаптирует интерфейс, инструкции по устранению неполадок и системные сообщения под язык браузера пользователя.
* **Совместимость с российскими сетями:** > ⚠️ **Внимание:** Протокол SOCKS5 подвержен жестким блокировкам DPI (Deep Packet Inspection) и замедлению в РФ. Если вы разворачиваете узлы для пользователей в России, настоятельно рекомендуется использовать HTTP/HTTPS протоколы вместо SOCKS5.  




---

## ⚡ Архитектура без сторонних зависимостей и кастомный UI-фреймворк:

В отличие от большинства современных расширений, перегруженных тяжелыми внешними библиотеками, Shustree спроектирован с нуля для максимального отклика и безопасности:

* **Vanilla JS + Native APIs:** Написан полностью на чистом JavaScript с использованием нативных API расширений Chrome.
* **Кастомный микрофреймворк:** Расширение использует собственный легковесный UI-фреймворк, который мгновенно отрисовывает приложение. Никакого jQuery, React или других тяжелых движков.
* **Приватность превыше всего:** Интерфейс работает невероятно быстро. Что еще важнее — расширение совершает ровно ноль сторонних сетевых запросов: все коммуникации строго ограничены вашим собственным API, полностью защищая данные пользователей от утечек и систем аналитики.






## 🛠️ Рекомендуемые серверные решения
Для работы с расширением вы можете легко развернуть собственные прокси-серверы, используя стандартные Linux-пакеты:
* **HTTP:** Используйте [Squid Proxy](http://www.squid-cache.org/) — индустриальный стандарт для надежного, высокопроизводительного кэширования и HTTP-маршрутизации с гибким контролем доступа.
* **SOCKS5:** Используйте [Dante](https://www.inet.no/dante/) — высококлассный и стабильный SOCKS-сервер (идеален для узлов, развернутых за пределами зоны действия систем DPI в РФ).
* **HTTPS (Защищенный):** Для защищенного шифрованного TLS-проксирования рекомендуется связывать Squid/Dante с обратным TLS-прокси (например, [Nginx](https://nginx.org/) или [Stunnel](https://www.stunnel.org/)), который берет на себя TLS-рукопожатие перед передачей чистого трафика на прокси-демон, либо использовать специализированные защищенные туннели.

---

## 💻 Примеры конфигурации расширения
Ядро маршрутизации опирается на API Chrome `chrome.proxy.settings`. Ниже приведены шаблоны кода, демонстрирующие структуру внутренних параметров JSON-конфигурации в `background.js` (или service worker) для различных вариантов прокси.

### 1. Конфигурация HTTP Proxy
Маршрутизирует весь стандартный HTTP и резервный трафик через незашифрованный HTTP прокси-сервер.

```javascript
const httpConfig = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "http",
      host: "your.http-proxy-server.com",
      port: 3128 // Стандартный порт Squid
    },
    bypassList: ["localhost", "127.0.0.1", "<all_urls>"] // Исключение локальных доменов
  }
};

chrome.proxy.settings.set({ value: httpConfig, scope: "regular" }, () => {
  console.log("HTTP Proxy успешно настроен.");
});
```



__2. Конфигурация HTTPS (Secure) Proxy__  
Шифрует рукопожатие и передаваемые данные между браузером и прокси-сервером с помощью TLS/SSL.  
```JavaScript
const httpsConfig = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "https",
      host: "your.secure-proxy-server.com",
      port: 443
    },
    bypassList: ["localhost", "127.0.0.1"]
  }
};

chrome.proxy.settings.set({ value: httpsConfig, scope: "regular" }, () => {
  console.log("Secure HTTPS Proxy configured successfully.");
});
```




__3. Конфигурация SOCKS5__  
Маршрутизирует трафик через SOCKS5 прокси-сервер. (Примечание: учитывайте ограничения и блокировки DPI внутри России).

```JavaScript
const socks5Config = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "socks5",
      host: "your.socks5-server.com",
      port: 1080 // Стандартный порт Dante/SOCKS5
    },
    bypassList: ["localhost", "127.0.0.1"]
  }
};

chrome.proxy.settings.set({ value: socks5Config, scope: "regular" }, () => {
  console.log("SOCKS5 Proxy успешно настроен.");
});

```


__4. Обработка аутентификации на прокси (Manifest V3)__  
Если ваши прокси Dante или Squid требуют авторизации, расширение передает учетные данные в фоновом режиме через API chrome.webRequest.

```JavaScript
// В вашем background.js
chrome.webRequest.onAuthRequired.addListener(
  (details) => {
    if (details.isProxy) {
      return {
        authCredentials: {
          username: "your_shustree_username",
          password: "your_secure_password"
        }
      };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"] // Требуется для подстановки учетных данных
);
```


__⚙️ Installation & Developer Setup__  
    1. Клонируйте репозиторий:  
       ```bash
   git clone https://github.com/magavolkov/shustree-chrome-browser-extension.git
       ```  
    2. Перейдите в раздел управления расширениями Chrome, введя chrome://extensions/ в адресной строке.  
    3. Включите Режим разработчика (переключатель в правом верхнем углу).  
    4. Нажмите Загрузить распакованное расширение в левом верхнем углу.  
    5. Выберите корневую директорию клонированного репозитория (shustree-chrome-browser-extension).  
    6. Откройте консоль браузера или фоновую консоль service worker расширения для просмотра активных логов маршрутизации.  

__License__  
Проект распространяется под открытой лицензией MIT. Вы можете свободно модифицировать, упрощать или масштабировать логику API под ваши архитектурные задачи



