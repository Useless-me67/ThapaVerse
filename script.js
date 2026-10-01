document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. "DECONSTRUCT & ASSEMBLE" ENTRY ANIMATION (CANVAS)
     ========================================================================== */
  const canvas = document.getElementById('intro-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('intro-overlay');
  const appContent = document.getElementById('app-content');
  const skipBtn = document.getElementById('skip-intro-btn');

  let animationFrameId;
  let particles = [];
  let isIntroComplete = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Particle Class for Deconstruct & Assemble animation
  class Particle {
    constructor(targetX, targetY) {
      // Start exploded outside or randomly
      this.targetX = targetX;
      this.targetY = targetY;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.max(canvas.width, canvas.height);
      
      this.x = canvas.width / 2 + Math.cos(angle) * distance;
      this.y = canvas.height / 2 + Math.sin(angle) * distance;
      
      this.size = Math.random() * 2 + 1;
      this.speed = Math.random() * 0.04 + 0.02; // Interpolation factor
      this.color = '#00d2ff';
      this.alpha = Math.random() * 0.8 + 0.2;
    }

    update() {
      // Lerp (assemble) towards target
      this.x += (this.targetX - this.x) * this.speed;
      this.y += (this.targetY - this.y) * this.speed;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function initIntroParticles() {
    particles = [];
    // Generate text mask to get particle targets
    const textCanvas = document.createElement('canvas');
    const textCtx = textCanvas.getContext('2d');
    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;

    const fontSize = Math.min(canvas.width * 0.12, 90);
    textCtx.font = `800 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    textCtx.fillStyle = '#ffffff';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText('SUPAM', canvas.width / 2, canvas.height / 2 - fontSize * 0.4);
    textCtx.fillText('THAPA', canvas.width / 2, canvas.height / 2 + fontSize * 0.5);

    const imageData = textCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Sample pixels (step controls particle density)
    const step = Math.max(4, Math.floor(canvas.width / 300));
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const index = (y * canvas.width + x) * 4;
        if (data[index + 3] > 128) {
          particles.push(new Particle(x, y));
        }
      }
    }
  }

  initIntroParticles();

  let startTime = Date.now();

  function animateIntro() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let allAssembled = true;
    particles.forEach(p => {
      p.update();
      p.draw();
      
      const dist = Math.hypot(p.targetX - p.x, p.targetY - p.y);
      if (dist > 3) allAssembled = false;
    });

    // Draw connecting dynamic lines between nearby assembled particles
    for (let i = 0; i < particles.length; i += 15) {
      for (let j = i + 1; j < particles.length; j += 15) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < 35) {
          ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed > 3500 || (allAssembled && elapsed > 2000)) {
      finishIntro();
    } else if (!isIntroComplete) {
      animationFrameId = requestAnimationFrame(animateIntro);
    }
  }

  function finishIntro() {
    if (isIntroComplete) return;
    isIntroComplete = true;
    cancelAnimationFrame(animationFrameId);

    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      appContent.classList.add('visible');
    }, 800);
  }

  animateIntro();
  skipBtn.addEventListener('click', finishIntro);

  /* ==========================================================================
     2. MOBILE DRAWER / MENU TOGGLE
     ========================================================================== */
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function toggleMobileMenu() {
    hamburgerBtn.classList.toggle('is-active');
    mobileDrawer.classList.toggle('open');
    document.body.style.overflow = mobileDrawer.classList.contains('open') ? 'hidden' : '';
  }

  hamburgerBtn.addEventListener('click', toggleMobileMenu);

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileDrawer.classList.contains('open')) {
        toggleMobileMenu();
      }
    });
  });

  /* ==========================================================================
     3. STICKY HEADER & ACTIVE SECTION HIGHLIGHT
     ========================================================================== */
  const header = document.getElementById('header');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    // Sticky Glassmorphic Header background trigger
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Active navigation scroll indicator
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     4. CONTACT FORM HANDLING & VALIDATION
     ========================================================================== */
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      showFormStatus('Please fill in all fields.', 'error');
      return;
    }

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFormStatus('Please enter a valid email address.', 'error');
      return;
    }

    // Simulate form submission process
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';

    setTimeout(() => {
      showFormStatus('Thank you! Your message has been sent successfully.', 'success');
      contactForm.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }, 1500);
  });

  function showFormStatus(msg, type) {
    formStatus.textContent = msg;
    formStatus.className = `form-status ${type}`;
    
    setTimeout(() => {
      formStatus.textContent = '';
      formStatus.className = 'form-status';
    }, 5000);
  }

});