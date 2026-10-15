document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
    });

    // Close menu when clicking outside or clicking a link
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
        navLinks.classList.remove('active');
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // Fast, Crisp Morphing Animation (Runs Once, Unified letter i)
  const stageV3 = document.getElementById('stageV3');
  const stageWord = document.getElementById('stageWord');
  const charV = document.getElementById('charV');
  const charA = document.getElementById('charA');
  const charN = document.getElementById('charN');
  const charT = document.getElementById('charT');
  const charR = document.getElementById('charR');
  const fullI = document.getElementById('fullI');

  if (stageV3 && stageWord && charV && charA && charN && charT && charR && fullI) {
    // Stage 1: Brief presentation of V3 (500ms)
    setTimeout(() => {
      // Stage 2: Quick dissolve of V3
      stageV3.classList.add('dissolving');

      setTimeout(() => {
        stageV3.classList.add('hidden');

        // Stage 3: Fast, snappy letter arrival (V-a-n-t-r-i)
        charV.classList.add('visible');
        setTimeout(() => charA.classList.add('visible'), 60);
        setTimeout(() => charN.classList.add('visible'), 120);
        setTimeout(() => charT.classList.add('visible'), 180);
        setTimeout(() => charR.classList.add('visible'), 240);
        setTimeout(() => {
          fullI.classList.add('visible'); // Complete letter i with dot attached to body
          stageWord.classList.add('locked');
        }, 300);
      }, 200);
    }, 550);
    // Runs ONCE — does not loop or restart
  }

  // Modal Functionality
  const modal = document.getElementById('contactModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalInterest = document.getElementById('modalInterest');
  const modalClose = document.getElementById('modalClose');

  window.openModal = function (interestTitle = 'General Inquiry') {
    if (modal) {
      if (modalTitle) modalTitle.textContent = `Get In Touch: ${interestTitle}`;
      if (modalInterest) modalInterest.value = interestTitle;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeModal = function () {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (modalClose) {
    modalClose.addEventListener('click', window.closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.closeModal();
      }
    });
  }

  // Handle Form Submission
  const inquiryForm = document.getElementById('inquiryForm');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('userName')?.value || 'Guest';
      const email = document.getElementById('userEmail')?.value || '';
      const interest = modalInterest?.value || 'Technology';
      
      alert(`Thank you, ${name}! Your inquiry regarding "${interest}" has been received. Our Vantri tech team will connect with you at ${email} shortly.`);
      inquiryForm.reset();
      window.closeModal();
    });
  }

  // Leadership Carousel Mobile Dot Controller
  const leadershipGrid = document.getElementById('leadershipGrid');
  const leadNavBtns = document.querySelectorAll('.lead-nav-btn');

  if (leadershipGrid && leadNavBtns.length > 0) {
    // Dot click scrolling
    leadNavBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const cardWidth = leadershipGrid.offsetWidth;
        leadershipGrid.scrollTo({
          left: idx * cardWidth,
          behavior: 'smooth'
        });
        leadNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Sync active dot on touch swipe
    leadershipGrid.addEventListener('scroll', () => {
      const scrollLeft = leadershipGrid.scrollLeft;
      const cardWidth = leadershipGrid.offsetWidth;
      const activeIdx = Math.round(scrollLeft / cardWidth);
      leadNavBtns.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === activeIdx);
      });
    }, { passive: true });
  }
});
