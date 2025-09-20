"use client"

import React, {useEffect, useRef, useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {
    AlertTriangle,
    CheckCircle,
    Cloud,
    Github,
    Globe,
    Heart,
    MessageSquare,
    Moon,
    Plus,
    Sparkles,
    Star,
    Sun,
    X,
    Zap,
} from "lucide-react"

// Small helper types
interface ApiResponse<T = any> {
    success: boolean
    message: string
    links: { next: string | null; previous: string | null }
    total_items: number
    total_pages: number
    page_size: number
    current_page: number
    data: T[]
}

const API_BASE = process.env.NEXT_PUBLIC_BADWORDS_API || "https://api.badwords.milliytech.uz"

export default function HomePage() {
    // theme
    const [isDark, setIsDark] = useState<boolean>(() => {
        try {
            const v = typeof window !== "undefined" ? window.localStorage.getItem("theme") : null
            if (v === "dark") return true
            if (v === "light") return false
        } catch (e) {
            // fallthrough
        }
        return true
    })

    // disclaimer (client-only to avoid hydration mismatches)
    // start hidden on server; read localStorage only on client after mount
    const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false)
    const acceptButtonRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        try {
            const v = window.localStorage.getItem("disclaimerAccepted")
            setShowDisclaimer(v !== "true")
        } catch (e) {
            setShowDisclaimer(true)
        }
    }, [])

    // form & UI
    const [wordInput, setWordInput] = useState<string>("")
    const [wordLength, setWordLength] = useState<number>(50)
    const [totalWords, setTotalWords] = useState<number>(0)
    const [isAdding, setIsAdding] = useState<boolean>(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [statusType, setStatusType] = useState<"success" | "error" | "info" | null>(null)

    // simple decorative particles
    // generate particles only on the client to avoid SSR hydration mismatch
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

    useEffect(() => {
        // generate after mount so server HTML matches client HTML during hydration
        const newParticles = Array.from({length: 12}, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 4,
        }))
        setParticles(newParticles)
    }, [])

    // side-effects: set document theme class when isDark changes
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", isDark)
        }
        try {
            if (typeof window !== "undefined") window.localStorage.setItem("theme", isDark ? "dark" : "light")
        } catch (e) {
            // ignore
        }
    }, [isDark])

    // focus accept button when disclaimer shown
    useEffect(() => {
        if (showDisclaimer && acceptButtonRef.current) {
            acceptButtonRef.current.focus()
        }
    }, [showDisclaimer])

    // fetch total words with AbortController to avoid leaks
    const fetchWordCount = async (signal?: AbortSignal) => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/badword/?page=1`, {signal})
            // guard: sometimes API returns not-json on error
            const json = await res.json().catch(() => null)
            if (!json) {
                setStatusType("error")
                setStatusMessage("Server returned unexpected response when fetching count")
                return
            }
            const data = json as ApiResponse
            if (data?.success) {
                setTotalWords(Number(data.total_items) || 0)
            } else {
                setStatusType("error")
                setStatusMessage(data?.message || "Failed to fetch words")
            }
        } catch (err) {
            if ((err as any)?.name === "AbortError") return
            console.error(err)
            setStatusType("error")
            setStatusMessage("Could not fetch total words")
        }
    }

    useEffect(() => {
        const controller = new AbortController()
        fetchWordCount(controller.signal)
        return () => controller.abort()
    }, [])

    const handleAccept = () => {
        try {
            window.localStorage.setItem("disclaimerAccepted", "true")
        } catch (e) {
            // ignore
        }
        setShowDisclaimer(false)
        setStatusType("info")
        setStatusMessage("Thanks — disclaimer accepted")
        setTimeout(() => {
            setStatusMessage(null)
            setStatusType(null)
        }, 2500)
    }

    const showTempMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
        setStatusMessage(msg)
        setStatusType(type)
        setTimeout(() => {
            setStatusMessage(null)
            setStatusType(null)
        }, 3500)
    }

    const addWord = async () => {
        // Do not allow adding until user accepts disclaimer
        try {
            const accepted = window.localStorage.getItem("disclaimerAccepted") === "true"
            if (!accepted) {
                showTempMessage("Please accept the disclaimer before adding words.", "error")
                return
            }
        } catch (e) {
            // fallback: if cannot read, still block
            showTempMessage("Please accept the disclaimer before adding words.", "error")
            return
        }

        const word = wordInput.trim()
        if (!word) return

        setIsAdding(true)
        try {
            const res = await fetch(`${API_BASE}/api/v1/badword/`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({word, severity: wordLength}),
            })

            const json = await res.json().catch(() => null)
            if (res.ok && json && (json as ApiResponse).success !== false) {
                setWordInput("")
                await fetchWordCount()
                showTempMessage("So'z muvaffaqiyatli qo'shildi", "success")
            } else {
                const errText = json?.data?.word || json?.message || "Xatolik juqildi"
                showTempMessage(String(errText), "error")
            }
        } catch (err) {
            console.error(err)
            showTempMessage("Tarmoq xatosi. Qayta urinib ko'ring.", "error")
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? "dark" : ""}`}>
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/10"/>
                <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_50%)]"/>
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute w-1 h-1 bg-foreground/10 rounded-full animate-pulse"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: "3s"
                        }}
                    />
                ))}
            </div>

            <header
                className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50">
                <div className="container flex h-20 items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-foreground/20 to-foreground/10 rounded-2xl blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-500"/>
                            <div
                                className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 p-0.5 shadow-2xl group-hover:scale-110 transition-all duration-500">
                                <div
                                    className="h-full w-full rounded-[14px] bg-background flex items-center justify-center relative overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-foreground/10"/>
                                    <MessageSquare className="h-6 w-6 text-foreground relative z-10 drop-shadow-sm"/>
                                </div>
                            </div>
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground animate-ping"/>
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground"/>
                        </div>
                        <div className="space-y-1">
                            <span className="font-bold text-xl text-foreground leading-tight tracking-tight">Yomon so'zlar</span>
                            <div className="text-xs text-muted-foreground font-medium">O'zbek tilidagi nojo'ya so'zlar
                                ro'yxati
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDark((s) => !s)}
                        className="h-12 w-12 rounded-2xl hover:bg-muted/20 transition-all duration-500 hover:scale-110 group relative overflow-hidden"
                        aria-pressed={isDark}
                        aria-label="Toggle theme"
                    >
                        <div
                            className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                        {isDark ? <Sun className="h-6 w-6 text-foreground"/> :
                            <Moon className="h-6 w-6 text-foreground"/>}
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-16 flex items-center justify-center min-h-[calc(100vh-5rem)]">
                <div className="w-full max-w-4xl space-y-16 animate-in fade-in-0 slide-in-from-bottom-8 duration-1200">
                    <div className="text-center space-y-10">
                        <div className="space-y-6">
                            <h1 className="text-6xl font-black text-balance text-foreground leading-tight tracking-tight">Yomon
                                so'zlar</h1>
                            <p className="text-xl text-muted-foreground max-w-md mx-auto text-pretty leading-relaxed font-medium">O'zbek
                                tilidagi nojo'ya so'zlar ro'yxatini professional tarzda boshqaring</p>

                            <div className="flex flex-wrap justify-center gap-2 mt-6">
                                <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                                    <Star className="h-3 w-3 mr-1"/> Open Source
                                </Badge>
                                <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                                    <Zap className="h-3 w-3 mr-1"/> Fast & Reliable
                                </Badge>
                                <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                                    <Heart className="h-3 w-3 mr-1"/> Made with Love
                                </Badge>
                            </div>
                        </div>

                        <Card
                            className="border-2 border-border/60 shadow-2xl shadow-foreground/5 hover:shadow-foreground/10 transition-all duration-700 backdrop-blur-xl bg-card/90 relative overflow-hidden group">
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                            <CardContent className="p-10 space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <Label htmlFor="word-input"
                                           className="text-lg font-semibold flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-foreground/10">
                                            <MessageSquare className="h-5 w-5 text-foreground"/>
                                        </div>
                                        So'zni kiriting
                                    </Label>
                                    <div className="relative group/input">
                                        <div
                                            className="absolute inset-0 bg-foreground/10 rounded-2xl blur-sm opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300"/>
                                        <Input
                                            id="word-input"
                                            value={wordInput}
                                            onChange={(e) => setWordInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addWord()}
                                            placeholder="Yomon so'zni yozing..."
                                            aria-label="Yomon so'z"
                                            className="relative h-16 text-lg border-2 border-border/60 focus:border-foreground/60 transition-all duration-500 bg-background/80 backdrop-blur-sm rounded-2xl font-medium placeholder:text-muted-foreground/60"
                                        />
                                        {wordInput && (
                                            <div
                                                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full bg-foreground animate-pulse shadow-lg"/>
                                                <span className="text-xs text-foreground/80 font-medium">Ready</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <Label htmlFor="word-length"
                                           className="text-lg font-semibold flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-foreground/10">
                                            <AlertTriangle className="h-5 w-5 text-foreground"/>
                                        </div>
                                        Yomonlik darajasi
                                    </Label>

                                    <div className="space-y-6">
                                        <div className="relative group/slider">
                                            <div
                                                className="absolute inset-0 bg-foreground/10 rounded-full blur-sm opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"/>
                                            <Input
                                                id="word-length"
                                                type="range"
                                                min={1}
                                                max={100}
                                                value={wordLength}
                                                onChange={(e) => setWordLength(Number(e.target.value))}
                                                className="relative w-full h-4 rounded-full appearance-none cursor-pointer shadow-inner"
                                            />
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-muted-foreground"/>
                                                <span
                                                    className="text-sm text-muted-foreground font-medium">Yengil</span>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className={`text-xl font-bold px-6 py-2 rounded-2xl border-2 shadow-lg ${
                                                    wordLength <= 33
                                                        ? "border-muted-foreground text-muted-foreground bg-muted/20"
                                                        : wordLength <= 66
                                                            ? "border-foreground/60 text-foreground/80 bg-muted/40"
                                                            : "border-foreground text-foreground bg-foreground/10"
                                                }`}
                                            >
                                                {wordLength}
                                            </Badge>

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-foreground font-medium">Og'ir</span>
                                                <div className="w-3 h-3 rounded-full bg-foreground"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={addWord}
                                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/90 hover:from-foreground/90 hover:via-foreground/90 hover:to-foreground/80 text-background transition-all duration-500 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-2xl relative overflow-hidden group/button"
                                    disabled={!wordInput.trim() || isAdding}
                                >
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"/>
                                    {isAdding ? (
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div
                                                className="w-6 h-6 border-3 border-background/30 border-t-background rounded-full animate-spin"/>
                                            <span>Qo'shilmoqda...</span>
                                            <Sparkles className="h-5 w-5 animate-pulse"/>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 relative z-10">
                                            <Plus className="h-6 w-6"/>
                                            <span>Qo'shish</span>
                                            <Zap className="h-5 w-5"/>
                                        </div>
                                    )}
                                </Button>

                                <div className="text-center">
                                    <div
                                        className="inline-flex items-center gap-4 bg-gradient-to-r from-foreground/10 via-foreground/5 to-foreground/10 rounded-2xl px-8 py-4 border-2 border-foreground/20 shadow-lg backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full bg-foreground animate-pulse shadow-lg"/>
                                            <div
                                                className="w-2 h-2 rounded-full bg-foreground/60 animate-pulse delay-300 shadow-lg"/>
                                        </div>
                                        <span className="text-xl font-bold">Jami so'zlar:</span>
                                        <Badge variant="secondary"
                                               className="text-2xl font-black px-6 py-2 bg-gradient-to-r from-foreground to-foreground/80 text-background rounded-xl shadow-lg">
                                            {totalWords}
                                        </Badge>
                                    </div>
                                </div>

                                {statusMessage && (
                                    <div
                                        className={`mt-4 text-center font-medium ${statusType === "error" ? "text-destructive" : statusType === "success" ? "text-foreground" : "text-muted-foreground"}`}
                                        role="status">
                                        {statusMessage}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <footer className="border-t border-border/50 bg-muted/20 backdrop-blur-xl py-16">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center space-y-8">
                        <div className="flex items-center space-x-3">
                            <Button asChild variant="ghost" size="icon"
                                    className="h-14 w-14 rounded-2xl hover:bg-foreground/10 hover:scale-125 transition-all duration-500 group relative overflow-hidden">
                                <a href="https://t.me/jakhangir_blog" target="_blank" rel="noopener noreferrer">
                                    <div
                                        className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                    <MessageSquare
                                        className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-all duration-300 relative z-10"/>
                                </a>
                            </Button>

                            <Button asChild variant="ghost" size="icon"
                                    className="h-14 w-14 rounded-2xl hover:bg-foreground/10 hover:scale-125 transition-all duration-500 group relative overflow-hidden">
                                <a href="https://dev.jakhangir.uz" target="_blank" rel="noopener noreferrer">
                                    <div
                                        className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                    <Globe
                                        className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-all duration-300 relative z-10"/>
                                </a>
                            </Button>

                            <Button asChild variant="ghost" size="icon"
                                    className="h-14 w-14 rounded-2xl hover:bg-foreground/10 hover:scale-125 transition-all duration-500 group relative overflow-hidden">
                                <a href="https://github.com/milliytech/uzbek-badwords" target="_blank"
                                   rel="noopener noreferrer">
                                    <div
                                        className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                    <Github
                                        className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-all duration-300 relative z-10"/>
                                </a>
                            </Button>

                            <Button asChild variant="ghost" size="icon"
                                    className="h-14 w-14 rounded-2xl hover:bg-foreground/10 hover:scale-125 transition-all duration-500 group relative overflow-hidden">
                                <a href={`${API_BASE}/media/words/bad_words.csv`} target="_blank"
                                   rel="noopener noreferrer">
                                    <div
                                        className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                    <Cloud
                                        className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-all duration-300 relative z-10"/>
                                </a>
                            </Button>
                        </div>

                        <p className="text-center text-muted-foreground max-w-2xl text-lg text-pretty leading-relaxed font-medium">
                            Bu veb-sayt o'zbek tilida yomon so'zlar ro'yxatini saqlash va ko'rish uchun yaratilgan. Siz
                            ham yomon so'zlar ro'yxatiga bilgan so'zlaringizni qo'shishingiz mumkin.
                        </p>
                    </div>
                </div>
            </footer>

            {showDisclaimer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                     role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
                    <Card className="w-full max-w-md mx-auto shadow-2xl border-2">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center space-y-6">
                                <div
                                    className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <AlertTriangle className="h-8 w-8 text-destructive"/>
                                </div>

                                <div className="text-center space-y-2">
                                    <h2 id="disclaimer-title" className="text-2xl font-bold">Disclaimer ⚠️</h2>
                                    <Badge variant="destructive" className="text-xs">18+ Yoshdan kichiklar uchun
                                        emas</Badge>
                                </div>

                                <div className="text-center space-y-4 text-sm leading-relaxed">
                                    <p>🚫 Bu loyihada ko'plab haqoratli so'zlar mavjud bo'lishi mumkin. Ushbu so'zlar
                                        faqat o'zbek tilidagi nojo'ya so'zlar ro'yxatidan olingan.</p>
                                    <p>Ushbu so'zlar faqat ma'lumotlar olish maqsadida ishlatiladi va ularni
                                        ishlatishdan kelib chiqadigan huquqiy javobgarlik sizga tegishli bo'lishi
                                        mumkin.</p>
                                    <p className="font-medium">18 yoshdan kichiklar uchun bu loyiha tavsiya etilmaydi.
                                        🚫</p>
                                    <p className="text-xs text-muted-foreground">Rozilik tugmasini bossangiz, ushbu
                                        shartlarga rozilik bildirgan hisoblanasiz.</p>
                                </div>

                                <div className="flex flex-col w-full space-y-3">
                                    <Button onClick={handleAccept} className="w-full" size="lg" ref={acceptButtonRef}>
                                        <CheckCircle className="h-4 w-4 mr-2"/> Roziman va davom etaman
                                    </Button>

                                    <Button asChild variant="outline" className="w-full" size="lg">
                                        <a href="https://milliytech.uz"
                                           className="text-foreground hover:text-foreground">
                                            <X className="h-4 w-4 mr-2"/> Orqaga qaytish
                                        </a>
                                    </Button>
                                </div>

                                <a href="https://github.com/milliytech/uzbek-badwords?tab=readme-ov-file#yomon-sozlar-arxivi---senzura-qiluvchi-platforma"
                                   target="_blank" className="text-xs text-primary hover:underline">To'liq ma'lumot</a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
