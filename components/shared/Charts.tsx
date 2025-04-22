'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useEvents, useEventsActions } from '@/providers/stores/storeProvider';

// import { TokenEvent } from '@/stores/slices/historySlice'; // No longer needed here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EventTypeSummaryChart from '@/components/charts/EventTypeSummaryChart'; // Import the chart
import TokenDistributionChart from '@/components/charts/TokenDistributionChart'; // Import the new chart

export default function Charts() {
  const { address: walletAddress } = useAccount();
  const events = useEvents();
  const { fetchEvents } = useEventsActions();

  useEffect(() => {
    if (walletAddress && events.length === 0) {
      console.log('[StatsPage] Fetching events...');
      fetchEvents(walletAddress);
    }
  }, [walletAddress, events.length, fetchEvents]);

  // Data processing is handled within the chart component

  return (
    <>
      {!walletAddress ? (
        <p>Please connect your wallet.</p>
      ) : events.length === 0 ? (
        <p>Loading event data or no events found...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Type Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Replace placeholder with the actual chart */}
              <EventTypeSummaryChart events={events} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Replace placeholder with the actual chart */}
              <TokenDistributionChart events={events} />
            </CardContent>
          </Card>

          {/* Add more chart placeholders as needed */}
        </div>
      )}
    </>
  );
}
