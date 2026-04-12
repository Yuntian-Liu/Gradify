    const state = { isGenerating:false, fullContent:"", greetingContent:"", viewMode:"rendered", assistantLoading:false, assistantImages:[], recognition:null, recognizing:false, readAloudEnabled:false, assistantWebSearchEnabled:false, assistantThinkingTimer:null, assistantThinkingNode:null, assistantThinkingStartedAt:0, thinkingTimerInterval:null, thinkingTimerStart:0, lastGeneratedStudentName:"", lastGeneratedErrorNotes:"", lastGeneratedIssues:[] };
    const elements = {
      studentName:document.getElementById("studentName"), unitNumber:document.getElementById("unitNumber"), lessonType:document.getElementById("lessonType"), lessonNumber:document.getElementById("lessonNumber"),
      hasPreview:document.getElementById("hasPreview"), previewWrapper:document.getElementById("previewWrapper"), previewUnitNumber:document.getElementById("previewUnitNumber"), previewType:document.getElementById("previewType"),
      feedbackType:document.getElementById("feedbackType"), greetingTime:document.getElementById("greetingTime"), rating:document.getElementById("rating"), lostSections:document.getElementById("lostSections"), lostSectionsWrapper:document.getElementById("lostSectionsWrapper"),
      errorNotes:document.getElementById("errorNotes"), issues:document.querySelectorAll('input[name="issues"]'),
      generateBtn:document.getElementById("generateBtn"), btnIcon:document.getElementById("btnIcon"), btnText:document.getElementById("btnText"),
      greetingCard:document.getElementById("greetingCard"), greetingText:document.getElementById("greetingText"),
      copyGreetingBtn:document.getElementById("copyGreetingBtn"), copyAllBtn:document.getElementById("copyAllBtn"), copyFeedbackBtn:document.getElementById("copyFeedbackBtn"),
      emptyState:document.getElementById("emptyState"), markdownOutput:document.getElementById("markdownOutput"), toastContainer:document.getElementById("toastContainer"),
      feedbackContent:document.getElementById("feedbackContent"), generateStatus:document.getElementById("generateStatus"),
      viewModeBtn:document.getElementById("viewModeBtn"),
      assistantFab:document.getElementById("assistantFab"), assistantPanel:document.getElementById("assistantPanel"), assistantCloseBtn:document.getElementById("assistantCloseBtn"),
      assistantMessages:document.getElementById("assistantMessages"), assistantInput:document.getElementById("assistantInput"), assistantAskBtn:document.getElementById("assistantAskBtn"),
      assistantImageInput:document.getElementById("assistantImageInput"), assistantImageBtn:document.getElementById("assistantImageBtn"), assistantImageTray:document.getElementById("assistantImageTray"),
      assistantSearchBtn:document.getElementById("assistantSearchBtn"),
      assistantVoiceBtn:document.getElementById("assistantVoiceBtn"), assistantReadAloudBtn:document.getElementById("assistantReadAloudBtn"),
      generateModelLabel:document.getElementById("generateModelLabel"), assistantModelLabel:document.getElementById("assistantModelLabel"),
      loadingSkeleton:document.getElementById("loadingSkeleton")
    };
    const FORM_DRAFT_KEY = "gradify_form_draft_v4";
    const DRAFT_FIELD_IDS = ["studentName","unitNumber","lessonType","lessonNumber","hasPreview","previewUnitNumber","previewType","greetingTime","rating","lostSections","errorNotes","previewErrorCount","quickTaskNumber","quickTaskPreset","quickTaskContent","quickReadingUnit","quickReadingType","missingTaskNumber","missingTaskPreset","missingTaskContent"];
    let splashDismissed=false;

    function showToast(message, type="success"){
      const toast=document.createElement("div");
      const bgClass=type==="success"?"bg-coral":"bg-coral";
      toast.className=`${bgClass} text-white px-4 py-2 rounded-xl shadow-xl text-sm font-semibold`;
      toast.textContent=message; elements.toastContainer.appendChild(toast); setTimeout(()=>toast.remove(),2200);
    }
    function showGenerateStatus(message, type="info"){
      const map={info:"status-pill",success:"status-pill border-cyan/40 text-cyan-700",error:"status-pill border-coral/40 text-coral"};
      elements.generateStatus.className=map[type]||map.info; elements.generateStatus.textContent=message; elements.generateStatus.classList.remove("hidden");
    }
    function setButtonLoading(loading){
      state.isGenerating=loading; elements.generateBtn.disabled=loading;
      if(loading){elements.btnIcon.innerHTML='<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg>'; elements.btnText.textContent="AI 正在生成...";}
      else {elements.btnIcon.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M13 10V3L4 14h7v7l9-11h-7z"/>'; elements.btnText.textContent="生成反馈";}
    }
    function scrollToBottom(){const c=document.querySelector(".output-scroll"); c.scrollTop=c.scrollHeight;}
    function syncViewModeButton(){elements.viewModeBtn.textContent = state.viewMode==="rendered" ? "Mode: Rendered" : "Mode: Raw";}
    function preprocessMarkdownText(text){
      const sanitized = text
        .replace(/<\/?(u|ins|del)\b[^>]*>/gi,"")
        .replace(/^\s*([*_]\s*){3,}\s*$/gm,(m)=>m.replace(/([*_])/g,"\\$1"))
        .replace(/~~([^~]+)~~/g,"$1")
        .replace(/__([^_]+)__/g,"$1")
        .replace(/\n{2,}(?=(?:U\d+[AB]\s+Preview部分|Preview部分|Vocabulary部分|Reading部分|Task\d+\s.+部分|Task\d+\s+\S+|听记作业|Reading Skill\s.+))/g,"\n");
      const headingRe=/^(Vocabulary部分|Reading部分|Reading Skill\s.+|Task\d+\s.+部分|Task\d+\s+\S+|听记作业|U\d+[AB]\s+Preview部分|Preview部分)$/i;
      const issueHeadingRe=/^(Task\d+\s+\S+|听记作业|U\d+[AB]\s+Preview部分|Preview部分|Vocabulary部分)$/i;
      const lines=sanitized.split("\n");
      let prevIsIssueHeading=false;
      return lines.map((line)=>{
        const t=line.trim();
        if(!t){prevIsIssueHeading=false; return line;}
        if(headingRe.test(t)){
          prevIsIssueHeading = issueHeadingRe.test(t);
          return `**${t}**`;
        }
        if(prevIsIssueHeading){
          prevIsIssueHeading=false;
          return `<em>${t}</em>`;
        }
        prevIsIssueHeading=false;
        return line;
      }).join("\n");
    }
    function applyEditorCommand(command, value=null){
      elements.markdownOutput.focus();
      const ok = value===null ? document.execCommand(command, false) : document.execCommand(command, false, value);
      if(ok) return;
      const sel = window.getSelection();
      if(!sel || !sel.rangeCount || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const text = range.toString();
      if(!text) return;
      let node;
      if(command==="bold") node=document.createElement("strong");
      else if(command==="italic") node=document.createElement("em");
      else { node=document.createElement("mark"); node.style.backgroundColor="#fff59d"; node.style.padding="0 .2em"; node.style.borderRadius=".2em"; }
      node.textContent=text; range.deleteContents(); range.insertNode(node); sel.removeAllRanges();
    }
    function unwrapElement(el){
      if(!el || !el.parentNode) return;
      const frag = document.createDocumentFragment();
      while(el.firstChild) frag.appendChild(el.firstChild);
      el.parentNode.replaceChild(frag, el);
    }
    function hasHighlightStyle(el){
      if(!el || !el.style) return false;
      const bg = (el.style.backgroundColor||"").trim().toLowerCase();
      const bg2 = (el.style.background||"").trim().toLowerCase();
      return Boolean(bg && bg!=="transparent") || (bg2.includes("rgb") || bg2.includes("#"));
    }
    function clearHighlightStyle(el){
      if(!el || !el.style) return;
      el.style.removeProperty("background-color");
      el.style.removeProperty("background");
      if(!el.getAttribute("style")) unwrapElement(el);
    }
    function getHighlightElementsInRange(range){
      const root = elements.markdownOutput;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      const hits = [];
      let node = walker.currentNode;
      while(node){
        if(range.intersectsNode(node)){
          if(node.tagName==="MARK") hits.push(node);
          else if(hasHighlightStyle(node)) hits.push(node);
        }
        node = walker.nextNode();
      }
      return hits;
    }
    function hasItalicStyle(el){
      if(!el || !el.style) return false;
      return (el.style.fontStyle||"").trim().toLowerCase()==="italic";
    }
    function clearItalicStyle(el){
      if(!el || !el.style) return;
      el.style.removeProperty("font-style");
      if(!el.getAttribute("style")) unwrapElement(el);
    }
    function getItalicElementsInRange(range){
      const root = elements.markdownOutput;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      const hits = [];
      let node = walker.currentNode;
      while(node){
        if(range.intersectsNode(node)){
          if(node.tagName==="EM"||node.tagName==="I") hits.push(node);
          else if(hasItalicStyle(node)) hits.push(node);
        }
        node = walker.nextNode();
      }
      return hits;
    }
    function toggleItalicSelection(){
      applyEditorCommand("italic");
    }
    function insertDivider(){
      elements.markdownOutput.focus();
      const sel = window.getSelection();
      if(!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const hr = document.createElement("hr");
      hr.style.border="0";
      hr.style.borderTop="2px solid rgba(88,99,120,.45)";
      hr.style.margin=".18rem 0";
      hr.style.height="0";
      hr.style.display="block";
      range.deleteContents();
      range.insertNode(hr);
      range.setStartAfter(hr);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    function toggleHighlightSelection(){
      elements.markdownOutput.focus();
      const sel = window.getSelection();
      if(!sel || !sel.rangeCount || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const highlighted = getHighlightElementsInRange(range);
      if(highlighted.length){
        applyEditorCommand("hiliteColor","transparent");
        applyEditorCommand("backColor","transparent");
        return;
      }
      applyEditorCommand("hiliteColor","#fff59d");
      applyEditorCommand("backColor","#fff59d");
    }
    function renderFeedback(){
      if(state.viewMode==="raw"){
        elements.markdownOutput.textContent = state.fullContent;
        return;
      }
      const source = preprocessMarkdownText(state.fullContent || "");
      if(window.marked){
        const renderer = new marked.Renderer();
        const parsed = marked.parse(source, { breaks:true, gfm:true, renderer });
        elements.markdownOutput.innerHTML = sanitizeHtml(parsed);
        const suspicious = elements.markdownOutput.querySelectorAll("u,ins,del");
        suspicious.forEach((el)=>{
          const frag = document.createDocumentFragment();
          while(el.firstChild) frag.appendChild(el.firstChild);
          el.replaceWith(frag);
        });
      }else{
        elements.markdownOutput.textContent = state.fullContent;
      }
    }
    function getCurrentFeedbackText(){
      return (elements.markdownOutput.innerText||"").replace(/\n{3,}/g,"\n\n").trim();
    }
    function escapeHtml(text){
      return String(text||"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#39;");
    }
    function getStaleChecks(){
      const curName=elements.studentName.value.trim();
      if(!state.lastGeneratedStudentName || curName===state.lastGeneratedStudentName) return null;
      const curNotes=elements.errorNotes.value.trim();
      const curIssues=Array.from(elements.issues).filter(cb=>cb.checked).map(cb=>cb.value).sort();
      const notesChanged=curNotes!==state.lastGeneratedErrorNotes;
      const issuesChanged=JSON.stringify(curIssues)!==JSON.stringify(state.lastGeneratedIssues||[]);
      if(notesChanged && issuesChanged) return null;
      return {notesUnchanged:!notesChanged, issuesUnchanged:!issuesChanged};
    }
    function showStaleDataDialog(checks){
      const items=[];
      if(checks.notesUnchanged) items.push("Error Notes");
      if(checks.issuesUnchanged) items.push("快捷用语（Issues）");
      const hint=items.join(" 和 ")+"未更新，可能属于上一位学生";
      return new Promise(resolve=>{
        const overlay=document.createElement("div");
        overlay.style.cssText="position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.35);display:grid;place-items:center;backdrop-filter:blur(3px)";
        const dialog=document.createElement("div");
        dialog.style.cssText="background:#fff;border-radius:18px;padding:28px 32px;max-width:400px;width:90%;box-shadow:0 24px 48px rgba(0,0,0,.18);text-align:center;font-family:inherit";
        dialog.innerHTML=`
          <div style="font-size:32px;margin-bottom:12px">&#9888;&#65039;</div>
          <div style="font-weight:800;font-size:16px;margin-bottom:8px;color:#1a1a1a">学生姓名已变更</div>
          <div style="font-size:14px;color:#5a5a5a;margin-bottom:24px;line-height:1.6">
            ${escapeHtml(hint)}。
          </div>
          <div style="display:flex;gap:10px;justify-content:center">
            <button id="staleClearBtn" style="flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:#fff;font-weight:700;cursor:pointer;font-size:14px">清空错题</button>
            <button id="staleProceedBtn" style="flex:1;padding:10px;border-radius:12px;border:0;background:linear-gradient(130deg,#ff6b35,#2ec4b6);color:#fff;font-weight:700;cursor:pointer;font-size:14px">继续生成</button>
          </div>`;
        overlay.appendChild(dialog); document.body.appendChild(overlay);
        document.getElementById("staleProceedBtn").addEventListener("click",()=>{overlay.remove();resolve(true);});
        document.getElementById("staleClearBtn").addEventListener("click",()=>{elements.errorNotes.value="";saveFormDraft();overlay.remove();resolve(false);});
        overlay.addEventListener("click",e=>{if(e.target===overlay){overlay.remove();resolve(false);}});
      });
    }
    function sanitizeHtml(html){
      if(!html || typeof html!=="string") return "";
      // Remove dangerous tags entirely
      const DANGEROUS_TAGS = ['script','iframe','object','embed','form','style','link','meta','base'];
      let sanitized = html;
      for(const tag of DANGEROUS_TAGS){
        sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`,'gis'),'');
        sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*>`,'gi'),'');
        sanitized = sanitized.replace(new RegExp(`<\\/${tag}>`,'gi'),'');
      }
      // Remove event handler attributes
      sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'');
      // Remove javascript: URLs in href/src/action
      sanitized = sanitized.replace(/(href|src|action|formaction|xlink:href)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,'$1=""');
      // Remove data: URLs in href (keep data:image for legitimate images)
      sanitized = sanitized.replace(/href\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi,'href=""');
      return sanitized.trim();
    }
    function convertToInlineStyles(html){
      return html
        .replace(/<strong\b[^>]*>/gi,'<span style="font-weight:700">').replace(/<\/strong>/gi,'</span>')
        .replace(/<b\b[^>]*>/gi,'<span style="font-weight:700">').replace(/<\/b>/gi,'</span>')
        .replace(/<em\b[^>]*>/gi,'<span style="font-style:italic">').replace(/<\/em>/gi,'</span>')
        .replace(/<i\b[^>]*>/gi,'<span style="font-style:italic">').replace(/<\/i>/gi,'</span>')
        .replace(/<mark\b[^>]*>/gi,'<span style="background:#fff59d;padding:0 .2em;border-radius:.2em">').replace(/<\/mark>/gi,'</span>');
    }
    function normalizeLineBreaks(html){
      let h=html.replace(/<div><br><\/div>/gi,'<br>');
      h=h.replace(/<div>/gi,'<br>');
      h=h.replace(/<\/div>/gi,'');
      h=h.replace(/<\/p>\s*<p>/gi,'</p><br><p>');
      return h;
    }
    function getCurrentFeedbackHtml(){
      const rich = (elements.markdownOutput.innerHTML||"").trim();
      if(state.viewMode==="rendered" && rich){
        const clone = elements.markdownOutput.cloneNode(true);
        let rawHtml = sanitizeHtml(clone.innerHTML);
        rawHtml = normalizeLineBreaks(rawHtml);
        rawHtml = convertToInlineStyles(rawHtml);
        return `<div style="white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-width:100%;">${rawHtml}</div>`;
      }
      return `<div style="white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-width:100%;">${escapeHtml(getCurrentFeedbackText())}</div>`;
    }
    function handleLessonTypeChange(){elements.feedbackType.value=elements.lessonType.value==="Day"?"伴学手册反馈":"练习反馈";}
    function updatePreviewCheckboxText(){
      const a=document.getElementById("previewNotSubmitText"), b=document.getElementById("previewHasErrorText");
      const u=elements.previewUnitNumber.value.trim(), t=elements.previewType.value;
      if(u&&elements.hasPreview.checked){const full="U"+u+t; a.textContent=full+" Preview未交"; b.textContent=full+" Preview有错题";}
      else {a.textContent="未交预习"; b.textContent="预习有错题";}
    }
    function handlePreviewChange(){elements.previewWrapper.classList.toggle("hidden",!elements.hasPreview.checked); updatePreviewCheckboxText();}
    function updatePreviewErrorCountVisibility(){
      const checked = Array.from(elements.issues).some(cb=>cb.value==="预习有错题"&&cb.checked);
      const wrap = document.getElementById("previewErrorCountWrap");
      if(wrap) wrap.classList.toggle("hidden", !checked);
    }
    function handleRatingChange(){const ok=elements.rating.value==="A+"; elements.lostSections.disabled=ok; elements.lostSectionsWrapper.style.opacity=ok?"0.5":"1"; if(ok)elements.lostSections.value="";}
    function saveFormDraft(){
      const draft={}; DRAFT_FIELD_IDS.forEach(id=>{const el=document.getElementById(id); if(!el)return; draft[id]=el.type==="checkbox"?el.checked:el.value;});
      draft.issues=Array.from(elements.issues).filter(cb=>cb.checked).map(cb=>cb.value); draft.lastGeneratedStudentName=state.lastGeneratedStudentName; draft.lastGeneratedErrorNotes=state.lastGeneratedErrorNotes; draft.lastGeneratedIssues=state.lastGeneratedIssues; localStorage.setItem(FORM_DRAFT_KEY,JSON.stringify(draft));
    }
    function restoreFormDraft(){
      const raw=localStorage.getItem(FORM_DRAFT_KEY); if(!raw)return;
      try{const draft=JSON.parse(raw); DRAFT_FIELD_IDS.forEach(id=>{const el=document.getElementById(id); if(!el||!(id in draft))return; if(el.type==="checkbox")el.checked=Boolean(draft[id]); else el.value=(id==="greetingTime"&&draft[id]==="中午下午") ? "中午" : draft[id];});
        if(Array.isArray(draft.issues)){elements.issues.forEach(cb=>cb.checked=draft.issues.includes(cb.value));}
        if("lastGeneratedStudentName" in draft) state.lastGeneratedStudentName=draft.lastGeneratedStudentName||"";
        if("lastGeneratedErrorNotes" in draft) state.lastGeneratedErrorNotes=draft.lastGeneratedErrorNotes||"";
        if("lastGeneratedIssues" in draft) state.lastGeneratedIssues=draft.lastGeneratedIssues||[];
      }catch{localStorage.removeItem(FORM_DRAFT_KEY);}
    }
    function setupDraftAutosave(){
      DRAFT_FIELD_IDS.forEach(id=>{const el=document.getElementById(id); if(!el)return; const evt=el.tagName==="SELECT"||el.type==="checkbox"?"change":"input"; el.addEventListener(evt,saveFormDraft);});
      elements.issues.forEach(cb=>cb.addEventListener("change",()=>{saveFormDraft(); updatePreviewErrorCountVisibility();}));
    }
    function setupErrorNotesCounter(){
      const container = document.createElement("div");
      container.className = "notes-bar-container";
      container.innerHTML = `
        <div class="notes-bar-track">
          <div class="notes-bar-fill zone-brief" id="notesBarFill"></div>
        </div>
        <div class="notes-bar-label">
          <span class="notes-bar-hint" id="notesBarHint">--</span>
          <span class="notes-bar-count" id="notesBarCount">0 / 250</span>
        </div>
      `;
      elements.errorNotes.insertAdjacentElement("afterend", container);

      const fill = document.getElementById("notesBarFill");
      const countEl = document.getElementById("notesBarCount");
      const hintEl = document.getElementById("notesBarHint");

      const MAX_CHARS = 250;

      function refresh(){
        const len = elements.errorNotes.value.trim().length;
        const pct = Math.min((len / MAX_CHARS)*100, 100);
        fill.style.width = pct + "%";

        let zone, hintText;
        if(len <= 10){ zone="brief"; hintText="太简短，再加点"; }
        else if(len <= 40){ zone="good"; hintText="偏少，继续补充"; }
        else if(len <= 100){ zone="optimal"; hintText="信息量不错"; }
        else if(len <= 180){ zone="thorough"; hintText="很详细"; }
        else{ zone="extreme"; hintText="超详细"; }

        fill.className = "notes-bar-fill zone-" + zone;
        countEl.textContent = len + " / " + MAX_CHARS;
        hintEl.textContent = hintText;
        hintEl.className = "notes-bar-hint hint-" + zone;
      }

      elements.errorNotes.addEventListener("input", refresh);
      refresh();
    }
    function setupStaleIndicator(){
      const banner=document.createElement("div");
      banner.id="staleNotesBanner";
      banner.style.cssText="display:none;margin-top:8px;padding:6px 12px;border-radius:10px;background:linear-gradient(90deg,#fff7ed,#fef3c7);border:1px solid #fbbf24;font-size:12px;color:#92400e;font-weight:600;align-items:center;gap:8px";
      banner.innerHTML='<span style="font-size:14px">&#9888;&#65039;</span> <span id="staleBannerText">部分内容未更新，可能属于上一位学生</span>';
      const notesBar=elements.errorNotes.nextElementSibling;
      if(notesBar) notesBar.parentNode.insertBefore(banner,notesBar);
      function refresh(){
        const checks=getStaleChecks();
        if(!checks){banner.style.display="none"; return;}
        const items=[];
        if(checks.notesUnchanged) items.push("Error Notes");
        if(checks.issuesUnchanged) items.push("快捷用语");
        const textEl=document.getElementById("staleBannerText");
        if(textEl) textEl.textContent=items.join(" 和 ")+"未更新，可能属于上一位学生";
        banner.style.display="flex";
      }
      elements.studentName.addEventListener("input",refresh);
      elements.errorNotes.addEventListener("input",refresh);
      elements.issues.forEach(cb=>cb.addEventListener("change",refresh));
    }
    function setupClearNotesButton(){
      const btn=document.getElementById("clearNotesBtn"); if(!btn) return;
      function refresh(){btn.style.display=elements.errorNotes.value.trim().length>0?"inline-block":"none";}
      elements.errorNotes.addEventListener("input",refresh);
      btn.addEventListener("click",()=>{
        elements.errorNotes.value=""; saveFormDraft(); refresh();
        const banner=document.getElementById("staleNotesBanner"); if(banner) banner.style.display="none";
        elements.errorNotes.dispatchEvent(new Event("input"));
        elements.errorNotes.focus();
      });
      refresh();
    }
    async function copyToClipboard(text,msg){
      if(!text)return;
      try{await navigator.clipboard.writeText(text); showToast(msg);}
      catch{const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); const ok=document.execCommand("copy"); document.body.removeChild(ta); if(ok)showToast(msg); else showToast("复制失败，请手动复制","error");}
    }
    async function copyRichToClipboard({html,text,msg}){
      if(!text && !html) return;
      const safeHtml = sanitizeHtml(html||"");
      const editable = elements.markdownOutput.contentEditable;
      elements.markdownOutput.contentEditable = "false";
      try{
        if(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write){
          const item = new ClipboardItem({
            "text/html": new Blob([safeHtml],{type:"text/html"}),
            "text/plain": new Blob([text||""],{type:"text/plain"})
          });
          await navigator.clipboard.write([item]);
          showToast(msg);
          if(editable) elements.markdownOutput.contentEditable = editable;
          return;
        }
      }catch(e){console.warn("[Gradify] Rich copy failed:",e);}
      if(editable) elements.markdownOutput.contentEditable = editable;
      await copyToClipboard(text||"", msg);
    }
    function toggleAssistantPanel(forceOpen=null){
      const shouldOpen = forceOpen===null ? elements.assistantPanel.classList.contains("hidden") : Boolean(forceOpen);
      elements.assistantPanel.classList.toggle("hidden", !shouldOpen);
      if(shouldOpen){elements.assistantInput.focus();}
    }
    function renderAssistantMarkdown(text){
      if(!window.marked) return escapeHtml(text||"");
      const renderer = new marked.Renderer();
      renderer.hr = ()=>"";
      const src = String(text||"")
        .replace(/<\/?(u|hr|ins|del)\b[^>]*>/gi,"")
        .replace(/~~([^~]+)~~/g,"$1");
      return sanitizeHtml(marked.parse(src,{breaks:true,gfm:true,renderer}));
    }
    function appendAssistantMessage(role, text, images=[], options={}){
      const bubble=document.createElement("div");
      bubble.className=`assistant-bubble ${role==="user"?"assistant-user":"assistant-ai"}`;
      if(text){
        const textNode = document.createElement("div");
        if(role==="assistant"){
          textNode.className = "assistant-md";
          textNode.innerHTML = renderAssistantMarkdown(text);
        }else{
          textNode.textContent = text;
        }
        bubble.appendChild(textNode);
      }
      if(Array.isArray(images)&&images.length){
        const imageGrid = document.createElement("div");
        imageGrid.className="assistant-inline-images";
        images.forEach((src)=>{
          const img = document.createElement("img");
          img.src=src; img.alt="assistant-upload"; img.loading="lazy";
          imageGrid.appendChild(img);
        });
        bubble.appendChild(imageGrid);
      }
      if(options.usage && typeof options.usage.total_tokens === "number"){
        const meta = document.createElement("div");
        meta.className="assistant-meta";
        const p=options.usage.prompt_tokens?? "-";
        const c=options.usage.completion_tokens?? "-";
        const t=options.usage.total_tokens?? "-";
        const modelText = options.modelUsed ? `  Model: ${options.modelUsed}` :"";
        meta.textContent=`Tokens  Prompt: ${p}  Completion: ${c}  Total: ${t}${modelText}`;
        bubble.appendChild(meta);
        const wsUsage = options.usage.web_search_usage;
        if(wsUsage && typeof wsUsage==="object"){
          const wsMeta = document.createElement("div");
          wsMeta.className="assistant-meta";
          wsMeta.textContent=`Web Search  Tool Usage: ${wsUsage.tool_usage??"-"}  Page Usage: ${wsUsage.page_usage??"-"}`;
          bubble.appendChild(wsMeta);
        }
      }
      if(Array.isArray(options.citations)&&options.citations.length){
        const citeWrap = document.createElement("div");
        citeWrap.className="assistant-meta";
        citeWrap.textContent="Sources: ";
        options.citations.slice(0,3).forEach((c,idx)=>{
          if(!c||!c.url) return;
          const a = document.createElement("a");
          a.href=c.url; a.target="_blank"; a.rel="noopener noreferrer";
          a.className="underline mr-2";
          a.textContent=c.site_name||c.title||`Source ${idx+1}`;
          citeWrap.appendChild(a);
        });
        bubble.appendChild(citeWrap);
      }
      elements.assistantMessages.appendChild(bubble);
      elements.assistantMessages.scrollTop=elements.assistantMessages.scrollHeight;
    }
    function startAssistantThinking(){
      stopAssistantThinking();
      state.assistantThinkingStartedAt = Date.now();
      const node = document.createElement("div");
      node.className="assistant-bubble assistant-ai";
      node.textContent="助教正在思考中... 00:00";
      elements.assistantMessages.appendChild(node);
      elements.assistantMessages.scrollTop=elements.assistantMessages.scrollHeight;
      state.assistantThinkingNode = node;
      state.assistantThinkingTimer = setInterval(()=>{
        if(!state.assistantThinkingNode) return;
        const sec=Math.floor((Date.now()-state.assistantThinkingStartedAt)/1000);
        const mm=String(Math.floor(sec/60)).padStart(2,"0");
        const ss=String(sec%60).padStart(2,"0");
        state.assistantThinkingNode.textContent=`助教正在思考中... ${mm}:${ss}`;
      },1000);
    }
    function stopAssistantThinking(){
      if(state.assistantThinkingTimer){ clearInterval(state.assistantThinkingTimer); state.assistantThinkingTimer=null; }
      if(state.assistantThinkingNode){ state.assistantThinkingNode.remove(); state.assistantThinkingNode=null; }
    }
    function speakText(text){
      if(!("speechSynthesis" in window)) return;
      if(!state.readAloudEnabled) return;
      const msg=new SpeechSynthesisUtterance(String(text||"").slice(0,800));
      msg.lang="zh-CN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
    }
    function refreshReadAloudButton(){
      elements.assistantReadAloudBtn.classList.toggle("is-active", Boolean(state.readAloudEnabled));
      elements.assistantReadAloudBtn.title = state.readAloudEnabled ? "语音播报已开启" : "语音播报已关闭";
    }
    function refreshSearchButton(){
      elements.assistantSearchBtn.classList.toggle("is-active", Boolean(state.assistantWebSearchEnabled));
      elements.assistantSearchBtn.title = state.assistantWebSearchEnabled ? "联网搜索已开启" : "联网搜索已关闭";
    }
    function renderAssistantImages(){
      const tray = elements.assistantImageTray;
      tray.innerHTML="";
      if(!state.assistantImages.length){ tray.classList.add("hidden"); return; }
      tray.classList.remove("hidden");
      state.assistantImages.forEach((item,idx)=>{
        const card = document.createElement("div");
        card.className="relative";
        card.innerHTML=`<img src="${item.url}" class="w-14 h-14 object-cover rounded-lg border border-black/10"><button data-idx="${idx}" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[10px] leading-4">×</button>`;
        tray.appendChild(card);
      });
      tray.querySelectorAll("button[data-idx]").forEach(btn=>{
        btn.addEventListener("click",()=>{
          const idx=Number(btn.getAttribute("data-idx"));
          state.assistantImages.splice(idx,1);
          renderAssistantImages();
        });
      });
    }
    function fileToDataUrl(file){
      return new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(String(reader.result||""));
        reader.onerror=reject;
        reader.readAsDataURL(file);
      });
    }
    async function addAssistantImage(file){
      if(!file || !file.type.startsWith("image/")) return;
      if(state.assistantImages.length>=3){showToast("最多添加3张图片","error"); return;}
      const url = await fileToDataUrl(file);
      state.assistantImages.push({url});
      renderAssistantImages();
    }
    function initVoiceInput(){
      const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){ elements.assistantVoiceBtn.disabled=true; elements.assistantVoiceBtn.title="当前浏览器不支持语音输入"; return; }
      state.recognition=new SR();
      state.recognition.lang="zh-CN";
      state.recognition.interimResults=false;
      state.recognition.maxAlternatives=1;
      state.recognition.onresult=(event)=>{
        const text=event.results?.[0]?.[0]?.transcript||"";
        if(!text) return;
        elements.assistantInput.value=elements.assistantInput.value ? `${elements.assistantInput.value}\n${text}` : text;
      };
      state.recognition.onend=()=>{
        state.recognizing=false;
        elements.assistantVoiceBtn.classList.remove("is-active");
      };
    }
    async function askAssistant(){
      if(state.assistantLoading) return;
      const question=(elements.assistantInput.value||"").trim();
      if(!question&&!state.assistantImages.length){showToast("先输入问题或添加图片","error"); elements.assistantInput.focus(); return;}
      const sentImages=state.assistantImages.map(x=>x.url);
      appendAssistantMessage("user",question||"",sentImages);
      elements.assistantInput.value="";
      state.assistantLoading=true;
      elements.assistantAskBtn.disabled=true;
      elements.assistantAskBtn.textContent="思考中...";
      startAssistantThinking();
      try{
        const response=await fetch("/api/assistant/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,images:sentImages,web_search_enabled:state.assistantWebSearchEnabled})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok) throw new Error(data.detail||`HTTP ${response.status}`);
        const answer=data.answer||"助教暂时没有返回内容。";
        appendAssistantMessage("assistant",answer,[],{usage:data.usage||null,modelUsed:data.model_used||"",citations:data.citations||[]});
        speakText(answer);
      }catch(error){
        appendAssistantMessage("assistant",`抱歉，这次回答失败了：${error.message}`);
      }finally{
        stopAssistantThinking();
        state.assistantImages=[];
        renderAssistantImages();
        state.assistantLoading=false;
        elements.assistantAskBtn.disabled=false;
        elements.assistantAskBtn.textContent="提问";
      }
    }
    async function loadModelLabels(){
      const generateFallback="mimo-v2-pro";
      const assistantFallback="mimo-v2-omni";
      let generateModel=generateFallback;
      let assistantModel=assistantFallback;
      try{
        const response=await fetch("/api/models");
        if(response.ok){
          const data=await response.json();
          generateModel=data.generate_model||generateFallback;
          assistantModel=data.assistant_model||assistantFallback;
        }
      }catch{}
      elements.generateModelLabel.innerHTML=`<span class="model-dot"></span>Model: ${escapeHtml(generateModel)}`;
      elements.assistantModelLabel.innerHTML=`<span class="model-dot"></span>Model: ${escapeHtml(assistantModel)}`;
    }
    async function generateFeedback(){
      if(state.isGenerating)return;
      if(!elements.studentName||!elements.unitNumber){
        console.error("[Gradify] Critical form elements missing");
        showToast("页面初始化不完整，请刷新重试","error");
        return;
      }
      if(!elements.studentName.value.trim()){showToast("请输入学生英文名","error"); elements.studentName.focus(); return;}
      if(!elements.unitNumber.value.trim()){showToast("请输入单元号","error"); elements.unitNumber.focus(); return;}
      // Stale data guard: detect student name change since last generation
      {const staleChecks=getStaleChecks();
       if(staleChecks){
         const proceed=await showStaleDataDialog(staleChecks); if(!proceed) return;
       }
      }
      let unitProgress=""; const unitNum=elements.unitNumber.value.trim(), lessonType=elements.lessonType.value, lessonNum=elements.lessonNumber.value;
      if(lessonType==="Day"){unitProgress=`U${unitNum}Day${lessonNum}`; if(elements.hasPreview.checked&&elements.previewUnitNumber.value.trim()){const pType=elements.previewType.value, pUnit=elements.previewUnitNumber.value.trim(); unitProgress+=`&U${pUnit}${pType} Preview`;}}
      else {unitProgress=`U${unitNum}${lessonType}${lessonNum}`;}
      const previewErrorCountRaw=parseInt(document.getElementById("previewErrorCount").value,10);
      const previewErrorCount=Number.isNaN(previewErrorCountRaw)?1:Math.min(5,Math.max(1,previewErrorCountRaw));
      const formData={student_name:elements.studentName.value.trim(),unit_progress:unitProgress,feedback_type:elements.feedbackType.value,greeting_time:elements.greetingTime.value,rating:elements.rating.value,lost_sections:elements.lostSections.value.trim(),error_notes:elements.errorNotes.value.trim(),preview_error_count:previewErrorCount,issues:Array.from(elements.issues).filter(cb=>cb.checked).map(cb => { if(cb.value==="缺作业页面"){const n=document.getElementById("missingTaskNumber").value,c=document.getElementById("missingTaskContent").value.trim()||"判断题部分"; return `缺作业页面:${n}:${c}`;} return cb.value; })};
      elements.greetingCard.classList.add("hidden"); elements.greetingText.textContent=""; state.greetingContent=""; state.fullContent="";
      elements.emptyState.classList.add("hidden"); elements.feedbackContent.classList.add("hidden"); elements.loadingSkeleton.classList.remove("hidden"); elements.markdownOutput.innerHTML="";
      // 重置 AI 统计卡片 + 启动思考计时器（计时器在 loadingSkeleton 内）
      const statsCard=document.getElementById("aiStatsCard");
      if(statsCard)statsCard.classList.add("hidden");
      ["statPromptTokens","statCompletionTokens","statTotalTokens","statTtft","statTotalTime","statCostValue"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent="--";});
      const rw=document.getElementById("statReasoningWrap");if(rw)rw.classList.add("hidden");
      const rc=document.getElementById("statReasoningContent");if(rc)rc.textContent="";
      // 启动思考计时（loadingSkeleton 已显示，计时器在其中）
      if(state.thinkingTimerInterval)clearInterval(state.thinkingTimerInterval);
      state.thinkingTimerStart=Date.now();
      state.thinkingTimerInterval=setInterval(()=>{
        const el=document.getElementById("thinkingElapsedTime");
        if(el)el.textContent=((Date.now()-state.thinkingTimerStart)/1000).toFixed(1)+"s";
      },100);
      elements.markdownOutput.contentEditable="false";
      elements.copyAllBtn.disabled=true; elements.copyGreetingBtn.disabled=true; elements.copyFeedbackBtn.disabled=true;
      setButtonLoading(true); showGenerateStatus("正在连接生成服务...","info");
      try{
        const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(formData)}); if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const reader=response.body.getReader(), decoder=new TextDecoder();
        while(true){
          const {done,value}=await reader.read(); if(done)break;
          const lines=decoder.decode(value).split("\n");
          for(const line of lines){
            if(!line.startsWith("data: "))continue;
            try{
              const data=JSON.parse(line.slice(6));
              if(data.type==="greeting"){showGenerateStatus("问候语已生成，正在生成批改记录...","info"); state.greetingContent=data.content||""; elements.greetingText.textContent=state.greetingContent; elements.greetingCard.classList.remove("hidden"); elements.copyGreetingBtn.disabled=!state.greetingContent;}
              else if(data.type==="header"){showGenerateStatus("模板生成完成，AI 正在扩写中...","info"); state.fullContent+=data.content||"";}
              else if(data.type==="footer"){showGenerateStatus("正在添加备注信息...","info"); state.fullContent+=data.content||"";}
              else if(data.type==="stats"){
                // 停止思考计时器，显示完整指标
                if(state.thinkingTimerInterval){clearInterval(state.thinkingTimerInterval);state.thinkingTimerInterval=null;}
                const sc=document.getElementById("aiStatsCard"),sd=data.data;
                if(sc)sc.classList.remove("hidden");
                const fmt=(v)=>v!=null?v:"--";
                const pt=document.getElementById("statPromptTokens"),ct=document.getElementById("statCompletionTokens"),tt=document.getElementById("statTotalTokens");
                if(pt)pt.textContent=fmt(sd.prompt_tokens);if(ct)ct.textContent=fmt(sd.completion_tokens);if(tt)tt.textContent=fmt(sd.total_tokens);
                const ttf=document.getElementById("statTtft"),tot=document.getElementById("statTotalTime");
                if(ttf)ttf.textContent=sd.ttft_ms!=null?(sd.ttft_ms/1000).toFixed(1)+"s":"--";
                if(tot)tot.textContent=sd.total_ms!=null?(sd.total_ms/1000).toFixed(1)+"s":"--";
                if(sd.reasoning){const rw=document.getElementById("statReasoningWrap"),rc=document.getElementById("statReasoningContent");if(rw)rw.classList.remove("hidden");if(rc)rc.textContent=sd.reasoning;}
                // 费用估算：输入 ¥7/1M + 输出 ¥21/1M
                const costEl=document.getElementById("statCostValue");
                if(costEl&&sd.prompt_tokens!=null&&sd.completion_tokens!=null){
                  const cost=(sd.prompt_tokens/1e6*7)+(sd.completion_tokens/1e6*21);
                  costEl.textContent="¥"+cost.toFixed(8);
                }
                scrollToBottom();
              }
              else if(data.type==="complete"||data.done){
                if(state.thinkingTimerInterval){clearInterval(state.thinkingTimerInterval);state.thinkingTimerInterval=null;}
                state.lastGeneratedStudentName=elements.studentName.value.trim(); state.lastGeneratedErrorNotes=elements.errorNotes.value.trim(); state.lastGeneratedIssues=Array.from(elements.issues).filter(cb=>cb.checked).map(cb=>cb.value).sort(); saveFormDraft();
                const staleBanner=document.getElementById("staleNotesBanner"); if(staleBanner) staleBanner.style.display="none";
                showGenerateStatus("生成完成","success"); elements.copyAllBtn.disabled=!(state.greetingContent||state.fullContent); elements.copyFeedbackBtn.disabled=!state.fullContent;
              }
              else if(data.error){throw new Error(data.error);}
              else if(data.content){showGenerateStatus("AI 正在生成解析...","info"); state.fullContent+=data.content;}
              renderFeedback(); scrollToBottom();
            }catch{}
          }
        }
        elements.loadingSkeleton.classList.add("hidden");
        elements.feedbackContent.classList.remove("hidden");
        showToast("反馈生成完成");
        elements.markdownOutput.contentEditable="true";
      }catch(error){
        if(state.thinkingTimerInterval){clearInterval(state.thinkingTimerInterval);state.thinkingTimerInterval=null;}
        elements.loadingSkeleton.classList.add("hidden");
        elements.emptyState.classList.remove("hidden");
        showGenerateStatus("生成失败: "+error.message,"error"); showToast("生成失败，请检查网络连接","error");}
      finally{setButtonLoading(false); if(elements.markdownOutput.contentEditable!=="true"){elements.markdownOutput.contentEditable="true";}}
    }
    elements.lessonType.addEventListener("change",handleLessonTypeChange);
    elements.hasPreview.addEventListener("change",handlePreviewChange);
    elements.previewUnitNumber.addEventListener("input",updatePreviewCheckboxText);
    elements.previewType.addEventListener("change",updatePreviewCheckboxText);
    elements.rating.addEventListener("change",handleRatingChange);
    elements.generateBtn.addEventListener("click",generateFeedback);
    elements.copyAllBtn.addEventListener("click",async()=>{
      const editedText=getCurrentFeedbackText(), editedHtml=getCurrentFeedbackHtml();
      if(!state.greetingContent&&!editedText)return;
      const greetingText = state.greetingContent ? `${state.greetingContent}\n\n` : "";
      const greetingHtml = state.greetingContent ? `<p>${escapeHtml(state.greetingContent).replace(/\n/g,"<br>")}</p><p><br></p>` : "";
      await copyRichToClipboard({
        html:`${greetingHtml}${editedHtml}`,
        text:`${greetingText}${editedText}`,
        msg:"全部内容复制成功"
      });
    });
    elements.copyGreetingBtn.addEventListener("click",()=>copyToClipboard(state.greetingContent,"问候语复制成功"));
    elements.copyFeedbackBtn.addEventListener("click",()=>copyRichToClipboard({
      html:getCurrentFeedbackHtml(),
      text:getCurrentFeedbackText(),
      msg:"反馈复制成功"
    }));
    elements.viewModeBtn.addEventListener("click",()=>{
      state.fullContent = getCurrentFeedbackText();
      state.viewMode = state.viewMode==="rendered" ? "raw" : "rendered";
      syncViewModeButton();
      renderFeedback();
    });
    document.getElementById("quickTaskPreset").addEventListener("change",(e)=>{
      const v=e.target.value;
      if(!v) return;
      const input=document.getElementById("quickTaskContent");
      input.value=v; input.focus(); saveFormDraft();
    });
    // 缺作业页面自定义面板
    document.querySelectorAll('input[name="issues"]').forEach(cb => {
      if (cb.value === "缺作业页面") {
        cb.addEventListener("change", () => {
          document.getElementById("missingPageConfig").classList.toggle("hidden", !cb.checked);
        });
      }
    });
    document.getElementById("missingTaskPreset").addEventListener("change", (e) => {
      const v = e.target.value;
      if (!v) return;
      const input = document.getElementById("missingTaskContent");
      input.value = v + "部分";
      input.focus();
      saveFormDraft();
    });
    // Thinking Process 展开/收起图标旋转
    document.querySelectorAll(".ai-reasoning-summary").forEach(sum=>{
      sum.addEventListener("toggle",()=>{sum.classList.toggle("expanded",sum.open);});
    });
    document.getElementById("boldBtn").addEventListener("click",()=>applyEditorCommand("bold"));
    document.getElementById("italicBtn").addEventListener("click",toggleItalicSelection);
    document.getElementById("highlightBtn").addEventListener("click",toggleHighlightSelection);
    document.getElementById("dividerBtn").addEventListener("click",insertDivider);
    elements.markdownOutput.addEventListener("keydown",(e)=>{
      if(e.key!=="Enter"||e.ctrlKey||e.metaKey||e.altKey) return;
      e.preventDefault();
      const sel=window.getSelection();
      if(sel&&sel.rangeCount){
        const range=sel.getRangeAt(0);
        const br=document.createElement("br");
        range.deleteContents();
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
    document.getElementById("copyTaskBtn").addEventListener("click",()=>{const n=document.getElementById("quickTaskNumber").value,c=document.getElementById("quickTaskContent").value.trim(); if(!c){showToast("请输入Task内容","error"); return;} copyRichToClipboard({html:`<strong>Task${n} ${escapeHtml(c)}部分</strong>`,text:`Task${n} ${c}部分`,msg:"Task内容复制成功"});});
    document.getElementById("copyReadingBtn").addEventListener("click",()=>{const u=document.getElementById("quickReadingUnit").value.trim(); if(!u){showToast("请输入单元号","error"); return;} const t=document.getElementById("quickReadingType").value; copyRichToClipboard({html:`<strong>Reading Skill ${escapeHtml(u+t)}</strong>`,text:`Reading Skill ${u}${t}`,msg:"Reading Skill复制成功"});});
    document.getElementById("copyVocabBtn").addEventListener("click",()=>copyRichToClipboard({html:"<strong>Vocabulary部分</strong>",text:"Vocabulary部分",msg:"Vocabulary部分复制成功"}));
    document.getElementById("copyReadingPartBtn").addEventListener("click",()=>copyRichToClipboard({html:"<strong>Reading部分</strong>",text:"Reading部分",msg:"Reading部分复制成功"}));
    elements.assistantFab.addEventListener("click",()=>toggleAssistantPanel());
    elements.assistantCloseBtn.addEventListener("click",()=>toggleAssistantPanel(false));
    elements.assistantAskBtn.addEventListener("click",askAssistant);
    elements.assistantImageBtn.addEventListener("click",()=>elements.assistantImageInput.click());
    elements.assistantImageInput.addEventListener("change",async(e)=>{
      const files=Array.from(e.target.files||[]);
      for(const f of files){await addAssistantImage(f);}
      elements.assistantImageInput.value="";
    });
    elements.assistantInput.addEventListener("paste",async(e)=>{
      const items=Array.from(e.clipboardData?.items||[]);
      const imageItems=items.filter(i=>i.type&&i.type.startsWith("image/"));
      if(!imageItems.length) return;
      e.preventDefault();
      for(const item of imageItems){
        const file=item.getAsFile();
        if(file) await addAssistantImage(file);
      }
    });
    elements.assistantVoiceBtn.addEventListener("click",()=>{
      if(!state.recognition){showToast("当前浏览器不支持语音输入","error"); return;}
      if(state.recognizing){state.recognition.stop(); return;}
      state.recognizing=true;
      elements.assistantVoiceBtn.classList.add("is-active");
      state.recognition.start();
    });
    elements.assistantReadAloudBtn.addEventListener("click",()=>{
      state.readAloudEnabled=!state.readAloudEnabled;
      refreshReadAloudButton();
    });
    elements.assistantSearchBtn.addEventListener("click",()=>{
      state.assistantWebSearchEnabled=!state.assistantWebSearchEnabled;
      refreshSearchButton();
    });
    elements.assistantInput.addEventListener("keydown",(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault(); askAssistant();}});
    document.addEventListener("keydown",(e)=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){
        e.preventDefault();
        if(document.activeElement===elements.assistantInput){askAssistant(); return;}
        // Only trigger generation when focus is within form or output area
        const formArea=document.getElementById("feedbackForm");
        const isInForm=formArea&&formArea.contains(document.activeElement);
        const isInOutput=elements.markdownOutput&&elements.markdownOutput.contains(document.activeElement);
        if(isInForm||isInOutput){ generateFeedback(); }
      }
    });

    // ===== Token 预估（防抖） =====
    let estimateDebounce=null;
    function updateTokenEstimate(){
      clearTimeout(estimateDebounce);
      estimateDebounce=setTimeout(async()=>{
        try{
          const unitNum=elements.unitNumber.value.trim(),lessonType=elements.lessonType.value,lessonNum=elements.lessonNumber.value;
          let unitProgress="";
          if(lessonType==="Day"){unitProgress=`U${unitNum}Day${lessonNum}`; if(elements.hasPreview.checked&&elements.previewUnitNumber.value.trim()){const pType=elements.previewType.value,pUnit=elements.previewUnitNumber.value.trim(); unitProgress+=`&U${pUnit}${pType} Preview`;}}
          else{unitProgress=`U${unitNum}${lessonType}${lessonNum}`;}
          const issuesPayload=Array.from(elements.issues).filter(cb=>cb.checked).map(cb => { if(cb.value==="缺作业页面"){const n=document.getElementById("missingTaskNumber").value,c=document.getElementById("missingTaskContent").value.trim()||"判断题部分"; return `缺作业页面:${n}:${c}`;} return cb.value; });
          const payload={student_name:elements.studentName.value.trim(),unit_progress:unitProgress,feedback_type:elements.feedbackType.value,greeting_time:elements.greetingTime.value,rating:elements.rating.value,lost_sections:elements.lostSections.value.trim(),error_notes:elements.errorNotes.value.trim(),preview_error_count:1,issues:issuesPayload};
          const res=await fetch("/api/estimate-tokens",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
          const data=await res.json();
          const el=document.getElementById("tokenEstimateValue");
          if(el&&data.estimated_tokens!=null){el.textContent=data.estimated_tokens;el.classList.remove("stat-fade-in");void el.offsetWidth;el.classList.add("stat-fade-in");}
        }catch{}
      },350);
    }
    // 监听关键表单字段变化
    ["studentName","unitNumber","lessonType","lessonNumber","feedbackType","greetingTime","rating","lostSections","errorNotes","hasPreview","previewUnitNumber","previewType"].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.addEventListener(id==="hasPreview"?"change":"input",updateTokenEstimate);
    });
    document.querySelectorAll('input[name="issues"]').forEach(cb=>cb.addEventListener("change",updateTokenEstimate));
    document.getElementById("missingTaskNumber")?.addEventListener("change",updateTokenEstimate);
    document.getElementById("missingTaskPreset")?.addEventListener("change",updateTokenEstimate);
    document.getElementById("missingTaskContent")?.addEventListener("input",updateTokenEstimate);
    // 初始估算
    updateTokenEstimate();

    // Validate DOM elements and log warnings
    const missingElements=Object.entries(elements).filter(([,el])=>el===null).map(([name])=>name);
    if(missingElements.length>0){ console.warn("[Gradify] Missing DOM elements:",missingElements.join(", ")); }

    // ===== 动态计算 output-scroll 高度（修复边框） =====
    function fitOutputScroll(){
      const rp=document.querySelector(".right-panel");
      const os=document.querySelector(".output-scroll");
      if(!rp||!os)return;
      const rh=document.querySelector(".right-head")?.offsetHeight||0;
      const qt=document.querySelector(".quick-tools")?.offsetHeight||0;
      const h=rp.offsetHeight-rh-qt;
      os.style.height=Math.max(h,200)+"px";
    }
    window.addEventListener("resize",fitOutputScroll);
    document.querySelector(".quick-tools")?.addEventListener("toggle",()=>setTimeout(fitOutputScroll,50));
    fitOutputScroll();

    // ===== Splash Screen v5 =====
    function initSplash(){
      var splash=document.getElementById("splashScreen");
      if(!splash) return;

      // Custom cursor
      var cursorEl=splash.querySelector(".splash-custom-cursor");
      if(cursorEl){
        cursorEl.classList.add("active");
        splash.addEventListener("mousemove",function(e){
          cursorEl.style.left=e.clientX+"px";
          cursorEl.style.top=e.clientY+"px";
        });
        // Magnifier on feature cards
        var feats=splash.querySelectorAll(".splash-feat");
        feats.forEach(function(f){
          f.addEventListener("mouseenter",function(){ cursorEl.classList.add("magnified"); });
          f.addEventListener("mouseleave",function(){ cursorEl.classList.remove("magnified"); });
        });
      }

      // Canvas mouse trail
      initMouseTrail(splash);

      // Button + keyboard dismiss
      var btn=document.getElementById("splashEnterBtn");
      if(btn) btn.addEventListener("click",function(){ dismissSplash(splash); });
      document.addEventListener("keydown",function _sk(e){
        if((e.key==="Enter"||e.key===" ")&&!splashDismissed){
          e.preventDefault(); dismissSplash(splash);
          document.removeEventListener("keydown",_sk);
        }
      });

      // Entrance sequence
      setTimeout(function(){ playEntrance(splash); }, 300);
    }

    /* --- Mouse Trail (canvas-based, colorful glowing particles) --- */
    function initMouseTrail(container){
      var canvas=document.getElementById("splashTrailCanvas");
      if(!canvas) return;
      var ctx=canvas.getContext("2d");
      var particles=[];
      var hue=0;

      function resize(){
        canvas.width=window.innerWidth; canvas.height=window.innerHeight;
      }
      resize(); window.addEventListener("resize",resize);

      container.addEventListener("mousemove",function(e){
        var x=e.clientX, y=e.clientY;
        hue=(hue+4)%360;
        for(var i=0;i<3;i++){
          particles.push({
            x:x+(Math.random()-.5)*10,
            y:y+(Math.random()-.5)*10,
            vx:(Math.random()-.5)*1.5,
            vy:(Math.random()-.5)*1.5+0.4,
            size:Math.random()*8+5,
            life:1,
            color:"hsla("+hue+",75%,60%,"
          });
        }
        if(particles.length>150) particles.splice(0,particles.length-150);
      });

      function animate(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for(var i=particles.length-1;i>=0;i--){
          var p=particles[i];
          p.x+=p.vx; p.y+=p.vy; p.life-=0.015; p.size*=0.97;
          if(p.life<=0||p.size<.5){ particles.splice(i,1); continue; }
          ctx.shadowColor=p.color+"0.5)";
          ctx.shadowBlur=10;
          ctx.beginPath();
          ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
          ctx.fillStyle=p.color+p.life+")";
          ctx.fill();
        }
        ctx.shadowBlur=0;
        requestAnimationFrame(animate);
      }
      animate();
    }

    /* Typewriter with pauses */
    var PAUSES={7:300,15:250};
    function typeWriter(el,text,speed,cb){
      var i=0; el.textContent="";
      function step(){
        if(i<text.length){
          el.textContent+=text.charAt(i); i++;
          var delay=PAUSES[i]||(speed+(Math.random()*16));
          setTimeout(step,delay);
        }
        else if(cb) cb();
      }
      step();
    }

    /* Entrance sequence */
    function playEntrance(splash){
      var tw=splash.querySelector(".splash-typewriter");
      var cur=splash.querySelector(".splash-cursor");
      var tag=splash.querySelector(".splash-tagline");
      var desc=splash.querySelector(".splash-desc");
      var feats=splash.querySelectorAll(".splash-feat");
      var act=splash.querySelector(".splash-action");
      var mat=splash.querySelector(".splash-matrix");

      if(tw){
        setTimeout(function(){
          typeWriter(tw,"Gradify Studio",48,function(){
            if(cur) setTimeout(function(){ cur.style.display="none"; },300);
            // Tagline + desc together
            if(tag) setTimeout(function(){ tag.classList.add("show"); },100);
            if(desc) setTimeout(function(){ desc.classList.add("show"); },200);
            // Feature cards stagger (start early, overlap with desc)
            feats.forEach(function(f,i){
              setTimeout(function(){ f.classList.add("show"); },300+i*120);
            });
            // CTA button + Matrix sync
            if(act) setTimeout(function(){ act.classList.add("show"); },700);
            if(mat) setTimeout(function(){ mat.classList.add("show"); },750);
          });
        },250);
      }
    }

    function dismissSplash(splash){
      if(splashDismissed) return;
      splashDismissed=true;

      // 1. Fire confetti from button position
      var btn=splash.querySelector(".splash-enter-btn");
      var cx=window.innerWidth/2, cy=window.innerHeight/2;
      if(btn){
        var r=btn.getBoundingClientRect();
        cx=r.left+r.width/2; cy=r.top+r.height/2;
      }
      spawnConfetti(cx,cy);

      // 2. Scale-up + fade exit
      splash.style.transition="opacity .7s cubic-bezier(.4,0,.2,1),transform .7s cubic-bezier(.4,0,.2,1),visibility .7s cubic-bezier(.4,0,.2,1)";
      splash.style.opacity="0";
      splash.style.transform="scale(1.03)";
      setTimeout(function(){
        splash.style.visibility="hidden";
        splash.style.pointerEvents="none";
        splash.classList.add("is-hidden");
        onSplashComplete();
      },750);
    }

    function spawnConfetti(cx,cy){
      var colors=["#ff6b35","#2ec4b6","#6366f1","#fbbf24","#f472b6","#34d399","#fb923c"];
      var count=45;
      for(var i=0;i<count;i++){
        var el=document.createElement("div");
        var isRound=Math.random()>.5;
        el.className="splash-confetti"+(isRound?" splash-confetti--round":"");
        var angle=Math.random()*Math.PI*2;
        var dist=120+Math.random()*260;
        var tx=Math.cos(angle)*dist;
        var ty=Math.sin(angle)*dist - 80; // bias upward
        var rot=(Math.random()*720-360);
        var dur=.7+Math.random()*.5;
        el.style.cssText="left:"+cx+"px;top:"+cy+"px;"+
          "width:"+(5+Math.random()*6)+"px;height:"+(5+Math.random()*6)+"px;"+
          "background:"+colors[i%colors.length]+";"+
          "--tx:"+tx+"px;--ty:"+ty+"px;--rot:"+rot+"deg;--dur:"+dur+"s;";
        document.body.appendChild(el);
        (function(e,d){setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e)},d*1000+200)})(el,dur);
      }
    }
    function onSplashComplete(){}

    // Safe initialization with per-step error isolation
    function initApp(){
      const initSteps=[
        ["initSplash",initSplash],
        ["restoreFormDraft",restoreFormDraft],
        ["setupDraftAutosave",setupDraftAutosave],
        ["setupErrorNotesCounter",setupErrorNotesCounter],
        ["setupStaleIndicator",setupStaleIndicator],
        ["setupClearNotesButton",setupClearNotesButton],
        ["handleLessonTypeChange",handleLessonTypeChange],
        ["handlePreviewChange",handlePreviewChange],
        ["handleRatingChange",handleRatingChange],
        ["updatePreviewCheckboxText",updatePreviewCheckboxText],
        ["updatePreviewErrorCountVisibility",updatePreviewErrorCountVisibility],
        ["syncViewModeButton",syncViewModeButton],
        ["loadModelLabels",loadModelLabels],
        ["initVoiceInput",initVoiceInput],
        ["refreshReadAloudButton",refreshReadAloudButton],
        ["refreshSearchButton",refreshSearchButton],
      ];
      for(const [name,fn] of initSteps){
        try{ fn(); }
        catch(err){ console.warn(`[Gradify] Init step "${name}" failed:`,err); }
      }
    }
    // Assistant panel drag-to-resize
    (function(){
      const panel = elements.assistantPanel;
      const handle = document.getElementById("assistantResizeHandle");
      if(!panel||!handle) return;

      const STORAGE_KEY = "gradify_assistant_size";
      let startX, startY, startW, startH, isResizing = false;

      try{
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
        if(saved && saved.w && saved.h){
          panel.style.width = Math.max(360, Math.min(90*window.innerWidth/100, saved.w)) + "px";
          panel.style.height = Math.max(300, Math.min(85*window.innerHeight/100, saved.h)) + "px";
        }
      }catch(e){}

      handle.addEventListener("mousedown",(e)=>{
        e.preventDefault();
        isResizing = true;
        const rect = panel.getBoundingClientRect();
        startX = e.clientX; startY = e.clientY;
        startW = rect.width; startH = rect.height;
        document.body.style.cursor = "nwse-resize";
        document.body.style.userSelect = "none";
      });

      document.addEventListener("mousemove",(e)=>{
        if(!isResizing) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newW = Math.max(360, Math.min(90*window.innerWidth/100, startW + dx));
        const newH = Math.max(300, Math.min(85*window.innerHeight/100, startH + dy));
        panel.style.width = newW + "px";
        panel.style.height = newH + "px";
      },{passive:true});

      document.addEventListener("mouseup",()=>{
        if(!isResizing) return;
        isResizing = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({w:panel.offsetWidth, h:panel.offsetHeight})); }
        catch(e){}
      });
    })();

    initApp();
