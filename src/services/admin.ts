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
    .from('app_users')
    .select('id, name, email, role, status, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return mockAdminUsers;

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    joined: formatMonthYear(row.created_at),
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
    .select('id, name, status, created_at, campaigns(spend_paise)');

  if (error || !data) return mockAdminSponsors;

  // Campaign count = number of related campaigns; spend = sum(spend_paise)/100 (rupees).
  return data.map((row: any) => {
    const campaignRows: any[] = Array.isArray(row.campaigns) ? row.campaigns : [];
    const spendPaise = campaignRows.reduce((sum, c) => sum + Number(c.spend_paise || 0), 0);
    return {
      id: row.id,
      name: row.name,
      campaigns: campaignRows.length,
      spend: spendPaise / 100,
      status: row.status,
      joined: formatMonthYear(row.created_at),
    };
  });
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
    budget: Number(row.budget_paise) / 100, // paise → rupees (mock budget is rupee integer)
    submitted: row.submitted_at ? formatDate(row.submitted_at) : '—',
  }));
}

// --- Admin Ad Placements ---
export async function fetchAdminAdPlacements() {
  if (!supabase) return mockAdminAdPlacements;

  const { data, error } = await supabase
    .from('ad_placements')
    .select('id, sponsor, placement, impressions, status')
    .order('created_at', { ascending: false });

  if (error || !data) return mockAdminAdPlacements;

  return data.map((row: any) => ({
    id: row.id,
    sponsor: row.sponsor,
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
    .select('id, actor, action, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return mockAdminAuditLogs;

  return data.map((row: any) => ({
    id: row.id,
    user: row.actor,
    action: row.action,
    time: formatDateShort(row.created_at),
  }));
}
