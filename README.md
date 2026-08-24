# MarketPack

MarketPack turns up to three source product photos into marketplace-sized JPGs, grouped by platform inside a single ZIP. Processing and ZIP creation happen entirely in the browser.

## Product and price hypothesis

- **Buyer:** Etsy/Amazon/Shopify sellers who also promote products on Instagram.
- **Job:** Export the same product shoot repeatedly without manual resizing, naming, or folder sorting.
- **Free demo:** Up to 3 source images, all four presets, real JPG output, real ZIP download, no watermark.
- **Planned paid offer:** **$7 once** to remove the source-image limit while retaining the same four presets and local workflow.
- **CTA:** A prefilled public GitHub issue requesting the paid version. The prototype does not imply checkout is live and collects no payment.
- **Strong validation:** A real launch-notification request or checkout conversion. ZIP creation alone proves utility, not willingness to pay.

## Presets reviewed 2026-08-24

These are convenient export presets, not compliance certification:

| Folder | Output | Basis |
|---|---:|---|
| `etsy/` | 2000 × 2000 JPG | Etsy recommends listing photos at least 2000 px in width and height. |
| `amazon/` | 1600 × 1600 JPG, white pad | Amazon guidance recommends 1600 px or larger on the longest side and a pure-white main-image background. Category/content rules remain seller responsibilities. |
| `shopify/` | 2048 × 2048 JPG | Shopify says 2048 × 2048 usually displays best for square product images. |
| `instagram/` | 1080 × 1350 JPG | Common 4:5 portrait export for Instagram feed use. Meta's public official pages did not expose an exact pixel recommendation in anonymous retrieval, so recheck before relying on it as a requirement. |

Official references:

- Etsy: https://help.etsy.com/hc/en-gb/articles/115015663347-Requirements-and-Best-Practices-for-Images-in-Your-Etsy-Shop
- Amazon Seller Central: https://sellercentral.amazon.com/seller-forums/discussions/t/7366420bc9ccfb8656594e6edcf4ece6
- Shopify: https://help.shopify.com/en/manual/products/product-media/product-media-types
- Meta (9:16 Reels guidance; distinct from the 4:5 feed preset): https://www.facebook.com/business/ads/facebook-instagram-reels-ads

Marketplace rules can change. Review current category, content, file-size, rights, and image requirements before upload. Resizing cannot make a visually non-compliant image compliant.

## Run and verify

No packages or build step are required.

```sh
python3 -m http.server 8080
node test.mjs
```

Open `http://localhost:8080`, drop one to three JPG/PNG/WebP images, create a ZIP, and confirm that each chosen platform folder contains correctly sized JPGs. Node tests cover preset data, geometry, naming, CRC-32, and ZIP structure; browser image decoding, Canvas output, drag-and-drop, and download require a real-browser smoke test.

During the 2026-08-24 local verification, the automated tests and HTTP serving checks passed, but macOS denied the computer-use accessibility read of the available browser. The real-browser image/drop/download smoke test therefore remains an explicit pre-deployment gate rather than a claimed pass.

## Privacy and cost

- No fetch/XHR, analytics, cookies, storage, external fonts, CDN, API, AI, backend, or image upload.
- Native Canvas transforms images; a small native store-mode ZIP writer builds the archive.
- Compatible static hosting can cost $0.
- Large source images consume browser memory. The prototype intentionally caps inputs at three.

## Revenue gates

1. Deploy to an owner-authorized static host with GitHub Issues enabled.
2. Validate interest using privacy-respecting aggregate page/CTA events only if the owner approves analytics.
3. Test and document practical browser/memory limits before releasing unlimited batches.
4. Add checkout and a license/unlock mechanism only with an owner-controlled merchant account, payout/KYC, terms, refund policy, and tax handling.
5. Recheck presets against current official marketplace documentation before launch.

No revenue exists until a settled, withdrawable payment is verified.
