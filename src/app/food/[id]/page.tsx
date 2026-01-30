/* eslint-disable react/no-unescaped-entities */
'use client'

import { Loader2 } from 'lucide-react'
import { use as usePromise } from 'react'

import { Footer, Navbar, ScrollToTop } from '@/components/landing'
import FoodDetailsClient from './food-details-client';
import { useFoodByIdQuery } from '@/queries/foods'

export default function FoodPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = usePromise(params)
  const id = typeof resolvedParams?.id === 'string' ? resolvedParams.id : ''
  const query = useFoodByIdQuery(id)

  return (
    <main className="min-h-screen">
      <Navbar />

      {query.isLoading ? (
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading food…
        </div>
      ) : query.isError ? (
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-lg border p-4 text-sm">
            <div className="font-medium text-foreground">Couldn't load that food</div>
            <div className="mt-1 text-muted-foreground">
              {query.error instanceof Error ? query.error.message : 'Unknown error'}
            </div>
          </div>
        </div>
      ) : !query.data ? (
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-lg border p-4 text-sm">
            <div className="font-medium text-foreground">Food not found</div>
          </div>
        </div>
      ) : (
        <FoodDetailsClient food={query.data} />
      )}

      <Footer />
      <ScrollToTop />
    </main>
  )
}
