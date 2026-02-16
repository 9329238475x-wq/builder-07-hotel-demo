require('dotenv').config();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const HOTEL_LOCATION_URL = process.env.HOTEL_LOCATION_URL || 'https://maps.google.com';

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
    }
});

const DATA_DIR = path.join(__dirname, 'data');
const readJSON = (filename) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${filename}.json`), 'utf-8'));
const writeJSON = (filename, data) => fs.writeFileSync(path.join(DATA_DIR, `${filename}.json`), JSON.stringify(data, null, 4));

const testPreArrival = async () => {
    console.log('--- TEST: Pre-Arrival Email System ---');

    // 1. Create a dummy booking for TOMORROW
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Setting up test booking for tomorrow: ${tomorrowStr}`);

    const testBooking = {
        id: Date.now(),
        guestName: "Test Sonu",
        phone: "9329238475",
        email: "sonubanchhor.com@gmail.com",
        checkIn: tomorrowStr,
        checkOut: "2026-02-19",
        roomType: "Premium Suite",
        status: "Confirmed",
        createdAt: new Date(),
        preArrivalEmailSent: false
    };

    const bookings = readJSON('bookings');
    bookings.push(testBooking);
    writeJSON('bookings', bookings);

    console.log('Test booking saved and confirmed.');

    // 2. Run the email sender logic
    console.log('Running Pre-Arrival Email Logic...');

    try {
        const welcomeMailOptions = {
            from: `"The Aura Inn" <${GMAIL_USER}>`,
            to: testBooking.email,
            subject: 'Your stay at The Aura Inn is just 24 hours away! 🏨',
            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                    <h2 style="color: #D4AF37; text-align: center;">The Aura Inn</h2>
                    <h2 style="color: #1A1A1B; text-align: center;">We Are Excited To Welcome You Tomorrow!</h2>
                    <p>Hello <strong>${testBooking.guestName}</strong>,</p>
                    <p>This is a friendly reminder that your check-in at The Aura Inn is scheduled for tomorrow, <strong>${testBooking.checkIn}</strong>.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1A1A1B;">Quick Reminders:</h3>
                        <ul>
                            <li><strong>Check-in Time:</strong> After 2:00 PM</li>
                            <li><strong>Our Location:</strong> <a href="${HOTEL_LOCATION_URL}" style="color: #D4AF37;">Click here for map</a></li>
                            <li><strong>Airport Pickup:</strong> If you've booked our pickup service, our driver will contact you.</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions, just reply to this email or chat with our AI Assistant on our website.</p>
                    <p>See you soon!</p>
                    <p>Warm regards,<br><strong>Team - The Aura Inn</strong></p>
                </div>
            `
        };
        const info = await mailTransporter.sendMail(welcomeMailOptions);
        console.log('SUCCESS: Test Pre-arrival email sent!', info.response);

        // Update the booking status in file
        const updatedBookings = readJSON('bookings');
        const b = updatedBookings.find(x => x.id === testBooking.id);
        if (b) b.preArrivalEmailSent = true;
        writeJSON('bookings', updatedBookings);

    } catch (err) {
        console.error('FAILED: Test Pre-arrival email failed -', err.message);
    }
};

testPreArrival();
