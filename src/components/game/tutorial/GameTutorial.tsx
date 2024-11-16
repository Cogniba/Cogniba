"use client";

import Game from "@/components/game/Game";
import GameTutorialSteps, {
  type StepType,
} from "@/components/game/tutorial/GameTutorialSteps";
import sleep from "@/lib/sleep";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  DELAY_BEFORE_START,
  HIDDEN_SQUARE_DURATION,
  VISIBLE_SQUARE_DURATION,
} from "@/config/game";
import useGameLogic from "@/hooks/useGameLogic";
import { Strong } from "@/components/ui/Strong";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const steps = [
  {
    title: (
      <>
        Welcome to <Strong variant="primary">Cogniba</Strong>!
      </>
    ),
    content: (
      <>
        In this quick tutorial you will learn{" "}
        <Strong>how to play the game</Strong>.
      </>
    ),
    target: "body",
    placement: "center",
    hideBackButton: true,
  },
  {
    title: <>3 important things</>,
    content: (
      <>
        There&apos;s <Strong>3 important things</Strong> you need to consider
        when playing the game: <Strong>the level</Strong>,{" "}
        <Strong>the board</Strong>, and <Strong>the button</Strong>.
      </>
    ),
    target: "body",
    placement: "center",
  },
  {
    title: <>The level</>,
    content: (
      <>
        This display shows <Strong>what level you&apos;re on</Strong>. The{" "}
        <Strong>higher</Strong> the level, the <Strong>harder</Strong> the game
        gets.
      </>
    ),
    target: "#game-level-display",
    placement: "bottom",
    elementClickable: false,
  },
  {
    title: <>The board</>,
    content: (
      <>
        <Strong>The board</Strong> is where you have to <Strong>focus</Strong>{" "}
        when playing. Squares <Strong>appear</Strong> every few seconds on{" "}
        <Strong>the board</Strong>.
      </>
    ),
    target: "#game-board",
    placement: "center-top",
  },
  {
    title: <>The button</>,
    content: (
      <>
        You will have to <Strong>press the button</Strong> when playing the
        game. You can either <Strong>click it</Strong> or{" "}
        <Strong>press the space bar</Strong>.
      </>
    ),
    target: "#game-button",
    placement: "top",
    elementClickable: true,
  },
  {
    title: <>How to play</>,
    content: (
      <>
        You are on <Strong variant="primary">level 1</Strong>, so you have to{" "}
        <Strong>press the button</Strong> when the square appears{" "}
        <Strong>in the same spot as</Strong>{" "}
        <Strong variant="primary">1 step</Strong> <Strong>before</Strong>. In
        other words, <Strong>press the button</Strong> when the square appears{" "}
        <Strong>two consecutive times</Strong> on the same spot.
      </>
    ),
    target: "#game-board",
    placement: "center-top",
  },
  {
    title: <>Let&apos;s test your skills!</>,
    content: (
      <>
        Let&apos;s <Strong>play a game</Strong> to see if you understood the
        instructions. We will <Strong>help you</Strong> along the way.
      </>
    ),
    target: "body",
    placement: "center",
    primaryButtonText: "Play",
  },
  {
    title: <>Press the button</>,
    content: (
      <>
        The square appeared <Strong>two consecutive times</Strong> on the{" "}
        <Strong>same spot</Strong> - <Strong>Press the button</Strong>.{" "}
      </>
    ),
    target: "#game-button",
    placement: "top",
    elementClickable: true,
    hidePrimaryButton: true,
    hideBackButton: true,
  },
  {
    title: <>Congratulations!</>,
    content: (
      <>
        You beat <Strong variant="primary">level 1</Strong>, you will now{" "}
        <Strong>advance</Strong> to <Strong variant="primary">level 2</Strong>!
      </>
    ),
    target: "body",
    placement: "center",
    hideBackButton: true,
  },
  {
    title: (
      <>
        How to play <Strong variant="primary">level 2</Strong>
      </>
    ),
    content: (
      <>
        You are now on <Strong variant="primary">level 2</Strong>, so you will
        have to <Strong>press the button</Strong> when the square appears{" "}
        <Strong>in the same spot as</Strong>{" "}
        <Strong variant="primary">2 steps</Strong> <Strong>before</Strong>.
      </>
    ),
    target: "#game-board",
    placement: "center-top",
  },
  {
    title: <>All you!</>,
    content: (
      <>
        We will <Strong>no longer help you</Strong>, but you will receive{" "}
        <Strong>feedback</Strong> while playing. <br />
        <br />
        <ul className="space-y-2.5">
          <li>
            If the screen turns <Strong variant="green">green</Strong>, it means
            you <Strong variant="green">pressed the button correctly</Strong>.
          </li>
          <li>
            If the screen turns <Strong variant="red">red</Strong>, it means you{" "}
            <Strong variant="red">
              you pressed the button, but you shouldn&apos;t have
            </Strong>
            .
          </li>
          <li>
            And if the screen turns <Strong variant="yellow">yellow</Strong>, it
            means you{" "}
            <Strong variant="yellow">
              should have pressed the button, but you didn&apos;t
            </Strong>
            .
          </li>
        </ul>
      </>
    ),
    target: "body",
    placement: "center",
    primaryButtonText: "Finish",
  },
] satisfies StepType[];

const boardStep = 3;
const buttonStep = 4;
const level1ExplanationStep = 5;
const level1PlayStep = 7;
const level1BeatStep = 8;
const level2ExplanationStep = 9;
const lastStep = 11;

