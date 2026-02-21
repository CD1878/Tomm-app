'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CalendarDays, Edit3, Send, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Mock data
const mockCampaigns = [
    { month: 1, name: "January", subject: "Een Gezond Begin bij Café Het Paardje 🐴", summary: "Highlighting dry january specials like our 0.0% beers and healthy lunch wraps.", status: "scheduled", date: "Jan 5th" },
    { month: 2, name: "February", subject: "Liefde & Gezelligheid: Valentine's Day ♥️", summary: "Promoting our cozy corner tables and special Valentine's sharing platters.", status: "scheduled", date: "Feb 5th" },
    { month: 3, name: "March", subject: "Lente in je Bol! 🌷", summary: "First sunny days on the Gerard Douplein terrace. Get ready!", status: "scheduled", date: "Mar 5th" },
    { month: 4, name: "April", subject: "Paasbrunch bij Het Paardje 🐰", summary: "Family brunch specials and extended opening hours for the Easter weekend.", status: "scheduled", date: "Apr 5th" },
    { month: 5, name: "May", subject: "Zon, Bier & Bitterballen ☀️", summary: "Official terrace season kick-off party announcement. Cold beers waiting.", status: "scheduled", date: "May 5th" },
    { month: 6, name: "June", subject: "Nieuwe Zomerse Lunchkaart 🥪", summary: "Introducing the new lightweight summer menu items and fresh salads.", status: "scheduled", date: "Jun 5th" },
    { month: 7, name: "July", subject: "Verkoeling op het Terras 🧊", summary: "Highlighting the refreshing craft beers and cold drinks to beat the heat.", status: "scheduled", date: "Jul 5th" },
    { month: 8, name: "August", subject: "Laatste Zomerdagen: Borreltijd 🍻", summary: "Promoting extended evening kitchen hours for those late summer drinks.", status: "scheduled", date: "Aug 5th" },
    { month: 9, name: "September", subject: "Herfst in De Pijp 🍂", summary: "Transitioning to hearty, warm autumn dishes and rich bockbeers.", status: "scheduled", date: "Sep 5th" },
    { month: 10, name: "October", subject: "Halloween Borrel & Bites 🎃", summary: "Special themed snacks and cozy vibes during the colder October days.", status: "scheduled", date: "Oct 5th" },
    { month: 11, name: "November", subject: "Vier de Feestdagen bij Ons 🥂", summary: "Pushing group reservations and corporate end-of-year drinks.", status: "scheduled", date: "Nov 5th" },
    { month: 12, name: "December", subject: "Fijne Feestdagen vanuit Het Paardje ✨", summary: "Christmas greetings and New Year's Eve special drinking packages.", status: "draft", date: "Dec 5th" },
];

export default function DashboardPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [campaigns, setCampaigns] = useState(mockCampaigns);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ websiteUrl: 'https://www.cafehetpaardje.nl/' }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate campaigns');
            }

            const data = await response.json();

            if (data.data?.campaigns && data.data.campaigns.length > 0) {
                setCampaigns(data.data.campaigns);
            } else if (data.campaigns && data.campaigns.length > 0) {
                setCampaigns(data.campaigns);
            } else {
                throw new Error("Invalid API response format");
            }
        } catch (error) {
            console.error('Error generating campaigns:', error);
            // We know the user doesn't have real API keys yet in the demo,
            // so we gracefully fallback to the specific Paardje mock data without failing.
            // Add an artificial delay to simulate the "AI thinking" process for the demo
            await new Promise((resolve) => setTimeout(resolve, 3500));
            setCampaigns(mockCampaigns);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#253551]/10 pb-6">
                <div>
                    <Badge variant="outline" className="mb-3 bg-white border-[#253551]/20 text-[#253551] shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> System Active
                    </Badge>
                    <h1 className="text-3xl font-bold tracking-tight text-[#253551] mb-2">Campaign Overview</h1>
                    <p className="text-black/60 font-light max-w-xl">
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
            </div>

            {/* 12 Month Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {campaigns.map((camp) => (
                    <Card key={camp.month} className="bg-white border-[#253551]/10 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col h-full group">
                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#253551]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <CardHeader className="pb-3 border-b border-[#253551]/5 relative z-10">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#253551]/70">
                                    {camp.name}
                                </span>
                                <Badge variant="secondary" className="bg-[#253551]/10 text-[#253551] border-none text-[10px] uppercase font-bold shadow-none">
                                    <CalendarDays className="w-3 h-3 mr-1" /> {camp.date}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg leading-tight text-[#253551]">{camp.subject}</CardTitle>
                        </CardHeader>

                        <CardContent className="pt-4 flex-1 relative z-10 text-black/60 text-sm font-light">
                            <div className="mb-4 h-24 bg-slate-50/80 rounded-lg border border-[#253551]/10 flex items-center justify-center text-black/20 group-hover:border-[#253551]/20 group-hover:bg-[#253551]/5 transition-colors">
                                <ImageIcon className="w-6 h-6 mb-1 opacity-50 text-[#253551]" />
                            </div>
                            <p className="line-clamp-3 leading-relaxed">{camp.summary}</p>
                        </CardContent>

                        <CardFooter className="pt-0 relative z-10 border-t border-[#253551]/5 mt-4 flex items-center justify-between bg-slate-50 py-3">
                            <Badge className={camp.status === 'scheduled' ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-none border-none' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-none border-none'}>
                                {camp.status}
                            </Badge>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#253551]/50 hover:text-[#253551] hover:bg-[#253551]/10 rounded-full" onClick={() => setSelectedCampaign(camp)}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                {selectedCampaign?.month === camp.month && (
                                    <DialogContent className="sm:max-w-[600px] bg-white border-[#253551]/20 text-black">
                                        <DialogHeader>
                                            <DialogTitle className="text-[#253551]">Edit {camp.name} Campaign</DialogTitle>
                                            <DialogDescription className="text-black/60">
                                                Make specialized changes. If you do nothing, we will automatically send the AI-generated version.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid gap-6 py-4">
                                            <div className="grid gap-3">
                                                <Label htmlFor="subject" className="text-[#253551] font-medium">Subject Line</Label>
                                                <Input id="subject" defaultValue={camp.subject} className="bg-white text-black border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551]" />
                                            </div>

                                            <div className="grid gap-3">
                                                <Label htmlFor="image" className="text-[#253551] font-medium">Feature Image (Optional replacement)</Label>
                                                <div className="border-2 border-dashed border-[#253551]/20 rounded-xl p-8 text-center hover:bg-[#253551]/5 transition-colors cursor-pointer group flex flex-col items-center bg-slate-50/50">
                                                    <ImageIcon className="h-6 w-6 text-[#253551]/50 mb-2 group-hover:text-[#253551] transition-colors" />
                                                    <span className="text-sm text-black/50">Click to upload custom image</span>
                                                </div>
                                            </div>

                                            <div className="grid gap-3">
                                                <Label htmlFor="body" className="text-[#253551] font-medium">Email Body</Label>
                                                <Textarea
                                                    id="body"
                                                    defaultValue={`Hey there,\n\n${camp.summary}\n\nBook your table now via our website.\n\nCheers,\n[Your Restaurant]`}
                                                    className="min-h-[150px] bg-white text-black border-[#253551]/20 focus-visible:ring-1 focus-visible:ring-[#253551]"
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button variant="outline" className="border-[#253551]/20 bg-white text-[#253551] hover:bg-slate-50">Cancel</Button>
                                            <Button className="bg-[#253551] text-white hover:bg-[#253551]/90 shadow-sm">Save Changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                )}
                            </Dialog>

                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
