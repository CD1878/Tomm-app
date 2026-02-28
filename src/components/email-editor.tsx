import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus, X, PenTool, Utensils, Gift, Book, Tag, HelpCircle,
    Facebook, Instagram, Twitter, Code, Bold, Italic,
    Strikethrough, List, Link as LinkIcon, Smile, Send,
    Search, Type, Image as ImageIcon, Minus, LayoutGrid, Video, ListOrdered, ListPlus, ArrowDownUp,
    Package, CreditCard, Heart, Clock, FileText, Mail, Quote, Music, Calendar, MapPin, Coffee, BarChart2,
    FileCode, Terminal, Share2, Tags, Rss, Archive, UtensilsCrossed, Cloud, Camera, HeartHandshake, Music4,
    Loader2, CheckCircle2
} from "lucide-react";
import { createClient } from '@/utils/supabase/client';

interface EmailEditorProps {
    campaign: any;
    businessData: { name: string; address?: string; zipCode?: string; website: string; logoUrl?: string };
    onSave: (updatedCampaign: any) => void;
    onCancel: () => void;
}

export function EmailEditor({ campaign, businessData, onSave, onCancel }: EmailEditorProps) {
    const [subject, setSubject] = useState(campaign.subject || '');
    const [summary, setSummary] = useState(campaign.summary || '');
    const [body, setBody] = useState(campaign.body || '');
    const [language, setLanguage] = useState("NL");
    const [isTranslating, setIsTranslating] = useState(false);
    const [expandedPlus, setExpandedPlus] = useState<number | null>(null);
    const [isEditingText, setIsEditingText] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState("");

    // Track dynamically added blocks
    const [blocks, setBlocks] = useState<{ id: string; type: string; label?: string; content?: string }[]>([]);

    const [isTesting, setIsTesting] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);
    const [testEmail, setTestEmail] = useState("info@jouwrestaurant.nl");
    const [isEditingTestEmail, setIsEditingTestEmail] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [audience, setAudience] = useState("All Subscribers");
    const [isEditingAudience, setIsEditingAudience] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value;
        if (newLang === language) return;

        setLanguage(newLang);
        setIsTranslating(true);

        // Mock translation logic based on the language
        setTimeout(() => {
            if (newLang === "EN") {
                setSubject("Spring is in the air! 🌷");
                setSummary("First sunny days on the Gerard Douplein terrace. Get ready!");
                setBody(`Hi everyone,\n\nCan you feel it? The days are getting longer and the sun is showing its face again!\n\nOur place is slowly becoming the hottest spot again. High time to leave that winter coat at home and enjoy the first real rays of sunshine with an ice-cold drink in your hand.\n\nSee you soon!\n\nLove,\nTeam ${businessData?.name || 'Restaurant'}`);
            } else {
                setSubject(campaign.subject || "Lente in je Bol! 🌷");
                setSummary(campaign.summary || "De eerste zonnige dagen komen eraan. Maak je klaar!");
                setBody(campaign.body || `Hi allemaal,\n\nVoelen jullie het ook? De dagen worden langer en de zon laat zich weer vaker zien!\n\nOnze zaak wordt langzaam weer de warmste plek van de stad. Hoog tijd om die winterjas thuis te laten en te genieten van de eerste échte zonnestralen met een ijskoud drankje in je hand.\n\nTot snel!\n\nLiefs,\nTeam ${businessData?.name || 'Restaurant'}`);
            }
            setIsTranslating(false);
        }, 1500);
    };

    const togglePlus = (id: number) => {
        if (expandedPlus === id) {
            setExpandedPlus(null);
        } else {
            setExpandedPlus(id);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        try {
            const htmlContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                        
                        <!-- Header Logo -->
                        <div style="padding: 30px 20px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                            ${businessData?.logoUrl
                    ? `<img src="${businessData.logoUrl}" alt="${businessData?.name || 'Logo'}" style="height: 60px; width: auto; max-width: 200px; object-fit: contain; display: block; margin: 0 auto;" />`
                    : `<h2 style="margin: 0; font-family: Georgia, serif; font-size: 20px; letter-spacing: 0.2em; font-weight: 300; color: #111827; text-transform: uppercase;">${businessData?.name || 'JOUW RESTAURANT'}</h2>`
                }
                        </div>

                        <!-- Hero Image -->
                        ${campaign?.imageUrl
                    ? `<img src="${campaign.imageUrl}" alt="Hero" style="width: 100%; height: 300px; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop'" />`
                    : `<img src="https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop" alt="Hero Fallback" style="width: 100%; height: 300px; object-fit: cover; display: block;" />`
                }
                        
                        <div style="padding: 40px 32px;">
                            <h2 style="margin-top: 0; font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px;">${subject || 'Test E-mail'}</h2>
                            <p style="color: #6B7280; font-style: italic; font-size: 15px; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">${summary || 'Preheader text...'}</p>
                            
                            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 0 0 24px 0;" />
                            
                            <div style="white-space: pre-wrap; line-height: 1.7; font-size: 16px; color: #374151;">${body || 'Inhoud van de e-mail...'}</div>
                            
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <a href="${campaign.buttonUrl || businessData?.website || '#'}" style="background-color: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Reserveren</a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
                            <p style="font-size: 12px; color: #9CA3AF; margin: 0;">Verzonden via Chef's Mail voor ${businessData?.name || 'jouw restaurant'}</p>
                            <div style="margin-top: 12px;">
                                <a href="#" style="color: #6B7280; font-size: 12px; text-decoration: underline;">Uitschrijven</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const res = await fetch('/api/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: testEmail,
                    subject: subject || "Test e-mail vanuit Chef's Mail",
                    html: htmlContent,
                    senderName: businessData?.name || "Chef's Mail"
                })
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || 'Serverfout bij verzenden van e-mail');
            }

            setTestSuccess(true);
            setTimeout(() => setTestSuccess(false), 3000);
        } catch (error: any) {
            console.error("Test email API error:", error);
            alert(`Fout bij verzenden test e-mail: ${error.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleEmailSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                ...campaign,
                subject,
                summary,
                body
            });

            const htmlContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                        
                        <!-- Header Logo -->
                        <div style="padding: 30px 20px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                            ${businessData?.logoUrl
                    ? `<img src="${businessData.logoUrl}" alt="${businessData?.name || 'Logo'}" style="height: 60px; width: auto; max-width: 200px; object-fit: contain; display: block; margin: 0 auto;" />`
                    : `<h2 style="margin: 0; font-family: Georgia, serif; font-size: 20px; letter-spacing: 0.2em; font-weight: 300; color: #111827; text-transform: uppercase;">${businessData?.name || 'JOUW RESTAURANT'}</h2>`
                }
                        </div>

                        <!-- Hero Image -->
                        ${campaign?.imageUrl
                    ? `<img src="${campaign.imageUrl}" alt="Hero" style="width: 100%; height: 300px; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop'" />`
                    : `<img src="https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop" alt="Hero Fallback" style="width: 100%; height: 300px; object-fit: cover; display: block;" />`
                }
                        
                        <div style="padding: 40px 32px;">
                            <h2 style="margin-top: 0; font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px;">${subject || 'Test E-mail'}</h2>
                            <p style="color: #6B7280; font-style: italic; font-size: 15px; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">${summary || 'Preheader text...'}</p>
                            
                            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 0 0 24px 0;" />
                            
                            <div style="white-space: pre-wrap; line-height: 1.7; font-size: 16px; color: #374151;">${body || 'Inhoud van de e-mail...'}</div>
                            
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <a href="${campaign.buttonUrl || businessData?.website || '#'}" style="background-color: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Reserveren</a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
                            <p style="font-size: 12px; color: #9CA3AF; margin: 0;">Verzonden via Chef's Mail voor ${businessData?.name || 'jouw restaurant'}</p>
                            <div style="margin-top: 12px;">
                                <a href="#" style="color: #6B7280; font-size: 12px; text-decoration: underline;">Uitschrijven</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Trigger actual dispatch for the active tenant's contacts
            const res = await fetch('/api/send-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subject || "Nieuwe E-mail vanuit Chef's Mail",
                    html: htmlContent,
                    senderName: businessData?.name || "Chef's Mail"
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Serverfout bij verzenden van campagne');
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error: any) {
            console.error("Live campaign API error:", error);
            alert(`Fout bij verzenden campagne: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const WidgetCategory = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="mb-6">
            <h4 className="text-sm font-semibold text-[#111827] mb-3 px-1">{title}</h4>
            <div className="grid grid-cols-2 gap-2">
                {children}
            </div>
        </div>
    );

    const WidgetItem = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
        <div
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] rounded-md cursor-pointer transition-colors border border-transparent hover:border-black/5"
        >
            <Icon className="w-5 h-5 text-[#374151]" />
            <span className="text-sm font-medium text-[#111827]">{label}</span>
        </div>
    );

    const ExtraWidgetGrid = ({ onAddBlock }: { onAddBlock: (type: string, label?: string) => void }) => (
        <div className="bg-white rounded-xl shadow-2xl border border-black/10 p-5 mt-4 relative animate-in fade-in zoom-in-95 duration-200 z-30 mx-auto w-full max-w-[500px] flex flex-col max-h-[600px]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#111827] bg-white rounded-full border border-black/10 shadow-sm z-40">
                <X className="w-6 h-6 p-1.5 cursor-pointer hover:bg-slate-100 rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); setExpandedPlus(null); }} />
            </div>

            {/* Search Bar */}
            <div className="relative mb-6 mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <Input
                    placeholder="Search"
                    className="w-full pl-10 py-5 bg-[#F3F4F6] border-black/10 text-[#111827] rounded-lg font-medium shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                <WidgetCategory title="Essentials">
                    <WidgetItem icon={Type} label="Text" onClick={() => onAddBlock('text')} />
                    <WidgetItem icon={ImageIcon} label="Image" onClick={() => onAddBlock('image')} />
                    <WidgetItem icon={Video} label="Video" onClick={() => onAddBlock('generic', 'Video')} />
                </WidgetCategory>
            </div>
        </div>
    );

    const SeparatorWithPlus = ({ id, insertIndex }: { id: string | number, insertIndex: number }) => (
        <div className="relative py-8 w-full group">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] border-t border-dashed border-[#E5E7EB]"></div>
            </div>
            {expandedPlus !== id && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={() => togglePlus(id as any)}
                        className="w-6 h-6 bg-[#E0E7FF] text-[#1877F2] rounded-full flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors duration-200 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
            {expandedPlus === id && (
                <ExtraWidgetGrid onAddBlock={(type, label) => {
                    const newBlock = { id: Math.random().toString(36).substr(2, 9), type, label };
                    const newBlocks = [...blocks];
                    newBlocks.splice(insertIndex, 0, newBlock);
                    setBlocks(newBlocks);
                    setExpandedPlus(null);
                }} />
            )}
        </div>
    );

    // Initialize with static layout blocks so they can be reordered or interspersed with dynamic blocks
    React.useEffect(() => {
        if (blocks.length === 0) {
            setBlocks([
                { id: 'static-hero', type: 'static-hero' },
                { id: 'static-text', type: 'static-text' },
                { id: 'static-reserve', type: 'static-reserve' }
            ]);
        }

        const storedUrl = businessData?.website || localStorage.getItem('tomm_website_url');
        if (storedUrl) {
            // Ensure URL has protocol
            setWebsiteUrl(storedUrl.startsWith('http') ? storedUrl : `https://${storedUrl}`);
        }

        const fetchSubscriberCount = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user ? user.id : null;

            const { count, error } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            if (!error && count !== null) {
                setSubscriberCount(count);
            }
        };
        fetchSubscriberCount();

    }, [businessData?.website]);

    return (
        <div className="flex flex-col lg:flex-row h-[85vh] w-full bg-white overflow-hidden rounded-lg">
            {/* Left/Center Panel - Canvas / Email Preview */}
            <div className="flex-1 bg-[#F9FAFB] overflow-y-auto relative no-scrollbar pb-20">
                {/* Simulated Email Container */}
                <div className="max-w-[600px] mx-2 sm:mx-auto bg-white min-h-[800px] my-4 sm:my-12 shadow-sm border border-black/5 relative pb-16">

                    {/* Header Logo */}
                    <div className="py-10 flex flex-col items-center justify-center border-b border-black/5 px-8">
                        {businessData.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={businessData.logoUrl}
                                alt={businessData.name}
                                className="h-16 w-auto object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="flex flex-col items-center opacity-80 mb-2">
                                <div className="w-20 h-16 border-2 border-black/80 rounded-sm relative flex justify-center items-end">
                                    <div className="absolute bottom-0 w-8 h-8 border-l-2 border-r-2 border-t-2 border-black/80"></div>
                                </div>
                                <h2 className="mt-4 font-serif text-lg tracking-[0.2em] font-light text-black uppercase">{businessData.name}</h2>
                            </div>
                        )}
                    </div>

                    <SeparatorWithPlus id="top" insertIndex={0} />

                    {blocks.map((block, index) => (
                        <React.Fragment key={block.id}>
                            <div className="relative group">
                                {/* Delete button for dynamic blocks ONLY */}
                                {!block.id.startsWith('static-') && (
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {block.type === 'static-hero' && (
                                    <div className="px-8 mb-4 relative group">
                                        {campaign.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={campaign.imageUrl}
                                                alt="Campaign Header"
                                                className="w-full h-auto rounded-xl object-cover"
                                                onError={(e) => {
                                                    // Fallback if the AI hallucinated a broken URL or image is missing
                                                    e.currentTarget.src = "https://images.unsplash.com/photo-1414235077428-33898ed1e829?q=80&w=800&auto=format&fit=crop";
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <span>Geen afbeelding geselecteerd</span>
                                            </div>
                                        )}
                                        {/* Hover Overlay for replacing image */}
                                        <div className="absolute inset-x-8 top-0 bottom-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <div className="bg-white px-4 py-2 rounded-md shadow-md flex items-center gap-2 pointer-events-auto cursor-pointer font-medium text-sm text-[#374151]">
                                                <ImageIcon className="w-4 h-4" /> Vervang Afbeelding
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {block.type === 'static-text' && (
                                    <div className="px-8 mt-6 relative" onClick={() => setIsEditingText(true)}>
                                        {isEditingText && (
                                            <div className="absolute -top-12 left-8 right-8 bg-black rounded-lg p-2 flex items-center gap-4 text-white z-20 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                <Code className="w-4 h-4 ml-2 hover:text-blue-400 cursor-pointer" />
                                                <Bold className="w-4 h-4 text-blue-400 cursor-pointer" />
                                                <Italic className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                                                <Strikethrough className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                                                <List className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                                                <LinkIcon className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                                                <Smile className="w-4 h-4 text-yellow-400 ml-auto mr-2 cursor-pointer" />
                                            </div>
                                        )}

                                        <div className={`p-1 rounded-sm ${isEditingText ? 'ring-2 ring-blue-500 ring-offset-4' : 'hover:ring-1 hover:ring-black/10'}`}>
                                            <h2 className="text-2xl font-bold text-[#111827] mb-6 leading-snug break-words">
                                                {subject || "Jouw nieuwe nieuwsbrief"}
                                            </h2>
                                            <textarea
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                                className="w-full min-h-[300px] text-[15px] leading-[1.8] text-[#374151] resize-none focus:outline-none bg-transparent"
                                            />
                                        </div>
                                    </div>
                                )}

                                {block.type === 'static-reserve' && (
                                    <div className="px-8 mt-8 mb-4">
                                        <h3 className="text-xl font-bold text-[#111827] mb-4">Reserveer nu een tafel</h3>
                                        <p className="text-[#374151] mb-6 leading-relaxed">
                                            Een reservering bij ons is een belofte voor een geweldige tijd. Geweldig voor jou én je tafelgenoten.
                                        </p>
                                        <Button
                                            onClick={(e) => {
                                                if (websiteUrl) {
                                                    window.open(websiteUrl, '_blank');
                                                } else {
                                                    e.currentTarget.innerText = "Website ontbreekt!";
                                                    setTimeout(() => { if (e.currentTarget) e.currentTarget.innerText = "Reserveer nu" }, 1500);
                                                }
                                            }}
                                            className="bg-[#1f2937] text-white hover:bg-black px-8 py-6 rounded-md font-semibold font-sans transition-all"
                                        >
                                            Reserveer nu
                                        </Button>
                                    </div>
                                )}

                                {block.type === 'image' && (
                                    <div className="px-8 mt-6">
                                        <div
                                            onClick={(e) => {
                                                const el = e.currentTarget;
                                                el.innerHTML = '<div class="flex flex-col items-center"><svg class="lucide lucide-loader2 h-6 w-6 text-[#253551] animate-spin mb-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span class="text-sm font-medium">Bezig met uploaden...</span></div>';
                                                setTimeout(() => {
                                                    el.innerHTML = '<img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop" class="w-full h-full object-cover rounded-xl" />';
                                                    el.className = "w-full h-64 rounded-xl flex items-center justify-center p-0 overflow-hidden";
                                                }, 2000);
                                            }}
                                            className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 cursor-pointer hover:bg-slate-50 transition-all"
                                        >
                                            <div className="flex flex-col items-center pointer-events-none">
                                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                <span className="text-sm font-medium">Klik om afbeelding te uploaden</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {block.type === 'text' && (
                                    <div className="px-8 mt-6">
                                        <textarea
                                            className="w-full min-h-[100px] text-[15px] leading-[1.8] text-[#374151] resize-none focus:outline-none bg-transparent hover:ring-1 hover:ring-black/10 p-2 rounded-sm"
                                            placeholder="Typ hier je tekst..."
                                        />
                                    </div>
                                )}

                                {block.type === 'button' && (
                                    <div className="px-8 flex justify-center my-4">
                                        <Button onClick={(e) => { e.currentTarget.innerText = "Geklikt!"; setTimeout(() => { if (e.currentTarget) e.currentTarget.innerText = "Nieuwe Knop" }, 1500); }} className="bg-[#1f2937] text-white hover:bg-black px-8 py-6 rounded-md font-semibold font-sans transition-all">
                                            Nieuwe Knop
                                        </Button>
                                    </div>
                                )}

                                {block.type === 'spacer' && (
                                    <div className="py-8 w-full flex items-center justify-center">
                                        <div className="w-[80%] border-t border-solid border-[#E5E7EB]"></div>
                                    </div>
                                )}

                                {block.type === 'generic' && (
                                    <div className="px-8 mt-6">
                                        <div className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-medium">
                                            [ Placeholder voor {block.label} ]
                                        </div>
                                    </div>
                                )}
                            </div>
                            <SeparatorWithPlus id={block.id} insertIndex={index + 1} />
                        </React.Fragment>
                    ))}

                    {/* Footer Block */}
                    <div className="px-8 pt-8 flex flex-col items-center justify-center text-center">
                        <div className="flex gap-4 mb-8">
                            <span className="w-8 h-8 bg-[#1f2937] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-black transition-colors"><Instagram className="w-4 h-4" /></span>
                        </div>

                        <h4 className="font-bold text-[#111827] mb-2">{businessData.name}</h4>
                        <p className="text-[#374151] text-sm mb-1">{businessData.address}</p>
                        <p className="text-[#374151] text-sm mb-1">{businessData.zipCode}</p>
                        <p className="text-[#374151] text-sm underline mb-8">{businessData.website}</p>

                        <p className="text-[#374151] text-sm mb-2">Wil je deze e-mails niet ontvangen?</p>
                        <p className="text-[#374151] text-sm underline cursor-pointer">Uitschrijven</p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Settings & Properties */}
            <div className="w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-black/10 flex flex-col overflow-y-auto no-scrollbar shadow-xl z-20">
                <div className="px-6 py-4 border-b border-black/5 hidden lg:block">
                    <h3 className="text-center font-medium text-[#111827]">Email</h3>
                </div>

                <div className="p-6 flex flex-col gap-8 flex-1">

                    {/* Form Section */}
                    <div className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[#111827] uppercase tracking-wider">Subject</Label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-[#F3F4F6] border-none text-[#111827] focus-visible:ring-1 focus-visible:ring-blue-500 font-medium py-6"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-[#111827] uppercase tracking-wider">Preview Text</Label>
                                <HelpCircle className="w-4 h-4 text-[#9CA3AF] cursor-help" />
                            </div>
                            <Input
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className="bg-[#F3F4F6] border-none text-[#111827] focus-visible:ring-1 focus-visible:ring-blue-500 py-6 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[#111827] uppercase tracking-wider">Language</Label>
                            <select
                                value={language}
                                onChange={handleLanguageChange}
                                disabled={isTranslating}
                                className="w-24 bg-[#F3F4F6] border-none rounded-md px-3 py-2 text-[#111827] font-medium text-sm focus-visible:ring-1 focus-visible:ring-blue-500 outline-none cursor-pointer"
                            >
                                <option value="NL">NL</option>
                                <option value="EN">EN</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-black/5" />

                    {/* Test Email Section */}
                    <div className="flex flex-col items-center gap-4">
                        <Button onClick={handleTest} disabled={isTesting} className="w-full bg-[#00C18A] hover:bg-[#00a979] text-white py-6 text-[15px] font-semibold tracking-wide rounded-md shadow-sm">
                            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : testSuccess ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
                            {isTesting ? "Sending..." : testSuccess ? "Test e-mail sent!" : "Send a test email"}
                        </Button>
                        <div className="text-center text-sm font-light text-[#6B7280] min-h-[48px] flex flex-col items-center justify-center">
                            Test emails will be sent to<br />
                            {isEditingTestEmail ? (
                                <div className="flex items-center mt-2 gap-2">
                                    <Input
                                        type="email"
                                        placeholder="Vul e-mailadres in..."
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="h-8 text-sm"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') setIsEditingTestEmail(false);
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => setIsEditingTestEmail(false)}
                                        className="h-8 bg-[#111827] text-white hover:bg-black"
                                    >
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-semibold text-[#111827]">{testEmail}</span>.<br />
                                    <span
                                        onClick={() => {
                                            setTestEmail("");
                                            setIsEditingTestEmail(true);
                                        }}
                                        className="underline decoration-black/20 underline-offset-4 cursor-pointer mt-1 inline-block hover:text-[#111827] transition-all"
                                    >
                                        Change
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto space-y-4 pt-8">
                        <Label className="text-xs font-bold text-[#111827] uppercase tracking-wider">Audience</Label>

                        {isEditingAudience ? (
                            <div className="space-y-3">
                                <div className="p-3 border rounded-md bg-white border-blue-500 cursor-pointer shadow-sm">
                                    <div className="font-medium text-blue-600 flex items-center justify-between">
                                        All Subscribers <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs text-black/60 mt-1">Send to everyone on your list</div>
                                </div>
                                <Button onClick={() => setIsEditingAudience(false)} variant="ghost" className="w-full text-xs">Close</Button>
                            </div>
                        ) : (
                            <>
                                <Button onClick={() => setIsEditingAudience(true)} variant="outline" className="w-full bg-white hover:bg-slate-50 border-black/10 text-[#111827] py-6 font-semibold shadow-sm rounded-md justify-between px-4">
                                    <span>All Subscribers</span>
                                    <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-full">Edit</span>
                                </Button>
                                <div className="bg-[#f8f9fa] text-center text-[#9CA3AF] py-3 rounded-md text-sm">
                                    {subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}
                                </div>
                            </>
                        )}
                    </div>

                </div>

                <div className="px-6 py-6 border-t border-black/5 bg-slate-50 flex flex-col gap-3">
                    <Button onClick={handleEmailSave} disabled={isSaving} className="w-full bg-[#7C9EF7] hover:bg-[#6e8eeb] text-white py-6 text-[15px] font-semibold shadow-sm rounded-md transition-all">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
                        {isSaving ? "Sending Campaign..." : saveSuccess ? "Sent Successfully!" : "Review and send"}
                    </Button>
                    <div className="text-center text-xs text-[#9CA3AF] font-light">
                        Send your campaign to {subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}
                    </div>
                </div>

            </div>
        </div>
    );
}
