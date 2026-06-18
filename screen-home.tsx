"use client"

import { useState } from "react"
import { Mic, Hand } from "lucide-react"
import { extractKeywords, matchCategory, matchMenu } from "@/lib/intent"
import { useKiosk } from "./store"

const GREETING =
  "안녕하세요. 무엇을 드시고 싶으세요? 편하게 말씀해 주세요. 제가 알아듣고 찾아 드릴게요."

export function ScreenHome() {
  const { speech, setVoiceMode, setRecommendations, setBrowseCategory, go } = useKiosk()
  const [error, setError] = useState("")
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "speaking" | "listening">("idle")

  function safeListen() {
    console.log("🎧 홈 화면 듣기 시작 시도")

    setVoiceStatus("listening")

    setTimeout(() => {
      speech.listen(handleUtterance)
    }, 250)
  }

  function speakThenListen(message: string) {
    setVoiceStatus("speaking")

    let listened = false

    const startListeningOnce = () => {
      if (listened) return
      listened = true
      safeListen()
    }

    /**
     * 원래 정상 흐름:
     * speak가 끝나면 listen 시작
     */
    speech.speak(message).finally(() => {
      console.log("🔊 안내 종료 또는 실패 → 듣기 시작")
      startListeningOnce()
    })

    /**
     * 보험 장치:
     * 브라우저에서 speechSynthesis onend가 안 불리면
     * listen이 영원히 시작되지 않으므로 일정 시간 뒤 강제로 시작
     */
    setTimeout(() => {
      console.log("⏱️ 안내 종료 이벤트 지연 → 듣기 강제 시작")
      startListeningOnce()
    }, 6500)
  }

  function handleUtterance(text: string) {
  console.log("🎙️ 인식된 음성:", text)

  setVoiceStatus("idle")

  const compact = text.replace(/\s+/g, "")
  const heard = extractKeywords(text)

  let results = matchMenu(text, 2)

  console.log("🔑 키워드:", heard)
  console.log("🍽️ 1차 매칭 결과:", results)

  // 직접 주문으로 가는 말
  if (
    compact.includes("직접") ||
    compact.includes("화면") ||
    compact.includes("눌러") ||
    compact.includes("메뉴보기")
  ) {
    speech.cancelAll()
    setVoiceMode(false)
    go("browse")
    return
  }

  // 1차 매칭 실패 시 발표용 fallback
  if (results.length === 0) {
    if (
      compact.includes("초코") ||
      compact.includes("쵸코") ||
      compact.includes("초콜릿") ||
      compact.includes("달달") ||
      compact.includes("달콤") ||
      compact.includes("단거") ||
      compact.includes("단것")
    ) {
      results = matchMenu("초코", 2)
    } else if (
      compact.includes("커피") ||
      compact.includes("아메리카노")
    ) {
      results = matchMenu("아메리카노", 2)
    } else if (
      compact.includes("라떼") ||
      compact.includes("우유")
    ) {
      results = matchMenu("라떼", 2)
    } else if (
      compact.includes("시원") ||
      compact.includes("차가운") ||
      compact.includes("아이스")
    ) {
      results = matchMenu("아이스", 2)
    } else if (
      compact.includes("따뜻") ||
      compact.includes("뜨거운") ||
      compact.includes("핫")
    ) {
      results = matchMenu("따뜻", 2)
    } else if (
      compact.includes("과일") ||
      compact.includes("주스") ||
      compact.includes("에이드")
    ) {
      results = matchMenu("에이드", 2)
    }
  }

  console.log("🍽️ 최종 매칭 결과:", results)

  if (results.length > 0) {
    setRecommendations(
      results.map((r) => r.item),
      heard.length > 0 ? heard : [text],
    )

    speech.cancelAll()
    go("recommend")
    return
  }

  const cat = matchCategory(text)
  console.log("📂 카테고리 매칭:", cat)

  if (cat) {
    setBrowseCategory(cat)
    speech.cancelAll()
    go("browse")
    return
  }

  speakThenListen(
    "죄송해요. 잘 못 들었어요. 드시고 싶은 맛이나 종류를 다시 한 번 말씀해 주세요.",
  )
}
  function startVoice() {
    console.log("🎤 음성 주문하기 버튼 클릭")

    if (!speech.supported) {
      console.warn("❌ 음성 인식 미지원")
      setError("이 기기에서는 음성 인식을 사용할 수 없어요. Chrome 또는 Edge에서 마이크 권한을 허용해 주세요.")
      return
    }

    setError("")
    setVoiceMode(true)
    speakThenListen(GREETING)
  }

  function browse() {
    speech.cancelAll()
    setVoiceMode(false)
    go("browse")
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffaf4] px-6 pt-6 pb-4">
      <section className="shrink-0 text-center">
        <h1 className="text-[33px] font-black leading-[1.12] tracking-tight text-foreground">
          말로 주문하는
          <br />
          키오스크
        </h1>

        <p className="mt-3 text-[17px] font-bold leading-[1.35] text-muted-foreground">
          메뉴 이름을 몰라도 괜찮아요.
          <br />
          말로 설명하면 찾아드릴게요.
        </p>
      </section>

      <section className="mt-5 shrink-0 space-y-3">
        <button
          type="button"
          onClick={startVoice}
          className="animate-pulse-ring flex w-full items-center justify-center gap-4 rounded-[24px] bg-primary px-5 py-5 text-primary-foreground shadow-xl transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
            <Mic className="h-8 w-8" aria-hidden="true" />
          </span>

          <span className="flex flex-col items-start">
            <span className="text-[25px] font-black leading-tight">
              음성 주문하기
            </span>
            <span className="mt-1 text-[14px] font-bold opacity-90">
              {voiceStatus === "speaking"
                ? "안내 중이에요"
                : voiceStatus === "listening"
                  ? "지금 말씀해 주세요"
                  : "눌러서 말씀하세요"}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={browse}
          className="flex w-full items-center justify-center gap-4 rounded-[22px] border-[3px] border-primary bg-card px-5 py-4 text-card-foreground shadow-sm transition hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Hand className="h-7 w-7 text-primary" aria-hidden="true" />
          </span>

          <span className="flex flex-col items-start">
            <span className="text-[24px] font-black leading-tight text-primary">
              직접 주문하기
            </span>
            <span className="mt-1 text-[14px] font-bold text-muted-foreground">
              화면을 눌러주세요
            </span>
          </span>
        </button>
      </section>

      <section className="mt-4 shrink-0 text-center">
        <p className="text-[14px] font-black text-muted-foreground">
          이렇게 말씀하셔도 돼요
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {["시원한 거", "따뜻한 거", "단 거", "커피", "초코", "과일"].map((w) => (
            <span
              key={w}
              className="rounded-full bg-pink px-2.5 py-1 text-[12px] font-black text-pink-foreground"
            >
              {`"${w}"`}
            </span>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="mt-2 shrink-0 rounded-xl bg-muted px-3 py-2 text-center text-[13px] font-bold text-danger"
        >
          {error}
        </p>
      )}

      {voiceStatus === "listening" && !error && (
        <p className="mt-3 shrink-0 rounded-xl bg-secondary px-3 py-2 text-center text-[14px] font-black text-secondary-foreground">
          지금 말씀해 주세요. 예: “커피”, “초코”, “시원한 거”
        </p>
      )}

      <p className="mt-4 shrink-0 text-center text-[13px] font-black text-muted-foreground">
        주문은 천천히 하셔도 괜찮습니다
      </p>
    </div>
  )
}