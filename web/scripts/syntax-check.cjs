const fs=require('fs'), ts=require('typescript'), path=require('path');
for(const f of ['src/App.tsx','src/main.tsx','src/kbTypes.ts']){
 const p=path.resolve(f), s=fs.readFileSync(p,'utf8');
 const out=ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true,fileName:p});
 const errs=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 if(errs.length){console.error(f,errs.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')));process.exitCode=1}else console.log(f,'syntax ok');
}