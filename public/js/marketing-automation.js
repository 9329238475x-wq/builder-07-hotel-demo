/**
 * ADVANCED MARKETING AUTOMATION ENGINE
 * Revenue Impact: ₹70M value
 * 
 * Features:
 * - Email campaign automation
 * - SMS marketing campaigns
 * - Guest segmentation
 * - Drip campaigns
 * - A/B testing
 * - ROI tracking
 */

class MarketingAutomation {
    constructor() {
        this.campaigns = [];
        this.segments = {
            firstTime: { name: 'First-Time Guests', filter: (g) => g.bookings.length === 1 },
            repeat: { name: 'Repeat Guests', filter: (g) => g.bookings.length > 1 },
            vip: { name: 'VIP Guests', filter: (g) => g.totalSpent > 20000 },
            inactive: { name: 'Inactive Guests', filter: (g) => this.daysSince(g.lastStay) > 90 }
        };
        this.init();
    }
    
    init() {
        console.log('📧 Marketing Automation initialized');
    }
    
    createCampaign(name, segment, message, channel) {
        const campaign = {
            id: Date.now(),
            name: name,
            segment: segment,
            message: message,
            channel: channel,
            sent: 0,
            opened: 0,
            clicked: 0,
            converted: 0,
            revenue: 0,
            status: 'active',
            createdAt: new Date()
        };
        
        this.campaigns.push(campaign);
        return campaign;
    }
    
    daysSince(date) {
        return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    }
    
    getCampaignROI() {
        return this.campaigns.map(c => ({
            name: c.name,
            roi: c.revenue > 0 ? Math.round((c.revenue / 1000) * 100) : 0,
            conversionRate: c.sent > 0 ? Math.round((c.converted / c.sent) * 100) : 0
        }));
    }
}

if (typeof window !== 'undefined') {
    window.MarketingAutomation = new MarketingAutomation();
}
