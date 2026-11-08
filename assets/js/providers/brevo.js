/**
 * Brevo (*.sibforms.com), the "serve" URL of a Brevo form. Posted as Brevo's
 * own script does (sibforms.com/forms/end-form/build/main.js): FormData, to
 * the action with ?isAjax=1, for its JSON answer, with CORS:
 * { success, message } or { success: false, errors: { FIELD: message } }
 * Brevo takes no file and one value per attribute: files are dropped, the
 * values of a repeated name (a group of checkboxes) joined in one.
 */
const SEPARATOR = ' ; ';

export default {
  match: (url) => url.hostname.endsWith('.sibforms.com'),

  async send(url, form) {
    const data = new FormData(form);
    const body = new FormData();
    new Set(data.keys()).forEach((name) => {
      const values = data
        .getAll(name)
        .filter((value) => typeof value === 'string');
      if (values.length) {
        body.append(name, values.filter(Boolean).join(SEPARATOR));
      }
    });

    const endpoint = new URL(url);
    endpoint.searchParams.set('isAjax', '1');
    const response = await fetch(endpoint, { method: 'POST', body });
    const json = await response.json();
    const errors = Object.values(json.errors || {}).join(' ');
    return {
      success: json.success === true,
      message: json.message || errors,
      details: json
    };
  }
};
