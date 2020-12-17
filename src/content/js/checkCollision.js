module.exports = (obj1, obj2) => {
  const left = obj => obj.cx - obj.width / 2
  const right = obj => left(obj) + obj.width
  const top = obj => obj.cy - obj.height / 2
  const bottom = obj => top(obj) + obj.height

  if (left(obj1) > right(obj2)) return 0
  if (left(obj2) > right(obj1)) return 0
  if (top(obj1) > bottom(obj2)) return 0
  if (top(obj2) > bottom(obj1)) return 0

  // if last time obj1 was above obj2 then it's a landing
  // remember > means further down the page
  // console.log('compare', bottom(obj1), '-', gravity, 'with', top(obj2))
  if (bottom(obj1) - obj1.vy < top(obj2)) return 2

  return 1
}
