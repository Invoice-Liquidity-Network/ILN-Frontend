import{j as n}from"./jsx-runtime-EKYJJIwR.js";function i({className:e="",...s}){return n.jsx("div",{"aria-hidden":"true",className:`skeleton-cell ${e}`,...s})}i.__docgenInfo={description:`Base skeleton primitive (#155).

Renders an animated shimmer block using the shared \`.skeleton-cell\` style
(defined in globals.css), so loading placeholders match the design system and
stay consistent across the app. Compose with width/height/rounded utilities:

  <Skeleton className="h-4 w-32" />
  <Skeleton className="h-24 w-full rounded-2xl" />

Decorative by default (\`aria-hidden\`) — screen readers should be told the
region is loading via the surrounding container, not each shimmer block.`,methods:[],displayName:"Skeleton",props:{className:{required:!1,tsType:{name:"string"},description:'Tailwind sizing/shape utilities, e.g. "h-4 w-32" or "h-24 w-full rounded-2xl".',defaultValue:{value:'""',computed:!1}}}};export{i as S};
