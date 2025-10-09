import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Image from 'next/image'

type GameState = 'intro' | 'question' | 'answer' | 'result'

export default function HomePage() {
  const [gameState, setGameState] = useState<GameState>('intro')
  const [slideIndex, setSlideIndex] = useState(1)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [correctCount, setCorrectCount] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [nineKeyCount, setNineKeyCount] = useState(0)
  const [lastNineKeyTime, setLastNineKeyTime] = useState(0)
  const [voicePlayed, setVoicePlayed] = useState(false)
  const bgmRef = useRef<HTMLAudioElement | null>(null)

  const resetGame = () => {
    setGameState('intro')
    setSlideIndex(1)
    setQuestionNumber(1)
    setCorrectCount(0)
    setShowAnswer(false)
    setIsCorrect(null)
    setNineKeyCount(0)
    setLastNineKeyTime(0)
    setVoicePlayed(false)
  }

  const playSound = (soundFile: string) => {
    const audio = new Audio(`/sound/${soundFile}`)
    audio.play().catch(err => console.error('Audio play failed:', err))
  }

  const startBGM = () => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio('/sound/bgm.mp3')
      bgmRef.current.loop = true
      bgmRef.current.volume = 0.3 // 小さめの音量に設定
    }
    bgmRef.current.play().catch(err => console.error('BGM play failed:', err))
  }

  const stopBGM = () => {
    if (bgmRef.current) {
      bgmRef.current.pause()
      bgmRef.current.currentTime = 0
    }
  }

  // gameStateに応じてBGMを制御
  useEffect(() => {
    if (gameState === 'result') {
      stopBGM()
      playSound('fanfare.mp3')
    } else {
      startBGM()
    }

    // クリーンアップ関数
    return () => {
      stopBGM()
    }
  }, [gameState])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.error('Fullscreen failed:', err))
        } else {
          document.exitFullscreen()
        }
      } else if (e.key === '9') {
        const currentTime = Date.now()
        if (currentTime - lastNineKeyTime < 500) {
          setNineKeyCount(prev => {
            const newCount = prev + 1
            if (newCount >= 5) {
              resetGame()
            }
            return newCount
          })
        } else {
          setNineKeyCount(1)
        }
        setLastNineKeyTime(currentTime)
      } else if (e.key === 'Enter') {
        handleEnterKey()
      } else if (gameState === 'question') {
        if ((e.key === 'a' || e.key === 'A') && !showAnswer) {
          playSound('push.mp3')
        } else if (e.key === '1') {
          if (isCorrect === false) {
            setCorrectCount(prev => prev + 1)
          } else if (isCorrect === null) {
            setCorrectCount(prev => prev + 1)
          }
          setIsCorrect(true)
          setShowAnswer(true)
          playSound('seikai.mp3')
        } else if (e.key === '3') {
          if (isCorrect === true) {
            setCorrectCount(prev => prev - 1)
          }
          setIsCorrect(false)
          setShowAnswer(true)
          playSound('huseikai.mp3')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, slideIndex, questionNumber, showAnswer, nineKeyCount, lastNineKeyTime])

  const handleEnterKey = () => {
    if (gameState === 'intro') {
      if (slideIndex < 3) {
        setSlideIndex(prev => prev + 1)
      } else {
        setGameState('question')
      }
    } else if (gameState === 'question' && showAnswer) {
      if (questionNumber < 10) {
        setQuestionNumber(prev => prev + 1)
        setShowAnswer(false)
        setIsCorrect(null)
      } else {
        setGameState('result')
      }
    } else if (gameState === 'result' && !voicePlayed) {
      playSound('voice.wav')
      setVoicePlayed(true)
    }
  }

  const getResultImage = () => {
    if (correctCount === 10) return '/images/clearA.png'
    if (correctCount >= 6) return '/images/clearB.png'
    return '/images/clearC.png'
  }

  return (
    <React.Fragment>
      <Head>
        <title>押神旅館</title>
      </Head>
      <div className="w-screen h-screen overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        {gameState === 'intro' && (
          <Image
            src={`/images/gametitle${slideIndex}.png`}
            alt={`Slide ${slideIndex}`}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        )}

        {gameState === 'question' && (
          <>
            <Image
              src={showAnswer ? `/images/kaitou${questionNumber}.png` : `/images/mondai${questionNumber}.png`}
              alt={showAnswer ? `Answer ${questionNumber}` : `Question ${questionNumber}`}
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
            {showAnswer && isCorrect !== null && (
              <div className="absolute top-[130px] right-[150px] w-32 h-32">
                <Image
                  src={isCorrect ? '/images/maru.png' : '/images/batsu.png'}
                  alt={isCorrect ? 'Correct' : 'Incorrect'}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )}
          </>
        )}

        {gameState === 'result' && (
          <>
            <Image
              src={getResultImage()}
              alt="Result"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
            {correctCount < 10 && (
              <div className="absolute top-[270px] left-[800px] text-center text-[150px] text-white" style={{ fontFamily: 'serif' }}>
                {correctCount}
              </div>
            )}
          </>
        )}
      </div>
    </React.Fragment>
  )
}
