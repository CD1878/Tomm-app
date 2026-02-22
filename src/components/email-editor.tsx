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

interface EmailEditorProps {
    campaign: any;
    businessData: { name: string; address: string; zipCode: string; website: string; logoUrl?: string };
    onSave: (updatedCampaign: any) => void;
    onCancel: () => void;
}

export function EmailEditor({ campaign, businessData, onSave, onCancel }: EmailEditorProps) {
    const [subject, setSubject] = useState(campaign.subject || '');
    const [summary, setSummary] = useState(campaign.summary || '');
    const [body, setBody] = useState(campaign.body || '');
    const [expandedPlus, setExpandedPlus] = useState<number | null>(null);
    const [isEditingText, setIsEditingText] = useState(false);

    // Track dynamically added blocks
    const [blocks, setBlocks] = useState<{ id: string; type: string; label?: string; content?: string }[]>([]);

    const [isTesting, setIsTesting] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const togglePlus = (id: number) => {
        if (expandedPlus === id) {
            setExpandedPlus(null);
        } else {
            setExpandedPlus(id);
        }
    };

    const handleTest = () => {
        setIsTesting(true);
        setTimeout(() => {
            setIsTesting(false);
            setTestSuccess(true);
            setTimeout(() => setTestSuccess(false), 3000);
        }, 1500);
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
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
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
                    <WidgetItem icon={Minus} label="Button" onClick={() => onAddBlock('button')} />
                    <WidgetItem icon={ArrowDownUp} label="Spacer" onClick={() => onAddBlock('spacer')} />
                    <WidgetItem icon={LayoutGrid} label="Gallery" onClick={() => onAddBlock('image')} />
                    <WidgetItem icon={Video} label="Video" onClick={() => onAddBlock('generic', 'Video')} />
                    <WidgetItem icon={ListOrdered} label="Form" onClick={() => onAddBlock('generic', 'Form')} />
                    <WidgetItem icon={ListPlus} label="Accordion" onClick={() => onAddBlock('generic', 'Accordion')} />
                    <WidgetItem icon={ArrowDownUp} label="Scrolling" onClick={() => onAddBlock('generic', 'Scrolling')} />
                    <WidgetItem icon={Minus} label="Line" onClick={() => onAddBlock('spacer')} />
                </WidgetCategory>

                <WidgetCategory title="Sell">
                    <WidgetItem icon={Package} label="Product" onClick={() => onAddBlock('generic', 'Product')} />
                    <WidgetItem icon={Tag} label="Pricing Plan" onClick={() => onAddBlock('generic', 'Pricing Plan')} />
                    <WidgetItem icon={Heart} label="Donation" onClick={() => onAddBlock('generic', 'Donation')} />
                    <WidgetItem icon={Clock} label="Scheduling" onClick={() => onAddBlock('generic', 'Scheduling')} />
                </WidgetCategory>

                <WidgetCategory title="Display">
                    <WidgetItem icon={FileText} label="Summary" onClick={() => onAddBlock('generic', 'Summary')} />
                    <WidgetItem icon={Mail} label="Newsletter" onClick={() => onAddBlock('generic', 'Newsletter')} />
                    <WidgetItem icon={Quote} label="Quote" onClick={() => onAddBlock('generic', 'Quote')} />
                    <WidgetItem icon={Music} label="Audio" onClick={() => onAddBlock('generic', 'Audio')} />
                    <WidgetItem icon={Calendar} label="Calendar" onClick={() => onAddBlock('generic', 'Calendar')} />
                    <WidgetItem icon={MapPin} label="Map" onClick={() => onAddBlock('generic', 'Map')} />
                    <WidgetItem icon={Utensils} label="Menu" onClick={() => onAddBlock('generic', 'Menu')} />
                    <WidgetItem icon={BarChart2} label="Chart" onClick={() => onAddBlock('generic', 'Chart')} />
                </WidgetCategory>

                <WidgetCategory title="Code">
                    <WidgetItem icon={Code} label="Code" onClick={() => onAddBlock('generic', 'Code')} />
                    <WidgetItem icon={FileCode} label="Markdown" onClick={() => onAddBlock('generic', 'Markdown')} />
                    <WidgetItem icon={Terminal} label="Embed" onClick={() => onAddBlock('generic', 'Embed')} />
                </WidgetCategory>

                <WidgetCategory title="Links">
                    <WidgetItem icon={Share2} label="Social Links" onClick={() => onAddBlock('generic', 'Social Links')} />
                    <WidgetItem icon={Search} label="Search Field" onClick={() => onAddBlock('generic', 'Search Field')} />
                    <WidgetItem icon={LinkIcon} label="Page Link" onClick={() => onAddBlock('generic', 'Page Link')} />
                    <WidgetItem icon={Tags} label="Tag Cloud" onClick={() => onAddBlock('generic', 'Tag Cloud')} />
                    <WidgetItem icon={Rss} label="RSS" onClick={() => onAddBlock('generic', 'RSS')} />
                    <WidgetItem icon={Archive} label="Archive" onClick={() => onAddBlock('generic', 'Archive')} />
                </WidgetCategory>

                <WidgetCategory title="Integrations">
                    <WidgetItem icon={Instagram} label="Instagram" onClick={() => onAddBlock('generic', 'Instagram Integration')} />
                    <WidgetItem icon={UtensilsCrossed} label="Tock" onClick={() => onAddBlock('generic', 'Tock Integration')} />
                    <WidgetItem icon={Cloud} label="SoundCloud" onClick={() => onAddBlock('generic', 'SoundCloud Integration')} />
                    <WidgetItem icon={Camera} label="Flickr" onClick={() => onAddBlock('generic', 'Flickr Integration')} />
                    <WidgetItem icon={UtensilsCrossed} label="OpenTable" onClick={() => onAddBlock('generic', 'OpenTable Integration')} />
                    <WidgetItem icon={HeartHandshake} label="Zola" onClick={() => onAddBlock('generic', 'Zola Integration')} />
                    <WidgetItem icon={Music4} label="Bandsintown" onClick={() => onAddBlock('generic', 'Bandsintown Integration')} />
                </WidgetCategory>
            </div>
        </div>
    );

    const SeparatorWithPlus = ({ id }: { id: number }) => (
        <div className="relative py-8 w-full group">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] border-t border-dashed border-[#E5E7EB]"></div>
            </div>
            {expandedPlus !== id && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={() => togglePlus(id)}
                        className="w-6 h-6 bg-[#E0E7FF] text-[#1877F2] rounded-full flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors duration-200 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
            {expandedPlus === id && (
                <ExtraWidgetGrid onAddBlock={(type, label) => {
                    const newBlock = { id: Math.random().toString(36).substr(2, 9), type, label };
                    setBlocks([...blocks, newBlock]);
                    setExpandedPlus(null);
                }} />
            )}
        </div>
    );

    return (
        <div className="flex h-[85vh] w-full bg-white overflow-hidden rounded-lg">
            {/* Left/Center Panel - Canvas / Email Preview */}
            <div className="flex-1 bg-[#F9FAFB] overflow-y-auto relative no-scrollbar pb-20">
                {/* Simulated Email Container */}
                <div className="max-w-[600px] mx-auto bg-white min-h-[800px] my-12 shadow-sm border border-black/5 relative pb-16">

                    {/* Header Logo */}
                    <div className="py-10 flex flex-col items-center justify-center border-b border-black/5 px-8">
                        {businessData.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={businessData.logoUrl} alt={businessData.name} className="h-16 w-auto object-contain" />
                        ) : (
                            <div className="flex flex-col items-center opacity-80 mb-2">
                                <div className="w-20 h-16 border-2 border-black/80 rounded-sm relative flex justify-center items-end">
                                    <div className="absolute bottom-0 w-8 h-8 border-l-2 border-r-2 border-t-2 border-black/80"></div>
                                </div>
                                <h2 className="mt-4 font-serif text-lg tracking-[0.2em] font-light text-black uppercase">{businessData.name}</h2>
                            </div>
                        )}
                    </div>

                    <SeparatorWithPlus id={1} />

                    <SeparatorWithPlus id={1} />

                    {/* Feature Image */}
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
                        <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <div className="bg-white px-4 py-2 rounded-md shadow-md flex items-center gap-2 pointer-events-auto cursor-pointer font-medium text-sm text-[#374151]">
                                <ImageIcon className="w-4 h-4" /> Vervang Afbeelding
                            </div>
                        </div>
                    </div>

                    {/* Title & Body Block */}
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

                    {/* Reserve Block */}
                    <div className="px-8 mt-8 mb-4">
                        <h3 className="text-xl font-bold text-[#111827] mb-4">Reserveer nu een tafel</h3>
                        <p className="text-[#374151] mb-6 leading-relaxed">
                            Een reservering bij ons is een belofte voor een geweldig avondje uit. Geweldig voor jou én je tafelgenoten.
                        </p>
                        <Button onClick={(e) => { e.currentTarget.innerText = "Geklikt!"; setTimeout(() => { if (e.currentTarget) e.currentTarget.innerText = "Reserveer nu" }, 1500); }} className="bg-[#1f2937] text-white hover:bg-black px-8 py-6 rounded-md font-semibold font-sans transition-all">
                            Reserveer nu
                        </Button>
                    </div>

                    {/* Dynamic Blocks */}
                    {blocks.map((block) => (
                        <div key={block.id} className="relative group px-8 mt-6">
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {block.type === 'image' && (
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
                            )}

                            {block.type === 'text' && (
                                <textarea
                                    className="w-full min-h-[100px] text-[15px] leading-[1.8] text-[#374151] resize-none focus:outline-none bg-transparent hover:ring-1 hover:ring-black/10 p-2 rounded-sm"
                                    placeholder="Typ hier je tekst..."
                                />
                            )}

                            {block.type === 'button' && (
                                <div className="flex justify-center my-4">
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
                                <div className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-medium">
                                    [ Placeholder voor {block.label} ]
                                </div>
                            )}
                        </div>
                    ))}

                    {blocks.length > 0 && <SeparatorWithPlus id={3} />}

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

            {/* Right Panel - Settings Sidebar */}
            <div className="w-[360px] bg-white border-l border-black/10 flex flex-col overflow-y-auto no-scrollbar shadow-xl z-20">
                <div className="px-6 py-4 border-b border-black/5">
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
                            <div className="w-24 bg-[#F3F4F6] rounded-md px-4 py-2 flex items-center justify-between cursor-not-allowed text-[#111827] font-medium text-sm">
                                NL
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <hr className="border-black/5" />

                    {/* Test Email Section */}
                    <div className="flex flex-col items-center gap-4">
                        <Button onClick={handleTest} disabled={isTesting} className="w-full bg-[#00C18A] hover:bg-[#00a979] text-white py-6 text-[15px] font-semibold tracking-wide rounded-md shadow-sm">
                            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : testSuccess ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
                            {isTesting ? "Sending..." : testSuccess ? "Test e-mail sent!" : "Send a test email"}
                        </Button>
                        <div className="text-center text-sm font-light text-[#6B7280]">
                            Test emails will be sent to<br />
                            <span className="underline decoration-black/20 underline-offset-4">info@jouwrestaurant.nl</span>.<br />
                            <span onClick={(e) => { e.currentTarget.innerText = "Email changed!"; setTimeout(() => e.currentTarget.innerText = "Change", 1500); }} className="underline decoration-black/20 underline-offset-4 cursor-pointer mt-1 inline-block transition-all">Change</span>
                        </div>
                    </div>

                    <div className="mt-auto space-y-4 pt-8">
                        <Label className="text-xs font-bold text-[#111827] uppercase tracking-wider">Audience</Label>
                        <Button onClick={(e) => { const orig = e.currentTarget.innerText; e.currentTarget.innerText = "Loading audience..."; setTimeout(() => e.currentTarget.innerText = orig, 1000); }} variant="secondary" className="w-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] border-none py-6 font-semibold shadow-none rounded-md">
                            Edit audience
                        </Button>
                        <Button variant="secondary" className="w-full bg-[#f8f9fa] hover:bg-[#F3F4F6] text-[#9CA3AF] border-none py-6 font-medium shadow-none rounded-md cursor-not-allowed">
                            Show audience (0 subscribers)
                        </Button>
                    </div>

                </div>

                <div className="px-6 py-6 border-t border-black/5 bg-slate-50 flex flex-col gap-3">
                    <Button onClick={handleEmailSave} disabled={isSaving} className="w-full bg-[#7C9EF7] hover:bg-[#6e8eeb] text-white py-6 text-[15px] font-semibold shadow-sm rounded-md transition-all">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
                        {isSaving ? "Saving..." : saveSuccess ? "Saved Successfully!" : "Review and send"}
                    </Button>
                    <div className="text-center text-xs text-[#9CA3AF] font-light">
                        Send your campaign to 0 subscribers
                    </div>
                </div>

            </div>
        </div>
    );
}
