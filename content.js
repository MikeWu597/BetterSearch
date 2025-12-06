// content.js - Content script to remove search results based on blocked domains list

(function() {
    'use strict';
  
    // Function to remove search results containing blocked domains
    function removeBlockedResults() {
      // Get blocked domains from storage
      chrome.storage.sync.get(['blockedDomains'], function(result) {
        const blockedDomains = result.blockedDomains || [];
        console.log('[BetterSearch] Starting to check search results. Blocked domains:', blockedDomains);
        
        // Find all search result items
        const searchResults = document.querySelectorAll('li.b_algo');
        console.log(`[BetterSearch] Found ${searchResults.length} search results`);
        
        let removedCount = 0;
        searchResults.forEach((result, index) => {
          // Find cite elements within each search result
          const citeElement = result.querySelector('cite');
          
          if (citeElement) {
            console.log(`[BetterSearch] Checking result ${index}: ${citeElement.textContent}`);
            
            // Check if the cite text contains any of the blocked domains
            const shouldBlock = blockedDomains.some(domain => 
              citeElement.textContent.includes(domain)
            );
            
            if (shouldBlock) {
              console.log(`[BetterSearch] Removing result ${index} with cite: ${citeElement.textContent}`);
              // Remove the entire search result
              result.remove();
              removedCount++;
            }
          } else {
            console.log(`[BetterSearch] No cite element found in result ${index}`);
          }
        });
        
        console.log(`[BetterSearch] Finished checking. Removed ${removedCount} results.`);
      });
    }
  
    // Run the function when page loads
    window.addEventListener('load', removeBlockedResults);
    
    // Also run it periodically in case of dynamic content loading
    setInterval(removeBlockedResults, 1000);
  })();