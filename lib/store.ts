import { create } from "zustand";
import { DBUserRole, mapRoleToUI } from "./supabase/client";

// --- TYPES ---

interface User {
  id: string;
  email: string;
  name: string;
  role: DBUserRole;
  uiRole: string; // Ajouté pour la Sidebar
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

interface UIStore {
  sidebarOpen: boolean;
  modalOpen: string | null;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (type: Notification["type"], message: string) => void;
  removeNotification: (id: string) => void;
}

// --- STORES ---

// Auth Store : Gère la session utilisateur
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ 
    user: user ? { ...user, uiRole: mapRoleToUI(user.role) } : null 
  }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// UI Store : Gère l'état visuel (Sidebar, Modales)
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  modalOpen: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (modalId) => set({ modalOpen: modalId }),
  closeModal: () => set({ modalOpen: null }),
}));

// Notification Store : Système de Toasts
export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (type, message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Math.random().toString(36).substring(2, 9), type, message },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

// Pipeline Store : Pour le Kanban de gestion des prospects
interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  temperature: "HOT" | "WARM" | "COLD";
  ca?: number;
  activite?: string;
  stage: number;
}

interface PipelineStore {
  leads: Record<number, Lead[]>;
  isLoading: boolean;
  moveLead: (leadId: string, fromStage: number, toStage: number) => void;
  setLeads: (leads: Record<number, Lead[]>) => void;
  addLead: (lead: Lead) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  leads: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
  isLoading: false,
  moveLead: (leadId, fromStage, toStage) =>
    set((state) => {
      const lead = state.leads[fromStage]?.find((l) => l.id === leadId);
      if (!lead) return state;

      const updatedFrom = state.leads[fromStage].filter((l) => l.id !== leadId);
      const updatedTo = [...(state.leads[toStage] || []), { ...lead, stage: toStage }];

      return {
        leads: {
          ...state.leads,
          [fromStage]: updatedFrom,
          [toStage]: updatedTo,
        },
      };
    }),
  setLeads: (leads) => set({ leads }),
  addLead: (lead) =>
    set((state) => ({
      leads: {
        ...state.leads,
        [lead.stage]: [...(state.leads[lead.stage] || []), lead],
      },
    })),
  updateLead: (leadId, updates) =>
    set((state) => {
      const newLeads = { ...state.leads };
      let found = false;
      for (const stage in newLeads) {
        const stageNum = Number(stage);
        const index = newLeads[stageNum].findIndex((l) => l.id === leadId);
        if (index !== -1) {
          newLeads[stageNum][index] = { ...newLeads[stageNum][index], ...updates };
          found = true;
          break;
        }
      }
      return found ? { leads: newLeads } : state;
    }),
}));