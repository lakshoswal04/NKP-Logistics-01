/**
 * Site copy in one place.
 *
 * NKP is a warehousing and fulfilment specialist — not a full-stack carrier —
 * so the copy deliberately never claims line-haul, air or cross-border services
 * we do not run. Where shipments move, they move through partner carriers, and
 * the wording says so.
 */

export const COMPANY = {
  name: "NKP Logistics",
  legalName: "NKP Logistics Pvt Ltd",
  tagline: "Warehousing and fulfilment, run properly",
  phone: "+91 22 6100 4400",
  supportPhone: "+91 22 6100 4411",
  email: "hello@nkplogistics.in",
  salesEmail: "sales@nkplogistics.in",
  supportEmail: "support@nkplogistics.in",
  gstin: "27AABCN1234K1Z9",
  cin: "U63030MH2021PTC356712",
  hq: "NKP House, Plot 14, MIDC Bhiwandi, Thane 421302, Maharashtra",
} as const;

/** Rolling advisory ticker under the navbar — modelled on the real thing. */
export const ALERTS = [
  "Beware of phishing SMS claiming a failed delivery attempt and linking to payment pages",
  "NKP will never ask for an OTP, UPI PIN or card details to release a shipment",
  "Raise support requests only through this website — we do not operate WhatsApp support numbers",
  "Invoices are sent only from billing@nkplogistics.in with a signed PDF attached",
] as const;

/** Three, widely spaced — five compressed into a dense row, which was part of
 *  what made the hero feel crowded. The other two figures still appear on the
 *  warehousing page, where there is room for them. */
export const STATS = [
  { value: "7.4 Mn+", label: "Sq ft of warehousing under management" },
  { value: "42", label: "Fulfilment centres across 14 states" },
  { value: "19,100+", label: "Serviceable delivery pin codes" },
] as const;

/** The fuller set, used where the layout can carry it. */
export const STATS_EXTENDED = [
  ...STATS,
  { value: "1,850+", label: "Brands fulfilled every month" },
  { value: "99.4%", label: "Inventory accuracy at cycle count" },
] as const;

/** Who we build for — the three-up on the dark band. */
export const SOLUTIONS = [
  {
    slug: "d2c",
    title: "D2C Brands",
    blurb:
      "Same-day dispatch on orders placed before the cut-off, inventory split across regional " +
      "fulfilment centres, and a returns desk that grades and restocks instead of writing off.",
  },
  {
    slug: "b2b",
    title: "B2B & Retail Distribution",
    blurb:
      "Factory-to-retailer distribution with appointment-based dispatch, MRP labelling, case " +
      "picking and the paperwork modern trade actually demands — GRN, e-way bill, ASN.",
  },
  {
    slug: "marketplace",
    title: "Marketplace Sellers",
    blurb:
      "Stock held close to demand and shipped under each marketplace's own SLA, with listing-level " +
      "inventory sync so you are never overselling a SKU you cannot fulfil.",
  },
] as const;

/**
 * Capabilities inside the fulfilment centre. This is deliberately a breakdown
 * of warehousing rather than a menu of transport services — warehousing is the
 * only thing NKP operates directly.
 */
export const CAPABILITIES = [
  {
    slug: "multi-client-warehousing",
    title: "Multi-client Warehousing",
    image: "/media/fc-stock-red-racking.jpg",
    blurb:
      "Dedicated or shared racking across 42 fulfilment centres, billed on space actually " +
      "occupied so you are not paying for a peak-season footprint in February.",
  },
  {
    slug: "pick-pack",
    title: "Pick, Pack & Label",
    image: "/media/ops-dispatch-van.jpg",
    blurb:
      "Scan-verified picking with carrier-compliant labelling and branded packaging, cut off " +
      "at 6pm for same-day handover to the delivery partner.",
  },
  {
    slug: "inventory",
    title: "Inventory Management",
    image: "/media/ops-picker.jpg",
    blurb:
      "Batch, expiry and serial tracking with perpetual cycle counts, reconciled nightly " +
      "against your storefront so system stock matches shelf stock.",
  },
  {
    slug: "returns",
    title: "Returns & Reverse Logistics",
    image: "/media/ops-pallets.jpg",
    blurb:
      "Returns received, graded, refurbished where viable and put back on the shelf — with " +
      "photographic evidence on every rejection.",
  },
  {
    slug: "vas",
    title: "Value-added Services",
    image: "/media/ops-forklift.jpg",
    blurb:
      "Kitting, bundling, combo packs, MRP re-labelling and quality inspection handled on " +
      "the floor instead of at a separate vendor.",
  },
  {
    slug: "distribution",
    title: "Outbound Distribution",
    image: "/media/line-haul-truck.jpg",
    blurb:
      "Consolidated dispatch to your own stores, distributors and marketplace hubs through " +
      "vetted line-haul partners, tracked end to end from our dock.",
  },
] as const;

