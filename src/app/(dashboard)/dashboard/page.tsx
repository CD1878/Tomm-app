'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CalendarDays, Edit3, Send, CheckCircle2, Loader2, Image as ImageIcon, Eye, MousePointerClick, Users, Link as LinkIcon, BarChart3, HelpCircle } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from 'react';
import { EmailEditor } from "@/components/email-editor";
import { motion } from 'framer-motion';

// Mock data with rich content for the UI
const mockAnalyticsStats = {
    recipients: 2854,
    deliveredPercent: 95.5,
    opens: 1846,
    openPercent: 64.7,
    orders: 2,
    revenue: 0,
    unsubscribes: 37,
    unsubPercent: 1.3,
    visits: 28,
    visitsPercent: 1.0,
    hourlyOpens: [710, 180, 110, 60, 80, 40, 40, 40, 45, 30, 70, 82, 15, 12, 5, 2, 2, 2, 8, 2]
};

const realImages = [
    "https://images.squarespace-cdn.com/content/v1/65b3b1379d0e202bc26a0b09/5b1ff710-b81a-4132-b50f-8589c6a631de/DSC00810-2_websize.jpg",
    "https://images.squarespace-cdn.com/content/v1/65b3b1379d0e202bc26a0b09/ff73eda5-b2d5-46a6-a910-25c88ad5262f/DSC08779-2_websize%2B%281%29+%281%29.jpg",
    "https://images.squarespace-cdn.com/content/v1/65b3b1379d0e202bc26a0b09/95febe77-37bb-46a9-810b-8120e14c4739/DSC03801_websize.jpg",
    "https://images.squarespace-cdn.com/content/v1/65b3b1379d0e202bc26a0b09/ce6ecc45-efdf-4fc0-bb13-b42ebef77a7d/DSC00826-2.jpg",
    "https://images.squarespace-cdn.com/content/v1/65b3b1379d0e202bc26a0b09/01137d2c-189c-43f6-a2e9-4b448a8ed2b8/DSC01758-2_websize.jpg",
    "https://images.squarespace-cdn.com/content/v1/65b3b1379d0e202bc26a0b09/07c676db-042e-4bdd-8ccf-d75a8e7afd07/DSC06246.jpg"
];

