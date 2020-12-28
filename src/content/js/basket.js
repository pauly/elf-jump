/* global requestAnimationFrame localStorage */
((window, document) => {
  const id = 'basket-game'
  let config = {}
  try {
    config = JSON.parse(localStorage.getItem(id)) || {}
  } catch (e) {
    console.log('config load failed', e)
  }

  let {
    best = 0,
    gravity = 0.10
  } = config
  console.log({ config })

  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth - 20
  canvas.height = window.innerHeight - 100
  document.body.appendChild(canvas)

  /* if (!canvas) {
    return console.log('no canvas so no game')
  } */

  const ctx = canvas.getContext('2d')
  console.log(canvas.style.width, canvas.width, ctx.canvas.width)
  ctx.strokeStyle = '#000'
  ctx.font = '16px Verdana'

  // better minifying
  const img = require('./img')
  const audio = require('./audio')
  const bing = audio('bing')

  const player = img('basket', { x: canvas.width / 2 - 120, y: canvas.height - 100 })
  const checkCollision = require('./checkCollision')

  let score = 0
  let playing = 1

  const gameOver = () => {
    playing = 0
    config.best = best
    localStorage.setItem(id, JSON.stringify(config))
  }

  const move = (event, key, x) => {
    // event.preventDefault()
    key = event.key
    x = event.clientX
    if (/right/i.test(key) || (x > canvas.width / 2)) {
      if (!playing) return start()
      player.vx = Math.max(2, player.vx + 1)
    }
    if (/left/i.test(key) || (x < canvas.width / 2)) {
      if (!playing) return start()
      player.vx = Math.min(-2, player.vx - 1)
    }
    if (/q/i.test(key)) {
      gameOver()
    }
  }

  document.addEventListener('keydown', move)
  document.addEventListener('click', move)

  const random = n => Math.floor(Math.random() * n)

  // product keys and what they are disallowed for
  const products = {
    sprout: null,
    beer: 'T_TOTAL',
    burger: 'VEGI'
  }
  let item = []

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
        const checkbox = document.getElementById(products[item[i].name])
        console.log('got', item[i].name, checkbox && checkbox.checked)
        if (checkbox && checkbox.checked) {
          gameOver()
        } else {
          if (score++ > best) best = score
          bing.play()
        }
        item.splice(i, 1)
      } else {
        item[i].draw(ctx)
      }
    }

    player.cx += player.vx
    player.src = 'img/basket-' + (player.vx > 1 ? 'right' : 'left') + '.png'

    player.draw(ctx)

    if (random(1000) > 990) {
      const x = random(canvas.width - 100) + 50
      const y = 0
      const product = Object.keys(products)[random(Object.keys(products).length)]
      console.log({ x, y, product })
      item.push(img(product, { x, y }))
    }

    ctx.strokeStyle = '#000'
    if (!playing) {
      ctx.fillText('◀️ and ▶️ to move', 10, 40)
    }
    const scoreText = 'Score: ' + score + (playing ? '' : ' GAME OVER!')
    ctx.fillText(scoreText, 10, canvas.height - 40)
    ctx.fillText('Best: ' + best, 10, canvas.height - 20)
  }

  const start = () => {
    item = [img('sprout', { x: canvas.width / 2, y: 0 })]
    score = 0
    playing = 1
    requestAnimationFrame(animate)
  }
  start()
})(window, document)
