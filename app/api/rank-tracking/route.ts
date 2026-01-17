import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServer()
    const { data, error } = await supabase
      .from("rank_tracking")
      .select("*")
      .order("tracked_at", { ascending: false })
      .limit(100)

    if (error) throw error

    // Transform to frontend format
    const rankings = (data || []).map(row => ({
      id: row.id,
      domain: row.domain,
      keyword: row.keyword,
      position: row.position,
      location: row.location,
      city: row.city || row.location,
      country: row.country || '',
      device: row.device,
      trackedAt: row.tracked_at,
    }))

    return NextResponse.json(rankings)
  } catch (error) {
    console.error("Rank tracking fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { domain, keyword, location, city, country, device } = await request.json()
    const supabase = await getSupabaseServer()

    // In a real implementation, you would:
    // 1. Use Google Custom Search API with location parameter
    // 2. Use a SERP API (SerpApi, DataForSEO, etc.) that supports city-level queries
    // 3. Use a proxy in the target city to simulate local searches
    
    // For now, we simulate a position (replace with real SERP API call)
    // Real APIs use geolocation parameters like:
    // - Google: gl (country), uule (encoded location)
    // - SerpApi: location parameter accepts city names
    
    const position = Math.floor(Math.random() * 100) + 1

    const { data, error } = await supabase.from("rank_tracking").insert({
      domain,
      keyword,
      position,
      location,  // Full location string "City, Country"
      city,      // Just the city name
      country,   // Country code
      device,
    }).select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      position,
      data: data?.[0] 
    })
  } catch (error) {
    console.error("Rank tracking error:", error)
    return NextResponse.json({ error: "Failed to track ranking" }, { status: 500 })
  }
}
