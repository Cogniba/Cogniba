import sleep from "@/lib/sleep";
import generateGameSequence from "@/lib/game-logic/generateGameSequence";
import getCorrectHitSequence from "@/lib/game-logic/getCorrectHitSequence";
import waitFor from "@/lib/waitFor";
import getHitStatistics from "@/lib/game-logic/getHitStatistics";
import calculateNewLevel from "@/lib/game-logic/calculateNewLevel";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSidebar } from "@/context/SidebarContext";
import enterFullScreen from "@/lib/enterFullScreen";
import exitFullScreen from "@/lib/exitFullScreen";
import { useToast } from "./use-toast";
import {
  BASE_SEQUENCE_LENGTH,
  DELAY_BEFORE_START,
  HIDDEN_SQUARE_DURATION,
  VISIBLE_SQUARE_DURATION,
} from "@/config/game";

interface useGameLogicProps {
  startingLevel: number;
  startingMaxLevel: number;
  showFeedbackEnabled: boolean;
  isTutorial?: boolean;
  setShowTutorialHint?: Dispatch<SetStateAction<boolean>>;
}

export default function useGameLogic({
  startingLevel,
  startingMaxLevel,
  showFeedbackEnabled,
  isTutorial = false,
  setShowTutorialHint = () => {},
}: useGameLogicProps) {
  const [level, setLevel] = useState<number>(startingLevel);
  const [previousLevel, setPreviousLevel] = useState<number>(startingLevel);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [correctHits, setCorrectHits] = useState<number | null>(null);
  const [incorrectHits, setIncorrectHits] = useState<number | null>(null);
  const [missedHits, setMissedHits] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<
    "correct" | "incorrect" | "missed" | null
  >(null);
  const [hasReachedNewLevel, setHasReachedNewLevel] = useState(false);

  const { setIsVisible } = useSidebar();
  const { toast } = useToast();

  const gameSequence = useRef<number[]>([]);
  const correctHitSequence = useRef<boolean[]>([]);
  const playerHitSequence = useRef<boolean[]>([]);
  const hasPressedButton = useRef(true);
  const shouldPressButton = useRef(false);
  const maxLevel = useRef<number>(startingMaxLevel);

  const showFeedback = useCallback(
    async (feedback: "correct" | "incorrect" | "missed") => {
      if (!showFeedbackEnabled) return;
      setFeedback(feedback);
      if (feedback === "missed") {
        await sleep(200);
      } else {
        await sleep(400);
      }
      setFeedback(null);
    },
    [showFeedbackEnabled],
  );

  const handleShowFeedback = useCallback(async () => {
    if (correctHitSequence.current[playerHitSequence.current.length]) {
      await showFeedback("correct");
    } else {
      await showFeedback("incorrect");
    }
  }, [showFeedback]);

  const updateGameData = useCallback(async () => {
    const currentLevel = level;

    const { correctHits, incorrectHits, missedHits } = getHitStatistics(
      correctHitSequence.current,
      playerHitSequence.current,
    );
    setCorrectHits(correctHits);
    setIncorrectHits(incorrectHits);
    setMissedHits(missedHits);

    const newLevel = calculateNewLevel(
      correctHitSequence.current,
      playerHitSequence.current,
      currentLevel,
    );
    setPreviousLevel(currentLevel);
    setLevel(newLevel);

    if (newLevel > maxLevel.current) {
      setHasReachedNewLevel(true);
      maxLevel.current = newLevel;
    }

    const timePlayed =
      (BASE_SEQUENCE_LENGTH + level) *
        (VISIBLE_SQUARE_DURATION + HIDDEN_SQUARE_DURATION) +
      DELAY_BEFORE_START;

    const response = await fetch("/api/game/insert-game", {
      method: "POST",
      body: JSON.stringify({
        level,
        newLevel,
        correctHits,
        incorrectHits,
        missedHits,
        timePlayed,
      }),
    });

    if (!response.ok) {
      toast({ title: "Unexpected error occurred", variant: "destructive" });
    }
  }, [level, toast]);

  const playGame = useCallback(async () => {
    let step = 0;

    hasPressedButton.current = false;
    for (const position of gameSequence.current) {
      shouldPressButton.current = correctHitSequence.current[step];

      setSelectedSquare(position);
      await sleep(VISIBLE_SQUARE_DURATION);

      if (
        isTutorial &&
        correctHitSequence.current[step] &&
        !hasPressedButton.current
      ) {
        setShowTutorialHint(true);
        await waitFor(() => hasPressedButton.current);
        setShowTutorialHint(false);
      }

      setSelectedSquare(null);
      await sleep(HIDDEN_SQUARE_DURATION);

      if (hasPressedButton.current) {
        playerHitSequence.current.push(true);
      } else {
        playerHitSequence.current.push(false);
      }

      if (correctHitSequence.current[step] && !hasPressedButton.current) {
        showFeedback("missed");
      }

      hasPressedButton.current = false;
      shouldPressButton.current = false;
      step++;
    }

    setIsPlaying(false);
    setIsVisible(true);

    await updateGameData();
  }, [
    setIsVisible,
    showFeedback,
    updateGameData,
    isTutorial,
    setShowTutorialHint,
  ]);

  const startPlaying = useCallback(async () => {
    if (!level) return;

    setIsPlaying(true);
    setIsVisible(false);
    setHasReachedNewLevel(false);

    gameSequence.current = generateGameSequence(level);
    correctHitSequence.current = getCorrectHitSequence(
      gameSequence.current,
      level,
    );
    playerHitSequence.current = [];

    await sleep(DELAY_BEFORE_START);
    await playGame();
  }, [level, playGame, setIsVisible]);

  const handleButtonPress = useCallback(async () => {
    if (!hasPressedButton.current) {
      if (isTutorial && !shouldPressButton.current) return;

      hasPressedButton.current = true;
      setIsButtonPressed(true);
      handleShowFeedback();
      await sleep(400);
      setIsButtonPressed(false);
    }
  }, [handleShowFeedback, isTutorial]);

  useEffect(() => {
    addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        handleButtonPress();
      }
    });
  }, [handleButtonPress]);

  useEffect(() => {
    if (isPlaying || isTutorial) {
      window.onbeforeunload = () => {
        return "If you leave the page, you will lose your progress.";
      };
    }

    return () => {
      window.onbeforeunload = null;
    };
  }, [isPlaying, isTutorial]);

  useEffect(() => {
    if (isPlaying) {
      enterFullScreen();
    } else {
      exitFullScreen();
    }
  }, [isPlaying]);

  return {
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
    hasReachedNewLevel,
    setHasReachedNewLevel,
  };
}
