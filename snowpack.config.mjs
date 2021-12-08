/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  mount: {
    public: { url: '/', static: true },
    'src/tones': { url: '/tones', static: true },
    'src/background': '/',
    'src/popup': '/',
    src: { url: '/dist' },
  },
  plugins: [
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-typescript',
    '@snowpack/plugin-postcss',
    'snowpack-svgr-plugin',
  ],
  devOptions: {
    tailwindConfig: './tailwind.config.js',
    open: 'none',
  },
  buildOptions: {
    metaUrlPath: 'private/snowpack',
  },
  alias: {
    '@src': './src',
    '@popup': './src/popup',
    '@background': './src/background',
  },
  routes: [
    /* Enable an SPA Fallback in development: */
    // {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
  optimize: {
    bundle: true,
    minify: true,
    target: 'es2020',
  },
  packageOptions: {
    /* ... */
  },
};
