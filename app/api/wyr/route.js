import { NextResponse } from "next/server";

const fallbackQuestions = [
  ["Have a pet dragon", "Have a pet dinosaur"],
  ["Always have free pizza", "Always have free ice cream"],
  ["Live on the moon", "Live under the ocean"],
];

const chaoticFallbackQuestions = [
  ["Have a clown narrate every awkward moment", "Have dramatic music play whenever you enter a room"],
  ["Swap lives with your pet for one week", "Let your pet post from your social media for one week"],
  ["Have spaghetti for hair", "Have popcorn kernels for teeth"],
];

function turnQuestionIntoChoices(question, fallbackPool) {
  const cleaned = question
    .replace(/^would you rather\s*/i, "")
    .replace(/\?$/, "")
    .trim();

  const choices = cleaned.split(/\s+or\s+/i);

  if (choices.length === 2) {
    return choices.map((choice) => choice.trim());
  }

  return fallbackPool[
    Math.floor(Math.random() * fallbackPool.length)
  ];
}

export async function GET(request) {
  const requestedRating = new URL(request.url).searchParams.get("rating");
  const rating = requestedRating === "pg13" ? "pg13" : "pg";
  const fallbackPool = rating === "pg13" ? chaoticFallbackQuestions : fallbackQuestions;

  try {
    const response = await fetch(
      `https://api.truthordarebot.xyz/api/wyr?rating=${rating}`,
      { cache: "no-store" }
    );

    if (!response.ok) throw new Error("API failed");

    const data = await response.json();

    return NextResponse.json({
      options: turnQuestionIntoChoices(data.question, fallbackPool),
    });
  } catch {
    const options = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

    return NextResponse.json({ options });
  }
}
