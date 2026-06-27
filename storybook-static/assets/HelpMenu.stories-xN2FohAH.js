import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{r}from"./iframe-Dx6cFdWX.js";import{P as k}from"./PageTour-BI8-mi4R.js";import"./preload-helper-Dp1pzeXC.js";import"./index-DgjZPjOo.js";import"./index-BVZtMyJn.js";import"./index-CNFeyz4D.js";const w=[{label:"Protocol documentation",href:"https://docs.iln.finance"},{label:"FAQ",href:"https://docs.iln.finance/faq"}];function x({tourId:y,docLinks:c=w}){const[o,l]=r.useState(!1),[d,u]=r.useState(!1),i=r.useRef(null);r.useEffect(()=>{if(!o)return;const t=a=>{i.current&&!i.current.contains(a.target)&&l(!1)};return document.addEventListener("mousedown",t),()=>document.removeEventListener("mousedown",t)},[o]);const v=r.useCallback(()=>{l(!1),u(!0)},[]),j=r.useCallback(()=>{u(!1)},[]);return e.jsxs(e.Fragment,{children:[d&&e.jsx(k,{tourId:y,run:d,onFinish:j}),e.jsxs("div",{ref:i,className:"relative inline-block","data-testid":"help-menu",children:[e.jsx("button",{onClick:()=>l(t=>!t),"aria-label":"Help and page tour","data-testid":"help-button",className:"flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm",children:"?"}),o&&e.jsxs("div",{"data-testid":"help-menu-dropdown",className:"absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1",children:[e.jsxs("button",{onClick:v,"data-testid":"start-tour-btn",className:"flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-blue-50 hover:text-blue-700 transition-colors",children:[e.jsx("span",{children:"🎯"})," Take a tour of this page"]}),c.length>0&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"my-1 border-t border-gray-100"}),c.map(({label:t,href:a})=>e.jsxs("a",{href:a,target:"_blank",rel:"noopener noreferrer",className:"flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors",children:[e.jsx("span",{children:"📖"})," ",t]},a))]})]})]})]})}x.__docgenInfo={description:"",methods:[],displayName:"HelpMenu",props:{tourId:{required:!0,tsType:{name:"union",raw:`| "freelancer-dashboard"
| "lp-discovery"
| "analytics"
| "governance"`,elements:[{name:"literal",value:'"freelancer-dashboard"'},{name:"literal",value:'"lp-discovery"'},{name:"literal",value:'"analytics"'},{name:"literal",value:'"governance"'}]},description:""},docLinks:{required:!1,tsType:{name:"Array",elements:[{name:"DocLink"}],raw:"DocLink[]"},description:"",defaultValue:{value:`[
  { label: "Protocol documentation", href: "https://docs.iln.finance" },
  { label: "FAQ", href: "https://docs.iln.finance/faq" },
]`,computed:!1}}}};const D={title:"Components/Tours/HelpMenu",component:x,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{tourId:{control:"text"}}},n={args:{tourId:"freelancer-dashboard"}},s={args:{tourId:"lp-dashboard",docLinks:[{label:"LP Guide",href:"https://docs.iln.finance/lp"},{label:"Yield Calculator",href:"https://docs.iln.finance/yield"}]}};var p,m,f;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    tourId: 'freelancer-dashboard' as any
  }
}`,...(f=(m=n.parameters)==null?void 0:m.docs)==null?void 0:f.source}}};var h,b,g;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    tourId: 'lp-dashboard' as any,
    docLinks: [{
      label: 'LP Guide',
      href: 'https://docs.iln.finance/lp'
    }, {
      label: 'Yield Calculator',
      href: 'https://docs.iln.finance/yield'
    }]
  }
}`,...(g=(b=s.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};const F=["Default","WithCustomLinks"];export{n as Default,s as WithCustomLinks,F as __namedExportsOrder,D as default};
