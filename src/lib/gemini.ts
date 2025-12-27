import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface PlaceVibeAnalysis {
  summary: string
  coupleInsights: string
  vibeTags: string[]
  poeticDescription: string
  generalDescription: string
}

export async function analyzePlace(
  placeName: string,
  placeTypes: string[],
  reviews: { text: string; rating: number }[],
  editorialSummary?: string | null
): Promise<PlaceVibeAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const reviewTexts = reviews
    .slice(0, 10) // Limit to 10 reviews
    .map((r) => `[${r.rating}★] ${r.text}`)
    .join('\n\n')

  const prompt = `You are helping a couple (Khaled and Amal) discover meaningful places together. Analyze this place and provide insights specifically for a couple exploring the world together.

Place: ${placeName}
Type: ${placeTypes.join(', ')}
${editorialSummary ? `\nGoogle's Description: ${editorialSummary}` : ''}

Reviews:
${reviewTexts || 'No reviews available'}

Respond in JSON format with exactly these fields:
{
  "generalDescription": "A rich, informative 3-4 sentence description of this place. Cover what it is, what makes it notable, what you can see/do/experience there. Include any historical, cultural, or practical context that would help someone understand this place. Be specific and vivid.",
  
  "summary": "A concise 2-3 sentence summary of what makes this place special. Focus on atmosphere, unique qualities, and memorable experiences.",
  
  "coupleInsights": "2-3 sentences specifically for a couple. What makes this a good spot for them? Consider romantic potential, shared experiences, conversation opportunities, photo moments, or just the vibe of being there together.",
  
  "vibeTags": ["list", "of", "5-8", "vibe", "tags"],
  
  "poeticDescription": "One evocative, poetic sentence that captures the essence of this place. Make it feel like a memory waiting to happen."
}

For vibeTags, choose from or create tags like: romantic, cozy, adventurous, peaceful, scenic, hidden-gem, sunset-spot, coffee-worthy, food-coma, nature, waterfront, historic, artsy, local-favorite, instagram-worthy, conversation-starter, date-night, morning-vibes, golden-hour, stargazing, walking-friendly, animal-friendly, rain-or-shine, spontaneous, bucket-list

Be genuine and specific. Avoid generic descriptions. Write as if you're a thoughtful friend who knows them.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      summary: parsed.summary || '',
      coupleInsights: parsed.coupleInsights || '',
      vibeTags: parsed.vibeTags || [],
      poeticDescription: parsed.poeticDescription || '',
      generalDescription: parsed.generalDescription || '',
    }
  } catch (error) {
    console.error('Error analyzing place with Gemini:', error)
    
    // Return meaningful defaults
    return {
      summary: `${placeName} awaits your discovery. Add notes after your visit to build your personal story of this place.`,
      coupleInsights: 'This could be your next adventure together. Visit and let us know what you think!',
      vibeTags: ['to-explore', 'awaiting-discovery'],
      poeticDescription: 'A place yet to be written into your story.',
      generalDescription: editorialSummary || `${placeName} is a place waiting to be discovered. Explore it together and create your own memories here.`,
    }
  }
}

export async function refreshPlaceVibe(
  placeName: string,
  placeTypes: string[],
  reviews: { text: string; rating: number }[],
  existingNotes: { author: string; content: string }[],
  editorialSummary?: string | null
): Promise<PlaceVibeAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const reviewTexts = reviews
    .slice(0, 10)
    .map((r) => `[${r.rating}★] ${r.text}`)
    .join('\n\n')

  const noteTexts = existingNotes
    .map((n) => `[${n.author}] ${n.content}`)
    .join('\n\n')

  const prompt = `You are helping Khaled and Amal document their journey together. They've already visited or are planning to visit this place. Analyze it with their personal notes in mind.

Place: ${placeName}
Type: ${placeTypes.join(', ')}
${editorialSummary ? `\nGoogle's Description: ${editorialSummary}` : ''}

Reviews from others:
${reviewTexts || 'No reviews available'}

Their personal notes:
${noteTexts || 'No notes yet'}

Respond in JSON format with exactly these fields:
{
  "generalDescription": "A rich, informative 3-4 sentence description of this place. Cover what it is, what makes it notable, what you can see/do/experience there. Include any historical, cultural, or practical context.",
  
  "summary": "A concise 2-3 sentence summary. If they have notes, weave in their personal experience. Otherwise, focus on what makes this place special.",
  
  "coupleInsights": "2-3 sentences for them as a couple. Reference their notes if available. Suggest what to try or remember about this place.",
  
  "vibeTags": ["list", "of", "5-8", "vibe", "tags"],
  
  "poeticDescription": "One evocative, poetic sentence. If they have notes, make it feel like a memory they're building together."
}

Make it personal. This is their private memory journal.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      summary: parsed.summary || '',
      coupleInsights: parsed.coupleInsights || '',
      vibeTags: parsed.vibeTags || [],
      poeticDescription: parsed.poeticDescription || '',
      generalDescription: parsed.generalDescription || '',
    }
  } catch (error) {
    console.error('Error refreshing place vibe:', error)
    throw error
  }
}
