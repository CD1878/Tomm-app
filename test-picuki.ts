import * as cheerio from 'cheerio';
async function test() {
    console.log("Fetching picuki...");
    const res = await fetch('https://www.picuki.com/profile/hetpaardje', { 
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
        }
    });
    const html = await res.text();
    console.log("HTML length:", html.length);
    const $ = cheerio.load(html);
    const urls: string[] = [];
    $('img').each((_, el) => {
        let src = $(el).attr('src');
        if (src) urls.push(src);
    });
    console.log("Images found:", urls.length);
    console.log(urls.slice(0, 10));
}
test();
