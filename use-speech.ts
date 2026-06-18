"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecognitionType = any

export interface UseSpeechResult {
  supported: boolean
  listening: boolean
  speaking: boolean
  transcript: string
  speak: (text: string) => Promise<void>
  listen: (onResult: (text: string) => void) => void
  stopListening: () => void
  stopSpeaking: () => void
  cancelAll: () => void
}

export function useSpeech(): UseSpeechResult {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")

  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const onResultRef = useRef<((text: string) => void) | null>(null)
  const koVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    const hasSynth = "speechSynthesis" in window

    console.log("🎤 SpeechRecognition 지원:", Boolean(SR))
    console.log("🔊 speechSynthesis 지원:", hasSynth)

    setSupported(Boolean(SR) && hasSynth)

    if (SR) {
      const recognition = new SR()

      recognition.lang = "ko-KR"
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        console.log("🎙️ 음성 인식 시작")
        setListening(true)
      }

      recognition.onresult = (event: any) => {
        const text = String(event.results?.[0]?.[0]?.transcript ?? "").trim()

        console.log("✅ 인식 결과:", text)

        setTranscript(text)

        if (text) {
          onResultRef.current?.(text)
        }
      }

      recognition.onend = () => {
        console.log("🛑 음성 인식 종료")
        setListening(false)
      }

      recognition.onerror = (event: any) => {
        console.dir("⚠️ 음성 인식 오류:", event?.error)
        setListening(false)
      }

      recognitionRef.current = recognition
    }

    if (hasSynth) {
      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        const ko = voices.filter((v) => v.lang === "ko-KR" || v.lang.startsWith("ko"))

        const preferred = [
          "yuna",
          "유나",
          "heami",
          "혜미",
          "seoyeon",
          "서연",
          "sora",
          "google 한국의",
          "google 한국",
          "nara",
          "female",
          "여성",
        ]

        const byPreference =
          ko.find((v) => preferred.some((p) => v.name.toLowerCase().includes(p))) || null

        koVoiceRef.current = byPreference || ko[0] || null
      }

      pickVoice()
      window.speechSynthesis.onvoiceschanged = pickVoice
    }

    return () => {
      try {
        recognitionRef.current?.abort?.()
        window.speechSynthesis?.cancel()
      } catch {
        // noop
      }
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return

    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve()
        return
      }

      window.speechSynthesis.cancel()

      const utter = new SpeechSynthesisUtterance(text)

      utter.lang = "ko-KR"

      if (koVoiceRef.current) {
        utter.voice = koVoiceRef.current
      }

      utter.rate = 0.92
      utter.pitch = 1.08
      utter.volume = 1

      let resolved = false

      const finish = () => {
        if (resolved) return
        resolved = true
        setSpeaking(false)
        console.log("🔇 안내 종료")
        resolve()
      }

      utter.onstart = () => {
        console.log("🔊 안내 시작:", text)
        setSpeaking(true)
      }

      utter.onend = finish

      utter.onerror = (event: any) => {
        console.dir("⚠️ 음성 안내 오류:", event?.error)
        finish()
      }

      window.speechSynthesis.speak(utter)
    })
  }, [])

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // noop
    }

    setListening(false)
  }, [])

  const listen = useCallback((onResult: (text: string) => void) => {
    const recognition = recognitionRef.current

    console.log("🎧 listen 호출")
    console.log("recognition 있음:", Boolean(recognition))

    if (!recognition) return

    onResultRef.current = onResult
    setTranscript("")

    try {
      window.speechSynthesis?.cancel()
      recognition.start()
      setListening(true)
      console.log("🎙️ recognition.start() 실행")
    } catch (error) {
      console.dir("음성 인식 start 실패, 재시도:", error)

      try {
        recognition.stop()

        setTimeout(() => {
          try {
            recognition.start()
            setListening(true)
            console.log("🎙️ recognition.start() 재실행")
          } catch (retryError) {
            console.dir("음성 인식 재시도 실패:", retryError)
          }
        }, 250)
      } catch {
        // noop
      }
    }
  }, [])

  const cancelAll = useCallback(() => {
    stopListening()
    stopSpeaking()
  }, [stopListening, stopSpeaking])

  return {
    supported,
    listening,
    speaking,
    transcript,
    speak,
    listen,
    stopListening,
    stopSpeaking,
    cancelAll,
  }
}