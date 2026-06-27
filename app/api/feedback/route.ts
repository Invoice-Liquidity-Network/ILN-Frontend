import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rating, category, feedback, email } = body;

    if (!rating || !category || !feedback) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;

    if (githubToken && githubOwner && githubRepo) {
      const issueTitle = `[Feedback] ${category}: ${rating} stars`;
      const issueBody = `
**Rating:** ${rating} / 5 stars
**Category:** ${category}
**Feedback:**
${feedback}

**Contact Email:** ${email || "Not provided"}
      `;

      const response = await fetch(
        `https://api.github.com/repos/${githubOwner}/${githubRepo}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "ILN-Feedback-Widget",
          },
          body: JSON.stringify({
            title: issueTitle,
            body: issueBody,
            labels: ["feedback", category.toLowerCase()],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("GitHub API error:", errorData);
        throw new Error("Failed to create GitHub issue");
      }
    } else {
      // For development or if GitHub is not configured
      console.log("Feedback received (no GitHub config):", body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
