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
});

const CampaignsSchema = z.object({
    campaigns: z.array(EmailSchema).length(12),
    scrapedContextSummary: z.string(),
});

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        let { websiteUrl, instagramUrl, globalInstructions, monthlyInstructions, language } = await req.json();

        // 1. Setup Auth Server-Side
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader || '' } }
        });

        // Test auth logic to see if user is actually authenticated in the API
        const { data: { user } } = await supabase.auth.getUser();
        console.log("SERVER SIDE GENERATION INITIATED FOR USER:", user?.id || "Unauthenticated");

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

                $('img, div, section, header').each((_, el) => {
                    // Try to get standard image sources
                    let src = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');

                    // Also try to get background-image from inline style
                    if (!src) {
                        const style = $(el).attr('style');
                        if (style) {
                            const bgMatch = style.match(/background-image:\s*url\s*\(\s*['"]?(.*?)['"]?\s*\)/i);
                            if (bgMatch && bgMatch[1]) src = bgMatch[1];
                        }
                    }

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

        // PASS 3: Instagram Serverless Extraction via Jina AI & Picuki Fallback
        if (instagramUrl && instagramUrl.includes('instagram.com')) {
            console.log(`Attempting to scrape Instagram via Jina + Picuki SERVERLESS: ${instagramUrl}`);
            try {
                const match = instagramUrl.match(/instagram\.com\/([^\/]+)/);
                if (match && match[1]) {
                    const handle = match[1];
                    const picukiUrl = `https://www.picuki.com/profile/${handle}`;
                    const jinaPicukiUrl = `https://r.jina.ai/${picukiUrl}`;

                    const jinaRes = await fetch(jinaPicukiUrl, {
                        headers: {
                            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY || ''}`, // Optionally use if Jina requires it, else omit
                            'X-Return-Format': 'markdown'
                        }
                    });

                    if (jinaRes.ok) {
                        const markdown = await jinaRes.text();
                        // Extract all markdown image links: ![alt](url)
                        const imageRegex = /!\[.*?\]\((https?:\/\/.*?\.jpg.*?)\)/gi;
                        let matchImg;
                        const extractedIgImages = new Set<string>();

                        while ((matchImg = imageRegex.exec(markdown)) !== null) {
                            extractedIgImages.add(matchImg[1]);
                        }

                        const imagesList = Array.from(extractedIgImages);
                        console.log(`Jina+Picuki fallback found ${imagesList.length} images.`);

                        if (imagesList.length > 0) {
                            console.log(`Found ${imagesList.length} Instagram images natively. Uploading to Supabase...`);
                            const permanentUrls: string[] = [];

                            for (let i = 0; i < imagesList.length && i < 24; i++) {
                                try {
                                    const res = await fetch(imagesList[i]);
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
                                    console.error("Failed to rehost IG image", e);
                                }
                            }

                            if (permanentUrls.length > 0) {
                                console.log(`Successfully rehosted ${permanentUrls.length} images to Supabase.`);
                                websiteContent += `\n\n--- MASSIVE COLLECTION OF EXPLICITLY FOUND INSTAGRAM IMAGES (PRIORITIZE THESE FIRST FOR HERO IMAGES) ---\n${permanentUrls.join('\n')}\n`;
                            } else {
                                console.log("Failed to rehost. Falling back to raw Picuki URLs.");
                                websiteContent += `\n\n--- MASSIVE COLLECTION OF EXPLICITLY FOUND INSTAGRAM IMAGES (PRIORITIZE THESE FIRST FOR HERO IMAGES) ---\n${imagesList.slice(0, 24).join('\n')}\n`;
                            }
                        }
                    } else {
                        console.log("Jina+Picuki request failed:", jinaRes.status);
                    }
                }
            } catch (igError: any) {
                console.log("Jina+Picuki Serverless scrape completely failed: ", igError.message);
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
        1. DEEP BUSINESS ANALYSIS: Analyze the business based on the scraped website/instagram content. Extract the core vibe, menu highlights, unique selling points, and crucially: ALL UPCOMING EVENTS, special action pages, agenda items, and CUSTOMER REVIEWS.
        2. DYNAMIC TOPIC ENGINE & DATES: Create exactly 12 distinct email campaigns (Month 1 = Jan, 2 = Feb, etc). 
           - CRITICAL DATE INSTRUCTION: The current year is ${currentYear}. All events, greetings, and references must be for ${currentYear} and ${currentYear + 1}. NEVER use past years like 2023 or 2024.
           - DO NOT just use generic seasonal trends. You MUST base the campaign topics heavily on the actual EVENTS, ACTIONS, and REVIEWS you found on their website/instagram. 
           - E.g., if you found a "Wine Tasting Event" on the site, schedule an email to promote it.
           - If you found glowing "Customer Reviews" about a specific dish or the terrace, dedicate an email to highlighting that social proof.
           - CRITICAL PRODUCT FOCUS: Identify the specific products, dishes, or services that customers were most enthusiastic about in the reviews over the past year (the "pearls"). Actively highlight and promote these specific beloved items in the emails.
        3. TEXT LENGTH & FORMATTING: Write engaging, warm body text (at least 2 to 3 paragraphs). Make it beautiful, high-conversion, and structured. Use warm hospitality greetings. It should read like a premium marketing newsletter.
           - CRITICAL FORMATTING: ONLY use PLAIN TEXT. NEVER, EVER use HTML tags like <br>, <a>, or <b> in any of the fields. Separate paragraphs with exactly two newlines (\\n\\n).
           - EXTREME SEASONALITY: Make the text hyper-relevant to the exact season or month (e.g., heavily focus on summer terrace vibes in July/August, and warm, cozy winter/Christmas vibes in December). Tie the website's events and offerings to these seasons naturally. The text must read as an authentic, engaging newsletter for the customer.
        4. CALL TO ACTION / BOOKING LINK: DO NOT put an HTML link in the body text or use HTML tags! Instead, put the call to action text (like "Reserveer Hier" or "Bekijk het menu") inside the 'callToAction' field.
        5. The tone should match the presumed brand voice from the website and the positive sentiment from their reviews, UNLESS dictated otherwise by the Global Instructions. Ensure the texts are "normal" and read like a fun, general update without weird characters.
        6. Provide a short summary of the specific events, reviews, and USPs you deduced and used as input in the 'scrapedContextSummary'.
        7. CRITICAL LANGUAGE REQUIREMENT: You MUST generate all text, including the subject, summary (preview text), and bodyText exclusively in this language: ${language || 'Dutch'}. Overwrite any other language defaults.
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

        // 1. Deterministic Business Metrics
        let determinedBusinessName = '';
        try {
            const $ = cheerio.load(websiteContent);
            const titleMatch = websiteContent.match(/Title: (.*?)\n/);
            if (titleMatch && titleMatch[1]) {
                determinedBusinessName = titleMatch[1].split('-')[0].split('|')[0].trim();
            }
        } catch (e) { }

        if (!determinedBusinessName || determinedBusinessName.length < 2) {
            determinedBusinessName = new URL(targetUrl).hostname.replace('www.', '').split('.')[0];
            determinedBusinessName = determinedBusinessName.charAt(0).toUpperCase() + determinedBusinessName.slice(1);
        }

        let determinedLogo: string | null = null;
        if (likelyLogoUrls.size > 0) {
            determinedLogo = Array.from(likelyLogoUrls)[0];
        } else {
            // Clearbit provides a reliable 1-click fallback for company logos
            determinedLogo = `https://logo.clearbit.com/${new URL(targetUrl).hostname}`;
            console.log("Applied Clearbit Ultimate Logo Fallback:", determinedLogo);
        }

        // 2. Deterministic Image Assignment (Extracting IG image block to use deterministically)
        // Extract Instagram links from context if they got generated there
        const instaMatch = websiteContent.match(/--- MASSIVE COLLECTION OF EXPLICITLY FOUND INSTAGRAM IMAGES.*?---\n([\s\S]*?)(?=\n\n---|$)/i);
        let instagramImageUrls: string[] = [];
        if (instaMatch && instaMatch[1]) {
            instagramImageUrls = instaMatch[1].split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
        }

        const realWebsiteImages = Array.from(fallbackImageUrls).filter(url => url !== determinedLogo && !url.toLowerCase().includes('logo'));

        // Combine IG images and website images sequentially
        const combinedFallbacks = [...instagramImageUrls, ...realWebsiteImages];
        const activeImagePool = combinedFallbacks.length > 0 ? combinedFallbacks : fallbackImages;

        let finalCampaigns: any[] = [];
        if (object.campaigns) {
            finalCampaigns = object.campaigns.map((camp, index) => {
                let imgUrl = activeImagePool[index % activeImagePool.length];

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

        const finalData = {
            ...object,
            campaigns: finalCampaigns,
            businessName: determinedBusinessName,
            businessLogo: determinedLogo,
            businessWebsite: targetUrl,
            businessAddress: "Update address in settings"
        };

        // FINAL SERVER-SIDE SUPABASE SAVE (Bypasses unreliable client-side execution)
        if (user) {
            console.log("Saving generated data directly to Supabase server-side...");
            // 1. Update Profile (Business Name & Logo)
            const { error: profileErr } = await supabase.from('profiles').update({
                business_name: determinedBusinessName,
                logo_url: determinedLogo,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);

            if (profileErr) console.error("Database Save Error (Profiles):", profileErr.message);

            // 2. Clear out existing campaigns to prevent duplicates
            await supabase.from('campaigns').delete().eq('user_id', user.id);

            // 3. Insert 12 new campaigns
            const dbCampaignsRowBatch = finalData.campaigns.map((camp: any) => ({
                user_id: user.id,
                month: camp.month,
                month_name: camp.monthName,
                subject: camp.subject,
                summary: camp.summary || camp.bodyText?.substring(0, 100) + '...',
                bodyText: camp.bodyText,
                image_url: camp.imageUrl,
                send_date: `${camp.monthName.substring(0, 3)} 27th`,
                call_to_action: camp.callToAction,
                status: 'draft'
            }));

            const { error: campErr } = await supabase.from('campaigns').insert(dbCampaignsRowBatch);
            if (campErr) console.error("Database Save Error (Campaigns):", campErr.message);

            console.log(`Successfully saved Profile + ${dbCampaignsRowBatch.length} Campaigns for User ${user.id}`);
        }

        console.log("---- SUCCESSFULLY GENERATED ----");
        console.log("EXTRACTED LOGO:", finalData.businessLogo);

        return NextResponse.json({ success: true, data: finalData });

    } catch (error: any) {
        console.error('Error generating campaigns:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
