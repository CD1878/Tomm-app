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
    suggestedImageTheme: z.string(),
});

const CampaignsSchema = z.object({
    campaigns: z.array(EmailSchema).length(12),
    scrapedContextSummary: z.string(),
});

export async function POST(req: Request) {
    try {
        // Initialize Firecrawl inside the handler to prevent static build errors if env var is missing
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || 'dummy_key' });

        const { websiteUrl } = await req.json();

        if (!websiteUrl) {
            return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 });
        }

        // 1. Scrape the website using Firecrawl
        console.log(`Scraping: ${websiteUrl}`);
        const scrapeResult = await firecrawl.scrape(websiteUrl, {
            formats: ['markdown'],
            onlyMainContent: true,
        });

        if (!scrapeResult.markdown) {
            return NextResponse.json({ error: 'Failed to scrape website' }, { status: 500 });
        }

        const websiteContent = scrapeResult.markdown.substring(0, 15000); // Limit context window

        // 2. Generate 12 months of emails using OpenAI
        console.log('Generating 12-month campaign plan...');
        const { object } = await generateObject({
            model: openai('gpt-4o'),
            schema: CampaignsSchema,
            prompt: `
        You are an expert hospitality marketing copywriter. We need to create a 12-month "set-and-forget" email marketing campaign for a restaurant/hospitality business.
        
        Here is the scraped content from their website:
        ---
        ${websiteContent}
        ---

        Instructions:
        1. Analyze the business based on the scraped website content (vibe, menu, unique selling points, if they have a terrace, event spaces, etc.).
        2. Create exactly 12 distinct email campaigns, one for each month of the year.
        3. Make the content highly relevant to the business but generic enough that the owner doesn't NEED to edit it (though they can).
        4. Tie campaigns to seasonal hospitality trends (e.g., January: Healthy start/Dry January; February: Valentine's; Spring: Terrace opening; December: Holiday bookings).
        5. The tone should match the presumed brand voice from the website.
        6. Provide a short summary of what you deduced about the business in 'scrapedContextSummary'.
      `,
        });

        return NextResponse.json({ success: true, data: object });

    } catch (error: any) {
        console.error('Error generating campaigns:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
