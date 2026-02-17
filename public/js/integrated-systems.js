/**
 * 🔥 BUILDER 07 INTEGRATED SYSTEMS
 * All AI systems working together with the main booking engine
 */

// Track booking for analytics and automation
function trackBookingEvent(bookingData) {
    console.log('📊 Tracking booking event:', bookingData);
    
    // 1. Trigger WhatsApp Automation
    if (typeof WhatsAppAutomation !== 'undefined') {
        const whatsapp = new WhatsAppAutomation();
        whatsapp.sendWelcomeMessage(bookingData);
    }
    
    // 2. Update Predictive Analytics
    if (typeof PredictiveAnalytics !== 'undefined') {
        const analytics = new PredictiveAnalytics();
        analytics.recordBooking(bookingData);
    }
    
    // 3. Check Loyalty Program
    if (typeof LoyaltyProgram !== 'undefined') {
        const loyalty = new LoyaltyProgram();
        loyalty.processBooking(bookingData);
    }
    
    // 4. Trigger Marketing Automation
    if (typeof MarketingAutomation !== 'undefined') {
        const marketing = new MarketingAutomation();
        marketing.sendWelcomeEmail(bookingData);
    }
}

// Show dynamic pricing badge in booking modal
function showDynamicPricingBadge(priceData) {
    const sidebar = document.getElementById('bookingModalSidebar');
    if (!sidebar) return;
    
    const existingBadge = sidebar.querySelector('.dynamic-pricing-badge');
    if (existingBadge) existingBadge.remove();
    
    const badge = document.createElement('div');
    badge.className = 'dynamic-pricing-badge';
    badge.innerHTML = `
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;
                    border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <i class="fas fa-bolt" style="color: #fbbf24;"></i>
                <span style="color: white; font-weight: bold; font-size: 0.875rem;">
                    Smart Pricing Active
                </span>
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.75rem;">
                ${priceData.reason}
            </div>
            ${priceData.discount > 0 ? `
                <div style="color: #fbbf24; font-size: 0.75rem; margin-top: 0.25rem; font-weight: bold;">
                    💰 Saving: ₹${priceData.discount}
                </div>
            ` : ''}
        </div>
    `;
    
    const priceBreakdown = sidebar.querySelector('.space-y-2');
    if (priceBreakdown) {
        priceBreakdown.parentNode.insertBefore(badge, priceBreakdown);
    }
}

// Initialize all integrations
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Builder 07 Integrated Systems Loading...');
    
    // Load all AI system scripts
    const systems = [
        '/js/ai-dynamic-pricing.js',
        '/js/whatsapp-automation.js',
        '/js/ai-upselling-engine.js',
        '/js/loyalty-program.js',
        '/js/predictive-analytics.js',
        '/js/marketing-automation.js'
    ];
    
    systems.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
    });
    
    console.log('✅ All AI systems initialized');
});
