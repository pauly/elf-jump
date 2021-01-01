/* global requestAnimationFrame localStorage io */
((window, document) => {
  const id = 'emu'

  let socket = {
    on: () => {},
    emit: () => {}
  }
  let config = {}
  try {
    config = JSON.parse(localStorage.getItem(id)) || {}
    socket = io()
  } catch (e) {
    console.log('something failed', e)
  }

  let {
    name,
    best = 0,
    boost = 10,
    jump = 5,
    max = 10,
    gravity = 0.13
  } = config

  const input = document.getElementById('name')
  if (!name) input.style = ''
  input.addEventListener('keyup', () => {
    name = input.value
    console.log('name is now', name)
  })

  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth - 10
  canvas.height = window.innerHeight - 100
  document.body.insertBefore(canvas, document.body.firstChild)

  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#000'
  ctx.font = '16px Verdana'

  // better minifying
  const img = require('./img')
  const audio = require('./audio')
  const pop = audio('pop')

  const ground = canvas.height * 0.7
  const player = img('blue', { x: 0, y: 0, vx: 1, vy: boost, dx: canvas.width / 2, dy: ground, f: 3 })
  const checkCollision = require('./checkCollision')

  let score = 0
  let startLine = 0
  let playing = 1
  let chanceOfSprout = 0
  let interval // eslint-disable-line
  let lowestPlatform = ground

  const gameOver = () => {
    playing = 0
    config.best = best
    config.name = name
    localStorage.setItem(id, JSON.stringify(config))
  }

  const getInput = (event, target, key, x, y) => {
    target = event.target
    if (target === input) return // we need to key in the name input
    event.preventDefault() // we can prevent default if we click on canvas only
    key = event.key
    x = event.clientX
    y = event.clientY
    if (/ /i.test(key) || (y > canvas.height * 0.5)) {
      if (!playing) return start()
      // console.log('ok to jump?', player.cy, '>', lowestPlatform, '-', player.height / 2, '-', platform[0].height, '?')
      if (player.cy > lowestPlatform - player.height / 2 - platform[0].height) {
        player.vy = -jump
      }
    } else if (/right/i.test(key) || (x > canvas.width / 2)) {
      if (!playing) return start()
      player.vx = Math.min(Math.max(2, player.vx + 1), max)
    } else if (/left/i.test(key) || (x < canvas.width / 2)) {
      if (!playing) return start()
      player.vx = Math.max(Math.min(-2, player.vx - 1), -max)
    } else if (/q/i.test(key)) {
      gameOver()
    }
  }

  document.addEventListener('keydown', getInput)
  canvas.addEventListener('click', getInput)
  document.addEventListener('dblclick', getInput)

  const random = n => Math.floor(Math.random() * n)

  let platform = []
  socket.on('platform', (data, n) => {
    platform.push(img('grass', data))
  })

  let item = []

  const ghosts = {}
  socket.on('player', (data, n) => {
    n = data.n
    if (!ghosts[n]) ghosts[n] = img('ghost')
    ghosts[n].cx = data.cx
    ghosts[n].cy = data.cy
    ghosts[n].vx = data.vx
    ghosts[n].vy = data.vy
    ghosts[n].n = n
  })

  const move = (obj, ground) => {
    obj.vy += gravity
    obj.cy += obj.vy
    obj.cx += obj.vx
    if (obj.cy > ground) {
      obj.cy = ground
      obj.vy = 0
    }
  }

  function animate (timestamp) {
    const playerIsInTheAir = Math.abs(player.vy) > 0.1 && player.cy < ground
    if (playing || playerIsInTheAir) requestAnimationFrame(animate)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'

    for (let i = 0; i < platform.length; i++) {
      platform[i].draw(ctx, player)

      if (checkCollision(player, platform[i])) {
        player.vy = Math.min(player.vy, player.vy / -5, 0)
        const standingOnPlatform = platform[i].top - player.height / 2
        player.cy = Math.min(player.cy, standingOnPlatform)
        // bounce.play()
      }

      if (platform.length > 5) {
        if (platform[i].cx < player.cx - canvas.width * 2) {
          platform.splice(i, 1)
        }
      }

      // don't need this if we emit events more often but thinking of the bandwidth
      for (const id in ghosts) {
        const ghost = ghosts[id]
        if (checkCollision(ghost, platform[i])) {
          ghost.vy = 0
          ghost.cy = platform[i].top - ghost.height / 2
        }
      }
    }

    lowestPlatform = Math.max.apply(null, platform.map(platform => platform.cy))

    ctx.strokeStyle = '#f00'
    for (const id in ghosts) {
      const ghost = ghosts[id]
      ghost.direct(timestamp / 100)
      ghost.draw(ctx, player)
      ctx.fillText(id, ghost.cx + 20, ghost.cy)
      move(ghost, lowestPlatform)
    }

    for (let i = 0; i < item.length; i++) {
      move(item[i], lowestPlatform)
      const collision = checkCollision(player, item[i])
      if (collision) {
        score = 0
        startLine = player.cx
        player.vx = 0
        let lifespan = 2000
        if (collision > 1) {
          lifespan = 200
          item[i].vy = Math.min(player.vy, item[i].vy / -2, 0)
        }
        setTimeout(() => {
          pop.play()
          item.splice(i, 1)
        }, lifespan)
      }
      item[i].draw(ctx, player)
    }

    move(player)
    if (player.width) {
      score = Math.round(Math.max((player.cx - startLine) / player.width, score))
    }
    if (score > best) best = score
    player.direct(timestamp / 100)
    player.draw(ctx, player)
    const data = {
      n: String(name),
      // t: new Date().getTime(),
      cx: Math.round(player.cx),
      cy: Math.round(player.cy),
      vx: player.vx,
      vy: player.vy
    }
    socket.emit('player', data)

    if (player.height) { // what if we not drawn it yet?
      if (player.cy > lowestPlatform + platform[0].height) {
        console.log('crashed through the floor', player.cy, '>', lowestPlatform + platform[0].height)
        gameOver()
      }
    }

    const furthestPlatform = Math.max.apply(null, platform.map(platform => platform.cx))
    if (player.cx > furthestPlatform - canvas.width / 2) {
      const x = furthestPlatform + (platform[0].width || 100) - random(10)
      const y = platform[platform.length - 1].cy + random(2) - 1
      socket.emit('platform', x, y)
      platform.push(img('grass', { x, y }))
    }

    if (random(chanceOfSprout) > 995) {
      const x = player.cx + random(canvas.width - 100) + 50 + player.vx * 40
      const y = player.cy - canvas.height + player.vx * 10
      item.push(img('sprout', { x, y }))
    }

    ctx.strokeStyle = '#000'
    if (!playing) {
      ctx.fillText('◀️ and ▶️  and space...', 10, 20)
    }
    const scoreText = 'Score: ' + score + (playing ? '' : ' GAME OVER!')
    ctx.fillText(scoreText, 10, canvas.height - 40)
    ctx.fillText('Best: ' + best, 10, canvas.height - 20)
  }

  const start = () => {
    item = [img('sprout', { x: canvas.width / 2, y: -canvas.height })]
    platform = [img('grass', { x: canvas.width / -2, y: 0 })]
    score = 0
    startLine = 0
    playing = 1
    chanceOfSprout = 1000
    player.cx = 0
    player.cy = 0
    player.vx = 1
    player.vy = 1
    /* interval = setInterval(() => {
      chanceOfSprout++
    }, 5000) */
    requestAnimationFrame(animate)
  }
  start()
})(window, document)
