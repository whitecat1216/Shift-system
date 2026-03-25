export const mobilePreviewUser = {
  id: "mobile-preview",
  email: "preview@shiftpilot.local",
  displayName: "モバイルプレビュー",
  roleCodes: ["admin"],
  allowedPagePaths: [
    "/dashboard",
    "/ai-shift",
    "/multi-store",
    "/shifts",
    "/requests",
    "/leave-control",
    "/leave-balance",
    "/labor-cost",
    "/staff",
  ],
  allowedBusinessIds: ["hotel", "restaurant"],
  allowedStoreIds: ["shinagawa", "yokohama", "haneda", "shibuya", "shinjuku", "ikebukuro"],
};
