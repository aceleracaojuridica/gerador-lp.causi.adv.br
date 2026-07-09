"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type LeadDto,
  type LeadLandingPageDto,
  listLeadsAction,
} from "@/app/actions/leads";
import { showLpMessageError } from "@/lib/toast";

const ALL_LPS = "__all__";

export function useLeads() {
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [landingPages, setLandingPages] = useState<LeadLandingPageDto[]>([]);
  const [lpFilter, setLpFilter] = useState(ALL_LPS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (slug?: string) => {
    setLoading(true);
    const res = await listLeadsAction(
      slug && slug !== ALL_LPS ? { landingPageSlug: slug } : {},
    );
    setLoading(false);
    if (!res.ok) {
      showLpMessageError(res.error);
      return;
    }
    setLeads(res.leads);
    setLandingPages(res.landingPages);
  }, []);

  useEffect(() => {
    void load(lpFilter);
  }, [load, lpFilter]);

  return {
    leads,
    landingPages,
    loading,
    lpFilter,
    setLpFilter,
    reload: () => load(lpFilter),
    allLpsValue: ALL_LPS,
  };
}
