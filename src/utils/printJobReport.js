import { loadSettings } from './settings'
import { getMediaUrl } from './cloudSync'

// 안전한 HTML 이스케이프 (XSS 방지)
function esc(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function nl2br(s) {
  return esc(s).replace(/\n/g, '<br>')
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/**
 * AS 작업 내역서 인쇄 — 새 탭에 출력용 HTML 작성 후 window.print() 호출
 * 사용자가 인쇄 메뉴에서 "PDF로 저장" 또는 프린터 인쇄 선택
 * 반환: 팝업 차단 시 false. 그 외 true.
 * async — 다른 기기에서 pull로 받은 사진 (storagePath만) 표시 위해 Firebase Storage URL 비동기 다운로드
 */
async function resolvePhotoUrl(dataUrl, storagePath) {
  if (dataUrl) return dataUrl
  if (storagePath) return await getMediaUrl(storagePath)
  return null
}

export async function printJobReport({ job, customer, photos = [], isDraft = false, t }) {
  const s = loadSettings()
  const win = window.open('', '_blank')
  if (!win) return false

  const labels = {
    title:        t('print.docTitle'),
    draftBadge:   t('print.draftBadge'),
    company:      t('print.company'),
    customer:     t('print.customer'),
    dates:        t('print.dates'),
    receivedAt:   t('print.receivedAt'),
    visitAt:      t('print.visitAt'),
    completedAt:  t('print.completedAt'),
    stage1:       t('print.stage1'),
    stage2:       t('print.stage2'),
    fTitle:       t('knowhow.sectionTitle'),
    fSymptoms:    t('knowhow.sectionSymptoms'),
    fCause:       t('knowhow.sectionCause'),
    fCheckSteps:  t('knowhow.sectionCheckSteps'),
    fSolution:    t('knowhow.sectionSolution'),
    fParts:       t('knowhow.sectionParts'),
    fNotes:       t('knowhow.sectionNotes'),
    equipPhotos:  t('knowhow.equipPhotos'),
    sitePhotos:   t('print.sitePhotos'),
    bizName:      t('settings.bizName'),
    bizOwner:     t('settings.bizOwner'),
    bizPhone:     t('settings.bizPhone'),
    bizAddress:   t('settings.bizAddress'),
    bizRegNo:     t('settings.bizRegNo'),
    cName:        t('print.cName'),
    cPhone:       t('print.cPhone'),
    cAddress:     t('print.cAddress'),
    notEntered:   t('job.notEntered'),
    printedAt:    t('print.printedAt'),
  }

  // 장비 사진(명판) — equipments 배열에서 stage 무시하고 모두 표시
  const equips = Array.isArray(job.equipments) ? job.equipments : []
  // 현장 사진
  const sitePhotos = Array.isArray(photos) ? photos : []

  // 사진 URL 비동기 받음 — dataUrl 우선, 없으면 storagePath에서 Firebase Storage URL 다운로드
  const equipsResolved = await Promise.all(equips.map(async (eq) => ({
    ...eq,
    _url: await resolvePhotoUrl(eq.photo, eq.storagePath),
  })))
  const sitePhotosResolved = await Promise.all(sitePhotos.map(async (p) => ({
    ...p,
    _url: await resolvePhotoUrl(p.dataUrl, p.storagePath),
  })))

  const equipsHtml = equipsResolved.length === 0 ? '' : `
    <section class="block">
      <h2>${esc(labels.equipPhotos)}</h2>
      <div class="photo-grid">
        ${equipsResolved.map((eq) => `
          <div class="photo-card">
            ${eq._url ? `<img src="${esc(eq._url)}" alt="">` : ''}
            <div class="photo-meta">
              ${eq.kind   ? `<div><b>${esc(eq.kind)}</b></div>` : ''}
              ${eq.brand  ? `<div>${esc(eq.brand)}</div>` : ''}
              ${eq.model  ? `<div>${esc(eq.model)}</div>` : ''}
              ${eq.serial ? `<div>S/N: ${esc(eq.serial)}</div>` : ''}
              ${eq.capacity    ? `<div>${esc(eq.capacity)}</div>`    : ''}
              ${eq.refrigerant ? `<div>${esc(eq.refrigerant)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </section>`

  const sitePhotosHtml = sitePhotosResolved.length === 0 ? '' : `
    <section class="block">
      <h2>${esc(labels.sitePhotos)} (${sitePhotosResolved.length})</h2>
      <div class="photo-grid">
        ${sitePhotosResolved.map((p) => `
          <div class="photo-card">
            ${p._url ? `<img src="${esc(p._url)}" alt="">` : ''}
          </div>
        `).join('')}
      </div>
    </section>`

  const html = `<!DOCTYPE html>
<html lang="${esc(navigator.language || 'ko')}">
<head>
<meta charset="utf-8">
<title>${esc(labels.title)} - ${esc(customer?.name ?? '')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; color: #111; margin: 0; padding: 24px; background: white; font-size: 13px; line-height: 1.55; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 18px; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .draft-badge { display: inline-block; margin-left: 8px; padding: 2px 8px; background: #fde68a; color: #92400e; font-size: 11px; font-weight: 700; border-radius: 4px; vertical-align: middle; }
  .biz-info { text-align: right; font-size: 11px; color: #444; line-height: 1.5; }
  .biz-info .biz-name { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 2px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .meta-card { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; }
  .meta-card h3 { margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
  .meta-card .row { display: grid; grid-template-columns: 70px 1fr; gap: 4px; font-size: 12px; padding: 1px 0; }
  .meta-card .row b { color: #6b7280; font-weight: 500; }
  .block { margin-bottom: 16px; page-break-inside: avoid; }
  .block h2 { font-size: 13px; font-weight: 700; color: #1f2937; padding: 6px 10px; background: #f3f4f6; border-left: 4px solid #2563eb; margin: 0 0 8px 0; }
  .stage2 h2 { border-left-color: #059669; }
  .field { margin-bottom: 10px; }
  .field-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 3px; }
  .field-value { font-size: 13px; color: #111; white-space: pre-wrap; padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 4px; min-height: 20px; }
  .field-value.empty { color: #9ca3af; font-style: italic; }
  .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .photo-card { border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; }
  .photo-card img { width: 100%; height: 140px; object-fit: cover; display: block; }
  .photo-meta { padding: 4px 6px; font-size: 10px; line-height: 1.35; color: #374151; }
  .photo-meta b { color: #111; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: right; }
  @media print {
    body { padding: 12mm; }
    .photo-card img { height: 100px; }
    .block { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${esc(labels.title)}${isDraft ? `<span class="draft-badge">${esc(labels.draftBadge)}</span>` : ''}</h1>
    </div>
    <div class="biz-info">
      ${s.bizName    ? `<div class="biz-name">${esc(s.bizName)}</div>` : ''}
      ${s.bizOwner   ? `<div>${esc(labels.bizOwner)}: ${esc(s.bizOwner)}</div>` : ''}
      ${s.bizPhone   ? `<div>${esc(labels.bizPhone)}: ${esc(s.bizPhone)}</div>` : ''}
      ${s.bizAddress ? `<div>${esc(s.bizAddress)}</div>` : ''}
      ${s.bizRegNo   ? `<div>${esc(labels.bizRegNo)}: ${esc(s.bizRegNo)}</div>` : ''}
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <h3>${esc(labels.customer)}</h3>
      <div class="row"><b>${esc(labels.cName)}</b><span>${esc(customer?.name ?? '')}</span></div>
      ${customer?.phone   ? `<div class="row"><b>${esc(labels.cPhone)}</b><span>${esc(customer.phone)}</span></div>` : ''}
      ${customer?.address ? `<div class="row"><b>${esc(labels.cAddress)}</b><span>${esc(customer.address)}</span></div>` : ''}
    </div>
    <div class="meta-card">
      <h3>${esc(labels.dates)}</h3>
      ${job.receivedAt  || job.createdAt ? `<div class="row"><b>${esc(labels.receivedAt)}</b><span>${esc(fmtDate(job.receivedAt ?? job.createdAt))}</span></div>` : ''}
      ${job.visitDate   ? `<div class="row"><b>${esc(labels.visitAt)}</b><span>${esc(fmtDate(job.visitDate))}${job.visitTime ? ' ' + esc(job.visitTime) : ''}</span></div>` : ''}
      ${job.completedAt ? `<div class="row"><b>${esc(labels.completedAt)}</b><span>${esc(fmtDate(job.completedAt))}</span></div>` : ''}
    </div>
  </div>

  <section class="block stage1">
    <h2>${esc(labels.stage1)}</h2>
    <div class="field">
      <div class="field-label">${esc(labels.fTitle)}</div>
      <div class="field-value ${job.title ? '' : 'empty'}">${job.title ? nl2br(job.title) : esc(labels.notEntered)}</div>
    </div>
    <div class="field">
      <div class="field-label">${esc(labels.fSymptoms)}</div>
      <div class="field-value ${job.symptoms ? '' : 'empty'}">${job.symptoms ? nl2br(job.symptoms) : esc(labels.notEntered)}</div>
    </div>
  </section>

  <section class="block stage2">
    <h2>${esc(labels.stage2)}</h2>
    <div class="field">
      <div class="field-label">${esc(labels.fCause)}</div>
      <div class="field-value ${job.cause ? '' : 'empty'}">${job.cause ? nl2br(job.cause) : esc(labels.notEntered)}</div>
    </div>
    <div class="field">
      <div class="field-label">${esc(labels.fCheckSteps)}</div>
      <div class="field-value ${job.checkSteps ? '' : 'empty'}">${job.checkSteps ? nl2br(job.checkSteps) : esc(labels.notEntered)}</div>
    </div>
    <div class="field">
      <div class="field-label">${esc(labels.fSolution)}</div>
      <div class="field-value ${job.solution ? '' : 'empty'}">${job.solution ? nl2br(job.solution) : esc(labels.notEntered)}</div>
    </div>
    <div class="field">
      <div class="field-label">${esc(labels.fParts)}</div>
      <div class="field-value ${job.parts ? '' : 'empty'}">${job.parts ? nl2br(job.parts) : esc(labels.notEntered)}</div>
    </div>
    <div class="field">
      <div class="field-label">${esc(labels.fNotes)}</div>
      <div class="field-value ${job.notes ? '' : 'empty'}">${job.notes ? nl2br(job.notes) : esc(labels.notEntered)}</div>
    </div>
  </section>

  ${equipsHtml}
  ${sitePhotosHtml}

  <div class="footer">${esc(labels.printedAt)}: ${esc(new Date().toLocaleString())}</div>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()

  // 이미지 로드 완료 후 인쇄 (사진 누락 방지)
  win.onload = () => {
    setTimeout(() => {
      try { win.focus(); win.print() } catch (e) { /* noop */ }
    }, 200)
  }
  return true
}
