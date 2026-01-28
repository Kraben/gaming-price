/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './script.js'],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    { pattern: /^(border|text)-(yellow|green|orange|blue)-(400|500|600)$/ }
  ],
};
