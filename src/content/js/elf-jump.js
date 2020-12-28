/* global requestAnimationFrame localStorage */
((window, document) => {
  let config = {}
  try {
    config = JSON.parse(localStorage.getItem(process.env.npm_package_name)) || {}
  } catch (e) {
    console.log('config load failed', e)
  }
  console.log('config is now', config)

  let {
    best = 0,
    font = 'Verdana',
    platforms = 6, // to keep in play
    interval = 150,
    maxJump = 250,
    timeout = 2000,
    gravity = 0.11, // probably don't change these
    // traction = 0.9,
    boost = 10,
    maxVX = 1.3
  } = config

  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth - 20
  canvas.height = window.innerHeight - 100
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')

  const invertHex = hex => (Number('0x1' + hex) ^ 0xFFFFFF).toString(16)

  // better minifying
  const img = require('./img')
  const audio = require('./audio')
  const bounce = audio('bounce')
  const falling = audio('falling')
  const fart = audio('fart')

  // x = obj.cx - player.cx + (ctx.canvas.width - obj.width) / 2 + obj.vx
  // y = obj.cy - player.cy + (ctx.canvas.height - obj.height) / 2 + obj.vy
  // draw player in the middle of the screen
  const player = img('elf', { x: 0, y: 0, vx: 0, vy: boost, dx: canvas.width / 2, dy: canvas.height / 2 })
  const checkCollision = require('./checkCollision')

  const gameOver = () => {
    falling.play()
    playing = 0
    config.best = best
    localStorage.setItem(process.env.npm_package_name, JSON.stringify(config))
  }

  let powerUpTimeout // eslint-disable-line

  let score = 0
  let playing = 1

  const move = (event, key, x) => {
    // event.preventDefault()
    key = event.key
    x = event.clientX
    if (/right/i.test(key) || (x > canvas.width / 2)) {
      if (!playing) return window.location.reload() // reload the page
      player.vx = maxVX
    }
    if (/left/i.test(key) || (x < canvas.width / 2)) {
      if (!playing) return window.location.reload() // reload the page
      player.vx = -maxVX
    }
    if (/q/i.test(key)) gameOver()
  }

  document.addEventListener('keydown', move)
  document.addEventListener('click', move)

  const random = n => Math.ceil(Math.random() * n)

  const platform = [
    img('cane3', { x: 0, y: 300 }),
    img('cane2', { x: 0, y: -300 })
  ]
  const powerUp = [
  ]

  let furthestPlatform = Math.min.apply(null, platform.map(platform => platform.cy))
  let lowestPlatform // = Math.max.apply(null, platform.map(platform => platform.cy))

  function animate (timestamp) {
    if (playing) requestAnimationFrame(animate)

    const modifier = Math.round(player.cy / 100)
    ctx.fillStyle = 'rgb(' + (220 + modifier) + ', ' + (230 + modifier) + ', ' + (255 + modifier) + ')'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#' + invertHex(ctx.fillStyle.substr(2))

    /* if (player.cx > canvas.width * 0.5) {
      player.cx = canvas.width * 0.5
      player.vx = 0
    }
    if (player.cx < canvas.width * -0.5) {
      player.cx = canvas.width * -0.5
      player.vx = 0
    } */

    platform.forEach(obj => {
      obj.draw(ctx, player)

      const hitPlatform = checkCollision(player, obj)
      if (hitPlatform > 1) {
        player.vy = Math.min(-player.vy, -boost)
        // player.vx *= traction
        bounce.play()
        // console.log('bounce', debug(player), player.vx.toFixed(2), player.vy.toFixed(2))
      }
    })

    for (let i = 0; i < powerUp.length; i++) {
      if (checkCollision(player, powerUp[i])) {
        powerUp.splice(i, 1)
        powerUpTimeout = setTimeout(() => {
          player.vy = 0
        }, timeout)
        player.vy = boost * -3
        fart.play()
      } else {
        powerUp[i].draw(ctx, player)
      }
    }

    player.vy += gravity
    player.cx += player.vx
    player.cy += player.vy

    // @todo direct
    player.src = 'img/elf' + (player.vy > 1 ? '-down' : '') + '.png'

    player.draw(ctx, player)

    // furthestPlatform = Math.min.apply(null, platform.map(platform => platform.cy))
    // highest is really a lower number
    if (player.cy < furthestPlatform) {
      const y = furthestPlatform -= random(interval) + interval + player.cy / 1000 // player.cy is negative

      const x = platform[platform.length - 1].cx + random(maxJump * 2) - maxJump
      console.log({ x, y })

      platform.push(img('cane' + random(4), { x, y }))
      furthestPlatform = y
      score++
      if (score > best) best = score
      if (random(10) > 9) {
        powerUp.push(img('sprout', { x, y: y - platform[0].height }))
      }
      if (platform.length > platforms) {
        platform.shift()
        lowestPlatform = platform[0].cy
        console.log('removed platform, we now have', platform.length)
      }
    }

    if (player.cy > lowestPlatform) gameOver()

    ctx.font = '16px ' + font
    ctx.fillText('◀️ and ▶️ to move', 10, 20)
    const scoreText = 'Score: ' + score + (playing ? '' : ' GAME OVER!')
    ctx.fillText(scoreText, 10, canvas.height - 40)
    ctx.fillText('Best: ' + best, 10, canvas.height - 20)
  }

  requestAnimationFrame(animate)
})(window, document)
