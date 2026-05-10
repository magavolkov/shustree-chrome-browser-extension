# shustree-chrome-browser-extension
## Shustree Chrome Browser Extension (v1.5.9) 

* **Chrome Web Store:** [Chrome Extension Shustree](https://chromewebstore.google.com/detail/shustree/fjancimbiajbfljkoggkchelcfmknkoo)
* **Website:** [shustree.ru](https://shustree.ru)


A lightweight, highly customizable Google Chrome extension designed for advanced routing of browser traffic. This version (1.5.9) is a production-ready release showcasing advanced chrome.proxy API implementations, tailored for developers who need robust routing control.  

__Features & Russian Network Specifics__  
    • Multi-Protocol Support: Configure and route traffic seamlessly through HTTP, HTTPS, and SOCKS5 proxy protocols.  
    • Highly Customizable API Routing: This production version showcases advanced, custom API calls for handling proxy dynamic configuration, authentication, and rules. You can easily advance or simplify the rules based on your infrastructure requirements.  
    • Russia Network Compliance:  
      ⚠️ Warning: SOCKS5 protocols are heavily DPI-blocked (Deep Packet Inspection) or throttled within the Russian Federation. If you are deploying nodes targeting users in Russia, it is highly recommended to use HTTP/HTTPS proxy protocols instead of SOCKS5.  

__Recommended Server-Side Backends__  
To pair with this extension, you can easily deploy your own proxy servers using standard Linux packages:\
    • HTTP/HTTPS: Use Squid Proxy — a caching proxy for the Web supporting HTTP/HTTPS with robust access control.\
    • SOCKS5: Use Dante — a high-performance, industry-standard SOCKS server (ideal for setups outside of Russian DPI-restricted zones).\

__Extension Configuration Examples__  
The core of the routing relies on Chrome's chrome.proxy.settings API. Below are code templates demonstrating how to structure the internal JSON configuration parameters within background.js (or your service worker) for different proxy setups.  

__1. HTTP Proxy Configuration__  
Routes all standard HTTP and fallback traffic through an unencrypted HTTP proxy server.  

```JavaScript
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


__Installation & Developer Setup__  
    1. Clone this repository:  
       ```Bash
       git clone https://github.com/perfectwavecheez-dotcom/shustree-chrome-browser-extension.git```
    2. Navigate to Chrome's Extension Manager by typing chrome://extensions/ in the URL bar.  
    3. Enable Developer mode (toggle in the top-right corner).  
    4. Click Load unpacked in the top-left corner.  
    5. Select the 1.5.9_DEV_SHUSTREE_TLS_GITHUB directory.  
    6. Open your browser console or the extension service worker background console to view active routing outputs.  

__License__  
This project is open-sourced under the MIT License. Feel free to modify, simplify, or scale the API logic to match your custom proxy architectures.
