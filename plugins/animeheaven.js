const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://animeheaven.me';

// Global state for user interactions
if (!global.animeState) global.animeState = {};

const fetchHtml = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
      },
      responseType: 'text',
      timeout: 20000,
    });
    return data;
  } catch (error) {
    throw new Error('Failed to fetch AnimeHeaven content.');
  }
};

const ensureUrl = (href) => {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return `${BASE_URL}${href}`;
  return `${BASE_URL}/${href}`;
};

const trimText = (text) => (text || '').replace(/\s+/g, ' ').trim();

const parseSearchResults = ($) => {
  const items = [];
  $('.similarimg').each((_, el) => {
    const anchor = $(el).find('.similarname a');
    const title = trimText(anchor.text());
    const href = ensureUrl(anchor.attr('href'));
    const image = ensureUrl($(el).find('img.coverimg').attr('src'));
    if (title && href) {
      items.push({ title, href, image });
    }
  });
  return items;
};

const parseAnimePage = ($, pageUrl) => {
  const title = trimText($('.infotitle').first().text()) || 'Unknown anime';
  const description = trimText($('.infodes').first().text()).slice(0, 1000);
  const metadata = [];
  $('.infoyear').each((_, el) => {
    const text = trimText($(el).text()).replace(/\s+/g, ' ');
    if (text) metadata.push(text);
  });

  const poster = ensureUrl($('.posterimg').attr('src'));

  const episodes = [];
  $('a.c[href="gate.php"]').each((_, el) => {
    const anchor = $(el);
    const token = (anchor.attr('onclick') || anchor.attr('onmouseover') || '').match(/\("([0-9a-f]+)"\)/i);
    const episodeNumber = trimText(anchor.find('.watch2').first().text());
    if (token && episodeNumber) {
      episodes.push({
        episode: episodeNumber,
        token: token[1],
        url: `${BASE_URL}/gate.php?token=${token[1]}`,
      });
    }
  });

  return {
    title,
    description,
    metadata: metadata.join(' | '),
    poster,
    pageUrl,
    episodes,
  };
};

const getEpisodeRanges = (totalEpisodes) => {
  const ranges = [];
  for (let i = 1; i <= totalEpisodes; i += 50) {
    const end = Math.min(i + 49, totalEpisodes);
    ranges.push(`${i}-${end}`);
  }
  return ranges;
};

const buildSearchReply = (query, results) => {
  if (!results.length) return `╭━━━〔 ⚠️ 𝐀𝐍𝐈𝐌𝐄 𝐍𝐎𝐓 𝐅𝐎𝐔𝐍𝐃 〕━━━┈\n┃ ❌ සමාවෙන්න, "${query}" සඳහා AnimeHeaven ප්‍රතිඵල කිසිවක් සොයාගැනීමට නොහැකි විය.\n╰━━━━━━━━━━━━━━━━━━━━━━━┈✨`;

  let text = `╭━━━〔 ⛩️ 𝐀𝐍𝐈𝐌𝐄 𝐒𝐄𝐀𝐑𝐂𝐇 𝐑𝐄𝐒𝐔𝐋𝐓𝐒 ⛩️ 〕━━━┈\n┃\n┃ 🔍 *සොයන ලද්දේ:* ${query}\n┃\n`;
  results.slice(0, 10).forEach((item, index) => {
    text += `┣ 🌸 *${index + 1}.* ${item.title}\n`;
  });
  text += `┃\n┣━━〔 💡 𝐓𝐈𝐏 〕━━┈\n┃ පහතින් ඔයාට අවශ්‍ය ඇනිමේ එකේ අංකය Reply කරන්න (උදා: 1).\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈✨`;
  return text;
};

