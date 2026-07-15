export const COMPANY = {
  name: "NKP Logistics",
  phone: "+91 90000 00000",
  email: "hello@nkplogistics.in",
  address: "NKP House, Andheri East, Mumbai 400093, Maharashtra",
};

export const STATS = [
  { value: "1.2M+", label: "Shipments delivered" },
  { value: "450+", label: "Businesses served" },
  { value: "96.4%", label: "On-time delivery" },
  { value: "220+", label: "Cities covered" },
];

export const HOW_IT_WORKS = [
  {
    title: "AI Route Optimization",
    text: "Every dispatch is planned by algorithms that weigh distance, capacity and deadlines.",
  },
  {
    title: "Real-Time Tracking",
    text: "Live location and status for every shipment — for you and your customers.",
  },
  {
    title: "Predictive Insights",
    text: "Delay and risk flags raised before they become missed deliveries.",
  },
  {
    title: "Smart Analytics",
    text: "Lane-level performance and spend visibility in one dashboard.",
  },
];

export const SERVICES = [
  {
    slug: "b2b-transportation",
    title: "B2B Transportation",
    blurb: "Full-truckload, part-load and express freight across 220+ Indian cities.",
    features: ["FTL & LTL freight", "Dedicated fleet options", "Express delivery", "Pan-India lane network"],
  },
  {
    slug: "warehousing",
    title: "Warehousing Solutions",
    blurb: "Storage and fulfilment hubs with live inventory visibility.",
    features: ["Storage & inventory management", "Cross-docking", "Cold storage", "Value-added services"],
  },
  {
    slug: "last-mile-delivery",
    title: "Last-Mile Delivery",
    blurb: "Reliable final-leg delivery to stores, dealers and doorsteps.",
    features: ["Retail distribution", "Dealer & store delivery", "E-commerce fulfilment", "POD capture"],
  },
  {
    slug: "reverse-logistics",
    title: "Reverse Logistics",
    blurb: "Returns handled as carefully as forward shipments.",
    features: ["Returns management", "Damage handling", "Replacement logistics", "Recycling & disposal"],
  },
  {
    slug: "contract-logistics",
    title: "Contract Logistics",
    blurb: "Dedicated trucks, drivers and operations run under your brand.",
    features: ["Dedicated trucks & drivers", "Embedded operations", "SLA-backed performance", "Custom reporting"],
  },
  {
    slug: "supply-chain",
    title: "Supply Chain Management",
    blurb: "End-to-end planning across inventory, transport and warehousing.",
    features: ["Planning & forecasting", "Inventory management", "Transportation management", "Warehouse management"],
  },
];

export const INDUSTRIES = [
  { slug: "manufacturers", title: "Manufacturers", blurb: "Inbound raw material and outbound finished-goods lanes, synchronized with production schedules." },
  { slug: "distributors", title: "Distributors", blurb: "High-frequency multi-drop distribution with route-optimized fleets." },
  { slug: "retail-chains", title: "Retail Chains", blurb: "Store replenishment with fixed delivery windows and POD compliance." },
  { slug: "wholesalers", title: "Wholesalers", blurb: "Bulk freight at negotiated lane rates with consolidated invoicing." },
  { slug: "smes", title: "SMEs", blurb: "Enterprise-grade logistics without enterprise-scale volumes or contracts." },
  { slug: "import-export", title: "Import / Export", blurb: "Port-to-door movements with documentation support end to end." },
];

export const AI_FEATURES = [
  { title: "AI Route Optimization", text: "Trucks spend fewer kilometres empty because every dispatch plan is solved, not guessed." },
  { title: "AI ETA Prediction", text: "Delivery windows your customers can plan around, updated as trips progress." },
  { title: "AI Delay Prediction", text: "Fewer late deliveries because we flag risk before the truck leaves." },
  { title: "AI Fraud Detection", text: "Suspicious bookings and claims caught earlier than any manual review." },
  { title: "AI Demand Forecasting", text: "Capacity positioned where next week's volume will actually be." },
  { title: "AI Operations Copilot", text: "Ask questions about your logistics in plain language, get answers with data." },
];

export const FAQS = [
  {
    category: "Booking",
    items: [
      { q: "How do I book a shipment?", a: "Request a quote via the Contact page — once your account is active you can book directly from the customer portal in under a minute." },
      { q: "What shipment types do you support?", a: "Full-truckload (FTL), part-load (LTL), express, and last-mile distribution across 220+ cities." },
      { q: "Can I schedule pickups in advance?", a: "Yes — pickups can be scheduled for any future date with preferred time windows." },
    ],
  },
  {
    category: "Tracking",
    items: [
      { q: "How do I track my shipment?", a: "Enter your tracking ID (e.g. NKP2026A1B2) on the Track page. No login needed." },
      { q: "How current is tracking data?", a: "Status events update in near real time as drivers progress through the route." },
      { q: "Can my customers track shipments too?", a: "Yes — the public tracking link can be shared with anyone; it shows status without exposing contact details." },
    ],
  },
  {
    category: "Pricing",
    items: [
      { q: "How is pricing calculated?", a: "By lane distance, weight, shipment type and urgency. Our AI quote engine gives an indicative range instantly; final pricing is confirmed by our team." },
      { q: "Are there volume discounts?", a: "Yes — contracted lanes and committed monthly volumes are priced lower than spot bookings." },
    ],
  },
  {
    category: "Returns",
    items: [
      { q: "Do you handle returns?", a: "Yes — reverse logistics including returns, damage handling, replacements and disposal." },
    ],
  },
  {
    category: "Account",
    items: [
      { q: "How do I get an account?", a: "Submit the Get a Quote form — our team converts qualified leads to portal accounts within one business day." },
      { q: "Can multiple team members use one account?", a: "Yes — customer accounts support team members with role-based access." },
    ],
  },
];

