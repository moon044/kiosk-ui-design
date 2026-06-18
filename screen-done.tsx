"use client"

import { useEffect, useMemo, useRef } from "react"
import { Check, Receipt } from "lucide-react"
import { useKiosk } from "./store"
import { TopBar } from "./top-bar"

export function ScreenDone() {
  const { reset, voiceMode, speech } = useKiosk()
  const startedRef = useRef(false)

  const orderNo = useMemo(() => {
    return Math.floor(100 + Math.random() * 900)
  }, [])

  useEffect(() => {
    if (!voiceMode || startedRef.current) return

    startedRef.current = true

    speech.speak(`주문이 완료되었어요. 주문 번호는 ${orderNo}번입니다.`)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
      <TopBar title="" />

      <main className="flex min-h-0 flex-1 flex-col items-center px-4 py-5">
        <div className="mt-6 flex h-[130px] w-[130px] shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[8px] border-white">
            <Check className="h-11 w-11" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mt-9 break-keep text-center text-[52px] font-black leading-[1.13] tracking-tight text-foreground">
          주문이 완료
          <br />
          되었어요!
        </h1>

        <div className="mt-7 w-full max-w-[420px] rounded-[28px] border-[3px] border-border bg-card px-6 py-5 text-center">
          <p className="flex items-center justify-center gap-3 text-[26px] font-black text-muted-foreground">
            <Receipt className="h-8 w-8" aria-hidden="true" />
            주문 번호
          </p>

          <p className="mt-2 text-[76px] font-black leading-none text-primary">
            {orderNo}
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-6 flex h-[56px] w-full max-w-[420px] items-center justify-center rounded-[20px] bg-primary px-6 text-[22px] font-black text-primary-foreground shadow-sm transition hover:brightness-105"
        >
          처음으로
        </button>
      </main>
    </div>
  )
}