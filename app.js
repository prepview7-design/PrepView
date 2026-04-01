document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Add glowing effect to the app wrapper based on mouse movement (ambient interactive glow)
    const appWrapper = document.querySelector('.app-wrapper');
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        // Move the subtle background orbs slightly based on mouse
        const orb1 = document.querySelector('.orb-primary');
        const orb2 = document.querySelector('.orb-secondary');
        
        if (orb1 && orb2) {
            orb1.style.transform = `translate(${x * 30}px, ${y * 30}px) scale(1)`;
            orb2.style.transform = `translate(${x * -40}px, ${y * -40}px) scale(1)`;
        }
    });
});

const app = {
    views: [
        'view-setup',
        'view-aptitude',
        'view-coding',
        'view-technical',
        'view-hr',
        'view-dashboard'
    ],
    
    // Smooth transition between sections
    transitionTo: function(nextViewId) {
        const currentView = document.querySelector('.view.active');
        const nextView = document.getElementById(nextViewId);
        
        if (!nextView || (currentView && currentView.id === nextViewId)) return;

        // 1. Fade out current view if it exists
        if (currentView) {
            currentView.classList.remove('active');
            
            setTimeout(() => {
                currentView.classList.add('hidden');
                this.fadeInNext(nextView, nextViewId);
            }, 500); // Matches CSS transition duration
        } else {
            this.fadeInNext(nextView, nextViewId);
        }
    },
    
    fadeInNext: function(nextView, nextViewId) {
        // 2. Prepare next view
        nextView.classList.remove('hidden');
        
        // Force reflow so transition works
        void nextView.offsetWidth;
        
        // 3. Fade in next view
        nextView.classList.add('active');
        
        // Update progress tracker
        this.updateProgress(nextViewId);
        
        // Trigger specific logic for the new view
        this.triggerViewSpecifics(nextViewId);
        
        // Re-init newly visible icons
        lucide.createIcons();
    },
    
    updateProgress: function(viewId) {
        const index = this.views.indexOf(viewId) + 1;
        const steps = document.querySelectorAll('.step');
        
        steps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            if (stepNum <= index) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Update user status
        const statusSpan = document.querySelector('.user-status span');
        if (viewId === 'view-setup') statusSpan.innerHTML = 'System Online';
        else if (viewId === 'view-dashboard') {
            statusSpan.innerHTML = 'Evaluation Complete';
            document.querySelector('.pulse-indicator').style.background = '#8b5cf6';
            document.querySelector('.pulse-indicator').style.boxShadow = '0 0 10px #8b5cf6';
        } else {
            statusSpan.innerHTML = 'Session in Progress';
            document.querySelector('.pulse-indicator').style.background = '#ef4444';
            document.querySelector('.pulse-indicator').style.boxShadow = '0 0 10px #ef4444';
        }
    },
    
    // Simulation / Timer Logic
    triggerViewSpecifics: function(viewId) {
        if (viewId === 'view-aptitude') {
            this.startTimer(15 * 60, document.getElementById('apti-timer'));
        }
        
        // Trigger dashboard animations explicitly if needed
        if (viewId === 'view-dashboard') {
            const fills = document.querySelectorAll('.fill');
            fills.forEach(fill => {
                fill.style.animation = 'none';
                void fill.offsetWidth; // trigger reflow
                fill.style.animation = 'slideProgress 1.5s ease-out forwards';
            });
            
            const circle = document.querySelector('.circle');
            if (circle) {
                circle.style.animation = 'none';
                void circle.offsetWidth;
                circle.style.animation = 'progress 2s ease-out forwards';
            }
        }
    },
    
    activeTimer: null,
    
    startTimer: function(duration, display) {
        if (this.activeTimer) clearInterval(this.activeTimer);
        
        let timer = duration, minutes, seconds;
        this.activeTimer = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(this.activeTimer);
            }
        }.bind(this), 1000);
    }
};

// Handle file drop visually
const uploadZone = document.getElementById('upload-zone');
if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#3b82f6';
        uploadZone.style.background = 'rgba(59, 130, 246, 0.1)';
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        uploadZone.style.background = 'rgba(0,0,0,0.2)';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#10b981';
        uploadZone.style.background = 'rgba(16, 185, 129, 0.1)';
        const h3 = uploadZone.querySelector('h3');
        if (h3) h3.textContent = "CV Ready for Processing";
        const p = uploadZone.querySelector('.file-support');
        if (p) p.textContent = "John_Doe_Resume.pdf (1.2 MB)";
        
        // Change icon to success
        const icon = uploadZone.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', 'file-check-2');
            icon.style.color = '#10b981';
            lucide.createIcons();
        }
    });
}
