// content_google.js - Content script to hide Google search results based on blocked domains, titles and descriptions

(function() {
    'use strict';
  
    // Function to hide search results containing blocked domains, titles or descriptions
    function hideBlockedResults() {
      // Get blocked domains, title keywords and description keywords from storage
      chrome.storage.sync.get(['blockedDomains', 'blockedKeywords', 'blockedDescKeywords'], function(result) {
        const blockedDomains = result.blockedDomains || [];
        const blockedKeywords = result.blockedKeywords || [];
        const blockedDescKeywords = result.blockedDescKeywords || [];
        console.log('[BetterSearch] Starting to check Google search results. Blocked domains:', blockedDomains, 'Blocked title keywords:', blockedKeywords, 'Blocked description keywords:', blockedDescKeywords);
        
        // Find all search result items with data-rpos attribute
        const searchResults = document.querySelectorAll('div[data-rpos]');
        console.log(`[BetterSearch] Found ${searchResults.length} Google search results`);
        
        let hiddenCount = 0;
        searchResults.forEach((result, index) => {
          // Find cite elements within each search result
          const citeElement = result.querySelector('cite');
          
          // Find title elements (h3) within each search result
          const titleElement = result.querySelector('h3');
          
          // Find description elements with -webkit-line-clamp style
          const descElement = result.querySelector('[style*="-webkit-line-clamp"]');
          
          if (citeElement || titleElement || descElement) {
            let shouldBlock = false;
            
            // Check if the cite text contains any of the blocked domains (case insensitive)
            if (citeElement) {
              console.log(`[BetterSearch] Checking Google result ${index} cite: ${citeElement.textContent}`);
              shouldBlock = blockedDomains.some(domain => {
                // Special handling for the wildcard domain *.bing.com
                if (domain === '*.bing.com') {
                  // Extract the domain from the cite element
                  const citeText = citeElement.textContent.toLowerCase();
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
                // Regular domain matching (case insensitive)
                return citeElement.textContent.toLowerCase().includes(domain.toLowerCase());
              });
            }
            
            // Check if the title text contains any of the blocked keywords (case insensitive)
            if (!shouldBlock && titleElement) {
              console.log(`[BetterSearch] Checking Google result ${index} title: ${titleElement.textContent}`);
              shouldBlock = blockedKeywords.some(keyword => 
                titleElement.textContent.toLowerCase().includes(keyword.toLowerCase())
              );
            }
            
            // Check if the description text contains any of the blocked keywords (case insensitive)
            if (!shouldBlock && descElement) {
              console.log(`[BetterSearch] Checking Google result ${index} description: ${descElement.textContent}`);
              shouldBlock = blockedDescKeywords.some(keyword => 
                descElement.textContent.toLowerCase().includes(keyword.toLowerCase())
              );
            }
            
            if (shouldBlock) {
              console.log(`[BetterSearch] Hiding Google result ${index}`);
              // Hide the entire search result
              result.style.display = 'none';
              hiddenCount++;
            }
          } else {
            console.log(`[BetterSearch] No cite, title or description element found in Google result ${index}`);
          }
        });
        
        console.log(`[BetterSearch] Finished checking Google results. Hidden ${hiddenCount} results.`);
      });
    }
  
    // Run the function when page loads
    window.addEventListener('load', hideBlockedResults);
    
    // Also run it periodically in case of dynamic content loading
    setInterval(hideBlockedResults, 1000);
  })();