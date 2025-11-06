#!/usr/bin/env node
// GTFS ZIP から 10 個のシナリオ候補を自動生成する簡易ジェネレータ
// 入力: node scripts/generate_scenarios.mjs <zipPath> <outJson>

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { unzipSync, strFromU8 } from 'fflate';
import Papa from 'papaparse';
import iconv from 'iconv-lite';

const argv = process.argv.slice(2);
const ZIP_PATH = argv[0] || 'gtfs_data/AllLines-20250401_群馬中央バス株式会社.zip';
const OUT_PATH = argv[1] || 'sample-data/candidates.generated.json';

function decodeMaybeSJIS(u8) {
  const utf8 = strFromU8(u8);
  const sjis = iconv.decode(Buffer.from(u8), 'Shift_JIS');
  const score = s => {
    let jp = 0; for (const ch of s) {
      const c = ch.charCodeAt(0);
      if ((c >= 0x3040 && c <= 0x30FF) || (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0xFF01 && c <= 0xFF60)) jp++;
    }
    return jp / Math.max(1, s.length);
  };
  // 日本語スコアの高い方を採用（微差なら UTF-8）
  return score(sjis) > score(utf8) + 0.02 ? sjis : utf8;
}

function parseCsv(u8) {
  const text = decodeMaybeSJIS(u8);
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

function findFile(files, name) {
  const key = Object.keys(files).find(k => k.toLowerCase() === name.toLowerCase());
  return key || null;
}

function haversine(a, b) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const t = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(t));
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function polylineFromPoints(pts) {
  return { type: 'LineString', coordinates: pts.map(p => [p.lon, p.lat]) };
}

function squarePolygon(center, meters = 500) {
  const d = meters / 111320; // deg 約
  return {
    type: 'Polygon',
    coordinates: [[
      [center.lon - d, center.lat - d],
      [center.lon + d, center.lat - d],
      [center.lon + d, center.lat + d],
      [center.lon - d, center.lat + d],
      [center.lon - d, center.lat - d],
    ]],
  };
}

function pick(obj, keys) { const o = {}; keys.forEach(k => o[k] = obj[k]); return o; }

function groupBy(arr, key) {
  return arr.reduce((m, x) => { const k = x[key]; (m[k] ||= []).push(x); return m; }, {});
}

