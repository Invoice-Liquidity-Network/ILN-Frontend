import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{L as E}from"./link-QQA07YkG.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./get-segment-param-uZ6tT2eb.js";import"./_interop_require_default-Dl4696rw.js";function k({title:S,description:l,breadcrumbs:a,actions:c}){return e.jsxs("div",{className:"flex flex-col md:flex-row md:items-end justify-between gap-6",children:[e.jsxs("div",{children:[a&&a.length>0&&e.jsx("nav",{"aria-label":"Breadcrumb",className:"mb-2",children:e.jsx("ol",{className:"flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary",children:a.map((t,d)=>{const q=d===a.length-1;return e.jsxs("li",{className:"flex items-center gap-2",children:[t.href?e.jsx(E,{href:t.href,className:"hover:underline",children:t.label}):e.jsx("span",{children:t.label}),!q&&e.jsx("span",{className:"material-symbols-outlined text-[14px]","aria-hidden":"true",children:"chevron_right"})]},d)})})}),e.jsx("h1",{className:"text-3xl md:text-4xl font-headline font-bold tracking-tight text-on-surface",children:S}),l&&e.jsx("p",{className:"mt-2 text-base text-on-surface-variant max-w-xl leading-relaxed",children:l})]}),c&&e.jsx("div",{className:"flex items-center gap-3 shrink-0 md:justify-end",children:c})]})}k.__docgenInfo={description:"",methods:[],displayName:"PageHeader",props:{title:{required:!0,tsType:{name:"string"},description:""},description:{required:!1,tsType:{name:"string"},description:""},breadcrumbs:{required:!1,tsType:{name:"Array",elements:[{name:"BreadcrumbItem"}],raw:"BreadcrumbItem[]"},description:""},actions:{required:!1,tsType:{name:"ReactNode"},description:""}}};const T={title:"Components/PageHeader",component:k,tags:["autodocs"],parameters:{layout:"padded"}},r={args:{title:"Dashboard"}},s={args:{title:"Dashboard",description:"Manage invoices, liquidity, and protocol activity."}},n={args:{title:"Marketplace",actions:e.jsx("button",{className:"px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm",children:"Submit Invoice"})}},i={args:{title:"Invoice Details",breadcrumbs:[{label:"Dashboard",href:"/dashboard"},{label:"Invoices",href:"/invoices"},{label:"Invoice #42"}]}},o={args:{title:"Invoice Details",description:"Review invoice information and track payment status.",breadcrumbs:[{label:"Dashboard",href:"/dashboard"},{label:"Invoices",href:"/invoices"},{label:"Invoice #42"}],actions:e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{className:"px-4 py-2 border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold text-sm",children:"Edit"}),e.jsx("button",{className:"px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm",children:"Fund Invoice"})]})}};var m,p,u;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    title: "Dashboard"
  }
}`,...(u=(p=r.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var x,b,h;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    title: "Dashboard",
    description: "Manage invoices, liquidity, and protocol activity."
  }
}`,...(h=(b=s.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};var f,v,g;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    title: "Marketplace",
    actions: <button className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm">
        Submit Invoice
      </button>
  }
}`,...(g=(v=n.parameters)==null?void 0:v.docs)==null?void 0:g.source}}};var y,j,I;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    title: "Invoice Details",
    breadcrumbs: [{
      label: "Dashboard",
      href: "/dashboard"
    }, {
      label: "Invoices",
      href: "/invoices"
    }, {
      label: "Invoice #42"
    }]
  }
}`,...(I=(j=i.parameters)==null?void 0:j.docs)==null?void 0:I.source}}};var N,D,w;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    title: "Invoice Details",
    description: "Review invoice information and track payment status.",
    breadcrumbs: [{
      label: "Dashboard",
      href: "/dashboard"
    }, {
      label: "Invoices",
      href: "/invoices"
    }, {
      label: "Invoice #42"
    }],
    actions: <div className="flex gap-2">
        <button className="px-4 py-2 border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold text-sm">
          Edit
        </button>
        <button className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm">
          Fund Invoice
        </button>
      </div>
  }
}`,...(w=(D=o.parameters)==null?void 0:D.docs)==null?void 0:w.source}}};const A=["Default","WithDescription","WithActions","WithBreadcrumbs","FullExample"];export{r as Default,o as FullExample,n as WithActions,i as WithBreadcrumbs,s as WithDescription,A as __namedExportsOrder,T as default};
