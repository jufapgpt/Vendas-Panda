export const PRODUCT_CATEGORIES = [
  "Celulares",
  "Tablet",
  "Acessórios",
  "Películas",
  "IoT",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductClassification = {
  category: ProductCategory | null;
  recognized: boolean;
};

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
  return /(?:^|\s)(?:CELULAR\s+)?(?:REALME|INFINIX|XIAOMI|REDMI|POCO|HONOR|SAMSUNG|APPLE|IPHONE|MOTOROLA|MOTO|TECNO|OPPO|HUAWEI|NOKIA)\b/.test(
    text,
  );
}

export function classifyProduct(
  product: unknown,
  code: unknown = "",
): ProductClassification {
  const text = normalizedProductText(product, code);

  if (/PELICULA/.test(text)) {
    return { category: "Películas", recognized: true };
  }
  if (/\bTABLET\b|\bIPAD\b/.test(text)) {
    return { category: "Tablet", recognized: true };
  }
  if (
    /ASPIRADOR|BALANCA|SMARTWATCH|SMART WATCH|\bWATCH\b|\bWHATCH\b/.test(
      text,
    )
  ) {
    return { category: "IoT", recognized: true };
  }
  if (isPhoneDescription(product, code)) {
    return { category: "Celulares", recognized: true };
  }
  if (
    /CARREGADOR|CABO|FONE|HEADSET|EARPHONE|MICROFONE|LAPELA|SUPORTE|CHOPEIRA|LED PORTATIL|ESPELHO|CAPA|CAPINHA|\bCASE\b|ADAPTADOR|POWER BANK|BATERIA|PEDESTAL|TRIPE|TECLADO|MOUSE|CAIXA DE SOM|SPEAKER/.test(
      text,
    )
  ) {
    return { category: "Acessórios", recognized: true };
  }

  return { category: null, recognized: false };
}

export function inferProductCategory(
  product: unknown,
  code: unknown = "",
): ProductCategory {
  return classifyProduct(product, code).category ?? "Acessórios";
}