const mockCampaigns = [
    {
        month: 1, name: "January", subject: "Een Gezond Begin bij Café Het Paardje 🐴",
        summary: "Highlighting dry january specials like our 0.0% beers and healthy lunch wraps.",
        body: "Lieve gasten,\n\nNa al die feestdagen snappen we dat januari best pittig kan zijn. Tijd voor een fris en gezond begin!\n\nDaarom hebben we deze maand speciale Dry January mocktails en extra veel lichte, gezonde lunchopties aan ons menu toegevoegd. Kom gezellig langs om toch de sfeer van Het Paardje te ervaren, maar dan helemaal zen.\n\nZien we jullie snel?\n\nLiefs,\nTeam Het Paardje",
        imageUrl: realImages[0],
        status: "sent", date: "Jan 5th",
        analytics: mockAnalyticsStats
    },
    {
        month: 2, name: "February", subject: "Liefde & Gezelligheid: Valentine's Day ♥️",
        summary: "Promoting our cozy corner tables and special Valentine's sharing platters.",
        body: "Hey geliefden en vriendschappen,\n\nFebruari staat in het teken van de liefde! Of je nu je partner wilt verrassen of gewoon met je beste vrienden wil proosten, bij ons zit je goed.\n\nWe hebben speciale 'Sharing Platters' samengesteld: heerlijke hapjes om samen te delen onder het genot van een goed glas wijn of speciaalbier.\n\nReserveer snel jullie vaste hoekje online!\n\nProost,\nTeam Het Paardje",
        imageUrl: realImages[1],
        status: "sent", date: "Feb 5th",
        analytics: mockAnalyticsStats
    },
    {
        month: 3, name: "March", subject: "Lente in je Bol! 🌷",
        summary: "De eerste zonnige dagen op het Gerard Douplein terras. Maak je klaar!",
        body: "Hi allemaal,\n\nVoelen jullie het ook? De dagen worden langer en de zon laat zich weer vaker zien op het Gerard Douplein!\n\nOns terras wordt langzaam weer de warmste plek van De Pijp. Hoog tijd om die winterjas thuis te laten en te genieten van de eerste échte zonnestralen met een ijskoud biertje in je hand.\n\nTot snel op het terras!\n\nLiefs,\nTeam Het Paardje",
        imageUrl: realImages[2],
        status: "scheduled", date: "Mar 5th"
    },
    {
        month: 4, name: "April", subject: "Paasbrunch bij Het Paardje 🐰",
        summary: "Familie brunch specials en verruimde openingstijden voor het Paasweekend.",
        body: "Vrolijk Pasen!\n\nHebben jullie al plannen voor het paasweekend? Bij Het Paardje pakken we dit jaar lekker uit met een uitgebreide Paasbrunch.\n\nVerwacht verse eitjes, huisgemaakte baksels en natuurlijk de gezelligste sfeer van Amsterdam. Perfect voor de hele familie.\n\nVergeet niet tijdig een tafeltje veilig te stellen via onze website.\n\nGroetjes,\nTeam Het Paardje",
        imageUrl: realImages[3],
        status: "scheduled", date: "Apr 5th"
    },
    {
        month: 5, name: "May", subject: "Zon, Bier & Bitterballen ☀️",
        summary: "De officiële aftrap van het terrasseizoen. Koude biertjes staan klaar.",
        body: "Hallo zonaanbidders,\n\nEindelijk is het zover: het officiële terrasseizoen is geopend! We hebben de parasols uitgeklapt, de fusten zijn koud gelegd, en de bitterballen liggen klaar voor de frituur.\n\nKom na werk lekker borrelen in het heerlijke lentezonnetje. De eerste ronde bitterballen is op onze kosten als je via deze mail reserveert!\n\nProost,\nTeam Het Paardje",
        imageUrl: realImages[4],
        status: "scheduled", date: "May 5th"
    },
    {
        month: 6, name: "June", subject: "Nieuwe Zomerse Lunchkaart 🥪",
        summary: "Introductie van de nieuwe lichte zomerse menukaart en frisse salades.",
        body: "Beste gasten,\n\nMet het warme weer hebben we de menukaart vernieuwd! Ontdek onze gloednieuwe frisse salades, lichte lunchgerechten en ijskoude huisgemaakte limonades.\n\nPerfect voor een snelle zakenlunch of een lange, lome middag op het plein. Let op: we serveren nu ook de populaire Burrata Sandwich!\n\nZien we je rond de lunch?\n\nGroet,\nHet Paardje",
        imageUrl: realImages[5],
        status: "scheduled", date: "Jun 5th"
    },
    {
        month: 7, name: "July", subject: "Verkoeling op het Terras 🧊",
        summary: "Aandacht voor verfrissende speciaalbieren en koude drankjes tegen de hitte.",
        body: "Poeh, wat een hitte!\n\nAls de mussen van het dak vallen, is er maar één plek in Amsterdam waar het wél uit te houden is: onder onze grote markies met een ijskoude speciaal Weizen in je hand.\n\nWe hebben nieuwe zomerbieren op tap én verse Aperol Spritz klaarstaan. Kom lekker bij ons afkoelen.\n\nTot vanmiddag!\n\nLiefs,\nTeam Het Paardje",
        imageUrl: realImages[0],
        status: "scheduled", date: "Jul 5th"
    },
    {
        month: 8, name: "August", subject: "Laatste Zomerdagen: Borreltijd 🍻",
        summary: "Promotie van langere avondopeningstijden van de keuken voor late borrelaars.",
        body: "Hi Borrelaars,\n\nAugustus! De avonden zijn nog lang en heerlijk zwoel. Om dit maximale uit de zomer te halen, blijft onze keuken deze hele maand extra laat open tijdens de weekenden!\n\nZin in nog een late snack na je drankjes? Wij got you covered met onze heerlijke borrelhappen.\n\nZien we je vanavond?\n\nGroetjes,\nHet Paardje",
        imageUrl: realImages[1],
        status: "scheduled", date: "Aug 5th"
    },
    {
        month: 9, name: "September", subject: "Herfst in De Pijp 🍂",
        summary: "De overgang naar hartige, warme herfstgerechten en rijke bockbieren.",
        body: "Beste vrienden,\n\nDe blaadjes verkleuren en de herfst doet officieel zijn intrede in De Pijp. Tijd om het binnen weer ouderwets gezellig te maken!\n\nWe trappen de herfst af met ons nieuwe bockbier menu. Rijke, donkere bieren die perfect passen bij onze warme bites en het knisperende geroezemoes binnen.\n\nKom gezellig met je vrienden de warmte opzoeken.\n\nLiefs,\nTeam Het Paardje",
        imageUrl: realImages[2],
        status: "scheduled", date: "Sep 5th"
    },
    {
        month: 10, name: "October", subject: "Halloween Borrel & Bites 🎃",
        summary: "Speciale thema-snacks en een knusse sfeer tijdens de koudere oktoberdagen.",
        body: "Boo!\n\nHet is de griezeligste tijd van het jaar, maar bij ons is het natuurlijk alsnog altijd hartstikke knus.\n\nRondom Halloween serveren we speciale 'spooky' cocktails en pompoen bites. Kom gezellig in de stemming met je vrienden, the meer zielen, the meer vreugd!\n\nTrek je leukste outfit aan, of kom gewoon lekker zoals je bent.\n\nTot snel!\n\nLiefs,\nTeam Het Paardje",
        imageUrl: realImages[3],
        status: "scheduled", date: "Oct 5th"
    },
    {
        month: 11, name: "November", subject: "Vier de Feestdagen bij Ons 🥂",
        summary: "Focus op groepsreserveringen en zakelijke eindejaarsborrels.",
        body: "Beste relaties en stamgasten,\n\nDe decembermaand komt sneller dichterbij dan je denkt! Heb je de eindejaarsborrel voor je bedrijf, vriendengroep of sportteam al gepland?\n\nBij Het Paardje verzorgen we compleet geregelde borrels op maat, inclusief heerlijke happen en drankjes. Voorkom stress en reserveer nu alvast jullie plekje voordat we vol zitten.\n\nNeem contact op voor de mogelijkheden.\n\nProost,\nTeam Het Paardje",
        imageUrl: realImages[4],
        status: "scheduled", date: "Nov 5th"
    },
    {
        month: 12, name: "December", subject: "Fijne Feestdagen vanuit Het Paardje ✨",
        summary: "Christmas greetings and New Year's Eve special drinking packages.",
        body: "Lieve gasten,\n\nWat een waanzinnig gezellig jaar hebben we weer samen gehad op het Gerard Douplein! Namens het hele team willen we jullie enorm bedanken voor jullie komst, mooie verhalen en de topsfeer.\n\nWe wensen iedereen fantastische, warme feestdagen. En vergeet niet: we zijn open tijdens Oud & Nieuw voor de echte buurtborrel!\n\nOp een prachtig 2027!\n\nLiefs,\nTeam Het Paardje",
        imageUrl: realImages[5],
        status: "draft", date: "Dec 5th"
    },
];

