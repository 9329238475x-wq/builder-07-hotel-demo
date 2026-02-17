// ================================================================
// BUILDER 07 SMART SEARCH - Google Style Real-time Filtering
// ================================================================

class SmartSearch {
    constructor() {
        this.searchInput = null;
        this.suggestionsContainer = null;
        this.allRooms = [];
        this.initialize();
    }

    initialize() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.searchInput = document.getElementById('smart-search-input');
        this.suggestionsContainer = document.getElementById('search-suggestions');
        
        if (!this.searchInput || !this.suggestionsContainer) {
            console.warn('Smart search elements not found');
            return;
        }

        // Load room data
        this.loadRoomData();

        // Event listeners
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchInput.addEventListener('focus', () => this.showRecentSearches());
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.smart-search-container')) {
                this.hideSuggestions();
            }
        });
    }

    async loadRoomData() {
        try {
            // Fetch room types from the server
            const response = await fetch('/api/room-types');
            if (response.ok) {
                this.allRooms = await response.json();
            } else {
                // Fallback to predefined data
                this.allRooms = this.getDefaultRooms();
            }
        } catch (error) {
            console.warn('Using default room data');
            this.allRooms = this.getDefaultRooms();
        }
    }

    getDefaultRooms() {
        return [
            {
                name: 'Standard Room',
                price: 3000,
                amenities: ['WiFi', 'AC', 'TV'],
                location: 'Ground Floor',
                distance: '5 mins from Airport'
            },
            {
                name: 'Deluxe Room',
                price: 5000,
                amenities: ['City View', 'WiFi', 'Breakfast'],
                location: 'Second Floor',
                distance: '5 mins from Airport'
            },
            {
                name: 'Premium Suite',
                price: 7000,
                amenities: ['Panoramic View', 'Jacuzzi', 'Living Area'],
                location: 'Third Floor',
                distance: '5 mins from Airport'
            },
            {
                name: 'Luxury Suite',
                price: 10000,
                amenities: ['Private Balcony', 'Butler Service', 'Airport Transfer'],
                location: 'Top Floor',
                distance: '5 mins from Airport'
            }
        ];
    }

    handleSearch(query) {
        query = query.trim().toLowerCase();

        if (query.length === 0) {
            this.showRecentSearches();
            return;
        }

        const suggestions = this.generateSuggestions(query);
        this.renderSuggestions(suggestions);
    }

    generateSuggestions(query) {
        const suggestions = [];

        // Quick suggestions based on keywords
        if (query.includes('air') || query.includes('port')) {
            suggestions.push({
                icon: 'fa-plane-arrival',
                title: 'Luxury Hotels near Airport (5 mins away)',
                subtitle: 'All our rooms are airport-adjacent',
                action: 'filter',
                filter: 'all'
            });
        }

        if (query.includes('lux') || query.includes('suite')) {
            suggestions.push({
                icon: 'fa-crown',
                title: 'Luxury Suites with Butler Service',
                subtitle: '₹10,000/night • Top Floor',
                action: 'filter',
                filter: 'luxury'
            });
        }

        if (query.includes('cheap') || query.includes('budget') || query.includes('standard')) {
            suggestions.push({
                icon: 'fa-wallet',
                title: 'Budget-Friendly Standard Rooms',
                subtitle: '₹3,000/night • Ground Floor',
                action: 'filter',
                filter: 'standard'
            });
        }

        if (query.includes('del') || query.includes('deluxe')) {
            suggestions.push({
                icon: 'fa-hotel',
                title: 'Deluxe Rooms with City View',
                subtitle: '₹5,000/night • Second Floor',
                action: 'filter',
                filter: 'deluxe'
            });
        }

        if (query.includes('prem')) {
            suggestions.push({
                icon: 'fa-gem',
                title: 'Premium Suites with Jacuzzi',
                subtitle: '₹7,000/night • Third Floor',
                action: 'filter',
                filter: 'premium'
            });
        }

        // Filter rooms by name or amenities
        this.allRooms.forEach(room => {
            if (room.name.toLowerCase().includes(query)) {
                suggestions.push({
                    icon: 'fa-bed',
                    title: room.name,
                    subtitle: `₹${room.price.toLocaleString()}/night • ${room.distance}`,
                    action: 'select',
                    data: room
                });
            }
        });

        // Default suggestions if nothing matches
        if (suggestions.length === 0) {
            suggestions.push({
                icon: 'fa-search',
                title: 'Search all available rooms',
                subtitle: 'Browse our complete collection',
                action: 'view-all'
            });
        }

        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    renderSuggestions(suggestions) {
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-action="${suggestion.action}" data-filter="${suggestion.filter || ''}">
                <div class="suggestion-icon">
                    <i class="fas ${suggestion.icon}"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-subtitle">${suggestion.subtitle}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => this.handleSuggestionClick(suggestions[index]));
        });

        this.showSuggestions();
    }

    showRecentSearches() {
        const recentSuggestions = [
            {
                icon: 'fa-clock',
                title: 'Recent: Luxury Suite',
                subtitle: 'Searched 2 hours ago',
                action: 'filter',
                filter: 'luxury'
            },
            {
                icon: 'fa-fire',
                title: 'Popular: Near Airport Hotels',
                subtitle: 'Trending this week',
                action: 'filter',
                filter: 'all'
            },
            {
                icon: 'fa-tag',
                title: 'Flash Deal: Deluxe Room',
                subtitle: '20% off today only',
                action: 'filter',
                filter: 'deluxe'
            }
        ];

        this.renderSuggestions(recentSuggestions);
    }

    handleSuggestionClick(suggestion) {
        switch (suggestion.action) {
            case 'filter':
                this.filterRooms(suggestion.filter);
                break;
            case 'select':
                this.selectRoom(suggestion.data);
                break;
            case 'view-all':
                window.location.href = '/rooms';
                break;
        }
        this.hideSuggestions();
    }

    filterRooms(filter) {
        // Scroll to rooms section
        const roomsSection = document.getElementById('hotel-cards-section');
        if (roomsSection) {
            roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Trigger filter event
        setTimeout(() => {
            const event = new CustomEvent('filter-rooms', { detail: { filter } });
            document.dispatchEvent(event);
        }, 500);
    }

    selectRoom(room) {
        // Redirect to rooms page or open booking modal
        window.location.href = `/rooms?room=${encodeURIComponent(room.name)}`;
    }

    showSuggestions() {
        this.suggestionsContainer.classList.add('active');
    }

    hideSuggestions() {
        this.suggestionsContainer.classList.remove('active');
    }
}

// Initialize Smart Search
const smartSearch = new SmartSearch();
