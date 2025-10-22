const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  // `transpileDependencies` must be an array of dependency names/regexes.
  // It was incorrectly set to `true` which causes `map` errors in the Vue CLI.
  // Leave empty if you don't need to transpile any dependencies.
  transpileDependencies: []
})
