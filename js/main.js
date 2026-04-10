/**
 * Elite Dental Force - Main JavaScript
 * Enterprise SaaS Website Interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initMobileMenu();
  initMobileDropdowns();
  initStickyHeader();
  initFaqAccordion();
  initSmoothScroll();
  initFormValidation();
  initScrollAnimations();
  initCounterAnimations();
  initGlassRippleAnimation();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', function() {
    toggle.classList.toggle('active');
    nav.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  });

  // Close menu when clicking a link
  const navLinks = nav.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      toggle.classList.remove('active');
      nav.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });

  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      toggle.classList.remove('active');
      nav.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  });
}

/**
 * Mobile Dropdown Toggle
 */
function initMobileDropdowns() {
  const dropdownParents = document.querySelectorAll('.has-dropdown');

  dropdownParents.forEach(parent => {
    const link = parent.querySelector('.nav-link');

    if (!link) return;

    link.addEventListener('click', function(e) {
      // Only toggle on mobile
      if (window.innerWidth <= 768) {
        e.preventDefault();
        parent.classList.toggle('active');

        // Close other dropdowns
        dropdownParents.forEach(other => {
          if (other !== parent) {
            other.classList.remove('active');
          }
        });
      }
    });
  });

  // Reset dropdowns on window resize
  window.addEventListener('resize', debounce(function() {
    if (window.innerWidth > 768) {
      dropdownParents.forEach(parent => {
        parent.classList.remove('active');
      });
    }
  }, 100));
}

/**
 * Sticky Header with Shadow on Scroll
 */
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;
  const scrollThreshold = 100;

  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;

    // Add shadow when scrolled
    if (currentScroll > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Hide/show header on scroll (optional - comment out if not desired)
    // if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
    //   header.style.transform = 'translateY(-100%)';
    // } else {
    //   header.style.transform = 'translateY(0)';
    // }

    lastScroll = currentScroll;
  });
}

/**
 * FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    if (!question) return;

    question.addEventListener('click', function() {
      // Close other items (optional - remove for multi-open)
      const isActive = item.classList.contains('active');

      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });

      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      if (href === '#') return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();

        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Form Validation
 */
function initFormValidation() {
  const forms = document.querySelectorAll('form[data-validate]');

  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      let isValid = true;
      const inputs = form.querySelectorAll('[required]');

      // Clear previous errors
      form.querySelectorAll('.form-error').forEach(error => error.remove());
      form.querySelectorAll('.error').forEach(input => input.classList.remove('error'));

      // Validate each required field
      inputs.forEach(input => {
        if (!validateInput(input)) {
          isValid = false;
          showError(input);
        }
      });

      if (isValid) {
        // Form is valid - submit or handle
        handleFormSubmit(form);
      }
    });

    // Real-time validation
    form.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('blur', function() {
        if (this.hasAttribute('required')) {
          if (validateInput(this)) {
            this.classList.remove('error');
            const error = this.parentElement.querySelector('.form-error');
            if (error) error.remove();
          }
        }
      });
    });
  });
}

function validateInput(input) {
  const value = input.value.trim();
  const type = input.type;

  if (!value) return false;

  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  if (type === 'tel') {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(value);
  }

  return true;
}

function showError(input) {
  input.classList.add('error');

  const errorMessage = document.createElement('span');
  errorMessage.className = 'form-error';
  errorMessage.textContent = input.dataset.errorMessage || 'This field is required';

  input.parentElement.appendChild(errorMessage);
}

