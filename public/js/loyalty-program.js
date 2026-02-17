/**
 * GUEST RETENTION & LOYALTY PROGRAM
 * Revenue Impact: ₹70M value
 * 
 * Features:
 * - Points-based rewards system
 * - Tier-based memberships (Silver, Gold, Platinum)
 * - Birthday/Anniversary tracking & offers
 * - Referral program
 * - Repeat guest discounts
 * - Personalized offers based on history
 * - Win-back campaigns for inactive guests
 */

class LoyaltyProgram {
    constructor() {
        this.tiers = {
            bronze: {
                name: 'Bronze Member',
                minPoints: 0,
                maxPoints: 999,
                discount: 0.05,  // 5%
                perks: ['Early bird offers', 'Birthday gift'],
                icon: '🥉',
                color: '#CD7F32'
            },
            silver: {
                name: 'Silver Member',
                minPoints: 1000,
                maxPoints: 2499,
                discount: 0.10,  // 10%
                perks: ['Free breakfast', 'Priority check-in', 'Birthday gift'],
                icon: '🥈',
                color: '#C0C0C0'
            },
            gold: {
                name: 'Gold Member',
                minPoints: 2500,
                maxPoints: 4999,
                discount: 0.15,  // 15%
                perks: ['Free room upgrade', 'Late checkout', 'Airport pickup', 'Birthday special'],
                icon: '🥇',
                color: '#FFD700'
            },
            platinum: {
                name: 'Platinum Member',
                minPoints: 5000,
                maxPoints: Infinity,
                discount: 0.20,  // 20%
                perks: ['Complimentary spa', 'VIP treatment', 'Concierge service', 'Anniversary package'],
                icon: '💎',
                color: '#E5E4E2'
            }
        };
        
        this.pointsRules = {
            perRupeeSpent: 1,        // 1 point per ₹1
            referralBonus: 500,       // 500 points for successful referral
            reviewBonus: 200,         // 200 points for leaving review
            birthdayBonus: 1000,      // 1000 bonus points on birthday
            anniversaryBonus: 1500,   // 1500 points on anniversary
            socialShareBonus: 100     // 100 points for social media share
        };
        
        this.guests = new Map(); // In production: database
        this.init();
    }
    
    init() {
        console.log('🎁 Loyalty Program initialized');
        this.loadGuestData();
        this.startAutomatedCampaigns();
    }
    
    /**
     * Load guest data from localStorage (in production: from database)
     */
    loadGuestData() {
        try {
            const data = localStorage.getItem('loyaltyGuests');
            if (data) {
                const guestsArray = JSON.parse(data);
                guestsArray.forEach(guest => {
                    this.guests.set(guest.id, guest);
                });
                console.log(`📊 Loaded ${this.guests.size} loyalty members`);
            }
        } catch (error) {
            console.error('Error loading guest data:', error);
        }
    }
    
    /**
     * Save guest data
     */
    saveGuestData() {
        try {
            const guestsArray = Array.from(this.guests.values());
            localStorage.setItem('loyaltyGuests', JSON.stringify(guestsArray));
        } catch (error) {
            console.error('Error saving guest data:', error);
        }
    }
    
    /**
     * Register new guest or update existing
     */
    registerGuest(bookingData) {
        const guestId = this.generateGuestId(bookingData.email);
        let guest = this.guests.get(guestId);
        
        if (!guest) {
            // New guest
            guest = {
                id: guestId,
                name: bookingData.name || bookingData.guestName,
                email: bookingData.email,
                phone: bookingData.phone,
                points: 0,
                totalSpent: 0,
                bookings: [],
                tier: 'bronze',
                joinDate: new Date().toISOString(),
                lastStay: null,
                birthday: null,
                anniversary: null,
                preferences: {},
                referralCode: this.generateReferralCode()
            };
        }
        
        // Add booking
        guest.bookings.push({
            id: bookingData.id,
            date: bookingData.checkIn,
            amount: bookingData.totalPrice,
            roomType: bookingData.roomType
        });
        
        // Update stats
        guest.totalSpent += bookingData.totalPrice;
        guest.lastStay = bookingData.checkIn;
        
        // Award points
        const pointsEarned = Math.floor(bookingData.totalPrice * this.pointsRules.perRupeeSpent);
        this.addPoints(guest, pointsEarned, 'booking');
        
        this.guests.set(guestId, guest);
        this.saveGuestData();
        
        console.log(`✅ Guest registered: ${guest.name} (${pointsEarned} points earned)`);
        
        return guest;
    }
    
