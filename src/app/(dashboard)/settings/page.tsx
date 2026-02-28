'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Instagram, Upload, RefreshCw, CheckCircle2, Loader2, Users, Mail, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
    const supabase = createClient();
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeSuccess, setScrapeSuccess] = useState(false);
    const [scrapeError, setScrapeError] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [instructions, setInstructions] = useState("");
    const [defaultLanguage, setDefaultLanguage] = useState("NL");
    const [newEmail, setNewEmail] = useState("");
    const [addSuccess, setAddSuccess] = useState(false);
    const [subscribers, setSubscribers] = useState<{ email: string, source: string, date: string }[]>([]);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // UI Interaction states
    const [uploadingCSV, setUploadingCSV] = useState(false);
    const [uploadedCSV, setUploadedCSV] = useState(false);
    const [connectedAPIs, setConnectedAPIs] = useState<Record<string, boolean>>({});

    // Load saved instructions on mount
    useEffect(() => {
        const fetchProfileAndContacts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user ? user.id : '474a5578-98f9-467b-ae73-f61715d567a5';

            // Fetch profile data
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (profile) {
                if (profile.global_instructions) setInstructions(profile.global_instructions);
                if (profile.default_language) setDefaultLanguage(profile.default_language);
                if (profile.website_url) setWebsiteUrl(profile.website_url);
                // (Optional) We aren't storing Instagram URL in the DB schema yet, so leave it or add it later
            }

            const { data } = await supabase.from('contacts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (data) {
                setSubscribers(data.map(c => ({ email: c.email, source: c.source || 'Website Form', date: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })));
            }
        };
        fetchProfileAndContacts();
    }, []);

    const handleSaveSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('profiles').upsert({
            id: user.id,
            website_url: websiteUrl,
            global_instructions: instructions,
            default_language: defaultLanguage,
            updated_at: new Date().toISOString()
        });
    };

    const handleAddSubscriber = async () => {
        if (!newEmail || !newEmail.includes('@')) return;
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user ? user.id : '474a5578-98f9-467b-ae73-f61715d567a5';

        const { data, error } = await supabase.from('contacts').insert([{
            user_id: userId,
            email: newEmail,
            source: "Manual Add",
        }]).select().single();

        if (data && !error) {
            const newSub = {
                email: data.email,
                source: "Manual Add",
                date: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
            setSubscribers([newSub, ...subscribers]);
            setNewEmail("");
            setAddSuccess(true);
            setTimeout(() => setAddSuccess(false), 3000);
        }
    };

    const handleRemoveSubscriber = async (emailToRemove: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user ? user.id : '474a5578-98f9-467b-ae73-f61715d567a5';

        const { error } = await supabase.from('contacts').delete().eq('user_id', userId).eq('email', emailToRemove);
        if (!error) {
            const updatedSubs = subscribers.filter(s => s.email !== emailToRemove);
            setSubscribers(updatedSubs);
        }
    };

    const handleRemoveAllSubscribers = async () => {
        if (!confirm("Weet je zeker dat je ALLE contacten wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
        setIsDeletingAll(true);
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user ? user.id : '474a5578-98f9-467b-ae73-f61715d567a5';

        const { error } = await supabase.from('contacts').delete().eq('user_id', userId);
        if (!error) {
            setSubscribers([]);
        } else {
            alert("Fout bij verwijderen: " + error.message);
        }
        setIsDeletingAll(false);
    };

    const processCSV = async (file: File) => {
        if (!file) return;
        setUploadingCSV(true);

        try {
            const text = await file.text();
            // Basic CSV parsing to find emails
            const lines = text.split('\n');
            const newEmails: string[] = [];

            lines.forEach(line => {
                const parts = line.split(/[;,]/);
                parts.forEach(part => {
                    const cleaned = part.trim().replace(/^"|"$/g, '');
                    // Basic email regex match
                    if (cleaned.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                        newEmails.push(cleaned);
                    }
                });
            });

            if (newEmails.length > 0) {
                const uniqueEmails = Array.from(new Set(newEmails));
                const { data: { user } } = await supabase.auth.getUser();
                const userId = user ? user.id : '474a5578-98f9-467b-ae73-f61715d567a5';

                const inserts = uniqueEmails.map(email => ({
                    user_id: userId,
                    email,
                    source: "CSV Import"
                }));
                // Insert to supabase ignoring duplicates using ON CONFLICT logic
                await supabase.from('contacts').upsert(inserts, { onConflict: 'user_id, email', ignoreDuplicates: true });

                // Re-fetch to display updated list
                const { data } = await supabase.from('contacts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
                if (data) {
                    setSubscribers(data.map(c => ({ email: c.email, source: c.source || 'CSV Import', date: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })));
                }
            }

            setUploadedCSV(true);
            setTimeout(() => setUploadedCSV(false), 3000);
        } catch (error) {
            console.error("Error parsing CSV:", error);
        } finally {
            setUploadingCSV(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
            processCSV(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processCSV(file);
        }
        // Reset input so the same file could be selected again if needed
        e.target.value = '';
    };

    const handleScrape = async () => {
        setIsScraping(true);
        setScrapeSuccess(false);
        setScrapeError("");

        // Save global instructions to database
        await handleSaveSettings();

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: websiteUrl })
            });

            if (!response.ok) {
                throw new Error("Failed to scrape website.");
            }

            const data = await response.json();

            if (data.success && data.markdown) {
                localStorage.setItem('tomm_business_context', data.markdown);
                setScrapeSuccess(true);
                setTimeout(() => setScrapeSuccess(false), 3000);
            } else {
                throw new Error("Invalid response from scraper.");
            }
        } catch (error: any) {
            console.error("Scrape error:", error);
            setScrapeError(error.message || "Something went wrong collecting business context.");
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 max-w-4xl"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#253551] text-balance mb-2">Settings</h1>
                <p className="text-black/60 font-light text-pretty">Configure your business profile and audience connections. TOMM uses this data to generate your personalized campaigns.</p>
            </div>

            <Tabs defaultValue="brand" className="w-full">
                <TabsList className="bg-[#253551]/5 border border-[#253551]/10 p-1 w-full max-w-md h-12 rounded-xl mb-8">
                    <TabsTrigger value="brand" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#253551] data-[state=active]:shadow-sm text-black/60 flex-1 transition-all">
                        Brand Profile
                    </TabsTrigger>
                    <TabsTrigger value="audience" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#253551] data-[state=active]:shadow-sm text-black/60 flex-1 transition-all">
                        Audience
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="brand" className="space-y-6">
                    <Card className="bg-white border-[#253551]/10 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#253551]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                        <CardHeader>
                            <CardTitle className="text-xl text-[#253551] text-balance">Digital Footprint</CardTitle>
                            <CardDescription className="text-black/60 text-pretty">
                                Provide your online presence. We will scrape your website and Instagram to learn your brand colors, voice, and venue details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="website" className="text-[#253551] font-medium">Website URL</Label>
                                <div className="relative group">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 group-focus-within:text-[#253551] transition-colors" />
                                    <Input
                                        id="website"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        className="pl-10 bg-white border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] text-black placeholder:text-black/40 h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instagram" className="text-[#253551] font-medium">Instagram Handle</Label>
                                <div className="relative group">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 group-focus-within:text-[#253551] transition-colors" />
                                    <Input
                                        id="instagram"
                                        value={instagramUrl}
                                        onChange={(e) => setInstagramUrl(e.target.value)}
                                        className="pl-10 bg-white border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] text-black placeholder:text-black/40 h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-[#253551]/10">
                                <Label className="text-[#253551] font-medium">Default Generated Language</Label>
                                <p className="text-xs text-black/50 mb-2">Select the primarily used language for all automations and generated campaigns.</p>
                                <select
                                    value={defaultLanguage}
                                    onChange={(e) => setDefaultLanguage(e.target.value)}
                                    className="w-full bg-white border border-[#253551]/20 rounded-md focus-visible:ring-1 focus-visible:ring-[#253551] text-black h-11 px-3 text-sm"
                                >
                                    <option value="NL">Nederlands (Dutch)</option>
                                    <option value="EN">English</option>
                                </select>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-[#253551]/10">
                                <Label htmlFor="instructions" className="text-[#253551] font-medium">Global Custom Instructions</Label>
                                <p className="text-xs text-black/50 mb-2">These rules will be applied to ALL 12 generated email campaigns.</p>
                                <Textarea
                                    id="instructions"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="e.g. Always emphasize our new sun terrace, keep the tone very casual and energetic, mention our signature espresso martini."
                                    className="min-h-[100px] bg-white border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] text-black placeholder:text-black/40 resize-none"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-[#253551]/10 bg-slate-50 mt-4 py-4 flex items-center justify-between">
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={async () => {
                                                await handleSaveSettings();
                                                setScrapeSuccess(true);
                                                setTimeout(() => setScrapeSuccess(false), 3000);
                                            }}
                                            variant="outline"
                                            className="w-full sm:w-auto text-[#253551] border-[#253551]/20 hover:bg-[#253551]/5 shadow-sm transition-all"
                                        >
                                            Save Settings
                                        </Button>
                                        <Button
                                            onClick={handleScrape}
                                            disabled={isScraping || !websiteUrl}
                                            className="w-full sm:w-auto bg-[#253551] text-white hover:bg-[#253551]/90 shadow-sm transition-all"
                                        >
                                            {isScraping ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scraping Data...</>
                                            ) : (
                                                <><RefreshCw className="mr-2 h-4 w-4" /> Save & Start Scraping</>
                                            )}
                                        </Button>
                                    </div>

                                    {scrapeSuccess && (
                                        <span className="text-sm font-medium text-green-600 animate-in fade-in zoom-in duration-300">
                                            Branding updated!
                                        </span>
                                    )}
                                </div>
                                {scrapeError && (
                                    <span className="text-sm font-medium text-red-500 animate-in fade-in zoom-in duration-300">
                                        {scrapeError}
                                    </span>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="audience" className="space-y-6">
                    <Card className="bg-white border-[#253551]/10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-[#253551]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-xl text-balance text-[#253551]">Audience & Contacts</CardTitle>
                                <CardDescription className="text-black/60 text-pretty">
                                    Manage your mailing list. We send your automated campaigns to these addresses.
                                </CardDescription>
                            </div>
                            <div className="bg-[#253551]/5 px-4 py-2 rounded-lg border border-[#253551]/10 flex flex-col items-center">
                                <span className="text-2xl font-bold text-[#253551]">{subscribers.length}</span>
                                <span className="text-[10px] uppercase font-bold text-black/40 tracking-wider">Active</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div
                                onClick={() => document.getElementById('csv-upload')?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-[#253551]/20 rounded-xl p-12 text-center hover:bg-[#253551]/5 transition-colors cursor-pointer group bg-slate-50/50"
                            >
                                <input
                                    type="file"
                                    id="csv-upload"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleChange}
                                />
                                <div className="h-12 w-12 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    {uploadingCSV ? <Loader2 className="h-6 w-6 text-[#253551] animate-spin" /> :
                                        uploadedCSV ? <CheckCircle2 className="h-6 w-6 text-green-500" /> :
                                            <Upload className="h-6 w-6 text-[#253551] group-hover:text-[#253551]/80 transition-colors" />}
                                </div>
                                <h3 className="text-lg font-medium text-[#253551] mb-1">
                                    {uploadingCSV ? "Processing CSV..." : uploadedCSV ? "Successfully uploaded!" : "Click to upload CSV"}
                                </h3>
                                <p className="text-sm text-black/50">or drag and drop your exported guest list here</p>
                            </div>

                            <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-[#253551]/10 after:h-px after:flex-1 after:bg-[#253551]/10">
                                <span className="text-xs text-black/40 font-bold uppercase tracking-wider">or connect API</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                                {['Tebi', 'Zenchef', 'Guestplan'].map(provider => (
                                    <Button
                                        key={provider}
                                        onClick={() => setConnectedAPIs(prev => ({ ...prev, [provider]: !prev[provider] }))}
                                        variant="outline"
                                        className={`border-[#253551]/20 h-14 font-medium shadow-sm transition-all ${connectedAPIs[provider] ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800' : 'bg-white text-[#253551] hover:bg-[#253551]/5'}`}
                                    >
                                        {connectedAPIs[provider] ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Connected</> : provider}
                                    </Button>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-[#253551]/10">
                                <Label htmlFor="single-email" className="text-[#253551] font-medium">Quick Add Subscriber</Label>
                                <p className="text-sm text-black/50 mb-3">Manually add a single email address to your audience (e.g. for testing purposes).</p>
                                <div className="flex gap-3">
                                    <Input
                                        id="single-email"
                                        placeholder="test@example.com"
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubscriber()}
                                        className="bg-white border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] h-11"
                                    />
                                    <Button onClick={handleAddSubscriber} className="bg-[#253551] text-white hover:bg-[#253551]/90 shadow-sm h-11 px-6 min-w-[100px] transition-all">
                                        {addSuccess ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : "Add"}
                                    </Button>
                                </div>
                                {addSuccess && <p className="text-sm text-green-600 mt-2 font-medium animate-in fade-in zoom-in duration-300">Subscriber successfully added!</p>}
                            </div>

                            <div className="mt-8 pt-8 border-t border-[#253551]/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#253551]" />
                                        <h3 className="font-semibold text-[#253551]">Subscriber Overview</h3>
                                    </div>
                                    {subscribers.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleRemoveAllSubscribers}
                                            disabled={isDeletingAll}
                                            className="h-8 text-xs shadow-sm bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            {isDeletingAll ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Trash2 className="w-3 h-3 mr-2" />}
                                            Alles ({subscribers.length}) Verwijderen
                                        </Button>
                                    )}
                                </div>

                                <div className="border border-[#253551]/10 rounded-lg overflow-hidden bg-white">
                                    <div className="max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-black/40 uppercase bg-slate-50 border-b border-[#253551]/10 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Email Address</th>
                                                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Source</th>
                                                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Date Added</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subscribers.map((sub, idx) => (
                                                    <tr key={idx} className="border-b border-[#253551]/5 hover:bg-slate-50/50 transition-colors last:border-0 relative">
                                                        <td className="px-4 py-3 font-medium text-[#253551] flex items-center gap-2">
                                                            <Mail className="w-3 h-3 text-black/30" />
                                                            {sub.email}
                                                        </td>
                                                        <td className="px-4 py-3 text-black/60 hidden sm:table-cell">
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200 shadow-sm">
                                                                {sub.source}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-black/40 hidden sm:table-cell">{sub.date}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveSubscriber(sub.email)}
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {subscribers.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-8 text-center text-black/40">
                                                            No subscribers yet. Import contacts or add one manually.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    )
}
