


// *********************** EXECUTION *****************************************************************************************************************************************************************




function closeShustreeTabs() {
  chrome.tabs.query( { "url":[ 
      "chrome-extension://fjancimbiajbfljkoggkchelcfmknkoo/shustree_balance.html" 
  ] }, function( tabs ){ 
    tabs.forEach(function(tab) {
        chrome.tabs.remove(tab.id);
    });
  })
}


closeShustreeTabs();


chrome.tabs.create({url:"shustree_balance.html"});





