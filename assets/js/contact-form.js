// Studio Loom — enquiry form submission handler.
// The form's `action` (contact page) is the Formspree endpoint; this sends an AJAX POST with
// an Accept: application/json header (Formspree's AJAX method) so visitors never leave our site.
// Success: the form is replaced by a thank-you with a WhatsApp button, and GA gets `form_submit`.
// Failure: the form and everything typed stay in place, with a short try-again message.
const WHATSAPP_URL = "https://wa.me/918800110317?text=Hi%20Studio%20Loom%2C%20I'd%20like%20to%20book%20a%20Studio%20Loom%20Consult.";

(function () {
  const form = document.getElementById('enquiry-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  // Deep link from a service page: /contact?service=Studio%20Loom%20Consult preselects that service type
  const wanted = new URLSearchParams(window.location.search).get('service');
  const select = form.querySelector('#service_type');
  if (wanted && select) {
    const match = Array.from(select.options).find((o) => o.value === wanted || o.textContent.trim() === wanted);
    if (match) select.value = match.value;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status visible';
    status.textContent = 'Sending…';

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        // Swap the whole form for a confirmation so it's clear the enquiry went through
        status.className = 'form-status';
        status.textContent = '';
        form.reset();
        const section = document.getElementById('contact');
        const success = document.getElementById('form-success');
        if (section && success) {
          section.classList.add('is-sent');
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          success.focus({ preventScroll: true });
        } else {
          status.className = 'form-status visible success';
          status.textContent = "Thank you. We've received your details. We'll be in touch on WhatsApp soon.";
        }
        if (window.gtag) {
          window.gtag('event', 'form_submit');
          window.gtag('event', 'generate_lead'); // kept from before, in case a conversion is tied to it
        }
      } else {
        throw new Error('Form submission failed');
      }
    } catch (err) {
      status.className = 'form-status visible error';
      status.innerHTML =
        'Please try sending again, or message us on <a href="' + WHATSAPP_URL + '" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">WhatsApp</a>.';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
