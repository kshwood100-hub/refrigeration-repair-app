import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-white">

      {/* 로고 */}
      <div className="flex flex-col items-center mb-10">
        <img src="/logo-transparent.png" alt="R-Pro" className="w-20 h-20 mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">R-Pro</h1>
        <p className="text-gray-400 text-sm mt-2 text-center leading-relaxed">
          냉동기 현장 기사를 위한<br />실무 가이드 앱
        </p>
      </div>

      {/* 기능 소개 */}
      <div className="w-full max-w-sm space-y-3 mb-10">
        {[
          { emoji: '🔍', title: '고장 진단', desc: '증상 키워드로 원인과 조치 즉시 확인' },
          { emoji: '❄️', title: '냉매 PT 차트', desc: '34종 냉매 압력-온도 정보 한눈에' },
          { emoji: '📋', title: '수리 이력 관리', desc: '고객별 수리 기록 오프라인 저장' },
          { emoji: '📝', title: '노하우 기록', desc: '현장 경험을 내 앱에 저장' },
        ].map(({ emoji, title, desc }) => (
          <div key={title} className="flex items-start gap-3 bg-gray-900 rounded-xl px-4 py-3">
            <span className="text-xl shrink-0">{emoji}</span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA 버튼 */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => navigate('/home')}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-sm font-semibold transition-colors"
        >
          앱 시작하기
        </button>
        <p className="text-xs text-gray-500 text-center">
          인터넷 없이도 사용 가능 · 무료 체험
        </p>
      </div>

    </div>
  )
}
