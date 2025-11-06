#!/usr/bin/env node
// candidates.(generated|evaluated).json から説明Markdownを生成
// 使い方: node scripts/explain_scenarios.mjs sample-data/candidates.evaluated.json sample-data/explanations.generated.md

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const inPath = process.argv[2] || 'sample-data/candidates.evaluated.json';
const outPath = process.argv[3] || 'sample-data/explanations.generated.md';

function fmtKpi(k){
  if(!k) return '-';
  return `カバー率 ${k.coverageRate}% / 所要 ${k.avgTravelTime}分 / コスト ${k.operatingCost}千円/日 / 維持率 ${k.serviceLevelRetention}%`;
}

function main(){
  const src = JSON.parse(readFileSync(inPath, 'utf-8'));
  let md = '# シナリオ説明（自動生成）\n\n';
  for(const c of src.candidates){
    md += `## ${c.id} ${c.title}\n`;
    md += `- 施策: ${c.measure} / 強度: ${c.strength}\n`;
    md += `- 理由: ${c.reason}\n`;
    md += `- 状態: ${c.status}${c.recommended ? '（推奨）' : ''}\n`;
    md += `- KPI: ${fmtKpi(c.kpi)}\n\n`;
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md, 'utf-8');
  console.log(`wrote: ${outPath}`);
}

main();

