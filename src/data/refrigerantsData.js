// 냉매별 포화압력-온도 데이터 (압력 단위: bar abs)
// 출처: NIST WebBook 선형보간 (순수냉매), ASHRAE 근사값 (혼합냉매*)
// * R-410A, R-404A, R-507A 는 혼합냉매로 NIST 데이터 없음 — 현장 참조용 근사값
// pt: null 인 냉매는 특성 정보만 표시 (PT 데이터 미수록)

export const ATM = 1.013 // 대기압 bar

// [온도(°C), 압력(bar abs)] 쌍 배열
export const REFRIGERANTS = [
  {
    id: 'R-22',
    name: 'R-22',
    color: '#3B82F6',
    type: 'HCFC',
    note: 'HCFC-22 (NIST)',
    info: { group: 'A1', gwp: 1810, odp: 0.055, tBoil: -40.8, tCrit: 96.1, tCritP: 4.99 },
    tMin: -50, tMax: 60,
    pt: [
      [-50, 0.65], [-45, 0.83], [-40, 1.05], [-35, 1.32],
      [-30, 1.64], [-25, 2.01], [-20, 2.45], [-15, 2.96],
      [-10, 3.55], [ -5, 4.22], [  0, 4.98], [  5, 5.84],
      [ 10, 6.81], [ 15, 7.89], [ 20, 9.10], [ 25,10.44],
      [ 30,11.92], [ 35,13.55], [ 40,15.34], [ 45,17.29],
      [ 50,19.43], [ 55,21.75], [ 60,24.28],
    ],
  },
  {
    id: 'R-410A',
    name: 'R-410A',
    color: '#EF4444',
    type: '혼합냉매',
    note: 'HFC 혼합 R-32/125 (*근사)',
    info: { group: 'A1', gwp: 2088, odp: 0, tBoil: -51.4, tCrit: 72.1, tCritP: 4.95 },
    tMin: -50, tMax: 50,
    pt: [
      [-50, 2.37], [-45, 2.70], [-40, 3.07], [-35, 3.49],
      [-30, 3.96], [-25, 4.51], [-20, 5.13], [-15, 5.83],
      [-10, 6.63], [ -5, 7.54], [  0, 8.57], [  5, 9.75],
      [ 10,11.09], [ 15,12.61], [ 20,14.34], [ 25,16.31],
      [ 30,18.56], [ 35,21.10], [ 40,24.00], [ 45,27.30],
      [ 50,31.05],
    ],
  },
  {
    id: 'R-404A',
    name: 'R-404A',
    color: '#10B981',
    type: '혼합냉매',
    note: 'HFC 혼합 R-125/143a/134a (*근사)',
    info: { group: 'A1', gwp: 3922, odp: 0, tBoil: -46.5, tCrit: 72.1, tCritP: 3.74 },
    tMin: -50, tMax: 50,
    pt: [
      [-50, 1.23], [-45, 1.47], [-40, 1.73], [-35, 2.10],
      [-30, 2.67], [-25, 3.22], [-20, 3.93], [-15, 4.71],
      [-10, 5.54], [ -5, 6.55], [  0, 7.63], [  5, 8.91],
      [ 10,10.27], [ 15,11.84], [ 20,13.55], [ 25,15.49],
      [ 30,17.58], [ 35,19.88], [ 40,22.46], [ 45,25.24],
      [ 50,28.17],
    ],
  },
  {
    id: 'R-134a',
    name: 'R-134a',
    color: '#F59E0B',
    type: 'HFC',
    note: 'HFC-134a (NIST)',
    info: { group: 'A1', gwp: 1430, odp: 0, tBoil: -26.3, tCrit: 101.1, tCritP: 4.06 },
    tMin: -50, tMax: 60,
    pt: [
      [-50, 0.30], [-45, 0.39], [-40, 0.51], [-35, 0.66],
      [-30, 0.84], [-25, 1.06], [-20, 1.33], [-15, 1.64],
      [-10, 2.01], [ -5, 2.43], [  0, 2.93], [  5, 3.50],
      [ 10, 4.15], [ 15, 4.88], [ 20, 5.72], [ 25, 6.65],
      [ 30, 7.70], [ 35, 8.87], [ 40,10.17], [ 45,11.60],
      [ 50,13.18], [ 55,14.91], [ 60,16.82],
    ],
  },
  {
    id: 'R-32',
    name: 'R-32',
    color: '#8B5CF6',
    type: 'HFC',
    note: 'HFC-32 (NIST)',
    info: { group: 'A2L', gwp: 675, odp: 0, tBoil: -51.7, tCrit: 78.1, tCritP: 5.78 },
    tMin: -50, tMax: 50,
    pt: [
      [-50, 1.10], [-45, 1.41], [-40, 1.77], [-35, 2.21],
      [-30, 2.73], [-25, 3.35], [-20, 4.06], [-15, 4.88],
      [-10, 5.83], [ -5, 6.91], [  0, 8.13], [  5, 9.51],
      [ 10,11.07], [ 15,12.81], [ 20,14.74], [ 25,16.90],
      [ 30,19.28], [ 35,21.90], [ 40,24.78], [ 45,27.95],
      [ 50,31.41],
    ],
  },
  {
    id: 'R-507A',
    name: 'R-507A',
    color: '#06B6D4',
    type: '혼합냉매',
    note: 'HFC 공비혼합 R-125/143a (*근사)',
    info: { group: 'A1', gwp: 3985, odp: 0, tBoil: -46.7, tCrit: 70.6, tCritP: 3.79 },
    tMin: -50, tMax: 50,
    pt: [
      [-50, 1.43], [-45, 1.65], [-40, 1.89], [-35, 2.31],
      [-30, 2.92], [-25, 3.50], [-20, 4.30], [-15, 5.12],
      [-10, 6.06], [ -5, 7.15], [  0, 8.33], [  5, 9.68],
      [ 10,11.22], [ 15,12.97], [ 20,14.82], [ 25,16.84],
      [ 30,19.26], [ 35,21.82], [ 40,24.56], [ 45,27.59],
      [ 50,30.85],
    ],
  },
  {
    id: 'R-407C',
    name: 'R-407C',
    color: '#84CC16',
    type: '혼합냉매',
    note: 'HFC 혼합 R-32/125/134a (*근사)',
    info: { group: 'A1', gwp: 1774, odp: 0, tBoil: -43.6, tCrit: 86.1, tCritP: 4.63 },
    tMin: -50, tMax: 50,
    pt: [
      [-50, 0.88], [-45, 1.06], [-40, 1.26], [-35, 1.56],
      [-30, 1.92], [-25, 2.35], [-20, 2.84], [-15, 3.42],
      [-10, 4.10], [ -5, 4.87], [  0, 5.77], [  5, 6.79],
      [ 10, 7.96], [ 15, 9.29], [ 20,10.80], [ 25,12.50],
      [ 30,14.41], [ 35,16.55], [ 40,18.95], [ 45,21.62],
      [ 50,24.60],
    ],
  },
  {
    id: 'R-600a',
    name: 'R-600a',
    color: '#EC4899',
    type: '자연냉매',
    note: '이소부탄 소형냉장고 (NIST)',
    info: { group: 'A3', gwp: 3, odp: 0, tBoil: -11.6, tCrit: 134.7, tCritP: 3.64 },
    tMin: -40, tMax: 50,
    pt: [
      [-40, 0.29], [-35, 0.37], [-30, 0.47], [-25, 0.58],
      [-20, 0.72], [-15, 0.89], [-10, 1.08], [ -5, 1.31],
      [  0, 1.57], [  5, 1.87], [ 10, 2.21], [ 15, 2.59],
      [ 20, 3.02], [ 25, 3.51], [ 30, 4.05], [ 35, 4.65],
      [ 40, 5.31], [ 45, 6.04], [ 50, 6.79],
    ],
  },
  {
    id: 'R-290',
    name: 'R-290',
    color: '#F97316',
    type: '자연냉매',
    note: '프로판 자연냉매 (NIST)',
    info: { group: 'A3', gwp: 3, odp: 0, tBoil: -42.1, tCrit: 96.7, tCritP: 4.25 },
    tMin: -50, tMax: 50,
    pt: [
      [-50, 0.71], [-45, 0.89], [-40, 1.11], [-35, 1.37],
      [-30, 1.68], [-25, 2.03], [-20, 2.45], [-15, 2.92],
      [-10, 3.45], [ -5, 4.06], [  0, 4.74], [  5, 5.51],
      [ 10, 6.37], [ 15, 7.32], [ 20, 8.36], [ 25, 9.52],
      [ 30,10.79], [ 35,12.18], [ 40,13.70], [ 45,15.34],
      [ 50,17.13],
    ],
  },
  {
    id: 'R-717',
    name: 'R-717',
    color: '#64748B',
    type: '자연냉매',
    note: '암모니아 산업용 (NIST)',
    info: { group: 'B2L', gwp: 0, odp: 0, tBoil: -33.3, tCrit: 132.4, tCritP: 11.33 },
    tMin: -50, tMax: 50,
    pt: [
      [-50, 0.41], [-45, 0.55], [-40, 0.72], [-35, 0.93],
      [-30, 1.19], [-25, 1.52], [-20, 1.90], [-15, 2.36],
      [-10, 2.91], [ -5, 3.55], [  0, 4.29], [  5, 5.16],
      [ 10, 6.15], [ 15, 7.28], [ 20, 8.57], [ 25,10.03],
      [ 30,11.67], [ 35,13.50], [ 40,15.55], [ 45,17.82],
      [ 50,20.33],
    ],
  },
  {
    id: 'R-744',
    name: 'R-744',
    color: '#0EA5E9',
    note: 'CO₂ 자연냉매 (NIST)',
    type: '자연냉매',
    info: { group: 'A1', gwp: 1, odp: 0, tBoil: null, tCrit: 31.1, tCritP: 7.38 },
    tMin: -55, tMax: 30,
    pt: [
      [-55, 5.54], [-50, 6.82], [-45, 8.32], [-40,10.05],
      [-35,12.02], [-30,14.28], [-25,16.83], [-20,19.70],
      [-15,22.91], [-10,26.49], [ -5,30.46], [  0,34.85],
      [  5,39.81], [ 10,45.02], [ 15,50.99], [ 20,57.29],
      [ 25,64.34], [ 30,72.14],
    ],
  },

  // ── PT 데이터 없음 — 특성 정보만 ──────────────────────────
  { id:'R-11',   name:'R-11',   color:'#6B7280', type:'CFC',    note:'CCl₃F (Trichlorofluoromethane)',           pt:null, info:{ group:'A1',  gwp:4750,  odp:1.0,    tBoil:-23.8, tCrit:198.0, tCritP:4.41 } },
  { id:'R-12',   name:'R-12',   color:'#6B7280', type:'CFC',    note:'CCl₂F₂ (Dichlorodifluoromethane)',         pt:null, info:{ group:'A1',  gwp:10900, odp:1.0,    tBoil:-29.8, tCrit:112.0, tCritP:4.14 } },
  { id:'R-113',  name:'R-113',  color:'#6B7280', type:'CFC',    note:'CCl₂FCClF₂',                               pt:null, info:{ group:'A1',  gwp:6130,  odp:0.9,    tBoil:47.6,  tCrit:214.1, tCritP:3.44 } },
  { id:'R-114',  name:'R-114',  color:'#6B7280', type:'CFC',    note:'CClF₂CClF₂',                               pt:null, info:{ group:'A1',  gwp:10000, odp:0.85,   tBoil:3.8,   tCrit:145.7, tCritP:3.26 } },
  { id:'R-115',  name:'R-115',  color:'#6B7280', type:'CFC',    note:'CClF₂CF₃',                                 pt:null, info:{ group:'A1',  gwp:7370,  odp:0.4,    tBoil:-38.0, tCrit:80.0,  tCritP:3.13 } },
  { id:'R-123',  name:'R-123',  color:'#A78BFA', type:'HCFC',   note:'CHCl₂CF₃',                                 pt:null, info:{ group:'B1',  gwp:77,    odp:0.02,   tBoil:27.8,  tCrit:183.7, tCritP:3.66 } },
  { id:'R-124',  name:'R-124',  color:'#A78BFA', type:'HCFC',   note:'CHClFCF₃',                                 pt:null, info:{ group:'A1',  gwp:609,   odp:0.022,  tBoil:-12.0, tCrit:122.3, tCritP:3.62 } },
  { id:'R-141b', name:'R-141b', color:'#A78BFA', type:'HCFC',   note:'CH₃CCl₂F',                                 pt:null, info:{ group:'A2',  gwp:725,   odp:0.11,   tBoil:32.1,  tCrit:204.2, tCritP:4.21 } },
  { id:'R-142b', name:'R-142b', color:'#A78BFA', type:'HCFC',   note:'CH₃CClF₂',                                 pt:null, info:{ group:'A2',  gwp:2310,  odp:0.065,  tBoil:-9.8,  tCrit:137.2, tCritP:4.06 } },
  { id:'R-23',   name:'R-23',   color:'#60A5FA', type:'HFC',    note:'CHF₃ (Trifluoromethane)',                  pt:null, info:{ group:'A1',  gwp:14800, odp:0,      tBoil:-82.1, tCrit:26.1,  tCritP:4.82 } },
  { id:'R-125',  name:'R-125',  color:'#60A5FA', type:'HFC',    note:'CHF₂CF₃ (Pentafluoroethane)',              pt:null, info:{ group:'A1',  gwp:3500,  odp:0,      tBoil:-48.5, tCrit:66.3,  tCritP:3.62 } },
  { id:'R-143a', name:'R-143a', color:'#60A5FA', type:'HFC',    note:'CH₃CF₃ (1,1,1-Trifluoroethane)',          pt:null, info:{ group:'A2L', gwp:4470,  odp:0,      tBoil:-47.4, tCrit:72.9,  tCritP:3.76 } },
  { id:'R-152a', name:'R-152a', color:'#60A5FA', type:'HFC',    note:'CH₃CHF₂ (1,1-Difluoroethane)',            pt:null, info:{ group:'A2',  gwp:124,   odp:0,      tBoil:-24.0, tCrit:113.3, tCritP:4.52 } },
  { id:'R-161',  name:'R-161',  color:'#60A5FA', type:'HFC',    note:'CH₃CH₂F (Fluoroethane)',                  pt:null, info:{ group:'A2',  gwp:12,    odp:0,      tBoil:-37.1, tCrit:102.2, tCritP:5.03 } },
  { id:'R-1234yf',    name:'R-1234yf',    color:'#34D399', type:'HFO', note:'CF₃CF=CH₂ (2,3,3,3-Tetrafluoropropene)',              pt:null, info:{ group:'A2L', gwp:4,   odp:0,      tBoil:-29.4, tCrit:94.7,  tCritP:3.38 } },
  { id:'R-1234ze(E)', name:'R-1234ze(E)', color:'#34D399', type:'HFO', note:'CF₃CH=CHF (trans-1,3,3,3-Tetrafluoropropene)',        pt:null, info:{ group:'A2L', gwp:7,   odp:0,      tBoil:-18.9, tCrit:109.4, tCritP:3.63 } },
  { id:'R-1233zd(E)', name:'R-1233zd(E)', color:'#34D399', type:'HFO', note:'CF₃CH=CHCl (trans-1-Chloro-3,3,3-trifluoropropene)', pt:null, info:{ group:'A1',  gwp:1,   odp:0.00034,tBoil:18.3,  tCrit:166.5, tCritP:3.57 } },
  { id:'R-1270', name:'R-1270', color:'#F97316', type:'자연냉매', note:'C₃H₆ (Propylene)',                        pt:null, info:{ group:'A3',  gwp:2,     odp:0,      tBoil:-47.6, tCrit:91.8,  tCritP:4.67 } },
  { id:'R-401A', name:'R-401A', color:'#D97706', type:'혼합냉매', note:'R-22/152a/124 (53/13/34%)',               pt:null, info:{ group:'A1',  gwp:1182,  odp:0.033,  tBoil:-33.1, tCrit:107.6, tCritP:4.68 } },
  { id:'R-422D', name:'R-422D', color:'#D97706', type:'혼합냉매', note:'R-125/134a/600a (65.1/31.5/3.4%)',        pt:null, info:{ group:'A1',  gwp:2729,  odp:0,      tBoil:-46.6, tCrit:79.5,  tCritP:4.01 } },
  { id:'R-452A', name:'R-452A', color:'#D97706', type:'혼합냉매', note:'R-32/125/1234yf (11/59/30%)',             pt:null, info:{ group:'A2L', gwp:2140,  odp:0,      tBoil:-47.5, tCrit:73.0,  tCritP:3.99 } },
  { id:'R-454B', name:'R-454B', color:'#D97706', type:'혼합냉매', note:'R-32/1234yf (68.9/31.1%)',                pt:null, info:{ group:'A2L', gwp:466,   odp:0,      tBoil:-51.7, tCrit:78.1,  tCritP:4.63 } },
  { id:'R-513A', name:'R-513A', color:'#D97706', type:'혼합냉매', note:'R-134a/1234yf (44/56%)',                  pt:null, info:{ group:'A1',  gwp:631,   odp:0,      tBoil:-29.3, tCrit:97.3,  tCritP:3.77 } },
]

