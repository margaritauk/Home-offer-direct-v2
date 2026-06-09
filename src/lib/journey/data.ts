import type { JourneyStage } from "./types";

/**
 * The canonical 14-stage HomeOffer Direct journey for buying a home without a
 * buyer's agent. Content is sourced from docs/research/market-research.md.
 */
export const stages: JourneyStage[] = [
  {
    slug: "get-ready",
    order: 1,
    title: "Get Ready",
    tagline: "Know your numbers before you fall in love with a house.",
    description:
      "Set a realistic budget, check your credit, and save for both the down payment and closing costs so you can shop with confidence.",
    icon: "🧮",
    timeline: "Weeks to months before you search",
    steps: [
      {
        slug: "build-your-budget",
        title: "Build a realistic budget",
        summary:
          "Figure out what you can comfortably afford, including the costs beyond the price tag.",
        timeline: "1–2 weeks",
        body: [
          "Start with the full picture, not just the sticker price. You'll need a down payment (the 2025–26 median is around 10%, the highest since 1989), plus closing costs that typically run 2–5% of the loan amount on top of that.",
          "Use a mortgage affordability calculator to model a monthly payment that includes principal, interest, property taxes, and homeowners insurance. Leave room in your budget for moving costs and a cash cushion for surprises after move-in.",
          "Going without a buyer's agent can save you roughly 2.5% of the purchase price, but only if you negotiate for it later. For now, budget as if you'll pay full price, then treat the savings as upside.",
        ],
        whyItMatters:
          "Knowing your true all-in number keeps you from over-stretching and lets you move fast and credibly when you find the right home.",
        withoutAnAgent:
          "An agent often runs affordability math and reality-checks your budget; on your own, lean on free calculators from lenders and trusted sites, and be honest about your reserves.",
        tasks: [
          {
            id: "pull-credit",
            label: "Pull your credit reports and scores",
            detail:
              "You can get free reports from all three bureaus at AnnualCreditReport.com. Dispute any errors early.",
          },
          {
            id: "calc-affordability",
            label: "Run an affordability calculator for a target monthly payment",
          },
          {
            id: "save-down-payment",
            label: "Set a down-payment savings target",
            detail: "Median down payment is currently around 10% of price.",
          },
          {
            id: "budget-closing-costs",
            label: "Budget 2–5% of the loan for closing costs",
            detail: "These are separate from your down payment.",
          },
          {
            id: "build-reserves",
            label: "Build a cash reserve for moving and post-move surprises",
            optional: true,
          },
        ],
        terms: ["down-payment", "closing-costs", "commission"],
        resources: [
          {
            label: "Bankrate — What are closing costs?",
            href: "https://www.bankrate.com/mortgages/what-are-closing-costs/",
            description: "Plain-English breakdown of typical buyer closing costs.",
          },
        ],
      },
      {
        slug: "strengthen-credit-and-savings",
        title: "Strengthen your credit and savings",
        summary:
          "Tidy up your credit and lock down the cash you'll need before you apply.",
        timeline: "Ongoing, weeks to months",
        body: [
          "Your credit score directly affects the rate you'll be offered, which affects your monthly payment for years. Pay down balances, keep cards open, and avoid new debt in the months before applying.",
          "Get your savings into the right shape too. Lenders like to see that your down payment and reserves have been in your account for a couple of months ('seasoned'), and large unexplained deposits can trigger extra paperwork.",
          "Set a clear savings target that covers the down payment plus 2–5% for closing costs, and keep a separate cushion for moving and the first few months of ownership.",
        ],
        whyItMatters:
          "A stronger credit profile and seasoned savings can mean a lower rate and a smoother loan approval later.",
        withoutAnAgent:
          "This step is entirely in your hands — start early so nothing surprises underwriting when it reviews your accounts later.",
        tasks: [
          {
            id: "pay-down-balances",
            label: "Pay down credit card balances to lower your utilization",
          },
          {
            id: "no-new-debt",
            label: "Avoid opening new credit or financing big purchases",
          },
          {
            id: "season-funds",
            label: "Keep your down-payment funds in place ('seasoned')",
            detail: "Lenders may ask about large or recent deposits.",
          },
          {
            id: "set-savings-target",
            label: "Set a combined down-payment + closing-cost savings target",
          },
        ],
        terms: ["down-payment", "closing-costs", "underwriting"],
      },
    ],
  },
  {
    slug: "get-pre-approved",
    order: 2,
    title: "Get Pre-Approved",
    tagline: "Turn your budget into a letter sellers take seriously.",
    description:
      "Compare a few lenders, then get a pre-approval letter that proves what you can borrow and signals you're a serious buyer.",
    icon: "📝",
    timeline: "Pre-approval in 1–3 days; shop lenders over 1–2 weeks",
    steps: [
      {
        slug: "shop-lenders-and-pre-approve",
        title: "Shop lenders and get pre-approved",
        summary:
          "Compare loan offers from several lenders and secure a pre-approval letter.",
        timeline: "1–2 weeks",
        body: [
          "Pre-approval is a lender's conditional commitment to lend you a specific amount after reviewing your income, assets, and credit. It sets your price range and tells sellers you're ready to perform.",
          "Apply with at least two or three lenders so you can compare rates and fees. After you apply, each lender gives you a Loan Estimate — a standardized form that makes offers easy to compare side by side. Average 30-year rates have hovered around 6.2%.",
          "Submitting multiple mortgage applications within a short window (typically 14–45 days) usually counts as a single credit inquiry, so shopping around won't meaningfully hurt your score.",
        ],
        whyItMatters:
          "A pre-approval letter is what makes your offer credible; without one, many sellers won't take you seriously.",
        withoutAnAgent:
          "A buyer's agent often refers you to lenders; on your own, contact lenders directly and compare their Loan Estimates line by line — you keep full control of who you choose.",
        tasks: [
          {
            id: "gather-docs",
            label: "Gather pay stubs, W-2s, and bank statements",
          },
          {
            id: "apply-multiple",
            label: "Apply with at least 2–3 lenders",
          },
          {
            id: "compare-le",
            label: "Compare Loan Estimates side by side",
            detail: "Focus on rate, monthly payment, and total fees, not just the rate.",
          },
          {
            id: "get-letter",
            label: "Get your pre-approval letter",
          },
          {
            id: "avoid-credit-changes",
            label: "Avoid new credit or big purchases until closing",
            detail: "New debt or job changes can jeopardize your loan later.",
          },
        ],
        terms: ["pre-approval", "loan-estimate"],
        resources: [
          {
            label: "Consumer Financial Protection Bureau — Loan Estimate explainer",
            href: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/",
            description: "How to read and compare Loan Estimates.",
          },
        ],
      },
      {
        slug: "choose-loan-type",
        title: "Choose the right loan type",
        summary:
          "Understand your loan options so your pre-approval matches the homes you'll target.",
        timeline: "1–2 days",
        body: [
          "Loan programs differ in down payment, mortgage insurance, and who qualifies. Conventional loans are common; FHA loans allow smaller down payments; VA and USDA loans help specific buyers with little or no down payment.",
          "Your loan choice affects your minimum down payment and your monthly cost, so it shapes your real price range. Ask each lender which programs you qualify for and how they compare on the Loan Estimate.",
          "Get clear on whether you want a fixed or adjustable rate, and how long you plan to stay in the home — that horizon should guide the choice.",
        ],
        whyItMatters:
          "Picking the right loan can lower your upfront cash and monthly payment — the wrong one can quietly cost you for years.",
        withoutAnAgent:
          "An agent might suggest a loan officer; on your own, ask each lender directly which programs fit you and compare the trade-offs yourself.",
        tasks: [
          {
            id: "review-programs",
            label: "Ask lenders which loan programs you qualify for",
            detail: "Conventional, FHA, VA, USDA — eligibility varies.",
          },
          {
            id: "fixed-vs-arm",
            label: "Decide between a fixed and adjustable rate",
          },
          {
            id: "match-down-payment",
            label: "Match the loan's down-payment requirement to your savings",
          },
        ],
        terms: ["pre-approval", "loan-estimate", "down-payment"],
      },
    ],
  },
  {
    slug: "search",
    order: 3,
    title: "Search",
    tagline: "Find the right home and learn what it's really worth.",
    description:
      "Set your criteria, browse listings, and research neighborhoods and comparable sales so you know a fair price when you see one.",
    icon: "🔍",
    timeline: "About 10 weeks on average",
    steps: [
      {
        slug: "find-listings-and-comps",
        title: "Find listings and pull comps",
        summary:
          "Search the major portals, set alerts, and study comparable sales to gauge value.",
        timeline: "Ongoing, ~10 weeks",
        body: [
          "Most listings come from the MLS and show up on Zillow, Redfin, and Realtor.com. Set your criteria — price, location, beds, must-haves — and turn on alerts so new listings reach you fast.",
          "For any home you like, pull comparable sales ('comps'): recently sold homes nearby that are similar in size, condition, and age. Comps are how you judge whether the asking price is fair, which is exactly the expertise a buyer's agent would normally provide.",
          "Keep a shortlist and notes on each home. You'll move quickly once you're ready to tour and offer.",
        ],
        whyItMatters:
          "Comps are your defense against overpaying — without them you're guessing at value.",
        withoutAnAgent:
          "An agent typically pulls comps and frames neighborhood value; on your own, use the portals' sold-price data and public records to build your own comp picture before you offer.",
        tasks: [
          {
            id: "set-criteria",
            label: "Define your search criteria and price ceiling",
          },
          {
            id: "set-alerts",
            label: "Set up listing alerts on Zillow, Redfin, and Realtor.com",
          },
          {
            id: "research-neighborhoods",
            label: "Research neighborhoods, schools, and commute",
          },
          {
            id: "pull-comps",
            label: "Pull comparable sales for any home you're serious about",
            detail: "Look for similar homes sold in the last 3–6 months nearby.",
          },
        ],
        terms: ["comps", "mls"],
      },
      {
        slug: "understand-disclosures",
        title: "Know your state's disclosures",
        summary:
          "Learn what sellers must disclose in your state so you can read listings critically.",
        timeline: "While you search",
        body: [
          "Seller disclosure rules vary sharply by state. Some, like California, require a detailed Transfer Disclosure Statement of known defects; others lean 'caveat emptor' (buyer beware) and require sellers to reveal very little.",
          "Knowing your state's required disclosure forms tells you what information you're owed — and what you'll have to investigate yourself through inspections and your own research.",
          "Gather any available disclosures, HOA documents, and the property's history (permits, prior sales) as you shortlist homes.",
        ],
        whyItMatters:
          "Disclosure rules set your baseline of protection; in low-disclosure states you must lean harder on inspections and your own diligence.",
        withoutAnAgent:
          "An agent normally knows the local disclosure forms; on your own, look up your state's required disclosures and request them in writing for any home you're serious about.",
        tasks: [
          {
            id: "learn-state-rules",
            label: "Look up your state's seller-disclosure requirements",
          },
          {
            id: "request-disclosures",
            label: "Request available disclosures for shortlisted homes",
          },
          {
            id: "review-hoa",
            label: "Review HOA documents and rules where applicable",
            optional: true,
          },
        ],
        terms: ["seller-disclosure", "inspection"],
        resources: [
          {
            label: "Real Estate Law Corp — Seller disclosure requirements by state",
            href: "https://www.realestatelawcorp.com/seller-disclosure-requirements-by-state-variations-and-key-considerations/",
            description: "How disclosure rules differ across states.",
          },
        ],
      },
    ],
  },
  {
    slug: "tour-and-evaluate",
    order: 4,
    title: "Tour & Evaluate",
    tagline: "See homes in person and judge condition honestly.",
    description:
      "Schedule showings directly with listing agents or sellers, then evaluate each home's condition and value against your comps.",
    icon: "🏠",
    timeline: "Ongoing during your search",
    steps: [
      {
        slug: "schedule-and-assess",
        title: "Schedule tours and assess condition",
        summary:
          "Set up showings yourself and evaluate each home's condition versus its price.",
        timeline: "Ongoing",
        body: [
          "Contact the listing agent directly (their info is on the listing) or attend open houses to see homes. Since the 2024 NAR settlement, an unrepresented buyer is common and accepted — you don't need an agent to get in the door.",
          "Walk each home with a critical eye: roof, foundation, water stains, windows, HVAC age, and signs of deferred maintenance. Take photos and notes so you can compare later.",
          "Cross-check what you see against your comps. A great-looking home priced well above similar recent sales still deserves scrutiny.",
        ],
        whyItMatters:
          "Spotting condition issues early prevents you from chasing a money pit or overpaying for cosmetics.",
        withoutAnAgent:
          "An agent normally arranges showings and offers a second opinion on condition; on your own, request showings directly from listing agents and bring a thorough checklist (a pre-offer walkthrough does not replace a professional inspection later).",
        tasks: [
          {
            id: "contact-listing-agent",
            label: "Contact listing agents or sellers to schedule showings",
          },
          {
            id: "attend-open-houses",
            label: "Attend open houses for homes on your shortlist",
            optional: true,
          },
          {
            id: "condition-checklist",
            label: "Walk each home with a condition checklist",
            detail: "Roof, foundation, plumbing, electrical, HVAC, water damage.",
          },
          {
            id: "compare-to-comps",
            label: "Compare condition and price against your comps",
          },
        ],
        terms: ["mls", "comps", "nar-settlement"],
        resources: [
          {
            label: "Redfin — How to buy a home unrepresented",
            href: "https://www.redfin.com/blog/how-to-buy-a-home-unrepresented/",
            description: "Guidance on touring and buying without a buyer's agent.",
          },
        ],
      },
    ],
  },
  {
    slug: "make-an-offer",
    order: 5,
    title: "Make an Offer",
    tagline: "Put it in writing — and claim the commission savings.",
    description:
      "Draft a written offer with the right price, contingencies, and earnest money, and explicitly negotiate the unpaid buyer-side commission into your favor.",
    icon: "✍️",
    timeline: "1–3 days after you decide",
    steps: [
      {
        slug: "draft-the-offer",
        title: "Draft your written offer",
        summary:
          "Complete a state offer form with price, contingencies, earnest money, and timeline.",
        timeline: "1–2 days",
        body: [
          "An offer is a written document stating your price, the contingencies that protect you, your earnest money amount, and your proposed closing date. Most states have a standard offer/purchase form; an attorney can also draft or review it.",
          "Choose your contingencies carefully — common ones are inspection, appraisal, financing, and title. These are your exits: each one lets you renegotiate or walk away (and keep your earnest money) if a condition isn't met.",
          "Decide your earnest money amount (typically 1–3% of price). A larger deposit signals seriousness but is the money most at risk if you default outside your contingencies.",
        ],
        whyItMatters:
          "Your offer's contingencies are the safety net that protects your earnest money and your right to walk away.",
        withoutAnAgent:
          "An agent normally fills out the offer and advises on contingencies; on your own, use your state's standard form (or have a flat-fee attorney draft it) and never waive inspection or financing contingencies without understanding the risk.",
        tasks: [
          {
            id: "get-state-form",
            label: "Obtain your state's standard offer/purchase form",
          },
          {
            id: "set-price",
            label: "Set your offer price using your comps",
          },
          {
            id: "choose-contingencies",
            label: "Choose your contingencies (inspection, appraisal, financing, title)",
          },
          {
            id: "set-earnest",
            label: "Decide your earnest money amount (typically 1–3%)",
          },
          {
            id: "set-timeline",
            label: "Set your proposed closing date and contingency deadlines",
          },
        ],
        terms: [
          "purchase-agreement",
          "contingency",
          "earnest-money",
          "appraisal",
          "title-search",
        ],
      },
      {
        slug: "negotiate-commission-savings",
        title: "Claim the commission savings",
        summary:
          "Negotiate the unpaid buyer-side commission into a price cut or closing-cost credit — or the seller keeps it.",
        timeline: "Built into your offer",
        body: [
          "This is the heart of buying without a buyer's agent. The buyer-side commission is roughly 2.5% of the price — about $7,500 on a $300K home, or nearly $10,000 on a $368K home. Since the August 2024 NAR settlement, commission is negotiated deal by deal, which is what makes capturing this savings possible.",
          "Here's the catch most buyers miss: if you're unrepresented and simply decline a buyer-agent concession, the seller usually keeps that money — it does NOT automatically become your savings. You only capture it by writing it into your offer as a price reduction or a closing-cost credit to you.",
          "Make it explicit. State in your offer that, because there is no buyer-side agent to compensate, the price should be reduced (or you should receive a credit) by the buyer-agent commission amount. This single step is where the real dollars land.",
        ],
        whyItMatters:
          "The ~2.5% savings is the core promise of going agent-free, but it is NOT automatic — unclaimed, it simply stays with the seller.",
        withoutAnAgent:
          "There is no buyer's agent commission to pay, so the question is who keeps that money; you must negotiate it to yourself in writing as a price cut or credit, since nobody else will do it for you.",
        tasks: [
          {
            id: "estimate-commission",
            label: "Estimate the buyer-side commission (~2.5% of price)",
          },
          {
            id: "write-it-in",
            label: "Write the savings into your offer as a price reduction or credit",
            detail:
              "Frame it as: no buyer-agent commission is owed, so reduce price or credit that amount to the buyer.",
          },
          {
            id: "confirm-credit-limits",
            label: "Confirm your lender's limits on seller credits",
            detail: "Loan programs cap how much of a seller credit can apply to closing costs.",
          },
          {
            id: "document-terms",
            label: "Get the agreed savings stated clearly in the contract",
          },
        ],
        terms: ["commission", "concession", "nar-settlement", "closing-costs"],
        resources: [
          {
            label: "NAR Settlement FAQs",
            href: "https://www.nar.realtor/the-facts/nar-settlement-faqs",
            description: "How buyer-agent commission rules changed in 2024.",
          },
          {
            label: "Better — Buying a house without a Realtor",
            href: "https://better.com/content/buying-house-without-realtor",
            description: "Why the savings must be negotiated, not assumed.",
          },
        ],
      },
    ],
  },
  {
    slug: "negotiate-and-go-under-contract",
    order: 6,
    title: "Negotiate & Go Under Contract",
    tagline: "Trade counteroffers, then sign with confidence.",
    description:
      "Work through counteroffers on price, repairs, and credits, then sign a binding purchase agreement — ideally after an attorney reviews it.",
    icon: "🤝",
    timeline: "Days",
    steps: [
      {
        slug: "counter-and-sign",
        title: "Negotiate counteroffers and sign the contract",
        summary:
          "Trade counteroffers and sign a binding purchase agreement with the terms that protect you.",
        timeline: "A few days",
        body: [
          "Expect back-and-forth on price, closing costs, repairs, and your requested commission savings. Stay anchored to your comps and your walk-away number rather than the listing agent's pressure.",
          "Negotiating directly against a professional listing agent is the biggest structural disadvantage of going agent-free. A flat-fee real estate attorney (commonly $500–$1,500+) can draft or review the contract and is the single best way to neutralize that risk.",
          "Once both sides agree and sign, you're 'under contract' and the deal goes pending. Make sure every contingency and deadline you negotiated actually appears in the signed document.",
        ],
        whyItMatters:
          "Signing a binding contract with the wrong terms or missing protections is hard to undo — review it carefully before you sign.",
        withoutAnAgent:
          "An agent normally negotiates for you and watches the contract language; on your own, hire a flat-fee real estate attorney to review the purchase agreement and confirm your contingencies and deadlines are intact.",
        tasks: [
          {
            id: "hold-walk-away",
            label: "Set and hold your walk-away price",
          },
          {
            id: "negotiate-terms",
            label: "Negotiate price, repairs, credits, and commission savings",
          },
          {
            id: "attorney-review",
            label: "Have a flat-fee attorney review the contract before signing",
            detail: "Typically $500–$1,500+ and the best insurance against agentless risk.",
          },
          {
            id: "verify-contingencies",
            label: "Verify all contingencies and deadlines are in the signed contract",
          },
          {
            id: "sign-contract",
            label: "Sign the purchase agreement to go under contract",
          },
        ],
        terms: ["purchase-agreement", "contingency", "concession", "real-estate-attorney"],
        resources: [
          {
            label: "FastExpert — Risks of buying without a Realtor",
            href: "https://www.fastexpert.com/blog/risks-of-buying-a-house-without-a-realtor/",
            description: "Common pitfalls and how an attorney mitigates them.",
          },
        ],
      },
    ],
  },
  {
    slug: "earnest-money-and-open-escrow",
    order: 7,
    title: "Earnest Money & Open Escrow",
    tagline: "Deposit your good-faith money — safely.",
    description:
      "Wire your earnest money into escrow and open the escrow/title process, taking extra care to avoid wire fraud.",
    icon: "🔐",
    timeline: "Within 1–3 days of signing",
    steps: [
      {
        slug: "deposit-earnest-money",
        title: "Deposit earnest money and open escrow",
        summary:
          "Send your good-faith deposit to the escrow holder and verify the wire instructions first.",
        timeline: "1–3 days",
        body: [
          "Earnest money is a good-faith deposit (typically 1–3% of price) held by a neutral escrow holder. It's applied to your purchase at closing, but it can be forfeited if you back out for a reason not covered by your contingencies.",
          "WIRE FRAUD WARNING: criminals send fake wire instructions that look real to steal your deposit. Before sending a dollar, call the escrow or title company using a phone number you independently verified (not one from the email), and confirm the account details by phone.",
          "Sending earnest money also kicks off the escrow and title process, where a neutral party will hold funds and documents until every closing condition is met.",
        ],
        whyItMatters:
          "Wire fraud on earnest money is a top way self-serve buyers lose money — a stolen wire is often gone for good. Always verify instructions by phone.",
        withoutAnAgent:
          "An agent often coordinates the deposit and flags wire-fraud scams; on your own, independently verify the escrow holder's wire instructions by phone and keep proof of your deposit and its refund conditions.",
        tasks: [
          {
            id: "confirm-escrow-holder",
            label: "Confirm who the escrow/title holder is",
          },
          {
            id: "verify-wire",
            label: "Verify wire instructions by phone using a known number",
            detail: "Never trust wire details sent only by email — call to confirm.",
          },
          {
            id: "send-deposit",
            label: "Send the earnest money deposit",
          },
          {
            id: "get-receipt",
            label: "Get written confirmation the escrow holder received it",
          },
          {
            id: "note-refund-terms",
            label: "Note the conditions under which your deposit is refundable",
          },
        ],
        terms: ["earnest-money", "escrow", "wire-fraud"],
        resources: [
          {
            label: "Consumer Financial Protection Bureau — Mortgage closing scams & wire fraud",
            href: "https://www.consumerfinance.gov/about-us/blog/mortgage-closing-scams-how-protect-yourself-and-your-money/",
            description: "How to recognize and avoid closing wire fraud.",
          },
        ],
      },
    ],
  },
  {
    slug: "inspection",
    order: 8,
    title: "Inspection",
    tagline: "Find out what you're really buying.",
    description:
      "Hire a licensed inspector, understand the report, and use it to negotiate repairs or credits — or to walk away.",
    icon: "🔎",
    timeline: "First 7–14 days under contract",
    steps: [
      {
        slug: "schedule-inspection",
        title: "Schedule and attend the inspection",
        summary:
          "Hire a licensed inspector and attend so you understand the home's true condition.",
        timeline: "Within your inspection contingency window",
        body: [
          "A licensed home inspector examines structure, roof, electrical, plumbing, and HVAC, then gives you a detailed report. Hire one promptly so you stay within your inspection contingency deadline.",
          "Attend the inspection if you can. Walking the home with the inspector helps you understand which findings are minor and which are deal-changers.",
          "Consider specialized inspections (sewer scope, radon, pest, mold) when the home or area warrants it.",
        ],
        whyItMatters:
          "The inspection is your window to discover serious defects before you're locked in — missing it can mean inheriting expensive surprises.",
        withoutAnAgent:
          "An agent normally recommends inspectors and helps schedule; on your own, hire a licensed inspector directly and book early so you stay inside your contingency deadline.",
        tasks: [
          {
            id: "hire-inspector",
            label: "Hire a licensed home inspector",
          },
          {
            id: "schedule-in-window",
            label: "Schedule within your inspection contingency window",
          },
          {
            id: "attend",
            label: "Attend the inspection in person",
            optional: true,
          },
          {
            id: "specialized",
            label: "Add specialized inspections if warranted (sewer, radon, pest)",
            optional: true,
          },
        ],
        terms: ["inspection", "contingency"],
      },
      {
        slug: "interpret-and-negotiate",
        title: "Interpret the report and negotiate",
        summary:
          "Read the report carefully, then request repairs or credits — or exercise your contingency.",
        timeline: "1–3 days after inspection",
        body: [
          "Read the report and separate cosmetic items from real problems: roof, foundation, water intrusion, electrical, and major systems matter most. Get repair estimates for anything significant.",
          "You generally have three options: ask the seller to make repairs, ask for a price reduction or closing-cost credit instead, or — if findings are serious and you have an inspection contingency — walk away and recover your earnest money.",
          "Respond before your inspection contingency deadline. Missing the deadline can waive your right to renegotiate or exit over inspection issues.",
        ],
        whyItMatters:
          "Acting before the inspection deadline preserves your leverage and your right to walk away with your earnest money.",
        withoutAnAgent:
          "An agent typically interprets the report and drafts the repair request; on your own, get contractor estimates for big items and submit your repair/credit request in writing before the deadline.",
        tasks: [
          {
            id: "review-report",
            label: "Review the full report and flag major items",
          },
          {
            id: "get-estimates",
            label: "Get repair estimates for significant findings",
          },
          {
            id: "choose-path",
            label: "Decide: repairs, credit, or exercise your contingency",
          },
          {
            id: "submit-request",
            label: "Submit your request in writing before the deadline",
          },
        ],
        terms: ["inspection", "contingency", "concession", "earnest-money"],
      },
    ],
  },
  {
    slug: "appraisal-and-underwriting",
    order: 9,
    title: "Appraisal & Financing/Underwriting",
    tagline: "Get the lender from 'applied' to 'clear to close.'",
    description:
      "Your lender orders an appraisal and the underwriter verifies everything; respond fast to conditions until you're cleared to close.",
    icon: "🏦",
    timeline: "Roughly 30–45 days",
    steps: [
      {
        slug: "track-appraisal-and-underwriting",
        title: "Track the appraisal and underwriting to clear to close",
        summary:
          "Stay on top of the appraisal and respond promptly to every underwriting condition.",
        timeline: "30–45 days",
        body: [
          "Your lender orders an independent appraisal to confirm the home's value supports the loan. If it comes in low, you may need to renegotiate the price, bring more cash, or use an appraisal contingency to exit.",
          "Meanwhile the underwriter verifies your income, assets, and credit and may request more documents ('conditions'). Respond to every request quickly — delays here are the most common cause of pushed closing dates.",
          "Protect your loan: don't open new credit, finance a car, change jobs, or make large unexplained deposits until after closing. The finish line is 'clear to close,' meaning underwriting is fully approved.",
        ],
        whyItMatters:
          "A low appraisal or a slow document response can derail or delay your closing — staying responsive keeps the deal on track.",
        withoutAnAgent:
          "An agent often chases the appraisal and nudges the timeline; on your own, stay in direct contact with your loan officer, track the appraisal order, and turn around every condition the same day if you can.",
        tasks: [
          {
            id: "track-appraisal",
            label: "Track the appraisal order through your lender",
          },
          {
            id: "respond-low-appraisal",
            label: "Have a plan if the appraisal comes in low",
            detail: "Renegotiate, bring more cash, or use your appraisal contingency.",
          },
          {
            id: "submit-conditions",
            label: "Respond to underwriting conditions promptly",
          },
          {
            id: "no-credit-changes",
            label: "Avoid new credit, big purchases, or job changes",
          },
          {
            id: "get-ctc",
            label: "Confirm you've reached 'clear to close'",
          },
        ],
        terms: ["appraisal", "underwriting", "clear-to-close", "contingency"],
      },
      {
        slug: "lock-rate-and-secure-insurance",
        title: "Lock your rate and line up insurance",
        summary:
          "Decide when to lock your rate and bind the homeowners insurance your lender requires.",
        timeline: "Before clear to close",
        body: [
          "Talk to your lender about locking your interest rate so a market move doesn't change your payment before closing. A lock holds your rate for a set window; confirm it covers your expected closing date.",
          "Your lender will also require homeowners insurance to be in place at closing. Shop policies, choose your coverage, and send proof to your lender — this is a common last-minute holdup if left late.",
          "Keep an eye on your contingency deadlines through this period so a financing or appraisal issue never catches you past a date you could have used to protect yourself.",
        ],
        whyItMatters:
          "An unlocked rate or missing insurance binder can delay closing or change your costs at the worst possible moment.",
        withoutAnAgent:
          "An agent often reminds you to bind insurance and watch the rate lock; on your own, calendar these tasks and confirm both directly with your lender and insurer.",
        tasks: [
          {
            id: "discuss-rate-lock",
            label: "Discuss and confirm your rate lock with the lender",
          },
          {
            id: "shop-insurance",
            label: "Shop and choose homeowners insurance",
          },
          {
            id: "send-binder",
            label: "Send proof of insurance to your lender",
          },
          {
            id: "watch-deadlines",
            label: "Track your contingency deadlines",
          },
        ],
        terms: ["clear-to-close", "contingency", "closing-costs"],
      },
    ],
  },
  {
    slug: "title-and-escrow",
    order: 10,
    title: "Title & Escrow",
    tagline: "Make sure the home is truly free to sell.",
    description:
      "A title search checks for liens and ownership problems, you choose title insurance, and you confirm your state's closing path — attorney or escrow company.",
    icon: "📜",
    timeline: "Runs in parallel, ~2–3 weeks",
    steps: [
      {
        slug: "title-search-and-closing-path",
        title: "Review title and confirm your closing path",
        summary:
          "Coordinate the title search, choose owner's title insurance, and confirm whether your state closes via attorney or escrow company.",
        timeline: "2–3 weeks",
        body: [
          "A title company or closing attorney searches public records for liens, unpaid taxes, or ownership defects, then issues a title commitment. Review it for anything that could cloud your ownership.",
          "Your lender will require a lender's title insurance policy. An owner's title insurance policy is optional but strongly recommended — it's a one-time premium that protects your own stake against title problems that surface later.",
          "Closing paths differ by state. In ATTORNEY STATES (for example GA, SC, NC, NY, NJ, MA, and others), a lawyer must conduct or oversee closing — so bundle the attorney you may already be using. In ESCROW/TITLE-COMPANY STATES (for example CA, TX, AZ, CO, WA, and others), a title or escrow company can close without an attorney.",
        ],
        whyItMatters:
          "Unresolved title defects can threaten your ownership; owner's title insurance and a clean title search protect the biggest purchase of your life.",
        withoutAnAgent:
          "An agent normally coordinates the title/escrow company; on your own, select and coordinate the title or escrow company (or the closing attorney in an attorney state) and review the title commitment yourself.",
        tasks: [
          {
            id: "open-title",
            label: "Coordinate the title search and get the title commitment",
          },
          {
            id: "review-commitment",
            label: "Review the title commitment for liens or defects",
          },
          {
            id: "choose-owners-policy",
            label: "Decide on owner's title insurance (recommended)",
          },
          {
            id: "confirm-closing-path",
            label: "Confirm your state's closing path (attorney vs. escrow company)",
          },
        ],
        terms: ["title-search", "title-insurance", "escrow", "real-estate-attorney"],
        resources: [
          {
            label: "Bankrate — What are closing costs?",
            href: "https://www.bankrate.com/mortgages/what-are-closing-costs/",
            description: "Includes typical title and settlement fees.",
          },
        ],
      },
      {
        slug: "clear-title-issues",
        title: "Clear any title issues",
        summary:
          "Work with the title company or attorney to resolve liens or defects before closing.",
        timeline: "Within the title window",
        body: [
          "If the title search turns up problems — an old lien, an unpaid tax bill, a boundary or easement issue, or a clerical error — they need to be resolved before closing so you receive clear ownership.",
          "The title company or closing attorney typically coordinates the fixes, but stay informed: ask what each item is, who's responsible for clearing it, and whether it could delay your closing date.",
          "Confirm your owner's title insurance is in place; it's your backstop if a covered defect surfaces after you own the home.",
        ],
        whyItMatters:
          "Closing on a property with an unresolved title defect can put your ownership and money at risk — clear it first.",
        withoutAnAgent:
          "An agent normally chases title issues with the closing company; on your own, follow up directly and don't agree to close until you understand how each item was resolved.",
        tasks: [
          {
            id: "list-title-issues",
            label: "List any liens, defects, or exceptions on the title commitment",
          },
          {
            id: "assign-resolution",
            label: "Confirm who is resolving each item and by when",
          },
          {
            id: "confirm-clear-title",
            label: "Confirm clear title before agreeing to close",
          },
          {
            id: "confirm-owner-policy",
            label: "Confirm your owner's title insurance is in place",
          },
        ],
        terms: ["title-search", "title-insurance", "escrow"],
      },
    ],
  },
  {
    slug: "closing-disclosure-review",
    order: 11,
    title: "Closing Disclosure Review",
    tagline: "Three business days to catch every error.",
    description:
      "Your lender must deliver the Closing Disclosure at least 3 business days before closing; compare it to your Loan Estimate line by line.",
    icon: "🧾",
    timeline: "At least 3 business days before closing",
    steps: [
      {
        slug: "review-closing-disclosure",
        title: "Review your Closing Disclosure",
        summary:
          "Use the 3-business-day rule to compare your final costs against your Loan Estimate and dispute errors.",
        timeline: "3+ days before closing",
        body: [
          "The Closing Disclosure (CD) is the final accounting of your loan terms and all closing costs. By law, the lender must deliver it to you at least 3 BUSINESS DAYS before closing — this window exists specifically so you can review it without pressure.",
          "Compare the CD against your original Loan Estimate, line by line. Check the loan amount, interest rate, monthly payment, cash to close, and every fee. Some figures can change; large or unexplained jumps deserve questions.",
          "Don't waive or rush the 3-day window. If you spot errors or surprises, raise them now — fixing them is far easier before you sign than after.",
        ],
        whyItMatters:
          "The 3-business-day rule is your protected window to catch costly mistakes; skipping a careful CD review is how buyers overpay at the table.",
        withoutAnAgent:
          "An agent often helps decode the CD; on your own, read it against your Loan Estimate yourself and call your lender about any discrepancy before signing.",
        tasks: [
          {
            id: "confirm-delivery",
            label: "Confirm you received the CD at least 3 business days before closing",
          },
          {
            id: "compare-to-le",
            label: "Compare the CD to your Loan Estimate line by line",
          },
          {
            id: "verify-cash-to-close",
            label: "Verify your cash-to-close figure",
          },
          {
            id: "dispute-errors",
            label: "Question or dispute any errors with your lender",
          },
        ],
        terms: ["closing-disclosure", "loan-estimate", "closing-costs"],
        resources: [
          {
            label: "Consumer Financial Protection Bureau — Closing Disclosure explainer",
            href: "https://www.consumerfinance.gov/owning-a-home/closing-disclosure/",
            description: "How to read and check your Closing Disclosure.",
          },
        ],
      },
    ],
  },
  {
    slug: "final-walkthrough",
    order: 12,
    title: "Final Walkthrough",
    tagline: "Last chance to confirm nothing changed.",
    description:
      "Within 24–48 hours of closing, verify the home's condition is unchanged and that agreed repairs were completed.",
    icon: "🚪",
    timeline: "24–48 hours before closing",
    steps: [
      {
        slug: "do-the-walkthrough",
        title: "Do the final walkthrough",
        summary:
          "Confirm the home's condition is unchanged and all agreed repairs are done before you sign.",
        timeline: "24–48 hours before closing",
        body: [
          "The final walkthrough is your last check before closing. Confirm the home is in the condition you agreed to, that included fixtures and appliances remain, and that any negotiated repairs were actually completed.",
          "Test the basics: turn on faucets, flush toilets, run the HVAC, check outlets and lights, and look for any new damage from the move-out. Bring your inspection report and repair agreement to verify items.",
          "If something is wrong, raise it before you sign. Once you close, your leverage to get problems fixed largely disappears.",
        ],
        whyItMatters:
          "The walkthrough is your final leverage point — issues caught before signing can be addressed; issues found after closing usually become yours.",
        withoutAnAgent:
          "An agent normally accompanies the walkthrough; on your own, do it yourself with your repair list in hand and document any problems with photos before you go to the closing table.",
        tasks: [
          {
            id: "schedule-walkthrough",
            label: "Schedule the walkthrough 24–48 hours before closing",
          },
          {
            id: "verify-repairs",
            label: "Verify all agreed repairs were completed",
          },
          {
            id: "test-systems",
            label: "Test faucets, toilets, HVAC, outlets, and appliances",
          },
          {
            id: "document-issues",
            label: "Document any new problems with photos before signing",
          },
        ],
        terms: ["final-walkthrough"],
      },
    ],
  },
  {
    slug: "closing-settlement",
    order: 13,
    title: "Closing / Settlement",
    tagline: "Sign, fund, and get the keys.",
    description:
      "At closing you sign the loan and transfer documents, pay your costs with verified funds, the deed records, and the home is yours.",
    icon: "🔑",
    timeline: "1–2 hours (funding sometimes next day)",
    steps: [
      {
        slug: "close-the-deal",
        title: "Close on your home",
        summary:
          "Bring verified funds, sign the documents, and take ownership — with one more wire-fraud check.",
        timeline: "1–2 hours",
        body: [
          "At closing you sign the loan documents and the transfer paperwork, pay your down payment and closing costs, and the deed is recorded. Then you get the keys.",
          "WIRE FRAUD WARNING returns here at the biggest dollar amount of all. Before wiring your cash to close, re-verify the escrow or title company's wire instructions by phone using a number you independently confirmed. Scammers specifically target closing-day wires.",
          "In an attorney state your closing attorney runs the signing; in an escrow state the title or escrow company handles it, and your attorney can still attend with you. Bring a government ID and your verified/certified funds.",
        ],
        whyItMatters:
          "Closing is where the most money moves at once — re-verifying wire instructions here protects your entire down payment and closing costs from fraud.",
        withoutAnAgent:
          "An agent normally attends and explains documents at the table; on your own, consider having your real estate attorney attend, and re-confirm wire instructions by phone before sending any funds.",
        tasks: [
          {
            id: "reverify-wire",
            label: "Re-verify wire instructions by phone before sending cash to close",
            detail: "Use a phone number you independently confirmed — closing wires are a top fraud target.",
          },
          {
            id: "bring-id-funds",
            label: "Bring government ID and certified/verified funds",
          },
          {
            id: "review-before-sign",
            label: "Review documents (or have your attorney attend) before signing",
          },
          {
            id: "sign-and-record",
            label: "Sign the loan and transfer documents",
          },
          {
            id: "get-keys",
            label: "Get the keys and confirm the deed is recorded",
          },
        ],
        terms: ["closing-settlement", "wire-fraud", "escrow", "real-estate-attorney"],
        resources: [
          {
            label: "Consumer Financial Protection Bureau — Mortgage closing scams & wire fraud",
            href: "https://www.consumerfinance.gov/about-us/blog/mortgage-closing-scams-how-protect-yourself-and-your-money/",
            description: "Protect your closing-day funds from wire fraud.",
          },
        ],
      },
      {
        slug: "prepare-for-closing-day",
        title: "Prepare for closing day",
        summary:
          "Confirm your cash to close, line up funds, and gather what you need before you arrive.",
        timeline: "A few days before closing",
        body: [
          "Confirm your exact cash-to-close figure from your Closing Disclosure and arrange the funds — usually a wire or a cashier's check. Banks often need a day's notice, so don't leave this to the morning of.",
          "Decide who's attending and where. In an attorney state your attorney runs the signing; in an escrow state the title or escrow company handles it. Either way, you can choose to have your attorney present.",
          "Gather your government-issued ID and proof of homeowners insurance, and re-read your contract so you know exactly what you're agreeing to.",
        ],
        whyItMatters:
          "A little prep prevents closing-day delays — short funds or missing ID can stall the signing and your move-in.",
        withoutAnAgent:
          "An agent often coordinates the logistics; on your own, confirm the time, place, attendees, and funds directly with your closing agent or attorney a few days ahead.",
        tasks: [
          {
            id: "confirm-cash-to-close",
            label: "Confirm your exact cash-to-close amount",
          },
          {
            id: "arrange-funds",
            label: "Arrange a wire or cashier's check in advance",
          },
          {
            id: "confirm-logistics",
            label: "Confirm closing time, place, and who attends",
          },
          {
            id: "gather-id-insurance",
            label: "Gather your ID and proof of homeowners insurance",
          },
        ],
        terms: ["closing-settlement", "closing-disclosure", "real-estate-attorney"],
      },
    ],
  },
  {
    slug: "post-purchase",
    order: 14,
    title: "Post-Purchase",
    tagline: "Settle in and protect your investment.",
    description:
      "After closing, set up utilities, keep your documents safe, file any tax exemptions, and start your mortgage payments on time.",
    icon: "📦",
    timeline: "After closing",
    steps: [
      {
        slug: "settle-in",
        title: "Settle in and set up ownership",
        summary:
          "Handle utilities, records, tax exemptions, and your first mortgage payment.",
        timeline: "First weeks after closing",
        body: [
          "Confirm the deed recorded in your name and store all your closing documents somewhere safe (digital and physical copies). You'll want them for taxes and any future sale.",
          "Set up utilities, change your address, and update your homeowners insurance. Where available, file a homestead exemption — it can reduce your property taxes.",
          "Note when your first mortgage payment is due and set up autopay so you never miss one. Budget for ongoing property taxes and insurance, which may be paid through an escrow account with your lender.",
        ],
        whyItMatters:
          "Good record-keeping and on-time payments protect your credit, your equity, and your peace of mind as a new owner.",
        withoutAnAgent:
          "On your own, you're the one tracking the document hand-offs — capture every closing doc so nothing falls through the cracks.",
        tasks: [
          {
            id: "store-docs",
            label: "Store your closing documents safely (digital and physical)",
          },
          {
            id: "setup-utilities",
            label: "Set up utilities and change your address",
          },
          {
            id: "file-homestead",
            label: "File a homestead exemption where available",
            optional: true,
          },
          {
            id: "first-payment",
            label: "Set up autopay for your first mortgage payment",
          },
          {
            id: "confirm-deed",
            label: "Confirm the deed recorded in your name",
          },
        ],
        terms: ["closing-settlement", "escrow"],
      },
    ],
  },
];
