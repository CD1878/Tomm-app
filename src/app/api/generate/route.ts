import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const EmailSchema = z.object({
    month: z.number(),
    monthName: z.string(),
    subject: z.string(),
    heroText: z.string(),
    bodyText: z.string(),
    callToAction: z.string(),
    imageUrl: z.string().optional().describe('URL of a relevant image extracted from the website context. Must be an absolute URL.'),
});

const CampaignsSchema = z.object({
    campaigns: z.array(EmailSchema).length(12),
    scrapedContextSummary: z.string(),
    businessName: z.string().describe("The real name of the restaurant or business"),
    businessAddress: z.string().describe("The physical address of the business"),
    businessWebsite: z.string().describe("The homepage URL of the business"),
    businessLogo: z.string().optional().describe("Absolute URL to the business logo image, if found. Usually in the header or footer of the website."),
});

export async function POST(req: Request) {
    try {
        // Initialize Firecrawl inside the handler to prevent static build errors if env var is missing
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || 'dummy_key' }) as any;

        const { websiteUrl, globalInstructions, monthlyInstructions, language } = await req.json();

        if (!websiteUrl) {
            return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 });
        }

        // 1. Scrape the website using Firecrawl (Deep Crawl)
        console.log(`Starting Deep Crawl: ${websiteUrl}`);
        const crawlResponse = await firecrawl.crawlUrl(websiteUrl, {
            limit: 10, // Crawl up to 10 subpages (Home, Menu, Groups, Contact, etc.)
            scrapeOptions: {
                formats: ['markdown'],
                onlyMainContent: true,
            }
        });

        if (!crawlResponse.success || !crawlResponse.data) {
            return NextResponse.json({ error: 'Failed to crawl website' }, { status: 500 });
        }

        // Combine all the scraped pages into one massive context document
        let websiteContent = "--- COMPILED BUSINESS WEBSITE DATA ---\n\n";
        for (const page of crawlResponse.data) {
            if (page.markdown) {
                websiteContent += `\n\n--- PAGE: ${page.metadata?.title || page.url} ---\n`;
                websiteContent += page.markdown;
            }
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
        1. Analyze the business based on the scraped website content (vibe, menu, unique selling points, if they have a terrace, event spaces, etc.). Extract the business name, physical address, logo URL, and website URL for the global fields.
        2. Create exactly 12 distinct email campaigns, one for each month of the year (Month 1 = Jan, 2 = Feb, etc).
        3. Make the body text beautiful, engaging, and structured. Use short paragraphs and warm hospitality greetings. Do not just output one boring summary line. It should read like a premium marketing email.
        4. IMAGE URL: Scan the provided website markdown for real image links (e.g. .jpg, .png, .webp) that match the theme of the month. CRITICAL: NEVER hallucinate, make up, or use placeholder image URLs (like unsplash source). If you cannot find a valid, real absolute image URL from the scraped context, LEAVE IT UNDEFINED. 
        5. CALL TO ACTION / BOOKING LINK: You MUST include a clear, prominent booking link or "Reserveer Hier" button at the bottom of the email body text. Use standard HTML link formatting pointing back to the website URL or their reservation system. This is crucial for tracking conversion analytics.
        6. Tie campaigns to seasonal hospitality trends (e.g., January: Healthy start; February: Valentine's; Spring: Terrace opening; December: Holiday bookings).
        7. The tone should match the presumed brand voice from the website, UNLESS dictated otherwise by the Global Instructions.
        8. Provide a short summary of what you deduced about the business in 'scrapedContextSummary'.
        9. CRITICAL LANGUAGE REQUIREMENT: You MUST generate all text, including the subject, summary (preview text), and bodyText exclusively in this language: ${language || 'Dutch'}. Overwrite any other language defaults.
      `,
        });

        return NextResponse.json({ success: true, data: object });

    } catch (error: any) {
        console.error('Error generating campaigns:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
