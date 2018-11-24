const geojsonArea = require('@mapbox/geojson-area')
const maxzoom = 15
let undefined

// the flap function:
// a function to return a function to dynamically assign maximum and minimim
// zoom levels from the area of the polygon geometry.
const flap = (minzoom, maxzoom, F) => {
  if (!F) F = 19 // default flap constant
  return (f) => {
    if (f.geometry.type !== 'MultiPolygon') return f
    f.tippecanoe.minzoom = Math.floor(
      F - Math.log2(geojsonArea.geometry(f.geometry)) / 2
    )
    if (f.tippecanoe.minzoom <= minzoom) {
      if (minzoom === 0) {
        // tippecanoe requires that minzoom should not be 0.
        delete f.tippecanoe.minzoom
      } else {
        f.tippecanoe.minzoom = minzoom
      }
    }
    if (f.tippecanoe.minzoom >= maxzoom) f.tippecanoe.minzoom = maxzoom
    return f
  }
}

// flap cache
const flaps = {
  area: flap(11, 15, 17)
}

module.exports = (f) => {
  // 当面不要と思われる地物を削除する
  switch (f.properties.ftCode) {
    case '9201': // 仮想線
      return null
    case undefined:
      return null
  }

  // デフォルトの tippecanoe 属性をセットする
  f.tippecanoe = {
    layer: f.properties.ftCode.substring(0, 2),
    minzoom: 10,
    maxzoom: maxzoom
  }
  switch (f.properties.orgGILvl) {
    case '200000':
      f.tippecanoe.maxzoom = 12
      break
    case '25000':
      f.tippecanoe.minzoom = 13
      break
    case '2500':
    case '1000':
      f.tippecanoe.minzoom = 14
  }

  // 当面不要と思われる属性を削除する
  delete f.properties.lfSpanFr
  delete f.properties.lfSpanTo
  delete f.properties.tmpFlg
  delete f.properties.admCode
  delete f.properties.devDate
  delete f.properties.type

  // see https://www.gsi.go.jp/common/000195806.pdf
  // see https://www.gsi.go.jp/common/000080761.pdf
  switch (f.properties.ftCode) {
    case '3101': // 普通建物
      f.tippecanoe.minzoom = maxzoom
      break
    case '3102': // 堅ろう建物
      f.tippecanoe.minzoom = maxzoom - 1
      break
    case '3103': // 高層建物
      f.tippecanoe.minzoom = maxzoom - 2
      break
    case '3177': // <20>建築物
      f.tippecanoe.mizoom = 12
      f.tippecanoe.maxzoom = 12
      let area = geojsonArea.geometry(f.geometry)
      // 面積が約 1000 m^2 未満の地物は採用しない
      if (area < 1000) {
        // console.error(`deleted ${JSON.stringify(f)} whose area was ${geojsonArea.geometry(f.geometry)}`)
        return null
      } else if (area > 5000) { // 面積が約 5000 m^2 以上の地物は z=11 から採用する
        f.tippecanoe.minzoom = 11
      }
      break

    case '7351': // 等高線::通常部
    case '7372': // 等高線::数値部
    case '7353': // 等高線::崖部
    case '7371': // 等深線::通常部
    case '7372': // 等深線::数値部
    case '7373': // 等深線::崖部
      f.tippecanoe.minzoom = maxzoom
      break

    case '7501': // 土崖::コンクリートや堅固な石積等の斜面
    case '7502': // 土崖::コンクリートや堅固な石積でない斜面
    case '7509': // 土崖（不明）
    case '7511': // 岩崖
      f.tippecanoe.minzoom = maxzoom
      break
  }
  return f
}
