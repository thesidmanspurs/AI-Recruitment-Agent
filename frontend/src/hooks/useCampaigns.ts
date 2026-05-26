import { useEffect, useState, useCallback } from 'react';
import {
  campaignApi,
  type CampaignDto,
  type CandidateDto,
  type CreateCampaignInput,
  type ScreeningSummary,
  type AlertItem,
} from '../api/campaignApi';
import { usageApi, type UsageSnapshot } from '../api/usageApi';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourcing, setSourcing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulationReason, setSimulationReason] = useState<string | null>(null);
  const [screening, setScreening] = useState<ScreeningSummary | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [sourcingPagination, setSourcingPagination] = useState<{
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
    hasMore: boolean;
    nextPageCreditEstimate: number;
  } | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [outreachId, setOutreachId] = useState<string | null>(null);

  const refreshCampaigns = useCallback(async () => {
    setError(null);
    try {
      const res = await campaignApi.list();
      setCampaigns(res.data);
      if (res.data.length > 0 && !activeId) {
        setActiveId(res.data[0].id);
      }
      if (activeId && !res.data.find(c => c.id === activeId)) {
        setActiveId(res.data[0]?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns.');
    }
  }, [activeId]);

  const refreshUsage = useCallback(async () => {
    try {
      const u = await usageApi.me();
      setUsage({
        date: u.date,
        used: u.used,
        limit: u.limit,
        remaining: u.remaining,
        exceeded: u.exceeded,
      });
    } catch {
      // Non-critical; usage chip just won't render.
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshCampaigns(), refreshUsage()]);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshAlerts = useCallback(async () => {
    if (!activeId) return;
    try {
      const res = await campaignApi.getAlerts(activeId);
      setAlerts(res.data);
    } catch {
      // Non-critical
    }
  }, [activeId]);

  // Load candidates + alerts whenever the active campaign changes
  useEffect(() => {
    if (!activeId) {
      setCandidates([]);
      setAlerts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [c, a] = await Promise.all([
          campaignApi.listCandidates(activeId),
          campaignApi.getAlerts(activeId),
        ]);
        if (cancelled) return;
        setCandidates(c.data);
        setAlerts(a.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load campaign data.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const createCampaign = useCallback(async (input: CreateCampaignInput): Promise<CampaignDto> => {
    setCreating(true);
    setError(null);
    try {
      const res = await campaignApi.create(input);
      setIsSimulated(res.isSimulated);
      setSimulationReason(res.simulationReason ?? null);
      await refreshCampaigns();
      setActiveId(res.campaign.id);
      return res.campaign;
    } finally {
      setCreating(false);
    }
  }, [refreshCampaigns]);

  const sourceCandidates = useCallback(
    async (
      campaignId: string,
      opts: { page?: number; pageSize?: number; locations?: string[] } = {}
    ): Promise<void> => {
      setSourcing(true);
      setError(null);
      try {
        const res = await campaignApi.source(campaignId, opts);
        setIsSimulated(res.isSimulated);
        setSimulationReason(res.simulationReason ?? null);
        setScreening(res.screening);
        setSourcingPagination(res.pagination);
        // Always re-fetch the full list (response contains only newly-added rows).
        const full = await campaignApi.listCandidates(campaignId);
        setCandidates(full.data);
        if (res.usage) setUsage(res.usage);
        await refreshCampaigns();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sourcing failed.');
        throw err;
      } finally {
        setSourcing(false);
      }
    },
    [refreshCampaigns]
  );

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    await campaignApi.delete(id);
    await refreshCampaigns();
  }, [refreshCampaigns]);

  const addFromLinkedIn = useCallback(
    async (linkedinUrls: string[]): Promise<{
      addedCount: number;
      skipped: Array<{ url: string; reason: string }>;
    } | null> => {
      if (!activeId) return null;
      setError(null);
      const res = await campaignApi.addFromLinkedIn(activeId, linkedinUrls);
      // Refresh full candidate list so the new rows appear immediately.
      const full = await campaignApi.listCandidates(activeId);
      setCandidates(full.data);
      setUsage(res.usage);
      await refreshCampaigns();
      return { addedCount: res.addedCount, skipped: res.skipped };
    },
    [activeId, refreshCampaigns]
  );

  const updateCampaign = useCallback(
    async (
      id: string,
      input: {
        name?: string;
        location?: string;
        jobType?: string;
        department?: string;
        jobText?: string;
      }
    ): Promise<{ isSimulated: boolean; simulationReason?: string }> => {
      const res = await campaignApi.update(id, input);
      await refreshCampaigns();
      return { isSimulated: res.isSimulated, simulationReason: res.simulationReason };
    },
    [refreshCampaigns]
  );

  const resetCandidates = useCallback(
    async (id: string): Promise<number> => {
      const res = await campaignApi.resetCandidates(id);
      // If we just reset the active campaign, blank the local list.
      if (id === activeId) {
        setCandidates([]);
        setScreening(null);
      }
      return res.deleted;
    },
    [activeId]
  );

  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const enrichCandidate = useCallback(
    async (
      candidateId: string,
      opts: { force?: boolean } = {}
    ): Promise<{ isSimulated: boolean; simulationReason?: string; fromCache: boolean } | null> => {
      if (!activeId) return null;
      setEnrichingId(candidateId);
      setError(null);
      try {
        const res = await campaignApi.enrichCandidate(activeId, candidateId, opts);
        setCandidates(prev =>
          prev.map(c => (c.id === candidateId ? res.candidate : c))
        );
        return {
          isSimulated: res.isSimulated,
          simulationReason: res.simulationReason,
          fromCache: res.fromCache,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Enrichment failed.');
        throw err;
      } finally {
        setEnrichingId(null);
      }
    },
    [activeId]
  );

  const sendOutreach = useCallback(
    async (
      candidateId: string,
      overrides?: { subject?: string; body?: string }
    ): Promise<{ isSimulated: boolean; simulationReason?: string } | null> => {
      if (!activeId) return null;
      setOutreachId(candidateId);
      setError(null);
      try {
        const res = await campaignApi.sendOutreach(activeId, candidateId, overrides ?? {});
        setCandidates(prev =>
          prev.map(c => (c.id === candidateId ? res.candidate : c))
        );
        setUsage(res.usage);
        // After outreach, alerts may shift (this candidate is now in the
        // OUTREACH_SENT bucket). Re-fetch.
        await refreshAlerts();
        return { isSimulated: res.isSimulated, simulationReason: res.simulationReason };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Outreach failed.');
        throw err;
      } finally {
        setOutreachId(null);
      }
    },
    [activeId, refreshAlerts]
  );

  const markReplied = useCallback(
    async (candidateId: string): Promise<void> => {
      if (!activeId) return;
      try {
        const res = await campaignApi.markReplied(activeId, candidateId);
        setCandidates(prev =>
          prev.map(c => (c.id === candidateId ? res.candidate : c))
        );
        await refreshAlerts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not mark replied.');
        throw err;
      }
    },
    [activeId, refreshAlerts]
  );

  const activeCampaign = activeId ? campaigns.find(c => c.id === activeId) ?? null : null;

  return {
    campaigns,
    activeCampaign,
    activeId,
    setActiveId,
    candidates,
    loading,
    sourcing,
    creating,
    error,
    setError,
    isSimulated,
    simulationReason,
    screening,
    sourcingPagination,
    usage,
    refreshUsage,
    enrichCandidate,
    enrichingId,
    sendOutreach,
    markReplied,
    outreachId,
    alerts,
    refreshAlerts,
    createCampaign,
    updateCampaign,
    sourceCandidates,
    addFromLinkedIn,
    resetCandidates,
    deleteCampaign,
    refreshCampaigns,
  };
}
