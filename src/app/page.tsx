"use client";

import React, { useEffect, useState } from 'react';
import Dashboard from "@/components/Dashboard";
import { calculateMetrics } from '@/utils/calculator';
import { MetricResult } from '@/utils/types';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  return (
    <main>
      <Dashboard />
    </main>
  );
}
