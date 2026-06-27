import{j as a}from"./jsx-runtime-EKYJJIwR.js";import{r as u}from"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const A=1000000n;function h(e,o){return e*BigInt(o)/10000n}function r(e){return`$${(Number(e)/Number(A)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}function y(e){return`${(e/100).toFixed(2)}%`}function E(e){if(e.type==="freelancer"){const{invoiceAmount:t,discountBps:s}=e,i=h(t,s),d=t-i;return[{label:"Invoice amount",value:r(t)},{label:`Discount (${y(s)})`,value:`−${r(i)}`},{label:"You receive",value:r(d)}]}if(e.type==="lp"){const{amountSent:t,discountBps:s}=e,i=h(t,s),d=(s/100).toFixed(2);return[{label:"You sent",value:r(t)},{label:"Discount earned",value:`+${r(i)}`},{label:"Net yield",value:`${d}%`}]}const{discountAmount:o,protocolFeeBps:p}=e,c=h(o,p),l=o-c;return[{label:"Discount",value:r(o)},{label:`Protocol fee (${y(p)})`,value:`−${r(c)}`},{label:"LP yield",value:r(l)}]}function j({breakdown:e,children:o,className:p=""}){const[c,l]=u.useState(!1),t=u.useRef(null),s=u.useCallback(()=>l(!0),[]),i=u.useCallback(()=>l(!1),[]),d=u.useCallback(()=>l(n=>!n),[]);u.useEffect(()=>{if(!c)return;const n=g=>{t.current&&!t.current.contains(g.target)&&l(!1)};return document.addEventListener("mousedown",n),document.addEventListener("touchstart",n),()=>{document.removeEventListener("mousedown",n),document.removeEventListener("touchstart",n)}},[c]);const w=E(e);return a.jsxs("span",{ref:t,className:`relative inline-block cursor-help ${p}`,onMouseEnter:s,onMouseLeave:i,onTouchStart:d,"data-testid":"amount-tooltip-wrapper",children:[o,c&&a.jsx("span",{role:"tooltip","data-testid":"amount-tooltip-content",className:"absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[200] min-w-[220px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm",children:a.jsx("table",{className:"w-full border-collapse",children:a.jsx("tbody",{children:w.map(({label:n,value:g},v)=>a.jsxs("tr",{className:v===w.length-1?"font-semibold border-t border-gray-100":"",children:[a.jsx("td",{className:"py-0.5 pr-4 text-gray-600 whitespace-nowrap",children:n}),a.jsx("td",{className:"py-0.5 text-right whitespace-nowrap",children:g})]},v))})})})]})}j.__docgenInfo={description:"",methods:[],displayName:"AmountTooltip",props:{breakdown:{required:!0,tsType:{name:"union",raw:"FreelancerBreakdown | LPBreakdown | ProtocolBreakdown",elements:[{name:"FreelancerBreakdown"},{name:"LPBreakdown"},{name:"ProtocolBreakdown"}]},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'""',computed:!1}}}};const C={title:"Components/AmountTooltip",component:j,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{breakdown:{control:"object"}}},m={args:{breakdown:{type:"freelancer",invoiceAmount:1000000000n,discountBps:300},children:"$1,000.00"}},b={args:{breakdown:{type:"lp",amountSent:1000000000n,discountBps:300},children:"$1,000.00"}},f={args:{breakdown:{type:"protocol",discountAmount:30000000n,protocolFeeBps:1e3},children:"$30.00"}};var x,B,$;m.parameters={...m.parameters,docs:{...(x=m.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    breakdown: {
      type: 'freelancer',
      invoiceAmount: 1000000000n,
      discountBps: 300
    },
    children: '$1,000.00'
  }
}`,...($=(B=m.parameters)==null?void 0:B.docs)==null?void 0:$.source}}};var k,N,L;b.parameters={...b.parameters,docs:{...(k=b.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    breakdown: {
      type: 'lp',
      amountSent: 1000000000n,
      discountBps: 300
    },
    children: '$1,000.00'
  }
}`,...(L=(N=b.parameters)==null?void 0:N.docs)==null?void 0:L.source}}};var P,F,S;f.parameters={...f.parameters,docs:{...(P=f.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    breakdown: {
      type: 'protocol',
      discountAmount: 30000000n,
      protocolFeeBps: 1000
    },
    children: '$30.00'
  }
}`,...(S=(F=f.parameters)==null?void 0:F.docs)==null?void 0:S.source}}};const I=["Freelancer","LP","Protocol"];export{m as Freelancer,b as LP,f as Protocol,I as __namedExportsOrder,C as default};
