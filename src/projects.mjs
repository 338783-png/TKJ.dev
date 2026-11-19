// Portfolio entries.
//
// Every entry MUST declare its type, so that visitors can always tell a real client
// contract from a demonstration. Never present a demo as client work, and never
// invent clients, testimonials, statistics or results.
//
//   type: 'client'     — work delivered for a real client (published with the client's permission)
//         'internship' — work done during an internship in a company (not a TKJ.dev contract)
//         'personal'   — personal project
//         'academic'  — university project
//         'demo'      — technical demonstration
//         'prototype' — prototype / proof of concept
//
// Optional fields:
//   page: key of a page on this site that hosts the project (see PAGES in build.mjs)
//   url:  external live link
//   repo: source code link
//
// Entries are shown in this order; the first three also appear on the home page.

const GH = 'https://github.com/338783-png';

export default [
  {
    slug: 'sicmi',
    type: 'client',
    year: 2025,
    url: 'https://sicmi.vercel.app',
    repo: `${GH}/sicmi`,
    stack: ['Django', 'PostgreSQL', 'Cloudinary', 'Bootstrap'],
    title: {
      en: 'SICMI Sarl — company website',
      it: 'SICMI Sarl — sito aziendale',
      fr: 'SICMI Sarl — site d’entreprise',
    },
    summary: {
      en: 'Website for SICMI Sarl, an industrial construction and maintenance engineering company in Cameroon: services, projects, workshops and team, with an admin panel to keep the content up to date.',
      it: 'Sito per SICMI Sarl, società di ingegneria per costruzioni e manutenzione industriale in Camerun: servizi, progetti, officine e team, con un pannello di amministrazione per aggiornare i contenuti.',
      fr: 'Site pour SICMI Sarl, société d’ingénierie en construction et maintenance industrielle au Cameroun : services, projets, ateliers et équipe, avec une interface d’administration pour mettre à jour les contenus.',
    },
  },
  {
    slug: 'intergea-invoice-agent',
    type: 'internship',
    year: 2026,
    stack: ['Python', 'AI', 'FatturaPA', 'Automation'],
    title: {
      en: 'AI agent for invoice accounting — Holding Intergea Nord Est S.r.l.',
      it: 'Agente AI per la contabilizzazione delle fatture — Holding Intergea Nord Est S.r.l.',
      fr: 'Agent IA pour la comptabilisation des factures — Holding Intergea Nord Est S.r.l.',
    },
    summary: {
      en: 'Automation of electronic invoice accounting with Python software and an integrated AI module (Lombardy). Worked alongside the accounting department to capture the booking rules, built the module that records invoices autonomously, then tested and validated the automated process.',
      it: 'Automazione della contabilizzazione delle fatture elettroniche tramite un software Python con AI integrata (Lombardia). Affiancamento al reparto amministrativo per comprendere le regole di registrazione, sviluppo del modulo AI per la registrazione autonoma delle fatture, test e validazione del processo automatizzato.',
      fr: 'Automatisation de la comptabilisation des factures électroniques grâce à un logiciel Python avec IA intégrée (Lombardie). Travail aux côtés du service administratif pour comprendre les règles d’enregistrement, développement du module IA qui enregistre les factures de façon autonome, puis tests et validation du processus automatisé.',
    },
  },
  {
    slug: 'cv-express',
    type: 'personal',
    year: 2026,
    url: 'https://www.moncvexpress.com/',
    repo: `${GH}/CV`,
    stack: ['Python', 'PostgreSQL', 'Docker', 'Cloudflare'],
    title: {
      en: 'CV.express — online document generator',
      it: 'CV.express — generatore di documenti online',
      fr: 'CV.express — générateur de documents en ligne',
    },
    summary: {
      en: 'Live web application (moncvexpress.com): free creation of CVs, cover letters, requests and certificates, location maps and family trees as PDF, with European and African templates, in French, English and Italian. User accounts, email confirmation, automated tests and daily backups.',
      it: 'Applicazione web in produzione (moncvexpress.com): creazione gratuita in PDF di CV, lettere di presentazione, domande e attestati, piantine di localizzazione e alberi genealogici, con modelli europei e africani, in francese, inglese e italiano. Account utente, conferma via email, test automatici e backup giornalieri.',
      fr: 'Application web en production (moncvexpress.com) : création gratuite en PDF de CV, lettres de motivation, demandes et attestations, plans de localisation et arbres généalogiques, avec des modèles européens et africains, en français, anglais et italien. Comptes utilisateurs, confirmation par email, tests automatisés et sauvegardes quotidiennes.',
    },
  },
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
  {
    slug: 'library-monitoring',
    type: 'academic',
    year: 2026,
    repo: `${GH}/Sistema_di_Monitoraggio_biblioteca`,
    stack: ['Python', 'Flask', 'MQTT', 'JavaScript'],
    title: {
      en: 'Real-time monitoring of a smart library',
      it: 'Monitoraggio in tempo reale di una biblioteca',
      fr: 'Supervision en temps réel d’une bibliothèque',
    },
    summary: {
      en: 'IoT system for a multi-floor library: temperature, lighting and smoke sensors (simulated) publish over MQTT to a REST API that feeds a live dashboard with automatic fire alarms, climate and lighting control.',
      it: 'Sistema IoT per una biblioteca su più piani: sensori di temperatura, luce e fumo (simulati) pubblicano via MQTT verso un’API REST che alimenta una dashboard in tempo reale con allarme antincendio automatico, controllo del clima e dell’illuminazione.',
      fr: 'Système IoT pour une bibliothèque sur plusieurs étages : des capteurs de température, de lumière et de fumée (simulés) publient via MQTT vers une API REST qui alimente un tableau de bord en temps réel, avec alarme incendie automatique, gestion du climat et de l’éclairage.',
    },
  },
  {
    slug: 'immunotherapy-classification',
    type: 'academic',
    year: 2026,
    repo: `${GH}/machine-learning-immunotherapy-classification`,
    stack: ['Python', 'scikit-learn', 'pandas'],
    title: {
      en: 'Predicting immunotherapy outcomes',
      it: 'Previsione dell’esito di un’immunoterapia',
      fr: 'Prédiction du résultat d’une immunothérapie',
    },
    summary: {
      en: 'Machine learning classification of treatment outcomes: data exploration, a preprocessing pipeline, and a comparison of four models (logistic regression, KNN, SVM, random forest) with cross-validated hyperparameter search.',
      it: 'Classificazione con machine learning dell’esito del trattamento: analisi esplorativa, pipeline di preprocessing e confronto tra quattro modelli (regressione logistica, KNN, SVM, random forest) con ricerca degli iperparametri in cross-validation.',
      fr: 'Classification par machine learning du résultat du traitement : analyse exploratoire, pipeline de prétraitement et comparaison de quatre modèles (régression logistique, KNN, SVM, random forest) avec recherche d’hyperparamètres en validation croisée.',
    },
  },
  {
    slug: 'diabetes-classifier',
    type: 'academic',
    year: 2026,
    repo: `${GH}/proggetto_esame_machine_learning`,
    stack: ['Python', 'scikit-learn', 'pandas', 'matplotlib'],
    title: {
      en: 'Diabetes risk classifier',
      it: 'Classificatore del rischio di diabete',
      fr: 'Classification du risque de diabète',
    },
    summary: {
      en: 'Logistic regression on the Pima Indians dataset: preprocessing, 80/20 split, standardisation and evaluation — about 77% accuracy and a ROC-AUC of about 0.81 on the test set.',
      it: 'Regressione logistica sul dataset Pima Indians: preprocessing, split 80/20, standardizzazione e valutazione — accuratezza di circa il 77% e ROC-AUC di circa 0,81 sul test set.',
      fr: 'Régression logistique sur le jeu de données Pima Indians : prétraitement, découpage 80/20, standardisation et évaluation — environ 77 % de précision et un ROC-AUC d’environ 0,81 sur le jeu de test.',
    },
  },
];
