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
                formats: ['markdown', 'links'],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: 'Failed to scrape URL', details: errorData }, { status: response.status });
        }

        const data = await response.json();

        if (data && data.success && data.data) {
            let reservationUrl = '';

            // Try to find a reservation platform link from the extracted links
            if (data.data.links && Array.isArray(data.data.links)) {
                // Common reservation platforms and keywords
                const reservationRegex = /(formitable\.com|resengo\.com|zenchef\.com|tebi\.com|guestplan\.com|thefork\.com|book|reserveer|reservation)/i;
                const foundLink = data.data.links.find((link: string) => reservationRegex.test(link));

                if (foundLink) {
                    // Resolve relative URLs or anchor tags back to the original domain if needed
                    if (foundLink.startsWith('http')) {
                        reservationUrl = foundLink;
                    } else if (foundLink.startsWith('/') || foundLink.startsWith('#')) {
                        const baseUrl = new URL(url);
                        reservationUrl = `${baseUrl.origin}${foundLink.startsWith('/') ? '' : '/'}${foundLink}`;
                    } else {
                        reservationUrl = foundLink;
                    }
                }
            }

            return NextResponse.json({
                success: true,
                markdown: data.data.markdown,
                metadata: data.data.metadata,
                links: data.data.links,
                reservationUrl: reservationUrl
            });
        }

        return NextResponse.json({ error: 'Unexpected response from Firecrawl' }, { status: 500 });

    } catch (error: any) {
        console.error('Error in scrape API route:', error);
        return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
    }
}
