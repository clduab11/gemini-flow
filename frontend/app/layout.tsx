import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Gemini Flow - React Flow Canvas</title>
        <meta name="description" content="Powered by Zustand for optimal performance" />
      </head>
      <body>{children}</body>
    </html>
  )
}