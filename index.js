const { Telegraf, Markup } = require('telegraf');
const { Composer } = require('micro-bot');
const axios = require('axios');
const { Keyboard, Key } = require('telegram-keyboard');
require('dotenv').config();

// const bot = new Telegraf(process.env.BOT_TOKEN);
const bot = new Composer();
const omdbAPI = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}`;

bot.start((ctx) => ctx.reply(`Halo ${ctx.from.first_name}, selamat datang di @TFKHDYTMovieBot, ketikkan nama film/series yang ingin dicari untuk menampilkan detail dari film tersebut.`));

bot.command('help', (ctx) => ctx.reply(`Pencarian Film:
    Kamu hanya perlu mengetik judul film/series saja
Contoh:
    WandaVision

Pencarian Film Berdasarkan Tahun Rilis:
    /year [tahun rilis] [judul film]
Contoh:
    /year 2021 What If...?`));

bot.command('year', (ctx) => {
  console.log(ctx.update.message.text.split(' '));
  const args = ctx.update.message.text.split(' ');
  const year = args[1];
  let judulFilm = '';
  for (let i = 2; i < args.length; i++) {
    let separator = (i < args.length - 1) ? ' ' : '';
    judulFilm += args[i] + separator;
  }
  console.log(`Tahun : ${year}\nJudul Film : ${judulFilm}`);
  const movieQuery = encodeURI(judulFilm);
  axios.get(omdbAPI + '&s=' + movieQuery + '&y=' + year)
  .then(res => {
    // console.log(res.data.Search);
    if (res.data.Response == 'False') return ctx.reply('Hasil tidak ditemukan! Silakan masukkan judul film yang lebih spesifik.');
    const hasilQuery = res.data.Search;
    const keyCallback = hasilQuery.map((film) => {
      return Key.callback(`${film.Title} (${film.Year})`, film.imdbID);
    });
    const keyboard = Keyboard.make(keyCallback, {
      columns: 1
    }).inline();
    // console.log(keyboard);
    ctx.reply(`Menampilkan film/series dengan judul "${judulFilm} (${year})":`, keyboard);
  });
});

bot.on('text', (ctx) => {
  const movieQuery = encodeURI(ctx.message.text);
  axios.get(omdbAPI + '&s=' + movieQuery)
  .then(res => {
    // console.log(res.data.Search);
    if (res.data.Response == 'False') return ctx.reply('Hasil tidak ditemukan! Silakan masukkan judul film yang lebih spesifik.');
    const hasilQuery = res.data.Search;
    const keyCallback = hasilQuery.map((film) => {
      return Key.callback(`${film.Title} (${film.Year})`, film.imdbID);
    });
    const keyboard = Keyboard.make(keyCallback, {
      columns: 1
    }).inline();
    // console.log(keyboard);
    ctx.reply(`Menampilkan film/series dengan judul "${ctx.message.text}":`, keyboard);
  });
});

bot.on('callback_query', (ctx) => {
  // console.log(ctx.callbackQuery.data);
  const imdbID = ctx.callbackQuery.data;
  axios.get(omdbAPI + '&i=' + imdbID)
  .then(res => {
    console.log(res.data);
    const data = res.data;
    const sendPhoto = ctx.replyWithPhoto({
      url: data.Poster
    }, {
      caption: `*Judul* : ${data.Title}
*Tahun* : ${data.Year}
*Rated* : ${data.Rated}
*Tgl. Rilis* : ${data.Released}
*Durasi* : ${data.Runtime}
*Genre* : ${data.Genre}
*Sutradara* : ${data.Director}
*Penulis* : ${data.Writer}
*Aktor* : ${data.Actors}
*Plot* :
${data.Plot}
*Bahasa* : ${data.Language}
*Negara* : ${data.Country}
*Awards* : ${data.Awards}
*Produksi* : ${data.Production}
*Metascore* : ${data.Metascore}
*IMDB Rating* : ${data.imdbRating}`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([ 
        Markup.button.url('🔎 Cari di pahe.ph', `https://pahe.ph/?s=${imdbID}`)
      ]) 
    });
  });
});

// bot.launch();
module.exports = bot;