// content.js - Content script to remove search results from csdn.net on Bing

(function() {
    'use strict';
  
    // Function to remove search results containing csdn.net
    function removeCsdnResults() {
      console.log('[BetterSearch] Starting to check search results');
      
      // Find all search result items
      const searchResults = document.querySelectorAll('li.b_algo');
      console.log(`[BetterSearch] Found ${searchResults.length} search results`);
      
      let removedCount = 0;
      searchResults.forEach((result, index) => {
        // Find cite elements within each search result
        const citeElement = result.querySelector('cite');
        
        if (citeElement) {
          console.log(`[BetterSearch] Checking result ${index}: ${citeElement.textContent}`);
          
          // Check if the cite text contains csdn.net
          if (citeElement.textContent.includes('csdn.net')) {
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
    }
  
    // Run the function when page loads
    window.addEventListener('load', removeCsdnResults);
    
    // Also run it periodically in case of dynamic content loading
    setInterval(removeCsdnResults, 1000);
  })();