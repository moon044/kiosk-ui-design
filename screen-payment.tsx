"use client"

import { useEffect, useRef } from "react"
import { CreditCard, Smartphone, Gift } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { useKiosk, type PaymentMethod } from "./store"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

const METHODS: {
  id: PaymentMethod
  label: string
  sub: string
  icon: React.ReactNode
  keywords: string[]
}[] = [
  {
    id: "card",
    label: "카드",
    sub: "신용 · 체크카드",
    icon: <CreditCard className="h-10 w-10" aria-hidden="true" />,
    keywords: ["카드", "신용", "체크"],
  },
  {
    id: "mobile",
    label: "휴대폰 간편결제",
    sub: "삼성페이 · 카카오페이",
    icon: <Smartphone className="h-10 w-10" aria-hidden="true" />,
    keywords: ["휴대폰", "폰", "간편", "페이", "카카오", "삼성"],
  },
  {
    id: "gift",
    label: "상품권",
    sub: "기프티콘 · 상품권",
    icon: <Gift className="h-10 w-10" aria-hidden="true" />,
    keywords: ["상품권", "기프티콘", "쿠폰"],
  },
]

export function ScreenPayment() {
  const { cartTotal, setPayment, voiceMode, speech, go } = useKiosk()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!voiceMode || startedRef.current) return

    startedRef.current = true

    speech
      .speak("결제 방법을 골라 주세요. 카드, 휴대폰 간편결제, 상품권 중에서 말씀해 주세요.")
      .then(() => speech.listen(handleUtterance))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  function handleUtterance(text: string) {
    const t = text.replace(/\s+/g, "")
    const found = METHODS.find((m) => m.keywords.some((k) => t.includes(k)))

    if (found) {
      choose(found.id)
      return
    }

    speech
      .speak("카드, 휴대폰 간편결제, 상품권 중에서 골라 주세요.")
      .then(() => speech.listen(handleUtterance))
  }

  function choose(id: PaymentMethod) {
    setPayment(id)
    speech.cancelAll()
    go("confirm")
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
      <VoiceIndicator />
      <TopBar title="결제 방법" />

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-4 flex items-center justify-between rounded-[22px] bg-secondary px-5 py-4">
            <span className="text-[22px] font-black text-secondary-foreground">
              결제할 금액
            </span>
            <span className="text-[36px] font-black leading-none text-primary">
              {formatWon(cartTotal)}
            </span>
          </div>

          <h2 className="mb-3 break-keep text-[31px] font-black leading-tight text-foreground">
            어떻게 결제하시겠어요?
          </h2>

          <div className="flex flex-col gap-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => choose(m.id)}
                className="flex min-h-[116px] items-center gap-4 rounded-[24px] border-[3px] border-border bg-card px-5 py-4 text-left transition hover:border-primary hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.99]"
              >
                <span className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                  {m.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block break-keep text-[29px] font-black leading-tight text-card-foreground">
                    {m.label}
                  </span>
                  <span className="mt-1 block break-keep text-[18px] font-bold leading-tight text-muted-foreground">
                    {m.sub}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}