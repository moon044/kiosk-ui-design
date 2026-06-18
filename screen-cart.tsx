"use client"

import { useEffect, useRef } from "react"
import { Minus, Plus, Trash2, Plus as PlusIcon, ArrowRight } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { parseYesNo } from "@/lib/intent"
import { useKiosk } from "./store"
import { MenuIcon } from "./icon"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

export function ScreenCart() {
  const {
    cart,
    cartTotal,
    cartCount,
    changeQuantity,
    removeLine,
    voiceMode,
    speech,
    go,
  } = useKiosk()

  const startedRef = useRef(false)

  useEffect(() => {
    if (!voiceMode || startedRef.current) return

    startedRef.current = true

    const summary = cart.map((l) => `${l.item.name} ${l.quantity}잔`).join(", ")

    speech
      .speak(
        `장바구니에 ${summary}을 담았어요. 모두 ${cartTotal.toLocaleString(
          "ko-KR",
        )}원이에요. 이대로 주문할까요? 네 또는 아니요로 말씀해 주세요.`,
      )
      .then(() => speech.listen(handleUtterance))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  function handleUtterance(text: string) {
    const t = text.replace(/\s+/g, "")

    if (t.includes("더") || t.includes("추가") || t.includes("메뉴")) {
      go("browse")
      return
    }

    const yn = parseYesNo(text)

    if (yn === "yes") {
      go("points")
      return
    }

    if (yn === "no") {
      speech
        .speak("메뉴를 더 고르시려면 메뉴 더 담기를 눌러 주세요.")
        .then(() => speech.listen(handleUtterance))
      return
    }

    speech
      .speak("주문하시려면 네, 더 담으시려면 아니요라고 말씀해 주세요.")
      .then(() => speech.listen(handleUtterance))
  }

  if (cartCount === 0) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
        <TopBar title="담은 메뉴" />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
          <p className="text-[24px] font-black text-foreground">
            아직 담은 메뉴가 없어요.
          </p>

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
      <TopBar title="담은 메뉴" />

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <ul className="flex flex-col gap-4">
            {cart.map((line) => (
              <li
                key={line.lineId}
                className="rounded-[24px] border-2 border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-secondary">
                    {line.item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.item.image}
                        alt={line.item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <MenuIcon
                        name={line.item.icon}
                        className="h-12 w-12 text-secondary-foreground/70"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-keep text-[23px] font-black leading-tight text-card-foreground">
                      {line.item.name}
                    </h3>

                    <p className="mt-1 break-keep text-[15px] font-bold leading-snug text-muted-foreground">
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
                    </p>

                    <p className="mt-1 text-[20px] font-black text-primary">
                      {formatWon(line.unitPrice * line.quantity)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.lineId, -1)}
                      aria-label={`${line.item.name} 수량 줄이기`}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-secondary text-secondary-foreground"
                    >
                      <Minus className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <span className="w-10 text-center text-[27px] font-black">
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => changeQuantity(line.lineId, 1)}
                      aria-label={`${line.item.name} 수량 늘리기`}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground"
                    >
                      <Plus className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.lineId)}
                    className="flex items-center gap-1 rounded-xl px-3 py-2 text-[16px] font-black text-danger hover:underline"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                    빼기
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => go("browse")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-border bg-card px-5 py-5 text-[22px] font-black text-card-foreground transition hover:bg-secondary"
          >
            <PlusIcon className="h-7 w-7 text-primary" aria-hidden="true" />
            메뉴 더 담기
          </button>
        </div>
      </main>

      <div className="shrink-0 border-t-2 border-border bg-[#fffaf4] px-4 py-3">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[19px] font-black text-foreground">
              전체 금액
            </span>
            <span className="text-[31px] font-black text-primary">
              {formatWon(cartTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => go("points")}
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] bg-primary px-5 text-[21px] font-black text-primary-foreground shadow-sm transition hover:brightness-105"
          >
            주문하기
            <ArrowRight className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}