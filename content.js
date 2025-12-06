// content.js - Content script to remove search results based on blocked domains list

(function() {
    'use strict';
  
    // Function to remove search results containing blocked domains or keywords
    function removeBlockedResults() {
      // Get blocked domains, title keywords and description keywords from storage
      chrome.storage.sync.get(['blockedDomains', 'blockedKeywords', 'blockedDescKeywords'], function(result) {
        const blockedDomains = result.blockedDomains || [];
        const blockedKeywords = result.blockedKeywords || [];
        const blockedDescKeywords = result.blockedDescKeywords || [];
        console.log('[BetterSearch] Starting to check search results. Blocked domains:', blockedDomains, 'Blocked title keywords:', blockedKeywords, 'Blocked description keywords:', blockedDescKeywords);
        
        // Find all search result items
        const searchResults = document.querySelectorAll('li.b_algo');
        console.log(`[BetterSearch] Found ${searchResults.length} search results`);
        
        let removedCount = 0;
        searchResults.forEach((result, index) => {
          // Find cite elements within each search result
          const citeElement = result.querySelector('cite');
          
          // Find title elements (h2) within each search result
          const titleElement = result.querySelector('h2 a');
          
          // Find description elements with class b_lineclamp2 within each search result
          const descElement = result.querySelector('.b_lineclamp2');
          
          if (citeElement || titleElement || descElement) {
            let shouldBlock = false;
            
            // Check if the cite text contains any of the blocked domains
            if (citeElement) {
              console.log(`[BetterSearch] Checking result ${index} cite: ${citeElement.textContent}`);
              shouldBlock = blockedDomains.some(domain => 
                citeElement.textContent.includes(domain)
              );
            }
            
            // Check if the title text contains any of the blocked keywords
            if (!shouldBlock && titleElement) {
              console.log(`[BetterSearch] Checking result ${index} title: ${titleElement.textContent}`);
              shouldBlock = blockedKeywords.some(keyword => 
                titleElement.textContent.includes(keyword)
              );
            }
            
            // Check if the description text contains any of the blocked keywords
            if (!shouldBlock && descElement) {
              console.log(`[BetterSearch] Checking result ${index} description: ${descElement.textContent}`);
              shouldBlock = blockedDescKeywords.some(keyword => 
                descElement.textContent.includes(keyword)
              );
            }
            
            if (shouldBlock) {
              console.log(`[BetterSearch] Removing result ${index}`);
              // Remove the entire search result
              result.remove();
              removedCount++;
            }
          } else {
            console.log(`[BetterSearch] No cite, title or description element found in result ${index}`);
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