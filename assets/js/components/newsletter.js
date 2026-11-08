/**
 * Newsletter — async signup, the provider's answer shown in .js-newsletter-message,
 * an .alert turned .alert-success or .alert-danger.
 * The hostname of the form action picks the provider that sends the form
 * (js/providers/: Brevo, Mailchimp, any other endpoint).
 */
import { getProvider } from '../providers/index';

const forms = document.querySelectorAll('.js-newsletter-form');

class Newsletter {
  constructor(form) {
    this.form = form;
    this.message = form.querySelector('.js-newsletter-message');
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
    // Hidden while sending, so that the same error shown again is announced again
    this.message.hidden = true;

    let result;
    try {
      result = await getProvider(url).send(url, this.form);
    } catch (error) {
      console.error('Newsletter:', error);
      result = { success: false };
    }

    this.showResult(result);
  }

  showResult({ success, message }) {
    const i18n = window.i18n?.newsletter || {};

    this.form.classList.remove('is-submitting');
    this.form.classList.toggle('is-success', success);
    this.form.classList.toggle('has-error', !success);
    this.submit.disabled = false;

    // An error leaves the focus on the form: it is a status message, which the
    // RGAA wants as role="alert" (7.5.2). A success takes the focus below (7.4).
    this.message.setAttribute('role', success ? 'status' : 'alert');
    this.message.textContent = this.toText(message) || (success ? i18n.success : i18n.error) || '';
    this.message.classList.toggle('alert-success', success);
    this.message.classList.toggle('alert-danger', !success);
    this.message.hidden = false;

    // On success the fields are hidden, so the focus moves to the message
    if (success) {
      this.message.focus();
    }
  }

  // Providers may send HTML (Mailchimp adds links), shown as plain text
  toText(html) {
    if (!html) return '';
    return new DOMParser().parseFromString(html, 'text/html').body.textContent.trim();
  }
}

forms.forEach((form) => {
  new Newsletter(form);
});
