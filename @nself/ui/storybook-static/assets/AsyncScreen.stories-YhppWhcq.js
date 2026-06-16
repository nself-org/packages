import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{R as we}from"./index-NGyRR_en.js";import"./_commonjsHelpers-Cpj98o6Y.js";const je=r=>({_tag:"Ok",value:r}),T=r=>({_tag:"Err",error:r}),ke=r=>r._tag==="Ok";function m({children:r,className:n}){return e.jsx("div",{className:n??void 0,style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem 2rem",gap:"0.5rem",textAlign:"center",width:"100%"},children:r})}function E({label:r,className:n}){return e.jsx("div",{role:"status","aria-label":r,"aria-live":"polite",className:n,style:{display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",width:"100%"},children:e.jsx("div",{"aria-hidden":"true",style:{width:"2rem",height:"2rem",border:"3px solid #e2e8f0",borderTopColor:"#6366f1",borderRadius:"50%",animation:"nsui-spin 0.8s linear infinite"}})})}function R({heading:r,body:n,className:t}){return e.jsx(m,{className:t,children:e.jsxs("div",{role:"status","aria-live":"polite",style:{display:"contents"},children:[e.jsx("span",{"aria-hidden":"true",style:{fontSize:"2.5rem"},children:"○"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"#0f172a"},children:r}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#64748b"},children:n})]})})}function _({heading:r,body:n,retryLabel:t,onRetry:o,className:c}){return e.jsx(m,{className:c,children:e.jsxs("div",{role:"alert","aria-live":"assertive",style:{display:"contents"},children:[e.jsx("span",{"aria-hidden":"true",style:{fontSize:"2rem"},children:"⚠"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"#0f172a"},children:r}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#64748b"},children:n}),o!==void 0&&e.jsx("button",{type:"button",onClick:o,style:{marginTop:"0.5rem",padding:"0.5rem 1rem",background:"#6366f1",color:"#fff",border:"none",borderRadius:"0.375rem",cursor:"pointer",fontSize:"0.875rem",fontWeight:500},children:t})]})})}function l({heading:r,body:n,className:t}){return e.jsx(m,{className:t,children:e.jsxs("div",{role:"alert","aria-live":"assertive",style:{display:"contents"},children:[e.jsx("span",{"aria-hidden":"true",style:{fontSize:"2rem"},children:"⊘"}),e.jsx("p",{style:{margin:0,fontWeight:500,color:"#0f172a"},children:r}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#64748b"},children:n})]})})}function q({heading:r,body:n,className:t}){return e.jsx(m,{className:t,children:e.jsxs("div",{role:"status","aria-live":"polite",style:{display:"contents"},children:[e.jsx("span",{"aria-hidden":"true",style:{fontSize:"2.5rem"},children:"🔒"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"#0f172a"},children:r}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#64748b"},children:n})]})})}function A({heading:r,body:n,className:t}){return e.jsx(m,{className:t,children:e.jsxs("div",{role:"alert","aria-live":"assertive",style:{display:"contents"},children:[e.jsx("span",{"aria-hidden":"true",style:{fontSize:"2rem"},children:"⏱"}),e.jsx("p",{style:{margin:0,fontWeight:500,color:"#78350f"},children:r}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#92400e"},children:n})]})})}E.__docgenInfo={description:`LoadingState — animated spinner with accessible status announcement.
Uses role="status" + aria-label for screen readers (WCAG 4.1.3).`,methods:[],displayName:"LoadingState",props:{label:{required:!0,tsType:{name:"string"},description:`Translated "Loading" label from t('asyncScreen.loadingLabel').`},className:{required:!1,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:""}}};R.__docgenInfo={description:`EmptyState — shown when data loaded successfully but the list is empty.
Uses role="status" for polite announcement.`,methods:[],displayName:"EmptyState",props:{heading:{required:!0,tsType:{name:"string"},description:""},body:{required:!0,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:""}}};_.__docgenInfo={description:`ErrorState — shown on unexpected/unclassified errors.
Uses role="alert" for immediate screen-reader announcement (WCAG SC 4.1.3).`,methods:[],displayName:"ErrorState",props:{heading:{required:!0,tsType:{name:"string"},description:""},body:{required:!0,tsType:{name:"string"},description:""},retryLabel:{required:!0,tsType:{name:"string"},description:""},onRetry:{required:!1,tsType:{name:"union",raw:"(() => void) | undefined",elements:[{name:"unknown"},{name:"undefined"}]},description:""},className:{required:!1,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:""}}};l.__docgenInfo={description:`OfflineState — shown when the device has no network connectivity.
Uses role="alert" for immediate announcement.`,methods:[],displayName:"OfflineState",props:{heading:{required:!0,tsType:{name:"string"},description:""},body:{required:!0,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:""}}};q.__docgenInfo={description:`PermissionDeniedState — shown when user lacks access to this resource.
Free feature per Security-Always-Free doctrine.
Uses role="status" (polite — not a system error, just access restriction).`,methods:[],displayName:"PermissionDeniedState",props:{heading:{required:!0,tsType:{name:"string"},description:""},body:{required:!0,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:""}}};A.__docgenInfo={description:`RateLimitedState — shown on HTTP 429 / rate limit detection.
Free feature per Security-Always-Free doctrine.
Uses role="alert" (assertive — user action triggered rate limit).`,methods:[],displayName:"RateLimitedState",props:{heading:{required:!0,tsType:{name:"string"},description:""},body:{required:!0,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:""}}};const be={"asyncScreen.loadingLabel":"Loading","asyncScreen.emptyHeading":"Nothing here yet","asyncScreen.emptyBody":"There is nothing to show at the moment.","asyncScreen.errorHeading":"Something went wrong","asyncScreen.errorBody":"An unexpected error occurred. Please try again.","asyncScreen.errorRetry":"Try again","asyncScreen.offlineHeading":"You are offline","asyncScreen.offlineBody":"Check your connection and try again.","asyncScreen.permissionDeniedHeading":"Access restricted","asyncScreen.permissionDeniedBody":"Your plan does not include access to this feature.","asyncScreen.rateLimitedHeading":"Rate limit reached","asyncScreen.rateLimitedBody":"Please wait a moment before trying again."};function ve(){return r=>be[r]}function De(r){return r.code==="auth_failed"||r.code==="forbidden"?"permissionDenied":r.code==="rate_limited"?"rateLimited":r.code==="license_required"?"permissionDenied":typeof window<"u"&&!window.navigator.onLine?"offline":"generic"}function i({result:r,renderData:n,emptyCheck:t,onRetry:o,onError:c,slots:s={},stateClassName:d}){const a=ve();if(r==="loading")return e.jsx(e.Fragment,{children:s.loading??e.jsx(E,{label:a("asyncScreen.loadingLabel"),className:d})});if(!ke(r)){const u=r.error;we.useEffect(()=>{c==null||c(u)},[u]);const L=De(u);return L==="permissionDenied"?e.jsx(e.Fragment,{children:s.permissionDenied??e.jsx(q,{heading:a("asyncScreen.permissionDeniedHeading"),body:a("asyncScreen.permissionDeniedBody"),className:d})}):L==="rateLimited"?e.jsx(e.Fragment,{children:s.rateLimited??e.jsx(A,{heading:a("asyncScreen.rateLimitedHeading"),body:a("asyncScreen.rateLimitedBody"),className:d})}):L==="offline"?e.jsx(e.Fragment,{children:s.offline??e.jsx(l,{heading:a("asyncScreen.offlineHeading"),body:a("asyncScreen.offlineBody"),className:d})}):s.error!==void 0?e.jsx(e.Fragment,{children:s.error(u,o)}):e.jsx(_,{heading:a("asyncScreen.errorHeading"),body:a("asyncScreen.errorBody"),retryLabel:a("asyncScreen.errorRetry"),onRetry:o,className:d})}const P=r.value;return(t==null?void 0:t(P))===!0?e.jsx(e.Fragment,{children:s.empty??e.jsx(R,{heading:a("asyncScreen.emptyHeading"),body:a("asyncScreen.emptyBody"),className:d})}):e.jsx(e.Fragment,{children:n(P)})}i.__docgenInfo={description:`AsyncScreen — renders the correct state UI for any data-loading screen.

State priority (first-match wins):
  1. result === 'loading'              → LoadingState
  2. Err(code=auth_failed|forbidden|license_required) → PermissionDeniedState
  3. Err(code=rate_limited)            → RateLimitedState
  4. Err(*) + !navigator.onLine        → OfflineState
  5. Err(*)                            → ErrorState
  6. Ok(data) where emptyCheck(data)   → EmptyState
  7. Ok(data)                          → renderData(data)`,methods:[],displayName:"AsyncScreen",props:{result:{required:!0,tsType:{name:"union",raw:"Result<T, AppError> | 'loading'",elements:[{name:"union",raw:"Ok<T> | Err<E>",elements:[{name:"signature",type:"object",raw:"{ readonly _tag: 'Ok'; readonly value: T }",signature:{properties:[{key:"_tag",value:{name:"literal",value:"'Ok'",required:!0}},{key:"value",value:{name:"T",required:!0}}]}},{name:"signature",type:"object",raw:"{ readonly _tag: 'Err'; readonly error: E }",signature:{properties:[{key:"_tag",value:{name:"literal",value:"'Err'",required:!0}},{key:"error",value:{name:"AppError",required:!0}}]}}]},{name:"literal",value:"'loading'"}]},description:`The async result. Pass the string 'loading' while the request is in-flight.
Pass a Result<T,AppError> once the response arrives.`},renderData:{required:!0,tsType:{name:"signature",type:"function",raw:"(data: T) => React.ReactNode",signature:{arguments:[{type:{name:"T"},name:"data"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:"Renders the populated state (called only when result is Ok and not empty)."},emptyCheck:{required:!1,tsType:{name:"signature",type:"function",raw:"(data: T) => boolean",signature:{arguments:[{type:{name:"T"},name:"data"}],return:{name:"boolean"}}},description:`Returns true when the loaded data should show EmptyState instead of renderData.
Defaults to false (always show renderData on Ok).`},onRetry:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Retry callback — passed to ErrorState and any custom error slot."},onError:{required:!1,tsType:{name:"signature",type:"function",raw:"(error: AppError) => void",signature:{arguments:[{type:{name:"AppError"},name:"error"}],return:{name:"void"}}},description:`Called when the error state is displayed. Use to forward to Sentry or other
observability sinks. Called once per error render (not per re-render).`},slots:{required:!1,tsType:{name:"AsyncScreenSlots",elements:[{name:"T"}],raw:"AsyncScreenSlots<T>"},description:"Slot overrides — replace any default state UI.",defaultValue:{value:"{}",computed:!1}},stateClassName:{required:!1,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:"Class applied to the state container element (loading/empty/error/etc)."}}};const _e={title:"AsyncScreen/States",component:i,tags:["autodocs"],parameters:{layout:"centered"}};function Te(){return[{id:"1",title:"Review pull request"},{id:"2",title:"Write release notes"},{id:"3",title:"Deploy to staging"}]}function O(r){const n={auth_failed:401,not_found:404,forbidden:403,validation_error:422,rate_limited:429,internal:500,license_required:402,tenant_mismatch:409};return{code:r,message:`[${r}] error`,status:n[r]}}const p={name:"1. Loading",render:()=>e.jsx("div",{style:{width:400},children:e.jsx(i,{result:"loading",renderData:r=>e.jsx("ul",{children:r.map(n=>e.jsx("li",{children:n.title},n.id))})})})},y={name:"2. Empty",render:()=>e.jsx("div",{style:{width:400},children:e.jsx(i,{result:je([]),renderData:r=>e.jsx("ul",{children:r.map(n=>e.jsx("li",{children:n.title},n.id))}),emptyCheck:r=>r.length===0})})},g={name:"3. Error",render:()=>e.jsx("div",{style:{width:400},children:e.jsx(i,{result:T(O("internal")),renderData:r=>e.jsx("ul",{children:r.map(n=>e.jsx("li",{children:n.title},n.id))}),onRetry:()=>{window.alert("Retrying…")}})})},f={name:"4. Offline",render:()=>e.jsx("div",{style:{width:400},children:e.jsx(i,{result:T({code:"internal",message:"fetch failed",status:500}),renderData:r=>e.jsx("ul",{children:r.map(n=>e.jsx("li",{children:n.title},n.id))}),slots:{offline:e.jsx(l,{heading:"You are offline",body:"Check your connection and try again."}),error:()=>e.jsx(l,{heading:"You are offline",body:"Check your connection and try again."})}})})},h={name:"5. Permission Denied",render:()=>e.jsx("div",{style:{width:400},children:e.jsx(i,{result:T(O("forbidden")),renderData:r=>e.jsx("ul",{children:r.map(n=>e.jsx("li",{children:n.title},n.id))})})})},S={name:"6. Rate Limited",render:()=>e.jsx("div",{style:{width:400},children:e.jsx(i,{result:T(O("rate_limited")),renderData:r=>e.jsx("ul",{children:r.map(n=>e.jsx("li",{children:n.title},n.id))})})})},x={name:"7. Populated",render:()=>e.jsx("div",{style:{width:400,padding:"1rem"},children:e.jsx(i,{result:je(Te()),renderData:r=>e.jsx("ul",{style:{listStyle:"none",padding:0,margin:0},children:r.map(n=>e.jsx("li",{style:{padding:"0.75rem 1rem",borderBottom:"1px solid #e2e8f0",color:"#0f172a"},children:n.title},n.id))})})})},j={name:"LoadingState (direct)",render:()=>e.jsx(E,{label:"Loading tasks…"})},w={name:"EmptyState (direct)",render:()=>e.jsx(R,{heading:"Nothing here yet",body:"Create your first task to get started."})},k={name:"ErrorState (direct)",render:()=>e.jsx(_,{heading:"Something went wrong",body:"An unexpected error occurred. Please try again.",retryLabel:"Try again",onRetry:()=>{window.alert("Retry clicked")}})},b={name:"OfflineState (direct)",render:()=>e.jsx(l,{heading:"You are offline",body:"Check your connection and try again."})},v={name:"PermissionDeniedState (direct)",render:()=>e.jsx(q,{heading:"Access restricted",body:"Your plan does not include access to this feature."})},D={name:"RateLimitedState (direct)",render:()=>e.jsx(A,{heading:"Rate limit reached",body:"Please wait a moment before trying again."})};var N,C,B;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: '1. Loading',
  render: () => <div style={{
    width: 400
  }}>
      <AsyncScreen<Task[]> result="loading" renderData={tasks => <ul>
            {tasks.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>} />
    </div>
}`,...(B=(C=p.parameters)==null?void 0:C.docs)==null?void 0:B.source}}};var F,I,z;y.parameters={...y.parameters,docs:{...(F=y.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: '2. Empty',
  render: () => <div style={{
    width: 400
  }}>
      <AsyncScreen<Task[]> result={ok([])} renderData={tasks => <ul>
            {tasks.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>} emptyCheck={d => d.length === 0} />
    </div>
}`,...(z=(I=y.parameters)==null?void 0:I.docs)==null?void 0:z.source}}};var H,Y,U;g.parameters={...g.parameters,docs:{...(H=g.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: '3. Error',
  render: () => <div style={{
    width: 400
  }}>
      <AsyncScreen<Task[]> result={err(makeError('internal'))} renderData={tasks => <ul>
            {tasks.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>} onRetry={() => {
      window.alert('Retrying…');
    }} />
    </div>
}`,...(U=(Y=g.parameters)==null?void 0:Y.docs)==null?void 0:U.source}}};var W,G,K;f.parameters={...f.parameters,docs:{...(W=f.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: '4. Offline',
  render: () => <div style={{
    width: 400
  }}>
      <AsyncScreen<Task[]> result={err({
      code: 'internal',
      message: 'fetch failed',
      status: 500
    })} renderData={tasks => <ul>
            {tasks.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>} slots={{
      // Force offline display for Storybook (navigator.onLine is true in iframe)
      offline: <OfflineState heading="You are offline" body="Check your connection and try again." />,
      error: () => <OfflineState heading="You are offline" body="Check your connection and try again." />
    }} />
    </div>
}`,...(K=(G=f.parameters)==null?void 0:G.docs)==null?void 0:K.source}}};var M,V,$;h.parameters={...h.parameters,docs:{...(M=h.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: '5. Permission Denied',
  render: () => <div style={{
    width: 400
  }}>
      <AsyncScreen<Task[]> result={err(makeError('forbidden'))} renderData={tasks => <ul>
            {tasks.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>} />
    </div>
}`,...($=(V=h.parameters)==null?void 0:V.docs)==null?void 0:$.source}}};var J,Q,X;S.parameters={...S.parameters,docs:{...(J=S.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: '6. Rate Limited',
  render: () => <div style={{
    width: 400
  }}>
      <AsyncScreen<Task[]> result={err(makeError('rate_limited'))} renderData={tasks => <ul>
            {tasks.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>} />
    </div>
}`,...(X=(Q=S.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Z,ee,re;x.parameters={...x.parameters,docs:{...(Z=x.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: '7. Populated',
  render: () => <div style={{
    width: 400,
    padding: '1rem'
  }}>
      <AsyncScreen<Task[]> result={ok(sampleData())} renderData={tasks => <ul style={{
      listStyle: 'none',
      padding: 0,
      margin: 0
    }}>
            {tasks.map(t => <li key={t.id} style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a'
      }}>
                {t.title}
              </li>)}
          </ul>} />
    </div>
}`,...(re=(ee=x.parameters)==null?void 0:ee.docs)==null?void 0:re.source}}};var ne,te,ae;j.parameters={...j.parameters,docs:{...(ne=j.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  name: 'LoadingState (direct)',
  render: () => <LoadingState label="Loading tasks…" />
}`,...(ae=(te=j.parameters)==null?void 0:te.docs)==null?void 0:ae.source}}};var ie,se,de;w.parameters={...w.parameters,docs:{...(ie=w.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  name: 'EmptyState (direct)',
  render: () => <EmptyState heading="Nothing here yet" body="Create your first task to get started." />
}`,...(de=(se=w.parameters)==null?void 0:se.docs)==null?void 0:de.source}}};var oe,ce,le;k.parameters={...k.parameters,docs:{...(oe=k.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  name: 'ErrorState (direct)',
  render: () => <ErrorState heading="Something went wrong" body="An unexpected error occurred. Please try again." retryLabel="Try again" onRetry={() => {
    window.alert('Retry clicked');
  }} />
}`,...(le=(ce=k.parameters)==null?void 0:ce.docs)==null?void 0:le.source}}};var me,ue,pe;b.parameters={...b.parameters,docs:{...(me=b.parameters)==null?void 0:me.docs,source:{originalSource:`{
  name: 'OfflineState (direct)',
  render: () => <OfflineState heading="You are offline" body="Check your connection and try again." />
}`,...(pe=(ue=b.parameters)==null?void 0:ue.docs)==null?void 0:pe.source}}};var ye,ge,fe;v.parameters={...v.parameters,docs:{...(ye=v.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  name: 'PermissionDeniedState (direct)',
  render: () => <PermissionDeniedState heading="Access restricted" body="Your plan does not include access to this feature." />
}`,...(fe=(ge=v.parameters)==null?void 0:ge.docs)==null?void 0:fe.source}}};var he,Se,xe;D.parameters={...D.parameters,docs:{...(he=D.parameters)==null?void 0:he.docs,source:{originalSource:`{
  name: 'RateLimitedState (direct)',
  render: () => <RateLimitedState heading="Rate limit reached" body="Please wait a moment before trying again." />
}`,...(xe=(Se=D.parameters)==null?void 0:Se.docs)==null?void 0:xe.source}}};const qe=["Loading","Empty","Error","Offline","PermissionDenied","RateLimited","Populated","LoadingDirect","EmptyDirect","ErrorDirect","OfflineDirect","PermissionDeniedDirect","RateLimitedDirect"];export{y as Empty,w as EmptyDirect,g as Error,k as ErrorDirect,p as Loading,j as LoadingDirect,f as Offline,b as OfflineDirect,h as PermissionDenied,v as PermissionDeniedDirect,x as Populated,S as RateLimited,D as RateLimitedDirect,qe as __namedExportsOrder,_e as default};