// 온도 → 포화압력 (bar abs) 선형보간
export function tempToPressureAbs(rfg, tempC) {
  const { pt } = rfg
  if (tempC <= pt[0][0]) return pt[0][1]
  if (tempC >= pt[pt.length - 1][0]) return pt[pt.length - 1][1]
  for (let i = 0; i < pt.length - 1; i++) {
    if (tempC >= pt[i][0] && tempC <= pt[i + 1][0]) {
      const t = (tempC - pt[i][0]) / (pt[i + 1][0] - pt[i][0])
      return pt[i][1] + t * (pt[i + 1][1] - pt[i][1])
    }
  }
  return null
}

// 포화압력 (bar abs) → 온도 선형보간
export function pressureAbsToTemp(rfg, pAbs) {
  const { pt } = rfg
  if (pAbs <= pt[0][1]) return pt[0][0]
  if (pAbs >= pt[pt.length - 1][1]) return pt[pt.length - 1][0]
  for (let i = 0; i < pt.length - 1; i++) {
    if (pAbs >= pt[i][1] && pAbs <= pt[i + 1][1]) {
      const t = (pAbs - pt[i][1]) / (pt[i + 1][1] - pt[i][1])
      return pt[i][0] + t * (pt[i + 1][0] - pt[i][0])
    }
  }
  return null
}

// 단위 변환 유틸리티
export const UNITS = {
  bar:  { label: 'bar',      factor: 1,       decimals: 2 },
  kgf:  { label: 'kgf/cm²', factor: 1.01972, decimals: 2 },
  mpa:  { label: 'MPa',     factor: 0.1,     decimals: 3 },
  psi:  { label: 'psi',     factor: 14.5038, decimals: 1 },
}

export function toDisplay(pAbs, unitKey, isGauge) {
  const pBase = isGauge ? pAbs - ATM : pAbs
  return pBase * UNITS[unitKey].factor
}

export function fromDisplay(pDisplay, unitKey, isGauge) {
  const pBar = pDisplay / UNITS[unitKey].factor
  return isGauge ? pBar + ATM : pBar
}

// 참조 표용 주요 온도 목록 (각 냉매 tMin/tMax로 필터됨)
export const REF_TEMPS = [-55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
