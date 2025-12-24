import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "派奇智图 Peinture - AI 图像生成",
  description: "使用 AI 快速生成高质量图像，支持多种宽高比、高清模式、4K 放大和图层分解功能",
  keywords: ["AI", "图像生成", "AI绘画", "Peinture", "派奇智图", "text-to-image"],
  generator: "v0.app",
  openGraph: {
    title: "派奇智图 Peinture - AI 图像生成",
    description: "使用 AI 快速生成高质量图像",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "派奇智图 Peinture - AI 图像生成",
    description: "使用 AI 快速生成高质量图像",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4a2c6a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
