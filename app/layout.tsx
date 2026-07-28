import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Visão de Vendas | Varejo Analytics",
    description:
      "Dashboard privado para acompanhar vendas por categoria, loja, dia e modelo de celular.",
    openGraph: {
      title: "Visão de Vendas",
      description: "Receita, lucro, lojas e ranking de modelos em uma visão executiva.",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "Visão de Vendas" }],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Visão de Vendas",
      description: "Receita, lucro, lojas e ranking de modelos em uma visão executiva.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