/** The four-up on the warehousing page. */
export const FULFILMENT_STEPS = [
  {
    title: "Inbound & putaway",
    body:
      "Vehicles are booked into a dock slot, unloaded against the ASN and counted before the " +
      "gate pass is signed. Short-shipped or damaged cartons are photographed and raised as a " +
      "discrepancy the same day, not at month end.",
  },
  {
    title: "Storage & inventory control",
    body:
      "Every SKU gets a location, a batch and an expiry where relevant. Perpetual cycle counting " +
      "means accuracy is measured continuously rather than discovered during an annual stock take.",
  },
  {
    title: "Order fulfilment",
    body:
      "Orders drop from your storefront or ERP into the warehouse management system, are wave-picked " +
      "by zone, scan-verified at packing and manifested to the carrier before cut-off.",
  },
  {
    title: "Dispatch & reconciliation",
    body:
      "Manifests hand over to the delivery partner with a signed handover sheet. Every consignment " +
      "reconciles back against dispatch, delivery and return, so nothing quietly disappears.",
  },
] as const;

/** The 2×2 advantage grid on the warehousing page. */
export const ADVANTAGES = [
  {
    title: "Multi-client fulfilment centres with 7.4 Mn+ sq ft of racking",
    body: "Scale up for a festive peak and back down afterwards without renegotiating a lease.",
  },
  {
    title: "One warehouse management system across every location",
    body: "The same stock view, the same reports and the same API whether you use one FC or nine.",
  },
  {
    title: "Billing you can actually audit",
    body: "Storage, handling and value-added work itemised per line with HSN/SAC on a GST invoice.",
  },
  {
    title: "Inventory visibility down to the batch",
    body: "Live stock, ageing, near-expiry and reserved quantities, reconciled nightly to your channels.",
  },
] as const;

export const CASE_STUDIES = [
  {
    title: "A skincare brand cuts order-to-ship from 38 hours to under 6",
    image: "/media/ops-picker.jpg",
    body:
      "Before moving in, the brand was fulfilling from a rented godown with a spreadsheet for stock. " +
      "Splitting inventory across our Bhiwandi and Hoskote centres put 78% of their orders within a " +
      "next-day delivery radius, and scan-verified picking took mis-ships from 1.8% to 0.2%.",
    metrics: [
      { value: "38h → 6h", label: "Order-to-ship" },
      { value: "0.2%", label: "Mis-ship rate" },
      { value: "78%", label: "Orders in next-day radius" },
    ],
  },
  {
    title: "A kitchenware exporter consolidates nine godowns into three FCs",
    image: "/media/fc-racking-pallets.jpg",
    body:
      "Nine regional godowns meant nine stock ledgers and no single view of inventory. Consolidating " +
      "into three multi-client fulfilment centres cut fixed storage cost by 31% and, for the first " +
      "time, produced a reconciled national stock position each morning.",
    metrics: [
      { value: "9 → 3", label: "Storage locations" },
      { value: "31%", label: "Lower fixed storage cost" },
      { value: "99.6%", label: "Inventory accuracy" },
    ],
  },
] as const;

