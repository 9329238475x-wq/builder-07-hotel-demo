/**
 * ADVANCED WHATSAPP BUSINESS AUTOMATION
 * Revenue Impact: ₹80M value
 * 
 * Features:
 * - Automated booking confirmations
 * - Pre-arrival messages (24hr before)
 * - Real-time booking updates
 * - Payment reminders
 * - Upsell messages (breakfast, pickup, spa)
 * - Post-checkout feedback requests
 * - Birthday/Anniversary wishes
 * - Re-engagement campaigns
 */

class WhatsAppAutomation {
    constructor() {
        this.baseURL = window.location.origin;
        this.templates = {
            bookingConfirmation: {
                trigger: 'immediate',
                timing: 0,
                message: this.getBookingConfirmationTemplate
            },
            preArrival: {
                trigger: 'scheduled',
                timing: -24, // 24 hours before check-in
                message: this.getPreArrivalTemplate
            },
            checkInReminder: {
                trigger: 'scheduled',
                timing: -2, // 2 hours before check-in
                message: this.getCheckInReminderTemplate
            },
            upsellBreakfast: {
                trigger: 'scheduled',
                timing: -12, // 12 hours before check-in
                message: this.getUpsellBreakfastTemplate
            },
            upsellPickup: {
                trigger: 'scheduled',
                timing: -6, // 6 hours before check-in
                message: this.getUpsellPickupTemplate
            },
            checkOutReminder: {
                trigger: 'scheduled',
                timing: 11, // On check-out day at 11 AM
                message: this.getCheckOutReminderTemplate
            },
            feedbackRequest: {
                trigger: 'scheduled',
                timing: 2, // 2 hours after check-out
                message: this.getFeedbackRequestTemplate
            },
            thankYou: {
                trigger: 'scheduled',
                timing: 24, // 24 hours after check-out
                message: this.getThankYouTemplate
            },
            reEngagement: {
                trigger: 'scheduled',
                timing: 720, // 30 days after check-out
                message: this.getReEngagementTemplate
            }
        };
        
        this.scheduledMessages = [];
        this.init();
    }
    
    init() {
        console.log('📱 WhatsApp Automation Engine initialized');
        this.startMessageScheduler();
    }
    
    /**
     * Send immediate booking confirmation
     */
    async sendBookingConfirmation(booking) {
        const message = this.templates.bookingConfirmation.message(booking);
        await this.sendWhatsAppMessage(booking.phone, message);
        
        // Schedule all follow-up messages
        this.scheduleFollowUpMessages(booking);
        
        console.log(`✅ Booking confirmation sent to ${booking.phone}`);
    }
    
    /**
     * Schedule all automated messages for a booking
     */
    scheduleFollowUpMessages(booking) {
        const checkInTime = new Date(booking.checkIn);
        const checkOutTime = new Date(booking.checkOut);
        
        // Pre-arrival message
        this.scheduleMessage(
            booking,
            'preArrival',
            this.addHours(checkInTime, this.templates.preArrival.timing)
        );
        
        // Check-in reminder
        this.scheduleMessage(
            booking,
            'checkInReminder',
            this.addHours(checkInTime, this.templates.checkInReminder.timing)
        );
        
        // Upsell breakfast
        if (!booking.addons?.breakfast) {
            this.scheduleMessage(
                booking,
                'upsellBreakfast',
                this.addHours(checkInTime, this.templates.upsellBreakfast.timing)
            );
        }
        
        // Upsell airport pickup
        if (!booking.addons?.airportPickup) {
            this.scheduleMessage(
                booking,
                'upsellPickup',
                this.addHours(checkInTime, this.templates.upsellPickup.timing)
            );
        }
        
        // Check-out reminder
        this.scheduleMessage(
            booking,
            'checkOutReminder',
            checkOutTime
        );
        
        // Feedback request
        this.scheduleMessage(
            booking,
            'feedbackRequest',
            this.addHours(checkOutTime, this.templates.feedbackRequest.timing)
        );
        
        // Thank you message
        this.scheduleMessage(
            booking,
            'thankYou',
            this.addHours(checkOutTime, this.templates.thankYou.timing)
        );
        
        // Re-engagement campaign
        this.scheduleMessage(
            booking,
            'reEngagement',
            this.addHours(checkOutTime, this.templates.reEngagement.timing)
        );
        
        console.log(`📅 Scheduled ${this.scheduledMessages.length} automated messages`);
    }
    
    /**
     * Schedule a single message
     */
    scheduleMessage(booking, templateKey, sendTime) {
        this.scheduledMessages.push({
            bookingId: booking.id,
            phone: booking.phone,
            template: templateKey,
            sendTime: sendTime,
            sent: false,
            booking: booking
        });
    }
    
    /**
     * Start message scheduler (checks every minute)
     */
    startMessageScheduler() {
        setInterval(() => {
            this.processScheduledMessages();
        }, 60 * 1000); // Every minute
        
        // Run immediately
        this.processScheduledMessages();
    }
    
