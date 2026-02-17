// ================================================================
// BUILDER 07 AI CONCIERGE - Floating Assistant
// ================================================================

class AIConcierge {
    constructor() {
        this.chatModal = null;
        this.fabButton = null;
        this.isOpen = false;
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
        this.createConciergeElements();
        this.attachEventListeners();
    }

    createConciergeElements() {
        // Create FAB Button
        const fabHTML = `
            <div class="ai-concierge-fab">
                <div class="ai-fab-tooltip">Ask AI Concierge</div>
                <div class="ai-fab-button">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
        `;

        // Create Chat Modal
        const modalHTML = `
            <div class="ai-chat-modal">
                <div class="ai-chat-header">
                    <div class="ai-chat-title">
                        <i class="fas fa-robot"></i>
                        AI Concierge
                    </div>
                    <button class="ai-chat-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="ai-chat-body">
                    <div class="ai-welcome-message">
                        <p><strong>नमस्ते! 👋</strong></p>
                        <p>मैं आपका AI Concierge हूं। मैं आपकी कैसे मदद कर सकता हूं?</p>
                    </div>
                    <div class="ai-quick-actions">
                        <button class="ai-quick-btn" data-action="early-checkin">
                            <i class="fas fa-clock"></i>
                            <span>Early Check-in चाहिए?</span>
                        </button>
                        <button class="ai-quick-btn" data-action="late-flight">
                            <i class="fas fa-plane"></i>
                            <span>Flight Late है? Late Check-out करें</span>
                        </button>
                        <button class="ai-quick-btn" data-action="airport-pickup">
                            <i class="fas fa-car"></i>
                            <span>Free Airport Pickup Book करें</span>
                        </button>
                        <button class="ai-quick-btn" data-action="room-upgrade">
                            <i class="fas fa-arrow-up"></i>
                            <span>Room Upgrade के बारे में जानें</span>
                        </button>
                        <button class="ai-quick-btn" data-action="special-request">
                            <i class="fas fa-star"></i>
                            <span>Special Request करें</span>
                        </button>
                        <button class="ai-quick-btn" data-action="whatsapp">
                            <i class="fab fa-whatsapp"></i>
                            <span>WhatsApp पर बात करें</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insert into DOM
        document.body.insertAdjacentHTML('beforeend', fabHTML);
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.fabButton = document.querySelector('.ai-fab-button');
        this.chatModal = document.querySelector('.ai-chat-modal');
    }

    attachEventListeners() {
        // FAB Button Click
        this.fabButton.addEventListener('click', () => this.toggleChat());

        // Close Button
        const closeBtn = document.querySelector('.ai-chat-close');
        closeBtn.addEventListener('click', () => this.closeChat());

        // Quick Action Buttons
        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !e.target.closest('.ai-chat-modal') && !e.target.closest('.ai-fab-button')) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.chatModal.classList.add('active');
        this.isOpen = true;
        
        // Track analytics
        this.trackEvent('ai_concierge_opened');
    }

    closeChat() {
        this.chatModal.classList.remove('active');
        this.isOpen = false;
    }

    handleQuickAction(action) {
        switch(action) {
            case 'early-checkin':
                this.showResponse('Early Check-in', 
                    'बिल्कुल! हम आपके लिए early check-in arrange कर देंगे। कृपया WhatsApp पर अपनी arrival time बताएं।',
                    () => this.openWhatsApp('Hi, I need early check-in for my booking.'));
                break;

            case 'late-flight':
                this.showResponse('Late Check-out', 
                    'कोई बात नहीं! हम आपके लिए late check-out की व्यवस्था कर देंगे। WhatsApp पर confirm करें।',
                    () => this.openWhatsApp('My flight is late. Can I get late check-out?'));
                break;

            case 'airport-pickup':
                this.showResponse('Free Airport Pickup', 
                    'Great! हमारी complimentary airport pickup service available है। Details WhatsApp पर share करें।',
                    () => this.openWhatsApp('I want to book free airport pickup.'));
                break;

            case 'room-upgrade':
                this.showResponse('Room Upgrade', 
                    'हमारे Deluxe और Luxury Suites available हैं special rates पर। WhatsApp पर check करें!',
                    () => this.openWhatsApp('I want to know about room upgrade options.'));
                break;

            case 'special-request':
                this.showResponse('Special Request', 
                    'हम आपकी हर जरूरत का ध्यान रखेंगे। अपनी special request WhatsApp पर बताएं।',
                    () => this.openWhatsApp('I have a special request for my stay.'));
                break;

            case 'whatsapp':
                this.openWhatsApp('Hi, I need assistance with my booking.');
                break;
        }
    }

    showResponse(title, message, action) {
        const chatBody = document.querySelector('.ai-chat-body');
        
        const responseHTML = `
            <div class="ai-response" style="margin-top: 16px; padding: 16px; background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 16px; color: white; font-size: 14px; line-height: 1.6;">
                <strong style="color: #d4af37; display: block; margin-bottom: 8px;">${title}</strong>
                <p style="margin: 0 0 12px 0;">${message}</p>
                <button onclick="this.closest('.ai-response').nextElementSibling.click()" style="background: linear-gradient(135deg, #d4af37, #b8941f); color: #0f172a; padding: 10px 20px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; font-size: 12px; text-transform: uppercase;">
                    WhatsApp पर Continue करें →
                </button>
            </div>
        `;
        
        chatBody.insertAdjacentHTML('beforeend', responseHTML);
        
        // Hidden action button
        const actionBtn = document.createElement('button');
        actionBtn.style.display = 'none';
        actionBtn.onclick = action;
        chatBody.appendChild(actionBtn);
        
        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    openWhatsApp(message) {
        const phoneNumber = '919999999999'; // Replace with actual number
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
        
        this.trackEvent('whatsapp_opened', { context: message });
    }

    trackEvent(eventName, data = {}) {
        console.log('AI Concierge Event:', eventName, data);
        // Add Google Analytics or other tracking here
    }
}

// Initialize AI Concierge
const aiConcierge = new AIConcierge();
