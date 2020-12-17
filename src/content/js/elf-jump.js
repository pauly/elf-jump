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
    font = 'Verdana',
    platforms = 6, // to keep in play
    interval = 150, // to keep in play
    maxJump = 250,
    timeout = 2000,
    gravity = 0.11, // probably don't change these
    // traction = 0.9,
    boost = 10,
    maxVX = 1.3
  } = config

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  const invertHex = hex => (Number('0x1' + hex) ^ 0xFFFFFF).toString(16)

  // better minifying
  const img = require('./img')
  const audio = require('./audio')
  const bounce = audio('bounce')
  const falling = audio('falling')
  const fart = audio('fart')

  const player = img('elf', 0, 0, 0, boost)
  const drawRelativeTo = ctx => player => obj => {
    const x = obj.cx // - player.cx + (ctx.canvas.width - obj.width) / 2 + obj.vx
    const y = obj.cy // - player.cy + (ctx.canvas.height - obj.height) + obj.vy
    ctx.drawImage(obj, x, y)
    if (process.env.NODE_ENV === 'development') {
      const info = foo => Math.round(foo.cx) + ',' + Math.round(foo.cy) /* + ' ' + foo.width + 'x' + foo.height */ + ' 🚀' + foo.vy.toFixed(2)
      ctx.strokeStyle = '#0f0'
      ctx.strokeRect(x, y, obj.width, obj.height)
      ctx.font = '10px ' + font
      ctx.fillText(info(obj), x, y + obj.height + 10)
    }
  }
  const checkCollision = require('./checkCollision')

  let powerUpTimeout // eslint-disable-line

  let score = 0
  let playing = 1

  const move = (event, key, x) => {
    event.preventDefault()
    if (!playing) return window.location.reload() // reload the page
    key = event.key
    x = event.clientX
    if (/right/i.test(key) || (x > canvas.width / 2)) {
      player.vx = maxVX
    }
    if (/left/i.test(key) || (x < canvas.width / 2)) {
      player.vx = -maxVX
    }
    if (/q/i.test(key)) {
      playing = 0
    }
  }

  document.addEventListener('keydown', move)
  document.addEventListener('click', move)

  const random = n => Math.round(Math.random() * n)

  const platform = [
    img('cane1', 0, 300),
    img('cane2', 0, -300)
  ]
  const powerUp = [
  ]

  let highestPlatform = Math.min.apply(null, platform.map(platform => platform.cy))
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

    for (let i = 0; i < platform.length; i++) {
      drawRelativeTo(ctx)(player)(platform[i])

      const hitPlatform = checkCollision(player, platform[i])
      if (hitPlatform === 2) {
        player.vy = Math.min(-player.vy, -boost)
        // player.vx *= traction
        bounce.play()
        // console.log('bounce', debug(player), player.vx.toFixed(2), player.vy.toFixed(2))
      }
    }

    for (let i = 0; i < powerUp.length; i++) {
      if (checkCollision(player, powerUp[i])) {
        powerUp.splice(i, 1)
        powerUpTimeout = setTimeout(() => {
          player.vy = 0
        }, timeout)
        player.vy = boost * -3
        fart.play()
      } else {
        drawRelativeTo(ctx)(player)(powerUp[i])
      }
    }

    player.vy += gravity
    player.cx += player.vx
    player.cy += player.vy

    player.src = 'img/elf' + (player.vy > 1 ? '-down' : '') + '.png'

    // draw player in the middle of the screen
    drawRelativeTo(ctx)(player)(player)

    // highest is really a lower number
    if (player.cy < highestPlatform) {
      const y = highestPlatform -= random(interval) + interval + player.cy / 1000 // player.cy is negative

      const x = platform[platform.length - 1].cx + random(maxJump * 2) - maxJump
      console.log({ x, y })

      platform.push(img('cane' + random(3)), x, y)
      highestPlatform = y
      score++
      if (score > best) best = score
      if (random(10) > 9) {
        powerUp.push(img('sprout', x, y - platform[0].height))
      }
      if (platform.length > platforms) {
        platform.shift()
        lowestPlatform = platform[0].cy
        console.log('removed platform, we now have', platform.length)
      }
    }

    if (player.cy > lowestPlatform) {
      falling.play()
      playing = 0
      config.best = best
      localStorage.setItem(process.env.npm_package_name, JSON.stringify(config))
    }

    ctx.font = '16px ' + font
    ctx.fillText('Jump Jackie!', 10, 20)
    if (!playing) {
      ctx.fillText('◀️ and ▶️ to move', 10, 40)
    }
    const scoreText = 'Score: ' + score + (playing ? '' : ' GAME OVER!')
    ctx.fillText(scoreText, 10, canvas.height - 40)
    ctx.fillText('Best: ' + best, 10, canvas.height - 20)
  }

  requestAnimationFrame(animate)
})(window, document)
