#!/usr/bin/env node
// candidates.generated.json に実測KPI（擬似）を付与し、achieved を判定
// 使い方: node scripts/evaluate_scenarios.mjs sample-data/candidates.generated.json sample-data/candidates.evaluated.json

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const inPath = process.argv[2] || 'sample-data/candidates.generated.json';
const outPath = process.argv[3] || 'sample-data/candidates.evaluated.json';

const thresholds = {
  coverageRate: 80,
  avgTravelTime: 35, // min 以下
  operatingCost: 900, // 千円/日 以下
  serviceLevelRetention: 95,
};

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function evaluate(candidate){
  // 施策に応じた傾向値を割り当て（デモ用）
  let coverage = 78 + Math.random() * 10; // 78..88
  let travel = 30 + Math.random() * 12;   // 30..42
  let cost = 800 + Math.random() * 300;   // 800..1100
  let retain = 93 + Math.random() * 5;    // 93..98

  switch(candidate.measure){
    case '区間短縮':
      travel -= 4 + Math.random() * 3; // 所要短縮
      cost -= 60 + Math.random() * 80;
      break;
    case '停留所統廃合':
      travel -= 2 + Math.random() * 2;
      retain -= 1 + Math.random() * 1.5; // 影響小
      break;
    case '減便':
      cost -= 150 + Math.random() * 150; // コスト削減
      retain -= 2 + Math.random() * 2.5; // 維持率は低下しやすい
      break;
    case 'DRTゾーン':
      coverage += 4 + Math.random() * 4; // カバー率改善
      cost += 20 + Math.random() * 50;   // 運用費増もあり得る
      break;
  }

  const kpi = {
    coverageRate: clamp(+coverage.toFixed(1), 0, 100),
    avgTravelTime: clamp(+travel.toFixed(1), 0, 999),
    operatingCost: Math.round(clamp(cost, 0, 99999)),
    serviceLevelRetention: clamp(+retain.toFixed(1), 0, 100),
  };

  // “達成”は優先KPIに依存するが、ここでは総合的に甘め判定
  const achieved = (
    kpi.coverageRate >= thresholds.coverageRate &&
    kpi.avgTravelTime <= thresholds.avgTravelTime &&
    kpi.operatingCost <= thresholds.operatingCost &&
    kpi.serviceLevelRetention >= thresholds.serviceLevelRetention
  );

  return { ...candidate, kpi, status: achieved ? 'achieved' : 'not_achieved' };
}

function main(){
  const src = JSON.parse(readFileSync(inPath, 'utf-8'));
  const evaluated = src.candidates.map(evaluate);
  const out = { candidates: evaluated };
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`evaluated: ${outPath}`);
}

main();

