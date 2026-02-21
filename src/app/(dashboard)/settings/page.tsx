'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Instagram, Upload, RefreshCw, CheckCircle2, Loader2 } from "lucide-react"

export default function SettingsPage() {
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeSuccess, setScrapeSuccess] = useState(false);

    const handleScrape = () => {
        setIsScraping(true);
        setScrapeSuccess(false);

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
                        <CardHeader>
                            <CardTitle className="text-xl text-[#253551]">Import Contacts</CardTitle>
                            <CardDescription className="text-black/60">
                                Upload a CSV of your guests or connect directly to your reservation system (Tebi, Zenchef, Guestplan).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-[#253551]/20 rounded-xl p-12 text-center hover:bg-[#253551]/5 transition-colors cursor-pointer group bg-slate-50/50">
                                <div className="h-12 w-12 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6 text-[#253551] group-hover:text-[#253551]/80 transition-colors" />
                                </div>
                                <h3 className="text-lg font-medium text-[#253551] mb-1">Click to upload CSV</h3>
                                <p className="text-sm text-black/50">or drag and drop your exported guest list here</p>
                            </div>

                            <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-[#253551]/10 after:h-px after:flex-1 after:bg-[#253551]/10">
                                <span className="text-xs text-black/40 font-bold uppercase tracking-wider">or connect API</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                                <Button variant="outline" className="border-[#253551]/20 bg-white hover:bg-[#253551]/5 h-14 text-[#253551] font-medium shadow-sm">Tebi</Button>
                                <Button variant="outline" className="border-[#253551]/20 bg-white hover:bg-[#253551]/5 h-14 text-[#253551] font-medium shadow-sm">Zenchef</Button>
                                <Button variant="outline" className="border-[#253551]/20 bg-white hover:bg-[#253551]/5 h-14 text-[#253551] font-medium shadow-sm">Guestplan</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
