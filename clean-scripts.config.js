const childProcess = require('child_process')
const util = require('util')
const { Service } = require('clean-scripts')

const execAsync = util.promisify(childProcess.exec)

const tsFiles = `"src/**/*.ts" "src/**/*.tsx" "spec/**/*.ts" "demo/**/*.ts" "demo/**/*.tsx" "screenshots/**/*.ts"`
const lessFiles = `"src/**/*.less"`
const jsFiles = `"*.config.js"`

module.exports = {
  build: [
    `rimraf dist`,
    `mkdirp dist`,
    {
      js: [
        {
          vue: `file2variable-cli src/vue.template.html -o src/vue-variables.ts --html-minify --base src`,
          angular: `file2variable-cli src/angular.template.html -o src/angular-variables.ts --html-minify --base src`
        },
        `ngc -p src`,
        `tsc -p demo`,
        `webpack --display-modules --config demo/webpack.config.js`
      ],
      css: [
        `lessc src/file-uploader.less > src/file-uploader.css`,
        `postcss src/file-uploader.css -o dist/file-uploader.css`,
        `cleancss -o dist/file-uploader.min.css dist/file-uploader.css`,
        `cleancss -o demo/index.bundle.css dist/file-uploader.min.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css`
      ],
      clean: `rimraf demo/**/index.bundle-*.js demo/index.bundle-*.css demo/demo-*.png demo/**/*.index.bundle-*.js`,
      cpy: `cpy src/lib.d.ts dist`
    },
    `rev-static --config demo/rev-static.config.js`
  ],
  lint: {
    ts: `tslint ${tsFiles}`,
    js: `standard ${jsFiles}`,
    less: `stylelint ${lessFiles}`,
    export: `no-unused-export ${tsFiles} ${lessFiles} --exclude "src/compiled/**/*"`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js',
    async () => {
      const { stdout } = await execAsync('git status -s')
      if (stdout) {
        console.log(stdout)
        throw new Error(`generated files doesn't match.`)
      }
    }
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`,
    less: `stylelint --fix ${lessFiles}`
  },
  release: `clean-release`,
  watch: {
    vue: `file2variable-cli src/vue.template.html -o src/vue-variables.ts --html-minify --base src --watch`,
    angular: `file2variable-cli src/angular.template.html -o src/angular-variables.ts --html-minify --base src --watch`,
    src: `tsc -p src --watch`,
    demo: `tsc -p demo --watch`,
    webpack: `webpack --config demo/webpack.config.js --watch`,
    less: `watch-then-execute "src/file-uploader.less" --script "clean-scripts build[2].css"`,
    rev: `rev-static --config demo/rev-static.config.js --watch`
  },
  screenshot: [
    new Service(`http-server -p 8000`),
    `tsc -p screenshots`,
    `node screenshots/index.js`
  ]
}
