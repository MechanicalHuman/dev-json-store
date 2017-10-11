'use strict'

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y'

const Conf = require('conf')
const config = require('config')
const path = require('path')
const lodash = require('lodash')
const loadJson = require('load-json-file')
const writeJson = require('write-json-file')
const jsonStableStringify = require('json-stable-stringify')
const revHash = require('rev-hash')

config.util.setModuleDefaults('store', {
  dir: path.resolve(process.cwd(), 'store')
})

class JsonStore extends Conf {
  constructor (name = 'config', dir = config.get('store.dir'), opts = {}) {
    const conf = {
      configName: name,
      cwd: path.resolve(dir)
    }

    super(lodash.defaults({}, conf, opts))
  }

  set (key, val) {
    if (lodash.isArray(key)) key = key.join('.')
    super.set(key, val)
  }

  concat (path, array = [], uniq = false) {
    if (!lodash.isArray(array)) array = [array]
    if (!lodash.isArray(this.get(path, []))) this.set(path, [this.get(path)])
    if (uniq) {
      this.set(path, lodash.union(this.get(path, []), array))
    } else {
      this.set(path, lodash.concat(this.get(path, []), array))
    }
  }

  static load (source) {
    return lodash.attempt(loadJson.sync, path.resolve(source))
  }

  static write (dest, data = {}, opts = {}) {
    lodash.attempt(
      writeJson.sync(path.resolve(dest), data, { detectIndent: true, ...opts })
    )
  }

  static hash (obj) {
    if (lodash.isString(obj)) return revHash(lodash.kebabCase(obj))
    return revHash(jsonStableStringify(obj))
  }
}

module.exports = JsonStore
