module.exports = ctx => player => obj => {
  const x = obj.cx - player.cx + (ctx.canvas.width - obj.width) / 2 + obj.vx
  const y = obj.cy - player.cy + (ctx.canvas.height - obj.height) / 2 + obj.vy
  try {
    ctx.drawImage(obj, x, y)
    if (process.env.NODE_ENV === 'development') {
      const info = foo => Math.round(foo.cx) + ',' + Math.round(foo.cy) /* + ' ' + foo.width + 'x' + foo.height */ + ' 🚀' + foo.vy.toFixed(2)
      // const debug = foo => foo.src.split('/').pop() + ' ' + info(foo)

      // ctx.strokeStyle = '#0f0'
      // ctx.strokeRect(x, y, obj.width, obj.height)
      ctx.font = '10px ' // + font
      ctx.fillText(info(obj), x, y + obj.height + 10)
    }
  } catch (e) {
    console.log('hmm could not draw', { obj, x, y }, e)
  }
}
