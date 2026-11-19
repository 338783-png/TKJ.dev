// Central configuration for the TKJ.dev website.
// Values marked TODO must be completed before the site goes public
// (see "Before going live" in README.md). The build prints a warning for each.

export default {
  // Final public URL, without trailing slash. Used for canonical links, hreflang and sitemap.
  siteUrl: 'https://tkj.dev',

  brand: {
    name: 'TKJ.dev',
    signature: 'Technology. Knowledge. Innovation.',
  },

  // Languages: the first one is the default and is served at the site root.
  languages: ['en', 'it', 'fr'],

  contact: {
    // Public professional email address shown on the site.
    email: 'TODO@tkj.dev',
    // Form endpoint that accepts POST requests (e.g. Formspree, Basin, or your own API).
    // Leave empty to fall back to opening the visitor's email client (mailto).
    formEndpoint: '',
  },

  // Legal information displayed in the footer and in the privacy policy.
  // Required by Italian law once the activity is registered (e.g. Partita IVA on the website).
  // Fill in only after the commercialista has validated the legal form.
  legal: {
    legalName: 'TODO',      // Legal name of the business / owner
    vatNumber: 'TODO',      // Partita IVA
    address: 'TODO',        // Registered office / domicilio fiscale
    pec: '',                // PEC address, if any
    rea: '',                // REA number, only for a registered ditta individuale
  },

  privacy: {
    // How long contact-form messages are kept when no contract follows.
    retentionMonths: 12,
    // Date of the last update of the privacy policy (YYYY-MM-DD).
    lastUpdated: '2026-11-19',
    // Hosting provider that processes server logs on your behalf.
    hostingProvider: 'TODO',
  },
};
