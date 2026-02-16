require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// ===================== MIDDLEWARE =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    store: new FileStore({
        path: './sessions',
        logFn: function () { } // Suppress logs
    }),
    secret: 'aura_inn_secret_key_123',
    resave: false,
    saveUninitialized: false, // Don't save empty sessions
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
        secure: false
    }
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

// Global Middleware to provide room types & settings to all views
app.use((req, res, next) => {
    res.locals.generalSettings = getGeneralData();
    res.locals.roomTypesData = getRoomTypes();
    res.locals.floorsData = getFloors();
    next();
});

// ===================== DATA PERSISTENCE =====================
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read/write JSON
const readJSON = (filename) => {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
        console.error(`Error reading ${filename}.json:`, e);
        return null;
    }
};

const writeJSON = (filename, data) => {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
        return true;
    } catch (e) {
        console.error(`Error writing ${filename}.json:`, e);
        return false;
    }
};

// Global Data Loaders
const getHomeData = () => readJSON('homeData') || {};
const getFloors = () => readJSON('floors') || [];
const getRoomTypes = () => readJSON('roomTypes') || [];
const getBookings = () => readJSON('bookings') || [];
const getGeneralData = () => readJSON('generalData') || {};
const getAboutData = () => readJSON('aboutData') || {};
const getRoomsPageData = () => readJSON('roomsPageData') || {};
const getContactPageData = () => readJSON('contactPageData') || {};
const getServicesPageData = () => readJSON('servicesPageData') || {};

// In-memory logs (reset on restart, could be persisted if needed)
let logs = [];

// ===================== MULTER CONFIG =====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage: storage });

