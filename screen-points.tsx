"use client"

import { useEffect, useRef, useState } from "react"
import { Delete, Gift, ArrowRight, X } from "lucide-react"
import { useKiosk } from "./store"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

const KO_DIGITS: Record<string, string> = {
  공: "0",
  영: "0",
  일: "1",
  이: "2",
  삼: "3",
  사: "4",
  오: "5",
  육: "6",
  칠: "7",
  팔: "8",
  구: "9",
}

function extractDigits(text: string): string {
  let out = ""

  for (const ch of text) {
    if (/[0-9]/.test(ch)) out += ch
    else if (KO_DIGITS[ch]) out += KO_DIGITS[ch]
  }

  return out
}

function formatPhone(d: string): string {
  const x = d.slice(0, 11)

  if (x.length <= 3) return x
  if (x.length <= 7) return `${x.slice(0, 3)}-${x.slice(3)}`
  return `${x.slice(0, 3)}-${x.slice(3, 7)}-${x.slice(7)}`
}

export function ScreenPoints() {
  const { cartTotal, setPhone, setPointsEarned, voiceMode, speech, go } = useKiosk()

  const [digits, setDigits] = useState("")
  const startedRef = useRef(false)

  const earn = Math.floor(cartTotal * 0.05)

  useEffect(() => {
    if (!voiceMode || startedRef.current) return

    startedRef.current = true

    speech
      .speak(
        "포인트를 적립하시겠어요? 적립하시려면 전화번호 열한 자리를 또박또박 말씀해 주세요. 적립하지 않으시려면, 안 할래요 라고 말씀해 주세요.",
      )
      .then(() => speech.listen(handleUtterance))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  function handleUtterance(text: string) {
    const t = text.replace(/\s+/g, "")

    if (
      ["안할래", "안할", "건너", "넘어", "필요없", "괜찮", "없어", "안해"].some((w) =>
        t.includes(w),
      )
    ) {
      skip()
      return
    }

    const d = extractDigits(text)

    if (d.length >= 10) {
      const phone = d.slice(0, 11)
      setDigits(phone)
      confirmEarn(phone)
      return
    }

    speech
      .speak(
        "전화번호를 다시 한 번 또박또박 말씀해 주세요. 예를 들어, 공일공 일이삼사 오육칠팔 처럼요.",
      )
      .then(() => speech.listen(handleUtterance))
  }

  function confirmEarn(phone: string) {
    setPhone(phone)
    setPointsEarned(earn)

    speech
      .speak(`${earn.toLocaleString("ko-KR")}점을 적립해 드릴게요. 이제 결제 방법을 골라 주세요.`)
      .then(() => go("payment"))
  }

  function press(d: string) {
    setDigits((prev) => (prev.length >= 11 ? prev : prev + d))
  }

  function backspace() {
    setDigits((prev) => prev.slice(0, -1))
  }

  function submit() {
    if (digits.length < 10) return

    setPhone(digits)
    setPointsEarned(earn)
    speech.cancelAll()
    go("payment")
  }

  function skip() {
    setPhone("")
    setPointsEarned(0)
    speech.cancelAll()
    go("payment")
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
      <VoiceIndicator />
      <TopBar title="포인트 적립" />

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <div className="mb-4 flex items-center gap-3 rounded-[24px] bg-secondary px-5 py-4">
            <Gift className="h-9 w-9 shrink-0 text-primary" aria-hidden="true" />

            <p className="break-keep text-[21px] font-black leading-snug text-secondary-foreground">
              전화번호를 누르시면
              <br />
              <span className="text-primary">{earn.toLocaleString("ko-KR")}점</span>을 적립해 드려요.
            </p>
          </div>

          <div className="mb-3 flex min-h-[68px] items-center justify-center rounded-[22px] border-2 border-border bg-card px-4">
            <span className="break-keep text-center text-[27px] font-black leading-tight tracking-tight text-foreground">
              {digits ? formatPhone(digits) : "전화번호를 눌러 주세요"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <PadButton key={n} onClick={() => press(n)}>
                {n}
              </PadButton>
            ))}

            <PadButton onClick={backspace} aria-label="지우기">
              <Delete className="mx-auto h-8 w-8" aria-hidden="true" />
            </PadButton>

            <PadButton onClick={() => press("0")}>0</PadButton>

            <PadButton onClick={() => setDigits("")} aria-label="모두 지우기">
              <X className="mx-auto h-8 w-8" aria-hidden="true" />
            </PadButton>
          </div>
        </div>
      </main>

      <div className="shrink-0 border-t-2 border-border bg-[#fffaf4] px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={digits.length < 10}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-primary px-5 text-[20px] font-black text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-40"
          >
            적립하고 결제하기
            <ArrowRight className="h-6 w-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={skip}
            className="flex h-[50px] w-full items-center justify-center rounded-[18px] border-2 border-border bg-card px-5 text-[19px] font-black text-card-foreground transition hover:bg-secondary"
          >
            적립 안 하고 결제하기
          </button>
        </div>
      </div>
    </div>
  )
}

function PadButton({
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  "aria-label"?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-[70px] items-center justify-center rounded-[18px] border-2 border-border bg-card text-[33px] font-black text-card-foreground transition hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring active:scale-95"
    >
      {children}
    </button>
  )
}