export const JOBS = [
  { title: "Senior Operations Manager", dept: "Operations", location: "Mumbai", type: "Full-time" },
  { title: "Fleet Supervisor", dept: "Operations", location: "Delhi NCR", type: "Full-time" },
  { title: "Full-Stack Engineer", dept: "Technology", location: "Bengaluru / Remote", type: "Full-time" },
  { title: "ML Engineer — Forecasting", dept: "Technology", location: "Bengaluru / Remote", type: "Full-time" },
  { title: "Enterprise Sales Manager", dept: "Sales", location: "Mumbai", type: "Full-time" },
  { title: "Warehouse Shift Lead", dept: "Warehousing", location: "Bhiwandi", type: "Full-time" },
];

export const POSTS = [
  {
    slug: "ai-route-optimization-explained",
    title: "How AI route optimization actually cuts freight costs",
    category: "Technology",
    date: "2026-06-28",
    excerpt: "Vehicle routing is a solved mathematical problem — most fleets just don't use the solution. Here's what changes when you do.",
    body: "Vehicle routing is one of the oldest problems in operations research, and one of the most expensive to ignore. When dispatch decisions are made by phone calls and intuition, trucks run under-filled, routes overlap, and urgent shipments wait for the wrong vehicle.\n\nAt NKP we treat every dispatch batch as a solvable problem: pending shipments, vehicle capacities and driver hours go in; an assignment plan comes out. The result is measured, not promised — fewer empty kilometres per lane, higher fill rates, and delivery windows that hold.\n\nThe same engine re-plans when reality changes: a breakdown, a cancelled pickup, a priority order. That's the difference between software that reports problems and software that absorbs them.",
  },
  {
    slug: "dpdp-act-logistics-data",
    title: "What the DPDP Act means for your shipment data",
    category: "Compliance",
    date: "2026-06-10",
    excerpt: "India's data protection law applies to logistics more than most shippers realize. A practical guide.",
    body: "The Digital Personal Data Protection Act 2023 covers consignee names, phone numbers and addresses — data that flows through every shipping label in India.\n\nFor shippers, the practical questions are: who can see delivery contact details, how long are they retained, and can they be deleted on request? We built NKP's platform around those answers: driver-to-customer calls run through masked numbers, public tracking pages never expose contact details, and PII retention follows a published policy with right-to-delete support.\n\nIf your current logistics partner emails spreadsheets of consignee phone numbers, that's a compliance gap you're carrying.",
  },
  {
    slug: "reducing-failed-deliveries",
    title: "Failed deliveries are a data problem, not a driver problem",
    category: "Operations",
    date: "2026-05-22",
    excerpt: "Most failed delivery attempts are predictable hours in advance. The signals are already in your data.",
    body: "A failed delivery costs twice: the wasted attempt and the re-attempt. Analysis across our network shows most failures cluster around predictable signals — consignee unreachable on past deliveries, address mismatches, delivery windows that conflict with business hours.\n\nOur delay and risk models score every in-transit shipment against these signals and surface the risky ones to operations before the truck arrives. A two-minute proactive call converts most would-be failures into successful first attempts.\n\nOn-time percentage is a lagging indicator. Risk flags are a leading one.",
  },
];

export const CASE_STUDIES = [
  {
    slug: "electronics-distributor",
    client: "National electronics distributor",
    industry: "Distribution",
    challenge: "Store replenishment across 340 outlets was running at 82% on-time, with no visibility between dispatch and delivery.",
    solution: "Dedicated contract fleet on core lanes, AI route planning for multi-drop runs, and live tracking shared directly with store managers.",
    results: [
      { metric: "On-time delivery", value: "82% → 97%" },
      { metric: "Freight cost per drop", value: "−18%" },
      { metric: "WISMO support calls", value: "−60%" },
    ],
  },
  {
    slug: "pharma-manufacturer",
    client: "Pharmaceutical manufacturer",
    industry: "Manufacturing",
    challenge: "Temperature-sensitive shipments needed audit-ready handling and proactive delay management on long lanes.",
    solution: "Cold-chain capable vehicles, AI delay prediction with automatic escalation, and POD documents captured digitally with timestamps.",
    results: [
      { metric: "Spoilage incidents", value: "0 in 12 months" },
      { metric: "Delay escalations caught pre-breach", value: "94%" },
      { metric: "Audit prep time", value: "days → hours" },
    ],
  },
  {
    slug: "d2c-brand",
    client: "D2C home & kitchen brand",
    industry: "E-commerce",
    challenge: "Returns were taking 3+ weeks to re-enter sellable inventory, locking up working capital.",
    solution: "Reverse logistics program with in-warehouse grading, refurbishment routing and weekly consolidated returns lanes.",
    results: [
      { metric: "Return-to-shelf time", value: "21 days → 6 days" },
      { metric: "Recovered inventory value", value: "+₹1.8 Cr/yr" },
      { metric: "Return freight cost", value: "−31%" },
    ],
  },
];