export default function DashboardPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]); // Default to empty, wait for fetch
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [selectedAnalytics, setSelectedAnalytics] = useState<any>(null);
    const [monthlyInstructions, setMonthlyInstructions] = useState<Record<number, string>>({});
    const [isRegeneratingMonth, setIsRegeneratingMonth] = useState<Record<number, boolean>>({});
    const [approvingCampaignId, setApprovingCampaignId] = useState<number | null>(null);

    const handleRegenerateMonth = async (month: number) => {
        setIsRegeneratingMonth(prev => ({ ...prev, [month]: true }));
        try {
            // Simulate API call for regeneration
            await new Promise(resolve => setTimeout(resolve, 2000));

            const prompt = monthlyInstructions[month] || "Verbeterd op basis van feedback.";
            const isADE = prompt.toLowerCase().includes("ade") || prompt.toLowerCase().includes("amsterdam dance event");

            const updatedSummary = isADE ? "Speciale ADE borrels & bites op het Gerard Douplein!" : `Speciaal voor jullie: ${prompt.substring(0, 30)}...`;
            const updatedBody = isADE
                ? "Beste party people,\n\nIn oktober barst Amsterdam weer los tijdens het Amsterdam Dance Event! Tussen alle feestjes door moet er natuurlijk ook goed gegeten (en gedronken) worden.\n\nDaarom serveren wij deze hele week speciale ADE Recovery bites en espresso martini's op het Gerard Douplein. Kom lekker crashen en bijkomen met je vrienden in de knusse sfeer van Het Paardje.\n\nZien we jullie snel?\n\nLiefs,\nTeam Het Paardje"
                : `Beste gasten,\n\nWe heten je van harte welkom deze maand! ${prompt}\n\nHopelijk zien we jullie snel weer op ons terras of gezellig binnen aan de bar voor een koud biertje en de fameuze bitterballen.\n\nTot dan!\n\nLiefs,\nTeam Het Paardje`;

            setCampaigns(prev => prev.map(c =>
                c.month === month ? { ...c, summary: updatedSummary, body: updatedBody } : c
            ));

            const localData = localStorage.getItem('mock_campaigns_state');
            if (localData) {
                const parsed = JSON.parse(localData);
                const newCamps = parsed.map((c: any) =>
                    c.month === month ? { ...c, summary: updatedSummary, body: updatedBody } : c
                );
                localStorage.setItem('mock_campaigns_state', JSON.stringify(newCamps));
            }
        } finally {
            setIsRegeneratingMonth(prev => ({ ...prev, [month]: false }));
            setMonthlyInstructions(prev => ({ ...prev, [month]: '' })); // Clear input after success
        }
    };

    const fetchCampaigns = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .order('month', { ascending: true });

            if (error) {
                console.error('Error fetching campaigns from Supabase:', error);
                // Fallback on error
                setCampaigns(mockCampaigns);
            } else if (data && data.length > 0) {
                // Map DB columns to our UI expectations
                const mappedCampaigns = data.map(dbCamp => ({
                    id: dbCamp.id,
                    month: dbCamp.month,
                    name: dbCamp.month_name,
                    subject: dbCamp.subject,
                    summary: dbCamp.summary,
                    body: dbCamp.bodyText,
                    imageUrl: dbCamp.image_url,
                    status: dbCamp.status,
                    date: dbCamp.send_date,
                    analytics: dbCamp.status === 'sent' ? mockAnalyticsStats : undefined
                }));
                setCampaigns(mappedCampaigns);
            } else {
                // Fallback to mock data ONLY if the database is completely empty
                setCampaigns(mockCampaigns);
            }
        } else {
            // Unauthenticated bypass mode: use localStorage to persist fake state
            const localData = localStorage.getItem('mock_campaigns_state');
            if (localData) {
                setCampaigns(JSON.parse(localData));
            } else {
                setCampaigns(mockCampaigns);
            }
        }
    };

    const handleApproveCampaign = async (month: number) => {
        setApprovingCampaignId(month);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { error } = await supabase
                    .from('campaigns')
                    .update({ status: 'scheduled' })
                    .eq('month', month)
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                // LocalStorage update
                const localData = localStorage.getItem('mock_campaigns_state');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    const newCamps = parsed.map((c: any) => c.month === month ? { ...c, status: 'scheduled' } : c);
                    localStorage.setItem('mock_campaigns_state', JSON.stringify(newCamps));
                } else {
                    const newCamps = mockCampaigns.map((c: any) => c.month === month ? { ...c, status: 'scheduled' } : c);
                    localStorage.setItem('mock_campaigns_state', JSON.stringify(newCamps));
                }
            }

            // Refresh list
            fetchCampaigns();
        } catch (error) {
            console.error('Error approving campaign:', error);
        } finally {
            setApprovingCampaignId(null);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            // In a real app the global instructions would be fetched from Supabase profiles table,
            // but for this MVP iteration, we will grab it from the settings page if it was saved locally,
            // or just rely on the per-month instructions added on this dashboard.
            const globalInstructions = localStorage.getItem('tomm_global_instructions') || '';

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    websiteUrl: 'https://www.cafehetpaardje.nl/',
                    globalInstructions,
                    monthlyInstructions
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate campaigns');
            }

            const data = await response.json();

            if (data.data?.campaigns && data.data.campaigns.length > 0) {
                // For MVP: We will save these generated campaigns to the Supabase database
                for (const campaign of data.data.campaigns) {
                    await supabase.from('campaigns').insert([{
                        user_id: user?.id,
                        month: campaign.month,
                        month_name: campaign.monthName,
                        subject: campaign.subject,
                        summary: campaign.summary || campaign.bodyText?.substring(0, 100) + '...',
                        bodyText: campaign.bodyText,
                        image_url: campaign.imageUrl,
                        send_date: `${campaign.monthName.substring(0, 3)} 5th`,
                        status: 'draft'
                    }]);
                }
                fetchCampaigns(); // Refresh the list from the database
            } else if (data.campaigns && data.campaigns.length > 0) {
                // Fallback for different response format
                for (const campaign of data.campaigns) {
                    await supabase.from('campaigns').insert([{
                        user_id: user?.id,
                        month: campaign.month,
                        month_name: campaign.monthName || campaign.name,
                        subject: campaign.subject,
                        summary: campaign.summary || 'Generated by AI',
                        send_date: `${campaign.name?.substring(0, 3) || 'Unk'} 5th`,
                        status: 'draft'
                    }]);
                }
                fetchCampaigns();
            } else {
                throw new Error("Invalid API response format");
            }
        } catch (error) {
            console.error('Error generating campaigns:', error);
            // We know the user doesn't have real API keys yet in the demo,
            // so we gracefully fallback to the specific Paardje mock data without failing.
            // Add an artificial delay to simulate the "AI thinking" process for the demo
            await new Promise((resolve) => setTimeout(resolve, 3500));

            // Save mock data to DB so it persists across refreshes and editor closings
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                for (const mockCamp of mockCampaigns) {
                    // Check if already exists to avoid duplicates
                    const { data: existing } = await supabase.from('campaigns').select('id').eq('month', mockCamp.month).eq('user_id', user.id).single();
                    if (!existing) {
                        await supabase.from('campaigns').insert([{
                            user_id: user.id,
                            month: mockCamp.month,
                            month_name: mockCamp.name,
                            subject: mockCamp.subject,
                            summary: mockCamp.summary,
                            bodyText: mockCamp.body,
                            image_url: mockCamp.imageUrl,
                            send_date: mockCamp.date,
                            status: mockCamp.status
                        }]);
                    } else {
                        // Update existing mock campaigns to ensure they get the new full bodies and images
                        await supabase.from('campaigns').update({
                            subject: mockCamp.subject,
                            summary: mockCamp.summary,
                            bodyText: mockCamp.body,
                            image_url: mockCamp.imageUrl,
                            send_date: mockCamp.date,
                            status: mockCamp.status
                        }).eq('id', existing.id);
                    }
                }
            } else {
                // Save to localStorage for demo persistence
                localStorage.setItem('mock_campaigns_state', JSON.stringify(mockCampaigns));
            }

            fetchCampaigns();
        } finally {
            setIsGenerating(false);
        }
    };

    if (selectedCampaign) {

        // Use generic fallback or attempt to extract from global settings if available
        const businessData = {
            name: "Café Het Paardje",
            address: "Gerard Douplein 1",
            zipCode: "1072 VR, Amsterdam",
            website: "www.cafehetpaardje.nl",
            logoUrl: "https://static1.squarespace.com/static/65b3b1379d0e202bc26a0b09/t/65b3b6bb22a08118c45aba8d/1706276539946/logo+het+paardje.png"
        };

        return (
            <div className="w-full bg-[#f8f9fa] overflow-hidden p-6 -mt-8 relative">
                <Button
                    variant="outline"
                    className="absolute top-8 left-8 z-50 bg-white"
                    onClick={() => setSelectedCampaign(null)}
                >
                    &larr; Terug naar campagnes
                </Button>
                <EmailEditor
                    campaign={selectedCampaign}
                    businessData={businessData}
                    onSave={async (updated) => {
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();

                        if (user && updated.id) {
                            await supabase.from('campaigns').update({
                                subject: updated.subject,
                                summary: updated.summary,
                                bodyText: updated.body
                            }).eq('id', updated.id);
                        } else if (!user) {
                            // Update local storage
                            const localData = localStorage.getItem('mock_campaigns_state');
                            if (localData) {
                                const parsed = JSON.parse(localData);
                                const newCamps = parsed.map((c: any) => c.month === updated.month ? { ...c, subject: updated.subject, summary: updated.summary, body: updated.body } : c);
                                localStorage.setItem('mock_campaigns_state', JSON.stringify(newCamps));
                            }
                        }

                        fetchCampaigns();
                        setSelectedCampaign(null);
                    }}
                    onCancel={() => setSelectedCampaign(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#253551]/10 pb-6"
            >
                <div>
                    <Badge variant="outline" className="mb-3 bg-white border-[#253551]/20 text-[#253551] shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> System Active
                    </Badge>
                    <h1 className="text-3xl font-bold tracking-tight text-balance text-[#253551] mb-2">Campaign Overview</h1>
                    <p className="text-black/60 font-light text-pretty max-w-xl">
                        Here are your fully automated email campaigns for the next 12 months, tailored to your brand. They will send automatically on the 5th of every month.
                    </p>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-[#253551] text-white hover:bg-[#253551]/90 shadow-md transition-all font-semibold"
                >
                    {isGenerating ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Site & Generating...</>
                    ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Re-Generate with AI</>
                    )}
                </Button>
            </motion.div>

            {/* 12 Month Grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
            >
                {campaigns.map((camp, i) => (
                    <motion.div
                        key={camp.month}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="h-full"
                    >
                        <Card className="bg-white border-[#253551]/10 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col h-full group">
                            {/* Subtle glow on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#253551]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <CardHeader className="pb-3 border-b border-[#253551]/5 relative z-10">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider tabular-nums text-[#253551]/70">
                                        {camp.name}
                                    </span>
                                    <Badge variant="secondary" className="bg-[#253551]/10 text-[#253551] border-none tabular-nums text-[10px] uppercase font-bold shadow-none">
                                        <CalendarDays className="w-3 h-3 mr-1" /> {camp.date}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg leading-tight text-balance text-[#253551]">{camp.subject}</CardTitle>
                            </CardHeader>


                            <CardContent className="pt-4 flex-1 relative z-10 text-black/60 text-sm font-light">
                                {camp.imageUrl ? (
                                    <div className="mb-4 h-32 w-full rounded-lg border border-[#253551]/10 overflow-hidden relative group-hover:border-[#253551]/20 transition-colors">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={camp.imageUrl}
                                            alt={camp.subject}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback if the AI hallucinated a broken URL or image is missing
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop";
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="mb-4 h-24 bg-slate-50/80 rounded-lg border border-[#253551]/10 flex items-center justify-center text-black/20 group-hover:border-[#253551]/20 group-hover:bg-[#253551]/5 transition-colors">
                                        <ImageIcon className="w-6 h-6 mb-1 opacity-50 text-[#253551]" />
                                    </div>
                                )}
                                <div className="mt-2 text-black/80 text-sm overflow-hidden flex-1 relative">
                                    <p className="whitespace-pre-wrap line-clamp-[8] pb-8 leading-relaxed">
                                        {camp.body || `Hey there,\n\n${camp.summary}\n\nReserveer Hier: https://www.cafehetpaardje.nl\n\nCheers,\n[Your Restaurant]`}
                                    </p>
                                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                </div>

                                <div className="mt-auto pt-4 border-t border-[#253551]/10">
                                    <Label className="text-xs font-semibold text-[#253551] mb-2 block">Custom Instructions for {camp.name}</Label>
                                    <Textarea
                                        placeholder={`e.g. Focus on our new terrace this month...`}
                                        value={monthlyInstructions[camp.month] || ''}
                                        onChange={(e) => setMonthlyInstructions(prev => ({ ...prev, [camp.month]: e.target.value }))}
                                        className="h-16 text-xs bg-white border-[#253551]/20 resize-none focus-visible:ring-1 focus-visible:ring-[#253551] placeholder:text-black/30 w-full mb-2"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleRegenerateMonth(camp.month)}
                                        disabled={isRegeneratingMonth[camp.month] || !monthlyInstructions[camp.month]}
                                        className="w-full text-xs bg-[#253551] text-white hover:bg-[#253551]/90"
                                    >
                                        {isRegeneratingMonth[camp.month] ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                        {isRegeneratingMonth[camp.month] ? "Regenerating..." : "Regenerate Content"}
                                    </Button>
                                </div>

                                {/* Analytics Mock Overview */}
                                {camp.status === 'sent' ? (
                                    <div className="mt-4 pt-4 border-t border-[#253551]/10 grid grid-cols-3 gap-2 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center tabular-nums text-[#253551] mb-1">
                                                <Users className="w-3 h-3 mr-1" />
                                                <span className="text-xs font-bold">1,240</span>
                                            </div>
                                            <span className="text-[10px] text-black/40 uppercase tracking-wider">Sent</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center tabular-nums text-green-600 mb-1">
                                                <Eye className="w-3 h-3 mr-1" />
                                                <span className="text-xs font-bold">{camp.analytics?.openPercent || 58}%</span>
                                            </div>
                                            <span className="text-[10px] text-black/40 uppercase tracking-wider">Opened</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center tabular-nums text-blue-600 mb-1">
                                                <MousePointerClick className="w-3 h-3 mr-1" />
                                                <span className="text-xs font-bold">14%</span>
                                            </div>
                                            <span className="text-[10px] text-black/40 uppercase tracking-wider">Clicks</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 pt-4 border-t border-[#253551]/10 flex items-center justify-between">
                                        <span className="text-xs text-black/40 flex items-center"><LinkIcon className="w-3 h-3 mr-1" /> Tracking CTA Clicks</span>
                                        <span className="text-xs font-semibold text-[#253551] flex items-center"><Users className="w-3 h-3 mr-1" /> ~1,240 Reach</span>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0 relative z-10 border-t border-[#253551]/5 mt-4 flex items-center justify-between bg-slate-50 py-3">
                                <Badge className={
                                    camp.status === 'sent'
                                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-none border-none'
                                        : camp.status === 'scheduled'
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-none border-none'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-none border-none'
                                }>
                                    {camp.status === 'draft' ? 'Concept' : camp.status === 'sent' ? 'Verzonden' : 'Goedgekeurd'}
                                </Badge>

                                <div className="flex items-center gap-2">
                                    {camp.status === 'sent' && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#253551]/50 hover:text-[#253551] hover:bg-[#253551]/10 rounded-full" onClick={() => setSelectedAnalytics(camp)}>
                                                    <BarChart3 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            {selectedAnalytics?.month === camp.month && (
                                                <DialogContent className="sm:max-w-[800px] bg-[#f2f4f6] border-[#253551]/20 text-black rounded-lg p-0 overflow-hidden">
                                                    <DialogHeader className="border-b border-black/10 p-6 pb-4 bg-white relative">
                                                        <div className="flex items-center justify-between">
                                                            <DialogTitle className="text-xl font-medium text-[#111827] flex items-center gap-2">
                                                                <span className="text-[#6B7280]">Campaigns</span>
                                                                <span className="text-[#D1D5DB] font-light">/</span>
                                                                <span className="flex items-center gap-2">🎉 {camp.subject}</span>
                                                            </DialogTitle>
                                                            <div className="text-xs text-[#6B7280]">Sent on Thursday 15 January at 12:05</div>
                                                        </div>
                                                    </DialogHeader>

                                                    <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                                                        <div className="flex gap-6 border-b border-black/10 mb-8 font-medium text-sm">
                                                            <div className="pb-3 border-b-2 border-blue-500 text-[#111827]">Statistics</div>
                                                            <div className="pb-3 text-[#6B7280]">Recipients</div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-12 mb-10">
                                                            {/* Recipients */}
                                                            <div>
                                                                <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Recipients <HelpCircle className="w-3 h-3" /></div>
                                                                <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.analytics?.recipients}</div>
                                                                <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                    <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">{camp.analytics?.deliveredPercent}%</span> delivered
                                                                </div>
                                                            </div>
                                                            {/* Orders */}
                                                            <div>
                                                                <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Orders <HelpCircle className="w-3 h-3" /></div>
                                                                <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.analytics?.orders}</div>
                                                                <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                    <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">€{camp.analytics?.revenue}</span> revenue
                                                                </div>
                                                            </div>
                                                            {/* Unsubscribes */}
                                                            <div>
                                                                <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Unsubscribes <HelpCircle className="w-3 h-3" /></div>
                                                                <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.analytics?.unsubscribes}</div>
                                                                <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                    <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">{camp.analytics?.unsubPercent} %</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-12">
                                                            {/* Opens & Visits */}
                                                            <div className="flex flex-col gap-10">
                                                                <div>
                                                                    <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Opens <HelpCircle className="w-3 h-3" /></div>
                                                                    <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.analytics?.opens}</div>
                                                                    <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                        <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">{camp.analytics?.openPercent} %</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Visits <HelpCircle className="w-3 h-3" /></div>
                                                                    <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.analytics?.visits}</div>
                                                                    <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                        <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">{camp.analytics?.visitsPercent} %</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Chart */}
                                                            <div className="col-span-2">
                                                                <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-6">Opens in first 20 hours <HelpCircle className="w-3 h-3" /></div>
                                                                <div className="h-[220px] flex items-end gap-[6px] border-b border-l border-[#D1D5DB] pb-1 pl-2 relative ml-6">
                                                                    {/* Y axis labels */}
                                                                    <div className="absolute -left-7 bottom-0 h-full flex flex-col justify-between text-[10px] text-[#9CA3AF] py-1">
                                                                        <span>800</span><span>600</span><span>400</span><span>200</span><span className="opacity-0">0</span>
                                                                    </div>
                                                                    {/* Null baseline */}
                                                                    <div className="absolute -left-4 -bottom-[6px] text-[10px] text-[#9CA3AF]">0</div>

                                                                    {camp.analytics?.hourlyOpens.map((count: number, i: number) => (
                                                                        <div key={i} className="flex-1 bg-[#1877F2] hover:bg-[#1877F2]/80 transition-colors flex flex-col justify-end group relative rounded-t-[1px]" style={{ height: `${Math.max(1, (count / 800) * 100)}%` }}>
                                                                            <div className="absolute -bottom-5 w-full text-center text-[9px] text-[#9CA3AF]">{i}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            )}
                                        </Dialog>
                                    )}
                                    {camp.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproveCampaign(camp.month)}
                                            disabled={approvingCampaignId === camp.month}
                                            className="h-8 text-xs bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all"
                                        >
                                            {approvingCampaignId === camp.month ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Goedkeuren'}
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#253551]/50 hover:text-[#253551] hover:bg-[#253551]/10 rounded-full" onClick={() => setSelectedCampaign(camp)}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