function handleFormSubmit(form) {
  const submitBtn = form.querySelector('[type="submit"]');
  const originalText = submitBtn.textContent;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  // Simulate form submission (replace with actual GoHighLevel integration)
  setTimeout(() => {
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'form-success';
    successMessage.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Thank you! We'll be in touch soon.</span>
    `;

    form.innerHTML = '';
    form.appendChild(successMessage);
  }, 1000);
}

/**
 * Scroll Animations
 */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');

  if (!animatedElements.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => {
    observer.observe(el);
  });
}

/**
 * Counter Animation for Metrics (preserves inner HTML with % suffix spans)
 */
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');

  counters.forEach(counter => {
    const target = parseInt(counter.dataset.counter, 10);
    // Capture any suffix HTML (e.g. the <span> with %) that comes after the number
    const suffixHTML = counter.innerHTML.replace(/^\d+/, '');

    const animateCount = () => {
      const duration = 1800;
      const start = performance.now();

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        counter.innerHTML = current + suffixHTML;

        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(counter);
  });
}

// Backward compat alias
function animateCounters() { initCounterAnimations(); }

/**
 * Utility: Debounce Function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Utility: Throttle Function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Glass Ripple Animation with Node/Circuit Pattern
 * Creates a fragmented glass effect with rippling nodes
 */
function initGlassRippleAnimation() {
  const canvas = document.getElementById('glassRippleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let nodes = [];
  let ripples = [];
  let mouseX = -1000;
  let mouseY = -1000;

  // Configuration
  const config = {
    nodeCount: 80,
    nodeRadius: 2,
    connectionDistance: 150,
    rippleSpeed: 2,
    rippleMaxRadius: 300,
    rippleFadeSpeed: 0.015,
    mouseInfluenceRadius: 200,
    baseAlpha: 0.15,
    glowIntensity: 0.4
  };

  // Resize canvas to match container
  function resizeCanvas() {
    const hero = canvas.closest('.hero');
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx.scale(dpr, dpr);

    // Reinitialize nodes on resize
    initNodes(rect.width, rect.height);
  }

  // Create nodes in a semi-random grid pattern (circuit-like)
  function initNodes(width, height) {
    nodes = [];
    const gridSize = 80;
    const cols = Math.ceil(width / gridSize) + 1;
    const rows = Math.ceil(height / gridSize) + 1;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Add randomness to grid positions for organic feel
        if (Math.random() > 0.3) {
          nodes.push({
            x: i * gridSize + (Math.random() - 0.5) * gridSize * 0.8,
            y: j * gridSize + (Math.random() - 0.5) * gridSize * 0.8,
            baseX: i * gridSize,
            baseY: j * gridSize,
            vx: 0,
            vy: 0,
            radius: config.nodeRadius + Math.random() * 1.5,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.02
          });
        }
      }
    }

    // Limit total nodes
    if (nodes.length > config.nodeCount) {
      nodes = nodes.sort(() => Math.random() - 0.5).slice(0, config.nodeCount);
    }
  }

  // Create a ripple effect
  function createRipple(x, y) {
    ripples.push({
      x: x,
      y: y,
      radius: 0,
      alpha: 0.6,
      lineWidth: 2
    });
  }

  // Auto-generate ripples periodically
  function autoRipple(width, height) {
    if (Math.random() < 0.008) {
      createRipple(
        Math.random() * width,
        Math.random() * height
      );
    }
  }

  // Update ripples
  function updateRipples() {
    ripples = ripples.filter(ripple => {
      ripple.radius += config.rippleSpeed;
      ripple.alpha -= config.rippleFadeSpeed;
      ripple.lineWidth = Math.max(0.5, 2 - ripple.radius / 100);
      return ripple.alpha > 0 && ripple.radius < config.rippleMaxRadius;
    });
  }

  // Update node positions with subtle movement
  function updateNodes(width, height) {
    const time = Date.now() * 0.001;

    nodes.forEach(node => {
      // Subtle floating animation
      node.x = node.baseX + Math.sin(time + node.pulsePhase) * 3;
      node.y = node.baseY + Math.cos(time * 0.7 + node.pulsePhase) * 3;

      // Mouse influence - nodes gently move away
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < config.mouseInfluenceRadius && dist > 0) {
        const force = (config.mouseInfluenceRadius - dist) / config.mouseInfluenceRadius;
        node.x += (dx / dist) * force * 15;
        node.y += (dy / dist) * force * 15;
      }

      // Update pulse phase
      node.pulsePhase += node.pulseSpeed;
    });
  }

  // Draw the glass effect
  function draw(width, height) {
    ctx.clearRect(0, 0, width, height);

    const time = Date.now() * 0.001;

    // Draw connections between nearby nodes (circuit lines)
    ctx.lineCap = 'round';

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.connectionDistance) {
          const alpha = (1 - dist / config.connectionDistance) * config.baseAlpha;

          // Create gradient for glass-like connection
          const gradient = ctx.createLinearGradient(
            nodes[i].x, nodes[i].y,
            nodes[j].x, nodes[j].y
          );
          gradient.addColorStop(0, `rgba(75, 168, 240, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(75, 168, 240, ${alpha * 0.8})`);
          gradient.addColorStop(1, `rgba(75, 168, 240, ${alpha})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw ripples with glass refraction effect
    ripples.forEach(ripple => {
      // Outer ring
      ctx.strokeStyle = `rgba(75, 168, 240, ${ripple.alpha * 0.5})`;
      ctx.lineWidth = ripple.lineWidth;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow ring
      ctx.strokeStyle = `rgba(75, 168, 240, ${ripple.alpha * 0.3})`;
      ctx.lineWidth = ripple.lineWidth * 2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Affect nearby nodes (glass distortion effect)
      nodes.forEach(node => {
        const dx = node.x - ripple.x;
        const dy = node.y - ripple.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (Math.abs(dist - ripple.radius) < 30) {
          const intensity = (1 - Math.abs(dist - ripple.radius) / 30) * ripple.alpha;
          node.x += (dx / dist) * intensity * 2;
          node.y += (dy / dist) * intensity * 2;
        }
      });
    });

    // Draw nodes with glass-like glow
    nodes.forEach(node => {
      const pulse = Math.sin(node.pulsePhase) * 0.3 + 0.7;
      const glowRadius = node.radius * 3;

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, glowRadius
      );
      glowGradient.addColorStop(0, `rgba(75, 168, 240, ${config.glowIntensity * pulse})`);
      glowGradient.addColorStop(0.5, `rgba(75, 168, 240, ${config.glowIntensity * 0.3 * pulse})`);
      glowGradient.addColorStop(1, 'rgba(75, 168, 240, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core node
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw subtle hexagonal fragments for glass texture
    drawGlassFragments(width, height, time);
  }

  // Draw subtle hexagonal glass fragments
  function drawGlassFragments(width, height, time) {
    const fragmentSize = 120;
    const cols = Math.ceil(width / fragmentSize) + 1;
    const rows = Math.ceil(height / fragmentSize) + 1;

    ctx.strokeStyle = 'rgba(75, 168, 240, 0.03)';
    ctx.lineWidth = 1;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * fragmentSize + (j % 2) * (fragmentSize / 2);
        const y = j * fragmentSize * 0.866;

        // Subtle animation
        const offset = Math.sin(time * 0.5 + i * 0.3 + j * 0.2) * 2;

        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const angle = (k * Math.PI) / 3 - Math.PI / 6;
          const px = x + Math.cos(angle) * (fragmentSize / 2 + offset);
          const py = y + Math.sin(angle) * (fragmentSize / 2 + offset);

          if (k === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // Animation loop
  function animate() {
    const hero = canvas.closest('.hero');
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    autoRipple(width, height);
    updateRipples();
    updateNodes(width, height);
    draw(width, height);

    animationId = requestAnimationFrame(animate);
  }

  // Event listeners
  const hero = canvas.closest('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    hero.addEventListener('mouseleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    hero.addEventListener('click', (e) => {
      const rect = hero.getBoundingClientRect();
      createRipple(e.clientX - rect.left, e.clientY - rect.top);
    });
  }

  // Handle resize
  window.addEventListener('resize', debounce(resizeCanvas, 150));

  // Initialize
  resizeCanvas();
  animate();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
}
