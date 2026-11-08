/**
 * Mailchimp (*.list-manage.com) blocks CORS on /subscribe/post, so the fields
 * go through JSONP on /subscribe/post-json: { result: 'success' | 'error', msg }
 * JSONP is a GET: files are dropped.
 */
const TIMEOUT = 15000;

export default {
  match: (url) => url.hostname.endsWith('.list-manage.com'),

  send(url, form) {
    return new Promise((resolve, reject) => {
      const endpoint = new URL(url);
      const callback = `mailchimp${Date.now()}`;
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Mailchimp timeout'));
      }, TIMEOUT);
      const cleanup = () => {
        clearTimeout(timeout);
        delete window[callback];
        script.remove();
      };

      window[callback] = (json) => {
        cleanup();
        // Field errors come prefixed with the field index, e.g. "0 - Please enter a value"
        const message = String(json.msg || '').replace(/^\d+ - /, '');
        resolve({ success: json.result === 'success', message, details: json });
      };

      endpoint.pathname = endpoint.pathname.replace(/\/post$/, '/post-json');
      new FormData(form).forEach((value, key) => {
        if (typeof value === 'string') {
          endpoint.searchParams.append(key, value);
        }
      });
      endpoint.searchParams.set('c', callback);

      script.src = endpoint.href;
      script.onerror = () => {
        cleanup();
        reject(new Error('Mailchimp request failed'));
      };
      document.head.append(script);
    });
  }
};