function main() {
  const u8 = new Uint8Array(readFileSync(ZIP_PATH));
  const files = unzipSync(u8);

  const stopsCsv = findFile(files, 'stops.txt');
  const routesCsv = findFile(files, 'routes.txt');
  if (!stopsCsv || !routesCsv) throw new Error('stops.txt / routes.txt が見つかりません');
  const tripsCsv = findFile(files, 'trips.txt');
  const shapesCsv = findFile(files, 'shapes.txt');
  const stopTimesCsv = findFile(files, 'stop_times.txt');

  const stops = parseCsv(files[stopsCsv]).map(r => ({ id: r.stop_id, name: r.stop_name, lon: +r.stop_lon, lat: +r.stop_lat }));
  const stopMap = Object.fromEntries(stops.map(s => [s.id, s]));
  const routes = parseCsv(files[routesCsv]).map(r => ({ id: r.route_id, name: r.route_short_name || r.route_long_name || r.route_id }));

  let trips = [];
  let shapes = [];
  let stopTimes = [];
  if (tripsCsv) trips = parseCsv(files[tripsCsv]).map(t => pick(t, ['route_id', 'trip_id', 'shape_id']));
  if (stopTimesCsv) stopTimes = parseCsv(files[stopTimesCsv]).map(st => pick(st, ['trip_id', 'stop_id', 'stop_sequence']));
  if (shapesCsv) shapes = parseCsv(files[shapesCsv]).map(s => ({ shape_id: s.shape_id, lat: +s.shape_pt_lat, lon: +s.shape_pt_lon, seq: +s.shape_pt_sequence }));

  // ルート代表形状を作成
  const routeGeo = new Map(); // route_id -> LineString
  const tripsByRoute = groupBy(trips, 'route_id');
  if (shapes.length > 0) {
    const byShape = groupBy(shapes, 'shape_id');
    for (const [routeId, tlist] of Object.entries(tripsByRoute)) {
      const sid = tlist.find(t => t.shape_id)?.shape_id;
      const pts = (sid && byShape[sid]) ? byShape[sid].sort((a, b) => a.seq - b.seq) : null;
      if (pts && pts.length > 1) routeGeo.set(routeId, polylineFromPoints(pts));
    }
  }
  // shapes が無い場合: stop_times から代表 trip を選び、停留所列で線形を近似
  if (routeGeo.size === 0 && stopTimes.length > 0) {
    const byTrip = groupBy(stopTimes, 'trip_id');
    for (const [routeId, tlist] of Object.entries(tripsByRoute)) {
      const tripId = tlist[0]?.trip_id;
      const seqs = byTrip[tripId]?.sort((a, b) => (+a.stop_sequence) - (+b.stop_sequence)) || [];
      const pts = seqs.map(st => stopMap[st.stop_id]).filter(Boolean);
      if (pts.length > 1) routeGeo.set(routeId, polylineFromPoints(pts));
    }
  }

  // ルート別の停留所系列（近似）
  const routeStops = new Map(); // route_id -> Stop[]（順序不定のときは代表 trip から）
  if (stopTimes.length > 0) {
    const byTrip = groupBy(stopTimes, 'trip_id');
    for (const [routeId, tlist] of Object.entries(tripsByRoute)) {
      const tripId = tlist[0]?.trip_id;
      const seqs = byTrip[tripId]?.sort((a, b) => (+a.stop_sequence) - (+b.stop_sequence)) || [];
      const pts = seqs.map(st => stopMap[st.stop_id]).filter(Boolean);
      if (pts.length > 1) routeStops.set(routeId, pts);
    }
  }

  // トリップ頻度（ざっくり）
  const freq = Object.fromEntries(Object.entries(tripsByRoute).map(([rid, t]) => [rid, t.length]));

  // シナリオ配列を構築
  const candidates = [];
  let idSeq = 1; const nextId = () => String(idSeq++).padStart(2, '0');

  // 1) 区間短縮: 末端 3–5 停留所を切る（長さが十分な路線）
  const routesWithGeo = routes.filter(r => routeGeo.has(r.id));
  for (const r of routesWithGeo.slice(0, 4)) {
    const pts = (routeStops.get(r.id) || []).slice(-5);
    if (pts.length < 3) continue;
    const seg = polylineFromPoints(pts);
    candidates.push({
      id: `C${nextId()}`,
      title: `${r.name}-末端短縮`,
      reason: `端部長大 × 終端側 × 区間短縮`,
      measure: '区間短縮',
      strength: '中',
      annotations: [{ kind: 'line', feature: seg }],
      diversityFlags: { spatial: true, measureMix: true, strengthMix: true },
      status: 'not_evaluated'
    });
    if (candidates.length >= 3) break;
  }

  // 2) 停留所統廃合: 近接（<=120m）のペアを 2–3 組
  let pairCount = 0;
  for (const r of routes) {
    const pts = routeStops.get(r.id) || [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const d = haversine(a, b);
      if (d <= 120) {
        candidates.push({
          id: `C${nextId()}`,
          title: `${r.name}-停留所統廃合`,
          reason: `近接停留所 × ${a.name}–${b.name} × 停留所統廃合`,
          measure: '停留所統廃合',
          strength: '弱',
          annotations: [
            { kind: 'point', feature: { type: 'Point', coordinates: [a.lon, a.lat] } },
            { kind: 'point', feature: { type: 'Point', coordinates: [b.lon, b.lat] } }
          ],
          diversityFlags: { spatial: true, measureMix: true, strengthMix: true },
          status: 'not_evaluated'
        });
        pairCount++;
        if (pairCount >= 3) break;
      }
    }
    if (pairCount >= 3) break;
  }

  // 3) 減便: 便数（trip数）が多い路線を対象に 2 件
  const topFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3);
  for (const [rid] of topFreq.slice(0, 2)) {
    const r = routes.find(x => x.id === rid);
    if (!r) continue;
    candidates.push({
      id: `C${nextId()}`,
      title: `${r.name}-減便`,
      reason: `供給過多の可能性 × 幹線 × 減便`,
      measure: '減便',
      strength: '弱',
      annotations: routeGeo.get(rid) ? [{ kind: 'line', feature: routeGeo.get(rid) }] : [],
      diversityFlags: { spatial: true, measureMix: true, strengthMix: true },
      status: 'not_evaluated'
    });
  }

  // 4) DRTゾーン: 外縁の停留所付近に 2–3 面
  const xs = stops.map(s => s.lon), ys = stops.map(s => s.lat);
  const bbox = { minx: Math.min(...xs), maxx: Math.max(...xs), miny: Math.min(...ys), maxy: Math.max(...ys) };
  const corners = [
    { lon: bbox.minx, lat: bbox.miny },
    { lon: bbox.maxx, lat: bbox.miny },
    { lon: bbox.maxx, lat: bbox.maxy },
    { lon: bbox.minx, lat: bbox.maxy },
  ];
  for (const c of corners.slice(0, 2)) {
    candidates.push({
      id: `C${nextId()}`,
      title: `外縁DRTゾーン`,
      reason: `低密度想定 × 外縁部 × DRTゾーン`,
      measure: 'DRTゾーン',
      strength: '中',
      annotations: [{ kind: 'polygon', feature: squarePolygon(c, 700) }],
      diversityFlags: { spatial: true, measureMix: true, strengthMix: true },
      status: 'not_evaluated'
    });
  }

  // 不足分を埋める（ルートの別端を短縮などで）
  for (const r of routesWithGeo) {
    if (candidates.length >= 10) break;
    const pts = (routeStops.get(r.id) || []).slice(0, 5);
    if (pts.length < 3) continue;
    candidates.push({
      id: `C${nextId()}`,
      title: `${r.name}-始端短縮`,
      reason: `端部長大 × 始端側 × 区間短縮`,
      measure: '区間短縮',
      strength: '弱',
      annotations: [{ kind: 'line', feature: polylineFromPoints(pts) }],
      diversityFlags: { spatial: true, measureMix: true, strengthMix: true },
      status: 'not_evaluated'
    });
  }

  // 上限10件にトリム
  const trimmed = candidates.slice(0, 10);

  const out = { candidates: trimmed };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`generated: ${OUT_PATH} (count=${trimmed.length})`);
}

main();
