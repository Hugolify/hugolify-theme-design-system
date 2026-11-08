/**
 * Any other endpoint, judged on the HTTP status. It gets the body the form
 * posts natively: multipart with enctype="multipart/form-data" (the form
 * block, files included), urlencoded otherwise (the newsletter block).
 * The page itself (Netlify Forms) is posted as is; another origin (Formspree,
 * Fabform…) is asked for JSON, so that it answers instead of redirecting to
 * its own thank-you page.
 */
export default {
  async send(url, form) {
    const data = new FormData(form);
    // Read from the attribute: form.enctype is shadowed by a field named "enctype"
    const multipart =
      (form.getAttribute('enctype') || '').toLowerCase() ===
      'multipart/form-data';
    const headers =
      url.origin === window.location.origin
        ? {}
        : { Accept: 'application/json' };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: multipart ? data : new URLSearchParams(data)
    });
    return {
      success: response.ok,
      message: '',
      details: `${response.status} ${response.statusText}`
    };
  }
};
