'use strict'

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y'

const Conf = require('conf')
const path = require('path')
const crypto = require('crypto')
const lo = require('lodash')
const loadJson = require('load-json-file')
const writeJson = require('write-json-file')
const jsonStableStringify = require('json-stable-stringify')
const revHash = require('rev-hash')
const makeDir = require('make-dir')
const writeFileAtomic = require('write-file-atomic')

class JsonStore extends Conf {
  constructor (name = 'config', dir, ...opts) {
    if (!dir) dir = 'store'
    if (!opts) opts = {}

    const conf = {
      configName: name,
      cwd: path.resolve(process.cwd(), dir)
    }

    super({ ...opts, ...conf })

    this.defaultData = opts.defaults
  }

  set (key, val) {
    if (lo.isArray(key)) key = key.join('.')
    super.set(key, val)
  }

  concat (path, array = [], uniq = false) {
    if (!lo.isArray(array)) array = [array]
    if (!lo.isArray(this.get(path, []))) this.set(path, [this.get(path)])
    if (uniq) {
      this.set(path, lo.union(this.get(path, []), array))
    } else {
      this.set(path, lo.concat(this.get(path, []), array))
    }
  }

  reset () {
    this.store = this.defaultData
  }

  get size () {
    if (lo.isArray(this.store)) return this.store.length
    return Object.keys(this.store).length
  }

  set store (val) {
    makeDir.sync(path.dirname(this.path))

    let data = JSON.stringify(val, JsonStore.preserveFunctions, '\t')

    if (this.encryptionKey) {
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey)
      data = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()])
    }

    writeFileAtomic.sync(this.path, data)
    this.events.emit('change')
  }

  get store () {
    return super.store
  }

  * [Symbol.iterator] () {
    const store = this.store
    const iterator = lo.isArray(store) ? store : Object.keys(store)
    for (const key of iterator) {
      yield [key, store[key]]
    }
  }

  static load (source) {
    return lo.attempt(loadJson.sync, path.resolve(source))
  }

  static write (dest, data = {}, opts = {}) {
    lo.attempt(
      writeJson.sync(path.resolve(dest), data, {
        detectIndent: true,
        ...opts
      })
    )
  }

  static hash (obj) {
    if (lo.isString(obj)) return revHash(lo.kebabCase(obj))
    return revHash(jsonStableStringify(obj))
  }

  static preserveFunctions (key, value) {
    if (lo.isFunction(value)) {
      return value.toString() || undefined
    }
    return value
  }
}

module.exports = JsonStore
