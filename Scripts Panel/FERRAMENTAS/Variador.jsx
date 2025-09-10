/** Variador Criativo – ScriptUI (Photoshop JSX)
 * Abre um painel para gerar variações criativas do documento atual.
 * Melhorias: Adicionadas receitas de variações de cor para mockups (Sepia, Blue Tone, Green Shift, etc.).
 * Adicionado suporte para executar Ações (Macros) do Photoshop em cada variação, com campos para especificar nome da Ação e Set.
 */

#target photoshop
app.bringToFront();

(function () {
  if (!app.documents.length) { alert("Abra um documento antes de executar."); return; }
  var src = app.activeDocument;

  // -------------------- Utils --------------------
  function pad2(n){ return (n<10 ? "0" : "") + n; }
  function safeName(s){ return String(s).replace(new RegExp('[\\\\\\/:*?"<>|]+', 'g'), '_'); }
  function solidRGB(r,g,b){ var c=new SolidColor(); c.rgb.red=r; c.rgb.green=g; c.rgb.blue=b; return c; }
  function addFillLayer(doc, name, color, blend, opacity){
    var lyr = doc.artLayers.add(); lyr.name = name||"Fill";
    lyr.blendMode = blend||BlendMode.NORMAL; lyr.opacity = (opacity==null?100:opacity);
    doc.selection.selectAll(); doc.selection.fill(color, ColorBlendMode.NORMAL, 100, false); doc.selection.deselect();
    return lyr;
  }
  function duplicateTop(doc){
    var base = doc.activeLayer; var dup = base.duplicate(); dup.move(base, ElementPlacement.PLACEAFTER); return dup;
  }
  function ensureOutputFolder(){
    var baseFolder = src.saved ? src.path : Folder.selectDialog("Escolha a pasta para salvar as variações");
    if (!baseFolder) throw new Error("Sem pasta de saída.");
    var out = new Folder(baseFolder.fsName + "/_variantes");
    if (!out.exists) out.create();
    return out;
  }
  function saveAsJPEG(doc, file, quality){
    var o = new JPEGSaveOptions(); o.quality = Math.max(0, Math.min(12, quality||10)); o.embedColorProfile = true; o.matte = MatteType.NONE;
    doc.saveAs(file, o, true, Extension.LOWERCASE);
  }
  function saveAsPNG(doc, file){
    var o = new PNGSaveOptions(); o.interlaced = false; doc.saveAs(file, o, true, Extension.LOWERCASE);
  }
  function saveAsTIFF(doc, file){
    var o = new TiffSaveOptions(); o.imageCompression = TIFFEncoding.TIFFLZW; o.byteOrder = ByteOrder.IBM; o.embedColorProfile = true;
    doc.saveAs(file, o, true, Extension.LOWERCASE);
  }

  // -------------------- Receitas Originais --------------------
  function fxSoftGlow(d){
    var top = duplicateTop(d); top.name="Soft Glow"; top.applyGaussianBlur(12); top.blendMode=BlendMode.SOFTLIGHT; top.opacity=45;
  }
  function fxHighPassDetail(d){
    var top=duplicateTop(d); top.name="High Pass"; top.applyHighPass(2.0); top.blendMode=BlendMode.OVERLAY; top.opacity=55;
  }
  function fxFilmGrain(d){
    var g = addFillLayer(d,"Film Grain", solidRGB(128,128,128), BlendMode.OVERLAY, 28); g.applyAddNoise(6, NoiseDistribution.UNIFORM, true);
  }
  function fxWarmMatte(d){
    addFillLayer(d,"Warm Tint", solidRGB(255,150,110), BlendMode.SOFTLIGHT, 30);
    var t=duplicateTop(d); t.applyGaussianBlur(3.5); t.blendMode=BlendMode.OVERLAY; t.opacity=20;
  }
  function fxCoolTeal(d){
    addFillLayer(d,"Cool Teal", solidRGB(80,150,170), BlendMode.COLOR, 25);
    var t=duplicateTop(d); t.applyGaussianBlur(1.5); t.blendMode=BlendMode.SOFTLIGHT; t.opacity=25;
  }
  function fxBWStrong(d){
    var bw = d.artLayers.add(); bw.name="B&W"; bw.kind=LayerKind.BLACKANDWHITE;
    var t=duplicateTop(d); t.applyHighPass(3.0); t.blendMode=BlendMode.LINEARLIGHT; t.opacity=35;
  }

  // -------------------- Novas Receitas de Cores para Mockups --------------------
  function fxSepia(d){
    var adj = d.adjustmentLayers.add(); adj.name = "Sepia Tone";
    adj.kind = LayerKind.COLORLOOKUP;
    // Simula sepia com Photo Filter ou similar; ajuste conforme necessário
    try {
      app.activeDocument.activeLayer = adj;
      var desc = new ActionDescriptor();
      desc.putClass(charIDToTypeID("What"), charIDToTypeID("Fltr"));
      desc.putString(charIDToTypeID("Nm  "), "Warming Filter (85)");
      desc.putInteger(charIDToTypeID("Dnst"), 50);
      executeAction(charIDToTypeID("PhtF"), desc, DialogModes.NO);
    } catch(e) {}
    adj.opacity = 70;
  }
  function fxBlueTone(d){
    addFillLayer(d, "Blue Tone", solidRGB(0, 50, 150), BlendMode.COLOR, 40);
    var t = duplicateTop(d); t.applyGaussianBlur(2); t.blendMode = BlendMode.SOFTLIGHT; t.opacity = 30;
  }
  function fxGreenShift(d){
    addFillLayer(d, "Green Shift", solidRGB(50, 150, 0), BlendMode.COLOR, 35);
    var t = duplicateTop(d); t.applyGaussianBlur(1.8); t.blendMode = BlendMode.OVERLAY; t.opacity = 25;
  }
  function fxVintageRed(d){
    addFillLayer(d, "Vintage Red", solidRGB(200, 50, 50), BlendMode.SOFTLIGHT, 45);
    var t = duplicateTop(d); t.applyHighPass(1.5); t.blendMode = BlendMode.LINEARLIGHT; t.opacity = 20;
  }
  function fxNeutralGray(d){
    addFillLayer(d, "Neutral Gray", solidRGB(128, 128, 128), BlendMode.COLOR, 30);
    var t = duplicateTop(d); t.applyGaussianBlur(2.5); t.blendMode = BlendMode.OVERLAY; t.opacity = 25;
  }

  var RECIPES = [
    { key:"softglow",  label:"Soft Glow (brilho suave)", defaultOn:true,  fn:fxSoftGlow },
    { key:"highpass",  label:"High Pass (claridade)",     defaultOn:true,  fn:fxHighPassDetail },
    { key:"filmgrain", label:"Film Grain (grão)",         defaultOn:true,  fn:fxFilmGrain },
    { key:"warm",      label:"Warm Matte (quente)",       defaultOn:false, fn:fxWarmMatte },
    { key:"cool",      label:"Cool Teal (frio)",          defaultOn:false, fn:fxCoolTeal },
    { key:"bw",        label:"B&W forte",                 defaultOn:true,  fn:fxBWStrong },
    // Novas para cores/mockups
    { key:"sepia",     label:"Sepia Tone (marrom vintage)", defaultOn:false, fn:fxSepia },
    { key:"bluetone",  label:"Blue Tone (azul frio)",       defaultOn:false, fn:fxBlueTone },
    { key:"greenshift",label:"Green Shift (verde natural)", defaultOn:false, fn:fxGreenShift },
    { key:"vintagered",label:"Vintage Red (vermelho retro)",defaultOn:false, fn:fxVintageRed },
    { key:"neutralgray",label:"Neutral Gray (cinza neutro)",defaultOn:false, fn:fxNeutralGray }
  ];

  // -------------------- UI --------------------
  var w = new Window('dialog', 'Variador Criativo');
  w.orientation = 'column';
  w.alignChildren = ['fill','top'];

  // Info
  var infoGp = w.add('group'); infoGp.add('statictext', undefined, 'Documento: ' + decodeURI(src.name));
  // Copies
  var copyPn = w.add('panel', undefined, 'Cópias');
  copyPn.orientation='row'; copyPn.alignChildren=['left','center'];
  var minusBtn = copyPn.add('button', undefined, '–'); minusBtn.preferredSize=[30,22];
  var copiesEt = copyPn.add('edittext', undefined, '6'); copiesEt.characters = 4;
  var plusBtn  = copyPn.add('button', undefined, '+'); plusBtn.preferredSize=[30,22];
  function getCopies(){ var n=parseInt(copiesEt.text,10); if(isNaN(n)||n<1) n=1; if(n>99) n=99; copiesEt.text=String(n); return n; }
  minusBtn.onClick=function(){ var n=getCopies(); if(n>1){copiesEt.text=String(n-1);} };
  plusBtn.onClick =function(){ var n=getCopies(); if(n<99){copiesEt.text=String(n+1);} };

  // Recipes (agora inclui variações de cor)
  var recPn = w.add('panel', undefined, 'Receitas e Variações de Cor (selecione quais aplicar)');
  recPn.orientation='column'; recPn.alignChildren=['left','top'];
  var recChecks = {};
  for (var i=0;i<RECIPES.length;i++){
    var cb = recPn.add('checkbox', undefined, RECIPES[i].label);
    cb.value = RECIPES[i].defaultOn;
    recChecks[RECIPES[i].key] = cb;
  }
  var recBtns = recPn.add('group');
  var selAll = recBtns.add('button', undefined, 'Marcar tudo');
  var selNone= recBtns.add('button', undefined, 'Desmarcar');
  selAll.onClick = function(){ for (var k in recChecks) recChecks[k].value = true; };
  selNone.onClick= function(){ for (var k in recChecks) recChecks[k].value = false; };

  // Novo: Painel para Macros/Ações
  var macroPn = w.add('panel', undefined, 'Executar Ação (Macro)');
  macroPn.orientation = 'column'; macroPn.alignChildren = ['fill', 'top'];
  var chkApplyMacro = macroPn.add('checkbox', undefined, 'Aplicar Ação em cada variação');
  chkApplyMacro.value = false;
  var actionNameEt = macroPn.add('edittext', undefined, 'Nome da Ação'); actionNameEt.characters = 20;
  var setNameEt = macroPn.add('edittext', undefined, 'Nome do Set de Ações'); setNameEt.characters = 20;
  macroPn.add('statictext', undefined, 'Ex: Ação "Resize Image" no Set "Default Actions"');

  // Saída
  var outPn = w.add('panel', undefined, 'Saída');
  outPn.orientation='column'; outPn.alignChildren=['fill','top'];
  var pathGp = outPn.add('group'); pathGp.alignChildren=['fill','center'];
  var pathEt = pathGp.add('edittext', undefined, (src.saved ? src.path.fsName + "/_variantes" : "")); pathEt.characters = 40;
  var pathBtn = pathGp.add('button', undefined, 'Escolher pasta...');
  pathBtn.onClick = function(){
    var f = Folder.selectDialog("Escolha a pasta de saída");
    if (f) pathEt.text = f.fsName;
  };

  var fmtGp = outPn.add('group');
  fmtGp.add('statictext', undefined, 'Formato:');
  var fmtDd = fmtGp.add('dropdownlist', undefined, ['JPEG','PNG','TIFF']); fmtDd.selection=0;
  var qGp = outPn.add('group'); qGp.add('statictext', undefined, 'Qualidade JPEG (0–12):');
  var qualEt = qGp.add('edittext', undefined, '10'); qualEt.characters=3;

  var optPn = w.add('panel', undefined, 'Opções');
  optPn.orientation='column'; optPn.alignChildren=['left','top'];
  var chkFlatten = optPn.add('checkbox', undefined, 'Achatar antes de salvar (flatten)');
  chkFlatten.value = true;
  var chkMergeDup = optPn.add('checkbox', undefined, 'Duplicar já mesclado (mais leve/rápido)');
  chkMergeDup.value = true;
  var chkRecipeInName = optPn.add('checkbox', undefined, 'Incluir nome da receita no arquivo');
  chkRecipeInName.value = true;

  // Rodapé
  var foot = w.add('group'); foot.alignment='right';
  var okBtn = foot.add('button', undefined, 'Gerar', {name:'ok'});
  var cancelBtn = foot.add('button', undefined, 'Cancelar', {name:'cancel'});

  if (w.show() != 1) return;

  // -------------------- Execução --------------------
  var copies = getCopies();
  var enabledRecipes = [];
  for (var r=0;r<RECIPES.length;r++){
    var rec = RECIPES[r];
    if (recChecks[rec.key].value) enabledRecipes.push(rec);
  }
  if (!enabledRecipes.length){ alert("Selecione ao menos uma receita."); return; }

  var outFolder = new Folder(pathEt.text || (src.saved ? src.path.fsName + "/_variantes" : ""));
  if (!outFolder.exists) outFolder.create();
  if (!outFolder.exists){ alert("Não foi possível criar/usar a pasta de saída."); return; }

  var baseName = safeName(decodeURI(src.name).replace(/\.[^\.]+$/,""));
  var fmt = fmtDd.selection.text;
  var quality = parseInt(qualEt.text,10); if (isNaN(quality)) quality = 10;

  var applyMacro = chkApplyMacro.value;
  var actionName = actionNameEt.text.trim();
  var setName = setNameEt.text.trim();

  var prevDialogs = app.displayDialogs; app.displayDialogs = DialogModes.NO;

  var errors = [];
  try {
    for (var i=1;i<=copies;i++){
      var rec = enabledRecipes[(i-1) % enabledRecipes.length];
      var dupName = baseName + "_v" + pad2(i);
      try{
        var dup = src.duplicate(dupName, chkMergeDup.value); // mergeLayersOnly se true
        dup.activeLayer = dup.layers[0];

        // Aplica receita
        rec.fn(dup);

        // Aplica Ação (Macro) se habilitado
        if (applyMacro && actionName && setName) {
          try {
            app.doAction(actionName, setName);
          } catch (e) {
            errors.push("Falha ao executar Ação '" + actionName + "' no Set '" + setName + "' na cópia " + i + ": " + e);
          }
        }

        // Extra (seguro): contraste leve
        try { dup.activeLayer = dup.layers[0]; dup.autoContrast(); } catch(e){}

        // Salvar
        if (chkFlatten.value) { try { dup.flatten(); } catch(e){} }
        var fname = dupName + (chkRecipeInName.value ? ("_" + rec.key) : "");
        var file = new File(outFolder.fsName + "/" + fname + (fmt=="JPEG"?".jpg":fmt=="PNG"?".png":".tif"));
        if (fmt=="JPEG") saveAsJPEG(dup, file, quality);
        else if (fmt=="PNG") saveAsPNG(dup, file);
        else saveAsTIFF(dup, file);

        dup.close(SaveOptions.DONOTSAVECHANGES);
      } catch (err) {
        errors.push("Falha na cópia " + i + " ("+rec.key+"): " + err);
        try { if (app.activeDocument!=src) app.activeDocument.close(SaveOptions.DONOTSAVECHANGES); } catch(e){}
      }
    }
  } finally {
    app.displayDialogs = prevDialogs;
  }

  if (errors.length){
    alert("Concluído com alertas.\nSaída: " + outFolder.fsName + "\n\n" + errors.join("\n"));
  } else {
    alert("Variações geradas com sucesso em:\n" + outFolder.fsName);
  }
})();
