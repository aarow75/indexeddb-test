# npm install --save-dev babel-core babelify babel-preset-es2015 babel-preset-react browserify
# npm install --save-dev react react-dom fixed-data-table faker
# mkdir src
# mkdir dist
# touch src/main.js
browserify src/main.js -o dist/bundle.js -t [ babelify --presets [ es2015 react stage-2 ] ]
