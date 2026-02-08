'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Calendar, Clock, User, Plus, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  client_id?: string;
  expert_id?: string;
  type: string;
  status: string;
  location?: string;
  description?: string;
}

export default function AgendasPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'upcoming'>('all');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur fetch events:', error);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.start_date);
    
    switch(filter) {
      case 'today':
        return eventDate.toDateString() === today.toDateString();
      case 'week':
        return eventDate >= today && eventDate <= weekFromNow;
      case 'upcoming':
        return eventDate > today;
      default:
        return true;
    }
  });

  const stats = {
    total: events.length,
    today: events.filter(e => new Date(e.start_date).toDateString() === today.toDateString()).length,
    week: events.filter(e => {
      const d = new Date(e.start_date);
      return d >= today && d <= weekFromNow;
    }).length,
    upcoming: events.filter(e => new Date(e.start_date) > today).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Chargement des agendas...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#123055]">Gestion des Agendas</h1>
            <p className="text-slate-600 text-sm mt-1">Planning global de tous les événements</p>
          </div>
        </div>

        <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
          <Plus size={18} className="mr-2" />
          Nouvel événement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`bg-white rounded-xl border p-6 text-left transition-all ${
            filter === 'all' ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-sm text-slate-600 mb-2">Total événements</div>
          <div className="text-3xl font-bold text-[#123055]">{stats.total}</div>
        </button>

        <button
          onClick={() => setFilter('today')}
          className={`bg-white rounded-xl border p-6 text-left transition-all ${
            filter === 'today' ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-sm text-slate-600 mb-2">Aujourd'hui</div>
          <div className="text-3xl font-bold text-[#F59E0B]">{stats.today}</div>
        </button>

        <button
          onClick={() => setFilter('week')}
          className={`bg-white rounded-xl border p-6 text-left transition-all ${
            filter === 'week' ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-sm text-slate-600 mb-2">Cette semaine</div>
          <div className="text-3xl font-bold text-[#10B981]">{stats.week}</div>
        </button>

        <button
          onClick={() => setFilter('upcoming')}
          className={`bg-white rounded-xl border p-6 text-left transition-all ${
            filter === 'upcoming' ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-sm text-slate-600 mb-2">À venir</div>
          <div className="text-3xl font-bold text-[#123055]">{stats.upcoming}</div>
        </button>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-[#123055]">
            {filter === 'all' && 'Tous les événements'}
            {filter === 'today' && "Événements d'aujourd'hui"}
            {filter === 'week' && 'Événements cette semaine'}
            {filter === 'upcoming' && 'Événements à venir'}
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div key={event.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-[#123055] text-lg">{event.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.status === 'confirmed' 
                          ? 'bg-green-100 text-green-700'
                          : event.status === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {event.status === 'confirmed' ? 'Confirmé' : event.status === 'pending' ? 'En attente' : 'Annulé'}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="text-slate-600 mb-4 text-sm">{event.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#F59E0B]" />
                        {new Date(event.start_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#F59E0B]" />
                        {new Date(event.start_date).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {' - '}
                        {new Date(event.end_date).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <User size={16} className="text-[#F59E0B]" />
                        {event.type}
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#F59E0B]" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/agendas/${event.id}`)}
                  >
                    Modifier
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center text-slate-500">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p>Aucun événement {filter !== 'all' && 'pour cette période'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}