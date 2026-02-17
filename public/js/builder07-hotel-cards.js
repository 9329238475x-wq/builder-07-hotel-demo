// ================================================================
// BUILDER 07 DYNAMIC HOTEL CARDS - Instagram Style
// ================================================================

class HotelCardsManager {
    constructor() {
        this.cards = [];
        this.viewerCounts = new Map();
        this.initialize();
    }

    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.loadRoomData();
        this.startLiveViewerUpdates();
        this.setupFilterListener();
    }

    async loadRoomData() {
        try {
            const response = await fetch('/api/room-types');
            if (response.ok) {
                this.cards = await response.json();
            } else {
                this.cards = this.getDefaultRooms();
            }
        } catch (error) {
            this.cards = this.getDefaultRooms();
        }

        this.renderCards();
    }

    getDefaultRooms() {
        return [
            {
                id: 1,
                name: 'Standard Room',
                description: 'Comfortable and affordable rooms perfect for budget-conscious travelers.',
                price: 3000,
                originalPrice: 4000,
                image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1000',
                amenities: ['WiFi', 'AC', 'TV', 'Attached Bath'],
                hasFlashDeal: false,
                verified: true
            },
            {
                id: 2,
                name: 'Deluxe Room',
                description: 'Spacious deluxe rooms with city views and premium furnishings.',
                price: 5000,
                originalPrice: 6500,
                image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1000',
                amenities: ['City View', 'Work Desk', 'WiFi', 'Breakfast'],
                hasFlashDeal: true,
                verified: true
            },
            {
                id: 3,
                name: 'Premium Suite',
                description: 'Elegant premium suites with panoramic views and luxury amenities.',
                price: 7000,
                originalPrice: 9000,
                image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000',
                amenities: ['Panoramic View', 'Living Area', 'Jacuzzi', 'Room Service'],
                hasFlashDeal: false,
                verified: true
            },
            {
                id: 4,
                name: 'Luxury Suite',
                description: 'Our finest luxury suites with exclusive concierge service.',
                price: 10000,
                originalPrice: 13000,
                image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000',
                amenities: ['Private Balcony', 'Butler Service', 'Airport Transfer', 'Kitchenette'],
                hasFlashDeal: true,
                verified: true
            },
            {
                id: 5,
                name: 'Executive Room',
                description: 'Perfect for business travelers with modern work facilities.',
                price: 6000,
                originalPrice: 7500,
                image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000',
                amenities: ['Work Desk', 'High-Speed WiFi', 'Coffee Machine', 'City View'],
                hasFlashDeal: false,
                verified: true
            },
            {
                id: 6,
                name: 'Family Suite',
                description: 'Spacious suite ideal for families with separate living area.',
                price: 8500,
                originalPrice: 11000,
                image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1000',
                amenities: ['2 Bedrooms', 'Kitchen', 'Living Room', 'Breakfast'],
                hasFlashDeal: false,
                verified: true
            }
        ];
    }

    renderCards() {
        const container = document.getElementById('hotel-cards-container');
        if (!container) return;

        container.innerHTML = this.cards.map((card, index) => this.createCardHTML(card, index)).join('');
        
        // Initialize viewer counts
        this.cards.forEach(card => {
            this.viewerCounts.set(card.id, this.getRandomViewerCount());
        });

        this.updateLiveViewers();
        this.attachCardEventListeners();
        this.animateCardsOnScroll();
    }

    createCardHTML(card, index) {
        const viewerCount = this.getRandomViewerCount();
        
        return `
            <div class="hotel-card animate-fade-in-up" data-room-id="${card.id}" data-room-type="${card.name.toLowerCase()}" style="opacity: 0; animation-delay: ${index * 0.1}s;">
                <div class="hotel-card-image">
                    <img src="${card.image}" alt="${card.name}" loading="lazy">
                    
                    ${card.verified ? `
                    <div class="verified-badge">
                        <i class="fas fa-shield-check"></i>
                        Builder 07 Verified
                    </div>
                    ` : ''}
                    
                    ${card.hasFlashDeal ? `
                    <div class="flash-deal">
                        ⚡ FLASH DEAL
                    </div>
                    ` : ''}
                    
                    <div class="live-viewers" data-room-id="${card.id}">
                        <span class="live-indicator"></span>
                        <span class="viewer-count">${viewerCount}</span> people viewing now
                    </div>
                </div>
                
                <div class="hotel-card-content">
                    <h3 class="hotel-card-title">${card.name}</h3>
                    <p class="hotel-card-description">${card.description}</p>
                    
                    <div class="hotel-amenities">
                        ${card.amenities.slice(0, 4).map(amenity => `
                            <span class="amenity-tag">
                                <i class="fas ${this.getAmenityIcon(amenity)}"></i>
                                ${amenity}
                            </span>
                        `).join('')}
                    </div>
                    
                    <div class="hotel-price-section">
                        <div class="price-wrapper">
                            <div class="original-price">₹${card.originalPrice.toLocaleString()}</div>
                            <div class="smart-deal-price">
                                <span class="price-currency">₹</span>${card.price.toLocaleString()}
                                <span class="price-night">/night</span>
                            </div>
                        </div>
                        <button class="card-book-btn book-now-btn" data-room-type="${card.name}">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getAmenityIcon(amenity) {
        const iconMap = {
            'WiFi': 'fa-wifi',
            'AC': 'fa-snowflake',
            'TV': 'fa-tv',
            'Attached Bath': 'fa-bath',
            'City View': 'fa-building',
            'Work Desk': 'fa-desk',
            'Breakfast': 'fa-coffee',
            'Panoramic View': 'fa-mountain',
            'Living Area': 'fa-couch',
            'Jacuzzi': 'fa-hot-tub',
            'Room Service': 'fa-concierge-bell',
            'Private Balcony': 'fa-tree',
            'Butler Service': 'fa-user-tie',
            'Airport Transfer': 'fa-car',
            'Kitchenette': 'fa-utensils',
            'High-Speed WiFi': 'fa-wifi',
            'Coffee Machine': 'fa-mug-hot',
            '2 Bedrooms': 'fa-bed',
            'Kitchen': 'fa-utensils',
            'Living Room': 'fa-couch'
        };
        return iconMap[amenity] || 'fa-check-circle';
    }

    getRandomViewerCount() {
        return Math.floor(Math.random() * 8) + 2; // 2-10 viewers
    }

    startLiveViewerUpdates() {
        // Update viewer counts every 8-15 seconds
        setInterval(() => {
            this.updateLiveViewers();
        }, Math.random() * 7000 + 8000);
    }

    updateLiveViewers() {
        this.cards.forEach(card => {
            const currentCount = this.viewerCounts.get(card.id);
            const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
            const newCount = Math.max(1, Math.min(15, currentCount + change));
            
            this.viewerCounts.set(card.id, newCount);
            
            const viewerElement = document.querySelector(`.live-viewers[data-room-id="${card.id}"] .viewer-count`);
            if (viewerElement) {
                // Animate the change
                viewerElement.style.transform = 'scale(1.2)';
                viewerElement.style.color = '#d4af37';
                
                setTimeout(() => {
                    viewerElement.textContent = newCount;
                    viewerElement.style.transform = 'scale(1)';
                    viewerElement.style.color = 'white';
                }, 200);
            }
        });
    }

    attachCardEventListeners() {
        // Add hover effects and analytics
        document.querySelectorAll('.hotel-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.trackCardView(card.dataset.roomId);
            });
        });
    }

    trackCardView(roomId) {
        // Analytics tracking (can be expanded)
        console.log(`Room ${roomId} viewed`);
    }

    animateCardsOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.hotel-card').forEach(card => {
            observer.observe(card);
        });
    }

    setupFilterListener() {
        document.addEventListener('filter-rooms', (e) => {
            const filter = e.detail.filter;
            this.filterCards(filter);
        });
    }

    filterCards(filter) {
        const cards = document.querySelectorAll('.hotel-card');
        
        cards.forEach(card => {
            const roomType = card.dataset.roomType;
            let shouldShow = false;

            switch(filter) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'luxury':
                    shouldShow = roomType.includes('luxury');
                    break;
                case 'deluxe':
                    shouldShow = roomType.includes('deluxe');
                    break;
                case 'premium':
                    shouldShow = roomType.includes('premium');
                    break;
                case 'standard':
                    shouldShow = roomType.includes('standard');
                    break;
                default:
                    shouldShow = true;
            }

            if (shouldShow) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }
}

// Initialize Hotel Cards Manager
const hotelCardsManager = new HotelCardsManager();
