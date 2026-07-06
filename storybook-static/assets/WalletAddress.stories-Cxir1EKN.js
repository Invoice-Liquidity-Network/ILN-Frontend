import{j as s}from"./jsx-runtime-EKYJJIwR.js";import{r as l}from"./iframe-Dx6cFdWX.js";import{a as ae}from"./federation-CIR_Uogw.js";import{a as te}from"./format-BWVjbcin.js";import{c as J}from"./createLucideIcon-DEly7TmW.js";import"./preload-helper-Dp1pzeXC.js";import"./horizonClient-kL7zlhwC.js";import"./constants-Blzo2VsG.js";import"./formatTokenAmount-2i9m6gHE.js";/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],oe=J("check",re);/**
 * @license lucide-react v1.21.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],ne=J("copy",de);function i({address:e,hideCopy:U=!1,className:p="",truncate:X=te}){const[c,u]=l.useState(null),[Y,A]=l.useState(!!e),[f,y]=l.useState(!1);if(l.useEffect(()=>{if(!e)return;let m=!1;return ae(e).then(se=>{m||(u(se),A(!1))}).catch(()=>{m||(u(e),A(!1))}),()=>{m=!0}},[e]),!e)return s.jsx("span",{className:p,"data-testid":"wallet-address-display"});if(Y)return s.jsx("span",{className:`skeleton-cell inline-block h-4 w-32 align-middle ${p}`,"aria-busy":"true","aria-label":"Resolving wallet address","data-testid":"wallet-address-skeleton"});const Z=typeof c=="string"&&c.includes("*")&&c!==e?c:X(e),ee=async()=>{try{await navigator.clipboard.writeText(e),y(!0),window.setTimeout(()=>y(!1),1500)}catch{}};return s.jsxs("span",{className:`inline-flex items-center gap-1 font-mono ${p}`,children:[s.jsx("span",{title:e,"data-testid":"wallet-address-display",children:Z}),!U&&s.jsx("button",{type:"button",onClick:ee,"aria-label":f?"Address copied":"Copy wallet address",className:"rounded p-1 text-on-surface-variant transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary",children:f?s.jsx(oe,{className:"h-3.5 w-3.5"}):s.jsx(ne,{className:"h-3.5 w-3.5"})})]})}i.__docgenInfo={description:`WalletAddress renders a Stellar G-address as a human-readable identifier when
a Federation address is discoverable, falling back to a truncated G-address.

Resolution is cached at the module level (see resolveFederatedAddress), so
repeated renders for the same address never re-hit Horizon within a session.`,methods:[],displayName:"WalletAddress",props:{address:{required:!0,tsType:{name:"string"},description:""},hideCopy:{required:!1,tsType:{name:"boolean"},description:"When true, show only the resolved/truncated text without the copy icon.",defaultValue:{value:"false",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Optional className applied to the outer span.",defaultValue:{value:'""',computed:!1}},truncate:{required:!1,tsType:{name:"signature",type:"function",raw:"(address: string) => string",signature:{arguments:[{type:{name:"string"},name:"address"}],return:{name:"string"}}},description:"Override the truncation/formatting of the fallback G-address.",defaultValue:{value:"formatAddress",computed:!0}}}};const K="GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",Q="GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBVN",he={title:"Components/WalletAddress",component:i,parameters:{layout:"centered",chromatic:{delay:100}},tags:["autodocs"],argTypes:{hideCopy:{control:{type:"boolean"}},className:{control:{type:"text"}}},args:{address:K,truncate:e=>e.slice(0,6)+"..."+e.slice(-4)}},a={},t={args:{hideCopy:!0}},r={args:{address:"alice*example.com",truncate:e=>e}},o={args:{address:""}},d={args:{address:Q,className:"text-primary font-bold text-sm"}},n={render:()=>s.jsxs("div",{className:"flex flex-col gap-2 font-mono text-sm",children:[s.jsx(i,{address:K,truncate:e=>e.slice(0,6)+"..."+e.slice(-4)}),s.jsx(i,{address:Q,truncate:e=>e.slice(0,6)+"..."+e.slice(-4),hideCopy:!0}),s.jsx(i,{address:"alice*example.com",truncate:e=>e})]})};var B,h,g,x,S;a.parameters={...a.parameters,docs:{...(B=a.parameters)==null?void 0:B.docs,source:{originalSource:"{}",...(g=(h=a.parameters)==null?void 0:h.docs)==null?void 0:g.source},description:{story:"Default: truncated G-address with copy button",...(S=(x=a.parameters)==null?void 0:x.docs)==null?void 0:S.description}}};var v,C,b,w,N;t.parameters={...t.parameters,docs:{...(v=t.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    hideCopy: true
  }
}`,...(b=(C=t.parameters)==null?void 0:C.docs)==null?void 0:b.source},description:{story:"Copy button hidden",...(N=(w=t.parameters)==null?void 0:w.docs)==null?void 0:N.description}}};var j,E,D,_,R;r.parameters={...r.parameters,docs:{...(j=r.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    address: 'alice*example.com',
    truncate: (addr: string) => addr // federation addresses are shown as-is
  }
}`,...(D=(E=r.parameters)==null?void 0:E.docs)==null?void 0:D.source},description:{story:"Simulates a resolved Federation address by passing it directly as the address",...(R=(_=r.parameters)==null?void 0:_.docs)==null?void 0:R.description}}};var k,T,F,W,H;o.parameters={...o.parameters,docs:{...(k=o.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    address: ''
  }
}`,...(F=(T=o.parameters)==null?void 0:T.docs)==null?void 0:F.source},description:{story:"Empty address — renders nothing",...(H=(W=o.parameters)==null?void 0:W.docs)==null?void 0:H.description}}};var G,L,O,V,M;d.parameters={...d.parameters,docs:{...(G=d.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    address: SHORT_ADDRESS,
    className: 'text-primary font-bold text-sm'
  }
}`,...(O=(L=d.parameters)==null?void 0:L.docs)==null?void 0:O.source},description:{story:"Custom className applied to the outer span",...(M=(V=d.parameters)==null?void 0:V.docs)==null?void 0:M.description}}};var q,I,$,z,P;n.parameters={...n.parameters,docs:{...(q=n.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2 font-mono text-sm">
      <WalletAddress address={SAMPLE_ADDRESS} truncate={a => a.slice(0, 6) + '...' + a.slice(-4)} />
      <WalletAddress address={SHORT_ADDRESS} truncate={a => a.slice(0, 6) + '...' + a.slice(-4)} hideCopy />
      <WalletAddress address="alice*example.com" truncate={a => a} />
    </div>
}`,...($=(I=n.parameters)==null?void 0:I.docs)==null?void 0:$.source},description:{story:"Multiple addresses side-by-side (as seen in invoice tables)",...(P=(z=n.parameters)==null?void 0:z.docs)==null?void 0:P.description}}};const ge=["Default","HideCopy","FederatedAddress","Empty","CustomClass","InlineList"];export{d as CustomClass,a as Default,o as Empty,r as FederatedAddress,t as HideCopy,n as InlineList,ge as __namedExportsOrder,he as default};
