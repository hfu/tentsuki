const config = require('config')
const fs = require('fs')
const es = require('event-stream')
const tilebelt = require('@mapbox/tilebelt')
const bbox = require('@turf/bbox').default

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

const work = async (src, encoding) => {
  return new Promise((resolve) => {
    const s = fs.createReadStream(src, { encoding: encoding })
      .pipe(es.split())
      .pipe(es.mapSync(line => {
        s.pause()
        if (line.length === 0) return
        const f = JSON.parse(line)
        const b = bbox(f)
        const w = [[0, 1], [0, 3], [2, 1], [2, 3]].map(v => {
          const [x, y, z] = tilebelt.pointToTile(b[v[0]], b[v[1]], config.get('z'))
          return `${z}-${x}-${y}`
        }).filter((x, i, self) => self.indexOf(x) === i)
        for (const w3n of w) {
          streamWrite(w3n,`${JSON.stringify(f)}\n`)
        }
        if (++count % 10000 === 0) status(count, w[0], src)
        s.resume()
      })
      .on('error', err => {
        console.log(err)
      })
      .on('end', () => {
        status(count, '-', src)
        resolve()
      })
    )
  })
}

const main = async () => {
  for (let src of config.get('srcs')) {
    await work(src, config.get('encoding'))
  }
  for (const w3n in streams) {
    streams[w3n].close()
  }
}

main()
