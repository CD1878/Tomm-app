'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Instagram, Upload, RefreshCw, CheckCircle2, Loader2, Users, Mail, Trash2 } from "lucide-react"

export default function SettingsPage() {
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeSuccess, setScrapeSuccess] = useState(false);
    const [instructions, setInstructions] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [addSuccess, setAddSuccess] = useState(false);
    const [subscribers, setSubscribers] = useState<{ email: string, source: string, date: string }[]>([]);

    // UI Interaction states
    const [uploadingCSV, setUploadingCSV] = useState(false);
    const [uploadedCSV, setUploadedCSV] = useState(false);
    const [connectedAPIs, setConnectedAPIs] = useState<Record<string, boolean>>({});

    // Load saved instructions on mount
    useEffect(() => {
        const savedInstructions = localStorage.getItem('tomm_global_instructions');
        if (savedInstructions) {
            setInstructions(savedInstructions);
        }

        const savedSubs = localStorage.getItem('tomm_demo_subscribers');
        if (savedSubs) {
            setSubscribers(JSON.parse(savedSubs));
        } else {
            // Initial mock data to make the MVP look populated
            const initialMock = [
                { email: "johan@example.com", source: "Tebi Import", date: "Oct 12, 2023" },
                { email: "sarah.peeters@gmail.com", source: "Tebi Import", date: "Nov 05, 2023" },
                { email: "info@business-partner.nl", source: "Website Form", date: "Jan 22, 2024" },
            ];
            setSubscribers(initialMock);
            localStorage.setItem('tomm_demo_subscribers', JSON.stringify(initialMock));
        }
    }, []);

    const handleAddSubscriber = () => {
        if (!newEmail || !newEmail.includes('@')) return;

        const newSub = {
            email: newEmail,
            source: "Manual Add",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        const updatedSubs = [newSub, ...subscribers];
        setSubscribers(updatedSubs);
        localStorage.setItem('tomm_demo_subscribers', JSON.stringify(updatedSubs));
        setNewEmail("");

        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 3000);
    };

    const handleRemoveSubscriber = (emailToRemove: string) => {
        const updatedSubs = subscribers.filter(s => s.email !== emailToRemove);
        setSubscribers(updatedSubs);
        localStorage.setItem('tomm_demo_subscribers', JSON.stringify(updatedSubs));
    };

    const handleScrape = () => {
        setIsScraping(true);
        setScrapeSuccess(false);

        // Save global instructions to local storage for the dashboard to use
        localStorage.setItem('tomm_global_instructions', instructions);

        // Simulate API call to scrape
        setTimeout(() => {
            setIsScraping(false);
            setScrapeSuccess(true);

            // Reset success message after 3 seconds
            setTimeout(() => {
                setScrapeSuccess(false);
            }, 3000);
        }, 2500);
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#253551] mb-2">Settings</h1>
                <p className="text-black/60 font-light">Configure your business profile and audience connections. TOMM uses this data to generate your personalized campaigns.</p>
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
                            <CardTitle className="text-xl text-[#253551]">Digital Footprint</CardTitle>
                            <CardDescription className="text-black/60">
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
                                        defaultValue="https://www.cafehetpaardje.nl/"
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
                                        defaultValue="https://www.instagram.com/paardcafe/?hl=nl"
                                        className="pl-10 bg-white border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551] text-black placeholder:text-black/40 h-11"
                                    />
                                </div>
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
                            <Button
                                onClick={handleScrape}
                                disabled={isScraping}
                                className="w-full sm:w-auto bg-[#253551] text-white hover:bg-[#253551]/90 shadow-sm transition-all"
                            >
                                {isScraping ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scraping Data...</>
                                ) : scrapeSuccess ? (
                                    <><CheckCircle2 className="mr-2 h-4 w-4 text-green-400" /> Successfully Scraped</>
                                ) : (
                                    <><RefreshCw className="mr-2 h-4 w-4" /> Save & Start Scraping</>
                                )}
                            </Button>

                            {scrapeSuccess && (
                                <span className="text-sm font-medium text-green-600 animate-in fade-in zoom-in duration-300">
                                    Branding updated!
                                </span>
                            )}
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="audience" className="space-y-6">
                    <Card className="bg-white border-[#253551]/10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-[#253551]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-xl text-[#253551]">Audience & Contacts</CardTitle>
                                <CardDescription className="text-black/60">
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
                                onClick={() => {
                                    setUploadingCSV(true);
                                    setTimeout(() => {
                                        setUploadingCSV(false);
                                        setUploadedCSV(true);
                                        setTimeout(() => setUploadedCSV(false), 3000);
                                    }, 1500);
                                }}
                                className="border-2 border-dashed border-[#253551]/20 rounded-xl p-12 text-center hover:bg-[#253551]/5 transition-colors cursor-pointer group bg-slate-50/50"
                            >
                                <div className="h-12 w-12 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    {uploadingCSV ? <Loader2 className="h-6 w-6 text-[#253551] animate-spin" /> :
                                        uploadedCSV ? <CheckCircle2 className="h-6 w-6 text-green-500" /> :
                                            <Upload className="h-6 w-6 text-[#253551] group-hover:text-[#253551]/80 transition-colors" />}
                                </div>
                                <h3 className="text-lg font-medium text-[#253551] mb-1">
                                    {uploadingCSV ? "Uploading..." : uploadedCSV ? "Successfully uploaded!" : "Click to upload CSV"}
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
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-[#253551]" />
                                    <h3 className="font-semibold text-[#253551]">Subscriber Overview</h3>
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
        </div>
    )
}
