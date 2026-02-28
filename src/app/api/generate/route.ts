import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const EmailSchema = z.object({
    month: z.number(),
    monthName: z.string(),
    subject: z.string(),
    heroText: z.string(),
    bodyText: z.string(),
    callToAction: z.string(),
    imageUrl: z.string().nullable().describe('URL of a relevant image extracted from the website context. Must be an absolute URL.'),
});

const CampaignsSchema = z.object({
    campaigns: z.array(EmailSchema).length(12),
    scrapedContextSummary: z.string(),
    businessName: z.string().describe("The real name of the restaurant or business"),
    businessAddress: z.string().describe("The physical address of the business"),
    businessWebsite: z.string().describe("The homepage URL of the business"),
    businessLogo: z.string().nullable().describe("Absolute URL to the business logo image, if found. Usually in the header or footer of the website."),
});

export async function POST(req: Request) {
    try {
        // Initialize Firecrawl inside the handler to prevent static build errors if env var is missing
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || 'dummy_key' }) as any;

        const { websiteUrl, globalInstructions, monthlyInstructions, language } = await req.json();

        if (!websiteUrl) {
            return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 });
        }

        let targetUrl = websiteUrl;
        if (!targetUrl.match(/^https?:\/\//i)) {
            targetUrl = `https://${targetUrl}`;
        }

        // 0. Extract Logo Explicitly using Cheerio to ensure it's always found
        let overrideLogoUrl = null;
        try {
            const logoFetch = await fetch(targetUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (logoFetch.ok) {
                const logoHtml = await logoFetch.text();
                const $logo = cheerio.load(logoHtml);

                const ogImage = $logo('meta[property="og:image"]').attr('content');
                const relIcon = $logo('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').first().attr('href');
                let imgLogo: string | null = null;
                $logo('img').each((_, el) => {
                    const src = $logo(el).attr('src') || '';
                    const alt = $logo(el).attr('alt') || '';
                    const className = $logo(el).attr('class') || '';
                    if (!imgLogo && (src.toLowerCase().includes('logo') || alt.toLowerCase().includes('logo') || className.toLowerCase().includes('logo'))) {
                        imgLogo = src;
                    }
                });

                let bestLogo = ogImage || imgLogo || relIcon;
                if (bestLogo) {
                    try {
                        overrideLogoUrl = new URL(bestLogo, targetUrl).href;
                    } catch (e) { }
                }
            }
        } catch (e) {
            console.log("Failed to extract explicit logo", e);
        }

        // 1. Scrape the website using Firecrawl (Deep Crawl)
        let websiteContent = "--- COMPILED BUSINESS WEBSITE DATA ---\n\n";
        console.log(`Starting Deep Crawl: ${targetUrl}`);

        try {
            const crawlResponse = await firecrawl.crawlUrl(targetUrl, {
                limit: 10, // Crawl up to 10 subpages (Home, Menu, Groups, Contact, etc.)
                scrapeOptions: {
                    formats: ['markdown'],
                    onlyMainContent: true,
                }
            });

            if (!crawlResponse.success || !crawlResponse.data) {
                throw new Error("Firecrawl API failed or insufficient credits");
            }

            // Combine all the scraped pages into one massive context document
            for (const page of crawlResponse.data) {
                if (page.markdown) {
                    websiteContent += `\n\n--- PAGE: ${page.metadata?.title || page.url} ---\n`;
                    websiteContent += page.markdown;
                }
            }
        } catch (crawlError: any) {
            console.log("Firecrawl deep crawl failed. Attempting native Cheerio fallback for homepage...", crawlError.message);

            const fallbackResponse = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            if (!fallbackResponse.ok) {
                return NextResponse.json({ error: `Failed to crawl website. Native fallback HTTP error ${fallbackResponse.status}` }, { status: 500 });
            }
            const html = await fallbackResponse.text();

            const $ = cheerio.load(html);
            const title = $('title').text() || new URL(targetUrl).hostname;
            const description = $('meta[name="description"]').attr('content') || '';

            // Extract some image URLs to help OpenAI find valid logos/imgs
            const imageUrls: string[] = [];
            $('img').each((_, el) => {
                const src = $(el).attr('src');
                if (src) {
                    try {
                        const absUrl = new URL(src, targetUrl).href;
                        imageUrls.push(absUrl);
                    } catch (e) { }
                }
            });

            $('script, style, noscript, iframe, nav, footer').remove();

            const turndownService = new TurndownService({ headingStyle: 'atx' });
            const markdownRaw = turndownService.turndown($('body').html() || '');
            const markdown = `# ${title}\n\n${description}\n\n${markdownRaw}`;

            websiteContent += `\n\n--- PAGE: ${targetUrl} (FALLBACK SCRAPE) ---\n`;
            websiteContent += markdown;
            websiteContent += `\n\n--- FOUND IMAGES FOR CONTEXT ---\n${imageUrls.slice(0, 10).join('\n')}\n`;
        }

        // Limit context window to prevent blowing up the OpenAI token limit
        websiteContent = websiteContent.substring(0, 30000);

        // 2. Generate 12 months of emails using OpenAI
        console.log('Generating 12-month campaign plan...');

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

        if (overrideLogoUrl) {
            instructionsInjection += `\nCRITICAL LOGO INSTRUCTION: The official business logo URL is "${overrideLogoUrl}". You MUST return exactly this URL for the 'businessLogo' field.\n`;
        }

        instructionsInjection += `\nCRITICAL IMAGE INSTRUCTION: If you CANNOT find a high-quality, absolute image URL from the scraped website context for a campaign month, YOU MUST USE ONE OF THESE FALLBACK IMAGES. NEVER return null and NEVER hallucinate a broken URL. Pick the one that makes the most sense:
- https://images.unsplash.com/photo-1414235077428-33898ed1e829?auto=format&fit=crop&q=80 (Fine dining / Food)
- https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80 (Restaurant interior)
- https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80 (People dining)
- https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80 (Wine and food)
- https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&q=80 (Cafe / Drinks)
- https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80 (Bar / Cocktails)
- https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80 (Seating / Atmosphere)
- https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&q=80 (Group dining outdoors)
- https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80 (Dessert / Cake)
- https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80 (Chef plating)
- https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80 (Lunch / Sandwich)\n`;

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
        1. DEEP BUSINESS ANALYSIS: Analyze the business based on the scraped website content. Extract the core vibe, menu highlights, unique selling points, and crucially: ALL UPCOMING EVENTS, special action pages, agenda items, and CUSTOMER REVIEWS. Extract the business name, address, logo URL, and website URL.
        2. DYNAMIC TOPIC ENGINE: Create exactly 12 distinct email campaigns (Month 1 = Jan, 2 = Feb, etc). DO NOT just use generic seasonal trends. You MUST base the campaign topics heavily on the actual EVENTS, ACTIONS, and REVIEWS you found on their website. 
           - E.g., if you found a "Wine Tasting Event" on the site, schedule an email to promote it.
           - If you found glowing "Customer Reviews" about a specific dish or the terrace, dedicate an email to highlighting that social proof.
           - CRITICAL PRODUCT FOCUS: Identify the specific products, dishes, or services that customers were most enthusiastic about in the reviews over the past year (the "pearls"). Actively highlight and promote these specific beloved items in the emails.
        3. TEXT LENGTH & FORMATTING: Write RICH, COMPREHENSIVE body text (at least 3 to 4 paragraphs). Make it beautiful, engaging, high-conversion, and structured. Use warm hospitality greetings. It should read like a premium, highly targeted marketing newsletter (not just a 2-sentence update).
        4. IMAGE URL: Scan the provided website markdown for real image links (e.g. .jpg, .png, .webp) that match the theme of the campaign. CRITICAL: NEVER hallucinate, make up, or use placeholder image URLs. If you cannot find a valid, real image URL from the scraped context, RETURN null. ANY URL YOU RETURN MUST BE AN ABSOLUTE URL starting with http:// or https://. Do NOT return relative paths like '/images/logo.png'.
        5. CALL TO ACTION / BOOKING LINK: You MUST include a clear, prominent booking link أو "Reserveer Hier" button at the bottom of the email body text. Use standard HTML link formatting pointing back to the website URL or their reservation system. This is crucial for tracking conversion analytics.
        6. The tone should match the presumed brand voice from the website and the positive sentiment from their reviews, UNLESS dictated otherwise by the Global Instructions.
        7. Provide a short summary of the specific events, reviews, and USPs you deduced and used as input in the 'scrapedContextSummary'.
        8. CRITICAL LANGUAGE REQUIREMENT: You MUST generate all text, including the subject, summary (preview text), and bodyText exclusively in this language: ${language || 'Dutch'}. Overwrite any other language defaults.
      `,
        });

        return NextResponse.json({ success: true, data: object });

    } catch (error: any) {
        console.error('Error generating campaigns:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
