export const PRODUCT_CATEGORIES = [
  "Celulares",
  "Tablet",
  "Acessórios",
  "Películas",
  "IoT",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  Celulares: "#2457e6",
  Tablet: "#6f8fe8",
  Acessórios: "#9eb3ef",
  Películas: "#c5d2f2",
  IoT: "#6b7a99",
};

function normalizedProductText(product: unknown, code: unknown) {
  return `${product ?? ""} ${code ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export function isPhoneDescription(product: unknown, code: unknown = "") {
  const text = normalizedProductText(product, code);
  if (
    /PELICULA|TABLET|IPAD|CARREGADOR|CABO|FONE|HEADSET|SMARTWATCH|SMART WATCH|\bWATCH\b|ASPIRADOR|BALANCA|ESPELHO/.test(
      text,
    )
  ) {
    return false;
  }
  return /(?:^|\s)(?:CELULAR\s+)?(?:REALME|INFINIX|XIAOMI|REDMI|POCO|HONOR)\b/.test(
    text,
  );
}

export function inferProductCategory(
  product: unknown,
  code: unknown = "",
): ProductCategory {
  const text = normalizedProductText(product, code);

  if (/PELICULA/.test(text)) return "Películas";
  if (/\bTABLET\b|\bIPAD\b/.test(text)) return "Tablet";
  if (
    /ASPIRADOR|BALANCA|SMARTWATCH|SMART WATCH|\bWATCH\b|\bWHATCH\b/.test(
      text,
    )
  ) {
    return "IoT";
  }
  if (isPhoneDescription(product, code)) return "Celulares";

  // Cabos, carregadores, fones, microfones, suportes, chopeiras,
  // LEDs portáteis, espelhos e demais complementos entram em Acessórios.
  return "Acessórios";
}