const buildAnimeReply = (info) => {
  if (!info.title) return '❌ ඇනිමේ පිටුව කියවීමට (Parse) නොහැකි විය.';

  const ranges = getEpisodeRanges(info.episodes.length);
  let text = `╔════════════════════════════════════════╗\n║       ⛩️ 𝐐𝐔𝐄𝐄𝐍 𝐕𝐄𝐍𝐔𝐒 𝐀𝐍𝐈𝐌𝐄 𝐈𝐍𝐅𝐎 ⛩️       ║\n╠════════════════════════════════════════╣\n`;
  text += `║ 🎬 *නම:* ${info.title}\n`;
  text += `║ 📊 *මුළු එපිසෝඩ්:* ${info.episodes.length}\n`;
  if (info.metadata) text += `║ ℹ️ *තොරතුරු:* ${info.metadata}\n`;
  text += `╚════════════════════════════════════════╝\n\n`;
  text += `📝 *විස්තරය:*\n${info.description}\n\n`;
  text += `╔══⟪ 📋 𝐄𝐏𝐈𝐒𝐎𝐃𝐄 𝐑𝐀𝐍𝐆𝐄𝐒 ⟫══❍\n`;
  ranges.forEach((range, index) => {
    text += `╟ ⚡ *${index + 1}.* ${range} Episodes\n`;
  });
  text += `╚════════════════════════════════════════❍\n\n`;
  text += `💡 *ඔයාට අවශ්‍ය එපිසෝඩ් කාණ්ඩයේ අංකය Reply කරන්න.* (උදා: 1)`;
  return text;
};

const buildEpisodeListReply = (info, rangeIndex) => {
  const ranges = getEpisodeRanges(info.episodes.length);
  const range = ranges[rangeIndex - 1];
  if (!range) return '❌ වලංගු නොවන පරාසයකි.';

  const [start, end] = range.split('-').map(Number);
  const episodesInRange = info.episodes.slice(start - 1, end);

  let text = `╭━━━〔 📺 𝐄𝐏𝐈𝐒𝐎𝐃𝐄 𝐋𝐈𝐒𝐓 〕━━━┈\n┃\n┃ 🎬 *නම:* ${info.title}\n┃ 🗂️ *කාණ්ඩය:* ${range}\n┃\n`;
  episodesInRange.forEach((ep, index) => {
    const epNum = start + index;
    const fileSize = '~70MB'; // Estimated file size
    text += `┣ 🌸 *${epNum}.* Episode ${ep.episode} (${fileSize})\n`;
  });
  text += `┃\n┣━━〔 💡 𝐓𝐈𝐏 〕━━┈\n┃ බාගත කිරීමට අවශ්‍ය එපිසෝඩ් එකේ අංකය Reply කරන්න.\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈✨`;
  return text;
};

const sendEpisode = async (conn, from, info, episodeNum) => {
  const episode = info.episodes.find(ep => parseInt(ep.episode) === episodeNum);
  if (!episode) return '❌ එපිසෝඩ් නොමැත.';

  const fileSize = '~70MB'; // Estimated file size
  const caption = `╔════════════════════════════════════════╗\n║      📥 𝐀𝐍𝐈𝐌𝐄 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐑𝐄𝐀𝐃𝐘 📥      ║\n╠════════════════════════════════════════╣\n║ 🎬 *නම:* ${info.title}\n║ 📺 *එපිසෝඩ්:* ${episode.episode}\n║ 📊 *ප්‍රමාණය:* ${fileSize}\n╚════════════════════════════════════════╝\n\n👑 *𝐐𝐔𝐄𝐄𝐍 𝐕𝐄𝐍𝐔𝐒 𝐌𝐃*\n\n💡 පහත ඇති Document එක විවෘත කර බාගත කරන්න.`;

  await conn.sendMessage(from, {
    document: { url: episode.url },
    mimetype: 'application/octet-stream',
    fileName: `${info.title} - Episode ${episode.episode}.mp4`,
    caption,
  });
};

