import OpenAI from "openai";
import type { ExerciseBug } from "@/lib/exercise-token";

type BugPattern = { key: string; instruction: string; groundTruth: string };

const BUG_PATTERNS: BugPattern[] = [
  { key: "division-by-zero", instruction: "Create a calculation where a denominator can demonstrably become zero, then divide by it without checking for zero.", groundTruth: "A denominator can be zero and is used in division without a zero check, causing a division-by-zero failure." },
  { key: "mutate-during-iteration", instruction: "Iterate over a collection while removing elements from that same collection, causing elements to be skipped or iteration to behave incorrectly.", groundTruth: "The code modifies a collection while iterating over it, which can skip elements or produce incorrect iteration behavior." },
  { key: "resource-leak", instruction: "Open a file, database connection, cursor, or similar resource and create a reachable path where the function returns or throws without closing it.", groundTruth: "A resource is left open on a reachable execution path, causing a resource leak." },
  { key: "missing-commit", instruction: "Perform a database INSERT, UPDATE, or DELETE requiring an explicit commit, but return success without committing.", groundTruth: "A database write is performed without committing the transaction, so the operation may not persist despite reporting success." },
  { key: "off-by-one", instruction: "Create a loop or index boundary where the intended range is explicit from the surrounding code, but the implementation processes one too many or one too few elements.", groundTruth: "A loop or index boundary is off by one, causing an element to be skipped or an invalid element to be accessed." },
  { key: "null-dereference", instruction: "Use a function or lookup that visibly can return null/None, then dereference the result or call a method on it without checking first.", groundTruth: "A value that can explicitly be null/None is dereferenced without a check, causing a runtime failure." },
  { key: "incorrect-return-type", instruction: "Create a function whose normal path returns one type but whose error path returns an incompatible type, then have callers use the result as the normal type.", groundTruth: "The function returns an incompatible type on a reachable path, which can break callers expecting the normal return type." },
  { key: "sql-injection", instruction: "Construct a SQL query by directly concatenating or interpolating user-controlled input instead of using parameterized SQL.", groundTruth: "User-controlled input is directly incorporated into a SQL query, allowing SQL injection." },
  { key: "missing-authorization", instruction: "Create an authenticated operation on a user-owned resource that loads or modifies the resource by ID but never verifies that the resource belongs to the authenticated user.", groundTruth: "The operation does not verify resource ownership, allowing an authenticated user to access or modify another user's resource." },
  { key: "duplicate-handling", instruction: "Create code explicitly intended to maintain unique values, but implement the duplicate check incorrectly so duplicates can still be added.", groundTruth: "The duplicate check is incorrect, allowing duplicate values despite the explicit uniqueness requirement." },
  { key: "wrong-boundary", instruction: "Make an intended inclusive or exclusive boundary explicit using a named constant or surrounding code, then use the wrong comparison operator at that boundary.", groundTruth: "The wrong comparison operator is used at an explicit boundary, incorrectly accepting or rejecting the boundary value." },
  { key: "shallow-copy", instruction: "Create a nested mutable structure, make a shallow copy of it, then mutate nested data in the copy where the surrounding code clearly expects the original to remain unchanged.", groundTruth: "A shallow copy shares nested mutable objects with the original, so modifying the copy unexpectedly modifies the original data." },
  { key: "incorrect-condition-order", instruction: "Create a compound condition where a value is dereferenced or indexed before the condition checks whether that operation is safe.", groundTruth: "The conditions are evaluated in the wrong order, so an unsafe operation can occur before the guard that was supposed to prevent it." },
  { key: "command-injection", instruction: "Pass user-controlled input into a shell command through string construction with shell execution enabled.", groundTruth: "User-controlled input is incorporated into a shell command, allowing command injection." },
  { key: "unsafe-deserialization", instruction: "Deserialize untrusted input using a mechanism that can execute or instantiate unsafe objects.", groundTruth: "Untrusted input is deserialized using an unsafe mechanism, which can allow arbitrary code execution or unsafe object construction." },
];

