import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: NextRequest, { params }: any) {
  const url = `${BASE_URL}/api/auth/${params.slug.join("/")}`;

  const body = await req.json();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
  });
}