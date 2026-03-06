import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // Allows Vercel up to 5 minutes to generate 12 campaigns

const EmailSchema = z.object({
    month: z.number(),
    monthName: z.string(),
    subject: z.string(),
    heroText: z.string(),
    bodyText: z.string().describe("The main email body. MUST be plain text ONLY. NEVER use HTML tags like <br> or <a>. Use \\n\\n for paragraphs."),
    callToAction: z.string(),
    imageUrl: z.string().nullable().describe('URL of a relevant image extracted from the website/instagram context. Must be an absolute URL.'),
});

const CampaignsSchema = z.object({
    campaigns: z.array(EmailSchema).length(12),
    scrapedContextSummary: z.string(),
    businessName: z.string().describe("The real name of the restaurant or business"),
    businessAddress: z.string().describe("The physical address of the business"),
    businessWebsite: z.string().describe("The homepage URL of the business"),
    businessLogo: z.string().nullable().describe("Absolute URL to the business logo image. YOU MUST check the 'HIGH PROBABILITY LOGO URLS' section first. If none are good, you may fall back to others."),
});

export async function POST(req: Request) {
    try {
        let { websiteUrl, instagramUrl, globalInstructions, monthlyInstructions, language } = await req.json();

        if (instagramUrl && !instagramUrl.includes('instagram.com')) {
            instagramUrl = instagramUrl.replace('@', '').trim();
            instagramUrl = `https://www.instagram.com/${instagramUrl}/`;
        }

        if (!websiteUrl) {
            return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 });
        }

        let targetUrl = websiteUrl;
        if (!targetUrl.match(/^https?:\/\//i)) {
            targetUrl = `https://${targetUrl}`;
        }

        let websiteContent = "--- COMPILED BUSINESS WEBSITE DATA ---\n\n";

        // PASS 1: Jina Reader API for full website markdown context
        try {
            console.log(`Fetching Jina Markdown for: ${targetUrl}`);
            const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`);
            if (jinaRes.ok) {
                const markdown = await jinaRes.text();
                websiteContent += `\n\n--- JINA AI MARKDOWN FOR ${targetUrl} ---\n`;
                websiteContent += markdown;
            } else {
                console.log("Jina fetch failed", jinaRes.status);
            }
        } catch (e: any) {
            console.log("Jina request failed:", e);
        }

        // PASS 2: Cheerio explicit fetch to guarantee Logo and hero images aren't missed, WITH INTERNAL CRAWL
        const fallbackImageUrls = new Set<string>();
        const likelyLogoUrls = new Set<string>();
        try {
            console.log("Fetching Cheerio for explicit image extraction and internal link crawling...");
            const fallbackResponse = await fetch(targetUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (fallbackResponse.ok) {
                const html = await fallbackResponse.text();
                const $ = cheerio.load(html);
                const title = $('title').text() || new URL(targetUrl).hostname;
                const description = $('meta[name="description"]').attr('content') || '';

                // Track internal links to crawl for more images
                const internalLinks = new Set<string>();
                $('a').each((_, el) => {
                    let href = $(el).attr('href');
                    if (href && href.startsWith('/')) {
                        try { internalLinks.add(new URL(href, targetUrl).href); } catch (e) { }
                    }
                });

                $('img').each((_, el) => {
                    let src = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
                    if (src && !src.includes('data:image')) {
                        try {
                            const absUrl = new URL(src, targetUrl).href;
                            fallbackImageUrls.add(absUrl);

                            const attribs = $(el).attr() || {};
                            const hasLogoKeyword = Object.values(attribs).some(val => val.toLowerCase().includes('logo')) || src.toLowerCase().includes('logo');
                            const altText = $(el).attr('alt') || '';
                            const isLikelyLogoFromAlt = altText.toLowerCase().includes('bar maeve') || altText.toLowerCase().includes('logo');

                            if (hasLogoKeyword || isLikelyLogoFromAlt) {
                                likelyLogoUrls.add(absUrl);
                            }
                        } catch (e) { }
                    }
                });

                // Quickly crawl up to 5 internal pages to massively boost image count
                const linksToScrape = Array.from(internalLinks).slice(0, 5);
                await Promise.allSettled(linksToScrape.map(async (link) => {
                    try {
                        const pageRes = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                        if (!pageRes.ok) return;
                        const pageHtml = await pageRes.text();
                        const _$ = cheerio.load(pageHtml);
                        _$('img').each((_, el) => {
                            let src = _$(el).attr('data-src') || _$(el).attr('data-lazy-src') || _$(el).attr('src');
                            if (src && !src.includes('data:image')) {
                                try {
                                    const absUrl = new URL(src, link).href;
                                    fallbackImageUrls.add(absUrl);

                                    const attribs = _$(el).attr() || {};
                                    const hasLogoKeyword = Object.values(attribs).some(val => val.toLowerCase().includes('logo')) || src.toLowerCase().includes('logo');
                                    if (hasLogoKeyword) {
                                        likelyLogoUrls.add(absUrl);
                                    }
                                } catch (e) { }
                            }
                        });
                    } catch (e) { }
                }));

                websiteContent += `\n\n--- CHEERIO METADATA (HOMEPAGE) ---\nTitle: ${title}\nDesc: ${description}\n\n`;
                if (likelyLogoUrls.size > 0) {
                    websiteContent += `\n\n--- HIGH PROBABILITY LOGO URLS (USE ONE OF THESE SPECIFICALLY FOR businessLogo) ---\n${Array.from(likelyLogoUrls).slice(0, 5).join('\n')}\n`;
                }
                websiteContent += `\n\n--- MASSIVE COLLECTION OF EXPLICITLY FOUND WEBSITE IMAGES (YOU MUST USE A DISTINCT ONE EACH MONTH IF JINA/INSTAGRAM FAILED) ---\n${Array.from(fallbackImageUrls).slice(0, 40).join('\n')}\n`;
            }
        } catch (e) {
            console.log("Cheerio pass failed:", e);
        }

        // PASS 3: Instagram strict headless visual extraction via Puppeteer
        // PASS 3: Instagram strict headless visual extraction via Puppeteer & Picuki Fallback
        if (instagramUrl && instagramUrl.includes('instagram.com')) {
            console.log(`Attempting to scrape Instagram headlessly: ${instagramUrl}`);
            try {
                // Using stealth to bypass Instagram completely
                const puppeteer = (await import('puppeteer-extra')).default;
                const stealthModule: any = await import('puppeteer-extra-plugin-stealth');
                const StealthPlugin = stealthModule.default || stealthModule;
                puppeteer.use(StealthPlugin());
                const browser = await puppeteer.launch({ headless: true });
                const page = await browser.newPage();

                let images: string[] = [];

                try {
                    await page.goto(instagramUrl, { waitUntil: 'networkidle2', timeout: 8000 });
                    await new Promise(r => setTimeout(r, 2000));
                    await page.evaluate(() => window.scrollBy(0, 1000));
                    await new Promise(r => setTimeout(r, 2000));

                    images = await page.evaluate(() => {
                        const imgs = Array.from(document.querySelectorAll('article img'));
                        return imgs.map((img: any) => img.src).filter(Boolean);
                    });
                } catch (timeoutErr) {
                    console.log(`Instagram timeout/block detected. Falling back to Picuki...`);
                    // Extract handle from URL (e.g. https://www.instagram.com/bar_maeve/ -> bar_maeve)
                    const match = instagramUrl.match(/instagram\.com\/([^\/]+)/);
                    if (match && match[1]) {
                        const handle = match[1];
                        await page.goto(`https://www.picuki.com/profile/${handle}`, { waitUntil: 'networkidle2', timeout: 15000 });
                        await new Promise(r => setTimeout(r, 2000));
                        await page.evaluate(() => window.scrollBy(0, 1000));
                        await new Promise(r => setTimeout(r, 2000));

                        images = await page.evaluate(() => {
                            const imgs = Array.from(document.querySelectorAll('.post-image'));
                            return imgs.map((img: any) => img.src).filter(Boolean);
                        });
                        console.log(`Picuki fallback found ${images.length} images.`);
                    }
                }

                await browser.close();

                if (images.length > 0) {
                    console.log(`Found ${images.length} Instagram/Picuki images natively. Uploading to Supabase...`);
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabase = createClient(supabaseUrl, supabaseKey);

                    const permanentUrls: string[] = [];
                    for (let i = 0; i < images.length && i < 24; i++) {
                        try {
                            const res = await fetch(images[i]);
                            if (res.ok) {
                                const buffer = await res.arrayBuffer();
                                const fileName = `ig_${Date.now()}_${i}.jpg`;
                                const { data, error } = await supabase.storage.from('campaign_images').upload(fileName, buffer, {
                                    contentType: 'image/jpeg',
                                    upsert: true
                                });
                                if (!error && data) {
                                    const { data: publicData } = supabase.storage.from('campaign_images').getPublicUrl(fileName);
                                    permanentUrls.push(publicData.publicUrl);
                                }
                            }
                        } catch (e) {
                            console.error("Failed to rehost image", e);
                        }
                    }

                    if (permanentUrls.length > 0) {
                        console.log(`Successfully rehosted ${permanentUrls.length} images to Supabase.`);
                        websiteContent += `\n\n--- MASSIVE COLLECTION OF EXPLICITLY FOUND INSTAGRAM IMAGES (PRIORITIZE THESE FIRST FOR HERO IMAGES) ---\n${permanentUrls.join('\n')}\n`;
                    } else {
                        console.log("Failed to upload any images. Falling back to raw URLs.");
                        websiteContent += `\n\n--- MASSIVE COLLECTION OF EXPLICITLY FOUND INSTAGRAM IMAGES (PRIORITIZE THESE FIRST FOR HERO IMAGES) ---\n${images.slice(0, 24).join('\n')}\n`;
                    }
                } else {
                    console.log(`Puppeteer loaded Instagram but found 0 images (possible login block and Picuki failed).`);
                }
            } catch (igError: any) {
                console.log("Instagram/Picuki Puppeteer scrape completely failed: ", igError.message);
            }
        }

        // Limit context string size
        websiteContent = websiteContent.substring(0, 30000);

        const currentYear = new Date().getFullYear();

        console.log('Generating 12-month campaign plan for year:', currentYear);

        let instructionsInjection = '';
        if (globalInstructions) {
            instructionsInjection += `\nCRITICAL GLOBAL INSTRUCTIONS FROM THE OWNER (MUST BE OBEYED FOR EVERY EMAIL):\n"${globalInstructions}"\n`;
        }
        if (monthlyInstructions && Object.keys(monthlyInstructions).length > 0) {
            instructionsInjection += `\nCRITICAL MONTHLY INSTRUCTIONS (MUST OVERRIDE GENERAL ASSUMPTIONS FOR THESE SPECIFIC MONTHS):\n`;
            for (const [monthNum, instruction] of Object.entries(monthlyInstructions)) {
                if (instruction) {
                    instructionsInjection += `- FOR MONTH ${monthNum}: "${instruction}"\n`;
                }
            }
        }

        const { object } = await generateObject({
            model: openai('gpt-4o'),
            schema: CampaignsSchema,
            prompt: `
        You are an expert hospitality marketing copywriter. We need to create a 12-month "set-and-forget" email marketing campaign for a restaurant/hospitality business.
        
        Here is the scraped content from their website (may contain image links):
        ---
        ${websiteContent}
        ---
        ${instructionsInjection}
        
        Instructions:
        1. DEEP BUSINESS ANALYSIS: Analyze the business based on the scraped website/instagram content. Extract the core vibe, menu highlights, unique selling points, and crucially: ALL UPCOMING EVENTS, special action pages, agenda items, and CUSTOMER REVIEWS. Extract the business name, address, logo URL, and website URL.
        2. DYNAMIC TOPIC ENGINE & DATES: Create exactly 12 distinct email campaigns (Month 1 = Jan, 2 = Feb, etc). 
           - CRITICAL DATE INSTRUCTION: The current year is ${currentYear}. All events, greetings, and references must be for ${currentYear} and ${currentYear + 1}. NEVER use past years like 2023 or 2024.
           - DO NOT just use generic seasonal trends. You MUST base the campaign topics heavily on the actual EVENTS, ACTIONS, and REVIEWS you found on their website/instagram. 
           - E.g., if you found a "Wine Tasting Event" on the site, schedule an email to promote it.
           - If you found glowing "Customer Reviews" about a specific dish or the terrace, dedicate an email to highlighting that social proof.
           - CRITICAL PRODUCT FOCUS: Identify the specific products, dishes, or services that customers were most enthusiastic about in the reviews over the past year (the "pearls"). Actively highlight and promote these specific beloved items in the emails.
        3. TEXT LENGTH & FORMATTING: Write engaging, warm body text (at least 2 to 3 paragraphs). Make it beautiful, high-conversion, and structured. Use warm hospitality greetings. It should read like a premium marketing newsletter.
           - CRITICAL FORMATTING: ONLY use PLAIN TEXT. NEVER, EVER use HTML tags like <br>, <a>, or <b> in any of the fields. Separate paragraphs with exactly two newlines (\\n\\n).
           - EXTREME SEASONALITY: Make the text hyper-relevant to the exact season or month (e.g., heavily focus on summer terrace vibes in July/August, and warm, cozy winter/Christmas vibes in December). Tie the website's events and offerings to these seasons naturally. The text must read as an authentic, engaging newsletter for the customer.
        4. IMAGE SELECTION & URL: Scan the provided context for real, absolute image links. You MUST prioritize using REAL IMAGES found in the 'MASSIVE COLLECTION OF EXPLICITLY FOUND INSTAGRAM IMAGES'. If there are no Instagram images, you may use the 'WEBSITE IMAGES'.
           - ENFORCE VARIETY: NEVER repeat the same image twice across different months. Use 12 entirely unique images from the 'MASSIVE COLLECTION OF EXPLICITLY FOUND INSTAGRAM IMAGES' section.
           - CRITICAL: NEVER hallucinate, make up, or use placeholder image URLs (like unsplash source). If you somehow exhaust all valid imagery, RETURN null. ANY URL YOU RETURN MUST BE AN ABSOLUTE URL starting with http:// or https://.
           - CRITICAL: NEVER use the 'businessLogo' or any logo URL as the campaign 'imageUrl'. The hero image must be an actual photo, not a logo graphic.
        5. CALL TO ACTION / BOOKING LINK: DO NOT put an HTML link in the body text or use HTML tags! Instead, put the call to action text (like "Reserveer Hier" or "Bekijk het menu") inside the 'callToAction' field.
        6. The tone should match the presumed brand voice from the website and the positive sentiment from their reviews, UNLESS dictated otherwise by the Global Instructions. Ensure the texts are "normal" and read like a fun, general update without weird characters.
        7. Provide a short summary of the specific events, reviews, and USPs you deduced and used as input in the 'scrapedContextSummary'.
        8. CRITICAL LANGUAGE REQUIREMENT: You MUST generate all text, including the subject, summary (preview text), and bodyText exclusively in this language: ${language || 'Dutch'}. Overwrite any other language defaults.
      `,
        });

        const fallbackImages = [
            "https://images.unsplash.com/photo-1414235077428-33898ed1e829?auto=format&fit=crop&q=80", // Food
            "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80", // Interior
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80", // Dining
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80", // Wine
            "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&q=80", // Cafe
            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80", // Bar
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80", // Atmosphere
            "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&q=80", // Group
            "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80", // Dessert
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80", // Chef
            "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80", // Lunch
            "https://images.unsplash.com/photo-1536964549204-cce9eab227bd?auto=format&fit=crop&q=80"  // Cocktails
        ];

        // Ensure every campaign has an image (safety net) and aggressively strip ALL HTML/Markdown from the text
        if (object.campaigns) {
            object.campaigns = object.campaigns.map((camp, index) => {
                let imgUrl = camp.imageUrl;
                // If the AI left it blank or accidentally used the logo, replace it!
                if (!imgUrl || imgUrl === object.businessLogo || imgUrl.toLowerCase().includes('logo')) {
                    imgUrl = fallbackImages[index % fallbackImages.length];
                }

                // AI is notoriously stubborn about sneaking in HTML `<br>` or Markdown links `[Click Here](https...)`
                // even when told not to. We rigorously scrub them out before saving to the DB.
                let cleanBodyText = camp.bodyText || "";

                // 1. Remove Markdown links: [Plaats vandaag...](https://...) -> Plaats vandaag...
                cleanBodyText = cleanBodyText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

                // 2. Replace <br> or <br/> with double newlines
                cleanBodyText = cleanBodyText.replace(/<br\s*\/?>/gi, '\n\n');

                // 3. Strip any other lingering HTML tags entirely (e.g. <a>, <b>, <p>)
                cleanBodyText = cleanBodyText.replace(/<\/?[^>]+(>|$)/g, "");

                return { ...camp, imageUrl: imgUrl, bodyText: cleanBodyText };
            });
        }

        console.log("---- SUCCESSFULLY GENERATED ----");
        console.log("EXTRACTED LOGO:", object.businessLogo);

        return NextResponse.json({ success: true, data: object });

    } catch (error: any) {
        console.error('Error generating campaigns:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
