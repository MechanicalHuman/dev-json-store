'use strict'

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y'

const Conf = require('conf')
const config = require('config')
const path = require('path')
const lodash = require('lodash')

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
}

module.exports = JsonStore
