/* global Image */

module.exports = (file, { x, y, vx, vy, dx, dy, f } = {}, obj) => {
  obj = new Image()
  obj.name = file
  obj.src = 'img/' + file + '.png'
  obj.type = file
  obj.f = f // optional frames
  obj.cx = x || 0
  obj.cy = y || 0
  obj.vx = vx || 0 // optional initial velocity x and y
  obj.vy = vy || 0
  obj.dx = dx || 0 // optional offset x and y compared to screen
  obj.dy = dy || 0
  // console.log('new', obj.name, obj.f, obj)

  // const draw = (ctx, x, y) => ctx.drawImage(obj, x, y)
  const info = foo => Math.round(foo.cx) + ',' + Math.round(foo.cy) + ' ' + foo.width + 'x' + foo.height + (foo.vy || foo.vx) ? (' 🚀' + foo.vx.toFixed(1) + ',' + foo.vy.toFixed(1)) : ''

  // @todo merge with draw when I have all the images
  obj.direct = (timestamp, frame, x, y) => {
    x = obj.vx < 0 ? -1 : 1
    y = obj.vy < 0 ? -1 : 1
    frame = (obj.f && obj.vx) ? (Math.round(timestamp) % obj.f + 1) : ''
    obj.src = 'img/' + file + frame + x + y + '.png'
    // console.log(player.src, player.cx)
  }

  // just draw with current coordinates
  obj.draw = (ctx, player, x, y) => {
    x = obj.cx
    y = obj.cy
    // if we pass in another obj, draw us relative to that obj
    if (player) {
      // x = obj.cx - player.cx + (ctx.canvas.width - obj.width) / 2 // + obj.vx
      // y = obj.cy - player.cy + (ctx.canvas.height - obj.height) / 2 // + obj.vy
      x = obj.cx - player.cx + player.dx - obj.width / 2 + obj.vx
      y = obj.cy - player.cy + player.dy - obj.height / 2 + obj.vy
    }
    // ctx.drawImage(obj, obj.cx, obj.cy)
    // draw(ctx, x, y)
    ctx.drawImage(obj, x, y)

    obj.top = obj.cy - obj.height / 2 + (obj.edge || 2)

    if (obj.n) {
      ctx.fillText(obj.n, x, y + obj.height / 2)
    }

    if (process.env.NODE_ENV === 'development') {
      // ctx.strokeRect(x, y, obj.width, obj.height)
      // ctx.font = '10px ' // + font
      // console.log(info(obj), x, y)
      ctx.fillText(info(obj), x, y + obj.height + 12)
    }
  }
  return obj
}
