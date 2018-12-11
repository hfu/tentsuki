const config = require('config')
const fs = require('fs')
const readline = require('readline')
const tilebelt = require('@mapbox/tilebelt')
const bbox = require('@turf/bbox').default
const modify = require('./modify.js')

// You may want to 'ulimit -n 65536'

const streams = {}
const streamWrite = (w3n, s) => {
  if (!streams[w3n]) {
    streams[w3n] = fs.createWriteStream(`${config.get('dst')}/${w3n}.ndjson`)
  }
  streams[w3n].write(s)
}
let count = 0

const status = (count, w3n, src) => {
  console.error(`${(new Date()).toISOString()}: ${count} ${w3n} (${src})`)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

rl.on('line', line => {
  if (line.length === 0) return
  let f = JSON.parse(line)
  const b = bbox(f)
  const w = [[0, 1], [0, 3], [2, 1], [2, 3]].map(v => {
    const [x, y, z] = tilebelt.pointToTile(b[v[0]], b[v[1]], config.get('z'))
    return `${z}-${x}-${y}`
  }).filter((x, i, self) => self.indexOf(x) === i)
  f = modify(f)
  if (f) {
    if (++count % 10000 === 0) status(count, w[0], f.properties._src)
    for (const w3n of w) {
      streamWrite(w3n, `${JSON.stringify(f)}\n`)
    }
  }
})

rl.on('close', () => {
  for (const w3n in streams) {
    streams[w3n].close()
  }
})
