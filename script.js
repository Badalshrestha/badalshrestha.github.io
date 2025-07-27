// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const termsModal = document.getElementById('terms-modal');
    const closeTerms = document.getElementById('close-terms');
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking on links
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.add('hidden');
        });
    });

    // Terms & Conditions modal
    document.querySelector('a[href="#terms"]').addEventListener('click', function(e) {
        e.preventDefault();
        termsModal.classList.remove('hidden');
    });

    closeTerms.addEventListener('click', function() {
        termsModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    termsModal.addEventListener('click', function(e) {
        if (e.target === termsModal) {
            termsModal.classList.add('hidden');
        }
    });

    // Contact form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message')
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('Thank you! Your message has been sent successfully.', 'success');
                contactForm.reset();
            } else {
                showMessage(result.message || 'Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please try again later.', 'error');
        }
    });

    // Show form messages
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `mt-4 p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
        formMessage.classList.remove('hidden');
        
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000);
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Fade in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe all elements that should fade in
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Protect image from right-click and keyboard shortcuts
    document.addEventListener('contextmenu', function(e) {
        if (e.target.classList.contains('protected-image')) {
            e.preventDefault();
        }
    });

    document.addEventListener('keydown', function(e) {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Print Screen
        if (e.keyCode == 123 || 
            (e.ctrlKey && e.shiftKey && e.keyCode == 73) ||
            (e.ctrlKey && e.shiftKey && e.keyCode == 74) ||
            (e.ctrlKey && e.keyCode == 85) ||
            (e.ctrlKey && e.keyCode == 83) ||
            e.keyCode == 44) {
            e.preventDefault();
            return false;
        }
    });

    // Disable drag and drop on protected images
    document.querySelectorAll('.protected-image').forEach(img => {
        img.addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
    });
});