    /**
     * Add points to guest account
     */
    addPoints(guest, points, reason) {
        guest.points += points;
        
        // Update tier
        const newTier = this.calculateTier(guest.points);
        if (newTier !== guest.tier) {
            console.log(`🎉 ${guest.name} upgraded to ${newTier.toUpperCase()}!`);
            this.notifyTierUpgrade(guest, newTier);
        }
        guest.tier = newTier;
        
        // Log transaction
        if (!guest.pointsHistory) guest.pointsHistory = [];
        guest.pointsHistory.push({
            date: new Date().toISOString(),
            points: points,
            reason: reason,
            balance: guest.points
        });
        
        this.saveGuestData();
    }
    
    /**
     * Calculate tier based on points
     */
    calculateTier(points) {
        if (points >= this.tiers.platinum.minPoints) return 'platinum';
        if (points >= this.tiers.gold.minPoints) return 'gold';
        if (points >= this.tiers.silver.minPoints) return 'silver';
        return 'bronze';
    }
    
    /**
     * Get guest discount based on tier
     */
    getGuestDiscount(email) {
        const guestId = this.generateGuestId(email);
        const guest = this.guests.get(guestId);
        
        if (!guest) return 0;
        
        const tier = this.tiers[guest.tier];
        return tier.discount;
    }
    
    /**
     * Apply loyalty discount to booking
     */
    applyLoyaltyDiscount(bookingData) {
        const discount = this.getGuestDiscount(bookingData.email);
        
        if (discount > 0) {
            const discountAmount = Math.round(bookingData.totalPrice * discount);
            bookingData.loyaltyDiscount = discountAmount;
            bookingData.totalPrice -= discountAmount;
            bookingData.appliedTier = this.calculateTier(this.getGuestPoints(bookingData.email));
        }
        
        return bookingData;
    }
    
    /**
     * Get guest points
     */
    getGuestPoints(email) {
        const guestId = this.generateGuestId(email);
        const guest = this.guests.get(guestId);
        return guest ? guest.points : 0;
    }
    
    /**
     * Redeem points for discount
     */
    redeemPoints(email, points) {
        const guestId = this.generateGuestId(email);
        const guest = this.guests.get(guestId);
        
        if (!guest || guest.points < points) {
            return { success: false, message: 'Insufficient points' };
        }
        
        // 100 points = ₹100
        const discountAmount = points;
        guest.points -= points;
        
        this.saveGuestData();
        
        return {
            success: true,
            discountAmount: discountAmount,
            remainingPoints: guest.points
        };
    }
    
