"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Plus, Trash2, Edit3, Save, X, GripVertical } from "lucide-react";

// Imports DND Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const POLES = [
  { id: 'ADMIN', label: 'Admin', color: 'bg-orange-100 text-orange-700' },
  { id: 'HOS', label: 'Head of Sales', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'CLOSER', label: 'Closer', color: 'bg-purple-100 text-purple-700' },
  { id: 'SETTER', label: 'Setter', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'EXPERT', label: 'Expert', color: 'bg-emerald-100 text-emerald-700' }
];

interface OnboardingVideo {
  id: string;
  pole: string;
  title: string;
  loom_id: string;
  description: string;
  duration: string;
  order_index: number;
  active: boolean;
}

// --- Composant Item Sortable ---
function SortableVideoItem({ 
  video, 
  idx, 
  editingId, 
  setEditingId, 
  deleteVideo, 
  toggleActive, 
  updateVideo,
  saving 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'shadow-2xl' : ''} group`}>
      <Card className={`${!video.active ? 'opacity-60' : ''} relative overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            {/* Handle pour le drag */}
            <div 
              {...attributes} 
              {...listeners} 
              className="mt-1 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded text-gray-400"
            >
              <GripVertical size={20} />
            </div>

            <div className="flex-1">
              {editingId === video.id ? (
                <div className="space-y-4">
                  <input
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={video.title}
                    onChange={(e) => video.onLocalUpdate({ title: e.target.value })}
                  />
                  <input
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Loom ID"
                    value={video.loom_id}
                    onChange={(e) => video.onLocalUpdate({ loom_id: e.target.value })}
                  />
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg text-sm h-20"
                    value={video.description}
                    onChange={(e) => video.onLocalUpdate({ description: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => updateVideo(video)} disabled={saving} size="sm">
                      <Save size={14} className="mr-2" /> Sauvegarder
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-500">{video.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>{video.duration}</span>
                        <span>ID: {video.loom_id}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(video.id, video.active)} className={`px-2 py-1 text-xs rounded ${video.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {video.active ? 'Actif' : 'Inactif'}
                      </button>
                      <button onClick={() => setEditingId(video.id)} className="p-2 hover:bg-gray-100 rounded"><Edit3 size={16}/></button>
                      <button onClick={() => deleteVideo(video.id)} className="p-2 hover:bg-red-50 text-red-400 rounded"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe src={`https://www.loom.com/embed/${video.loom_id}`} frameBorder="0" allowFullScreen className="w-full h-full" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Page Principale ---
export default function OnboardingStaffPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [videos, setVideos] = useState<OnboardingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPole, setSelectedPole] = useState('ADMIN');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ title: '', loom_id: '', description: '', duration: '', pole: 'ADMIN' });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => { fetchVideos(); }, []);

  async function fetchVideos() {
    const { data } = await supabase.from('onboarding_videos').select('*').order('order_index', { ascending: true });
    if (data) setVideos(data);
    setLoading(false);
  }

  async function addVideo() {
    if (!formData.title || !formData.loom_id) return setMessage('Titre et ID requis');
    setSaving(true);
    const poleVideos = videos.filter(v => v.pole === formData.pole);
    const { error } = await supabase.from('onboarding_videos').insert({
      id: 'onb_' + Date.now(),
      ...formData,
      order_index: poleVideos.length,
      active: true
    });
    if (!error) {
      setShowAddForm(false);
      setFormData({ title: '', loom_id: '', description: '', duration: '', pole: selectedPole });
      await fetchVideos();
    }
    setSaving(false);
  }

  async function updateVideo(video: OnboardingVideo) {
    setSaving(true);
    const { error } = await supabase.from('onboarding_videos').update({ ...video, updated_at: new Date().toISOString() }).eq('id', video.id);
    if (!error) {
      setEditingId(null);
      setMessage("Mis à jour !");
      setTimeout(() => setMessage(''), 2000);
    }
    setSaving(false);
  }

  async function deleteVideo(id: string) {
    if (!confirm('Supprimer ?')) return;
    await supabase.from('onboarding_videos').delete().eq('id', id);
    fetchVideos();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('onboarding_videos').update({ active: !current }).eq('id', id);
    fetchVideos();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over.id);
      const newOrder = arrayMove(videos, oldIndex, newIndex);
      
      setVideos(newOrder); // Update UI immédiatement

      // Update Supabase
      const updates = newOrder.map((v, i) => ({ id: v.id, order_index: i }));
      await supabase.from('onboarding_videos').upsert(updates);
    }
  }

  const filteredVideos = videos.filter(v => v.pole === selectedPole);

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Onboarding Staff</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>{showAddForm ? 'Annuler' : 'Ajouter'}</Button>
      </div>

      {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">{message}</div>}

      {showAddForm && (
        <Card className="bg-orange-50 border-orange-200 p-6 space-y-4">
            <select className="w-full p-2 rounded border" value={formData.pole} onChange={e => setFormData({...formData, pole: e.target.value})}>
                {POLES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <input placeholder="Titre" className="w-full p-2 rounded border" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input placeholder="Loom ID" className="w-full p-2 rounded border" value={formData.loom_id} onChange={e => setFormData({...formData, loom_id: e.target.value})} />
            <Button onClick={addVideo} disabled={saving}>Sauvegarder la vidéo</Button>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {POLES.map(pole => (
          <button
            key={pole.id}
            onClick={() => setSelectedPole(pole.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedPole === pole.id ? pole.color : 'bg-gray-100'}`}
          >
            {pole.label} ({videos.filter(v => v.pole === pole.id).length})
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredVideos.map(v => v.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {filteredVideos.map((video, idx) => (
              <SortableVideoItem 
                key={video.id} 
                video={{
                    ...video,
                    onLocalUpdate: (updates: any) => setVideos(videos.map(v => v.id === video.id ? {...v, ...updates} : v))
                }}
                idx={idx}
                editingId={editingId}
                setEditingId={setEditingId}
                deleteVideo={deleteVideo}
                toggleActive={toggleActive}
                updateVideo={updateVideo}
                saving={saving}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}