"use client"

import { useEffect, useRef } from "react"
import {
  categories,
  getItemsByCategory,
  menuItems,
  type CategoryId,
  type MenuItem,
} from "@/lib/menu"
import { extractKeywords, matchCategory, matchMenu } from "@/lib/intent"
import { useKiosk } from "./store"
import { MenuIcon } from "./icon"
import { MenuCard } from "./menu-card"
import { TopBar } from "./top-bar"
import { CartBar } from "./cart-bar"
import { VoiceIndicator } from "./voice-indicator"

const CATEGORY_WORDS: Record<string, string[]> = {
  coffee: ["커피", "아메리카노", "라떼", "카페", "에스프레소"],
  tea: ["차", "티", "녹차", "홍차", "허브"],
  ade: ["에이드", "주스", "과일", "시원한거", "시원한"],
  dessert: ["디저트", "케이크", "쿠키", "빵", "달달한", "단거", "단"],
}

export function ScreenBrowse() {
  const {
    browseCategory,
    setBrowseCategory,
    beginOptions,
    voiceMode,
    speech,
    setRecommendations,
    go,
  } = useKiosk()

  const startedRef = useRef(false)
  const items = getItemsByCategory(browseCategory)

  function onSelect(item: MenuItem) {
    speech.cancelAll()
    beginOptions(item, "browse")
  }

  function handleUtterance(text: string) {
    console.log("🎙️ 메뉴 화면 음성:", text)

    const compact = text.replace(/\s+/g, "")

    /**
     * 1. 메뉴 이름을 직접 말한 경우
     * 예: "아메리카노", "초코라떼", "페퍼민트 차"
     */
    const direct = menuItems.find((item) =>
      compact.includes(item.name.replace(/\s+/g, "")),
    )

    if (direct) {
      onSelect(direct)
      return
    }

    /**
     * 2. intent 매칭으로 메뉴 찾기
     * 예: "차가운 커피", "달달한 거", "따뜻한 차"
     */
    const results = matchMenu(text, 2)

    if (results.length === 1) {
      onSelect(results[0].item)
      return
    }

    if (results.length > 1) {
      const heard = extractKeywords(text)

      setRecommendations(
        results.map((r) => r.item),
        heard,
      )

      speech.cancelAll()
      go("recommend")
      return
    }

    /**
     * 3. 카테고리 이동
     * 예: "커피 보여줘", "디저트", "차 메뉴"
     */
    const catByIntent = matchCategory(text)

    if (catByIntent) {
      setBrowseCategory(catByIntent)

      speech
        .speak(
          `${categoryName(
            catByIntent,
          )} 메뉴를 보여드릴게요. 원하는 메뉴를 말씀하시거나 눌러 주세요.`,
        )
        .then(() => speech.listen(handleUtterance))

      return
    }

    const catByWord = categories.find((category) =>
      CATEGORY_WORDS[category.id].some((word) => compact.includes(word)),
    )

    if (catByWord) {
      setBrowseCategory(catByWord.id)

      speech
        .speak(
          `${catByWord.name} 메뉴를 보여드릴게요. 원하는 메뉴를 말씀하시거나 눌러 주세요.`,
        )
        .then(() => speech.listen(handleUtterance))

      return
    }

    /**
     * 4. 처음으로 이동
     */
    if (["처음", "홈", "처음으로"].some((word) => compact.includes(word))) {
      speech.cancelAll()
      go("home")
      return
    }

    /**
     * 5. 못 알아들은 경우 다시 듣기
     */
    speech
      .speak(
        "원하는 메뉴 이름을 말씀하시거나, 커피, 차, 에이드, 디저트 중에서 말씀해 주세요.",
      )
      .then(() => speech.listen(handleUtterance))
  }

  useEffect(() => {
    if (!voiceMode || startedRef.current) return

    startedRef.current = true

    speech
      .speak("메뉴를 고르는 화면이에요. 원하는 메뉴 이름이나 종류를 말씀해 주세요.")
      .then(() => speech.listen(handleUtterance))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4]">
      <VoiceIndicator />
      <TopBar title="메뉴 고르기" />

      <nav
        aria-label="메뉴 종류"
        className="shrink-0 border-b border-border bg-[#fffaf4] px-3 py-3"
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => {
            const active = c.id === browseCategory

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setBrowseCategory(c.id)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-center transition focus:outline-none focus-visible:ring-4 focus-visible:ring-ring ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-card-foreground hover:bg-secondary"
                }`}
              >
                <MenuIcon name={c.icon} className="h-5 w-5" />

                <span className="whitespace-nowrap text-[15px] font-black leading-tight">
                  {c.name}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto bg-[#fffaf4] px-3 py-3">
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      </main>

      <CartBar />
    </div>
  )
}

function categoryName(id: CategoryId): string {
  return categories.find((c) => c.id === id)?.name ?? "해당"
}