module.exports = {
  name: 'anime',
  react: '🎬',
  execute: async (conn, mek, args, { reply }) => {
    try {
      const from = mek.key.remoteJid;
      const userId = mek.key.participant
        ? mek.key.participant.split('@')[0]
        : from.split('@')[0];
      const body =
        mek.message?.conversation ||
        mek.message?.extendedTextMessage?.text ||
        '';
      const userState = global.animeState[userId] || {};
      const numberMatch = body.trim().match(/^(\d+)$/);
      const selection = numberMatch ? parseInt(numberMatch[1], 10) : null;

      if (selection && !userState.stage) {
        return reply(
          '❌ ඔබගේ Anime selection session එක සක්‍රීය නොවේ. කරුණාකර නැවත .anime <search> කරන්න.'
        );
      }

      if (selection && userState.stage) {
        if (userState.stage === 'search' && userState.searchResults) {
          if (selection < 1 || selection > userState.searchResults.length) {
            return reply('❌ වලංගු නොවන තේරීම. අංකයක් ඇතුළත් කරන්න.');
          }

          const selectedAnime = userState.searchResults[selection - 1];
          const html = await fetchHtml(selectedAnime.href);
          const $ = cheerio.load(html);
          const animeInfo = parseAnimePage($, selectedAnime.href);

          if (animeInfo.poster) {
            await conn.sendMessage(from, {
              image: { url: animeInfo.poster },
              caption: buildAnimeReply(animeInfo),
            });
          } else {
            reply(buildAnimeReply(animeInfo));
          }

          global.animeState[userId] = {
            stage: 'anime',
            currentAnime: animeInfo,
            searchResults: userState.searchResults,
          };
          return;
        }

        if (userState.stage === 'anime' && userState.currentAnime) {
          const ranges = getEpisodeRanges(userState.currentAnime.episodes.length);
          if (selection < 1 || selection > ranges.length) {
            return reply('❌ වලංගු නොවන පරාසය තේරීම.');
          }

          reply(buildEpisodeListReply(userState.currentAnime, selection));
          userState.stage = 'range';
          userState.currentRange = selection;
          global.animeState[userId] = userState;
          return;
        }

        if (userState.stage === 'range' && userState.currentAnime) {
          if (selection < 1 || selection > userState.currentAnime.episodes.length) {
            return reply('❌ වලංගු නොවන එපිසෝඩ් අංකය.');
          }

          await sendEpisode(conn, from, userState.currentAnime, selection);
          return;
        }
      }

      if (!args || !args.length) {
        return reply(
          'Usage:\n.anime <search terms>\nExample: .anime naruto\n\n💡 තේරීම් සඳහා reply කරන්න!'
        );
      }

      const query = args.join(' ').trim();
      const isUrl = query.match(/https?:\/\//i) || query.includes('animeheaven.me');

      if (isUrl) {
        const pageUrl = query.startsWith('http') ? query : ensureUrl(query);
        const html = await fetchHtml(pageUrl);
        const $ = cheerio.load(html);
        const animeInfo = parseAnimePage($, pageUrl);

        if (animeInfo.poster) {
          await conn.sendMessage(from, {
            image: { url: animeInfo.poster },
            caption: buildAnimeReply(animeInfo),
          });
        } else {
          reply(buildAnimeReply(animeInfo));
        }

        global.animeState[userId] = {
          stage: 'anime',
          currentAnime: animeInfo,
        };
        return;
      }

      const searchingMsg = await conn.sendMessage(from, { text: '🔍 සොයමින් පවතී...' });
      await conn.sendMessage(from, { react: { text: '🔍', key: searchingMsg.key } });

      const searchUrl = `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`;
      const html = await fetchHtml(searchUrl);
      const $ = cheerio.load(html);
      const results = parseSearchResults($);

      if (!results.length) {
        return reply(`❌ "${query}" සඳහා AnimeHeaven ප්‍රතිඵල නොමැත.`);
      }

      const venusImage = 'https://files.catbox.moe/2clq4z.jpeg';
      await conn.sendMessage(from, {
        image: { url: venusImage },
        caption: buildSearchReply(query, results),
      });

      global.animeState[userId] = {
        stage: 'search',
        searchResults: results,
      };

    } catch (error) {
      reply('❌ AnimeHeaven scraper error: ' + (error.message || 'Something went wrong.'));
    }
  },
};
