import{j as r}from"./jsx-runtime-EKYJJIwR.js";import{r as b}from"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const u=["Pending","Funded","Paid"],M={Cancelled:{label:"Cancelled",tone:"muted"},Defaulted:{label:"Defaulted",tone:"error"},Disputed:{label:"Disputed",tone:"error"}};function $({status:h}){const o=M[h],K=u.indexOf(h),i=o?u.length-1:K,a=u.map((e,s)=>{const t=s===u.length-1,n=t&&o?o.label:e,c=t&&o?o.tone:"primary";let l;return i<0?l="upcoming":s<i?l="done":s===i?l="current":l="upcoming",{label:n,state:l,tone:c}}),[U,y]=b.useState(0),D=b.useRef([]),q=(e,s)=>{var n;let t=s;e.key==="ArrowRight"||e.key==="ArrowDown"?(e.preventDefault(),t=(s+1)%a.length):e.key==="ArrowLeft"||e.key==="ArrowUp"?(e.preventDefault(),t=(s-1+a.length)%a.length):e.key==="Home"?(e.preventDefault(),t=0):e.key==="End"&&(e.preventDefault(),t=a.length-1),t!==s&&(y(t),(n=D.current[t])==null||n.focus())};return r.jsx("ol",{className:"flex items-center","aria-label":"Invoice lifecycle status",role:"list",children:a.map((e,s)=>{const t=e.state==="done"||e.state==="current",n=e.tone==="error"?"bg-error text-on-error":t?"bg-primary text-on-primary":"bg-surface-container-high text-on-surface-variant";return r.jsxs("li",{className:"flex flex-1 items-center last:flex-none",role:"listitem",children:[r.jsxs("div",{ref:c=>{D.current[s]=c},className:"flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest rounded-lg p-1",tabIndex:s===U?0:-1,onFocus:()=>y(s),onKeyDown:c=>q(c,s),"aria-current":e.state==="current"?"step":void 0,children:[r.jsxs("span",{className:"sr-only",children:[e.state==="done"?"Completed step: ":e.state==="current"?"Current step: ":"Upcoming step: ","Invoice ",e.label.toLowerCase()]}),r.jsx("span",{"aria-hidden":"true",className:`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${n}`,children:e.state==="done"?"✓":s+1}),r.jsx("span",{"aria-hidden":"true",className:`text-xs font-bold ${t?"text-on-surface":"text-on-surface-variant"}`,children:e.label})]}),s<a.length-1?r.jsx("span",{className:`mx-2 h-0.5 flex-1 rounded-full ${s<i?"bg-primary":"bg-outline-variant/30"}`}):null]},e.label)})})}$.__docgenInfo={description:"",methods:[],displayName:"InvoiceLifecycleTimeline",props:{status:{required:!0,tsType:{name:"string"},description:""}}};const B={title:"Components/InvoiceLifecycleTimeline",component:$,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{status:{control:"select",options:["Pending","Funded","Paid","Cancelled","Defaulted","Disputed"]}}},d={args:{status:"Pending"}},m={args:{status:"Funded"}},p={args:{status:"Paid"}},f={args:{status:"Cancelled"}},g={args:{status:"Defaulted"}},x={args:{status:"Disputed"}};var v,P,I;d.parameters={...d.parameters,docs:{...(v=d.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    status: 'Pending'
  }
}`,...(I=(P=d.parameters)==null?void 0:P.docs)==null?void 0:I.source}}};var C,j,w;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    status: 'Funded'
  }
}`,...(w=(j=m.parameters)==null?void 0:j.docs)==null?void 0:w.source}}};var N,F,S;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    status: 'Paid'
  }
}`,...(S=(F=p.parameters)==null?void 0:F.docs)==null?void 0:S.source}}};var A,E,L;f.parameters={...f.parameters,docs:{...(A=f.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    status: 'Cancelled'
  }
}`,...(L=(E=f.parameters)==null?void 0:E.docs)==null?void 0:L.source}}};var R,T,k;g.parameters={...g.parameters,docs:{...(R=g.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    status: 'Defaulted'
  }
}`,...(k=(T=g.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var _,H,O;x.parameters={...x.parameters,docs:{...(_=x.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    status: 'Disputed'
  }
}`,...(O=(H=x.parameters)==null?void 0:H.docs)==null?void 0:O.source}}};const G=["Pending","Funded","Paid","Cancelled","Defaulted","Disputed"];export{f as Cancelled,g as Defaulted,x as Disputed,m as Funded,p as Paid,d as Pending,G as __namedExportsOrder,B as default};
