/**
 * Admin service — returns data shaped exactly as admin* arrays in mockData.ts
 * These are projection queries, not separate tables.
 */
import { supabase } from '@/lib/supabase';
import { formatDate, formatDateShort, formatMonthYear } from '@/lib/transforms';
import {
  adminUsers as mockAdminUsers,
  adminDocumentaries as mockAdminDocumentaries,
  adminSponsors as mockAdminSponsors,
  adminPendingCampaigns as mockAdminPendingCampaigns,
  adminAdPlacements as mockAdminAdPlacements,
  adminAuditLogs as mockAdminAuditLogs,
} from '@/data/mockData';

// --- Admin Users ---
export async function fetchAdminUsers() {
  if (!supabase) return mockAdminUsers;

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, status, joined_at')
    .order('joined_at', { ascending: false });

  if (error || !data) return mockAdminUsers;

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    joined: formatMonthYear(row.joined_at),
    status: row.status,
  }));
}

// --- Admin Documentaries ---
export async function fetchAdminDocumentaries() {
  if (!supabase) return mockAdminDocumentaries;

  const { data, error } = await supabase
    .from('documentaries')
    .select('id, title, genre, status, views, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return mockAdminDocumentaries;

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    genre: row.genre,
    status: row.status,
    views: row.views,
    uploaded: row.status === 'Draft' ? '—' : formatDate(row.created_at),
  }));
}

// --- Admin Sponsors ---
export async function fetchAdminSponsors() {
  if (!supabase) return mockAdminSponsors;

  const { data, error } = await supabase
    .from('sponsors')
    .select('id, name, status, joined_at');

  if (error || !data) return mockAdminSponsors;

  // For campaign count and spend, would need a join or separate query
  // Simplified: return base fields with placeholder aggregates
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    campaigns: 0, // Will be populated with join query in Phase 2
    spend: 0,
    status: row.status,
    joined: formatMonthYear(row.joined_at),
  }));
}

// --- Admin Pending Campaigns ---
export async function fetchAdminPendingCampaigns() {
  if (!supabase) return mockAdminPendingCampaigns;

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, budget_paise, submitted_at, sponsor:sponsors(name)')
    .eq('status', 'Pending Approval')
    .order('submitted_at', { ascending: false });

  if (error || !data) return mockAdminPendingCampaigns;

  return data.map((row: any) => ({
    id: row.id,
    sponsor: (row.sponsor as any)?.name || 'Unknown',
    name: row.name,
    budget: row.budget_paise, // kept as integer for consistency with mockData
    submitted: row.submitted_at ? formatDate(row.submitted_at) : '—',
  }));
}

// --- Admin Ad Placements ---
export async function fetchAdminAdPlacements() {
  if (!supabase) return mockAdminAdPlacements;

  const { data, error } = await supabase
    .from('ad_placements')
    .select('id, sponsor_name, placement, impressions, status')
    .order('created_at', { ascending: false });

  if (error || !data) return mockAdminAdPlacements;

  return data.map((row: any) => ({
    id: row.id,
    sponsor: row.sponsor_name,
    placement: row.placement,
    impressions: row.impressions,
    status: row.status,
  }));
}

// --- Admin Audit Logs ---
export async function fetchAdminAuditLogs() {
  if (!supabase) return mockAdminAuditLogs;

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, user_email, action, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return mockAdminAuditLogs;

  return data.map((row: any) => ({
    id: row.id,
    user: row.user_email,
    action: row.action,
    time: formatDateShort(row.created_at),
  }));
}
