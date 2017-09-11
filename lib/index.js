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

config.util.setModuleDefaults('jsonStore', {dir: path.resolve(process.cwd(), 'store')})

class JsonStore extends Conf {
  constructor (name = 'config', dir = config.get('jsonStore.dir')) {
    super({
      configName: name,
      cwd: path.resolve(dir)
    })
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

  static write (dest, data) {
    writeJson.sync(path.resolve(dest), data, {detectIndent: true})
  }

  static hash (obj) {
    if (lodash.isString(obj)) obj = {o: obj}
    return revHash(jsonStableStringify(obj))
  }
}

module.exports = JsonStore
