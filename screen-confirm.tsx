"use client"

import { useEffect, useRef } from "react"
import { CheckCircle2, CreditCard, Smartphone, Gift, ArrowLeft } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { parseYesNo } from "@/lib/intent"
import { useKiosk, type PaymentMethod } from "./store"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

const PAY_LABEL: Record<PaymentMethod, string> = {
  card: "카드",
  mobile: "휴대폰 간편결제",
  gift: "상품권",
}

const PAY_ICON: Record<PaymentMethod, React.ReactNode> = {
  card: <CreditCard className="h-6 w-6" aria-hidden="true" />,
  mobile: <Smartphone className="h-6 w-6" aria-hidden="true" />,
  gift: <Gift className="h-6 w-6" aria-hidden="true" />,
}

export function ScreenConfirm() {
  const {
    cart,
    cartTotal,
    payment,
    pointsEarned,
    phone,
    voiceMode,
    speech,
    go,
  } = useKiosk()

  const startedRef = useRef(false)

  useEffect(() => {
    if (!voiceMode || startedRef.current) return

    startedRef.current = true

    const method = payment ? PAY_LABEL[payment] : "선택한 방법"

    speech
      .speak(
        `${method}으로 ${cartTotal.toLocaleString(
          "ko-KR",
        )}원을 결제할게요. 결제하시려면 네, 다시 고르시려면 아니요라고 말씀해 주세요.`,
      )
      .then(() => speech.listen(handleUtterance))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  function handleUtterance(text: string) {
    const yn = parseYesNo(text)

    if (yn === "yes") {
      pay()
      return
    }

    if (yn === "no") {
      speech.cancelAll()
      go("payment")
      return
    }

    speech
      .speak("결제하시려면 네, 다시 고르시려면 아니요라고 말씀해 주세요.")
      .then(() => speech.listen(handleUtterance))
  }

  function pay() {
    speech.cancelAll()
    go("done")
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
      <VoiceIndicator />
      <TopBar title="주문 확인" />

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="mb-4 break-keep text-[30px] font-black leading-tight text-foreground">
            주문 내역을 확인해 주세요
          </h2>

          <ul className="flex flex-col gap-3">
            {cart.map((line) => (
              <li
                key={line.lineId}
                className="flex items-center justify-between gap-3 rounded-[20px] border-2 border-border bg-card px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-keep text-[22px] font-black leading-tight text-card-foreground">
                    {line.item.name}{" "}
                    <span className="text-primary">×{line.quantity}</span>
                  </span>

                  <span className="mt-1 block break-keep text-[15px] font-bold leading-tight text-muted-foreground">
                    {[
                      line.temperature
                        ? line.temperature === "ice"
                          ? "차갑게"
                          : "따뜻하게"
                        : null,
                      line.size
                        ? line.size === "large"
                          ? "큰 크기"
                          : "보통 크기"
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "기본"}
                  </span>
                </span>

                <span className="shrink-0 text-[21px] font-black text-foreground">
                  {formatWon(line.unitPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-[24px] bg-secondary px-5 py-4">
            <div className="flex items-center justify-between gap-3 text-[18px] font-black text-secondary-foreground">
              <span className="flex items-center gap-2">
                {payment ? PAY_ICON[payment] : null}
                결제 방법
              </span>

              <span>{payment ? PAY_LABEL[payment] : "-"}</span>
            </div>

            {pointsEarned > 0 && (
              <div className="mt-3 flex items-center justify-between gap-3 text-[17px] font-black text-secondary-foreground">
                <span className="flex items-center gap-2">
                  <Gift className="h-6 w-6" aria-hidden="true" />
                  포인트 적립
                </span>

                <span className="text-right">
                  {phone ? formatPhoneShort(phone) + " · " : ""}
                  {pointsEarned.toLocaleString("ko-KR")}점
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t-2 border-border pt-3">
              <span className="text-[21px] font-black text-foreground">
                전체 금액
              </span>

              <span className="text-[36px] font-black leading-none text-primary">
                {formatWon(cartTotal)}
              </span>
            </div>
          </div>
        </div>
      </main>

      <div className="shrink-0 border-t-2 border-border bg-[#fffaf4] px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => go("payment")}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[16px] border-2 border-border bg-card px-5 text-[18px] font-black text-card-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            뒤로
          </button>

          <button
            type="button"
            onClick={pay}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[16px] bg-primary px-4 text-[18px] font-black text-primary-foreground shadow-sm transition hover:brightness-105"
          >
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            {formatWon(cartTotal)} 결제하기
          </button>
        </div>
      </div>
    </div>
  )
}

function formatPhoneShort(d: string): string {
  if (d.length < 4) return d
  return `***-****-${d.slice(-4)}`
}