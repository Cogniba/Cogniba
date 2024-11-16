import { BASE_SEQUENCE_LENGTH, NUM_TARGETS } from "@/config/game";
import getTargetsCount from "./getTargetsCount";

export default function generateGameSequence(level: number): number[] {
  const gameSequence = [];

  for (let i = 0; i < BASE_SEQUENCE_LENGTH + level; i++) {
    gameSequence.push(Math.trunc(Math.random() * 8));
  }

  let targetsCount = getTargetsCount(gameSequence, level);

  while (targetsCount !== NUM_TARGETS) {
    const randomIndex = Math.trunc(
      Math.random() * (gameSequence.length - level) + level,
    );

    if (
      targetsCount > NUM_TARGETS &&
      gameSequence[randomIndex] === gameSequence[randomIndex - level]
    ) {
      gameSequence[randomIndex] = Math.trunc(Math.random() * 8);
    } else if (
      targetsCount < NUM_TARGETS &&
      gameSequence[randomIndex] !== gameSequence[randomIndex - level]
    ) {
      gameSequence[randomIndex] = gameSequence[randomIndex - level];
    }

    targetsCount = getTargetsCount(gameSequence, level);
  }

  return gameSequence;
}
