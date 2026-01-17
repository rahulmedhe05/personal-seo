import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServer()
    const { data, error } = await supabase.from("competitors").select("*")

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Competitors fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch competitors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { yourDomain, competitorDomain } = await request.json()
    const supabase = await getSupabaseServer()

    const { data, error } = await supabase.from("competitors").insert({
      your_domain: yourDomain,
      competitor_domain: competitorDomain,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Competitors add error:", error)
    return NextResponse.json({ error: "Failed to add competitor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()
    const { error } = await supabase.from("competitors").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Competitors delete error:", error)
    return NextResponse.json({ error: "Failed to delete competitor" }, { status: 500 })
  }
}
