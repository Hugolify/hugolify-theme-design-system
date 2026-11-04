/**
 * Form — async submission of form.js-form, loaded when params.form.ajax is on.
 * Without the script the form still posts natively: this only keeps the
 * visitor on the page and shows the answer in .js-form-message, an .alert
 * turned .alert-success or .alert-danger.
 *
 * The fields go out as FormData, the multipart body the form posts natively
 * (enctype="multipart/form-data"), files included:
 * - Netlify Forms: no action, the form posts to its own page
 * - any other endpoint (params.form.action: Formspree, Fabform…) is asked for
 *   JSON, so that it answers instead of redirecting to its own thank-you page
 * Both are judged on the HTTP status.
 */
const forms = document.querySelectorAll('.js-form');

class Form {
  constructor(form) {
    this.form = form;
    this.message = form.querySelector('.js-form-message');
    this.submit = form.querySelector('[type="submit"]');
    this.init();
  }

  init() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async handleSubmit(event) {
    event.preventDefault();

    // Read from the attribute: form.action is shadowed by a field named "action"
    const url = new URL(this.form.getAttribute('action') || window.location.href, document.baseURI);
    const headers = url.origin === window.location.origin ? {} : { Accept: 'application/json' };

    this.form.classList.add('is-submitting');
    this.submit.disabled = true;

    let success = false;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: new FormData(this.form)
      });
      success = response.ok;
      if (!success) {
        console.error('Form:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Form:', error);
    }

    this.showResult(success);
  }

  showResult(success) {
    const i18n = window.i18n?.form || {};

    this.form.classList.remove('is-submitting');
    this.form.classList.toggle('is-success', success);
    this.form.classList.toggle('has-error', !success);
    this.submit.disabled = false;

    this.message.textContent = (success ? i18n.success : i18n.error) || '';
    this.message.classList.toggle('alert-success', success);
    this.message.classList.toggle('alert-danger', !success);
    this.message.hidden = false;

    // The message sits above the submit button, alone once the fields are
    // hidden on success: the focus moves to it so it is both seen and read out.
    // Centered rather than scrolled to the top edge, under a sticky header.
    this.message.focus({ preventScroll: true });
    this.message.scrollIntoView({ block: 'center' });
  }
}

forms.forEach((form) => {
  new Form(form);
});
