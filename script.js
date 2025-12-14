// Function to load markdown content
async function loadMarkdownContent(section) {
    try {
        const response = await fetch(`content/${section}.md`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdownText = await response.text();
        const htmlContent = marked.parse(markdownText);
        document.getElementById('content-container').innerHTML = `<div class="markdown-content">${htmlContent}</div>`;
        
        // Update active nav link
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');
    } catch (error) {
        console.error('Error loading markdown content:', error);
        document.getElementById('content-container').innerHTML = `<p>콘텐츠를 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
    }
}

// Direct jump scrolling for navigation links (no smooth scrolling)
document.querySelectorAll('.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const section = this.getAttribute('data-section');
        
        // Load the markdown content
        loadMarkdownContent(section);
    });
});

// Function to perform search
async function performSearch(searchTerm) {
    if (!searchTerm) {
        alert('검색어를 입력해주세요.');
        return;
    }

    // Search in all markdown files
    const sections = ['introduction', 'preparation', 'procedures', 'reporting', 'resources'];
    let found = false;

    for (const section of sections) {
        try {
            const response = await fetch(`content/${section}.md`);
            if (!response.ok) continue;
            
            const content = await response.text();
            
            if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
                // Load the section where the term was found
                await loadMarkdownContent(section);
                
                // Highlight the search term after content loads
                setTimeout(() => highlightText(searchTerm), 100);
                
                found = true;
                break;
            }
        } catch (error) {
            console.error(`Error searching in ${section}:`, error);
        }
    }

    if (!found) {
        alert(`"${searchTerm}"에 대한 검색 결과가 없습니다.`);
    }
}

// Add search functionality
document.addEventListener('DOMContentLoaded', async function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Load the default section (introduction) when page loads
    await loadMarkdownContent('introduction');

    // Event listeners for search
    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(searchInput.value.trim());
        }
    });
});

// Function to highlight search terms in the content
function highlightText(searchTerm) {
    if (!searchTerm) return;

    // Remove previous highlights
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentElement;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });

    // Find and highlight new matches in the content container
    const contentContainer = document.getElementById('content-container');
    highlightInElement(contentContainer, searchTerm);
}

// Helper function to highlight text in an element
function highlightInElement(element, searchTerm) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                return node.nodeValue.toLowerCase().includes(searchTerm.toLowerCase()) && 
                       !node.parentElement.classList.contains('highlight') ?
                    NodeFilter.FILTER_ACCEPT : 
                    NodeFilter.FILTER_REJECT;
            }
        }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    textNodes.forEach(textNode => {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = textNode.nodeValue.split(regex);
        
        if (parts.length > 1) {
            const fragment = document.createDocumentFragment();
            
            parts.forEach(part => {
                if (part.toLowerCase() === searchTerm.toLowerCase()) {
                    const highlightSpan = document.createElement('span');
                    highlightSpan.className = 'highlight';
                    highlightSpan.textContent = part;
                    fragment.appendChild(highlightSpan);
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            });
            
            textNode.parentNode.replaceChild(fragment, textNode);
        }
    });
}