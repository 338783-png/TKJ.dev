// Portfolio entries.
//
// Every entry MUST declare its type, so that visitors can always tell a real client
// contract from a demonstration. Never present a demo as client work, and never
// invent clients, testimonials, statistics or results.
//
//   type: 'client'    — work delivered under a real contract (with the client's permission to publish)
//         'personal'  — personal project
//         'demo'      — technical demonstration
//         'prototype' — prototype / proof of concept
//
// Optional fields:
//   page: key of a page on this site that hosts the project (see PAGES in build.mjs)
//   url:  external live link
//   repo: source code link

export default [
  {
    slug: 'csv-dashboard',
    type: 'demo',
    year: 2026,
    page: 'demo',
    stack: ['JavaScript', 'SVG', 'CSV', 'Intl API'],
    title: {
      en: 'CSV dashboard',
      it: 'Dashboard CSV',
      fr: 'Tableau de bord CSV',
    },
    summary: {
      en: 'Import a spreadsheet export, clean it automatically and get a monthly dashboard with key figures — entirely in the browser, no data uploaded.',
      it: 'Importa l’esportazione di un foglio di calcolo, la pulisce in automatico e genera una dashboard mensile con i dati chiave — tutto nel browser, senza caricare dati online.',
      fr: 'Importe l’export d’un tableur, le nettoie automatiquement et génère un tableau de bord mensuel avec les chiffres clés — entièrement dans le navigateur, sans envoi de données.',
    },
  },
];
