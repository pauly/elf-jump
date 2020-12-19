/* global Image */

module.exports = (file, x, y, vx, vy, elem) => {
  elem = new Image()
  elem.name = file
  elem.src = 'img/' + file + '.png'
  elem.type = file
  elem.cx = x
  elem.cy = y
  elem.vx = vx || 0
  elem.vy = vy || 0
  console.log('new', elem.name, elem)
  return elem
}
