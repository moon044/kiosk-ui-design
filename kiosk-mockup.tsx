import type { ReactNode } from "react"

export function KioskMockup({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-neutral-950 flex items-center justify-center px-4 py-6 select-none overflow-y-auto">
      <section className="relative w-full max-w-[430px] min-h-[880px] bg-white rounded-[34px] shadow-[0_45px_110px_rgba(0,0,0,0.8)] border-[4px] border-neutral-200 overflow-hidden flex flex-col">
        
        {/* 얇은 상단 기기 헤드 */}
        <div className="h-10 bg-white flex items-center justify-center border-b border-neutral-100">
          <div className="w-16 h-1.5 rounded-full bg-neutral-200 shadow-inner" />
        </div>

        {/* 실제 키오스크 화면 */}
    <div className="px-3 pt-3 flex-1 min-h-0">
            <div className="h-[720px] bg-white rounded-[26px] border-[3px] border-neutral-900 shadow-inner overflow-hidden flex flex-col">
            
            {/* 화면 상단 로고 */}
            <div className="bg-white px-4 pt-4 pb-3 border-b border-neutral-100 shrink-0">
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src="/malhaeduo-logo.png"
                    alt="말해듀오 로고"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                    말해듀오
                  </h1>
                  <p className="text-[11px] font-bold text-neutral-500 mt-0.5">
                    쉬운 말로 함께하는 AI 키오스크 안내
                  </p>
                </div>
              </div>
            </div>

            {/* 기존 앱 화면 들어가는 곳 */}
           <div className="flex-1 min-h-0 overflow-hidden bg-[#fffaf4] [&>*]:h-full">
          {children}
        </div>
          </div>
        </div>

        {/* 하단 결제/하드웨어 영역 */}
        <div className="px-3 pt-3 pb-4 bg-white shrink-0">
          <div className="h-24 bg-neutral-50 rounded-[22px] border border-neutral-200 shadow-inner px-5 flex items-center justify-between">
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-dashed border-neutral-300 rounded-md flex items-center justify-center">
                  <div className="w-5 h-1 bg-red-500 rounded-full" />
                </div>
              </div>
              <span className="text-[8px] text-neutral-400 font-black">QR</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="grid grid-cols-3 gap-1 bg-neutral-200 p-1.5 rounded-lg shadow-inner">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded bg-white shadow-sm border border-neutral-100"
                  />
                ))}
              </div>
              <span className="text-[8px] text-neutral-400 font-black">
                BUTTON
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-[72px] h-10 rounded-xl bg-neutral-900 shadow-md flex flex-col justify-center px-2">
                <div className="w-full h-1.5 bg-emerald-400 rounded-full" />
                <div className="w-9 h-1 bg-neutral-700 rounded-full mt-1.5" />
              </div>
              <span className="text-[8px] text-neutral-400 font-black">
                CARD
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 bg-neutral-200 border-t border-neutral-300 shrink-0" />
      </section>
    </main>
  )
}