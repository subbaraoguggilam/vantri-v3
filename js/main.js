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

  // Automatic Animated Text Flow: V3 <-> VANTRI
  const brandMorph = document.getElementById('brandMorphText');
  if (brandMorph) {
    const states = [
      { text: "VANTRI", delay: 2600 },
      { text: "V3", delay: 2000 },
      { text: "VISION", delay: 1800 },
      { text: "VISUALIZE", delay: 1800 },
      { text: "VICTORY", delay: 1800 }
    ];
    let currentIndex = 0;

    function morphNext() {
      // Smooth fade out
      brandMorph.classList.add('fade-out');
      brandMorph.classList.remove('fade-in');

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % states.length;
        brandMorph.textContent = states[currentIndex].text;

        // Smooth fade in
        brandMorph.classList.remove('fade-out');
        brandMorph.classList.add('fade-in');

        // Schedule next transition
        setTimeout(morphNext, states[currentIndex].delay);
      }, 400); // Wait for CSS transition
    }

    // Start morph cycle
    setTimeout(morphNext, states[0].delay);
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
});