// ===================== AUTOMATED PRE-ARRIVAL EMAILS (CRON) =====================
const sendPreArrivalEmails = async () => {
    console.log('[Cron] Checking for pre-arrival emails...');
    const bookings = getBookings();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let sentCount = 0;

    for (const booking of bookings) {
        // Send only for Confirmed bookings that start tomorrow and haven't received the email yet
        if (booking.status === 'Confirmed' && booking.checkIn === tomorrowStr && !booking.preArrivalEmailSent) {
            if (GMAIL_USER && GMAIL_APP_PASSWORD && booking.email) {
                try {
                    const welcomeMailOptions = {
                        from: `"The Aura Inn" <${GMAIL_USER}>`,
                        to: booking.email,
                        subject: 'Your stay at The Aura Inn is just 24 hours away! 🏨',
                        html: `
                            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                                <h2 style="color: #D4AF37; text-align: center;">The Aura Inn</h2>
                                <h2 style="color: #1A1A1B; text-align: center;">We Are Excited To Welcome You Tomorrow!</h2>
                                <p>Hello <strong>${booking.guestName}</strong>,</p>
                                <p>This is a friendly reminder that your check-in at The Aura Inn is scheduled for tomorrow, <strong>${booking.checkIn}</strong>.</p>
                                
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
                    await mailTransporter.sendMail(welcomeMailOptions);
                    booking.preArrivalEmailSent = true;
                    sentCount++;
                    console.log(`[Cron] Pre-arrival email sent to: ${booking.email}`);
                } catch (err) {
                    console.error(`[Cron] Error sending to ${booking.email}:`, err.message);
                }
            }
        }
    }

    if (sentCount > 0) {
        writeJSON('bookings', bookings);
        console.log(`[Cron] Total pre-arrival emails sent today: ${sentCount}`);
    } else {
        console.log('[Cron] No pre-arrival emails needed for today.');
    }
};

// Schedule: Once a day at 9:00 AM
cron.schedule('0 9 * * *', () => {
    sendPreArrivalEmails();
});

// Run once on server start to catch any missed ones if server was down at 9 AM
// (Wait 10 seconds to allow transporter to verify)
setTimeout(sendPreArrivalEmails, 10000);

// ===================== NODEMAILER EMAIL SETUP =====================
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const HOTEL_LOCATION_URL = process.env.HOTEL_LOCATION_URL || 'https://maps.google.com';

if (GMAIL_USER) {
    console.log('[Email Config] Active User:', GMAIL_USER.replace(/(.{3})(.*)(@.*)/, '$1***$3'));
} else {
    console.warn('[Email Config] GMAIL_USER is NOT SET in .env');
}

const mailTransporter = nodemailer.createTransport({
    host: 'smtp.googlemail.com', // Classic alternative for better cloud stability
    port: 587,
    secure: false,
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4, // Force IPv4 (Crucial for Render)
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 30000
});

console.log(`[Nodemailer] Final Stabilization: smtp.googlemail.com (IPv4 Forced)`);

// Verify connection configuration
mailTransporter.verify((error, success) => {
    if (error) {
        console.error('[Nodemailer] CRITICAL: Connection failed!', error.message);
    } else {
        console.log('[Nodemailer] SUCCESS: Server is ready to send emails');
    }
});
// ===================== PUBLIC ROUTES =====================

// Helper to calculate room availability
const getRoomsWithAvailability = () => {
    const types = getRoomTypes();
    const floors = getFloors();

    return types.map(type => {
        // Find total rooms of this type across all floors
        let totalRooms = 0;
        let availableRooms = 0;

        floors.forEach(floor => {
            if (floor.rooms && Array.isArray(floor.rooms)) {
                floor.rooms.forEach(roomNum => {
                    if (type.assignedRooms && type.assignedRooms.includes(roomNum)) {
                        totalRooms++;
                        const status = (floor.roomStatuses && floor.roomStatuses[roomNum]) || 'Available';
                        if (status === 'Available') availableRooms++;
                    }
                });
            }
        });

        // Fallback if no specific assignment logic
        if (totalRooms === 0) totalRooms = 5;
        if (availableRooms === 0) availableRooms = 3;

        return {
            ...type,
            available: availableRooms > 0,
            availableCount: availableRooms,
            totalCount: totalRooms
        };
    });
};

app.get('/', (req, res) => {
    res.render('index', {
        homeData: getHomeData(),
        rooms: getRoomsWithAvailability(),
        floors: getFloors(),
        generalSettings: getGeneralData(),
        roomTypesData: getRoomTypes() // Critical for booking modal
    });
});

app.get('/rooms', (req, res) => {
    res.render('rooms', {
        rooms: getRoomsWithAvailability(),
        roomTypesData: getRoomTypes(),
        floors: getFloors(),
        generalSettings: getGeneralData(),
        roomsPageData: getRoomsPageData()
    });
});

app.get('/services', (req, res) => {
    res.render('services', {
        generalSettings: getGeneralData(),
        servicesPageData: getServicesPageData()
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        generalSettings: getGeneralData(),
        contactPageData: getContactPageData()
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        generalSettings: getGeneralData(),
        aboutData: getAboutData()
    });
});

// ===================== ADMIN ROUTES =====================

// Login Page
app.get('/admin/login', (req, res) => {
    if (req.session.isAdmin) return res.redirect('/admin/settings');
    res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded for demo - in prod use DB + Hash
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin/settings');
    } else {
        res.render('admin/login', { error: 'Invalid Credentials' });
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Master Settings Dashboard
app.get('/admin/settings', isAuthenticated, (req, res) => {
    const allBookings = getBookings().reverse();

    // Calculate stats
    const revenue = allBookings.reduce((sum, b) => b.status === 'Confirmed' ? sum + (b.totalPrice || 0) : sum, 0);
    const pendingCount = allBookings.filter(b => b.status === 'Pending').length;
    const roomTypes = getRoomTypes();
    const floors = getFloors();

    // Calculate Occupancy
    let totalRooms = 0;
    let occupiedRooms = 0;
    floors.forEach(f => {
        if (f.rooms) {
            totalRooms += f.rooms.length;
            f.rooms.forEach(r => {
                if (f.roomStatuses && f.roomStatuses[r] === 'Occupied') occupiedRooms++;
            });
        }
    });

    // --- AGGREGATE DAILY DATA FOR CURRENT MONTH (TRADING VIEW) ---
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Arrays for the chart
    const dailyLabels = [];
    const dailyClients = new Array(daysInMonth).fill(0);
    const dailyRevenue = new Array(daysInMonth).fill(0);

    // 1. Generate Labels (e.g., "1 Feb", "2 Feb"...)
    const monthName = now.toLocaleString('default', { month: 'short' });
    for (let d = 1; d <= daysInMonth; d++) {
        dailyLabels.push(`${d} ${monthName}`);
    }

    // 2. Aggregate Data
    allBookings.forEach(b => {
        // Use createdAt to show "Sales/Trading" activity happening NOW
        const bDate = new Date(b.createdAt || b.checkIn);

        // Check if booking belongs to current month and year
        if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
            const dayIndex = bDate.getDate() - 1; // 0-indexed (Day 1 = Index 0)

            if (dayIndex >= 0 && dayIndex < daysInMonth) {
                dailyClients[dayIndex]++;
                if (b.status === 'Confirmed' || b.status === 'Pending') {
                    // Count revenue for confirmed/pending deals made this month
                    dailyRevenue[dayIndex] += (b.totalPrice || 0);
                }
            }
        }
    });



    // Filter bookings for display if requested
    let viewBookings = allBookings;
    if (req.query.status) {
        viewBookings = allBookings.filter(b => b.status === req.query.status);
    }

    res.render('admin/settings', {
        homeData: getHomeData(),
        floors: getFloors(),
        roomTypes: roomTypes,
        bookings: viewBookings,
        generalSettings: getGeneralData(),
        aboutData: getAboutData(),
        roomsPageData: getRoomsPageData(),
        contactPageData: getContactPageData(),
        servicesPageData: getServicesPageData(),
        allBookings: allBookings,
        stats: {
            revenue,
            pendingCount,
            totalBookings: allBookings.length,
            occupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
        },
        analytics: {
            labels: dailyLabels,
            clients: dailyClients,
            revenue: dailyRevenue
        },
        logs: logs,
        page: req.query.tab || 'overview',
        msg: req.query.msg || null
    });
});

// NEW: API for Real-time Chart Polling
app.get('/api/analytics/current-month', isAuthenticated, (req, res) => {
    const allBookings = getBookings();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const dailyClients = new Array(daysInMonth).fill(0);
    const dailyRevenue = new Array(daysInMonth).fill(0);

    allBookings.forEach(b => {
        const bDate = new Date(b.createdAt || b.checkIn);
        if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
            const dayIndex = bDate.getDate() - 1;
            if (dayIndex >= 0 && dayIndex < daysInMonth) {
                dailyClients[dayIndex]++;
                if (b.status === 'Confirmed' || b.status === 'Pending') {
                    dailyRevenue[dayIndex] += (b.totalPrice || 0);
                }
            }
        }
    });

    res.json({
        clients: dailyClients,
        revenue: dailyRevenue
    });
});

// Revenue Details Page
app.get('/admin/revenue-details', isAuthenticated, (req, res) => {
    const bookings = getBookings().reverse().filter(b => b.status === 'Confirmed');
    const revenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Group by month
    const monthlyRevenue = {};
    bookings.forEach(b => {
        const date = new Date(b.checkIn);
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (b.totalPrice || 0);
    });

    res.render('admin/revenue_details', {
        bookings,
        revenue,
        monthlyRevenue,
        generalSettings: getGeneralData()
    });
});

// --- UPDATES ---

// General Settings Update
app.post('/admin/update-general', isAuthenticated, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'paymentQRCode', maxCount: 1 }]), (req, res) => {
    const data = getGeneralData();
    const { hotelName, address, phone, email, adminEmail, colorTheme, paymentAmount } = req.body;

    data.hotelName = hotelName;
    data.address = address;
    data.phone = phone;
    data.email = email;
    data.adminEmail = adminEmail;
    data.colorTheme = colorTheme;

    if (!data.payment) data.payment = {};
    data.payment.depositAmount = parseInt(paymentAmount) || 500;

    if (req.body.welcomeTemplate) {
        if (!data.whatsappTemplates) data.whatsappTemplates = {};
        data.whatsappTemplates.welcome = req.body.welcomeTemplate;
        data.whatsappTemplates.reminder = req.body.reminderTemplate;
        data.whatsappTemplates.checkout = req.body.checkoutTemplate;
    }

    if (req.files) {
        if (req.files.logo) {
            data.logo = '/images/' + req.files.logo[0].filename;
        }
        if (req.files.paymentQRCode) {
            data.payment.qrCode = '/images/' + req.files.paymentQRCode[0].filename;
        }
    }

    if (req.body.removeQRCode === 'true' && data.payment) {
        delete data.payment.qrCode;
    }

    writeJSON('generalData', data);
    res.redirect('/admin/settings?tab=general&msg=Settings Saved');
});

// Home Page Update
app.post('/admin/update-home', isAuthenticated, upload.single('heroImage'), (req, res) => {
    const data = getHomeData();
    const { headline, subheadline, offer, whatsappNumber } = req.body;

    if (headline) data.headline = headline;
    if (subheadline) data.subheadline = subheadline;
    if (offer) data.offer = offer;
    if (whatsappNumber) data.whatsappNumber = whatsappNumber;

    if (req.file) {
        data.heroImage = '/images/' + req.file.filename;
    }

    // Handle Badges (array inputs)
    const { badgeIcon, badgeValue, badgeLabel } = req.body;
    if (badgeIcon) {
        const icons = Array.isArray(badgeIcon) ? badgeIcon : [badgeIcon];
        const values = Array.isArray(badgeValue) ? badgeValue : [badgeValue];
        const labels = Array.isArray(badgeLabel) ? badgeLabel : [badgeLabel];

        data.badges = icons.map((icon, i) => ({
            icon,
            value: values[i] || '',
            label: labels[i] || ''
        })).filter(b => b.icon);
    }

    writeJSON('homeData', data);
    res.redirect('/admin/settings?tab=home&msg=Home Page Updated');
});

// About Page Update
app.post('/admin/update-about', isAuthenticated, upload.fields([{ name: 'heroImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), (req, res) => {
    const data = getAboutData();
    const { title, subtitle, storyTitle, storyContent, existingGalleryImages } = req.body;

    if (title) data.title = title;
    if (subtitle) data.subtitle = subtitle;
    if (storyTitle) data.storyTitle = storyTitle;
    if (storyContent) data.storyContent = storyContent;

    // Handle Hero Image
    if (req.files['heroImage']) {
        data.heroImage = '/images/' + req.files['heroImage'][0].filename;
    }

    // Handle Gallery Images
    // Start with existing images (if any were kept)
    let newGallery = [];
    if (existingGalleryImages) {
        newGallery = Array.isArray(existingGalleryImages) ? existingGalleryImages : [existingGalleryImages];
    }

    // Add new uploaded images
    if (req.files['galleryImages']) {
        req.files['galleryImages'].forEach(file => {
            newGallery.push('/images/' + file.filename);
        });
    }

    data.galleryImages = newGallery;

    writeJSON('aboutData', data);
    res.redirect('/admin/settings?tab=about&msg=About Page Updated');
});

// Rooms Page Content Update
app.post('/admin/update-rooms-page', isAuthenticated, upload.single('heroImage'), (req, res) => {
    const data = getRoomsPageData();
    const { title, subtitle } = req.body;

    if (title) data.title = title;
    if (subtitle) data.subtitle = subtitle;

    if (req.file) {
        data.heroImage = '/images/' + req.file.filename;
    }

    writeJSON('roomsPageData', data);
    res.redirect('/admin/settings?tab=rooms-page&msg=Rooms Page Updated');
});

// Contact Page Content Update
app.post('/admin/update-contact-page', isAuthenticated, upload.single('heroImage'), (req, res) => {
    const data = getContactPageData();
    const { title, subtitle } = req.body;

    if (title) data.title = title;
    if (subtitle) data.subtitle = subtitle;

    if (req.file) {
        data.heroImage = '/images/' + req.file.filename;
    }

    writeJSON('contactPageData', data);
    res.redirect('/admin/settings?tab=contact&msg=Contact Page Updated');
});

// Services Page Content Update
app.post('/admin/update-services-page', isAuthenticated, upload.single('heroImage'), (req, res) => {
    const data = getServicesPageData();
    const { title, subtitle } = req.body;

    if (title) data.title = title;
    if (subtitle) data.subtitle = subtitle;

    if (req.file) {
        data.heroImage = '/images/' + req.file.filename;
    }

    writeJSON('servicesPageData', data);
    res.redirect('/admin/settings?tab=services&msg=Services Page Updated');
});

// Floors & Rooms Update
app.post('/admin/update-floors', isAuthenticated, (req, res) => {
    const floors = getFloors();
    const { floorId, floorName, floorPrice, floorRooms } = req.body;

    if (floorId) {
        const ids = Array.isArray(floorId) ? floorId : [floorId];
        const names = Array.isArray(floorName) ? floorName : [floorName];
        const prices = Array.isArray(floorPrice) ? floorPrice : [floorPrice];
        const roomsList = Array.isArray(floorRooms) ? floorRooms : [floorRooms];

        ids.forEach((id, i) => {
            const f = floors.find(fl => fl.id == id);
            if (f) {
                f.name = names[i];
                f.price = parseInt(prices[i]);
                f.rooms = roomsList[i] ? roomsList[i].split(',').map(r => r.trim()).filter(Boolean) : [];
            }
        });
        writeJSON('floors', floors);
    }

    res.redirect('/admin/settings?tab=rooms&msg=Floors Updated');
});

app.post('/admin/add-floor', isAuthenticated, (req, res) => {
    const floors = getFloors();
    const newFloor = {
        id: Date.now(),
        floor: parseInt(req.body.floorNumber),
        name: req.body.floorName,
        price: parseInt(req.body.floorPrice),
        rooms: req.body.floorRooms ? req.body.floorRooms.split(',').map(r => r.trim()) : []
    };
    floors.push(newFloor);
    writeJSON('floors', floors);
    res.redirect('/admin/settings?tab=rooms&msg=Floor Added');
});

app.post('/admin/delete-floor', isAuthenticated, (req, res) => {
    let floors = getFloors();
    floors = floors.filter(f => f.id != req.body.floorIdToDelete);
    writeJSON('floors', floors);
    res.redirect('/admin/settings?tab=rooms&msg=Floor Deleted');
});

// Update Room Status (Check-in/Check-out/Maintenance)
app.post('/admin/update-room-status', isAuthenticated, (req, res) => {
    const floors = getFloors();
    const { floorId, roomNumber, status } = req.body;
    const floor = floors.find(f => f.id == floorId);
    if (floor) {
        if (!floor.roomStatuses) floor.roomStatuses = {};
        floor.roomStatuses[roomNumber] = status;
        writeJSON('floors', floors);
    }
    res.redirect('/admin/settings?tab=inventory&msg=Room Status Updated');
});

// Room Types Update
app.post('/admin/create-room-type', isAuthenticated, upload.single('typeImage'), (req, res) => {
    const types = getRoomTypes();
    const { typeName, typePrice, typeDescription, typeAmenities } = req.body;

    types.push({
        id: Date.now(),
        name: typeName,
        price: parseInt(typePrice),
        description: typeDescription,
        amenities: typeAmenities ? typeAmenities.split(',').map(a => a.trim()) : [],
        image: req.file ? '/images/' + req.file.filename : '/images/default.jpg',
        assignedFloors: [], // Can be updated later
        assignedRooms: []
    });

    writeJSON('roomTypes', types);
    res.redirect('/admin/settings?tab=types&msg=Room Type Created');
});

app.post('/admin/delete-room-type', isAuthenticated, (req, res) => {
    let types = getRoomTypes();
    types = types.filter(t => t.id != req.body.typeId);
    writeJSON('roomTypes', types);
    res.redirect('/admin/settings?tab=types&msg=Room Type Deleted');
});

app.post('/admin/update-room-type', isAuthenticated, upload.single('typeImage'), (req, res) => {
    const types = getRoomTypes();
    const { typeId, typeName, typePrice, typeDescription, typeAmenities, detailedDescription } = req.body;

    const type = types.find(t => t.id == typeId);
    if (type) {
        type.name = typeName;
        type.price = parseInt(typePrice);
        type.description = typeDescription;
        type.longDescription = detailedDescription;
        type.amenities = typeAmenities ? typeAmenities.split(',').map(a => a.trim()) : [];
        if (req.file) {
            type.image = '/images/' + req.file.filename;
        }
        writeJSON('roomTypes', types);
        res.redirect('/admin/settings?tab=types&msg=Room Type Updated');
    } else {
        res.redirect('/admin/settings?tab=types&msg=Error: Type Not Found');
    }
});

// Bookings Actions
app.post('/admin/update-booking-status', isAuthenticated, async (req, res) => {
    try {
        const bookings = getBookings();
        const { bookingId, status } = req.body;
        const booking = bookings.find(b => b.id == bookingId);

        if (booking) {
            const oldStatus = booking.status;
            booking.status = status;
            writeJSON('bookings', bookings);

            // GUEST NOTIFICATION FOR CANCELLATION
            if (status === 'Cancelled' && booking.email && GMAIL_USER && GMAIL_APP_PASSWORD) {
                try {
                    console.log(`[Email] Sending cancellation notice to guest: ${booking.email}`);
                    const cancelMailOptions = {
                        from: `"The Aura Inn" <${GMAIL_USER}>`,
                        to: booking.email,
                        subject: 'Update: Your Booking Request at The Aura Inn',
                        html: `
                            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                                <h2 style="color: #1A1A1B; text-align: center;">Booking Update</h2>
                                <p>Hello <strong>${booking.guestName || booking.name || 'Guest'}</strong>,</p>
                                <p>We are writing to inform you that your booking request (#${booking.id}) for <strong>${booking.roomType}</strong> has been <span style="color: #e53e3e; font-bold: true;">Cancelled</span>.</p>
                                <p>This may be due to unavailability or other internal reasons. If you believe this is an error or have any questions, please feel free to reach out to us.</p>
                                <p>We hope to have the opportunity to serve you in the future.</p>
                                <p>Warm regards,<br><strong>Team - The Aura Inn</strong></p>
                            </div>
                        `
                    };
                    await mailTransporter.sendMail(cancelMailOptions);
                } catch (err) {
                    console.error('[Email] Cancellation notice failed:', err.message);
                }
            }

            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.json({ success: true, message: `Booking status updated to ${status}` });
            }
            res.redirect('/admin/settings?tab=bookings&msg=Booking Updated');
        } else {
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }
            res.redirect('/admin/settings?tab=bookings&msg=Error: Booking Not Found');
        }
    } catch (error) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(500).json({ success: false, message: error.message });
        }
        res.redirect('/admin/settings?tab=bookings&msg=Error');
    }
});

app.post('/admin/clear-all-bookings', isAuthenticated, (req, res) => {
    try {
        console.log('[Admin] Clearing all bookings records...');
        writeJSON('bookings', []);
        res.json({ success: true, message: 'All booking records cleared successfully! 🧹' });
    } catch (error) {
        console.error('[Admin] Error clearing bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to clear records: ' + error.message });
    }
});

app.get('/admin/export-all-data', isAuthenticated, (req, res) => {
    try {
        const fullData = {
            bookings: readJSON('bookings') || [],
            reviews: readJSON('reviews') || [],
            roomTypes: readJSON('roomTypes') || [],
            floors: readJSON('floors') || [],
            generalData: readJSON('generalData') || {},
            homeData: readJSON('homeData') || {},
            aboutData: readJSON('aboutData') || {}
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=the-aura-inn-backup.json');
        res.send(JSON.stringify(fullData, null, 4));
    } catch (error) {
        console.error('[Admin] Export Error:', error);
        res.status(500).send('Failed to export data');
    }
});

// ===================== REVIEW API ROUTES =====================
app.get('/api/reviews', (req, res) => {
    try {
        const reviews = readJSON('reviews') || [];
        // Sort by helpfulness, then date
        reviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0) || new Date(b.date) - new Date(a.date));

        // Calculate stats
        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        const average = total > 0 ? (sum / total).toFixed(1) : "0.0";

        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (counts[r.rating] !== undefined) counts[r.rating]++;
        });

        res.json({ reviews, average, total, counts });
    } catch (e) {
        console.error("Error fetching reviews:", e);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

app.post('/api/reviews', (req, res) => {
    try {
        const { name, rating, comment } = req.body;
        if (!name || !rating || !comment) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const reviews = readJSON('reviews') || [];
        const newReview = {
            id: 'r' + Date.now(),
            name,
            rating: parseInt(rating),
            comment,
            date: new Date().toISOString().split('T')[0],
            helpful: 0
        };

        // Add to top
        reviews.unshift(newReview);
        writeJSON('reviews', reviews);

        res.json({ success: true, review: newReview });
    } catch (e) {
        console.error("Error saving review:", e);
        res.status(500).json({ error: "Failed to save review" });
    }
});

app.post('/api/reviews/helpful/:id', (req, res) => {
    try {
        const reviews = readJSON('reviews') || [];
        const review = reviews.find(r => r.id === req.params.id);
        if (review) {
            review.helpful = (review.helpful || 0) + 1;
            writeJSON('reviews', reviews);
            res.json({ success: true, helpful: review.helpful });
        } else {
            res.status(404).json({ error: "Review not found" });
        }
    } catch (e) {
        console.error("Error updating helpful count:", e);
        res.status(500).json({ error: "Failed to update" });
    }
});

// ===================== PUBLIC API ROUTES =====================
app.post('/api/book', async (req, res) => {
    try {
        console.log('[API/Book] Received booking request:', req.body);
        const {
            guestName, phone, email, checkIn, checkOut,
            adults, children, roomType, breakfast, pickup,
            specialRequests, flightNo, arrivalTime
        } = req.body;

        // Basic Validation
        if (!guestName || !checkIn || !checkOut || !roomType) {
            console.warn('[API/Book] Validation failed: missing fields');
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const bookings = getBookings();

        // Calculate Price
        let totalPrice = 0;
        const types = getRoomTypes();
        const selectedType = types.find(t => t.name === roomType);

        // Accurate nights calculation
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

        if (selectedType) {
            const isDirect = !!req.body.isDirectBooking;
            const subtotal = selectedType.price * nights;
            const discount = isDirect ? (subtotal * 0.2) : 0;
            totalPrice = Math.round(subtotal - discount + (breakfast ? 500 * nights : 0) + (pickup ? 800 : 0));
        }

        const newBooking = {
            id: Date.now(),
            name: guestName,
            guestName,
            phone,
            email,
            checkIn,
            checkOut,
            adults,
            children,
            roomType,
            breakfast: !!breakfast,
            pickup: !!pickup,
            flightNo: flightNo || '',
            arrivalTime: arrivalTime || '',
            specialRequests: specialRequests || '',
            totalPrice,
            utr: req.body.utr || '',
            status: 'Pending',
            createdAt: new Date()
        };

        // 1. SAVE TO DATABASE (Instant)
        bookings.push(newBooking);
        writeJSON('bookings', bookings);
        console.log('[API/Book] Booking saved successfully:', newBooking.id);

        // 2. SEND SUCCESS RESPONSE IMMEDIATELY (Prevents UI hang)
        res.json({
            success: true,
            message: 'Booking Request Received!',
            bookingId: newBooking.id
        });

        // 3. BACKGROUND TASKS: Email Notifications (Non-blocking)
        if (GMAIL_USER && GMAIL_APP_PASSWORD) {
            // Use a self-invoking async function to send emails without blocking the main response
            (async () => {
                try {
                    const settings = getGeneralData();
                    const ownerEmail = settings.adminEmail || GMAIL_USER;
                    console.log(`[Email/Bg] Dispatching Owner Alert -> ${ownerEmail}`);

                    const adminUrl = `http://${req.headers.host}/admin/settings?tab=bookings&status=Pending`;
                    const ownerMailOptions = {
                        from: `"The Aura Inn" <${GMAIL_USER}>`,
                        to: ownerEmail,
                        replyTo: email,
                        subject: `New Booking Request: ${guestName} (#${newBooking.id})`,
                        html: `
                            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #D4AF37; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                                <div style="background: #1a1a1b; padding: 30px; text-align: center;">
                                    <h1 style="color: #D4AF37; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">New Reservation</h1>
                                    <p style="color: #ffffff; margin: 10px 0 0; opacity: 0.8;">Action required in Admin Dashboard</p>
                                </div>
                                <div style="padding: 40px; background: #ffffff; line-height: 1.6;">
                                    <h3 style="color: #1a1a1b; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Guest Details</h3>
                                    <p><strong>Name:</strong> ${guestName}<br><strong>Phone:</strong> ${phone}<br><strong>Email:</strong> ${email}</p>
                                    <div style="margin-top: 20px; background: #fdfaf0; padding: 20px; border-radius: 8px; border: 1px solid #faeccb;">
                                        <h3 style="color: #856404; margin: 0 0 10px;">Stay Details</h3>
                                        <p><strong>Room:</strong> ${roomType}<br><strong>Check-in:</strong> ${checkIn}<br><strong>Check-out:</strong> ${checkOut}</p>
                                    </div>
                                    <div style="text-align: center; margin-top: 35px;">
                                        <a href="${adminUrl}" style="background: #D4AF37; color: #000; text-decoration: none; padding: 18px 45px; border-radius: 10px; font-weight: bold; display: inline-block;">CONFIRM IN DASHBOARD</a>
                                    </div>
                                </div>
                            </div>
                        `
                    };

                    await mailTransporter.sendMail(ownerMailOptions);
                    console.log('[Email/Bg] ✅ Owner Alert Sent.');

                    if (email) {
                        const guestAckOptions = {
                            from: `"The Aura Inn" <${GMAIL_USER}>`,
                            to: email,
                            subject: '⌛ Your Stay at The Aura Inn - Processing Request',
                            html: `
                                <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
                                    <h2 style="color: #D4AF37; text-align: center;">The Aura Inn</h2>
                                    <p>Hello <strong>${guestName}</strong>, we've received your request for the <strong>${roomType}</strong>. You will receive a confirmation once verified.</p>
                                    <p style="font-size: 13px; color: #888; text-align: center; margin-top: 30px;">Warm regards, <br><strong>The Aura Inn Management</strong></p>
                                </div>
                            `
                        };
                        await mailTransporter.sendMail(guestAckOptions);
                        console.log('[Email/Bg] ✅ Guest Ack Sent.');
                    }
                } catch (err) {
                    console.error('[Email/Bg] ❌ Background Email Error:', err.message);
                }
            })();
        }
    } catch (error) {
        console.error('[API/Book] CRITICAL ERROR:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
});

// ===================== CONFIRM BOOKING API =====================
app.post('/api/confirm-booking/:id', isAuthenticated, async (req, res) => {
    try {
        const bookingId = req.params.id;
        console.log(`[ConfirmBooking] Request received for ID: ${bookingId}`);

        const bookings = getBookings();
        if (!Array.isArray(bookings)) {
            console.error('[ConfirmBooking] Bookings data is not an array!');
            throw new Error('Internal validation error');
        }

        const booking = bookings.find(b => b.id == bookingId);

        if (!booking) {
            console.warn(`[ConfirmBooking] Booking not found for ID: ${bookingId}`);
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Update Status
        booking.status = 'Confirmed';
        console.log(`[ConfirmBooking] Preparing confirmation for ID: ${bookingId}`);

        // PRIMARY ACTION: Send Confirmation Email to Guest FIRST
        if (GMAIL_USER && GMAIL_APP_PASSWORD && booking.email) {
            try {
                console.log(`[Email] Sending confirmation to guest: ${booking.email}`);
                const guestMailOptions = {
                    from: `"The Aura Inn" <${GMAIL_USER}>`,
                    to: booking.email,
                    subject: `✅ Your Booking at The Aura Inn is Confirmed! (Booking ID: #${booking.id})`,
                    html: `
                        <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                            <h2 style="color: #D4AF37; text-align: center;">The Aura Inn</h2>
                            <h2 style="color: #1A1A1B; text-align: center;">Your Luxurious Stay is Confirmed!</h2>
                            <p>Hello <strong>${booking.guestName}</strong>,</p>
                            <p>We are thrilled to confirm your booking at The Aura Inn. Your room is reserved, and we are preparing to give you an unforgettable experience.</p>
                            
                            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #1A1A1B;">Your Booking Details:</h3>
                                <p><strong>Booking ID:</strong> #${booking.id}</p>
                                <p><strong>Room Type:</strong> ${booking.roomType}</p>
                                <p><strong>Check-in:</strong> ${booking.checkIn}</p>
                                <p><strong>Check-out:</strong> ${booking.checkOut}</p>
                            </div>
                            
                            <p><strong>Getting Here:</strong></p>
                            <p>Our hotel is just 5 minutes from the airport. You can find our exact location on Google Maps by clicking the button below.</p>
                            <div style="text-align: center; margin-top: 20px;">
                                <a href="${HOTEL_LOCATION_URL}" style="display: inline-block; padding: 15px 30px; background-color: #1A1A1B; color: #FFFFFF; text-decoration: none; border-radius: 5px; font-weight: bold;">View on Google Maps</a>
                            </div>
                            
                            <p style="margin-top: 20px;">We look forward to welcoming you!</p>
                            <p>Warm regards,<br><strong>Team - The Aura Inn</strong></p>
                            <p style="font-size: 12px; color: #777; border-top: 1px solid #eee; margin-top: 20px; padding-top: 10px; text-align: center;">This is an automated confirmation from The Aura Inn.</p>
                        </div>
                    `
                };
                await mailTransporter.sendMail(guestMailOptions);
                console.log('[Email] SUCCESS: Guest notified.');
            } catch (err) {
                console.error('[Email] ERROR: Guest notification failed -', err.message);
            }
        }

        // SECONDARY ACTION: Save Status Change
        writeJSON('bookings', bookings);
        console.log(`[ConfirmBooking] Status SAVED for ID: ${bookingId}`);

        // Return response immediately
        res.json({ success: true, message: 'Booking Confirmed Successfully' });
    } catch (error) {
        console.error('[ConfirmBooking] CRITICAL SERVER ERROR:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
    }
});

// Security
app.post('/admin/change-password', isAuthenticated, (req, res) => {
    // Demo only
    res.redirect('/admin/settings?msg=Password Changed');
});

// Redirect to settings for any other admin route to keep it simple
// app.get('/admin/(.*)', isAuthenticated, (req, res) => {
//     res.redirect('/admin/settings');
// });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
