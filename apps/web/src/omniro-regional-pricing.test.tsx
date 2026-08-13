import React from"react";
import{renderToStaticMarkup}from"react-dom/server";
import{describe,expect,it,vi}from"vitest";
import type{RegionalPricingDto,Session}from"./api.js";
import{RegionalPricingWorkspaceView}from"./omniro-regional-pricing-workspace.js";

const session=(permissions:string[]):Session=>({accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reviewer"},permissions});
const profile:RegionalPricingDto={id:"pricing-1",code:"PL-WAW",title:"Warsaw verified rates",revisionId:"revision-1",revisionNumber:1,status:"ready_for_approval",version:2,currency:"PLN",countryCode:"PL",regionCode:"mazowieckie",city:"Warsaw",effectiveFrom:"2026-01-01",effectiveTo:"2026-12-31",customerCategory:"commercial",commercialProfile:"standard",priceSource:"Verified supplier quotations",overheadRules:[{code:"OH",percent:10}],taxRule:{code:"VAT",percent:23,mode:"standard"},marginRules:[{code:"MARGIN",percent:20}],discountRules:[],adjustmentRules:[],calculationVersion:"regional-pricing-v1",entries:[{id:"entry-1",priceKind:"material",referenceCode:"paint",description:"Interior paint",rateType:"unit",unitCode:"L",unitPrice:18,priceVariant:"reference",validFrom:"2026-01-01",sourceReference:"supplier-quote-42",metadata:{}}]};
const render=(value?:RegionalPricingDto,permissions=["regional_pricing.read","regional_pricing.approve"],snapshot?:any)=>renderToStaticMarkup(<RegionalPricingWorkspaceView session={session(permissions)} profile={value} snapshot={snapshot} busy={false} onReview={vi.fn()} onApprove={vi.fn()} onClose={vi.fn()}/>);

describe("Regional Pricing workspace",()=>{
 it("shows real scope, sourced rates, modifiers, and the human approval gate",()=>{const html=render(profile);expect(html).toContain("Warsaw verified rates");expect(html).toContain("Verified supplier quotations");expect(html).toContain("supplier-quote-42");expect(html).toContain("HUMAN APPROVAL · REGIONAL PRICING");expect(html).toContain("Commercial Estimate");});
 it("preserves read-only authority",()=>{const html=render(profile,["regional_pricing.read"]);expect(html).toContain("does not have regional_pricing.approve");expect(html).not.toContain("HUMAN APPROVAL · REGIONAL PRICING");});
 it("exposes review only to the existing review permission",()=>{const draft={...profile,status:"draft"as const};expect(render(draft,["regional_pricing.read","regional_pricing.review"])).toContain("CHECK AUTHORITATIVE READINESS");expect(render(draft,["regional_pricing.read"])).toContain("regional_pricing.review is required")});
 it("shows the approved immutable snapshot without claiming an estimate",()=>{const html=render({...profile,status:"approved"},["regional_pricing.read","regional_pricing.snapshots.read"],{id:"snapshot-1",contentFingerprint:"a".repeat(64),schemaVersion:"regional-pricing-v1",revisionNumber:1});expect(html).toContain("Approved immutable pricing snapshot");expect(html).toContain("snapshot-1");expect(html).toContain("Commercial Estimate: not created");});
 it("does not expose immutable snapshot content without snapshot permission",()=>{const html=render({...profile,status:"approved"},["regional_pricing.read"]);expect(html).toContain("regional_pricing.snapshots.read is required");expect(html).not.toContain("Approved immutable pricing snapshot")});
 it("shows a truthful empty state",()=>{expect(render(undefined)).toContain("OMNIRO has not inferred market prices")});
});
