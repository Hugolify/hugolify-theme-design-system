/**
 * Form — async submission of form.js-form, loaded when params.form.ajax is on.
 * Without the script the form still posts natively: this only keeps the
 * visitor on the page and shows the answer in .js-form-message, an .alert
 * turned .alert-success or .alert-danger.
 *
 * The endpoint is the form action (the block's action, else params.form.action),
 * or the page itself for Netlify Forms. Its hostname picks the provider that
 * sends the form (js/providers/: Brevo, Mailchimp, any other endpoint).
 * The message is the form.success or form.error translation, not the
 * service's: one service form may serve every language of the site.
 */
import { getProvider } from '../providers/index';

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
    const url = new URL(
      this.form.getAttribute('action') || window.location.href,
      document.baseURI
    );

    this.form.classList.add('is-submitting');
    this.submit.disabled = true;

    let success = false;
    try {
      const result = await getProvider(url).send(url, this.form);
      success = result.success;
      if (!success) {
        console.error('Form:', result.message || result.details);
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
