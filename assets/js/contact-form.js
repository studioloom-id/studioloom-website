// Studio Loom — enquiry form submission handler.
// The form's `action` (contact page) is the Formspree endpoint; this sends an AJAX POST with
// an Accept: application/json header so the page stays put and shows a status message.
(function () {
  const form = document.getElementById('enquiry-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

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
        status.className = 'form-status visible success';
        status.textContent = "Thank you — we've received your enquiry and will be in touch shortly.";
        form.reset();
        if (window.gtag) window.gtag('event', 'generate_lead');
      } else {
        throw new Error('Form submission failed');
      }
    } catch (err) {
      status.className = 'form-status visible error';
      status.innerHTML =
        'Something went wrong sending the form. Please email us directly at <a href="mailto:projects@studioloom.co.in" style="color:inherit;">projects@studioloom.co.in</a> or call <a href="tel:+918800110317" style="color:inherit;">+91 8800 110 317</a>.';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
