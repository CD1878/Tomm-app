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


export default function DashboardPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]); // Default to empty, wait for fetch
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [selectedAnalytics, setSelectedAnalytics] = useState<any>(null);
    const [monthlyInstructions, setMonthlyInstructions] = useState<Record<number, string>>({});
    const [isRegeneratingMonth, setIsRegeneratingMonth] = useState<Record<number, boolean>>({});
    const [approvingCampaignId, setApprovingCampaignId] = useState<number | null>(null);
    const [businessInfo, setBusinessInfo] = useState<{ name: string, logoUrl: string, website: string, address?: string, zipCode?: string } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [contactsCount, setContactsCount] = useState<number>(0);

    const handleRegenerateMonth = async (month: number) => {
        setIsRegeneratingMonth(prev => ({ ...prev, [month]: true }));
        try {
            // Simulate API call for regeneration
            await new Promise(resolve => setTimeout(resolve, 2000));

            const prompt = monthlyInstructions[month] || "Verbeterd op basis van feedback.";
            const isADE = prompt.toLowerCase().includes("ade") || prompt.toLowerCase().includes("amsterdam dance event");

            const updatedSummary = isADE ? "Speciale ADE borrels & bites!" : `Speciaal voor jullie: ${prompt.substring(0, 30)}...`;
            const updatedBody = isADE
                ? `Beste party people,\n\nIn oktober barst Amsterdam weer los tijdens het Amsterdam Dance Event! Tussen alle feestjes door moet er natuurlijk ook goed gegeten (en gedronken) worden.\n\nDaarom serveren wij deze hele week speciale ADE Recovery gerechten. Kom lekker crashen en bijkomen met je vrienden in de knusse sfeer van ${businessInfo?.name || 'ons restaurant'}.\n\nZien we jullie snel?\n\nLiefs,\nTeam ${businessInfo?.name || 'Restaurant'}`
                : `Beste gasten,\n\nWe heten je van harte welkom deze maand! ${prompt}\n\nHopelijk zien we jullie snel weer op ons terras of gezellig binnen aan de bar.\n\nTot dan!\n\nLiefs,\nTeam ${businessInfo?.name || 'Restaurant'}`;

            setCampaigns(prev => prev.map(c =>
                c.month === month ? { ...c, summary: updatedSummary, body: updatedBody } : c
            ));

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: currentCamp } = await supabase.from('campaigns')
                    .select('id').eq('user_id', user.id).eq('month', month).single();

                if (currentCamp) {
                    await supabase.from('campaigns').update({
                        summary: updatedSummary,
                        bodyText: updatedBody
                    }).eq('id', currentCamp.id);
                }
            }
        } finally {
            setIsRegeneratingMonth(prev => ({ ...prev, [month]: false }));
            setMonthlyInstructions(prev => ({ ...prev, [month]: '' })); // Clear input after success
        }
    };

    const fetchCampaigns = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // First fetch the user's business profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                setBusinessInfo({
                    name: profile.business_name || 'Your Hospitality Business',
                    logoUrl: profile.logo_url || '',
                    website: profile.website_url || 'https://example.com',
                    address: profile.address || '',
                    zipCode: profile.zip_code || ''
                });
            }

            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('user_id', user.id)
                .order('month', { ascending: true });

            if (error) {
                console.error('Error fetching campaigns from Supabase:', error);
                // Fallback on error
                setCampaigns([]);
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
                    stats_opens: dbCamp.stats_opens,
                    stats_clicks: dbCamp.stats_clicks,
                    stats_delivered: dbCamp.stats_delivered,
                    analytics: undefined // We will rely on real stats now
                }));
                setCampaigns(mappedCampaigns);
            } else {
                // Return empty array for blank state
                setCampaigns([]);
            }
        } else {
            // Unauthenticated bypass mode
            setCampaigns([]);
        }
        setIsLoading(false);
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
            }

            // Refresh list
            fetchCampaigns();
        } catch (error) {
            console.error('Error approving campaign:', error);
        } finally {
            setApprovingCampaignId(null);
        }
    };

    const fetchContactsCount = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { count, error } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('unsubscribed', false);

            if (!error && count !== null) {
                setContactsCount(count);
            }
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchContactsCount();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch customized language and instructions from the user's cloud profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user ? user.id : '474a5578-98f9-467b-ae73-f61715d567a5').single();

            const globalInstructions = profile?.global_instructions || '';
            const savedLanguage = profile?.default_language || 'NL';
            const targetWebsite = profile?.website_url || '';

            if (!targetWebsite) {
                alert("Vul eerst je Website URL in bij Settings voordat je campagnes genereert!");
                setIsGenerating(false);
                return;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    websiteUrl: targetWebsite,
                    globalInstructions,
                    monthlyInstructions,
                    language: savedLanguage
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || (typeof errData === 'string' ? errData : 'Failed to generate campaigns'));
            }

            const data = await response.json();

            if (data.data?.campaigns && data.data.campaigns.length > 0) {

                // Update the user's profile with the automatically extracted business info (logo, name, etc.)
                if (user) {
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        business_name: data.data.businessName || profile?.business_name,
                        logo_url: data.data.businessLogo || profile?.logo_url,
                        address: data.data.businessAddress || profile?.address,
                        updated_at: new Date().toISOString()
                    });

                    // Update local state immediately so EmailEditor picks it up
                    setBusinessInfo({
                        name: data.data.businessName || profile?.business_name || 'Your Hospitality Business',
                        logoUrl: data.data.businessLogo || profile?.logo_url || '',
                        website: targetWebsite,
                        address: data.data.businessAddress || profile?.address || '',
                        zipCode: profile?.zip_code || ''
                    });
                }

                // For MVP: We will save these generated campaigns to the Supabase database
                if (user) {
                    // First, clear out any existing campaigns for this user to prevent duplicates
                    await supabase.from('campaigns').delete().eq('user_id', user.id);
                }

                for (const campaign of data.data.campaigns) {
                    await supabase.from('campaigns').insert([{
                        user_id: user?.id,
                        month: campaign.month,
                        month_name: campaign.monthName,
                        subject: campaign.subject,
                        summary: campaign.summary || campaign.bodyText?.substring(0, 100) + '...',
                        bodyText: campaign.bodyText,
                        image_url: campaign.imageUrl,
                        send_date: `${campaign.monthName.substring(0, 3)} 27th`,
                        status: 'draft'
                    }]);
                }
                fetchCampaigns(); // Refresh the list from the database
            } else if (data.campaigns && data.campaigns.length > 0) {
                // Fallback for different response format
                if (user) {
                    await supabase.from('campaigns').delete().eq('user_id', user.id);
                }

                for (const campaign of data.campaigns) {
                    await supabase.from('campaigns').insert([{
                        user_id: user?.id,
                        month: campaign.month,
                        month_name: campaign.monthName || campaign.name,
                        subject: campaign.subject,
                        summary: campaign.summary || 'Generated by AI',
                        send_date: `${campaign.name?.substring(0, 3) || 'Unk'} 27th`,
                        status: 'draft'
                    }]);
                }
                fetchCampaigns();
            } else {
                throw new Error("Invalid API response format");
            }
        } catch (error: any) {
            console.error('Error generating campaigns:', error);
            alert("Er is iets misgegaan bij het genereren van de AI campagnes: " + (error.message || "Probeer het later nog eens."));
        } finally {
            setIsGenerating(false);
        }
    };

    if (selectedCampaign) {
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
                    businessData={businessInfo || {
                        name: "Your Restaurant",
                        logoUrl: "",
                        website: "",
                        address: "",
                        zipCode: ""
                    }}
                    onSave={async (updated) => {
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();

                        if (user && updated.id) {
                            await supabase.from('campaigns').update({
                                subject: updated.subject,
                                summary: updated.summary,
                                bodyText: updated.body,
                                image_url: updated.imageUrl
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
                                        {camp.body || `Hey there,\n\n${camp.summary}\n\nReserveer Hier: ${businessInfo?.website || '#'}\n\nCheers,\nTeam ${businessInfo?.name || 'Restaurant'}`}
                                    </p>
                                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                </div>

                                <div className="mt-auto pt-4 border-t border-[#253551]/10">
                                    <h2 className="text-xl font-bold text-[#253551] mb-2">{camp.month_name} Campagne</h2>
                                    <p className="text-black/60 font-light text-sm">
                                        This draft email is customized based on the {businessInfo?.name || 'Your Business'} brand voice,
                                        recent reviews, and seasonality.
                                    </p>
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

                                {/* Analytics Overview */}
                                {camp.status === 'sent' ? (
                                    <div className="mt-4 pt-4 border-t border-[#253551]/10 grid grid-cols-3 gap-2 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center tabular-nums text-[#253551] mb-1">
                                                <Users className="w-3 h-3 mr-1" />
                                                <span className="text-xs font-bold">{camp.stats_delivered || 0}</span>
                                            </div>
                                            <span className="text-[10px] text-black/40 uppercase tracking-wider">Sent</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center tabular-nums text-green-600 mb-1">
                                                <Eye className="w-3 h-3 mr-1" />
                                                <span className="text-xs font-bold">
                                                    {camp.stats_delivered ? Math.round(((camp.stats_opens || 0) / camp.stats_delivered) * 100) : 0}%
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-black/40 uppercase tracking-wider">Opened</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center tabular-nums text-blue-600 mb-1">
                                                <MousePointerClick className="w-3 h-3 mr-1" />
                                                <span className="text-xs font-bold">
                                                    {camp.stats_opens ? Math.round(((camp.stats_clicks || 0) / camp.stats_opens) * 100) : 0}%
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-black/40 uppercase tracking-wider">Clicks</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 pt-4 border-t border-[#253551]/10 flex items-center justify-between">
                                        <span className="text-xs text-black/40 flex items-center"><LinkIcon className="w-3 h-3 mr-1" /> Tracking CTA Clicks</span>
                                        <span className="text-xs font-semibold text-[#253551] flex items-center"><Users className="w-3 h-3 mr-1" /> {contactsCount.toLocaleString()} Reach</span>
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
                                                                <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.stats_delivered || 0}</div>
                                                                <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                    <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">100%</span> delivered
                                                                </div>
                                                            </div>
                                                            {/* Orders */}
                                                            <div>
                                                                <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Orders <HelpCircle className="w-3 h-3" /></div>
                                                                <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">0</div>
                                                                <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                    <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">€0</span> revenue
                                                                </div>
                                                            </div>
                                                            {/* Unsubscribes */}
                                                            <div>
                                                                <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Unsubscribes <HelpCircle className="w-3 h-3" /></div>
                                                                <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">0</div>
                                                                <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                    <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">0.0 %</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-12">
                                                            {/* Opens & Visits */}
                                                            <div className="flex flex-col gap-10">
                                                                <div>
                                                                    <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Opens <HelpCircle className="w-3 h-3" /></div>
                                                                    <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.stats_opens || 0}</div>
                                                                    <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                        <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">
                                                                            {camp.stats_delivered ? Math.round(((camp.stats_opens || 0) / camp.stats_delivered) * 100) : 0} %
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center justify-between text-xs font-semibold italic text-[#6B7280] mb-3">Visits <HelpCircle className="w-3 h-3" /></div>
                                                                    <div className="text-4xl font-semibold mb-3 tracking-tight text-[#111827]">{camp.stats_clicks || 0}</div>
                                                                    <div className="text-[11px] text-[#6B7280] flex items-center gap-2 font-medium">
                                                                        <span className="bg-[#E5E7EB]/50 px-2 py-0.5 rounded text-[#374151]">
                                                                            {camp.stats_opens ? Math.round(((camp.stats_clicks || 0) / camp.stats_opens) * 100) : 0} %
                                                                        </span>
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

                                                                    {/* Since we don't track hourly graphs yet, we just render an empty line or mock for visual */}
                                                                    {[12, 11, 4, 6, 2, 4, 1, 3, 2, 0, 5, 2, 1, 0, 0, 0, 0, 0, 0].map((count: number, i: number) => (
                                                                        <div key={i} className="flex-1 bg-[#1877F2]/20 hover:bg-[#1877F2]/80 transition-colors flex flex-col justify-end group relative rounded-t-[1px]" style={{ height: `${Math.max(1, (count / 800) * 100)}%` }}>
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
