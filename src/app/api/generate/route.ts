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
});

export async function POST(req: Request) {
    try {
        // Initialize Firecrawl inside the handler to prevent static build errors if env var is missing
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || 'dummy_key' }) as any;

        const { websiteUrl, globalInstructions, monthlyInstructions } = await req.json();

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
        1. Analyze the business based on the scraped website content (vibe, menu, unique selling points, if they have a terrace, event spaces, etc.).
        2. Create exactly 12 distinct email campaigns, one for each month of the year (Month 1 = Jan, 2 = Feb, etc).
        3. Make the body text beautiful, engaging, and structured. Use short paragraphs and warm hospitality greetings. Do not just output one boring summary line. It should read like a premium marketing email.
        4. IMAGE URL: Scan the provided website markdown for real image links (e.g. .jpg, .png, .webp). Try to find an image url that matches the theme of the month (e.g., drinks for summer, cozy interior for winter). If you find one, include it as a full absolute URL in the imageUrl field.
        5. Tie campaigns to seasonal hospitality trends (e.g., January: Healthy start; February: Valentine's; Spring: Terrace opening; December: Holiday bookings).
        6. The tone should match the presumed brand voice from the website, UNLESS dictated otherwise by the Global Instructions.
        7. Provide a short summary of what you deduced about the business in 'scrapedContextSummary'.
      `,
        });

        return NextResponse.json({ success: true, data: object });

    } catch (error: any) {
        console.error('Error generating campaigns:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
