#!/usr/bin/env node

// const { createReadStream, writeFile, readdir, readdirSync, readFile } = require('fs')
const { resolve } = require('path')
const jimp = require('jimp')

const image = process.argv[2]
const imageFolder = resolve(__dirname, '../src/assets/img')
const originalImage = resolve(imageFolder, image)
// console.log(originalImage)

jimp.read(originalImage, (err, img) => {
  if (err) throw err
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      // img.resize(width, jimp.AUTO)
      const newImage = originalImage.replace(/(.+?)(\.\w+$)/, (_, prefix, extension) => {
        return prefix + x + y + extension
      })
      // console.log(newImage)
      img.clone()
        .flip(x < 0, false)
        .write(newImage, err => {
          if (err) console.error(err)
        })
    }
  }
})
