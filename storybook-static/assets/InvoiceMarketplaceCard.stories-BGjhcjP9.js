import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{r as $}from"./iframe-Dx6cFdWX.js";import{L as ee}from"./link-QQA07YkG.js";import{a as ae,c as re}from"./format-BWVjbcin.js";import{D as te}from"./DueDateCountdown-DyQS1siH.js";import{R as se}from"./RiskBadge-4n0dhmBw.js";import{O as ne}from"./OracleBadge-Jx9llr0F.js";import{A as oe}from"./AuctionRateTicker-CSMikBUC.js";import{f as ie}from"./formatTokenAmount-2i9m6gHE.js";import"./preload-helper-Dp1pzeXC.js";import"./get-segment-param-uZ6tT2eb.js";import"./_interop_require_default-Dl4696rw.js";function ce(a,p){if(a===0n)return"0.00";const f=re(a,p);return(Number(f)/Number(a)*100).toFixed(2)}function E({invoice:a,tokenMap:p,defaultToken:f,payerScore:r,payerRisk:Z,onFund:G,isWalletConnected:J,payerOracleVerified:K=!1,auctionMeta:b,minReputation:X=0,isBookmarked:x=!1,onBookmark:B}){const[z,Q]=$.useState(!1),t=p.get(a.token??"")??f,Y=(t==null?void 0:t.symbol)??"USDC",y=!!(r&&r.score<X&&!z);return e.jsxs("article",{"data-testid":"invoice-card",className:`invoice rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 hover:border-primary/30 hover:shadow-md transition-all relative ${y?"opacity-50 grayscale-[0.5]":""}`,children:[y&&e.jsx("div",{className:"absolute inset-x-0 h-full w-full z-10 flex flex-col items-center justify-center bg-surface-container-lowest/40 backdrop-blur-[1px] rounded-2xl pointer-events-none"}),e.jsxs("div",{className:"flex items-start justify-between mb-3",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-lg font-bold text-primary",children:["#",a.id.toString()]}),e.jsx("span",{className:"ml-2 text-xs text-on-surface-variant",children:Y})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[B&&e.jsx("button",{"aria-label":x?"Remove bookmark":"Bookmark invoice",onClick:()=>B(a.id.toString(),!x),className:"text-on-surface-variant hover:text-primary transition-colors",children:e.jsx("span",{className:"material-symbols-outlined text-[20px]",children:x?"bookmark":"bookmark_border"})}),e.jsx(se,{risk:Z,score:r})]})]}),e.jsxs("div",{className:"space-y-2 mb-4",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{className:"text-on-surface-variant",children:"Amount"}),e.jsx("span",{className:"font-bold",children:t?ie(a.amount,t):a.amount.toString()})]}),e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{className:"text-on-surface-variant",children:"Discount"}),e.jsxs("span",{className:"font-bold",children:[(a.discount_rate/100).toFixed(2),"%"]})]}),e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{className:"text-on-surface-variant",children:"Effective Yield"}),e.jsxs("span",{className:"font-bold text-green-600",children:[ce(a.amount,a.discount_rate),"%"]})]}),e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{className:"text-on-surface-variant",children:"Due Date"}),e.jsx(te,{dueDate:a.due_date})]})]}),e.jsxs("div",{className:"flex items-center justify-between text-xs text-on-surface-variant mb-4",children:[e.jsxs("span",{children:["Submitter:"," ",e.jsx(ee,{href:`/profile/${a.freelancer}`,className:"text-primary hover:underline font-mono",children:ae(a.freelancer)})]}),r!==null&&e.jsxs("span",{children:["Reputation: ",e.jsx("span",{className:"font-bold text-on-surface",children:r.score})]}),e.jsx(ne,{verified:K})]}),b&&e.jsx("div",{className:"mb-4",children:e.jsx(oe,{...b})}),e.jsx("div",{className:"relative z-20",children:y?e.jsxs("div",{className:"space-y-3",children:[e.jsx("button",{disabled:!0,title:"Payer reputation below your minimum threshold",className:"w-full py-2.5 rounded-xl font-bold text-sm bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70",children:"Threshold Not Met"}),e.jsx("button",{onClick:()=>Q(!0),className:"w-full py-2.5 rounded-xl font-bold text-xs text-primary hover:bg-primary/5 transition-colors border border-primary/20",children:"Fund Anyway"})]}):J?e.jsx("button",{onClick:()=>G(a),className:"w-full py-2.5 rounded-xl font-bold text-sm bg-primary text-surface-container-lowest hover:bg-primary/90 transition-all active:scale-95",children:"Fund Invoice"}):e.jsx("button",{disabled:!0,className:"w-full py-2.5 rounded-xl font-bold text-sm bg-surface-variant text-on-surface-variant cursor-not-allowed",children:"Connect Wallet to Fund"})})]})}E.__docgenInfo={description:"",methods:[],displayName:"InvoiceMarketplaceCard",props:{invoice:{required:!0,tsType:{name:"Invoice"},description:""},tokenMap:{required:!0,tsType:{name:"Map",elements:[{name:"string"},{name:"TokenMetadata"}],raw:"Map<string, TokenMetadata>"},description:""},defaultToken:{required:!0,tsType:{name:"union",raw:"TokenMetadata | null",elements:[{name:"TokenMetadata"},{name:"null"}]},description:""},payerScore:{required:!0,tsType:{name:"union",raw:"PayerScore | null",elements:[{name:"PayerScore"},{name:"null"}]},description:""},payerRisk:{required:!0,tsType:{name:"RiskLevel"},description:""},onFund:{required:!0,tsType:{name:"signature",type:"function",raw:"(invoice: Invoice) => void",signature:{arguments:[{type:{name:"Invoice"},name:"invoice"}],return:{name:"void"}}},description:""},isWalletConnected:{required:!0,tsType:{name:"boolean"},description:""},payerOracleVerified:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},auctionMeta:{required:!1,tsType:{name:"AuctionMeta"},description:""},minReputation:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"0",computed:!1}},isBookmarked:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onBookmark:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string, bookmarked: boolean) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"boolean"},name:"bookmarked"}],return:{name:"void"}}},description:""}}};const le=()=>()=>{},u="CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",g={id:BigInt(42),status:"Pending",freelancer:"GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",payer:"GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBVN",amount:BigInt(125e6),due_date:BigInt(Math.floor(Date.now()/1e3)+86400*30),discount_rate:250,token:u},de=new Map([[u,{contractId:u,name:"USD Coin",symbol:"USDC",decimals:6}]]),me={contractId:u,name:"USD Coin",symbol:"USDC",decimals:6},ke={title:"Components/InvoiceMarketplaceCard",component:E,parameters:{layout:"padded",backgrounds:{default:"light"}},tags:["autodocs"],decorators:[a=>e.jsx("div",{style:{maxWidth:400},children:e.jsx(a,{})})],args:{invoice:g,tokenMap:de,defaultToken:me,payerScore:{score:85,settled_on_time:14,defaults:1},payerRisk:"Low",onFund:le(),isWalletConnected:!0,minReputation:0}},s={},n={args:{isWalletConnected:!1}},o={args:{payerScore:{score:20,settled_on_time:2,defaults:8},payerRisk:"High"}},i={name:"Below Reputation Threshold",args:{payerScore:{score:40,settled_on_time:5,defaults:3},payerRisk:"Medium",minReputation:70}},c={args:{payerOracleVerified:!0,payerRisk:"Low"}},l={args:{invoice:{...g,amount:BigInt(1e10),discount_rate:500}}},d={args:{invoice:{...g,due_date:BigInt(Math.floor(Date.now()/1e3)+86400*3)}}},m={args:{payerScore:null,payerRisk:"Unknown"}};var h,v,A;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:"{}",...(A=(v=s.parameters)==null?void 0:v.docs)==null?void 0:A.source}}};var j,k,w;n.parameters={...n.parameters,docs:{...(j=n.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    isWalletConnected: false
  }
}`,...(w=(k=n.parameters)==null?void 0:k.docs)==null?void 0:w.source}}};var N,S,_;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    payerScore: {
      score: 20,
      settled_on_time: 2,
      defaults: 8
    },
    payerRisk: 'High'
  }
}`,...(_=(S=o.parameters)==null?void 0:S.docs)==null?void 0:_.source}}};var T,R,D;i.parameters={...i.parameters,docs:{...(T=i.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'Below Reputation Threshold',
  args: {
    payerScore: {
      score: 40,
      settled_on_time: 5,
      defaults: 3
    },
    payerRisk: 'Medium',
    minReputation: 70
  }
}`,...(D=(R=i.parameters)==null?void 0:R.docs)==null?void 0:D.source}}};var I,C,M;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    payerOracleVerified: true,
    payerRisk: 'Low'
  }
}`,...(M=(C=c.parameters)==null?void 0:C.docs)==null?void 0:M.source}}};var q,U,F;l.parameters={...l.parameters,docs:{...(q=l.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    invoice: {
      ...baseInvoice,
      amount: BigInt(10_000_000_000),
      discount_rate: 500
    }
  }
}`,...(F=(U=l.parameters)==null?void 0:U.docs)==null?void 0:F.source}}};var L,O,W;d.parameters={...d.parameters,docs:{...(L=d.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    invoice: {
      ...baseInvoice,
      due_date: BigInt(Math.floor(Date.now() / 1000) + 86400 * 3)
    }
  }
}`,...(W=(O=d.parameters)==null?void 0:O.docs)==null?void 0:W.source}}};var P,V,H;m.parameters={...m.parameters,docs:{...(P=m.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    payerScore: null,
    payerRisk: 'Unknown'
  }
}`,...(H=(V=m.parameters)==null?void 0:V.docs)==null?void 0:H.source}}};const we=["Default","WalletDisconnected","HighRiskPayer","LowReputationFiltered","OracleVerified","LargeInvoice","ShortDueDate","NoPayerScore"];export{s as Default,o as HighRiskPayer,l as LargeInvoice,i as LowReputationFiltered,m as NoPayerScore,c as OracleVerified,d as ShortDueDate,n as WalletDisconnected,we as __namedExportsOrder,ke as default};
