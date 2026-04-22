let timer = null

export function showToast(message, duration = 2500) {
  let el = document.getElementById('app-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'app-toast'
    el.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;' +
      'background:#1f2937;color:#fff;font-size:14px;padding:10px 20px;border-radius:10px;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.3);text-align:center;max-width:85%;transition:opacity 0.3s;'
    document.body.appendChild(el)
  }
  el.textContent = message
  el.style.opacity = '1'
  clearTimeout(timer)
  timer = setTimeout(() => { el.style.opacity = '0' }, duration)
}
