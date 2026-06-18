"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Minus, Plus, Snowflake, Flame, ShoppingBag, ArrowLeft } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { parseSize, parseTemperature, parseYesNo } from "@/lib/intent"
import { useKiosk, computeUnitPrice, type Temp, type Size } from "./store"
import { MenuIcon } from "./icon"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

type Phase = "temp" | "size" | "confirm"

export function ScreenOptions() {
  const { selectedItem, optionsReturnTo, voiceMode, speech, addToCart, go } = useKiosk()

  const [temperature, setTemperature] = useState<Temp | null>(null)
  const [size, setSize] = useState<Size | null>(null)
  const [quantity, setQuantity] = useState(1)

  const startedRef = useRef(false)
  const item = selectedItem

  const needsTemp = !!item && item.temperatures.length > 0
  const needsSize = !!item && item.hasSize

  useEffect(() => {
    if (!item) return

    setTemperature(item.temperatures.length === 0 ? "hot" : null)
    setSize(item.hasSize ? null : "small")
    setQuantity(1)
    startedRef.current = false
  }, [item])

  const tempReady = !needsTemp || temperature !== null
  const sizeReady = !needsSize || size !== null
  const ready = tempReady && sizeReady

  const unitPrice = item ? computeUnitPrice(item, size) : 0

  function currentPhase(): Phase {
    if (needsTemp && temperature === null) return "temp"
    if (needsSize && size === null) return "size"
    return "confirm"
  }

  function listenForPhase(phase: Phase) {
    speech.listen((text) => handleUtterance(text, phase))
  }

  function handleUtterance(text: string, phase: Phase) {
    if (phase === "temp") {
      const t = parseTemperature(text)

      if (t && item?.temperatures.includes(t)) {
        setTemperature(t)
        askSizeOrConfirm(t)
        return
      }

      speech
        .speak("따뜻한 것과 차가운 것 중에 무엇으로 드릴까요?")
        .then(() => listenForPhase("temp"))
      return
    }

    if (phase === "size") {
      const s = parseSize(text)

      if (s) {
        setSize(s)
        askConfirm(temperature, s)
        return
      }

      speech.speak("보통 크기와 큰 크기 중에 골라 주세요.").then(() => listenForPhase("size"))
      return
    }

    const yn = parseYesNo(text)

    if (yn === "yes") {
      commit()
      return
    }

    if (yn === "no") {
      speech.speak("알겠습니다. 다른 메뉴를 골라 주세요.").then(() => go(optionsReturnTo))
      return
    }

    speech
      .speak("이대로 담을까요? 네 또는 아니요로 말씀해 주세요.")
      .then(() => listenForPhase("confirm"))
  }

  function askSizeOrConfirm(t: Temp) {
    if (needsSize) {
      speech.speak("크기는 보통과 큰 것 중에 무엇으로 드릴까요?").then(() => listenForPhase("size"))
    } else {
      askConfirm(t, size)
    }
  }

  function askConfirm(t: Temp | null, s: Size | null) {
    const parts: string[] = []

    if (needsTemp && t) {
      parts.push(t === "ice" ? "차가운" : "따뜻한")
    }

    if (needsSize && s) {
      parts.push(s === "large" ? "큰 크기" : "보통 크기")
    }

    const desc = parts.length ? parts.join(" ") + " " : ""

    speech
      .speak(`${desc}${item?.name} 한 잔을 담을까요? 네 또는 아니요로 말씀해 주세요.`)
      .then(() => listenForPhase("confirm"))
  }

  useEffect(() => {
    if (!voiceMode || !item || startedRef.current) return

    startedRef.current = true

    const phase = currentPhase()

    if (phase === "temp") {
      speech
        .speak(`${item.name}를 고르셨어요. 따뜻한 것과 차가운 것 중에 무엇으로 드릴까요?`)
        .then(() => listenForPhase("temp"))
    } else if (phase === "size") {
      speech
        .speak(`${item.name}를 고르셨어요. 크기는 보통과 큰 것 중에 골라 주세요.`)
        .then(() => listenForPhase("size"))
    } else {
      askConfirm(temperature, size)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, item])

  function commit() {
    if (!item || !ready) return

    addToCart({
      item,
      temperature: needsTemp ? temperature : null,
      size: needsSize ? size : null,
      quantity,
      unitPrice,
    })

    speech.cancelAll()
    go("cart")
  }

  if (!item) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
        <TopBar title="옵션 고르기" />

        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <button
            type="button"
            onClick={() => go("browse")}
            className="rounded-[20px] bg-primary px-6 py-4 text-[20px] font-black text-primary-foreground"
          >
            메뉴 고르러 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
      <VoiceIndicator />
      <TopBar title="옵션 고르기" />

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <div className="mx-auto w-full max-w-3xl pb-4">
          <div className="mb-4 flex items-center gap-4 rounded-[22px] border-2 border-border bg-card p-4">
            <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-secondary">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <MenuIcon name={item.icon} className="h-12 w-12 text-secondary-foreground/70" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-[27px] font-black leading-tight text-card-foreground">
                {item.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-[14px] font-bold leading-snug text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>

          {needsTemp && (
            <Section step={1} label="온도를 골라 주세요">
              <div className="grid grid-cols-2 gap-3">
                {item.temperatures.includes("hot") && (
                  <OptionButton
                    active={temperature === "hot"}
                    onClick={() => setTemperature("hot")}
                    icon={<Flame className="h-8 w-8" aria-hidden="true" />}
                    label="따뜻하게"
                  />
                )}

                {item.temperatures.includes("ice") && (
                  <OptionButton
                    active={temperature === "ice"}
                    onClick={() => setTemperature("ice")}
                    icon={<Snowflake className="h-8 w-8" aria-hidden="true" />}
                    label="차갑게"
                  />
                )}
              </div>
            </Section>
          )}

          {needsSize && (
            <Section step={needsTemp ? 2 : 1} label="크기를 골라 주세요">
              <div className="grid grid-cols-2 gap-3">
                <OptionButton
                  active={size === "small"}
                  onClick={() => setSize("small")}
                  icon={<span className="text-[28px] font-black">S</span>}
                  label="보통"
                  sub={formatWon(item.price)}
                />

                <OptionButton
                  active={size === "large"}
                  onClick={() => setSize("large")}
                  icon={<span className="text-[32px] font-black">L</span>}
                  label="크게"
                  sub={`+ ${formatWon(500)}`}
                />
              </div>
            </Section>
          )}

          <Section step={(needsTemp ? 1 : 0) + (needsSize ? 1 : 0) + 1} label="몇 잔 드릴까요?">
            <div className="flex items-center justify-center gap-4 rounded-[22px] border-2 border-border bg-card py-4">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="수량 줄이기"
                className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-border bg-secondary text-secondary-foreground transition hover:bg-muted disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="h-7 w-7" aria-hidden="true" />
              </button>

              <span className="w-[64px] text-center text-[42px] font-black leading-none text-foreground">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="수량 늘리기"
                className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground transition hover:brightness-105"
              >
                <Plus className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>
          </Section>
        </div>
      </main>

      <div className="shrink-0 border-t-2 border-border bg-[#fffaf4] px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={() => go(optionsReturnTo)}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[16px] border-2 border-border bg-card px-4 text-[16px] font-black text-card-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            뒤로
          </button>

          <button
            type="button"
            onClick={commit}
            disabled={!ready}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[16px] bg-primary px-4 text-[16px] font-black text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-40"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {ready ? `${formatWon(unitPrice * quantity)} 담기` : "옵션 선택"}
          </button>
        </div>

        {!ready && (
          <p className="mt-2 text-center text-[13px] font-black text-muted-foreground">
            {needsTemp && temperature === null ? "온도를 먼저 골라 주세요" : "크기를 먼저 골라 주세요"}
          </p>
        )}
      </div>
    </div>
  )
}

function Section({
  step,
  label,
  children,
}: {
  step: number
  label: string
  children: ReactNode
}) {
  return (
    <section className="mb-4">
      <h3 className="mb-2 flex items-center gap-2 text-[20px] font-black text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[15px] font-black text-primary-foreground">
          {step}
        </span>
        {label}
      </h3>

      {children}
    </section>
  )
}

function OptionButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  sub?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[108px] flex-col items-center justify-center gap-2 rounded-[22px] border-[3px] px-3 py-4 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-ring ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-lg"
          : "border-border bg-card text-card-foreground hover:bg-secondary"
      }`}
    >
      {icon}

      <span className="text-[24px] font-black leading-tight">{label}</span>

      {sub && (
        <span className={`text-[13px] font-black ${active ? "opacity-90" : "text-muted-foreground"}`}>
          {sub}
        </span>
      )}
    </button>
  )
}