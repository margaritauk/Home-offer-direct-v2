import type { StateProfile } from "./types";

/**
 * Per-state legal-engine dataset for self-serve (agent-free) home buyers.
 *
 * GUIDANCE, NOT LEGAL ADVICE. Classifications reflect customary practice and
 * commonly-cited rules as of mid-2026 and can change; always confirm with the
 * linked authoritative source or a local attorney. Where attorney-vs-escrow
 * practice splits by region, the profile uses "either" and explains in
 * `closingNote`.
 *
 * Note on lead paint: regardless of a state's disclosure regime, federal law
 * (42 U.S.C. §4852d) requires a lead-based-paint disclosure for homes built
 * before 1978.
 */
export const stateProfiles: StateProfile[] = [
  {
    code: "AL",
    name: "Alabama",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Alabama is an attorney state: state law (Ala. Code §34-3-6) reserves the preparation of deeds, mortgages and related closing documents to licensed attorneys, so an attorney conducts or oversees closing.",
    disclosureRegime: "limited",
    disclosureNote:
      "Alabama largely follows caveat emptor for resales; there is no mandatory statewide disclosure form, though sellers must not actively conceal known health/safety defects. Inspect thoroughly.",
    transferTaxNote:
      "Alabama levies a state deed transfer (recordation) tax of $0.50 per $500 of value, customarily paid by the seller, plus a mortgage tax paid by the buyer.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Alabama permits dual agency (\"limited consensual dual agency\") only with the prior written consent of both parties.",
    highlights: [
      "Budget for a closing attorney — it is effectively mandatory here.",
      "Caveat-emptor state: rely on your own inspection, not the seller's disclosures.",
      "Order an owner's title insurance policy in addition to the lender's policy.",
    ],
    resources: [
      { label: "Alabama Real Estate Commission", href: "https://arec.alabama.gov/" },
    ],
  },
  {
    code: "AK",
    name: "Alaska",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Alaska is an escrow/title state: a title or escrow company customarily handles closing and disburses funds; no attorney is required.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Real Property Transfer Disclosure Statement",
    disclosureNote:
      "Alaska statute (AS 34.70) requires sellers of most residential property to complete a written Residential Real Property Transfer Disclosure Statement of known conditions.",
    transferTaxNote:
      "Alaska has no state real-estate transfer tax; expect only recording fees, though some municipalities may impose local charges.",
    dualAgency: "banned",
    dualAgencyNote:
      "Alaska prohibits dual agency; a licensee may not represent both buyer and seller in the same transaction.",
    highlights: [
      "Choose a reputable title/escrow company to run closing.",
      "Read the seller's mandatory transfer-disclosure statement carefully.",
      "No state transfer tax keeps closing costs lower.",
    ],
    resources: [
      { label: "Alaska Real Estate Commission", href: "https://www.commerce.alaska.gov/web/cbpl/professionallicensing/realestatecommission.aspx" },
    ],
  },
  {
    code: "AZ",
    name: "Arizona",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Arizona is an escrow state: an independent escrow/title company acts as the neutral closing agent; attorneys are optional.",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Residential Seller's Property Disclosure Statement (SPDS)",
    disclosureNote:
      "Arizona case law requires sellers to disclose known material defects; the AAR Seller's Property Disclosure Statement (SPDS) is the standard form used.",
    transferTaxNote:
      "Arizona prohibits real-estate transfer taxes by constitutional amendment; expect only a small recording fee.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Arizona permits dual agency with the informed written consent of both buyer and seller.",
    highlights: [
      "Open escrow early with a title/escrow company you select.",
      "Review the seller's SPDS line by line and ask follow-up questions.",
      "No transfer tax — verify the title company's escrow/settlement fee instead.",
    ],
    resources: [
      { label: "Arizona Department of Real Estate", href: "https://azre.gov/" },
    ],
  },
  {
    code: "AR",
    name: "Arkansas",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Arkansas is an escrow/title state: title companies customarily close transactions; an attorney is not required.",
    disclosureRegime: "limited",
    disclosureNote:
      "Arkansas leans caveat-emptor with no statewide mandatory disclosure form for resales, though sellers cannot fraudulently conceal known defects. A Realtor-association disclosure form is often used by custom.",
    transferTaxNote:
      "Arkansas imposes a real-property transfer tax of $3.30 per $1,000 of value, customarily split or paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Arkansas permits dual agency with written disclosure and consent from both parties.",
    highlights: [
      "Use a title/escrow company; no attorney is required.",
      "Caveat-emptor leaning — make your inspection contingency robust.",
      "Confirm who pays the transfer tax in your contract.",
    ],
    resources: [
      { label: "Arkansas Real Estate Commission", href: "https://arec.arkansas.gov/" },
    ],
  },
  {
    code: "CA",
    name: "California",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "California is an escrow state: a neutral escrow company (often with a separate title company) handles closing; attorneys are rarely involved in routine deals.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Transfer Disclosure Statement (TDS)",
    disclosureNote:
      "California has one of the strictest regimes: sellers must deliver a statutory Transfer Disclosure Statement (Civ. Code §1102 et seq.) plus a Natural Hazard Disclosure and other mandated disclosures.",
    transferTaxNote:
      "California charges a county documentary transfer tax ($1.10 per $1,000), customarily paid by the seller, and many cities add their own transfer tax.",
    dualAgency: "permitted",
    dualAgencyNote:
      "California permits dual agency with full written disclosure and the consent of both parties.",
    highlights: [
      "Expect extensive statutory disclosures (TDS, Natural Hazard, etc.) — read them all.",
      "Escrow company runs closing; pick one early.",
      "Check for city-level transfer taxes, which can be substantial.",
    ],
    resources: [
      { label: "California Department of Real Estate", href: "https://www.dre.ca.gov/" },
      { label: "DRE — Disclosures in Real Property (RE 6)", href: "https://dre.ca.gov/files/pdf/re6.pdf" },
    ],
  },
  {
    code: "CO",
    name: "Colorado",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Colorado is an escrow/title state: title companies close transactions, and licensed brokers use state-approved contract forms; attorneys are optional.",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Seller's Property Disclosure",
    disclosureNote:
      "Colorado sellers must disclose known material latent defects; the Colorado Real Estate Commission's Seller's Property Disclosure form is standard.",
    transferTaxNote:
      "Colorado has a small state documentary fee ($0.01 per $100); a few home-rule towns levy local transfer taxes, otherwise none.",
    dualAgency: "banned",
    dualAgencyNote:
      "Colorado abolished dual agency in 2003; licensees act as single agents or transaction-brokers instead.",
    highlights: [
      "Title company handles closing; no attorney required.",
      "Use the state-approved contract and Seller's Property Disclosure form.",
      "Check whether your municipality has a local transfer tax.",
    ],
    resources: [
      { label: "Colorado Division of Real Estate", href: "https://dre.colorado.gov/" },
    ],
  },
  {
    code: "CT",
    name: "Connecticut",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Connecticut is an attorney state: a licensed attorney conducts the closing and handles title and document work.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property Condition Disclosure Report",
    disclosureNote:
      "Connecticut requires sellers to provide a Residential Property Condition Disclosure Report; failing to deliver it entitles the buyer to a $500 credit at closing.",
    transferTaxNote:
      "Connecticut charges both a state and a municipal conveyance tax, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Connecticut permits dual agency (and designated agency) with the written informed consent of both parties.",
    highlights: [
      "Retain a closing attorney — it is required here.",
      "Get the seller's Property Condition Disclosure Report before closing.",
      "Conveyance tax is the seller's cost by custom; confirm in the contract.",
    ],
    resources: [
      { label: "Connecticut Dept. of Consumer Protection — Real Estate", href: "https://portal.ct.gov/dcp/license-services-division/all-license-applications/real-estate-licenses" },
    ],
  },
  {
    code: "DE",
    name: "Delaware",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Delaware is an attorney state: by Supreme Court rule a licensed Delaware attorney must conduct the closing.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Disclosure of Real Property Condition Report",
    disclosureNote:
      "Delaware law (6 Del. C. §2572) requires sellers to give buyers a written Seller's Disclosure of Real Property Condition Report before acceptance of an offer.",
    transferTaxNote:
      "Delaware has a high real-estate transfer tax (up to 4%), customarily split equally between buyer and seller absent agreement.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Delaware permits dual agency with the written consent of both buyer and seller.",
    highlights: [
      "Use a Delaware attorney to close — it is required.",
      "Review the seller's mandatory condition disclosure before signing.",
      "Budget for the transfer tax; buyer typically pays about half.",
    ],
    resources: [
      { label: "Delaware Real Estate Commission", href: "https://dpr.delaware.gov/boards/realestate/" },
    ],
  },
  {
    code: "DC",
    name: "District of Columbia",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "The District of Columbia treats real-estate settlement as the practice of law; a licensed attorney (or attorney-supervised title company) conducts closing.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Disclosure Statement",
    disclosureNote:
      "DC law (D.C. Code §42-1301 et seq.) requires sellers of residential property to deliver a Seller's Disclosure Statement of property condition before the buyer is bound.",
    transferTaxNote:
      "DC imposes both a transfer tax (customarily seller-paid) and a recordation tax (customarily buyer-paid), each typically 1.1%–1.45% of price.",
    dualAgency: "permitted",
    dualAgencyNote:
      "The District of Columbia permits dual agency with the written informed consent of both parties.",
    highlights: [
      "Settlement is attorney-supervised; engage a DC settlement attorney/title firm.",
      "Read the seller's required Disclosure Statement closely.",
      "Buyers customarily pay the recordation tax — budget for it.",
    ],
    resources: [
      { label: "DC Real Estate Commission (DLCP)", href: "https://dlcp.dc.gov/service/real-estate-licensing" },
    ],
  },
  {
    code: "FL",
    name: "Florida",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Florida is a title/escrow state: title companies close most transactions, though closing attorneys are common in South Florida by custom. No attorney is legally required.",
    disclosureRegime: "written-disclosure",
    disclosureNote:
      "Under Johnson v. Davis, Florida sellers must disclose known material defects not readily observable; there is no single mandated statutory form, but a Realtor disclosure form is standard.",
    transferTaxNote:
      "Florida charges documentary stamp tax on the deed (commonly $0.70 per $100; $0.60 in Miami-Dade), customarily paid by the seller.",
    dualAgency: "banned",
    dualAgencyNote:
      "Florida bans both dual and designated agency; agents instead work as transaction brokers (a non-fiduciary facilitator) or single agents.",
    highlights: [
      "A title company can close; an attorney is optional (common in South FL).",
      "Sellers must disclose known hidden material defects (Johnson v. Davis).",
      "Doc-stamp tax is normally the seller's cost.",
    ],
    resources: [
      { label: "Florida Real Estate Commission (DBPR)", href: "https://www.myfloridalicense.com/DBPR/real-estate-commission/" },
    ],
  },
  {
    code: "GA",
    name: "Georgia",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Georgia is an attorney state: under Georgia Supreme Court rulings a licensed attorney must conduct and control the closing from start to finish.",
    disclosureRegime: "limited",
    disclosureNote:
      "Georgia leans caveat-emptor with no mandatory statewide disclosure form, though sellers cannot conceal known latent defects. A Realtor association Seller's Property Disclosure form is commonly used.",
    transferTaxNote:
      "Georgia charges a real-estate transfer tax of $1.00 per $1,000 of value, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Georgia permits dual agency with the written, informed consent of both parties.",
    highlights: [
      "Engage a closing attorney — required by Georgia law.",
      "Caveat-emptor leaning: lean on your inspection contingency.",
      "Transfer tax is modest and typically seller-paid.",
    ],
    resources: [
      { label: "Georgia Real Estate Commission", href: "https://grec.state.ga.us/" },
    ],
  },
  {
    code: "HI",
    name: "Hawaii",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Hawaii is an escrow state: licensed escrow companies handle closing; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Real Property Disclosure Statement",
    disclosureNote:
      "Hawaii law (HRS §508D) requires sellers to provide a written Seller's Real Property Disclosure Statement of material facts within a set time after acceptance.",
    transferTaxNote:
      "Hawaii imposes a conveyance tax on a graduated scale (higher for high-value and non-owner-occupant purchases), customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Hawaii permits dual agency with the written consent of both buyer and seller.",
    highlights: [
      "An escrow company runs closing; no attorney required.",
      "Expect the seller's mandatory HRS §508D disclosure statement.",
      "Conveyance tax rises with price and buyer-occupancy status.",
    ],
    resources: [
      { label: "Hawaii Real Estate Commission", href: "https://cca.hawaii.gov/reb/" },
    ],
  },
  {
    code: "ID",
    name: "Idaho",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Idaho is an escrow/title state: title and escrow companies close transactions; attorneys are not required.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Property Condition Disclosure Form",
    disclosureNote:
      "Idaho's Property Condition Disclosure Act (Idaho Code §55-2501 et seq.) requires sellers to deliver a written Seller's Property Condition Disclosure Form.",
    transferTaxNote:
      "Idaho prohibits real-estate transfer taxes; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Idaho permits dual (\"limited\") agency with a signed consent acknowledging the reduced level of representation.",
    highlights: [
      "Title/escrow company handles closing.",
      "Seller must provide the statutory Property Condition Disclosure Form.",
      "No transfer tax in Idaho.",
    ],
    resources: [
      { label: "Idaho Real Estate Commission", href: "https://irec.idaho.gov/" },
    ],
  },
  {
    code: "IL",
    name: "Illinois",
    closingPath: "either",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Illinois practice splits by region: attorneys customarily handle closings in the Chicago metro area, while title companies commonly close downstate. No attorney is strictly required, so this is classified \"either.\"",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Real Property Disclosure Report",
    disclosureNote:
      "Illinois law (765 ILCS 77) requires sellers to complete a Residential Real Property Disclosure Report of known defects.",
    transferTaxNote:
      "Illinois charges state and county transfer taxes (customarily seller-paid) and many municipalities add a local transfer tax that may fall on the buyer.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Illinois permits dual agency with the written consent of both parties before the representation begins.",
    highlights: [
      "In the Chicago area, plan to use a closing attorney; downstate a title company is typical.",
      "Seller must provide the Residential Real Property Disclosure Report.",
      "Watch for municipal transfer taxes that can be buyer-paid.",
    ],
    resources: [
      { label: "Illinois Dept. of Financial & Professional Regulation — Real Estate", href: "https://idfpr.illinois.gov/profs/realest.html" },
    ],
  },
  {
    code: "IN",
    name: "Indiana",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Indiana is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Residential Real Estate Sales Disclosure",
    disclosureNote:
      "Indiana law (IC 32-21-5) requires sellers to complete a Seller's Residential Real Estate Sales Disclosure form before an offer is accepted.",
    transferTaxNote:
      "Indiana has no state real-estate transfer tax; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Indiana permits dual agency with the written consent of all parties.",
    highlights: [
      "Title company handles closing.",
      "Seller must provide the statutory Sales Disclosure form.",
      "No transfer tax in Indiana.",
    ],
    resources: [
      { label: "Indiana Real Estate Commission", href: "https://www.in.gov/pla/professions/real-estate-commission-home/" },
    ],
  },
  {
    code: "IA",
    name: "Iowa",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Iowa is a title/escrow state, with the distinctive Iowa Title Guaranty program in place of conventional title insurance; abstractors and attorneys examine title but a closing attorney is not strictly required.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property Seller Disclosure Statement",
    disclosureNote:
      "Iowa law (Iowa Code §558A) requires sellers to deliver a written Residential Property Seller Disclosure Statement of known conditions.",
    transferTaxNote:
      "Iowa imposes a real-estate transfer tax (revenue stamps) of about $1.60 per $1,000 over $500, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Iowa permits dual agency with the written, informed consent of both buyer and seller.",
    highlights: [
      "Title work uses Iowa Title Guaranty rather than standard title insurance.",
      "Seller must provide the statutory disclosure statement.",
      "Transfer-tax stamps are customarily seller-paid.",
    ],
    resources: [
      { label: "Iowa Real Estate Commission", href: "https://plb.iowa.gov/board/real-estate" },
    ],
  },
  {
    code: "KS",
    name: "Kansas",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Kansas is a title/escrow state: title companies close most transactions; attorneys are optional.",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Seller's Disclosure and Condition of Property Statement",
    disclosureNote:
      "Kansas sellers must disclose known material defects; a Seller's Disclosure and Condition of Property Statement is the standard form used by custom.",
    transferTaxNote:
      "Kansas has no real-estate transfer tax (the former mortgage registration tax was phased out); expect only recording fees.",
    dualAgency: "banned",
    dualAgencyNote:
      "Kansas prohibits dual agency; brokers operate as designated agents or transaction brokers instead.",
    highlights: [
      "Title company handles closing.",
      "Expect a seller's condition disclosure by custom.",
      "No transfer tax in Kansas.",
    ],
    resources: [
      { label: "Kansas Real Estate Commission", href: "https://krec.ks.gov/" },
    ],
  },
  {
    code: "KY",
    name: "Kentucky",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Kentucky treats deed/mortgage preparation as the practice of law (KBA opinions), so an attorney prepares the legal documents and is involved in closing.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Disclosure of Property Conditions",
    disclosureNote:
      "Kentucky Real Estate Commission rules require sellers to complete a Seller's Disclosure of Property Conditions form.",
    transferTaxNote:
      "Kentucky charges a transfer tax of $0.50 per $500 of value, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Kentucky permits dual agency with the written, informed consent of both parties.",
    highlights: [
      "An attorney must prepare the deed/mortgage documents.",
      "Seller must complete the KREC property-conditions disclosure.",
      "Transfer tax is modest and typically seller-paid.",
    ],
    resources: [
      { label: "Kentucky Real Estate Commission", href: "https://krec.ky.gov/" },
    ],
  },
  {
    code: "LA",
    name: "Louisiana",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Louisiana follows civil law: the act of sale must be passed before a notary, and an attorney-notary commonly conducts closing and the title examination. Treat attorney/notary involvement as required.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Property Disclosure Document",
    disclosureNote:
      "Louisiana law (La. R.S. 9:3196 et seq.) requires sellers of residential property to deliver a Property Disclosure Document.",
    transferTaxNote:
      "Louisiana has no statewide real-estate transfer tax (Orleans Parish historically had a documentary fee); expect mainly recording costs.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Louisiana permits dual agency with the written consent of both buyer and seller.",
    highlights: [
      "Closing is handled before a notary, commonly an attorney-notary.",
      "Seller must provide the statutory Property Disclosure Document.",
      "No statewide transfer tax.",
    ],
    resources: [
      { label: "Louisiana Real Estate Commission", href: "https://lrec.gov/" },
    ],
  },
  {
    code: "ME",
    name: "Maine",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Maine is generally treated as an attorney state: title work and closing are customarily conducted by attorneys, and attorney involvement in closings is the norm.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Property Disclosure Statement",
    disclosureNote:
      "Maine law (33 M.R.S. §171 et seq.) requires sellers to provide a Property Disclosure Statement covering water, waste, heating and known hazards.",
    transferTaxNote:
      "Maine charges a real-estate transfer tax of $2.20 per $500, split equally between buyer and seller by statute.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Maine permits disclosed dual agency only with the written consent of both parties.",
    highlights: [
      "Plan on a closing attorney — the customary practice in Maine.",
      "Seller must provide the statutory Property Disclosure Statement.",
      "Transfer tax is split 50/50 between buyer and seller.",
    ],
    resources: [
      { label: "Maine Real Estate Commission", href: "https://www.maine.gov/pfr/professionallicensing/professions/real-estate" },
    ],
  },
  {
    code: "MD",
    name: "Maryland",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Maryland requires the deed and mortgage to be prepared by or under the supervision of an attorney (Md. Real Prop. §3-104), with attorney certification; settlement is attorney-involved.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property Disclosure and Disclaimer Statement",
    disclosureNote:
      "Maryland sellers must give buyers a Residential Property Disclosure and Disclaimer Statement, electing either to disclose known defects or to sell \"as is\" via disclaimer.",
    transferTaxNote:
      "Maryland levies state and county transfer taxes plus recordation tax; these are commonly split between buyer and seller and vary by county.",
    dualAgency: "banned",
    dualAgencyNote:
      "Maryland prohibits a single agent from representing both sides; the brokerage must instead assign separate designated agents (intra-company agency).",
    highlights: [
      "Deed must be attorney-prepared/certified; use an attorney-run settlement.",
      "Seller chooses to disclose or disclaim — read which box was used.",
      "Transfer and recordation taxes are often split; check county rules.",
    ],
    resources: [
      { label: "Maryland Real Estate Commission", href: "https://www.dllr.state.md.us/license/mrec/" },
    ],
  },
  {
    code: "MA",
    name: "Massachusetts",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Massachusetts is an attorney state: closings are conducted by a licensed attorney, who certifies title and oversees the conveyance.",
    disclosureRegime: "limited",
    disclosureNote:
      "Massachusetts leans caveat-emptor with no general statutory disclosure form, but a mandatory lead-paint disclosure applies to pre-1978 homes and brokers must disclose known material defects.",
    transferTaxNote:
      "Massachusetts charges deed excise (stamp) tax of about $4.56 per $1,000, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Massachusetts permits dual agency with written, informed consent given before signing an offer.",
    highlights: [
      "A closing attorney is required in Massachusetts.",
      "Caveat-emptor leaning: rely on your inspection; expect the lead-paint disclosure for older homes.",
      "Deed excise tax is customarily seller-paid.",
    ],
    resources: [
      { label: "Massachusetts Board of Registration of Real Estate Brokers", href: "https://www.mass.gov/orgs/board-of-registration-of-real-estate-brokers-and-salespersons" },
    ],
  },
  {
    code: "MI",
    name: "Michigan",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Michigan is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Disclosure Statement",
    disclosureNote:
      "Michigan law (MCL 565.951 et seq.) requires sellers to deliver a Seller's Disclosure Statement of property condition.",
    transferTaxNote:
      "Michigan charges state and county real-estate transfer taxes (about $8.60 per $1,000 combined), customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Michigan permits dual agency with the written consent of both parties.",
    highlights: [
      "Title company handles closing.",
      "Seller must provide the statutory Seller's Disclosure Statement.",
      "Transfer tax is customarily seller-paid.",
    ],
    resources: [
      { label: "Michigan Board of Real Estate Brokers & Salespersons (LARA)", href: "https://www.michigan.gov/lara/bureau-list/bpl/occ/prof/real-estate-brokers" },
    ],
  },
  {
    code: "MN",
    name: "Minnesota",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Minnesota is a title/escrow state: title companies and licensed closers handle closing; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Property Disclosure Statement",
    disclosureNote:
      "Minnesota law (Minn. Stat. §513.52 et seq.) requires sellers to provide a written disclosure of material facts; a standard Seller's Property Disclosure Statement is used.",
    transferTaxNote:
      "Minnesota charges a deed (mortgage registry and deed) tax of about $3.30 per $1,000, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Minnesota permits dual agency with the written consent of both buyer and seller.",
    highlights: [
      "Title company handles closing.",
      "Seller must disclose known material facts in writing.",
      "Deed tax is customarily seller-paid.",
    ],
    resources: [
      { label: "Minnesota Dept. of Commerce — Real Estate", href: "https://mn.gov/commerce/licensees/real-estate/" },
    ],
  },
  {
    code: "MS",
    name: "Mississippi",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Mississippi is an attorney state: an attorney prepares or oversees the deed and conducts/supervises closing.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Disclosure Statement",
    disclosureNote:
      "Mississippi law (Miss. Code §89-1-501 et seq.) requires sellers of residential property to deliver a Seller's Disclosure Statement.",
    transferTaxNote:
      "Mississippi has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Mississippi permits dual agency with the written, informed consent of both parties.",
    highlights: [
      "Use an attorney to prepare documents and close.",
      "Seller must provide the statutory disclosure statement.",
      "No transfer tax in Mississippi.",
    ],
    resources: [
      { label: "Mississippi Real Estate Commission", href: "https://www.mrec.ms.gov/" },
    ],
  },
  {
    code: "MO",
    name: "Missouri",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Missouri is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Seller's Disclosure Statement for Residential Property",
    disclosureNote:
      "Missouri sellers must disclose known material defects; the Missouri Realtors Seller's Disclosure Statement is the standard form used by custom.",
    transferTaxNote:
      "Missouri has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Missouri permits dual agency (and designated/transaction brokerage) with written disclosure and consent.",
    highlights: [
      "Title company handles closing.",
      "Expect a seller's disclosure statement by custom.",
      "No transfer tax in Missouri.",
    ],
    resources: [
      { label: "Missouri Real Estate Commission", href: "https://pr.mo.gov/realestate.asp" },
    ],
  },
  {
    code: "MT",
    name: "Montana",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Montana is a title/escrow state: title companies and escrow agents close transactions; attorneys are optional.",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Property Disclosure Statement",
    disclosureNote:
      "Montana has no single mandatory statutory disclosure form, but sellers must disclose known adverse material facts; a Realtor Property Disclosure Statement is commonly used.",
    transferTaxNote:
      "Montana has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Montana permits dual agency with the written, informed consent of both parties.",
    highlights: [
      "Title/escrow company handles closing.",
      "Sellers must disclose known adverse material facts.",
      "No transfer tax in Montana.",
    ],
    resources: [
      { label: "Montana Board of Realty Regulation", href: "https://boards.bsd.dli.mt.gov/realty-regulation" },
    ],
  },
  {
    code: "NE",
    name: "Nebraska",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Nebraska is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller Property Condition Disclosure Statement",
    disclosureNote:
      "Nebraska law (Neb. Rev. Stat. §76-2,120) requires sellers to complete a Seller Property Condition Disclosure Statement.",
    transferTaxNote:
      "Nebraska charges a documentary stamp tax of $2.25 per $1,000, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Nebraska permits dual agency with the written consent of both buyer and seller.",
    highlights: [
      "Title company handles closing.",
      "Seller must complete the statutory condition disclosure.",
      "Documentary stamp tax is customarily seller-paid.",
    ],
    resources: [
      { label: "Nebraska Real Estate Commission", href: "https://nrec.nebraska.gov/" },
    ],
  },
  {
    code: "NV",
    name: "Nevada",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Nevada is an escrow state: a neutral escrow/title company handles closing; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Real Property Disclosure Form",
    disclosureNote:
      "Nevada law (NRS 113) requires sellers to deliver a completed Seller's Real Property Disclosure Form at least 10 days before closing.",
    transferTaxNote:
      "Nevada charges a real-property transfer tax that varies by county, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Nevada permits dual agency only with the written consent of each party and assignment confirmation.",
    highlights: [
      "Escrow company runs closing.",
      "Seller must deliver the NRS 113 disclosure at least 10 days out.",
      "Transfer-tax rate depends on the county.",
    ],
    resources: [
      { label: "Nevada Real Estate Division", href: "https://red.nv.gov/" },
    ],
  },
  {
    code: "NH",
    name: "New Hampshire",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "New Hampshire is an attorney state: a licensed attorney customarily conducts closing and certifies title.",
    disclosureRegime: "written-disclosure",
    disclosureNote:
      "New Hampshire has no general mandatory disclosure form for resales, but sellers must disclose known material defects and specific disclosures (e.g., private water/sewer, radon, lead) are required.",
    transferTaxNote:
      "New Hampshire charges a real-estate transfer tax of $0.75 per $100 on each side, split equally between buyer and seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "New Hampshire permits disclosed dual agency with the written consent of both parties.",
    highlights: [
      "Plan on a closing attorney in New Hampshire.",
      "Expect specific disclosures (water/sewer, radon, lead) rather than one general form.",
      "Transfer tax is split 50/50 — budget for the buyer's half.",
    ],
    resources: [
      { label: "New Hampshire Real Estate Commission", href: "https://www.oplc.nh.gov/real-estate-commission" },
    ],
  },
  {
    code: "NJ",
    name: "New Jersey",
    closingPath: "either",
    attorneyRequiredAtClosing: false,
    closingNote:
      "New Jersey practice splits by region: attorneys customarily handle closings in North Jersey, while title-company closings are common in South Jersey. Attorney review of the contract (a 3-day window) is standard. Classified \"either.\"",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Seller's Property Condition Disclosure Statement",
    disclosureNote:
      "New Jersey case law requires sellers to disclose known latent material defects; a Seller's Property Condition Disclosure Statement is commonly used.",
    transferTaxNote:
      "New Jersey charges a Realty Transfer Fee (customarily seller-paid) plus, on higher-priced homes, a 1% \"mansion tax\" generally paid by the buyer.",
    dualAgency: "permitted",
    dualAgencyNote:
      "New Jersey permits dual agency with the written, informed consent of both buyer and seller.",
    highlights: [
      "Use the standard 3-day attorney-review period on the contract.",
      "North Jersey usually closes via attorney; South Jersey via title company.",
      "Buyers may owe the 1% mansion tax on homes $1M+.",
    ],
    resources: [
      { label: "New Jersey Real Estate Commission", href: "https://www.nj.gov/dobi/division_rec/index.htm" },
    ],
  },
  {
    code: "NM",
    name: "New Mexico",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "New Mexico is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Seller's Property Disclosure Statement",
    disclosureNote:
      "New Mexico has no single statutory disclosure form, but sellers must disclose known material defects; a Realtor association Seller's Property Disclosure Statement is standard.",
    transferTaxNote:
      "New Mexico has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "New Mexico permits dual agency with written disclosure and the consent of both parties.",
    highlights: [
      "Title company handles closing.",
      "Sellers must disclose known material defects.",
      "No transfer tax in New Mexico.",
    ],
    resources: [
      { label: "New Mexico Real Estate Commission", href: "https://www.rld.nm.gov/boards-and-commissions/individual-boards-and-commissions/real-estate-commission/" },
    ],
  },
  {
    code: "NY",
    name: "New York",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "New York is an attorney state: attorneys for both buyer and seller draft/negotiate the contract and conduct closing alongside the title company.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Property Condition Disclosure Statement",
    disclosureNote:
      "New York requires a Property Condition Disclosure Statement; sellers who do not deliver one historically gave the buyer a $500 credit, and 2024 amendments strengthened the disclosure obligation.",
    transferTaxNote:
      "New York charges a state transfer tax (customarily seller-paid) plus, in NYC and on higher-priced sales, a \"mansion tax\" paid by the buyer.",
    dualAgency: "permitted",
    dualAgencyNote:
      "New York permits dual agency (and designated agency with consent) with detailed written disclosure of the conflict.",
    highlights: [
      "Retain a real-estate attorney — standard and effectively required in NY.",
      "Expect the Property Condition Disclosure Statement.",
      "Buyers may owe the mansion tax on higher-priced homes (especially NYC).",
    ],
    resources: [
      { label: "New York Dept. of State — Division of Licensing (Real Estate)", href: "https://dos.ny.gov/real-estate-broker" },
    ],
  },
  {
    code: "NC",
    name: "North Carolina",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "North Carolina is an attorney state: a licensed attorney must conduct the closing and handle title and disbursement.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property and Owners' Association Disclosure Statement",
    disclosureNote:
      "North Carolina law (N.C.G.S. §47E) requires sellers to provide a Residential Property and Owners' Association Disclosure Statement.",
    transferTaxNote:
      "North Carolina charges an excise (transfer) tax of $1.00 per $500 of value, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "North Carolina permits dual agency (and designated agency) with the written consent of both parties.",
    highlights: [
      "A closing attorney is required in North Carolina.",
      "Seller must provide the statutory Residential Property/HOA disclosure.",
      "Excise tax is customarily seller-paid.",
    ],
    resources: [
      { label: "North Carolina Real Estate Commission", href: "https://www.ncrec.gov/" },
    ],
  },
  {
    code: "ND",
    name: "North Dakota",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "North Dakota is generally treated as an attorney-involved state for closings (with title companies also active); attorney involvement in document preparation is the norm.",
    disclosureRegime: "limited",
    disclosureNote:
      "North Dakota leans caveat-emptor with no mandatory statutory disclosure form, though sellers cannot fraudulently conceal known defects. A Realtor disclosure form is often used by custom.",
    transferTaxNote:
      "North Dakota has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "North Dakota permits dual agency with the written consent of both buyer and seller.",
    highlights: [
      "Attorney involvement in closing/documents is customary.",
      "Caveat-emptor leaning: rely on your inspection.",
      "No transfer tax in North Dakota.",
    ],
    resources: [
      { label: "North Dakota Real Estate Commission", href: "https://www.realestatend.org/" },
    ],
  },
  {
    code: "OH",
    name: "Ohio",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Ohio is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property Disclosure Form",
    disclosureNote:
      "Ohio law (R.C. §5302.30) requires sellers to provide the state Residential Property Disclosure Form.",
    transferTaxNote:
      "Ohio charges a conveyance fee (state $1 per $1,000 plus optional county fee), customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Ohio permits dual agency with the written consent of both parties and brokerage disclosure.",
    highlights: [
      "Title company handles closing.",
      "Seller must provide the state Residential Property Disclosure Form.",
      "Conveyance fee is customarily seller-paid.",
    ],
    resources: [
      { label: "Ohio Division of Real Estate & Professional Licensing", href: "https://com.ohio.gov/divisions-and-programs/real-estate-and-professional-licensing/real-estate-and-professional-licensing" },
    ],
  },
  {
    code: "OK",
    name: "Oklahoma",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Oklahoma is a title/escrow state: title companies close transactions, with attorney title examination common; a closing attorney is not required.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property Condition Disclosure Statement",
    disclosureNote:
      "Oklahoma's Residential Property Condition Disclosure Act requires sellers to deliver a Residential Property Condition Disclosure Statement.",
    transferTaxNote:
      "Oklahoma charges a documentary stamp tax of $0.75 per $500 of value, customarily paid by the seller.",
    dualAgency: "banned",
    dualAgencyNote:
      "Oklahoma abolished dual agency in 2000; brokers act as single-party brokers or transaction brokers and there is no designated agency.",
    highlights: [
      "Title company handles closing.",
      "Seller must provide the statutory condition disclosure statement.",
      "Documentary stamp tax is customarily seller-paid.",
    ],
    resources: [
      { label: "Oklahoma Real Estate Commission", href: "https://oklahoma.gov/orec.html" },
    ],
  },
  {
    code: "OR",
    name: "Oregon",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Oregon is an escrow state: a neutral escrow company handles closing; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Property Disclosure Statement",
    disclosureNote:
      "Oregon law (ORS 105.464) requires sellers to deliver a Seller's Property Disclosure Statement, which the buyer may use to revoke within a set period.",
    transferTaxNote:
      "Oregon prohibits real-estate transfer taxes statewide (Washington County's pre-existing tax is the lone exception); otherwise none.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Oregon permits disclosed dual agency with written consent (note: Oregon separately bans buyer \"love letters\").",
    highlights: [
      "Escrow company runs closing.",
      "Seller must provide the ORS 105.464 disclosure; note your revocation window.",
      "No transfer tax except in Washington County.",
    ],
    resources: [
      { label: "Oregon Real Estate Agency", href: "https://www.oregon.gov/rea/Pages/index.aspx" },
    ],
  },
  {
    code: "PA",
    name: "Pennsylvania",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Pennsylvania is a title/escrow state: title companies handle most closings; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Property Disclosure Statement",
    disclosureNote:
      "Pennsylvania's Real Estate Seller Disclosure Law (68 Pa.C.S. §7301 et seq.) requires sellers to complete a Seller's Property Disclosure Statement.",
    transferTaxNote:
      "Pennsylvania charges state plus local realty transfer taxes (commonly 2% combined), customarily split equally between buyer and seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Pennsylvania permits dual agency (and designated agency) with the written consent of both parties.",
    highlights: [
      "Title company handles closing.",
      "Seller must complete the statutory disclosure statement.",
      "Transfer tax is commonly split 50/50 — budget for the buyer's half.",
    ],
    resources: [
      { label: "Pennsylvania State Real Estate Commission", href: "https://www.pa.gov/agencies/dos/programs/professional-licensing/boards-commissions/real-estate-commission.html" },
    ],
  },
  {
    code: "RI",
    name: "Rhode Island",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Rhode Island is an attorney state: a licensed attorney conducts closing and handles title and conveyance documents.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Real Estate Sales Disclosure Form",
    disclosureNote:
      "Rhode Island law (R.I.G.L. §5-20.8) requires sellers to deliver a Real Estate Sales Disclosure Form covering property condition.",
    transferTaxNote:
      "Rhode Island charges a real-estate conveyance tax of about $2.30 per $500, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Rhode Island permits dual agency with the written, informed consent of both buyer and seller.",
    highlights: [
      "A closing attorney is required in Rhode Island.",
      "Seller must provide the statutory Real Estate Sales Disclosure Form.",
      "Conveyance tax is customarily seller-paid.",
    ],
    resources: [
      { label: "Rhode Island Real Estate Division (DBR)", href: "https://dbr.ri.gov/commercial-licensing/real-estate" },
    ],
  },
  {
    code: "SC",
    name: "South Carolina",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "South Carolina is an attorney state: the Supreme Court requires a licensed attorney to supervise the closing, including title work and disbursement.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property Condition Disclosure Statement",
    disclosureNote:
      "South Carolina law (S.C. Code §27-50-10 et seq.) requires sellers to provide a Residential Property Condition Disclosure Statement.",
    transferTaxNote:
      "South Carolina charges a deed recording fee (transfer tax) of about $3.70 per $1,000, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "South Carolina permits dual agency with the written consent of both parties.",
    highlights: [
      "An attorney must supervise the closing in South Carolina.",
      "Seller must provide the statutory condition disclosure statement.",
      "Deed recording fee is customarily seller-paid.",
    ],
    resources: [
      { label: "South Carolina Real Estate Commission (LLR)", href: "https://llr.sc.gov/re/" },
    ],
  },
  {
    code: "SD",
    name: "South Dakota",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "South Dakota is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Property Condition Disclosure Statement",
    disclosureNote:
      "South Dakota law (SDCL §43-4-37 et seq.) requires sellers to deliver a Seller's Property Condition Disclosure Statement.",
    transferTaxNote:
      "South Dakota charges a real-estate transfer fee of $0.50 per $500 of value, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "South Dakota permits dual agency with the written consent of both buyer and seller.",
    highlights: [
      "Title company handles closing.",
      "Seller must provide the statutory condition disclosure statement.",
      "Transfer fee is modest and customarily seller-paid.",
    ],
    resources: [
      { label: "South Dakota Real Estate Commission", href: "https://dlr.sd.gov/realestate/default.aspx" },
    ],
  },
  {
    code: "TN",
    name: "Tennessee",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Tennessee is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Tennessee Residential Property Condition Disclosure",
    disclosureNote:
      "Tennessee law (T.C.A. §66-5-201 et seq.) requires sellers to provide a Residential Property Condition Disclosure.",
    transferTaxNote:
      "Tennessee charges a realty transfer tax of $0.37 per $100 of value, customarily paid by the buyer.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Tennessee permits disclosed dual agency only with the written consent of both parties; many brokers instead use designated agents.",
    highlights: [
      "Title company handles closing.",
      "Seller must provide the statutory condition disclosure.",
      "Transfer tax is customarily buyer-paid in Tennessee — budget for it.",
    ],
    resources: [
      { label: "Tennessee Real Estate Commission", href: "https://www.tn.gov/commerce/regboards/trec.html" },
    ],
  },
  {
    code: "TX",
    name: "Texas",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Texas is a title/escrow state: title companies close transactions using promulgated TREC forms; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller's Disclosure Notice",
    disclosureNote:
      "Texas law (Tex. Prop. Code §5.008) requires sellers of residential property to deliver a Seller's Disclosure Notice of known conditions.",
    transferTaxNote:
      "Texas has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "banned",
    dualAgencyNote:
      "Texas prohibits dual agency; brokers act as intermediaries (optionally with separate appointed associates) rather than dual agents.",
    highlights: [
      "Title company handles closing with state-promulgated TREC contract forms.",
      "Seller must deliver the statutory Seller's Disclosure Notice.",
      "No transfer tax in Texas.",
    ],
    resources: [
      { label: "Texas Real Estate Commission", href: "https://www.trec.texas.gov/" },
    ],
  },
  {
    code: "UT",
    name: "Utah",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Utah is a title/escrow state: title companies close transactions using state-approved forms; attorneys are optional.",
    disclosureRegime: "written-disclosure",
    disclosureFormName: "Seller's Property Condition Disclosure",
    disclosureNote:
      "Utah has no single statutory disclosure form, but sellers must disclose known material defects; a Seller's Property Condition Disclosure is standard by custom.",
    transferTaxNote:
      "Utah has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Utah permits dual agency (\"limited agency\") with the written consent of both parties.",
    highlights: [
      "Title company handles closing.",
      "Sellers must disclose known material defects.",
      "No transfer tax in Utah.",
    ],
    resources: [
      { label: "Utah Division of Real Estate", href: "https://realestate.utah.gov/" },
    ],
  },
  {
    code: "VT",
    name: "Vermont",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "Vermont is an attorney state: a licensed attorney customarily conducts closing, certifies title, and prepares conveyance documents.",
    disclosureRegime: "written-disclosure",
    disclosureNote:
      "Vermont has no mandatory statewide disclosure form for resales, but sellers must disclose known material defects; a Realtor association property disclosure form is commonly used.",
    transferTaxNote:
      "Vermont charges a property transfer tax (graduated, with a lower rate on the first portion for a principal residence), customarily paid by the buyer.",
    dualAgency: "banned",
    dualAgencyNote:
      "Vermont prohibits dual agency; a licensee may not represent both buyer and seller in the same transaction.",
    highlights: [
      "Plan on a closing attorney in Vermont.",
      "Sellers must disclose known material defects (no single state form).",
      "Transfer tax is customarily buyer-paid — budget for it.",
    ],
    resources: [
      { label: "Vermont Office of Professional Regulation — Real Estate Commission", href: "https://sos.vermont.gov/real-estate-commission/" },
    ],
  },
  {
    code: "VA",
    name: "Virginia",
    closingPath: "either",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Virginia is largely a title/escrow (settlement-agent) state — title/settlement companies may close under CRESPA — but attorney closings are also common, so this is classified \"either.\"",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Residential Property Disclosure Statement",
    disclosureNote:
      "Virginia is a caveat-emptor state but the Residential Property Disclosure Act requires sellers to deliver a Residential Property Disclosure Statement directing buyers to investigate the property's condition themselves.",
    transferTaxNote:
      "Virginia charges a state recordation/grantor tax; the grantor's (seller's) tax is seller-paid while the recordation tax is customarily paid by the buyer.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Virginia permits dual agency (and designated agency) with the written, informed consent of both parties.",
    highlights: [
      "A licensed settlement agent or an attorney can close — your choice.",
      "Caveat-emptor: the state disclosure form mainly tells you to inspect.",
      "Buyers customarily pay the recordation tax.",
    ],
    resources: [
      { label: "Virginia Real Estate Board (DPOR)", href: "https://www.dpor.virginia.gov/Boards/Real-Estate" },
    ],
  },
  {
    code: "WA",
    name: "Washington",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Washington is an escrow state: a licensed escrow company handles closing; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Seller Disclosure Statement (Form 17)",
    disclosureNote:
      "Washington law (RCW 64.06) requires sellers to deliver the Seller Disclosure Statement (Form 17), giving the buyer a rescission right within a set period.",
    transferTaxNote:
      "Washington charges a graduated real-estate excise tax (REET), customarily paid by the seller, plus local add-ons in some areas.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Washington permits dual agency with the written consent of both parties under its statutory brokerage relationships law.",
    highlights: [
      "Escrow company runs closing.",
      "Seller must deliver Form 17; note your rescission window.",
      "REET is customarily seller-paid but rates are graduated by price.",
    ],
    resources: [
      { label: "Washington State Dept. of Licensing — Real Estate", href: "https://dol.wa.gov/professionals-and-businesses/real-estate-brokers" },
    ],
  },
  {
    code: "WV",
    name: "West Virginia",
    closingPath: "attorney",
    attorneyRequiredAtClosing: true,
    closingNote:
      "West Virginia is an attorney state: an attorney conducts the closing and prepares the conveyance documents.",
    disclosureRegime: "limited",
    disclosureNote:
      "West Virginia leans caveat-emptor with no mandatory statewide disclosure form, though sellers cannot fraudulently conceal known defects. Inspect thoroughly.",
    transferTaxNote:
      "West Virginia charges an excise (transfer) tax (state plus optional county portion), customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "West Virginia permits dual agency with the written, informed consent of both buyer and seller.",
    highlights: [
      "Use a closing attorney in West Virginia.",
      "Caveat-emptor leaning: rely on your inspection, not seller disclosures.",
      "Transfer/excise tax is customarily seller-paid.",
    ],
    resources: [
      { label: "West Virginia Real Estate Commission", href: "https://rec.wv.gov/" },
    ],
  },
  {
    code: "WI",
    name: "Wisconsin",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Wisconsin is a title/escrow state: title companies close transactions using state-approved forms; attorneys are optional.",
    disclosureRegime: "statutory-form",
    disclosureFormName: "Real Estate Condition Report",
    disclosureNote:
      "Wisconsin law (Wis. Stat. §709) requires sellers of residential property to provide a Real Estate Condition Report.",
    transferTaxNote:
      "Wisconsin charges a real-estate transfer fee of $3.00 per $1,000 of value, customarily paid by the seller.",
    dualAgency: "permitted",
    dualAgencyNote:
      "Wisconsin permits a broker to work with both parties as a \"multiple representation\" relationship with written disclosure and consent.",
    highlights: [
      "Title company handles closing with state-approved forms.",
      "Seller must provide the Real Estate Condition Report.",
      "Transfer fee is customarily seller-paid.",
    ],
    resources: [
      { label: "Wisconsin Real Estate Examining Board (DSPS)", href: "https://dsps.wi.gov/Pages/Professions/RealEstateBroker/Default.aspx" },
    ],
  },
  {
    code: "WY",
    name: "Wyoming",
    closingPath: "escrow",
    attorneyRequiredAtClosing: false,
    closingNote:
      "Wyoming is a title/escrow state: title companies close transactions; attorneys are optional.",
    disclosureRegime: "limited",
    disclosureNote:
      "Wyoming leans caveat-emptor with no mandatory statewide disclosure form, though sellers cannot fraudulently conceal known defects. A Realtor disclosure form is often used by custom.",
    transferTaxNote:
      "Wyoming has no real-estate transfer tax; expect only recording fees.",
    dualAgency: "banned",
    dualAgencyNote:
      "Wyoming prohibits dual agency; licensees work as agents for one party or as neutral intermediaries instead.",
    highlights: [
      "Title company handles closing.",
      "Caveat-emptor leaning: lean on your inspection contingency.",
      "No transfer tax in Wyoming.",
    ],
    resources: [
      { label: "Wyoming Real Estate Commission", href: "https://realestate.wyo.gov/" },
    ],
  },
];

/**
 * Look up a state profile by two-letter postal code (case-insensitive).
 * Returns `undefined` if no jurisdiction matches.
 */
export function getStateProfile(code: string): StateProfile | undefined {
  const normalized = code.trim().toUpperCase();
  return stateProfiles.find((profile) => profile.code === normalized);
}

/**
 * Return all state profiles sorted alphabetically by full jurisdiction name.
 */
export function getAllStateProfiles(): StateProfile[] {
  return [...stateProfiles].sort((a, b) => a.name.localeCompare(b.name));
}
