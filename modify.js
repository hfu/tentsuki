const maxzoom = 15

module.exports = (f) => {
  // 当面不要と思われる地物を削除する
  switch (f.properties.ftCode) {
    case '9201': // 仮想線
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

    case '3177': // <20>建築物
      f.tippecanoe.minzoom = 12
      f.tippecanoe.maxzoom = 12
      break
  }
  return f
}
