import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { checkGoogleRank } from "@/lib/seo/serp-scraper"

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

    // REAL SERP scraping - checks actual Google rankings!
    // Note: This scrapes Google directly - use responsibly
    // Google may block excessive requests
    const rankResult = await checkGoogleRank(keyword, domain, country || 'IN', city)
    
    const position = rankResult.position // null if not found in top 100

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
      url: rankResult.url,
      topResults: rankResult.topResults.slice(0, 5), // Top 5 competitors
      checkedAt: rankResult.checkedAt,
      data: data?.[0] 
    })
  } catch (error) {
    console.error("Rank tracking error:", error)
    return NextResponse.json({ error: "Failed to track ranking" }, { status: 500 })
  }
}
