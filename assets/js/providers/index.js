/**
 * Providers — how a form reaches the service behind its action, one module
 * per service, shared by the form (features/form.js) and newsletter
 * (components/newsletter.js) scripts.
 *
 * A provider is { match(url), send(url, form) }. send resolves to
 * { success, message, details }: message is the service's own answer, if any,
 * details what it sent back, for the console. The first provider whose
 * match(url) is true sends the form, else the default one: another service is
 * one more module in PROVIDERS.
 */
import brevo from './brevo';
import mailchimp from './mailchimp';
import defaultProvider from './default';

const PROVIDERS = [brevo, mailchimp];

export function getProvider(url) {
  return PROVIDERS.find((provider) => provider.match(url)) || defaultProvider;
}
