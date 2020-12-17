/* global Image */

module.exports = (file, x, y, vx, vy, elem) => {
  elem = new Image()
  elem.src = 'img/' + file + '.png'
  elem.cx = x
  elem.cy = y
  elem.vx = vx || 0
  elem.vy = vy || 0
  console.log('new', elem)
  return elem
}
