'use strict'
const assert = require('assert')
const Cursor = require('../')
const pg = require('pg')

const text = 'SELECT generate_series as num FROM generate_series(0, 50)'

function poolQueryPromise(pool, readRowCount) {
  return new Promise((resolve, reject) => {
    pool.connect((err, client, done) => {
      if (err) {
        done(err)
        return reject(err)
      }
      const cursor = client.query(new Cursor(text))
      cursor.read(readRowCount, (err, res) => {
        if (err) {
          done(err)
          return reject(err)
        }
        cursor.close(err => {
          if (err) {
            done(err)
            return reject(err)
          }
          done()
          resolve()
        })
      })
    })
  })
}

describe('pool', function() {
  beforeEach(function() {
    this.pool = new pg.Pool({max: 1})
  })

  afterEach(function() {
    this.pool.end()
  })

  it('closes cursor early, single pool query', function(done) {
    poolQueryPromise(this.pool, 25)
      .then(() => done())
      .catch(err => {
        assert.ifError(err)
        done()
      })
  })

  it('closes cursor early, saturated pool', function(done) {
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(poolQueryPromise(this.pool, 25))
    }
    Promise.all(promises)
      .then(() => done())
      .catch(err => {
        assert.ifError(err)
        done()
      })
  })

  it('closes exhausted cursor, single pool query', function(done) {
    poolQueryPromise(this.pool, 100)
      .then(() => done())
      .catch(err => {
        assert.ifError(err)
        done()
      })
  })

  it('closes exhausted cursor, saturated pool', function(done) {
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(poolQueryPromise(this.pool, 100))
    }
    Promise.all(promises)
      .then(() => done())
      .catch(err => {
        assert.ifError(err)
        done()
      })
  })
})
