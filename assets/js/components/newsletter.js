/**
 * Newsletter — async signup, the provider's answer shown in .js-newsletter-message,
 * an .alert turned .alert-success or .alert-danger.
 * The provider is read from the form action:
 * - Brevo (*.sibforms.com) answers JSON and allows CORS:
 *   { success, message } or { success: false, errors: { FIELD: message } }
 * - Mailchimp (*.list-manage.com) blocks CORS on /subscribe/post, so the fields
 *   go through JSONP on /subscribe/post-json: { result: 'success' | 'error', msg }
 * - any other endpoint is posted with fetch and judged on the HTTP status.
 */
const forms = document.querySelectorAll('.js-newsletter-form');

const MAILCHIMP_TIMEOUT = 15000;

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

    const url = new URL(this.form.action);
    const data = new URLSearchParams(new FormData(this.form));

    this.form.classList.add('is-submitting');
    this.submit.disabled = true;

    let result;
    try {
      if (url.hostname.endsWith('.sibforms.com')) {
        result = await this.sendBrevo(url, data);
      } else if (url.hostname.endsWith('.list-manage.com')) {
        result = await this.sendMailchimp(url, data);
      } else {
        result = await this.sendDefault(url, data);
      }
    } catch (error) {
      console.error('Newsletter:', error);
      result = { success: false };
    }

    this.showResult(result);
  }

  async sendBrevo(url, data) {
    const response = await fetch(url, { method: 'POST', body: data });
    const json = await response.json();
    const errors = Object.values(json.errors || {}).join(' ');
    return { success: json.success === true, message: json.message || errors };
  }

  sendMailchimp(url, data) {
    return new Promise((resolve, reject) => {
      const callback = `newsletterMailchimp${Date.now()}`;
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Mailchimp timeout'));
      }, MAILCHIMP_TIMEOUT);
      const cleanup = () => {
        clearTimeout(timeout);
        delete window[callback];
        script.remove();
      };

      window[callback] = (json) => {
        cleanup();
        // Field errors come prefixed with the field index, e.g. "0 - Please enter a value"
        const message = String(json.msg || '').replace(/^\d+ - /, '');
        resolve({ success: json.result === 'success', message });
      };

      url.pathname = url.pathname.replace(/\/post$/, '/post-json');
      data.forEach((value, key) => url.searchParams.append(key, value));
      url.searchParams.set('c', callback);

      script.src = url.href;
      script.onerror = () => {
        cleanup();
        reject(new Error('Mailchimp request failed'));
      };
      document.head.append(script);
    });
  }

  async sendDefault(url, data) {
    const response = await fetch(url, { method: 'POST', body: data });
    return { success: response.ok };
  }

  showResult({ success, message }) {
    const i18n = window.i18n?.newsletter || {};

    this.form.classList.remove('is-submitting');
    this.form.classList.toggle('is-success', success);
    this.form.classList.toggle('has-error', !success);
    this.submit.disabled = false;

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
