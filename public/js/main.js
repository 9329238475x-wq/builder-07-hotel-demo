document.addEventListener('DOMContentLoaded', () => {
    // ========== SOLID NAVBAR SCROLL LOGIC ==========
    const header = document.getElementById('mainHeader');

    // Scroll Effect - just shadow intensity
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('shadow-xl');
            } else {
                header.classList.remove('shadow-xl');
            }
        });
    }

    // NOTE: Mobile menu toggle is now handled by /js/mobile-menu.js

    // ========== SCROLL REVEAL (IntersectionObserver) ==========
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

        revealElements.forEach(el => observer.observe(el));
    }

    // Initialize the new modular booking system
    if (typeof initBookingSystem === 'function') {
        initBookingSystem();
    }

    // Check for booking success redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success' && typeof showNotification === 'function') {
        setTimeout(() => {
            showNotification("Your booking has been successfully confirmed! Thank you for choosing The Aura Inn.", "success");
            // Clear URL params without reloading to keep it clean
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 800);
    }

    // ==========================================
    // WHATSAPP PROFESSIONAL AI CHATBOT
    // ==========================================

    // AI Chat Setup (Keys are handled by backend)
    const openChat = document.getElementById('openChat');
    const closeChat = document.getElementById('closeChat');
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const messages = document.getElementById('messages');
    const typingArea = document.getElementById('typingArea');
    const voiceBtn = document.getElementById('voiceBtn');

    let chatHistory = [];

    // Toggle Chat
    if (openChat && chatWindow) {
        openChat.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            chatWindow.classList.add('flex');
            chatInput.focus();
        });

        closeChat.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
            chatWindow.classList.remove('flex');
        });
    }

    // Voice Input
    if (voiceBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'hi-IN';

            voiceBtn.addEventListener('click', () => {
                recognition.start();
                voiceBtn.classList.add('bg-green-100', 'text-green-600');
            });

            recognition.onresult = (e) => {
                chatInput.value = e.results[0][0].transcript;
                voiceBtn.classList.remove('bg-green-100', 'text-green-600');
                sendMessage();
            };

            recognition.onend = () => {
                voiceBtn.classList.remove('bg-green-100', 'text-green-600');
            };
        }
    }

    // Voice Output (Multi-Language Support)
    function speak(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Simple Language Detection logic
        // If text contains Hindi characters, use hi-IN, else default to en-US
        const hasHindi = /[\u0900-\u097F]/.test(text);
        utterance.lang = hasHindi ? 'hi-IN' : 'en-US';

        const voices = window.speechSynthesis.getVoices();
        let targetVoice = voices.find(v => v.lang.includes(hasHindi ? 'hi' : 'en'));

        // Fallback for regional or other languages
        if (!targetVoice) targetVoice = voices[0];

        if (targetVoice) utterance.voice = targetVoice;
        window.speechSynthesis.speak(utterance);
    }

    // UI Helpers
    function addBubble(sender, text) {
        const div = document.createElement('div');
        div.className = sender === 'user' ? 'user-bubble' : 'bot-bubble';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `
            ${text.replace(/\n/g, '<br>')}
            <span class="text-[9px] block text-right mt-1 opacity-70">${time}</span>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // Grok AI Call (Using Backend Proxy for 100% Reliability & Security)
    async function callGrok(message) {
        typingArea.classList.remove('hidden');
        messages.scrollTop = messages.scrollHeight;

        try {
            // Talking to our OWN backend (No CORS issues)
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory.slice(-10) // More context
                })
            });

            const data = await res.json();
            typingArea.classList.add('hidden');

            if (data.success) {
                return data.reply;
            } else {
                throw new Error('Proxy error');
            }
        } catch (e) {
            console.error('Chat Logic Error:', e);
            typingArea.classList.add('hidden');
            return "क्षमा करें, मेरी कनेक्टिविटी में कुछ बाधा आई है। कृपया फिर से प्रयास करें।";
        }
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        addBubble('user', text);

        // Intent Actions
        if (text.toLowerCase().includes('book') || text.includes('बुक')) {
            const modal = document.getElementById('bookingModal');
            if (modal) modal.style.display = 'block';
        }

        const reply = await callGrok(text);
        addBubble('bot', reply);
        speak(reply);

        // Update History
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: reply });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Admin Dashboard / UI logic continues below... (keeping existing)
    // Admin Dashboard Logic
    // Confirm Booking Logic (called directly from HTML onclick)
    window.confirmBooking = async (id) => {
        const select = document.getElementById(`assign-room-${id}`);
        const assignedRoomId = select ? select.value : null;

        if (!assignedRoomId) {
            alert('Please select a Room to assign!');
            return;
        }

        if (!confirm(`Confirm Booking #${id} and assign Room?`)) return;

        try {
            const response = await fetch(`/api/book/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Confirmed', assignedRoomId })
            });

            if (response.ok) {
                location.reload();
            } else {
                alert('Failed to confirm booking');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating status');
        }
    };

    // Note: Cancel/Delete buttons still use event listeners below or inline

    // Cancel Booking Logic
    const cancelBtns = document.querySelectorAll('.cancel-action-btn');
    if (cancelBtns.length > 0) {
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'Cancelled'));
        });
    }

    // Delete Booking Logic
    const deleteBtns = document.querySelectorAll('.delete-action-btn');
    if (deleteBtns.length > 0) {
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to PERMANENTLY delete this booking?')) return;

                try {
                    const response = await fetch(`/api/book/${btn.dataset.id}/delete`, {
                        method: 'POST'
                    });
                    if (response.ok) {
                        location.reload();
                    } else {
                        alert('Failed to delete booking');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Error deleting booking');
                }
            });
        });
    }

    async function updateStatus(id, status) {
        if (!confirm(`Are you sure you want to change status to ${status}?`)) return;

        try {
            const response = await fetch(`/api/book/${id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                location.reload(); // Refresh to show new status and logs
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating status');
        }
    }

    // Scroll Reveal Observer
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });

    // Apply to elements
    document.querySelectorAll('.room-card, .feature-box, .service-card, section h2, .contact-container').forEach(el => {
        el.classList.add('reveal', 'reveal-up');
        revealObserver.observe(el);
    });

    document.querySelectorAll('.hero-content').forEach(el => {
        el.classList.add('reveal', 'reveal-up');
        revealObserver.observe(el);
    });

    // Social Proof Popup System (PRO VERSION)
    const socialProofMessages = [
        "Someone from Mumbai just booked a Deluxe Suite!",
        "Priya from Delhi booked an Executive Room 2 minutes ago",
        "Only 2 rooms left for this weekend!",
        "Rajesh from Bangalore just added Airport Pickup",
        "Someone from New York just booked a Family Suite!",
        "5 people are viewing rooms right now",
        "Amit from Pune booked with Breakfast Buffet",
        "Last room booked 3 minutes ago!",
        "Someone just added Late Check-out service",
        "High demand! 3 bookings in the last hour"
    ];

    function showSocialProof() {
        const popup = document.getElementById('socialProofPopup');
        const message = document.getElementById('socialProofMessage');

        if (!popup || !message) return;

        // Random message
        const randomMessage = socialProofMessages[Math.floor(Math.random() * socialProofMessages.length)];
        message.textContent = randomMessage;

        // Show popup
        popup.classList.add('show');

        // Hide after 5 seconds
        setTimeout(() => {
            popup.classList.remove('show');
        }, 5000);
    }

    // Show first notification after 3 seconds
    setTimeout(showSocialProof, 3000);

    // Then show every 15-20 seconds
    setInterval(() => {
        const randomDelay = 15000 + Math.random() * 5000; // 15-20 seconds
        setTimeout(showSocialProof, randomDelay);
    }, 20000);

    // ========== LIVE TOAST NOTIFICATIONS (Homepage) ==========
    const isHomePage = document.body && document.body.dataset && document.body.dataset.page === 'home';
    const liveToastHost = isHomePage ? document.getElementById('liveToastHost') : null;
    const toastMessages = [
        'Just booked: Executive Room • Airport Pickup added',
        'New booking: Deluxe Suite • WhatsApp check-in enabled',
        'Someone reserved a Family Suite • High demand tonight',
        'Booking confirmed: Standard Room • 2 mins from airport',
        'Last-minute booking: Deluxe Suite • Breakfast included'
    ];

    function showLiveToast() {
        if (!liveToastHost) return;

        const toast = document.createElement('div');
        toast.className = 'w-[280px] max-w-[85vw] rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)]';

        const msg = toastMessages[Math.floor(Math.random() * toastMessages.length)];
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="mt-0.5 text-gold text-lg"><i class="fas fa-bell"></i></div>
                <div class="flex-1">
                    <div class="text-white/90 text-sm font-semibold">Live Booking</div>
                    <div class="text-white/70 text-xs leading-relaxed">${msg}</div>
                </div>
                <button class="text-white/40 hover:text-white/70 text-lg leading-none" aria-label="Close">×</button>
            </div>
        `;

        const closeBtn = toast.querySelector('button');
        if (closeBtn) closeBtn.addEventListener('click', () => toast.remove());

        liveToastHost.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    if (liveToastHost) {
        setTimeout(showLiveToast, 2500);
        setInterval(showLiveToast, 17000);
    }
});
