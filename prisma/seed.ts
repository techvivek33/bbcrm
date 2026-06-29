/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const prisma = new PrismaClient();

// Password hashing (must match lib/auth.ts format: "salt:hash").
const DEMO_PW = process.env.DEMO_PASSWORD ?? "agency123";
function hashPw(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}
const PW = hashPw(DEMO_PW);

// --- date helpers (relative to "now" so the demo always looks current) ------
const now = new Date();
const day = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(now.getTime() + n * day);
const daysAgo = (n: number) => new Date(now.getTime() - n * day);
const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

const json = (v: unknown) => JSON.stringify(v);

async function clear() {
  // Delete in FK-safe order.
  await prisma.proposalCreator.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.contentReview.deleteMany();
  await prisma.contentSubmission.deleteMany();
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.campaignCreator.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.creatorDocument.deleteMany();
  await prisma.socialProfile.deleteMany();
  await prisma.knowledgeAsset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.brand.deleteMany();
}

async function main() {
  console.log("Clearing existing data…");
  await clear();

  // ---- TEAM -----------------------------------------------------------------
  console.log("Seeding team…");
  const [admin, cm, tm, finance] = await Promise.all([
    prisma.user.create({
      data: { name: "Hetal Shah", email: "hetalshahmd@gmail.com", role: "ADMIN", title: "Founder & CEO", avatarColor: "#6366f1", passwordHash: PW },
    }),
    prisma.user.create({
      data: { name: "Aarav Mehta", email: "aarav@agency.os", role: "CAMPAIGN_MANAGER", title: "Sr. Campaign Manager", avatarColor: "#0ea5e9", passwordHash: PW },
    }),
    prisma.user.create({
      data: { name: "Sneha Patel", email: "sneha@agency.os", role: "TALENT_MANAGER", title: "Talent Lead", avatarColor: "#f59e0b", passwordHash: PW },
    }),
    prisma.user.create({
      data: { name: "Vikram Rao", email: "vikram@agency.os", role: "FINANCE", title: "Finance Manager", avatarColor: "#22c55e", passwordHash: PW },
    }),
  ]);

  // ---- BRANDS ---------------------------------------------------------------
  console.log("Seeding brands…");
  const brandsData = [
    {
      companyName: "Zepto", industry: "Q-Commerce", website: "zepto.com", logoColor: "#7c3aed",
      contactPerson: "Karan Bhatia", designation: "Marketing Head", email: "karan@zepto.com", phone: "+91 98200 11223",
      linkedin: "linkedin.com/in/karanbhatia", preferredCategories: json(["Comedy", "Lifestyle", "Food"]),
      budgetRangeMin: 500000, budgetRangeMax: 2500000, paymentTerms: "Net 30", status: "ACTIVE",
      notes: "Prefers premium creators. Fast approvals. Quarterly retainer discussions ongoing.",
    },
    {
      companyName: "boAt", industry: "Consumer Electronics", website: "boat-lifestyle.com", logoColor: "#ef4444",
      contactPerson: "Riya Kapoor", designation: "Brand Manager", email: "riya@boat-lifestyle.com", phone: "+91 99300 44556",
      linkedin: "linkedin.com/in/riyakapoor", preferredCategories: json(["Tech", "Gaming", "Lifestyle"]),
      budgetRangeMin: 300000, budgetRangeMax: 1500000, paymentTerms: "Net 45", status: "ACTIVE",
      notes: "Loves unboxing + gaming creators. Wants strong CTR reporting.",
    },
    {
      companyName: "Groww", industry: "Fintech", website: "groww.in", logoColor: "#16a34a",
      contactPerson: "Aditya Nair", designation: "Growth Lead", email: "aditya@groww.in", phone: "+91 90040 77889",
      linkedin: "linkedin.com/in/adityanair", preferredCategories: json(["Finance", "Education", "Tech"]),
      budgetRangeMin: 400000, budgetRangeMax: 1800000, paymentTerms: "Net 30", status: "ACTIVE",
      notes: "Compliance-sensitive. All finance content needs disclaimers.",
    },
    {
      companyName: "Mamaearth", industry: "FMCG / Beauty", website: "mamaearth.in", logoColor: "#f97316",
      contactPerson: "Pooja Sharma", designation: "Influencer Marketing Manager", email: "pooja@mamaearth.in", phone: "+91 98765 12345",
      linkedin: "linkedin.com/in/poojasharma", preferredCategories: json(["Beauty", "Lifestyle", "Fashion"]),
      budgetRangeMin: 250000, budgetRangeMax: 1200000, paymentTerms: "Net 60", status: "LEAD",
      notes: "Inbound lead via referral. First proposal shared, awaiting feedback.",
    },
    {
      companyName: "CRED", industry: "Fintech", website: "cred.club", logoColor: "#111827",
      contactPerson: "Neha Joshi", designation: "Creative Partnerships", email: "neha@cred.club", phone: "+91 95550 66778",
      linkedin: "linkedin.com/in/nehajoshi", preferredCategories: json(["Comedy", "Tech", "Finance"]),
      budgetRangeMin: 800000, budgetRangeMax: 4000000, paymentTerms: "Net 30", status: "ACTIVE",
      notes: "High budget, very particular about creative quality and humour.",
    },
    {
      companyName: "Nykaa", industry: "Beauty E-commerce", website: "nykaa.com", logoColor: "#db2777",
      contactPerson: "Ishita Verma", designation: "Senior Marketing Manager", email: "ishita@nykaa.com", phone: "+91 93000 22110",
      linkedin: "linkedin.com/in/ishitaverma", preferredCategories: json(["Beauty", "Fashion", "Lifestyle"]),
      budgetRangeMin: 350000, budgetRangeMax: 2000000, paymentTerms: "Net 45", status: "DORMANT",
      notes: "Worked on Diwali campaign last year. Re-engage for festive 2026.",
    },
  ];
  const brands: Awaited<ReturnType<typeof prisma.brand.create>>[] = [];
  for (const b of brandsData) brands.push(await prisma.brand.create({ data: b }));
  const [zepto, boat, groww, mamaearth, cred] = brands;

  // brand activity timelines
  console.log("Seeding brand timelines…");
  const brandActivities = [
    { brandId: zepto.id, type: "MEETING", title: "Kickoff call for Q3 campaign", body: "Discussed deliverables and target cities.", occurredAt: daysAgo(40), userId: cm.id },
    { brandId: zepto.id, type: "PROPOSAL", title: "Shared creator shortlist + budget", body: "12 creators, ₹18L plan.", occurredAt: daysAgo(35), userId: cm.id },
    { brandId: zepto.id, type: "CAMPAIGN_LAUNCH", title: "Monsoon Cravings campaign launched", occurredAt: daysAgo(20), userId: cm.id },
    { brandId: zepto.id, type: "PAYMENT", title: "Received advance ₹9L", occurredAt: daysAgo(18), userId: finance.id },
    { brandId: boat.id, type: "EMAIL", title: "Sent reporting deck for Airdopes launch", occurredAt: daysAgo(6), userId: cm.id },
    { brandId: boat.id, type: "CALL", title: "Negotiated rates for gaming creators", occurredAt: daysAgo(12), userId: cm.id },
    { brandId: groww.id, type: "MEETING", title: "Compliance walkthrough", body: "Aligned on SEBI disclaimers for all posts.", occurredAt: daysAgo(9), userId: cm.id },
    { brandId: mamaearth.id, type: "PROPOSAL", title: "First proposal shared", body: "Beauty creator mix, ₹8L plan.", occurredAt: daysAgo(3), userId: cm.id },
    { brandId: cred.id, type: "MEETING", title: "Creative review of comedy scripts", occurredAt: daysAgo(2), userId: cm.id },
  ];
  await prisma.activity.createMany({ data: brandActivities });
  await prisma.note.createMany({
    data: [
      { brandId: zepto.id, body: "Karan prefers WhatsApp for quick approvals but wants everything documented here.", pinned: true, authorId: cm.id },
      { brandId: cred.id, body: "Do NOT send mid-tier creators — they only want top-tier comedy talent.", pinned: true, authorId: admin.id },
      { brandId: groww.id, body: "Every finance post must carry: 'Investments are subject to market risks.'", pinned: true, authorId: cm.id },
    ],
  });

  // ---- CREATORS -------------------------------------------------------------
  console.log("Seeding creators…");
  type CSeed = {
    name: string; email: string; phone: string; city: string; state: string; gender: string;
    languages: string[]; categories: string[]; followers: number; avgViews: number; er: number;
    basePrice: number; status: string; gstStatus: string; rating: number; createdAt?: Date;
    socials: { platform: string; handle: string; followers: number; avgViews: number; er: number }[];
    avatarColor: string;
  };
  const creatorSeeds: CSeed[] = [
    {
      name: "Tanmay Bhat", email: "tanmay@talent.in", phone: "+91 90000 10001", city: "Mumbai", state: "Maharashtra",
      gender: "MALE", languages: ["Hindi", "English"], categories: ["Comedy", "Gaming"], followers: 4200000, avgViews: 850000, er: 6.8,
      basePrice: 800000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.9, avatarColor: "#6366f1",
      socials: [{ platform: "YOUTUBE", handle: "@tanmaybhat", followers: 4200000, avgViews: 850000, er: 6.8 }, { platform: "INSTAGRAM", handle: "@tanmaybhat", followers: 3100000, avgViews: 420000, er: 5.1 }],
    },
    {
      name: "Kusha Kapila", email: "kusha@talent.in", phone: "+91 90000 10002", city: "Delhi", state: "Delhi",
      gender: "FEMALE", languages: ["Hindi", "English"], categories: ["Comedy", "Fashion", "Lifestyle"], followers: 3600000, avgViews: 600000, er: 7.2,
      basePrice: 600000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.8, avatarColor: "#db2777",
      socials: [{ platform: "INSTAGRAM", handle: "@kushakapila", followers: 3600000, avgViews: 600000, er: 7.2 }],
    },
    {
      name: "Mortal (Naman Mathur)", email: "mortal@talent.in", phone: "+91 90000 10003", city: "Mumbai", state: "Maharashtra",
      gender: "MALE", languages: ["Hindi"], categories: ["Gaming", "Tech"], followers: 7000000, avgViews: 1100000, er: 8.4,
      basePrice: 700000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.7, avatarColor: "#ef4444",
      socials: [{ platform: "YOUTUBE", handle: "@MortaLYT", followers: 7000000, avgViews: 1100000, er: 8.4 }, { platform: "INSTAGRAM", handle: "@ig_mortal", followers: 2400000, avgViews: 300000, er: 6.0 }],
    },
    {
      name: "Ankur Warikoo", email: "warikoo@talent.in", phone: "+91 90000 10004", city: "Delhi", state: "Delhi",
      gender: "MALE", languages: ["Hindi", "English"], categories: ["Finance", "Education", "Tech"], followers: 3900000, avgViews: 500000, er: 5.6,
      basePrice: 550000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.9, avatarColor: "#16a34a",
      socials: [{ platform: "INSTAGRAM", handle: "@ankurwarikoo", followers: 3900000, avgViews: 500000, er: 5.6 }, { platform: "YOUTUBE", handle: "@warikoo", followers: 3500000, avgViews: 450000, er: 4.8 }],
    },
    {
      name: "Komal Pandey", email: "komal@talent.in", phone: "+91 90000 10005", city: "Mumbai", state: "Maharashtra",
      gender: "FEMALE", languages: ["Hindi", "English"], categories: ["Fashion", "Beauty", "Lifestyle"], followers: 2100000, avgViews: 380000, er: 6.9,
      basePrice: 450000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.6, avatarColor: "#f97316",
      socials: [{ platform: "INSTAGRAM", handle: "@komalpandeyofficial", followers: 2100000, avgViews: 380000, er: 6.9 }],
    },
    {
      name: "Technical Guruji", email: "guruji@talent.in", phone: "+91 90000 10006", city: "Dubai", state: "—",
      gender: "MALE", languages: ["Hindi"], categories: ["Tech"], followers: 23000000, avgViews: 700000, er: 3.2,
      basePrice: 900000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.4, avatarColor: "#0ea5e9",
      socials: [{ platform: "YOUTUBE", handle: "@TechnicalGuruji", followers: 23000000, avgViews: 700000, er: 3.2 }],
    },
    {
      name: "Dolly Singh", email: "dolly@talent.in", phone: "+91 90000 10007", city: "Delhi", state: "Delhi",
      gender: "FEMALE", languages: ["Hindi", "English"], categories: ["Comedy", "Fashion"], followers: 1700000, avgViews: 280000, er: 7.5,
      basePrice: 350000, status: "APPROVED", gstStatus: "UNREGISTERED", rating: 4.5, avatarColor: "#8b5cf6",
      socials: [{ platform: "INSTAGRAM", handle: "@dollysingh", followers: 1700000, avgViews: 280000, er: 7.5 }],
    },
    {
      name: "Sourav Joshi", email: "sourav@talent.in", phone: "+91 90000 10008", city: "Haldwani", state: "Uttarakhand",
      gender: "MALE", languages: ["Hindi"], categories: ["Lifestyle", "Comedy"], followers: 27000000, avgViews: 4000000, er: 9.1,
      basePrice: 750000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.8, avatarColor: "#eab308",
      socials: [{ platform: "YOUTUBE", handle: "@souravjoshivlogs", followers: 27000000, avgViews: 4000000, er: 9.1 }, { platform: "INSTAGRAM", handle: "@souravjoshi", followers: 8000000, avgViews: 900000, er: 7.0 }],
    },
    {
      name: "CarryMinati", email: "carry@talent.in", phone: "+91 90000 10009", city: "Faridabad", state: "Haryana",
      gender: "MALE", languages: ["Hindi"], categories: ["Comedy", "Gaming"], followers: 40000000, avgViews: 8000000, er: 10.2,
      basePrice: 1500000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.9, avatarColor: "#dc2626",
      socials: [{ platform: "YOUTUBE", handle: "@CarryMinati", followers: 40000000, avgViews: 8000000, er: 10.2 }],
    },
    {
      name: "Prajakta Koli", email: "prajakta@talent.in", phone: "+91 90000 10010", city: "Mumbai", state: "Maharashtra",
      gender: "FEMALE", languages: ["Hindi", "English", "Marathi"], categories: ["Comedy", "Lifestyle"], followers: 7100000, avgViews: 950000, er: 6.4,
      basePrice: 650000, status: "APPROVED", gstStatus: "REGISTERED", rating: 4.7, avatarColor: "#ec4899",
      socials: [{ platform: "INSTAGRAM", handle: "@mostlysane", followers: 7100000, avgViews: 950000, er: 6.4 }, { platform: "YOUTUBE", handle: "@MostlySane", followers: 7300000, avgViews: 600000, er: 4.9 }],
    },
    // Newer / pipeline creators (onboarded this month + pending verification)
    {
      name: "Rohan Cariappa", email: "rohan.c@talent.in", phone: "+91 90000 10011", city: "Bengaluru", state: "Karnataka",
      gender: "MALE", languages: ["English", "Kannada"], categories: ["Tech", "Gaming"], followers: 320000, avgViews: 65000, er: 8.9,
      basePrice: 90000, status: "IN_VERIFICATION", gstStatus: "UNREGISTERED", rating: 4.2, avatarColor: "#14b8a6",
      createdAt: daysAgo(8),
      socials: [{ platform: "INSTAGRAM", handle: "@rohancariappa", followers: 320000, avgViews: 65000, er: 8.9 }, { platform: "YOUTUBE", handle: "@rohanplays", followers: 180000, avgViews: 40000, er: 7.0 }],
    },
    {
      name: "Anjali Reddy", email: "anjali.r@talent.in", phone: "+91 90000 10012", city: "Hyderabad", state: "Telangana",
      gender: "FEMALE", languages: ["Telugu", "Hindi", "English"], categories: ["Regional", "Food", "Lifestyle"], followers: 540000, avgViews: 120000, er: 9.6,
      basePrice: 120000, status: "IN_VERIFICATION", gstStatus: "UNREGISTERED", rating: 4.3, avatarColor: "#a855f7",
      createdAt: daysAgo(4),
      socials: [{ platform: "INSTAGRAM", handle: "@anjalieats", followers: 540000, avgViews: 120000, er: 9.6 }],
    },
    {
      name: "Faizan Ansari", email: "faizan.a@talent.in", phone: "+91 90000 10013", city: "Lucknow", state: "Uttar Pradesh",
      gender: "MALE", languages: ["Hindi", "Urdu"], categories: ["Comedy", "Regional"], followers: 210000, avgViews: 95000, er: 11.2,
      basePrice: 60000, status: "PENDING", gstStatus: "NA", rating: 0, avatarColor: "#f43f5e",
      createdAt: daysAgo(1),
      socials: [{ platform: "MOJ", handle: "@faizancomedy", followers: 210000, avgViews: 95000, er: 11.2 }, { platform: "INSTAGRAM", handle: "@faizanansari", followers: 88000, avgViews: 22000, er: 8.0 }],
    },
    {
      name: "Meghna Iyer", email: "meghna.i@talent.in", phone: "+91 90000 10014", city: "Chennai", state: "Tamil Nadu",
      gender: "FEMALE", languages: ["Tamil", "English"], categories: ["Fitness", "Lifestyle"], followers: 430000, avgViews: 70000, er: 7.8,
      basePrice: 110000, status: "PENDING", gstStatus: "NA", rating: 0, avatarColor: "#06b6d4",
      createdAt: startOfThisMonth,
      socials: [{ platform: "INSTAGRAM", handle: "@meghnafit", followers: 430000, avgViews: 70000, er: 7.8 }],
    },
  ];

  const creators: Awaited<ReturnType<typeof prisma.creator.create>>[] = [];
  for (const c of creatorSeeds) {
    const created = await prisma.creator.create({
      data: {
        name: c.name, email: c.email, phone: c.phone, city: c.city, state: c.state, location: `${c.city}, ${c.state}`,
        gender: c.gender, languages: json(c.languages), categories: json(c.categories),
        totalFollowers: c.followers, avgViews: c.avgViews, engagementRate: c.er, basePrice: c.basePrice,
        priceList: json({ reel: c.basePrice, story: Math.round(c.basePrice * 0.4), video: Math.round(c.basePrice * 1.6), post: Math.round(c.basePrice * 0.8) }),
        status: c.status, gstStatus: c.gstStatus, internalRating: c.rating || null, avatarColor: c.avatarColor,
        onboardingStep: c.status === "APPROVED" ? 4 : c.status === "IN_VERIFICATION" ? 3 : 1,
        panNumber: c.gstStatus !== "NA" ? "ABCDE1234F" : null,
        gstNumber: c.gstStatus === "REGISTERED" ? "27ABCDE1234F1Z5" : null,
        bankName: c.status === "APPROVED" ? "HDFC Bank" : null,
        bankAccount: c.status === "APPROVED" ? "5012•••••3401" : null,
        bankIfsc: c.status === "APPROVED" ? "HDFC0000123" : null,
        managerName: c.followers > 2000000 ? "Talent House Agency" : null,
        createdAt: c.createdAt ?? daysAgo(60 + Math.floor(c.followers / 1_000_000)),
        socials: { create: c.socials.map((s) => ({ platform: s.platform, handle: s.handle, url: `https://${s.platform.toLowerCase()}.com/${s.handle.replace("@", "")}`, followers: s.followers, avgViews: s.avgViews, engagementRate: s.er })) },
        documents: c.status === "APPROVED" ? {
          create: [
            { type: "PAN", name: "PAN Card.pdf", verified: true },
            { type: "GST", name: "GST Certificate.pdf", verified: c.gstStatus === "REGISTERED" },
            { type: "BANK", name: "Cancelled Cheque.pdf", verified: true },
            { type: "AGREEMENT", name: "Master Service Agreement.pdf", verified: true },
          ],
        } : c.status === "IN_VERIFICATION" ? {
          create: [
            { type: "PAN", name: "PAN Card.pdf", verified: false },
            { type: "BANK", name: "Bank Details.pdf", verified: false },
          ],
        } : undefined,
      },
    });
    creators.push(created);
  }
  const byName = (n: string) => creators.find((c) => c.name.startsWith(n))!;

  // creator notes + activities
  await prisma.note.createMany({
    data: [
      { creatorId: byName("Mortal").id, body: "Delivers great content but tends to post 1–2 days late. Build buffer into timelines.", pinned: true, authorId: tm.id },
      { creatorId: byName("CarryMinati").id, body: "Books out 6–8 weeks ahead. Lock dates early.", pinned: true, authorId: tm.id },
      { creatorId: byName("Komal").id, body: "Excellent for beauty/fashion; very professional on shoots.", pinned: false, authorId: tm.id },
    ],
  });
  await prisma.activity.createMany({
    data: [
      { creatorId: byName("Tanmay").id, type: "CALL", title: "Discussed Zepto comedy brief", occurredAt: daysAgo(22), userId: tm.id },
      { creatorId: byName("Mortal").id, type: "WHATSAPP", title: "Confirmed availability for boAt gaming push", occurredAt: daysAgo(14), userId: tm.id },
      { creatorId: byName("Ankur").id, type: "EMAIL", title: "Sent Groww compliance guidelines", occurredAt: daysAgo(8), userId: cm.id },
      { creatorId: byName("Rohan").id, type: "MEETING", title: "Onboarding verification call", occurredAt: daysAgo(7), userId: tm.id },
    ],
  });

  // ---- PORTAL LOGINS (Module 19) -------------------------------------------
  console.log("Seeding portal accounts…");
  await prisma.user.create({
    data: { name: "Karan Bhatia", email: "karan@zepto.com", role: "BRAND_POC", title: "Marketing Head, Zepto", avatarColor: "#7c3aed", passwordHash: PW, brandId: zepto.id },
  });
  await prisma.user.create({
    data: { name: byName("Tanmay").name, email: "tanmay@creator.os", role: "CREATOR", title: "Creator", avatarColor: byName("Tanmay").avatarColor, passwordHash: PW, creatorId: byName("Tanmay").id },
  });

  // ---- CAMPAIGNS ------------------------------------------------------------
  console.log("Seeding campaigns…");
  // 1) Zepto — active, content production
  const c1 = await prisma.campaign.create({
    data: {
      name: "Zepto Monsoon Cravings", brandId: zepto.id, budget: 1800000, platform: "INSTAGRAM",
      targetAudience: "18–34, Tier-1 metros, food & convenience", creatorRequirement: "6 comedy/food creators, 1 reel each + 2 stories",
      description: "Drive 10-min grocery delivery awareness around monsoon snacking moments.",
      stage: "CONTENT_PRODUCTION", startDate: daysAgo(20), endDate: daysFromNow(15),
      reach: 4200000, impressions: 6800000, views: 3100000, engagement: 280000,
    },
  });
  // 2) boAt — posting
  const c2 = await prisma.campaign.create({
    data: {
      name: "boAt Airdopes Launch", brandId: boat.id, budget: 1200000, platform: "MULTI",
      targetAudience: "16–28, gamers & tech enthusiasts", creatorRequirement: "Gaming + tech creators, unboxing video + reel",
      description: "Launch hype for new Airdopes with unboxing and gaming sessions.",
      stage: "POSTING", startDate: daysAgo(12), endDate: daysFromNow(8),
      reach: 2800000, impressions: 4100000, views: 1900000, engagement: 165000,
    },
  });
  // 3) Groww — brand approval
  const c3 = await prisma.campaign.create({
    data: {
      name: "Groww SIP Awareness", brandId: groww.id, budget: 900000, platform: "MULTI",
      targetAudience: "25–40, first-time investors", creatorRequirement: "Finance educators, explainer video + carousel",
      description: "Educate young professionals on starting SIPs. SEBI disclaimers mandatory.",
      stage: "BRAND_APPROVAL", startDate: daysFromNow(3), endDate: daysFromNow(40),
    },
  });
  // 4) CRED — creator selection
  const c4 = await prisma.campaign.create({
    data: {
      name: "CRED Garage Comedy Series", brandId: cred.id, budget: 3200000, platform: "INSTAGRAM",
      targetAudience: "25–40, premium credit card users", creatorRequirement: "Top-tier comedy creators, 3-part skit series",
      description: "High-production comedy series featuring CRED Garage.",
      stage: "CREATOR_SELECTION", startDate: daysFromNow(10), endDate: daysFromNow(50),
    },
  });
  // 5) Mamaearth — draft
  const c5 = await prisma.campaign.create({
    data: {
      name: "Mamaearth Ubtan Range", brandId: mamaearth.id, budget: 750000, platform: "INSTAGRAM",
      targetAudience: "20–35, skincare buyers", creatorRequirement: "Beauty creators, GRWM reels",
      description: "Promote new ubtan face wash range with GRWM content.",
      stage: "DRAFT", startDate: daysFromNow(20), endDate: daysFromNow(55),
    },
  });
  // 6) boAt — completed (for revenue + reporting)
  const c6 = await prisma.campaign.create({
    data: {
      name: "boAt Republic Day Sale", brandId: boat.id, budget: 950000, platform: "MULTI",
      targetAudience: "18–30, value shoppers", creatorRequirement: "Tech + lifestyle creators",
      description: "Republic Day sale push. Closed and reported.",
      stage: "COMPLETED", startDate: daysAgo(150), endDate: daysAgo(120),
      reach: 3500000, impressions: 5200000, views: 2400000, engagement: 210000,
    },
  });

  // campaign creators
  console.log("Seeding campaign rosters, deliverables, approvals…");
  const cc = async (campaignId: string, creatorName: string, status: string, amount: number) =>
    prisma.campaignCreator.create({ data: { campaignId, creatorId: byName(creatorName).id, status, agreedAmount: amount } });

  await cc(c1.id, "Tanmay", "ACTIVE", 700000);
  await cc(c1.id, "Dolly", "ACTIVE", 300000);
  await cc(c1.id, "Prajakta", "ACTIVE", 600000);
  await cc(c2.id, "Mortal", "ACTIVE", 600000);
  await cc(c2.id, "Technical", "ACTIVE", 500000);
  await cc(c3.id, "Ankur", "APPROVED", 550000);
  await cc(c4.id, "CarryMinati", "PROPOSED", 1500000);
  await cc(c4.id, "Tanmay", "SHORTLISTED", 800000);
  await cc(c4.id, "Kusha", "SHORTLISTED", 600000);
  await cc(c5.id, "Komal", "SHORTLISTED", 450000);
  await cc(c6.id, "Technical", "COMPLETED", 450000);
  await cc(c6.id, "Mortal", "COMPLETED", 500000);

  // deliverables (with approval-workflow states)
  const d1 = await prisma.deliverable.create({
    data: { campaignId: c1.id, creatorId: byName("Tanmay").id, type: "REEL", title: "Monsoon snack skit reel", status: "BRAND_REVIEW", dueDate: daysFromNow(2) },
  });
  const d2 = await prisma.deliverable.create({
    data: { campaignId: c1.id, creatorId: byName("Dolly").id, type: "REEL", title: "Rainy day cravings reel", status: "INTERNAL_REVIEW", dueDate: daysFromNow(4) },
  });
  const d3 = await prisma.deliverable.create({
    data: { campaignId: c1.id, creatorId: byName("Prajakta").id, type: "STORY", title: "Behind the scenes stories", status: "PENDING", dueDate: daysFromNow(6) },
  });
  const d4 = await prisma.deliverable.create({
    data: { campaignId: c2.id, creatorId: byName("Mortal").id, type: "VIDEO", title: "Airdopes gaming session", status: "POSTED", dueDate: daysAgo(3), postedUrl: "https://youtube.com/watch?v=demo", postedAt: daysAgo(2), views: 1200000, likes: 98000, comments: 4200, shares: 6100, reach: 1800000, impressions: 2600000 },
  });
  const d5 = await prisma.deliverable.create({
    data: { campaignId: c2.id, creatorId: byName("Technical").id, type: "VIDEO", title: "Airdopes unboxing & review", status: "REVISION", dueDate: daysAgo(1) },
  });
  // overdue example
  await prisma.deliverable.create({
    data: { campaignId: c1.id, creatorId: byName("Prajakta").id, type: "REEL", title: "Recipe collab reel", status: "PENDING", dueDate: daysAgo(2) },
  });

  // content submissions + reviews (version control demo)
  const sub1 = await prisma.contentSubmission.create({
    data: { deliverableId: d1.id, version: 1, caption: "When the rain hits and Zepto saves the evening 🌧️🍿", status: "REVISION_REQUESTED", submittedAt: daysAgo(5), thumbnailUrl: null },
  });
  await prisma.contentReview.create({ data: { submissionId: sub1.id, reviewerId: cm.id, side: "INTERNAL", decision: "REVISION", comment: "Great energy! Trim the intro to 3s and add product shot earlier.", createdAt: daysAgo(4) } });
  const sub2 = await prisma.contentSubmission.create({
    data: { deliverableId: d1.id, version: 2, caption: "When the rain hits and Zepto saves the evening 🌧️🍿 #ad", status: "BRAND_APPROVED", submittedAt: daysAgo(3) },
  });
  await prisma.contentReview.create({ data: { submissionId: sub2.id, reviewerId: cm.id, side: "INTERNAL", decision: "APPROVED", comment: "Perfect, sending to brand.", createdAt: daysAgo(3) } });
  await prisma.contentReview.create({ data: { submissionId: sub2.id, reviewerId: admin.id, side: "BRAND", decision: "APPROVED", comment: "Love it. Approved for posting!", createdAt: daysAgo(2) } });
  const sub3 = await prisma.contentSubmission.create({
    data: { deliverableId: d2.id, version: 1, caption: "POV: it's pouring and your snack stash is empty", status: "PENDING_REVIEW", submittedAt: daysAgo(1) },
  });
  const sub5 = await prisma.contentSubmission.create({
    data: { deliverableId: d5.id, version: 1, caption: "Airdopes unboxing — are these worth it?", status: "REVISION_REQUESTED", submittedAt: daysAgo(2) },
  });
  await prisma.contentReview.create({ data: { submissionId: sub5.id, reviewerId: cm.id, side: "INTERNAL", decision: "REVISION", comment: "Audio levels low in the mid-section. Re-export please.", createdAt: daysAgo(1) } });

  // ---- TASKS ----------------------------------------------------------------
  console.log("Seeding tasks…");
  await prisma.task.createMany({
    data: [
      { title: "Send CRED comedy creator shortlist", type: "OUTREACH", status: "IN_PROGRESS", priority: "HIGH", dueDate: daysFromNow(1), campaignId: c4.id, assigneeId: tm.id },
      { title: "Negotiate CarryMinati rate for CRED", type: "NEGOTIATION", status: "WAITING_APPROVAL", priority: "URGENT", dueDate: daysFromNow(2), campaignId: c4.id, assigneeId: tm.id },
      { title: "Review Tanmay reel v2 (Zepto)", type: "CONTENT_APPROVAL", status: "COMPLETED", priority: "HIGH", dueDate: daysAgo(2), completedAt: daysAgo(2), campaignId: c1.id, deliverableId: d1.id, assigneeId: cm.id },
      { title: "Collect revised unboxing from Technical Guruji", type: "CONTENT_SUBMISSION", status: "OVERDUE", priority: "HIGH", dueDate: daysAgo(1), campaignId: c2.id, deliverableId: d5.id, assigneeId: cm.id },
      { title: "Sign SOW with Groww", type: "CONTRACT", status: "PENDING", priority: "MEDIUM", dueDate: daysFromNow(3), campaignId: c3.id, assigneeId: cm.id },
      { title: "Raise invoice for boAt Airdopes advance", type: "INVOICE", status: "PENDING", priority: "MEDIUM", dueDate: daysFromNow(2), campaignId: c2.id, assigneeId: finance.id },
      { title: "Follow up Mamaearth on proposal", type: "FOLLOW_UP", status: "PENDING", priority: "MEDIUM", dueDate: daysFromNow(1), assigneeId: cm.id },
      { title: "Verify Rohan Cariappa KYC documents", type: "OTHER", status: "IN_PROGRESS", priority: "LOW", dueDate: daysFromNow(2), assigneeId: tm.id },
      { title: "Compile boAt Airdopes performance report", type: "REPORTING", status: "IN_PROGRESS", priority: "HIGH", dueDate: daysFromNow(4), campaignId: c2.id, assigneeId: cm.id },
      { title: "Post Prajakta BTS stories", type: "POSTING", status: "PENDING", priority: "MEDIUM", dueDate: daysFromNow(6), campaignId: c1.id, deliverableId: d3.id, assigneeId: cm.id },
    ],
  });

  // ---- PAYMENTS -------------------------------------------------------------
  console.log("Seeding payments & invoices…");
  // Brand receivables
  await prisma.payment.create({ data: { direction: "BRAND", brandId: zepto.id, campaignId: c1.id, status: "PARTIAL", agreedAmount: 1800000, advanceAmount: 900000, paidAmount: 900000, dueDate: daysFromNow(10), note: "50% advance received, balance on completion." } });
  await prisma.payment.create({ data: { direction: "BRAND", brandId: boat.id, campaignId: c2.id, status: "PENDING", agreedAmount: 1200000, advanceAmount: 0, paidAmount: 0, dueDate: daysFromNow(5), note: "Awaiting advance invoice approval." } });
  await prisma.payment.create({ data: { direction: "BRAND", brandId: boat.id, campaignId: c6.id, status: "PAID", agreedAmount: 950000, paidAmount: 950000, dueDate: daysAgo(110), paidDate: daysAgo(108) } });
  await prisma.payment.create({ data: { direction: "BRAND", brandId: cred.id, campaignId: c4.id, status: "PENDING", agreedAmount: 3200000, paidAmount: 0, dueDate: daysFromNow(25) } });
  await prisma.payment.create({ data: { direction: "BRAND", brandId: groww.id, campaignId: c3.id, status: "OVERDUE", agreedAmount: 450000, paidAmount: 0, dueDate: daysAgo(4), note: "Advance overdue — finance following up." } });

  // Creator payables
  await prisma.payment.create({ data: { direction: "CREATOR", creatorId: byName("Tanmay").id, campaignId: c1.id, status: "PARTIAL", agreedAmount: 700000, advanceAmount: 350000, paidAmount: 350000, dueDate: daysFromNow(12) } });
  await prisma.payment.create({ data: { direction: "CREATOR", creatorId: byName("Mortal").id, campaignId: c2.id, status: "PENDING", agreedAmount: 600000, paidAmount: 0, dueDate: daysFromNow(8) } });
  await prisma.payment.create({ data: { direction: "CREATOR", creatorId: byName("Technical").id, campaignId: c6.id, status: "PAID", agreedAmount: 450000, paidAmount: 450000, dueDate: daysAgo(100), paidDate: daysAgo(98) } });
  await prisma.payment.create({ data: { direction: "CREATOR", creatorId: byName("Dolly").id, campaignId: c1.id, status: "OVERDUE", agreedAmount: 300000, paidAmount: 0, dueDate: daysAgo(3), note: "Payout pending finance approval." } });

  // invoices
  await prisma.invoice.create({ data: { number: "INV-2026-0012", type: "BRAND", status: "PAID", brandId: boat.id, campaignId: c6.id, amount: 950000, taxRate: 18, taxAmount: 171000, total: 1121000, issuedDate: daysAgo(115), dueDate: daysAgo(100), items: json([{ desc: "Influencer campaign — Republic Day Sale", qty: 1, rate: 950000 }]) } });
  await prisma.invoice.create({ data: { number: "INV-2026-0013", type: "BRAND", status: "SENT", brandId: zepto.id, campaignId: c1.id, amount: 900000, taxRate: 18, taxAmount: 162000, total: 1062000, issuedDate: daysAgo(18), dueDate: daysFromNow(12), items: json([{ desc: "Monsoon Cravings — 50% advance", qty: 1, rate: 900000 }]) } });
  await prisma.invoice.create({ data: { number: "INV-2026-0014", type: "BRAND", status: "OVERDUE", brandId: groww.id, campaignId: c3.id, amount: 450000, taxRate: 18, taxAmount: 81000, total: 531000, issuedDate: daysAgo(20), dueDate: daysAgo(4), items: json([{ desc: "SIP Awareness — advance", qty: 1, rate: 450000 }]) } });

  // ---- CONTRACTS ------------------------------------------------------------
  console.log("Seeding contracts…");
  await prisma.contract.createMany({
    data: [
      { title: "Zepto x Agency — Campaign SOW", type: "SOW", status: "SIGNED", brandId: zepto.id, campaignId: c1.id, signedDate: daysAgo(25), expiryDate: daysFromNow(40) },
      { title: "boAt Master Services Agreement", type: "BRAND", status: "SIGNED", brandId: boat.id, signedDate: daysAgo(200), expiryDate: daysFromNow(160), renewalReminderDate: daysFromNow(130) },
      { title: "Groww SOW", type: "SOW", status: "SENT", brandId: groww.id, campaignId: c3.id },
      { title: "CarryMinati Creator Agreement (CRED)", type: "CREATOR", status: "DRAFT", creatorId: byName("CarryMinati").id, campaignId: c4.id },
      { title: "CRED NDA", type: "NDA", status: "SIGNED", brandId: cred.id, signedDate: daysAgo(15), expiryDate: daysFromNow(700) },
    ],
  });

  // ---- KNOWLEDGE CENTER -----------------------------------------------------
  console.log("Seeding knowledge center…");
  await prisma.knowledgeAsset.createMany({
    data: [
      { title: "Agency Media Kit 2026", category: "MEDIA_KIT", tags: json(["deck", "intro"]) },
      { title: "Standard Creator Agreement Template", category: "CONTRACT_TEMPLATE", tags: json(["legal", "creator"]) },
      { title: "Zepto Monsoon — Case Study", category: "CASE_STUDY", tags: json(["q-commerce", "comedy"]) },
      { title: "Influencer Rate Card (Internal)", category: "RATE_CARD", tags: json(["pricing"]) },
      { title: "Campaign Brief Template", category: "CAMPAIGN_TEMPLATE", tags: json(["ops"]) },
      { title: "Brand Pitch Deck — Fintech", category: "PITCH_DECK", tags: json(["sales", "finance"]) },
    ],
  });

  // ---- PROPOSALS (Module 9) ------------------------------------------------
  console.log("Seeding proposals…");
  const fit = (followers: number, er: number) => Math.min(99, Math.round(50 + er * 3 + Math.min(30, followers / 200000)));
  const mkItem = (name: string, deliverable: string) => {
    const cr = byName(name);
    return { creatorId: cr.id, proposedAmount: cr.basePrice ?? 0, deliverable, fitScore: fit(cr.totalFollowers, cr.engagementRate) };
  };
  await prisma.proposal.create({
    data: {
      title: "CRED — Comedy Creator Shortlist", brandId: cred.id, budget: 3200000, status: "SHARED",
      brief: "3-part premium comedy skit series featuring CRED Garage.", audience: "25–40, premium credit card users, Hindi + English",
      items: { create: [mkItem("CarryMinati", "1 YouTube integration"), mkItem("Tanmay", "1 Reel + 1 Story"), mkItem("Kusha", "1 Reel"), mkItem("Dolly", "1 Reel")] },
    },
  });
  await prisma.proposal.create({
    data: {
      title: "Mamaearth — Beauty GRWM Mix", brandId: mamaearth.id, budget: 750000, status: "DRAFT",
      brief: "GRWM reels promoting the new ubtan face wash range.", audience: "20–35, skincare buyers, Tier-1 & Tier-2",
      items: { create: [mkItem("Komal", "1 GRWM Reel + 2 Stories"), mkItem("Dolly", "1 Reel")] },
    },
  });

  console.log("✅ Seed complete.");
  const counts = {
    users: await prisma.user.count(),
    brands: await prisma.brand.count(),
    creators: await prisma.creator.count(),
    campaigns: await prisma.campaign.count(),
    deliverables: await prisma.deliverable.count(),
    tasks: await prisma.task.count(),
    payments: await prisma.payment.count(),
  };
  console.table(counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
