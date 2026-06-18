"use client"

import { useEffect, useRef } from "react"
import { ArrowLeft } from "lucide-react"
import { useKiosk } from "./store"
import { MenuCard } from "./menu-card"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

export function ScreenRecommend() {
  const {
    recommendations,
    heardKeywords,
    beginOptions,
    voiceMode,
    speech,
    go,
  } = useKiosk()

  const startedRef = useRef(false)

  function getSpokenIndex(text: string): number | null {
    const compact = text.replace(/\s+/g, "")

    const digitMatch = compact.match(/[1-9]/)
    if (digitMatch) return Number(digitMatch[0]) - 1

    if (
      compact.includes("첫번째") ||
      compact.includes("첫째") ||
      compact.includes("일번") ||
      compact.includes("하나") ||
      compact.includes("첫")
    ) {
      return 0
    }

    if (
      compact.includes("두번째") ||
      compact.includes("둘째") ||
      compact.includes("이번") ||
      compact.includes("둘")
    ) {
      return 1
    }

    if (
      compact.includes("세번째") ||
      compact.includes("셋째") ||
      compact.includes("삼번") ||
      compact.includes("셋")
    ) {
      return 2
    }

    if (
      compact.includes("네번째") ||
      compact.includes("넷째") ||
      compact.includes("사번") ||
      compact.includes("넷")
    ) {
      return 3
    }

    return null
  }

  function handleUtterance(text: string) {
    console.log("🎙️ 추천 화면 음성:", text)

    const compact = text.replace(/\s+/g, "")

    const found = recommendations.find((item) =>
      compact.includes(item.name.replace(/\s+/g, "")),
    )

    if (found) {
      speech.cancelAll()
      beginOptions(found, "recommend")
      return
    }

    const index = getSpokenIndex(text)

    if (index !== null) {
      const item = recommendations[index]

      if (item) {
        speech.cancelAll()
        beginOptions(item, "recommend")
        return
      }
    }

    if (
      compact.includes("뒤로") ||
      compact.includes("이전") ||
      compact.includes("메뉴") ||
      compact.includes("돌아가")
    ) {
      speech.cancelAll()
      go("browse")
      return
    }

    speech
      .speak("원하는 메뉴 이름을 말씀하시거나, 첫 번째, 두 번째처럼 말씀해 주세요.")
      .then(() => speech.listen(handleUtterance))
  }

  useEffect(() => {
    if (!voiceMode) {
      startedRef.current = false
      return
    }

    if (startedRef.current) return

    startedRef.current = true

    if (recommendations.length === 0) {
      speech
        .speak("추천된 메뉴가 없어요. 메뉴 화면으로 돌아갈게요.")
        .then(() => go("browse"))
      return
    }

    const names = recommendations.map((item, index) => {
      return `${index + 1}번 ${item.name}`
    })

    speech
      .speak(
        `찾은 메뉴는 ${names.join(
          ", ",
        )}입니다. 원하는 메뉴 이름이나 번호를 말씀해 주세요.`,
      )
      .then(() => speech.listen(handleUtterance))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, recommendations.length])

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
      <VoiceIndicator />
      <TopBar title="찾은 메뉴" />

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-4 rounded-[22px] bg-secondary px-4 py-4">
          <p className="break-keep text-[20px] font-black leading-snug text-secondary-foreground">
            {heardKeywords.length > 0 ? (
              <>
                말씀하신{" "}
                <span className="text-primary">
                  {heardKeywords.join(", ")}
                </span>
                에 맞는 메뉴를 찾았어요.
              </>
            ) : (
              <>이런 메뉴는 어떠세요?</>
            )}
          </p>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recommendations.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onSelect={() => {
                  speech.cancelAll()
                  beginOptions(item, "recommend")
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
            <p className="text-[22px] font-black text-foreground">
              찾은 메뉴가 없어요.
            </p>

            <button
              type="button"
              onClick={() => go("browse")}
              className="rounded-[18px] bg-primary px-5 py-4 text-[19px] font-black text-primary-foreground"
            >
              메뉴 다시 보기
            </button>
          </div>
        )}
      </main>

      <div className="shrink-0 border-t-2 border-border bg-[#fffaf4] px-4 py-3">
        <button
          type="button"
          onClick={() => {
            speech.cancelAll()
            go("browse")
          }}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] border-2 border-border bg-card text-[18px] font-black text-card-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          메뉴로 돌아가기
        </button>
      </div>
    </div>
  )
}