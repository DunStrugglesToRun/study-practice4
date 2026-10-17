const fs = require('node:fs');
const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const ENTRY = 'styles/style.scss';
const OUT_CSS = 'styles/style.css';
const OUT_MIN = 'styles/style.min.css';
const WATCH_DIR = 'styles';

async function build() {
  const start = Date.now();
  try {
    // 1. SCSS -> CSS
    const { css } = sass.compile(ENTRY, {
      style: 'expanded',
      sourceMap: false,
      silenceDeprecations: ['import'],
    });

    // 2. Autoprefix -> readable style.css
    const prefixed = await postcss([autoprefixer]).process(css, { from: undefined });
    fs.writeFileSync(OUT_CSS, prefixed.css);

    // 3. Minify -> style.min.css
    const minified = await postcss([cssnano({ preset: 'default' })]).process(prefixed.css, { from: undefined });
    fs.writeFileSync(OUT_MIN, minified.css);

    console.log(`[${new Date().toLocaleTimeString()}] Built in ${Date.now() - start}ms`);
  } catch (err) {
    // keep the watcher alive on syntax errors, like Prepros does
    console.error(`[${new Date().toLocaleTimeString()}] Build failed:\n${err.message}`);
    if (!process.argv.includes('--watch')) process.exit(1);
  }
}

build();

if (process.argv.includes('--watch')) {
  let timer;
  fs.watch(WATCH_DIR, { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith('.scss')) return; // ignore our own .css output
    clearTimeout(timer);
    timer = setTimeout(build, 100); // debounce rapid saves
  });
  console.log(`Watching ${WATCH_DIR}/ for .scss changes...`);
}