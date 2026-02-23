// lib/fathom/fathomService.ts

const FATHOM_API_URL = 'https://api.fathom.video/v1';
const FATHOM_API_KEY = process.env.FATHOM_API_KEY;

interface FathomRecording {
  id: string;
  title: string;
  share_url: string;
  summary?: string;
  transcript?: string;
  duration?: number;
  created_at: string;
}

interface FathomWebhookPayload {
  event: string;
  data: {
    recording_id: string;
    share_url: string;
    title: string;
    summary?: string;
    transcript?: string;
  };
}

export async function createFathomRecording(title: string) {
  try {
    const response = await fetch(`${FATHOM_API_URL}/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        auto_start: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fathom API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur création Fathom:', error);
    throw error;
  }
}

export async function getFathomRecording(recordingId: string): Promise<FathomRecording | null> {
  try {
    const response = await fetch(`${FATHOM_API_URL}/recordings/${recordingId}`, {
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Fathom API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur récupération Fathom:', error);
    return null;
  }
}

export async function listFathomRecordings(limit = 50) {
  try {
    const response = await fetch(`${FATHOM_API_URL}/recordings?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Fathom API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.recordings || [];
  } catch (error) {
    console.error('Erreur liste Fathom:', error);
    return [];
  }
}

export async function getFathomSummary(recordingId: string): Promise<string | null> {
  try {
    const response = await fetch(`${FATHOM_API_URL}/recordings/${recordingId}/summary`, {
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.summary || null;
  } catch (error) {
    console.error('Erreur résumé Fathom:', error);
    return null;
  }
}

export async function getFathomTranscript(recordingId: string): Promise<string | null> {
  try {
    const response = await fetch(`${FATHOM_API_URL}/recordings/${recordingId}/transcript`, {
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.transcript || null;
  } catch (error) {
    console.error('Erreur transcript Fathom:', error);
    return null;
  }
}

export function extractFathomId(url: string): string | null {
  // https://fathom.video/share/abc123 → abc123
  const match = url.match(/fathom\.video\/share\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}