// content_google.js - Content script to remove Google search results based on blocked domains, titles and descriptions

(function() {
    'use strict';
  
    // Function to remove search results containing blocked domains, titles or descriptions
    function removeBlockedResults() {
      // Get blocked domains, title keywords and description keywords from storage
      chrome.storage.sync.get(['blockedDomains', 'blockedKeywords', 'blockedDescKeywords'], function(result) {
        const blockedDomains = result.blockedDomains || [];
        const blockedKeywords = result.blockedKeywords || [];
        const blockedDescKeywords = result.blockedDescKeywords || [];
        console.log('[BetterSearch] Starting to check Google search results. Blocked domains:', blockedDomains, 'Blocked title keywords:', blockedKeywords, 'Blocked description keywords:', blockedDescKeywords);
        
        // Find all search result items
        const searchResults = document.querySelectorAll('div.MjjYud');
        console.log(`[BetterSearch] Found ${searchResults.length} Google search results`);
        
        let removedCount = 0;
        searchResults.forEach((result, index) => {
          // Find cite elements within each search result
          const citeElement = result.querySelector('cite');
          
          // Find title elements (h3) within each search result
          const titleElement = result.querySelector('h3');
          
          // Find description elements within each search result
          const descElement = result.querySelector('.VwiC3b');
          
          if (citeElement || titleElement || descElement) {
            let shouldBlock = false;
            
            // Check if the cite text contains any of the blocked domains
            if (citeElement) {
              console.log(`[BetterSearch] Checking Google result ${index} cite: ${citeElement.textContent}`);
              shouldBlock = blockedDomains.some(domain => {
                // Special handling for the wildcard domain *.bing.com
                if (domain === '*.bing.com') {
                  // Extract the domain from the cite element
                  const citeText = citeElement.textContent;
                  try {
                    // Try to create a URL to easily extract the hostname
                    const url = new URL('http://' + citeText.replace(/^https?:\/\//, ''));
                    const hostname = url.hostname;
                    // Check if it's a subdomain of bing.com
                    return hostname.endsWith('.bing.com') || hostname === 'bing.com';
                  } catch (e) {
                    // If URL parsing fails, fall back to simple string matching
                    return citeText.includes('.bing.com');
                  }
                }
                // Regular domain matching
                return citeElement.textContent.includes(domain);
              });
            }
            
            // Check if the title text contains any of the blocked keywords
            if (!shouldBlock && titleElement) {
              console.log(`[BetterSearch] Checking Google result ${index} title: ${titleElement.textContent}`);
              shouldBlock = blockedKeywords.some(keyword => 
                titleElement.textContent.includes(keyword)
              );
            }
            
            // Check if the description text contains any of the blocked keywords
            if (!shouldBlock && descElement) {
              console.log(`[BetterSearch] Checking Google result ${index} description: ${descElement.textContent}`);
              shouldBlock = blockedDescKeywords.some(keyword => 
                descElement.textContent.includes(keyword)
              );
            }
            
            if (shouldBlock) {
              console.log(`[BetterSearch] Removing Google result ${index}`);
              // Remove the entire search result
              result.remove();
              removedCount++;
            }
          } else {
            console.log(`[BetterSearch] No cite, title or description element found in Google result ${index}`);
          }
        });
        
        console.log(`[BetterSearch] Finished checking Google results. Removed ${removedCount} results.`);
      });
    }
  
    // Run the function when page loads
    window.addEventListener('load', removeBlockedResults);
    
    // Also run it periodically in case of dynamic content loading
    setInterval(removeBlockedResults, 1000);
  })();