interface GameTutorialProps {
  startingLevel: number;
  startingMaxLevel: number;
}

export default function GameTutorial({
  startingLevel,
  startingMaxLevel,
}: GameTutorialProps) {
  const [step, setStep] = useState(startingLevel === 1 ? 0 : level1BeatStep);
  const [isVisible, setIsVisible] = useState(true);
  const [tutorialSelectedSquare, setTutorialSelectedSquare] = useState<
    number | null
  >(null);
  const [isTutorialButtonPressed, setIsTutorialButtonPressed] = useState(false);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [isLoadingGame, setIsLoadingGame] = useState(false);

  const stepRef = useRef(startingLevel === 1 ? 0 : level1BeatStep);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { toast } = useToast();

  const updateUser = useCallback(
    async ({ hasFinishedTutorial }: { hasFinishedTutorial: boolean }) => {
      startTransition(async () => {
        const response = await fetch("/api/user/update-user", {
          method: "POST",
          body: JSON.stringify({ hasFinishedTutorial }),
        });

        if (!response.ok) {
          toast({ title: "Unexpected error occurred", variant: "destructive" });
        } else {
          router.refresh();
        }
      });
    },
    [toast, router],
  );

  const {
    feedback,
    isPlaying,
    startPlaying,
    correctHits,
    incorrectHits,
    missedHits,
    previousLevel,
    level,
    selectedSquare,
    isButtonPressed,
    handleButtonPress,
  } = useGameLogic({
    startingLevel,
    startingMaxLevel,
    showFeedbackEnabled: true,
    isTutorial: true,
    setShowTutorialHint: setIsVisible,
  });

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!isVisible) return;

    const boardStepAnimation = async () => {
      while (stepRef.current === boardStep) {
        setTutorialSelectedSquare(Math.floor(Math.random() * 8));
        await sleep(VISIBLE_SQUARE_DURATION);
        setTutorialSelectedSquare(null);
        await sleep(HIDDEN_SQUARE_DURATION);
      }
      setIsPlayingAnimation(false);
    };

    const buttonStepAnimation = async () => {
      while (stepRef.current === buttonStep) {
        setIsTutorialButtonPressed(true);
        await sleep(400);
        setIsTutorialButtonPressed(false);
        await sleep(2000);
      }
      setIsPlayingAnimation(false);
    };
    const level1ExplanationAnimation = async () => {
      while (stepRef.current === level1ExplanationStep) {
        setTutorialSelectedSquare(6);
        await sleep(VISIBLE_SQUARE_DURATION);
        setTutorialSelectedSquare(null);
        await sleep(HIDDEN_SQUARE_DURATION);
      }

      setIsPlayingAnimation(false);
    };

    const startTutorialGame = async () => {
      setIsVisible(false);
      await startPlaying();
      setStep((step) => step + 1);
      setIsVisible(true);
    };

    const handleStartGameDelay = async () => {
      setIsLoadingGame(true);
      await sleep(DELAY_BEFORE_START);
      setIsLoadingGame(false);
    };

    const level2ExplanationAnimation = async () => {
      let square = 5;

      while (stepRef.current === level2ExplanationStep) {
        setTutorialSelectedSquare(square);
        await sleep(VISIBLE_SQUARE_DURATION);
        setTutorialSelectedSquare(null);
        await sleep(HIDDEN_SQUARE_DURATION);
        square = square === 5 ? 6 : 5;
      }
      setIsPlayingAnimation(false);
    };

    const handleLastStep = async () => {
      await updateUser({ hasFinishedTutorial: true });
    };

    if (stepRef.current === boardStep) {
      if (!isPlayingAnimation) {
        setIsPlayingAnimation(true);
        boardStepAnimation();
      }
    } else if (stepRef.current === buttonStep) {
      if (!isPlayingAnimation) {
        setIsPlayingAnimation(true);
        buttonStepAnimation();
      }
    } else if (stepRef.current === level1ExplanationStep) {
      if (!isPlayingAnimation) {
        setIsPlayingAnimation(true);
        level1ExplanationAnimation();
      }
    } else if (stepRef.current === level1PlayStep) {
      if (!isPlaying) {
        handleStartGameDelay();
        startTutorialGame();
      }
    } else if (stepRef.current === level2ExplanationStep) {
      if (!isPlayingAnimation) {
        setIsPlayingAnimation(true);
        level2ExplanationAnimation();
      }
    } else if (stepRef.current === lastStep) {
      handleLastStep();
    }
  }, [
    isVisible,
    step,
    startPlaying,
    isPlaying,
    updateUser,
    isPlayingAnimation,
  ]);

  return (
    <>
      <GameTutorialSteps
        steps={steps}
        step={step - Number(isLoadingGame)}
        setStep={setStep}
        isVisible={isVisible}
        showSkipButton={true}
        isLoading={isPending}
      />
      <Game
        feedback={feedback}
        isStartScreenVisible={false}
        startPlaying={startPlaying}
        correctHits={correctHits}
        incorrectHits={incorrectHits}
        missedHits={missedHits}
        previousLevel={previousLevel}
        level={level}
        selectedSquare={
          tutorialSelectedSquare !== null
            ? tutorialSelectedSquare
            : selectedSquare
        }
        isButtonPressed={isButtonPressed || isTutorialButtonPressed}
        handleButtonPress={handleButtonPress}
        hasReachedNewLevel={false}
        setHasReachedNewLevel={() => {}}
      />
    </>
  );
}
