const cheerio = require('cheerio');

async function test(url) {
    console.log(`Testing ${url}`);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Test logo logic
    const ogImage = $('meta[property="og:image"]').attr('content');
    console.log('og:image:', ogImage);
    
    const relIcon = $('link[rel="apple-touch-icon"], link[rel="icon"][sizes="192x192"], link[rel="icon"][sizes="512x512"]').first().attr('href') || 
                    $('link[rel="icon"], link[rel="shortcut icon"]').first().attr('href');
    console.log('relIcon:', relIcon);
    
    let imgLogo = null;
    $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = ($(el).attr('alt') || '').toLowerCase();
        const className = ($(el).attr('class') || '').toLowerCase();
        if (src && (src.toLowerCase().includes('logo') || alt.includes('logo') || className.includes('logo'))) {
             console.log('Found potential logo img:', src, 'alt:', alt, 'class:', className);
             if (!imgLogo && (!src.endsWith('.svg') || src.length > 20)) {
                imgLogo = src;
             }
        }
    });
    console.log('Selected imgLogo:', imgLogo);
    
    console.log('\n--- ALL IMAGES ---');
    $('img').each((_, el) => {
         console.log($(el).attr('src'), '| alt:', $(el).attr('alt'));
    });
}

test('https://cafehetpaardje.nl');
