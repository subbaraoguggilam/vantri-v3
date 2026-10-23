/**
 * Vantri (V3) Innovations - Certificate Verification & Dynamic Generator
 * Storage-efficient dynamic templating with zero-dependency QR code and instant PDF export
 */

(function () {
  'use strict';

  // In-memory default records (works even if file:// blocks local fetch)
  let CERTIFICATES_DATA = [
    {
      "id": "VNT-2024-001",
      "name": "Subbarao Guggilam",
      "workshop": "Generative AI & Autonomous Agent Architecture",
      "mode": "Offline Campus Bootcamp",
      "college": "Vantri Institute of Advanced Tech",
      "issueDate": "October 15, 2026",
      "founder": "Subbarao Guggilam",
      "founderRole": "Founder & CEO, Vantri (V3)",
      "cofounder": "Devabathini Veranjaneyulu",
      "cofounderRole": "Co-Founder, Vantri (V3)",
      "coordinator": "Dr. K. S. Raman",
      "coordinatorRole": "Academic & Workshop Coordinator"
    },
    {
      "id": "VNT-2024-002",
      "name": "Karthik Varma",
      "workshop": "AWS Cloud Foundations & DevOps Automation",
      "mode": "Online Live Workshop",
      "college": "National Institute of Technology",
      "issueDate": "October 18, 2026",
      "founder": "Subbarao Guggilam",
      "founderRole": "Founder & CEO, Vantri (V3)",
      "cofounder": "Devabathini Veranjaneyulu",
      "cofounderRole": "Co-Founder, Vantri (V3)",
      "coordinator": "Prof. R. M. Reddy",
      "coordinatorRole": "College Coordinator"
    },
    {
      "id": "VNT-2024-003",
      "name": "Pooja Sundaram",
      "workshop": "Prompt Engineering & Claude Vibe Coding",
      "mode": "Offline Campus Bootcamp",
      "college": "Sri Venkateswara University",
      "issueDate": "October 20, 2026",
      "founder": "Subbarao Guggilam",
      "founderRole": "Founder & CEO, Vantri (V3)",
      "cofounder": "Devabathini Veranjaneyulu",
      "cofounderRole": "Co-Founder, Vantri (V3)",
      "coordinator": "Dr. S. K. Lakshmi",
      "coordinatorRole": "Workshop Coordinator"
    },
    {
      "id": "VNT-2024-004",
      "name": "Naveen Teja",
      "workshop": "Robotic Process Automation (RPA) & Modern Web Systems",
      "mode": "Online Live Workshop",
      "college": "Aditya Engineering College",
      "issueDate": "October 22, 2026",
      "founder": "Subbarao Guggilam",
      "founderRole": "Founder & CEO, Vantri (V3)",
      "cofounder": "Devabathini Veranjaneyulu",
      "cofounderRole": "Co-Founder, Vantri (V3)",
      "coordinator": "Prof. V. Chaitanya",
      "coordinatorRole": "College Coordinator"
    }
  ];

  // Try fetching external JSON to keep records synchronized
  fetch('data/certificates.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        CERTIFICATES_DATA = data;
      }
    })
    .catch(() => {
      // In file:// protocol or offline, uses default CERTIFICATES_DATA seamlessly
    });

  // Get active certificates combining server JSON and any freshly issued certificates from admin portal
  function getActiveCertificates() {
    try {
      const local = localStorage.getItem('vantri_certificates');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return CERTIFICATES_DATA;
  }

  let currentCert = null;

  // Search and verify certificate by ID
  window.verifyCertificate = function (searchId) {
    const input = document.getElementById('certInputId');
    const query = (searchId || (input ? input.value : '')).trim().toUpperCase();

    const notFoundEl = document.getElementById('certNotFound');
    const resultWrapEl = document.getElementById('certResultWrap');

    if (!query) {
      if (input) input.focus();
      return;
    }

    const activeList = getActiveCertificates();
    const cert = activeList.find(c => c.id.toUpperCase() === query);

    if (!cert) {
      currentCert = null;
      if (resultWrapEl) resultWrapEl.style.display = 'none';
      if (notFoundEl) {
        notFoundEl.style.display = 'block';
        document.getElementById('notFoundQueryText').textContent = query;
      }
      return;
    }

    // Found match
    currentCert = cert;
    if (notFoundEl) notFoundEl.style.display = 'none';

    // Populate data into verification preview badge
    document.getElementById('resAttendeeName').textContent = cert.name;
    document.getElementById('resWorkshopTitle').textContent = cert.workshop;
    document.getElementById('resCertId').textContent = cert.id;
    document.getElementById('resIssueDate').textContent = cert.issueDate;
    document.getElementById('resCollege').textContent = cert.college + ' (' + cert.mode + ')';

    // Populate data into certificate template
    document.getElementById('certTplName').textContent = cert.name;
    document.getElementById('certTplWorkshop').textContent = cert.workshop;
    document.getElementById('certTplCollegeMode').textContent = 'Conducted in collaboration with ' + cert.college + ' • ' + cert.mode;
    document.getElementById('certTplId').textContent = cert.id;
    document.getElementById('certTplDate').textContent = cert.issueDate;

    document.getElementById('certTplFounderName').textContent = cert.founder || 'Subbarao Guggilam';
    document.getElementById('certTplFounderRole').textContent = cert.founderRole || 'Founder & CEO, Vantri (V3)';
    
    document.getElementById('certTplCofounderName').textContent = cert.cofounder || 'Devabathini Veranjaneyulu';
    document.getElementById('certTplCofounderRole').textContent = cert.cofounderRole || 'Co-Founder, Vantri (V3)';

    document.getElementById('certTplCoordName').textContent = cert.coordinator || 'Academic Coordinator';
    document.getElementById('certTplCoordRole').textContent = cert.coordinatorRole || 'College Workshop Coordinator';

    // Generate Dynamic Verification QR Code
    const verifyUrl = window.location.origin + window.location.pathname + '?verify=' + encodeURIComponent(cert.id) + '#certificates';
    const qrContainer = document.getElementById('certQrCodeBox');
    if (qrContainer && window.QRCode) {
      window.QRCode.renderTo(qrContainer, verifyUrl, {
        size: 96,
        margin: 1,
        colorDark: '#00227a',
        colorLight: '#ffffff'
      });
    }

    // Show result wrapper
    if (resultWrapEl) {
      resultWrapEl.style.display = 'block';
      setTimeout(() => {
        resultWrapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Quick fill and test
  window.testCertCode = function (code) {
    const input = document.getElementById('certInputId');
    if (input) input.value = code;
    window.verifyCertificate(code);
  };

  // Download Certificate as PDF
  window.downloadCertPDF = function () {
    if (!currentCert) return;

    const certElement = document.getElementById('printableCertificate');
    if (!certElement) return;

    // Show loading indicator on button
    const btn = document.getElementById('btnDownloadPDF');
    const origText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';

    // If html2pdf bundle is loaded via CDN or local
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: 0,
        filename: 'Vantri_Certificate_' + currentCert.id + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2.2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'landscape'
        }
      };

      html2pdf().set(opt).from(certElement).save().then(() => {
        if (btn) btn.innerHTML = origText;
      }).catch(err => {
        console.error('html2pdf error:', err);
        if (btn) btn.innerHTML = origText;
        window.print();
      });
    } else {
      // Fallback: Direct print dialog with tuned landscape CSS
      if (btn) btn.innerHTML = origText;
      window.print();
    }
  };

  // Direct print certificate
  window.printCertificate = function () {
    window.print();
  };

  // Copy Verification Link
  window.copyVerificationLink = function () {
    if (!currentCert) return;
    const url = window.location.origin + window.location.pathname + '?verify=' + encodeURIComponent(currentCert.id) + '#certificates';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Verification link copied to clipboard!\n' + url);
      });
    } else {
      prompt('Copy this verification URL:', url);
    }
  };

  // Check URL params on page load for auto-verification (QR code scan handling)
  document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyParam = urlParams.get('verify') || urlParams.get('id');

    if (verifyParam) {
      const input = document.getElementById('certInputId');
      if (input) input.value = verifyParam;
      setTimeout(() => {
        window.verifyCertificate(verifyParam);
      }, 500);
    }
  });

})();
