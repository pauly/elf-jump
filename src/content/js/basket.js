/* global requestAnimationFrame localStorage */
((window, document) => {
  let config = {}
  try {
    config = JSON.parse(localStorage.getItem(process.env.npm_package_name))
  } catch (e) {
    console.log('config load failed', e)
  }

  let {
    best = 0,
    gravity = 0.10
  } = config

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#000'
  ctx.font = '16px Verdana'

  // better minifying
  const img = require('./img')
  const audio = require('./audio')
  const bing = audio('bing')

  const player = img('basket', canvas.width / 2 - 120, canvas.height - 100)
  const info = foo => Math.round(foo.cx) + ',' + Math.round(foo.cy) /* + ' ' + foo.width + 'x' + foo.height */ + ' 🚀' + foo.vy.toFixed(1)
  // const debug = foo => foo.src.split('/').pop() + ' ' + info(foo)
  const drawRelativeTo = ctx => player => obj => {
    const x = obj.cx // - player.cx + (ctx.canvas.width - obj.width) / 2 + obj.vx
    const y = obj.cy // - player.cy + (ctx.canvas.height - obj.height) / 2 + obj.vy
    ctx.drawImage(obj, x, y)
    if (process.env.NODE_ENV === 'development') {
      // ctx.strokeRect(x, y, obj.width, obj.height)
      // ctx.font = '10px ' // + font
      // console.log(info(obj), x, y)
      ctx.fillText(info(obj), x, y + obj.height + 10)
    }
  }

  const checkCollision = require('./checkCollision')

  let score = 0
  let playing = 1

  const move = (event, key, x) => {
    event.preventDefault()
    if (!playing) return window.location.reload() // reload the page
    key = event.key
    x = event.clientX
    if (/right/i.test(key) || (x > canvas.width / 2)) {
      player.vx = Math.max(2, player.vx + 1)
    }
    if (/left/i.test(key) || (x < canvas.width / 2)) {
      player.vx = Math.min(-2, player.vx - 1)
    }
    if (/q/i.test(key)) {
      playing = 0
    }
  }

  document.addEventListener('keydown', move)
  document.addEventListener('click', move)

  const random = n => Math.floor(Math.random() * n)

  const products = ['sprout', 'beer', 'burger']
  const item = [
    img('sprout', canvas.width / 2, 0)
  ]

  function animate (timestamp) {
    if (playing) requestAnimationFrame(animate)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'

    const right = canvas.width - player.width / 2
    if (player.cx > right) {
      player.cx = right
      player.vx = 0
    }
    const left = -player.width / 2
    if (player.cx < left) {
      player.cx = left
      player.vx = 0
    }

    for (let i = 0; i < item.length; i++) {
      item[i].vy += gravity
      item[i].cy += item[i].vy
      if (checkCollision(player, item[i])) {
        console.log(info(player), 'and', info(item[i]), 'collide!')
        item.splice(i, 1)
        if (score++ > best) best = score
        bing.play()
      } else {
        drawRelativeTo(ctx)(player)(item[i])
      }
    }

    player.cx += player.vx
    player.src = 'img/basket-' + (player.vx > 1 ? 'right' : 'left') + '.png'

    drawRelativeTo(ctx)(player)(player)

    if (random(1000) > 990) {
      const x = random(canvas.width - 100) + 50
      const y = 0
      const product = products[random(products.length)]
      console.log({ x, y, product })
      item.push(img(product, x, y))
    }

    // config.best = best
    // localStorage.setItem(process.env.npm_package_name, JSON.stringify(config))

    ctx.strokeStyle = '#000'
    if (!playing) {
      ctx.fillText('◀️ and ▶️ to move', 10, 40)
    }
    const scoreText = 'Score: ' + score + (playing ? '' : ' GAME OVER!')
    ctx.fillText(scoreText, 10, canvas.height - 40)
    ctx.fillText('Best: ' + best, 10, canvas.height - 20)
  }

  requestAnimationFrame(animate)
})(window, document)