function pickRandomBugs(count: number) {
  const shuffled = [...BUG_PATTERNS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export type ExerciseConfig = { role: string; language: string; seniority: string };

export async function generateExercise(client: OpenAI, config: ExerciseConfig): Promise<{ description: string; code: string; bugs: ExerciseBug[] }> {
  const selectedBugs = pickRandomBugs(3);
  const requiredBugs = selectedBugs.map((bug, index) => `BUG ${index + 1} — ${bug.key}\n${bug.instruction}`).join("\n\n");
  const response = await client.chat.completions.create({
    model: "gpt-6-sol",
    reasoning_effort: "none",
    messages: [
      { role: "system", content: `You are creating a realistic code review practice exercise.

The application has already selected exactly 3 defects.

YOUR JOB IS NOT TO INVENT BUGS.

Your job is to write realistic code that contains EXACTLY the three required defects below.

The candidate must be able to identify each defect directly from the code.

REQUIRED DEFECTS:

${requiredBugs}

STRICT RULES:

- Implement all 3 required defects.
- Each defect must be clearly and objectively present in the final code.
- Do not fix or neutralize any required defect elsewhere in the code.
- Do not introduce additional intentional defects.
- Do not introduce syntax errors.
- Do not introduce fake bugs or ambiguous behavior.
- Do not rely on undocumented business requirements.
- Do not turn style preferences into defects.
- Do not add comments revealing where the bugs are.
- Do not write comments saying that something is intentionally broken.
- The code must look like plausible production code.
- Adapt the scenario and APIs to the requested role, language, and seniority.
- Keep the exercise concise enough for one focused code review practice session.
- Write a 1–3 sentence plain-language description of what this change is meant to do and why.
- Keep the description consistent with the code, but do not reveal or hint at any planted defect.

Before responding, silently inspect the final code and ensure that all three required defects are actually implemented.

Respond ONLY with valid JSON:

{
  "description": "1–3 plain sentences describing the intended change and its purpose",
  "code": "the complete exercise code",
  "evidence": [
    {
      "bug": 1,
      "line": "exact relevant line from the generated code"
    },
    {
      "bug": 2,
      "line": "exact relevant line from the generated code"
    },
    {
      "bug": 3,
      "line": "exact relevant line from the generated code"
    }
  ]
}

Return raw JSON only.
No markdown.
No code fences.` },
      { role: "user", content: `Create the exercise for:\nRole: ${config.role}\nLanguage: ${config.language}\nSeniority: ${config.seniority}` },
    ],
    response_format: { type: "json_object" },
  });
  const generated = JSON.parse(response.choices[0]?.message?.content ?? "null");
  if (typeof generated?.description !== "string" || !generated.description.trim() || generated.description.length > 600 || typeof generated.code !== "string" || !generated.code.trim() || !Array.isArray(generated.evidence) || generated.evidence.length !== 3) throw new Error("Generated exercise has invalid structure");
  for (let i = 0; i < 3; i++) {
    const evidence = generated.evidence[i];
    if (evidence?.bug !== i + 1 || typeof evidence.line !== "string" || !evidence.line.trim() || !generated.code.includes(evidence.line)) throw new Error("Generated exercise has invalid evidence");
  }
  return { description: generated.description.trim(), code: generated.code, bugs: selectedBugs.map((pattern, index) => ({ id: index + 1, line: generated.evidence[index].line, description: pattern.groundTruth })) };
}

type CaughtIssue = { bug: number; reason: string };
type MissedIssue = { bug: number; description: string; reason: string };
type GradingResult = { caught: CaughtIssue[]; missed: MissedIssue[]; extraFindings: string[]; falsePositives: string[]; reviewQuality: number; feedback: string };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export async function gradeReview(client: OpenAI, code: string, bugs: ExerciseBug[], userReview: string) {
  const bugsStr = bugs.map((bug) => `Bug ${bug.id}: ${bug.description}`).join("\n");
  const response = await client.chat.completions.create({
    model: "gpt-6-sol",
    reasoning_effort: "none",
    messages: [
      { role: "system", content: `You are an experienced software engineer evaluating a developer's code review.

You are given:
1. Source code.
2. The intentionally planted bugs.
3. The candidate's written review.

Your task is to CLASSIFY the candidate's findings accurately.

Do NOT calculate the final numeric score. The server calculates it deterministically.

PLANTED BUG CLASSIFICATION

For every planted bug, decide whether the candidate caught the underlying defect.

A planted bug is caught when:
- The candidate identifies the same underlying technical problem.
- Exact terminology is NOT required.
- Exact line numbers are NOT required.
- The candidate must demonstrate that they noticed the actual defect.
- A vague statement such as "this could be improved" is not enough.

A planted bug is missed when:
- The candidate never identifies the underlying problem.
- The candidate discusses a different issue.
- The candidate makes only a vague or stylistic observation.

EXTRA FINDINGS

A candidate may identify a genuine defect that was not intentionally planted.

Count it as an extra finding only when:
- It genuinely exists in the provided code.
- It represents a correctness, runtime, security, validation, state, concurrency, data integrity, API contract, or meaningful edge-case problem.

Do NOT count:
- Style preferences.
- Naming preferences.
- Generic refactoring suggestions.
- Speculative problems unsupported by the code.

FALSE POSITIVES

A false positive is a candidate claim that:
- Describes a bug that does not actually exist in the provided code, or
- Makes a materially incorrect technical claim.

Do NOT treat subjective style suggestions as false positives. Simply ignore them.

REVIEW QUALITY

Give reviewQuality from 0 to 10.

This measures ONLY the quality of the candidate's explanation of findings they actually made.

Consider:
- Specificity.
- Correct explanation of impact.
- Actionability.
- Quality of proposed fixes.
- Technical clarity.

Do NOT increase reviewQuality because the candidate found more bugs.
Do NOT decrease reviewQuality merely because planted bugs were missed.

Examples:
- "This is broken" with no explanation: low quality.
- Correct issue + clear impact: good quality.
- Correct issue + clear impact + practical fix: high quality.

Return ONLY valid JSON in this exact structure:

{
  "caught": [
    {
      "bug": 1,
      "reason": "Why the candidate's review demonstrates that they caught this issue."
    }
  ],
  "missed": [
    {
      "bug": 2,
      "description": "Short description of the planted bug.",
      "reason": "Why this issue was not identified."
    }
  ],
  "extraFindings": [],
  "falsePositives": [],
  "reviewQuality": 8,
  "feedback": "2-3 concise sentences explaining what the reviewer did well and what would most improve the next review."
}

Every planted bug MUST appear exactly once in either caught or missed.

Return raw JSON only.
No markdown.
No code fences.` },
      { role: "user", content: `CODE:\n${code}\n\nPLANTED BUGS:\n${bugsStr}\n\nCANDIDATE REVIEW:\n${userReview}` },
    ],
    response_format: { type: "json_object" },
  });
  const data = JSON.parse(response.choices[0]?.message?.content ?? "null") as GradingResult;
  if (!data || typeof data !== "object") throw new Error("Invalid grading response");
  const validBugIds = new Set(bugs.map((bug) => bug.id));
  const caught = Array.isArray(data.caught) ? data.caught.filter((item) => item && validBugIds.has(item.bug) && typeof item.reason === "string") : [];
  const caughtIds = new Set(caught.map((item) => item.bug));
  const missed = bugs.filter((bug) => !caughtIds.has(bug.id)).map((bug) => ({ bug: bug.id, description: bug.description, reason: Array.isArray(data.missed) ? data.missed.find((item) => item.bug === bug.id)?.reason ?? "This planted issue was not identified in the review." : "This planted issue was not identified in the review." }));
  const extraFindings = Array.isArray(data.extraFindings) ? data.extraFindings.filter((item): item is string => typeof item === "string") : [];
  const falsePositives = Array.isArray(data.falsePositives) ? data.falsePositives.filter((item): item is string => typeof item === "string") : [];
  const reviewQuality = typeof data.reviewQuality === "number" ? clamp(data.reviewQuality, 0, 10) : 0;
  const score = clamp(Math.round(((caught.length / bugs.length) * 8 + (reviewQuality / 10) * 2 - falsePositives.length * 0.5) * 10) / 10, 0, 10);
  const feedback = typeof data.feedback === "string" ? data.feedback : "Focus on correctness, edge cases, state changes, and security risks.";
  return { score, caught, missed, extraFindings, falsePositives, reviewQuality, feedback, bugs };
}
