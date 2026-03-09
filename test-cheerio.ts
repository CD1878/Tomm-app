import * as cheerio from 'cheerio';
async function test() {
    const res = await fetch('https://cafehetpaardje.nl');
    const html = await res.text();
    const $ = cheerio.load(html);
    const urls: string[] = [];
    $('img').each((_, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !src.endsWith('.svg') && !src.includes('data:image')) {
            try { urls.push(new URL(src, 'https://cafehetpaardje.nl').href); } catch(e){}
        }
    });
    console.log("Images found:", urls.length);
    console.log(urls);
}
test();
