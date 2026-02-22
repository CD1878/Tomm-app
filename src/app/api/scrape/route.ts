import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Firecrawl API key not configured' }, { status: 500 });
        }

        // Initialize Firecrawl scraping job
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                url: url,
                formats: ['markdown'],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: 'Failed to scrape URL', details: errorData }, { status: response.status });
        }

        const data = await response.json();

        if (data && data.success && data.data) {
            return NextResponse.json({
                success: true,
                markdown: data.data.markdown,
                metadata: data.data.metadata
            });
        }

        return NextResponse.json({ error: 'Unexpected response from Firecrawl' }, { status: 500 });

    } catch (error: any) {
        console.error('Error in scrape API route:', error);
        return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
    }
}