/** Support centre taxonomy — mirrors how a real support desk is organised. */
export const SUPPORT_CATEGORIES = [
  {
    slug: "shipments",
    title: "Shipments",
    topics: [
      {
        q: "How do I track my consignment?",
        a: "Enter your AWB, order ID or LRN on the Track page. Tracking goes live once the consignment has been manifested and handed to the delivery partner, which is usually within a few hours of dispatch from our fulfilment centre.",
      },
      {
        q: "My tracking has not updated in two days. What does that mean?",
        a: "Scans update when a consignment changes hands or location, so a stationary status usually means it is in line-haul between hubs rather than lost. If there has been no scan for more than 48 hours, raise a query with the AWB and we will trace it with the carrier.",
      },
      {
        q: "Why is my delivery delayed?",
        a: "The common causes are weather or road closures on the lane, an incomplete or unreachable delivery address, and seasonal volume peaks. Where we can see a specific cause on your consignment, it is shown on the tracking timeline rather than hidden behind a generic status.",
      },
      {
        q: "Can I change the delivery address after dispatch?",
        a: "Within the same city, usually yes, if the consignment has not gone out for delivery. Raise a query with the AWB and the corrected address. A change to a different city means the consignment has to come back to the fulfilment centre first.",
      },
    ],
  },
  {
    slug: "inventory",
    title: "Inventory & Fulfilment",
    topics: [
      {
        q: "How quickly is inbound stock available to sell?",
        a: "Stock is counted, put away and live in the system within 24 hours of unloading for standard cartons. Items needing inspection, kitting or re-labelling take longer, and that turnaround is agreed in your service schedule.",
      },
      {
        q: "What is the dispatch cut-off?",
        a: "Orders received before 6:00 pm at the fulfilment centre are picked, packed and handed to the delivery partner the same day. Orders after cut-off go out on the next working day's first manifest.",
      },
      {
        q: "How is inventory accuracy maintained?",
        a: "Through perpetual cycle counting rather than an annual stock take — a rolling subset of locations is counted every day, so discrepancies surface within days instead of at year end. Current accuracy across the network is 99.4%.",
      },
      {
        q: "Can I hold stock in more than one fulfilment centre?",
        a: "Yes, and most brands past a certain volume should. Splitting inventory across regional centres shortens the delivery radius and lowers freight cost. We model the split against your historical order distribution before you commit.",
      },
    ],
  },
  {
    slug: "billing",
    title: "Billing & Payments",
    topics: [
      {
        q: "How is warehousing billed?",
        a: "Monthly in arrears, itemised into storage (on space actually occupied), handling (per order or per pallet) and any value-added work. Every line carries its HSN/SAC code so your finance team can claim input credit.",
      },
      {
        q: "My GSTIN is missing or wrong on an invoice.",
        a: "Raise a billing query with the invoice number and the correct GSTIN. An issued invoice cannot be edited in place — we cancel it and issue a corrected one against a credit note, which is what GST rules require.",
      },
      {
        q: "What payment methods do you accept?",
        a: "Invoices can be paid online by UPI, net banking, debit or credit card through the payment link on the invoice, or by NEFT/RTGS to the account printed on it. Online payments reconcile against the invoice automatically.",
      },
      {
        q: "When is payment due?",
        a: "Fifteen days from the invoice date unless your contract says otherwise. The due date is printed on every invoice and shown on the invoice list in your dashboard.",
      },
    ],
  },
  {
    slug: "account",
    title: "Account & Onboarding",
    topics: [
      {
        q: "How long does onboarding take?",
        a: "Typically two to three weeks from signed agreement to first dispatch: one week for the commercial and space allocation, one for systems integration and master data, and a few days of parallel running before cutover.",
      },
      {
        q: "Do you integrate with my storefront or ERP?",
        a: "Yes. Shopify, WooCommerce and the major Indian marketplaces have prebuilt connectors; anything else integrates over our REST API. Orders, inventory and dispatch status sync both ways.",
      },
      {
        q: "What are the minimum volumes?",
        a: "Shared racking starts to make sense from roughly 1,500 orders a month or half a pallet position of steady stock. Below that a dedicated fulfilment partner is usually more expensive than fulfilling in-house, and we will tell you so.",
      },
      {
        q: "Who do I contact about an existing account?",
        a: "Your named account manager, or raise a query here and it routes to the right desk. Include your company name and, if relevant, the AWB or invoice number.",
      },
    ],
  },
] as const;

export const SUPPORT_QUERY_CATEGORIES = [
  "Shipment status",
  "Delivery issue",
  "Inventory discrepancy",
  "Damaged or short receipt",
  "Billing or invoice",
  "New business enquiry",
  "Integration or API",
  "Something else",
] as const;

export const OFFICES = [
  {
    city: "Mumbai",
    role: "Head office",
    address: "NKP House, Plot 14, MIDC Bhiwandi, Thane 421302, Maharashtra",
    phone: "+91 22 6100 4400",
  },
  {
    city: "Bengaluru",
    role: "South regional hub",
    address: "Survey 44/2, Hoskote Industrial Area, Bengaluru 562114, Karnataka",
    phone: "+91 80 4718 2200",
  },
  {
    city: "Delhi NCR",
    role: "North regional hub",
    address: "Sector 18, Udyog Vihar, Gurugram 122016, Haryana",
    phone: "+91 124 471 9900",
  },
] as const;

/** Footer navigation. */
export const FOOTER_COLUMNS = [
  {
    heading: "Services",
    links: [
      { label: "Warehousing", href: "/services/warehousing" },
      { label: "Fulfilment", href: "/services/warehousing#fulfilment" },
      { label: "Returns management", href: "/services/warehousing#fulfilment" },
      { label: "Value-added services", href: "/services/warehousing#advantage" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "D2C brands", href: "/services/warehousing#solutions" },
      { label: "B2B distribution", href: "/services/warehousing#solutions" },
      { label: "Marketplace sellers", href: "/services/warehousing#solutions" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Track a consignment", href: "/track" },
      { label: "AI Control Tower", href: "/ai" },
      { label: "Customer dashboard", href: "/dashboard" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    heading: "Get in touch",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Support centre", href: "/support" },
      { label: "Raise a query", href: "/support#raise" },
      { label: "Request a quote", href: "/contact" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Terms & conditions", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Fraud disclaimer", href: "/support#fraud" },
    ],
  },
] as const;
