"use client"

import { Ear, Volume2 } from "lucide-react"
import { useKiosk } from "./store"

/**
 * 키오스크 화면 안쪽에 표시되는 작은 음성 상태바
 */
export function VoiceIndicator() {
  const { voiceMode, speech, setVoiceMode } = useKiosk()

  if (!voiceMode) return null

  const listening = speech.listening
  const speaking = speech.speaking

  return (
    <div className="shrink-0 border-b-2 border-border bg-primary px-4 py-2 text-primary-foreground">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
            {listening ? (
              <div className="flex items-end gap-0.5" aria-hidden="true">
                <span
                  className="sound-bar h-4 w-1.5 rounded-full bg-primary-foreground"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="sound-bar h-5 w-1.5 rounded-full bg-primary-foreground"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="sound-bar h-3.5 w-1.5 rounded-full bg-primary-foreground"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            ) : speaking ? (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Ear className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          <p className="truncate text-[14px] font-black leading-tight">
            {listening
              ? "지금 말씀하세요"
              : speaking
                ? "안내 중이에요"
                : "음성 도우미 켜짐"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            speech.cancelAll()
            setVoiceMode(false)
          }}
          className="shrink-0 rounded-xl bg-primary-foreground/20 px-3 py-1.5 text-[13px] font-black hover:bg-primary-foreground/30"
        >
          끄기
        </button>
      </div>
    </div>
  )
}