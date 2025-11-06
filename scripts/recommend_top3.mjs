#!/usr/bin/env node
// candidates.evaluated.json から優先KPIを指定して上位3件を抽出
// 使い方: node scripts/recommend_top3.mjs <evaluated.json> <priorityKpi> <out.json>

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const inPath = process.argv[2] || 'sample-data/candidates.evaluated.json';
const priority = process.argv[3] || 'coverageRate';
const outPath = process.argv[4] || `sample-data/top3.${priority}.json`;

const KPI_DIR = {
  coverageRate: 'desc',
  serviceLevelRetention: 'desc',
  operatingCost: 'asc',
  avgTravelTime: 'asc',
};

function cmp(a, b, dir){ return dir === 'asc' ? (a - b) : (b - a); }

function main(){
  const src = JSON.parse(readFileSync(inPath, 'utf-8'));
  const dir = KPI_DIR[priority] || 'desc';
  const ok = src.candidates.filter(c => c.status === 'achieved' && c.kpi);
  const sorted = ok.sort((a, b) => cmp(a.kpi[priority], b.kpi[priority], dir));
  const top3 = sorted.slice(0, 3);
  const out = { priorityKpi: priority, recommended: top3.map(c => c.id), candidates: top3 };
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`recommended(${priority}): ${outPath}`);
}

main();