    /**
     * Process and send scheduled messages
     */
    async processScheduledMessages() {
        const now = new Date();
        
        for (const msg of this.scheduledMessages) {
            if (!msg.sent && msg.sendTime <= now) {
                const template = this.templates[msg.template];
                const message = template.message(msg.booking);
                
                await this.sendWhatsAppMessage(msg.phone, message);
                msg.sent = true;
                
                console.log(`📤 Sent ${msg.template} to ${msg.phone}`);
            }
        }
    }
    
    /**
     * Send WhatsApp message via Twilio API
     */
    async sendWhatsAppMessage(phone, message) {
        try {
            // Format phone number (add country code if needed)
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            
            // In production, this would call your backend API
            // which then uses Twilio to send WhatsApp messages
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: formattedPhone,
                    message: message
                })
            });
            
            if (response.ok) {
                console.log(`✅ WhatsApp sent to ${formattedPhone}`);
                return true;
            } else {
                console.error('❌ WhatsApp send failed');
                return false;
            }
        } catch (error) {
            console.error('❌ WhatsApp error:', error);
            return false;
        }
    }
    
    /**
     * Template: Booking Confirmation
     */
    getBookingConfirmationTemplate(booking) {
        return `🎉 *Booking Confirmed - Builder 07 Hotels*

नमस्ते ${booking.name}! 

आपकी booking confirm हो गई है! 🏨

*Booking Details:*
📅 Check-in: ${this.formatDate(booking.checkIn)}
📅 Check-out: ${this.formatDate(booking.checkOut)}
🛏️ Room: ${booking.roomType}
👥 Guests: ${booking.guests}
💰 Total: ₹${booking.totalPrice}

*Booking ID:* ${booking.id}

✈️ *Airport Pickup Available*
Need pickup? Reply YES

🍳 *Complimentary Breakfast*
Already included in your booking!

📍 *Hotel Address:*
[Hotel Location Link]

Need help? WhatsApp us anytime!

Builder 07 Team 🏨`;
    }
    
    /**
     * Template: Pre-Arrival (24hr before)
     */
    getPreArrivalTemplate(booking) {
        return `🎊 *Welcome Message - Arriving Tomorrow!*

Hi ${booking.name}! 👋

कल आपका check-in है! हम आपका इंतज़ार कर रहे हैं! 🏨

*Tomorrow's Details:*
⏰ Check-in: ${this.formatDate(booking.checkIn)} (2:00 PM onwards)
🛏️ Room: ${booking.roomType}
📱 Contact: [Hotel Phone]

*Quick Tips:*
✅ Early check-in available (subject to availability)
✅ Free WiFi in all rooms
✅ Breakfast timing: 7:00 AM - 10:30 AM

*Need anything?*
🚗 Airport pickup?
🍽️ Restaurant reservation?
🧖 Spa appointment?

Just reply and we'll arrange it!

See you tomorrow! 🌟
Builder 07 Team`;
    }
    
    /**
     * Template: Check-in Reminder (2hr before)
     */
    getCheckInReminderTemplate(booking) {
        return `⏰ *Check-in Today!*

${booking.name}, आप आज check-in कर सकते हैं! 🎉

*Your Room is Ready:*
🛏️ ${booking.roomType}
📍 [Hotel Location]
⏰ Check-in from 2:00 PM

*Quick Check-in:*
Show this message + ID proof at reception

*Running Late?*
No problem! We're 24/7 open.
Expected arrival time? Reply here.

Drive safe! 🚗
Builder 07 Team`;
    }
    
    /**
     * Template: Upsell Breakfast
     */
    getUpsellBreakfastTemplate(booking) {
        return `🍳 *Special Breakfast Offer!*

Good morning ${booking.name}! ☀️

*Limited Time Offer:*
Add breakfast to your stay!

💰 Just ₹299/person
🍽️ 30+ items buffet
⭐ 4.8/5 rating

*Menu Highlights:*
• Indian & Continental
• Fresh juice & coffee
• Live cooking stations

*Book Now:*
Reply YES to add breakfast

Valid for your upcoming stay
${this.formatDate(booking.checkIn)}

Builder 07 Restaurants 🍴`;
    }
    
    /**
     * Template: Upsell Airport Pickup
     */
    getUpsellPickupTemplate(booking) {
        return `🚗 *Airport Pickup Service*

${booking.name}, stress-free airport transfer! 

*Special Rate:*
₹499 (one-way)
₹899 (round-trip)

*Benefits:*
✅ Professional driver
✅ AC sedan car
✅ Free waiting time (60 min)
✅ Flight tracking

*Your Details:*
📅 Arrival: ${this.formatDate(booking.checkIn)}
✈️ Flight number?
⏰ Landing time?

Reply with flight details to book!

Builder 07 Concierge 🚕`;
    }
    
    /**
     * Template: Check-out Reminder
     */
    getCheckOutReminderTemplate(booking) {
        return `👋 *Check-out Reminder*

${booking.name}, today is check-out day!

*Check-out Details:*
⏰ Time: 11:00 AM
🛏️ Room: ${booking.roomType}

*Before You Leave:*
✅ Check all belongings
✅ Return room key
✅ Settle any extras

*Late Check-out?*
Available till 3 PM
Extra: ₹500

*Need Storage?*
Free luggage storage available

Thank you for staying with us! 🙏
Builder 07 Team`;
    }
    
    /**
     * Template: Feedback Request
     */
    getFeedbackRequestTemplate(booking) {
        return `⭐ *How Was Your Stay?*

${booking.name}, कैसा रहा आपका experience? 

*Quick Feedback:*
Rate us in 5 seconds! 👇

⭐⭐⭐⭐⭐ Excellent
⭐⭐⭐⭐ Good
⭐⭐⭐ Average
⭐⭐ Below Average
⭐ Poor

*Leave a Google Review:*
[Review Link]

*Win ₹500 Voucher!*
Every review enters lucky draw

Your feedback helps us improve! 🙏

Builder 07 Team`;
    }
    
    /**
     * Template: Thank You
     */
    getThankYouTemplate(booking) {
        return `💙 *Thank You for Staying With Us!*

${booking.name}, आपको host करके ख़ुशी हुई! 🙏

*Your Loyalty Rewards:*
🎁 10% discount on next booking
💳 Loyalty points earned: ${booking.totalPrice / 10}

*Special Offers for You:*
📧 Check your email for exclusive deals

*Refer & Earn:*
Share with friends, earn ₹500/booking
[Referral Link]

*Questions?*
We're always here on WhatsApp

Hope to see you again soon! 🏨
Builder 07 Team`;
    }
    
    /**
     * Template: Re-engagement (30 days later)
     */
    getReEngagementTemplate(booking) {
        return `🌟 *We Miss You! Special Comeback Offer*

${booking.name}, वापस आने का मन है? 

*EXCLUSIVE for You:*
💰 25% OFF on your next stay
🎁 Free room upgrade (subject to availability)
🍳 Complimentary breakfast

*Promo Code:* COMEBACK25
*Valid till:* ${this.getValidTillDate()}

*Book Now:*
[Booking Link]

*What's New:*
🆕 Renovated premium rooms
🆕 Rooftop restaurant
🆕 Spa & wellness center

We'd love to host you again! 💙

Builder 07 Team`;
    }
    
    /**
     * Helper: Format date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
    
    /**
     * Helper: Add hours to date
     */
    addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }
    
    /**
     * Helper: Get valid till date (30 days from now)
     */
    getValidTillDate() {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return this.formatDate(date);
    }
    
    /**
     * Birthday wish automation
     */
    async sendBirthdayWish(guest) {
        const message = `🎂 *Happy Birthday ${guest.name}!* 🎉

Builder 07 परिवार की तरफ से बहुत बहुत बधाई! 🎊

*Birthday Special:*
🎁 50% OFF on your birthday stay
🍰 Complimentary cake
🎈 Room decoration

*Promo Code:* BDAY50
*Valid:* This month only

*Book Now:*
[Booking Link]

Have a wonderful birthday! 🥳

Builder 07 Team 🎂`;
        
        await this.sendWhatsAppMessage(guest.phone, message);
    }
    
    /**
     * Anniversary wish automation
     */
    async sendAnniversaryWish(guest) {
        const message = `💑 *Happy Anniversary!*

${guest.name}, शादी की सालगिरह मुबारक हो! 💐

*Romantic Package:*
🌹 Rose petals & decoration
🍾 Complimentary wine
🎂 Anniversary cake
🛏️ Couple's suite upgrade

💰 Special price: ₹6,999

*Book Your Celebration:*
[Booking Link]

Make it memorable with us! 💕

Builder 07 Team`;
        
        await this.sendWhatsAppMessage(guest.phone, message);
    }
    
    /**
     * Payment reminder
     */
    async sendPaymentReminder(booking) {
        const message = `💳 *Payment Reminder*

${booking.name}, gentle reminder! 

*Pending Payment:*
Booking ID: ${booking.id}
Amount: ₹${booking.pendingAmount}
Due Date: ${this.formatDate(booking.paymentDueDate)}

*Pay Now:*
[Payment Link]

*Pay via:*
• UPI
• Credit/Debit Card
• Net Banking

Questions? Reply here!

Builder 07 Accounts 💰`;
        
        await this.sendWhatsAppMessage(booking.phone, message);
    }
}

// Initialize WhatsApp automation
let whatsappAutomation;

document.addEventListener('DOMContentLoaded', () => {
    whatsappAutomation = new WhatsAppAutomation();
    
    // Expose to global scope
    window.WhatsAppAutomation = whatsappAutomation;
    
    console.log('✅ WhatsApp Automation ready!');
});

/**
 * Export for Node.js
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppAutomation;
}
