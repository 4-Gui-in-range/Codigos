// MIGRAR PARA MIOLO NOVO — com pós-processamento opcional por .jsx
// 1) Escolha o TEMPLATE (.indd)
// 2) Escolha a PASTA com .indd antigos
// 3) Escolha a PASTA de saída

(function () {
  if (!app || !app.documents) {
    alert("Este script precisa do Adobe InDesign.");
    return;
  }

  // ---------- Utils ----------
  function resetFindChange() {
    try {
      app.findTextPreferences = NothingEnum.nothing;
      app.changeTextPreferences = NothingEnum.nothing;
    } catch (e) {}
    try {
      app.findGrepPreferences = NothingEnum.nothing;
      app.changeGrepPreferences = NothingEnum.nothing;
    } catch (e) {}
  }

  // Remove TODAS as páginas do template e deixa uma temporária para permitir remoções
  function wipeAllPagesKeepTemp(tgtDoc) {
    var temp = null;
    try {
      temp = tgtDoc.spreads.add(LocationOptions.AT_END);
      for (var i = tgtDoc.spreads.length - 1; i >= 0; i--) {
        var sp = tgtDoc.spreads[i];
        if (sp === temp) continue;
        try {
          sp.remove();
        } catch (e) {}
      }
    } catch (e) {}
    return temp;
  }

  // ---------- Entradas ----------
  var TPL_MASK = "InDesign Documents:*.indd;*.indt";
  var tplFile = File.openDialog(
    "Escolha o arquivo do MIOLO NOVO (.indd/.indt)",
    TPL_MASK
  );
  if (!tplFile) {
    alert("Operação cancelada (template não escolhido).");
    return;
  }

  var srcFolder = Folder.selectDialog("Escolha a pasta com os .indd antigos");
  if (!srcFolder) {
    alert("Operação cancelada (pasta de origem).");
    return;
  }

  var outFolder = Folder.selectDialog("Escolha a pasta de saída");
  if (!outFolder) {
    alert("Operação cancelada (pasta de saída).");
    return;
  }

  var files = srcFolder.getFiles("*.indd");
  if (!files || !files.length) {
    alert("Não encontrei .indd na pasta escolhida.");
    return;
  }

  // ---------- Acelerar execução ----------
  var prevUI = app.scriptPreferences.userInteractionLevel;
  var prevRedraw = app.scriptPreferences.enableRedraw;
  app.scriptPreferences.userInteractionLevel =
    UserInteractionLevels.NEVER_INTERACT;
  app.scriptPreferences.enableRedraw = false;

  var ok = 0,
    fail = 0,
    log = [];

  try {
    for (var i = 0; i < files.length; i++) {
      var srcFile = files[i];
      var base = srcFile.displayName.replace(/\.indd$/i, "");
      var outFile = File(outFolder.fsName + "/" + base + " (Miolo Novo).indd");

      var srcDoc = null,
        tplDoc = null,
        tgtDoc = null,
        tempSpread = null;

      try {
        // 1) Abre o documento de origem
        srcDoc = app.open(srcFile, false);

        // 2) Abre o template e salva com o novo nome
        tplDoc = app.open(tplFile, false);
        tplDoc.save(outFile);
        tgtDoc = tplDoc;

        // 3) Limpa todas as páginas do template e deixa uma temporária
        tempSpread = wipeAllPagesKeepTemp(tgtDoc);

        // 4) Duplica todas as paginas da fonte
        var tgtLast = tgtDoc.spreads[-1];
        for (var s = 0; s < srcDoc.spreads.length; s++) {
          var srcSpr = srcDoc.spreads[s];
          srcSpr.duplicate(LocationOptions.AT_END, tgtLast);
          tgtLast = tgtDoc.spreads[-1];
        }

        // 5) Remove a página temporária
        try {
          if (tempSpread && tempSpread.isValid) tempSpread.remove();
        } catch (e) {}

        // 6) Recompor e salvar
        try {
          tgtDoc.stories.everyItem().recompose();
        } catch (e) {}
        tgtDoc.save(outFile);

        ok++;
        log.push("OK;" + srcFile.displayName + ";-> " + outFile.displayName);
      } catch (err) {
        fail++;
        log.push("FAIL;" + srcFile.displayName + ";Error: " + err);
        try {
          if (tgtDoc && tgtDoc.isValid) tgtDoc.close(SaveOptions.NO);
        } catch (e2) {}
      } finally {
        try {
          if (srcDoc && srcDoc.isValid) srcDoc.close(SaveOptions.NO);
        } catch (e3) {}
        try {
          // se o template original ainda estiver aberto, fecha sem salvar
          if (
            tplDoc &&
            tplDoc.isValid &&
            String(tplDoc.fullName) === String(tplFile)
          ) {
            tplDoc.close(SaveOptions.NO);
          }
        } catch (e4) {}
        resetFindChange();
      }
    }
  } finally {
    app.scriptPreferences.userInteractionLevel = prevUI;
    app.scriptPreferences.enableRedraw = prevRedraw;
  }

  var msg =
    "== MIGRAR PARA MIOLO NOVO ==\r" +
    "OK: " +
    ok +
    " | Falhas: " +
    fail +
    (log.length ? "\r" + log.join("\r") : "");
  alert(msg);
})();
