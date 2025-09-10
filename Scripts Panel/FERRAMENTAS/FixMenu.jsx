#target "indesign";
#targetengine "TableMarker"; // mantém a paleta viva

//Fix Menu — Eduqi

(function () {
    // ---------- evita janelas duplicadas ----------
    var G = $.global; G.__TABLEFIX__ = G.__TABLEFIX__ || {};
    if (G.__TABLEFIX__.win && G.__TABLEFIX__.win.visible) { try { G.__TABLEFIX__.win.active = true; } catch(_){} return; }

    // ===================== NOMES DOS ESTILOS =====================
    var GRP_ACERVO    = "ACERVO";
    var PS_VERSALETE  = "VERSALETE";
    var PS_SUBTOPICO  = "SUBTÓPICO";
    var PS_TOPICO     = "TÓPICO";
    var PS_LISTA      = "LISTA";
    var PS_LISTA2     = "LISTA II";
    var PS_REFERENCIA = "REFERÊNCIA";

    var ALLOWED_GROUPS = ["ACERVO","SL","OP","[Parágrafo Básico]","SUMÁRIO"];
    var BOLD_STYLES = ["Bold","Bold Italic","Semibold","SemiBold","Demi Bold","DemiBold","Black","Heavy","Negrito","Negrito Itálico","Seminegrito"];

    var SUBSTITUICOES = [
        [["ASSUNTO","Título 2"], "VERSALETE"],
        ["TOPICOS", "TÓPICO"],
        ["Título 3", "TÓPICO"],
        ["Título 4", "SUBTÓPICO"],
        ["LISTA 1", "LISTA"],
        ["LISTA 2", "LISTA"],
        ["Lista 1", "LISTA"],
        ["Lista 2", "LISTA"],
        ["Lista",   "LISTA"],
        ["Normal", "[Parágrafo básico]"],
        ["Normal (Web)", "[Parágrafo básico]"],
        ["Default", "[Parágrafo básico]"],
        ["List Paragraph", "[Parágrafo básico]"],
        ["TEXTO BASE", "[Parágrafo básico]"],
        ["texto base", "[Parágrafo básico]"],
        ["SEM ESPAÇO", "CENTRALIZAR"],
        ["TITULO DE LEI", "TÍTULO DE LEI"],
        ["ALTERNATIVAS", "RECUO À ESQUERDA"],
        ["FONT/REF", "REFERÊNCIA"]
    ];

    // Símbolos matemáticos (fonte: Segoe UI Symbol)
    var MATH_SYMBOLS = ["∼","➱","","⇒","∄","⇔","⟹","⊅","∈","∉","⊂","⊃","⊄","⊆","⊇","∃","∀","∅","∧","∨","∩","∪","≠","≡","≤","≥","⊕","∫","∑","∏","∞","√","∂","∇","≈","∝","∠","▸","𝑊","𝑉","𝐴","𝜙","𝐸","𝑗","𝐼","𝑃","𝐸","₀","𝐻","𝑧","⁻","⁺","₁","₂","₃","₄","₆","⊕","𝑃","𝐸","⋅","⊥","𝐵"," 𝑂","𝛼 ","𝑥","𝑦","∗","≅","∶","⊖","∣","⁺","⋯","△","⁻"," ","𝑎","𝑡","𝑣","𝑆","𝑠","𝑌","𝑓","𝜑","𝑖","𝜔","𝑚","𝑇","𝐻","𝑧","𝐹","𝑔","𝑟","𝜃","𝑛","𝑝","𝑒","𝑑","𝑅","➱","├","ℤ","ℕ","ℚ","ℝ","ℂ","⇌","𝑍","𝑄","𝑘","𝑏","𝑐","𝑞","𝜌","⟺","⇏","Ω","ℱ ","ℙ","𝜈"," 𝜈","𝑁𝑖","𝜇","✓","⋮","⌃","⌵","𝑋","𝜆","α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","σ,ς","τ","υ","φ","χ","ψ","ω","µ"];

    // ===================== PERFORMANCE =====================
    var StyleCache = {
        paragraphStyles: {},
        characterStyles: {},
        groups: {},
        lastDoc: null,
        
        clear: function() {
            this.paragraphStyles = {};
            this.characterStyles = {};
            this.groups = {};
            this.lastDoc = null;
        },
        
        getParagraphStyle: function(doc, name) {
            if (this.lastDoc !== doc) this.clear();
            this.lastDoc = doc;
            
            if (!this.paragraphStyles[name]) {
                this.paragraphStyles[name] = this._findParagraphStyle(doc, name);
            }
            return this.paragraphStyles[name];
        },
        
        getCharacterStyle: function(doc, name) {
            if (this.lastDoc !== doc) this.clear();
            this.lastDoc = doc;
            
            if (!this.characterStyles[name]) {
                this.characterStyles[name] = this._findCharacterStyle(doc, name);
            }
            return this.characterStyles[name];
        },
        
        _findParagraphStyle: function(doc, name) {
            var all = doc.allParagraphStyles;
            for (var i=0; i<all.length; i++) {
                try { 
                    if (String(all[i].name||"") === name) return all[i]; 
                } catch(e) {}
            }
            return null;
        },
        
        _findCharacterStyle: function(doc, name) {
            try {
                return doc.characterStyles.itemByName(name);
            } catch(e) {
                return null;
            }
        }
    };

    // ===================== UI =====================
    var items = [];          // fila de problemas
    var scannedDoc = null;
    var CANCEL_SCAN = false;

    // ===================== UTILS =====================
    function hasDoc(){ return app.documents.length > 0; }
    function doc(){ return app.activeDocument; }

    function resetFindChange(){
        app.findTextPreferences = NothingEnum.nothing;  app.changeTextPreferences = NothingEnum.nothing;
        app.findGrepPreferences = NothingEnum.nothing;  app.changeGrepPreferences = NothingEnum.nothing;
    }
    
    function safeSetOption(obj, prop, val){ try { obj[prop] = val; } catch(_e){} }
    
    function setFindOptions(){
        var T = app.findChangeTextOptions, G = app.findChangeGrepOptions;
        safeSetOption(T, 'includeFootnotes', false);     safeSetOption(G, 'includeFootnotes', false);
        safeSetOption(T, 'includeMasterPages', false);   safeSetOption(G, 'includeMasterPages', false);
        safeSetOption(T, 'includeHiddenLayers', false);  safeSetOption(G, 'includeHiddenLayers', false);
        safeSetOption(T, 'includeLockedLayersForFind', false); safeSetOption(G, 'includeLockedLayersForFind', false);
        safeSetOption(T, 'includeLockedStoriesForFind', false); safeSetOption(G, 'includeLockedStoriesForFind', false);
    }
    
    function pageOfTextFrame(tf){
        try { if (tf.parentPage && tf.parentPage.isValid) return tf.parentPage; } catch(e){}
        try {
            var host = tf.parentTextFrames && tf.parentTextFrames.length ? tf.parentTextFrames[0] : null;
            if (host && host.parentPage && host.parentPage.isValid) return host.parentPage;
        } catch(e){}
        return null;
    }
    
    function pageOfText(txt){
        try { var tf = txt.parentTextFrames[0]; return pageOfTextFrame(tf); } catch(e){ return null; }
    }
    
    function isAnchoredText(p){
        try {
            var tf = p.parentTextFrames && p.parentTextFrames.length ? p.parentTextFrames[0] : null;
            return tf && tf.parent && tf.parent.constructor && String(tf.parent.constructor.name) === "Character";
        } catch(e){ return false; }
    }
    
    function excerpt(txtObj){
        try { return (""+txtObj.contents).replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").substr(0, 100); } catch(e){ return "(trecho)"; }
    }
    
    function getNoneCharStyle(d){
        var nome = "[Nenhum]";
        try {
            if (!d.characterStyles.itemByName(nome).isValid) {
                if (d.characterStyles.itemByName("[Nenhum(a)]").isValid) nome = "[Nenhum(a)]";
                else nome = "$ID/[None]";
            }
        } catch(e){ nome = "$ID/[None]"; }
        try { return d.characterStyles.itemByName(nome); } catch(e){ return null; }
    }
    
    function ensureGroup(name){
        var d=doc(); try{
            var g = d.paragraphStyleGroups.itemByName(name);
            g.name; return g;
        }catch(e){
            try { return d.paragraphStyleGroups.add({name:name}); } catch(e2){ return null; }
        }
    }
    
    function ensureParaStyleInGroup(groupName, styleName){
        var d=doc(), g=ensureGroup(groupName);
        if (!g) return null;
        try {
            var ps = g.paragraphStyles.itemByName(styleName); ps.name; return ps;
        } catch(e) {
            try { return g.paragraphStyles.add({name:styleName}); } catch(e2){ return null; }
        }
    }
    
    function getOrCreateCS(name, opts){
        var d=doc(); var cs;
        try { cs = d.characterStyles.itemByName(name); cs.name; }
        catch(e){ cs = d.characterStyles.add({ name:name }); }
        try { if (opts && opts.position) cs.position = opts.position; } catch(e){}
        try { if (opts && opts.fontStyle) cs.fontStyle = opts.fontStyle; } catch(e){}
        return cs;
    }
    
    function near(a,b,eps){ if (eps===undefined) eps = 0.75; try { return Math.abs((a||0)-(b||0))<=eps; } catch(e){ return false; } }
    
    function fontNameContains(fnt, needle){
        try { return (fnt && (""+fnt.name).toLowerCase().indexOf((""+needle).toLowerCase()) >= 0); } catch(e){ return false; }
    }

    // --- ID estável de objetos (para deduplicar) - OTIMIZADO
    function getObjectId(o){
        try{ if (o && o.isValid && o.id !== undefined) return String(o.id); }catch(e){}
        return null;
    }
    
    function makeItemKey(it){
        var parts = [it.kind||''];
        try{
            if (it.table && it.table.isValid) parts.push('T', getObjectId(it.table));
            else if (it.paragraph && it.paragraph.isValid) parts.push('P', getObjectId(it.paragraph));
            else if (it.range && it.range.isValid) parts.push('R', getObjectId(it.range));
            else if (it.page && it.page.isValid) parts.push('PG', getObjectId(it.page));
            else parts.push('TXT', (it.error||"") + "::" + (it.pageName||""));
        }catch(e){}
        return parts.join(':');
    }

    function pushItem(arr, it){
        if (!it.page && (it.paragraph || it.range || it.table)) {
            var t = it.paragraph || it.range || it.table;
            try {
                if (t instanceof Table) {
                    var frames = [];
                    try { var ip = t.storyOffset;
                        if (ip && ip.parentTextFrames && ip.parentTextFrames.length) frames = ip.parentTextFrames;
                    } catch(e){}
                    if (!frames.length) frames = t.parentStory ? t.parentStory.textContainers : [];
                    if (frames.length && frames[0].parentPage && frames[0].parentPage.isValid) it.page = frames[0].parentPage;
                } else {
                    it.page = pageOfText(t);
                }
            } catch(e){}
        }
        it.pageName = it.page ? it.page.name : (it.pageName || "—");
        if (!it.excerpt) {
            if (it.paragraph || it.range) it.excerpt = excerpt(it.paragraph || it.range);
            else it.excerpt = it.excerpt || "(—)";
        }
        arr.push(it);
    }

    // ===================== SUPORTES p/ "bulk" =====================
    function textRangeIsAllBoldIgnoringPunctToColon(txt){
        try{
            // Usa textStyleRanges em vez de characters para evitar erro 9
            var textRanges = txt.textStyleRanges;
            if (!textRanges || !textRanges.length) return false;
            
            var saw = false;
            for (var i=0;i<textRanges.length;i++){
                try {
                    var range = textRanges[i];
                    if (!range || !range.isValid) continue;
                    
                    var content = String(range.contents||"");
                    if (content.indexOf(":") >= 0) {
                        // Se contém ":", verifica apenas até o ":"
                        var beforeColon = content.split(":")[0];
                        content = beforeColon;
                    }
                    
                    if (!content || /^\s*$/.test(content)) continue; // ignore espaços
                    if (/^[\u2012\u2013\u2014\u2015\-•▪~\s]*$/.test(content)) continue; // ignore marcadores/pontuações
                    
                    var isBold = false;
                    try {
                        if (range.fontStyle && /bold|negrito|semi\s*bold|semibold|demi|black|heavy/i.test(String(range.fontStyle))) isBold = true;
                        var cs = range.appliedCharacterStyle;
                        if (!isBold && cs && /bold|negrito/i.test(String(cs.name||""))) isBold = true;
                    }catch(e){}
                    if (!isBold) return false;
                    saw = true;
                } catch(e){}
            }
            return saw; // precisa ter pelo menos 1 range útil
        }catch(e){ return false; }
    }
    
    function textRangeAllFontIs(txt, fontSubstr){
        try{
            // Usa textStyleRanges em vez de characters para evitar erro 9
            var textRanges = txt.textStyleRanges;
            if (!textRanges || !textRanges.length) return false;
            for (var i=0;i<textRanges.length;i++){
                try {
                    var range = textRanges[i];
                    if (!range || !range.isValid) continue;
                    if (!fontNameContains(range.appliedFont, fontSubstr)) return false;
                } catch(e){}
            }
            return true;
        }catch(e){ return false; }
    }

    // ===================== SISTEMA DE RELATÓRIOS =====================
    
    // Estrutura de dados para estatísticas
    var ReportStats = {
        totalErrors: 0,
        errorsByType: {},
        errorsByPage: {},
        errorsBySeverity: {},
        fixedCount: 0,
        persistentCount: 0,
        scanDate: null,
        documentName: null
    };
    
    function getLogFile(d){
        var desktop = Folder.desktop.fsName.replace(/\\/g,"/");
        var base = "FixMenu-Correcoes" + d.name.replace(/\.[^\.]+$/,"") + ".csv";
        var f = new File(desktop + "/" + base);
        if (!f.exists) { 
            try { 
                f.encoding = "UTF-8"; 
                f.open("w"); 
                f.writeln("Data/Hora;Status;Página;Tipo de Erro;Severidade;Descrição do Erro;Trecho;Parágrafo;Correção Aplicada;Observações"); 
                f.close(); 
            } catch(e){} 
        }
        return f;
    }
    
    
    function tsNow(){
        var dt = new Date(); 
        function pad(n){ return (n<10?"0":"")+n; }
        return dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(dt.getDate())+" "+pad(dt.getHours())+":"+pad(dt.getMinutes())+":"+pad(dt.getSeconds());
    }
    
    function esc(s){ 
        return (""+s).replace(/[;\r\n]+/g," ").replace(/\s+/g," ").substr(0, 500); 
    }
    
    function getErrorSeverity(errorType, errorText){
        // Classifica severidade baseada no tipo e conteúdo do erro
        var severity = "Média";
        
        if (/estilos essenciais|grupos/i.test(errorText)) severity = "Alta";
        else if (/versalete|small caps/i.test(errorText)) severity = "Alta";
        else if (/overrides|cs aplicado/i.test(errorText)) severity = "Média";
        else if (/espaçamento|formatação/i.test(errorText)) severity = "Baixa";
        else if (/bold|negrito/i.test(errorText)) severity = "Média";
        else if (/lista|tópico/i.test(errorText)) severity = "Média";
        
        return severity;
    }
    
    function getErrorType(errorText){
        // Categoriza o tipo de erro
        if (/estilos essenciais/i.test(errorText)) return "Configuração";
        if (/versalete|small caps/i.test(errorText)) return "Formatação de Texto";
        if (/overrides|cs aplicado/i.test(errorText)) return "Estilos de Caractere";
        if (/espaçamento|formatação/i.test(errorText)) return "Layout";
        if (/bold|negrito/i.test(errorText)) return "Formatação de Texto";
        if (/lista|tópico/i.test(errorText)) return "Estrutura";
        if (/mesclar|merge/i.test(errorText)) return "Configuração";
        if (/órfãs|viúvas/i.test(errorText)) return "Layout";
        return "Outros";
    }
    
    function appendLog(d, status, pageName, errorText, sample, errorType, severity, correction){
        try { 
            var f = getLogFile(d); 
            f.open("e"); 
            f.seek(0,2); 
            var timestamp = tsNow();
            var errorTypeStr = errorType || getErrorType(errorText);
            var severityStr = severity || getErrorSeverity(errorTypeStr, errorText);
            var correctionStr = correction || (status === "Corrigido" ? "Sim" : "Não");
            var observations = status === "Persistente" ? "Erro persistente após correção" : "";
            
            f.writeln([
                timestamp, 
                status, 
                esc(pageName), 
                esc(errorTypeStr),
                severityStr,
                esc(errorText), 
                esc(sample),
                "",
                correctionStr,
                observations
            ].join(";")); 
            f.close(); 
            
            // Atualiza estatísticas
            updateReportStats(errorTypeStr, severityStr, pageName, status);
        } catch(e){}
    }
    
    function updateReportStats(errorType, severity, pageName, status){
        ReportStats.totalErrors++;
        
        // Conta por tipo
        ReportStats.errorsByType[errorType] = (ReportStats.errorsByType[errorType] || 0) + 1;
        
        // Conta por severidade
        ReportStats.errorsBySeverity[severity] = (ReportStats.errorsBySeverity[severity] || 0) + 1;
        
        // Conta por página
        ReportStats.errorsByPage[pageName] = (ReportStats.errorsByPage[pageName] || 0) + 1;
        
        // Conta correções
        if (status === "Corrigido") ReportStats.fixedCount++;
        else if (status === "Persistente") ReportStats.persistentCount++;
    }
    
    function resetReportStats(docName){
        ReportStats = {
            totalErrors: 0,
            errorsByType: {},
            errorsByPage: {},
            errorsBySeverity: {},
            fixedCount: 0,
            persistentCount: 0,
            scanDate: tsNow(),
            documentName: docName
        };
    }
    

    // ===================== REGRAS =====================
    var RULES = [];

    // ---- util: regex grande de math (só se habilitada) ----
    function buildMathRegex(){
        function escG(s){ return String(s).replace(/([\\\^\$\.\|\?\*\+\(\)\[\]\{\}])/g,"\\$1"); }
        var alts = [], seen = {};
        for (var i=0;i<MATH_SYMBOLS.length;i++){
            var t = String(MATH_SYMBOLS[i]).replace(/^\s+|\s+$/g,"");
            if (!t || seen[t]) continue; seen[t]=true;
            alts.push(escG(t));
        }
        if (!seen[""]) alts.push(escG(""));
        return "(?:" + alts.join("|") + ")";
    }
    var MATH_REGEX = buildMathRegex();

    // ---- Regra 0: Estilos essenciais existem (cria se faltar) -----
    RULES.push({
        id: 'cfg_styles',
        label: 'Estilos essenciais (ACERVO) presentes',
        scan: function(d, push){
            var need = [];
            if (!StyleCache.getParagraphStyle(d, PS_VERSALETE)) need.push(PS_VERSALETE);
            if (!StyleCache.getParagraphStyle(d, PS_SUBTOPICO)) need.push(PS_SUBTOPICO);
            if (!StyleCache.getParagraphStyle(d, PS_TOPICO))    need.push(PS_TOPICO);
            if (!StyleCache.getParagraphStyle(d, PS_LISTA))     need.push(PS_LISTA);
            if (!StyleCache.getParagraphStyle(d, PS_LISTA2))    need.push(PS_LISTA2);
            if (!StyleCache.getParagraphStyle(d, PS_REFERENCIA))need.push(PS_REFERENCIA);
            if (need.length){
                push({kind:'cfg_styles', error:"Criar estilos essenciais: "+need.join(", "), pageName:"—", excerpt:"(config)", missing: need});
            }
        },
        needs: function(d,it){
            var miss = it.missing||[];
            for (var i=0;i<miss.length;i++) if (!StyleCache.getParagraphStyle(d, miss[i])) return true;
            return false;
        },
        fix: function(it){
            var miss = it.missing||[];
            for (var i=0;i<miss.length;i++) ensureParaStyleInGroup(GRP_ACERVO, miss[i]);
        }
    });

    // ---- Regra: Linter de estilo (ACERVO) com processamento em lotes ----
    RULES.push({
        id: 'style_drift_guard',
        label: 'Desvios de estilo (ACERVO): CS aplicado / VERSALETE sem small caps / Overrides',
        scan: function(d, push){
            var none = getNoneCharStyle(d);
            var psVers = StyleCache.getParagraphStyle(d, PS_VERSALETE);
            
            // Processa todas as stories de uma vez para melhor performance
            var allStories = d.stories.everyItem().getElements();
            var batchSize = 50; // Processa em lotes para evitar travamento
            
            for (var s=0; s<allStories.length; s++){
                var st = allStories[s];
                var paras = st.paragraphs;
                
                // Processa em lotes
                for (var batchStart = 0; batchStart < paras.length; batchStart += batchSize) {
                    if (CANCEL_SCAN) return;
                    
                    var batchEnd = Math.min(batchStart + batchSize, paras.length);
                    for (var i = batchStart; i < batchEnd; i++){
                        try {
                            var p = paras[i]; 
                            if (!p || !p.isValid) continue;
                        var nm = ""; try{ nm = String(p.appliedParagraphStyle && p.appliedParagraphStyle.name || ""); }catch(e){}
                        
                        // Só olha estilos relevantes (grupo ACERVO + alguns conhecidos)
                        var watch = /^(VERSALETE|SUBTÓPICO|TÓPICO|LISTA|LISTA II|REFERÊNCIA)$/i.test(nm);
                        if (!watch) continue;

                        // Ignora texto em frames ancorados (conforme script Padrão)
                        if (isAnchoredText(p)) continue;

                        var errors = [];
                        var errorDetails = "";

                        // (a) CS ≠ [Nenhum] - validação mais específica
                        try {
                            var ts = p.textStyleRanges;
                            for (var j=0;j<ts.length;j++){
                                var cs = ts[j].appliedCharacterStyle;
                                if (cs && none && cs !== none) { 
                                    errors.push("CS aplicado: " + (cs.name || "desconhecido"));
                                    break;
                                }
                            }
                        }catch(e){}

                        // (b) Overrides de caractere - validação específica
                        try {
                            var hasOverrides = false;
                            // Usa textStyleRanges em vez de characters para evitar erro 9
                            var textRanges = p.textStyleRanges;
                            if (textRanges && textRanges.length > 0) {
                                for (var tr=0; tr<textRanges.length; tr++){
                                    try {
                                        var range = textRanges[tr];
                                        if (!range || !range.isValid) continue;
                                        
                                        // Verifica overrides específicos que devem ser limpos
                                        if (range.fontStyle && range.fontStyle !== "Regular") hasOverrides = true;
                                        if (range.pointSize && Math.abs(range.pointSize - 10) > 0.1) hasOverrides = true;
                                        if (range.capitalization && range.capitalization !== Capitalization.normal && 
                                            !(psVers && p.appliedParagraphStyle === psVers && range.capitalization === Capitalization.smallCaps)) {
                                            hasOverrides = true;
                                        }
                                        if (hasOverrides) break;
                                    } catch(e){}
                                }
                            }
                            if (hasOverrides) errors.push("Overrides de caractere");
                        }catch(e){}

                        // (c) VERSALETE sem small caps - validação específica
                        if (psVers && p.appliedParagraphStyle === psVers){
                            try {
                                var ts2 = p.textStyleRanges;
                                var hasText = false;
                                var needsSmallCaps = false;
                                for (var k=0;k<ts2.length;k++){
                                    if (ts2[k].contents && /\S/.test(ts2[k].contents)) {
                                        hasText = true;
                                        if (ts2[k].capitalization !== Capitalization.smallCaps) { 
                                            needsSmallCaps = true; 
                                            break; 
                                        }
                                    }
                                }
                                if (hasText && needsSmallCaps) errors.push("VERSALETE sem small caps");
                            }catch(e){}
                        }

                        // (d) Validação de espaçamento em listas
                        if (/^(LISTA|LISTA II|TÓPICO)$/i.test(nm)) {
                            try {
                                if (Math.abs(p.spaceAfter - 1) > 0.1) { // 1mm
                                    errors.push("Espaçamento incorreto (deve ser 1mm)");
                                }
                            } catch(e){}
                        }

                        if (errors.length > 0){
                            errorDetails = errors.join("; ");
                            pushItem(items, {
                                kind:'style_drift_guard',
                                paragraph: p,
                                error: "ACERVO: " + errorDetails,
                                docRef: d,
                                errorDetails: errorDetails
                            });
                        }
                        } catch(e){} // Fecha o try do parágrafo
                    }
                    
                    // Pequena pausa entre lotes para manter responsividade
                    if (batchStart % (batchSize * 5) === 0) {
                        try { winRef && winRef.update(); } catch(e){}
                    }
                }
            }
        },
        needs: function(d,it){
            var p = it.paragraph; if (!p || !p.isValid) return false;
            var none = getNoneCharStyle(d);
            var psVers = StyleCache.getParagraphStyle(d, PS_VERSALETE);

            // CS aplicado?
            try{
                var ts = p.textStyleRanges;
                for (var j=0;j<ts.length;j++){
                    var cs = ts[j].appliedCharacterStyle;
                    if (cs && none && cs !== none) return true;
                }
            }catch(e){}

            // Overrides de caractere?
            try {
                // Usa textStyleRanges em vez de characters para evitar erro 9
                var textRanges = p.textStyleRanges;
                if (textRanges && textRanges.length > 0) {
                    for (var tr=0; tr<textRanges.length; tr++){
                        try {
                            var range = textRanges[tr];
                            if (!range || !range.isValid) continue;
                            
                            if (range.fontStyle && range.fontStyle !== "Regular") return true;
                            if (range.pointSize && Math.abs(range.pointSize - 10) > 0.1) return true;
                            if (range.capitalization && range.capitalization !== Capitalization.normal && 
                                !(psVers && p.appliedParagraphStyle === psVers && range.capitalization === Capitalization.smallCaps)) {
                                return true;
                            }
                        } catch(e){}
                    }
                }
            }catch(e){}

            // VERSALETE sem small caps?
            try{
                if (psVers && p.appliedParagraphStyle === psVers){
                    var ts2 = p.textStyleRanges;
                    for (var k=0;k<ts2.length;k++){
                        if (ts2[k].contents && /\S/.test(ts2[k].contents)) {
                            if (ts2[k].capitalization !== Capitalization.smallCaps) return true;
                        }
                    }
                }
            }catch(e){}

            // Espaçamento em listas?
            try {
                var nm = String(p.appliedParagraphStyle && p.appliedParagraphStyle.name || "");
                if (/^(LISTA|LISTA II|TÓPICO)$/i.test(nm)) {
                    if (Math.abs(p.spaceAfter - 1) > 0.1) return true;
                }
            } catch(e){}

            return false;
        },
        fix: function(it){
            var d=doc(), p=it.paragraph; if (!p || !p.isValid) return;
            var none = getNoneCharStyle(d);
            try {
                p.characters.everyItem().appliedCharacterStyle = none;
                p.characters.everyItem().clearOverrides(OverrideType.CHARACTER_OVERRIDES);
                var psVers = StyleCache.getParagraphStyle(d, PS_VERSALETE);
                if (psVers && p.appliedParagraphStyle === psVers){
                    // força small caps sem mexer em espaçamento de parágrafo
                    p.characters.everyItem().capitalization = Capitalization.smallCaps;
                }
                // Aplica espaçamento correto em listas
                var nm = String(p.appliedParagraphStyle && p.appliedParagraphStyle.name || "");
                if (/^(LISTA|LISTA II|TÓPICO)$/i.test(nm)) {
                    p.spaceAfter = "1mm";
                }
            } catch(e){}
        }
    });

    // ===================== SCAN / FIX WRAPPERS =====================
    function scanProblems(winRef){
        items = [];
        if (!hasDoc()) return 0;
        scannedDoc = doc();
        var d = scannedDoc;

        // Limpa cache para novo documento
        StyleCache.clear();

        var prevUI = app.scriptPreferences.userInteractionLevel;
        var prevRedraw = app.scriptPreferences.enableRedraw;
        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
        app.scriptPreferences.enableRedraw = false;

        CANCEL_SCAN = false;

        try {
            var seen = {};
            for (var r=0; r<RULES.length; r++){
                if (CANCEL_SCAN) break;
                var rule = RULES[r];
                
                // Atualiza status com progresso mais detalhado
                if (winRef) {
                    try { 
                        winRef.status.text = "Escaneando regra " + (r+1) + "/" + RULES.length + ": " + rule.label; 
                        winRef.update(); 
                    } catch(__){}
                }
                
                rule.scan(d, function(obj){
                    if (!obj) return;
                    if (!obj.error) obj.error = "Ajuste";
                    var tmpArr = []; pushItem(tmpArr, obj); var tmp = tmpArr[0];
                    var key = makeItemKey(tmp);
                    if (!seen[key]) { seen[key] = true; items.push(tmp); }
                });
            }
        } finally {
            app.scriptPreferences.enableRedraw = prevRedraw;
            app.scriptPreferences.userInteractionLevel = prevUI;
        }
        return items.length;
    }

    function applyFixes(selectedItems){
        var d = doc();
        return app.doScript(function(){
            var fixed = 0, kept = [];
            
            // Processa em lotes para melhor performance
            var batchSize = 10;
            for (var batchStart = 0; batchStart < items.length; batchStart += batchSize) {
                var batchEnd = Math.min(batchStart + batchSize, items.length);
                
                for (var i = batchStart; i < batchEnd; i++){
                    var it = items[i];
                    var sel = false; 
                    for (var s=0; s<selectedItems.length; s++){ 
                        if (selectedItems[s] === it) { sel = true; break; } 
                    }
                    if (!sel) { kept.push(it); continue; }

                    try {
                        var rule = null;
                        for (var r=0; r<RULES.length; r++) if (RULES[r].id === it.kind) { rule = RULES[r]; break; }
                        if (rule && rule.fix) rule.fix(it);

                        // Reduz recompose para melhor performance
                        if (i % 5 === 0) {
                            try { scannedDoc.stories.everyItem().recompose(); } catch(e){}
                        }

                        // Revalidação otimizada
                        var stillNeeds = false;
                        if (rule && typeof rule.needs === "function") {
                            stillNeeds = !!rule.needs(scannedDoc, it);
                        }

                        if (stillNeeds) {
                            appendLog(scannedDoc, "Persistente", it.pageName || "—", it.error, it.excerpt || "", 
                                    getErrorType(it.error), getErrorSeverity(getErrorType(it.error), it.error), "Não");
                            kept.push(it);
                        } else {
                            appendLog(scannedDoc, "Corrigido", it.pageName || "—", it.error, it.excerpt || "", 
                                    getErrorType(it.error), getErrorSeverity(getErrorType(it.error), it.error), "Sim");
                            fixed++;
                        }
                    } catch(e) {
                        kept.push(it);
                    }
                }
                
                // Recompose final do lote
                try { scannedDoc.stories.everyItem().recompose(); } catch(e){}
            }
            
            items = kept;
            return fixed;
        }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Fix Menu: Correções");
    }

    // ===================== UI =====================
    var win = new Window("palette", "Fix Menu — Eduqi (OTIMIZADO)", undefined, { resizeable:true });
    G.__TABLEFIX__.win = win;

    win.orientation = "column";

    var rowTop = win.add("group"); rowTop.orientation = "row";
    var btnScan = rowTop.add("button", undefined, "Buscar problemas");
    var btnStop = rowTop.add("button", undefined, "Parar"); btnStop.enabled = false;
    var btnSel  = rowTop.add("button", undefined, "Selecionar");
    var btnFix  = rowTop.add("button", undefined, "Aplicar conserto");
    var btnLog  = rowTop.add("button", undefined, "Registrar log");

    var opts = win.add("group"); opts.orientation = "row";
    G.__TABLEFIX__.cbHeavy = opts.add("checkbox", undefined, "Regras pesadas (símbolos/math)");
    G.__TABLEFIX__.cbHeavy.value = false; // DESLIGADO por padrão

    var list = win.add("listbox", undefined, [], {
        multiselect: true,
        numberOfColumns: 3,
        showHeaders: true,
        columnTitles: ["Página","Erro","Trecho"],
        columnWidths: [70, 420, 260]
    });
    list.preferredSize = [780, 440];

    var status = win.add("statictext", undefined, "Pronto. Clique em 'Buscar problemas'."); status.characters = 90;
    win.status = status;
    win.onResizing = win.onResize = function(){ win.layout.resize(); };

    function refreshList(){
        list.removeAll();
        for (var i=0;i<items.length;i++){
            var it = list.add("item", items[i].pageName || "—");
            it.subItems[0].text = items[i].error || "(sem erro)";
            it.subItems[1].text = items[i].excerpt || "(trecho)";
            it.data = items[i];
        }
        var docName = scannedDoc ? scannedDoc.name : "(nenhum)";
        status.text = items.length + " item(ns) — doc: " + docName;
    }

    function gotoAndSelect(it){
        if (!it) return;
        if (!hasDoc() || doc() !== (it.docRef || scannedDoc)) { alert("O documento ativo mudou."); return; }
        if (it.table){
            try {
                var tb = it.table;
                var frames = [];
                try { var ip = tb.storyOffset;
                    if (ip && ip.parentTextFrames && ip.parentTextFrames.length) frames = ip.parentTextFrames;
                } catch(e){}
                if (!frames.length && tb.parentStory) frames = tb.parentStory.textContainers;
                if (frames.length && frames[0].parentPage && app.activeWindow) app.activeWindow.activePage = frames[0].parentPage;
                app.select(tb);
                try { app.activeWindow.zoom(ZoomOptions.FIT_SELECTION); } catch(e){}
            }catch(e){}
        } else if (it.paragraph || it.range){
            var target = it.paragraph || it.range;
            var pg = it.page || pageOfText(target);
            try { if (pg && app.activeWindow && app.activeWindow.parent === doc()) app.activeWindow.activePage = pg; } catch(e){}
            var selected = false;
            try { app.select(target); selected = true; } catch(e){}
            try { if (selected) app.activeWindow.zoom(ZoomOptions.FIT_SELECTION); else app.activeWindow.zoom(ZoomOptions.FIT_PAGE); } catch(e){}
        } else {
            alert("Este item não possui seleção visual.");
        }
    }

    // -------- Handlers --------
    btnScan.onClick = function(){
        if (!hasDoc()) { alert("Abra um documento."); return; }
        btnScan.enabled = false; btnStop.enabled = true;
        status.text = "Escaneando..."; win.update();
        
        // Inicializa estatísticas para o relatório
        resetReportStats(doc().name);
        
        var n = 0;
        try {
            n = scanProblems(win);
        } finally {
            btnScan.enabled = true; btnStop.enabled = false;
        }
        refreshList();
        if (!n && !CANCEL_SCAN) status.text = "Nenhum item encontrado.";
        if (CANCEL_SCAN) status.text = "Busca interrompida. Itens parciais listados.";
    };

    btnStop.onClick = function(){
        CANCEL_SCAN = true;
        status.text = "Cancelando..."; win.update();
    };

    btnSel.onClick = function(){
        if (!list.selection || list.selection.length === 0) { alert("Selecione uma linha."); return; }
        gotoAndSelect(list.selection[0].data);
    };

    btnLog.onClick = function(){
        if (!scannedDoc) { alert("Faça um scan primeiro."); return; }
        if (!list.selection || list.selection.length === 0) {
            for (var i=0; i<items.length; i++){
                var it = items[i];
                appendLog(scannedDoc, "Aberto", it.pageName || "—", it.error, it.excerpt || "", 
                        getErrorType(it.error), getErrorSeverity(getErrorType(it.error), it.error), "Não");
            }
            alert("Log registrado para " + items.length + " item(ns) (status: Aberto).");
        } else {
            for (var j=0; j<list.selection.length; j++){
                var it2 = list.selection[j].data;
                appendLog(scannedDoc, "Aberto", it2.pageName || "—", it2.error, it2.excerpt || "", 
                        getErrorType(it2.error), getErrorSeverity(getErrorType(it2.error), it2.error), "Não");
            }
            alert("Log registrado para " + list.selection.length + " item(ns) (status: Aberto).");
        }
    };


    btnFix.onClick = function(){
        if (!list.selection || list.selection.length === 0) { alert("Selecione uma ou mais linhas."); return; }
        var selected = []; for (var i=0;i<list.selection.length;i++) selected.push(list.selection[i].data);

        var fixed = applyFixes(selected);

        refreshList();
        status.text = "Corrigidos: " + fixed + " | Ainda pendentes: " + items.length + ".";
    };

    win.onClose = function(){ try { G.__TABLEFIX__.win = null; } catch(_){} };

    win.center(); win.show();
})();