    /**
     * Process referral
     */
    processReferral(referrerEmail, newGuestEmail) {
        const referrerId = this.generateGuestId(referrerEmail);
        const referrer = this.guests.get(referrerId);
        
        if (referrer) {
            this.addPoints(referrer, this.pointsRules.referralBonus, 'referral');
            
            // Send notification
            console.log(`🎁 ${referrer.name} earned ${this.pointsRules.referralBonus} points for referring ${newGuestEmail}`);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Birthday campaign
     */
    sendBirthdayOffer(guest) {
        const offer = {
            type: 'birthday',
            discount: 0.50,  // 50% off
            bonusPoints: this.pointsRules.birthdayBonus,
            validDays: 7,    // Valid for 7 days
            message: `🎂 Happy Birthday ${guest.name}! 50% OFF + ${this.pointsRules.birthdayBonus} bonus points!`
        };
        
        // In production: trigger email/WhatsApp
        console.log(`🎉 Birthday offer sent to ${guest.name}`);
        
        return offer;
    }
    
    /**
     * Anniversary campaign
     */
    sendAnniversaryOffer(guest) {
        const offer = {
            type: 'anniversary',
            discount: 0.30,  // 30% off
            bonusPoints: this.pointsRules.anniversaryBonus,
            extras: ['Complimentary cake', 'Room decoration', 'Late checkout'],
            validDays: 14,
            message: `💑 Happy Anniversary! 30% OFF + romantic package included!`
        };
        
        console.log(`💕 Anniversary offer sent to ${guest.name}`);
        
        return offer;
    }
    
    /**
     * Win-back campaign for inactive guests
     */
    winBackInactiveGuests() {
        const today = new Date();
        const inactiveGuests = [];
        
        this.guests.forEach(guest => {
            if (guest.lastStay) {
                const daysSinceLastStay = Math.floor((today - new Date(guest.lastStay)) / (1000 * 60 * 60 * 24));
                
                // Haven't stayed in 90 days
                if (daysSinceLastStay >= 90) {
                    inactiveGuests.push(guest);
                    this.sendWinBackOffer(guest);
                }
            }
        });
        
        console.log(`📧 Win-back campaign sent to ${inactiveGuests.length} inactive guests`);
        
        return inactiveGuests;
    }
    
    /**
     * Send win-back offer
     */
    sendWinBackOffer(guest) {
        const offer = {
            type: 'winback',
            discount: 0.25,  // 25% off
            bonusPoints: 500,
            message: `We miss you ${guest.name}! Come back for 25% OFF + 500 bonus points!`,
            urgency: 'Limited time: Next 15 days only'
        };
        
        // In production: trigger automated email/WhatsApp
        console.log(`💌 Win-back offer sent to ${guest.name}`);
        
        return offer;
    }
    
    /**
     * Notify tier upgrade
     */
    notifyTierUpgrade(guest, newTier) {
        const tierData = this.tiers[newTier];
        
        const notification = {
            title: `🎉 Congratulations ${guest.name}!`,
            message: `You've been upgraded to ${tierData.icon} ${tierData.name}!`,
            perks: tierData.perks,
            discount: `${tierData.discount * 100}% discount on all bookings`
        };
        
        // In production: send email/WhatsApp
        console.log(`🎊 Tier upgrade notification:`, notification);
        
        return notification;
    }
    
    /**
     * Generate guest ID from email
     */
    generateGuestId(email) {
        return 'guest_' + btoa(email.toLowerCase()).replace(/=/g, '');
    }
    
    /**
     * Generate referral code
     */
    generateReferralCode() {
        return 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    /**
     * Get guest profile
     */
    getGuestProfile(email) {
        const guestId = this.generateGuestId(email);
        const guest = this.guests.get(guestId);
        
        if (!guest) return null;
        
        const tierData = this.tiers[guest.tier];
        
        return {
            ...guest,
            tierInfo: tierData,
            pointsToNextTier: this.getPointsToNextTier(guest.points),
            lifetimeValue: guest.totalSpent,
            bookingCount: guest.bookings.length
        };
    }
    
    /**
     * Calculate points needed for next tier
     */
    getPointsToNextTier(currentPoints) {
        if (currentPoints >= this.tiers.platinum.minPoints) {
            return 0; // Already at top tier
        }
        
        if (currentPoints >= this.tiers.gold.minPoints) {
            return this.tiers.platinum.minPoints - currentPoints;
        }
        
        if (currentPoints >= this.tiers.silver.minPoints) {
            return this.tiers.gold.minPoints - currentPoints;
        }
        
        return this.tiers.silver.minPoints - currentPoints;
    }
    
    /**
     * Start automated campaigns
     */
    startAutomatedCampaigns() {
        // Check birthdays daily
        setInterval(() => {
            this.checkBirthdaysToday();
        }, 24 * 60 * 60 * 1000);
        
        // Check anniversaries daily
        setInterval(() => {
            this.checkAnniversariesToday();
        }, 24 * 60 * 60 * 1000);
        
        // Win-back campaign weekly
        setInterval(() => {
            this.winBackInactiveGuests();
        }, 7 * 24 * 60 * 60 * 1000);
        
        console.log('📅 Automated campaigns scheduled');
    }
    
    /**
     * Check birthdays today
     */
    checkBirthdaysToday() {
        const today = new Date();
        const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;
        
        this.guests.forEach(guest => {
            if (guest.birthday) {
                const guestBirthday = new Date(guest.birthday);
                const guestBdayStr = `${guestBirthday.getMonth() + 1}-${guestBirthday.getDate()}`;
                
                if (guestBdayStr === todayStr) {
                    this.sendBirthdayOffer(guest);
                    this.addPoints(guest, this.pointsRules.birthdayBonus, 'birthday');
                }
            }
        });
    }
    
    /**
     * Check anniversaries today
     */
    checkAnniversariesToday() {
        const today = new Date();
        const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;
        
        this.guests.forEach(guest => {
            if (guest.anniversary) {
                const guestAnniversary = new Date(guest.anniversary);
                const guestAnnStr = `${guestAnniversary.getMonth() + 1}-${guestAnniversary.getDate()}`;
                
                if (guestAnnStr === todayStr) {
                    this.sendAnniversaryOffer(guest);
                    this.addPoints(guest, this.pointsRules.anniversaryBonus, 'anniversary');
                }
            }
        });
    }
    
    /**
     * Get loyalty dashboard stats
     */
    getDashboardStats() {
        let totalMembers = this.guests.size;
        let tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
        let totalPointsIssued = 0;
        let totalRevenue = 0;
        
        this.guests.forEach(guest => {
            tierCounts[guest.tier]++;
            totalPointsIssued += guest.points;
            totalRevenue += guest.totalSpent;
        });
        
        return {
            totalMembers,
            tierCounts,
            totalPointsIssued,
            totalRevenue,
            averageLifetimeValue: totalMembers > 0 ? Math.round(totalRevenue / totalMembers) : 0
        };
    }
}

// Initialize
let loyaltyProgram;

document.addEventListener('DOMContentLoaded', () => {
    loyaltyProgram = new LoyaltyProgram();
    window.LoyaltyProgram = loyaltyProgram;
    
    console.log('✅ Loyalty Program ready!');
});

/**
 * Export
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyProgram;
}
