import * as cheerio from 'cheerio';
async function crawl() {
    const res = await fetch('https://cafehetpaardje.nl');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const links = new Set<string>();
    $('a').each((_, el) => {
        let href = $(el).attr('href');
        if (href && href.startsWith('/')) {
            links.add(`https://cafehetpaardje.nl${href}`);
        }
    });
    
    console.log("Internal Links:", Array.from(links));
    
    const imageUrls = new Set<string>();
    for (const url of Array.from(links).slice(0, 5)) {
        try {
            const pageRes = await fetch(url);
            const pageHtml = await pageRes.text();
            const _$ = cheerio.load(pageHtml);
            _$('img').each((_, el) => {
                let src = _$(el).attr('src') || _$(el).attr('data-src');
                if (src && !src.endsWith('.svg') && !src.includes('data:image')) {
                    try { imageUrls.add(new URL(src, url).href); } catch(e){}
                }
            });
        } catch (e) {
            console.log("Failed to fetch", url);
        }
    }
    console.log("Found images:", imageUrls.size);
    console.log(Array.from(imageUrls).slice(0, 15));
}
crawl();
