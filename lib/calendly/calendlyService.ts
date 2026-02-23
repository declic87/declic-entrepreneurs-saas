// lib/calendly/calendlyService.ts

export const CALENDLY_LINKS = {
    CLOSER_TEAM: 'https://calendly.com/pole-closers-declic-entrepreneurs/30min',
    EXPERT_TEAM: 'https://calendly.com/pole-experts-declic-entrepreneurs/30min',
    JEROME: 'https://calendly.com/contact-declic-entrepreneurs/30min',
    EXPERT_SUPPLEMENTAIRE: 'https://calendly.com/contact-declic-entrepreneurs/rdv-suppl-experts',
  };
  
  export type CalendlyEventType = 'closer' | 'expert' | 'jerome' | 'supplementaire';
  
  interface CalendlyInvitee {
    name: string;
    email: string;
    uri: string;
  }
  
  interface CalendlyEvent {
    uri: string;
    name: string;
    start_time: string;
    end_time: string;
    status: string;
    invitees_counter: {
      total: number;
      active: number;
      limit: number;
    };
    event_memberships?: Array<{
      user: string;
      user_name: string;
    }>;
  }
  
  const CALENDLY_API_URL = 'https://api.calendly.com';
  const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
  
  export async function getCalendlyEvent(eventUri: string): Promise<CalendlyEvent | null> {
    try {
      const response = await fetch(`${CALENDLY_API_URL}${eventUri}`, {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Calendly API error: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.resource;
    } catch (error) {
      console.error('Erreur récupération événement Calendly:', error);
      return null;
    }
  }
  
  export async function getCalendlyInvitee(inviteeUri: string): Promise<CalendlyInvitee | null> {
    try {
      const response = await fetch(`${CALENDLY_API_URL}${inviteeUri}`, {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Calendly API error: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.resource;
    } catch (error) {
      console.error('Erreur récupération invité Calendly:', error);
      return null;
    }
  }
  
  export async function cancelCalendlyEvent(eventUri: string, reason?: string) {
    try {
      const response = await fetch(`${CALENDLY_API_URL}${eventUri}/cancellation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled by user',
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Calendly API error: ${response.statusText}`);
      }
  
      return true;
    } catch (error) {
      console.error('Erreur annulation Calendly:', error);
      return false;
    }
  }
  
  export function getCalendlyLinkWithPrefill(
    baseUrl: string,
    options: {
      name?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      customAnswers?: Record<string, string>;
    }
  ): string {
    const url = new URL(baseUrl);
    
    if (options.name) {
      url.searchParams.set('name', options.name);
    }
    if (options.email) {
      url.searchParams.set('email', options.email);
    }
    if (options.firstName) {
      url.searchParams.set('first_name', options.firstName);
    }
    if (options.lastName) {
      url.searchParams.set('last_name', options.lastName);
    }
  
    // Custom answers format: a1=answer1&a2=answer2
    if (options.customAnswers) {
      let index = 1;
      for (const [question, answer] of Object.entries(options.customAnswers)) {
        url.searchParams.set(`a${index}`, answer);
        index++;
      }
    }
  
    return url.toString();
  }
  
  export function determineEventType(eventUri: string): CalendlyEventType {
    if (eventUri.includes('pole-closers')) return 'closer';
    if (eventUri.includes('pole-experts')) return 'expert';
    if (eventUri.includes('rdv-suppl-experts')) return 'supplementaire';
    if (eventUri.includes('contact-declic-entrepreneurs')) return 'jerome';
    return 'expert'; // default
  }