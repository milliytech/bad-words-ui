import type {Metadata} from 'next'
import {GeistSans} from 'geist/font/sans'
import {GeistMono} from 'geist/font/mono'
import {Analytics} from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Yomon So‘zlar Arxivi - Senzura Qiluvchi Platforma',
    description: "Yomon va nomaqbul so‘zlarni yig‘uvchi platforma. Toza va ijobiy muloqotni ta'minlash uchun ma'lumotlar bazasi!",
    keywords: [
        "so'kinishlar",
        "yomon so‘zlar",
        "nomaqbul so‘zlar",
        "senzura",
        "toza muloqot",
        "platforma",
        "ijobiy muhit",
        "ma'lumotlar bazasi"
    ],
    authors: [{name: 'Jahongir Hakimjonov'}],
    robots: 'index, follow',
    icons: {
        icon: '/favicon.ico'
    },
    openGraph: {
        title: 'Yomon So‘zlar Arxivi - Senzura Qiluvchi Platforma',
        description: "Yomon va nomaqbul so‘zlarni yig‘uvchi platforma. Toza va ijobiy muloqotni ta'minlash uchun ma'lumotlar bazasi!",
        url: 'https://badwords.milliytech.uz/',
        type: 'website',
        images: [
            'https://api.badwords.milliytech.uz/static/images/bad.webp'
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Yomon So‘zlar Arxivi - Senzura Qiluvchi Platforma',
        description: "Yomon va nomaqbul so‘zlarni yig‘uvchi platforma. Toza va ijobiy muloqotni ta'minlash uchun ma'lumotlar bazasi!",
        images: [
            'https://api.badwords.milliytech.uz/static/images/bad.webp'
        ]
    }
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics/>
        </body>
        </html>
    )
}