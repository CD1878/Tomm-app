import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        let targetUrl = url;
        if (!targetUrl.match(/^https?:\/\//i)) {
            targetUrl = `https://${targetUrl}`;
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
                url: targetUrl,
                formats: ['markdown', 'links'],
            }),
        });

        if (!response.ok) {
            console.log("Firecrawl API failed or insufficient credits. Attempting native Cheerio fallback...");
            try {
                const fallbackResponse = await fetch(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                });

                if (!fallbackResponse.ok) {
                    throw new Error(`Fallback HTTP error ${fallbackResponse.status}`);
                }
                const html = await fallbackResponse.text();

                const $ = cheerio.load(html);
                const title = $('title').text() || new URL(targetUrl).hostname;
                const description = $('meta[name="description"]').attr('content') || '';

                const links: string[] = [];
                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                        links.push(href);
                    }
                });

                // Clean the HTML before Turndown
                $('script, style, noscript, iframe, nav, footer').remove();

                const turndownService = new TurndownService({ headingStyle: 'atx' });
                const markdownRaw = turndownService.turndown($('body').html() || '');
                const markdown = `# ${title}\n\n${description}\n\n${markdownRaw}`;

                let reservationUrl = '';
                const reservationRegex = /(formitable\.com|resengo\.com|zenchef\.com|tebi\.com|guestplan\.com|thefork\.com|book|reserveer|reservation)/i;
                const foundLink = links.find((link: string) => reservationRegex.test(link));

                if (foundLink) {
                    if (foundLink.startsWith('http')) {
                        reservationUrl = foundLink;
                    } else if (foundLink.startsWith('/') || foundLink.startsWith('#')) {
                        try {
                            const baseUrl = new URL(targetUrl);
                            reservationUrl = `${baseUrl.origin}${foundLink.startsWith('/') ? '' : '/'}${foundLink}`;
                        } catch (e) {
                            reservationUrl = '';
                        }
                    } else {
                        reservationUrl = foundLink;
                    }
                }

                console.log("Successfully scraped using Cheerio fallback.");

                return NextResponse.json({
                    success: true,
                    markdown: markdown,
                    metadata: { title, description },
                    links: links,
                    reservationUrl: reservationUrl,
                    fallbackUsed: true
                });

            } catch (fallbackError: any) {
                console.error("Native Cheerio fallback also failed:", fallbackError);
                // Return original Firecrawl error if both fail
                const errorData = await response.json().catch(() => ({}));
                return NextResponse.json({ error: 'Failed to scrape URL (Both Firecrawl and Fallback failed)', details: errorData }, { status: response.status });
            }
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
                        try {
                            const baseUrl = new URL(targetUrl);
                            reservationUrl = `${baseUrl.origin}${foundLink.startsWith('/') ? '' : '/'}${foundLink}`;
                        } catch (e) {
                            reservationUrl = '';
                        }
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
