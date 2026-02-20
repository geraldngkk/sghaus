/** Skeleton loading state shown while analysis is running */
export default function AnalysisSkeleton() {
  return (
    <section>
      {/* Offer cards skeleton */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10 sm:py-14">
          <div className="skeleton h-4 w-28 mb-2" />
          <div className="skeleton h-8 w-64 mb-1" />
          <div className="skeleton h-4 w-48 mt-2" />

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-border bg-white p-6 sm:p-7"
              >
                <div className="skeleton h-5 w-24 rounded-full" />
                <div className="skeleton mt-4 h-12 w-40" />
                <div className="skeleton mt-2 h-4 w-32" />
                <div className="mt-4 border-t border-border/60 pt-4">
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton mt-2 h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis sections skeleton */}
      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10">
        <div className="skeleton h-7 w-32 mb-2" />
        <div className="skeleton h-4 w-64" />

        <div className="mt-8 space-y-8">
          {/* Market context skeleton */}
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="skeleton h-5 w-36 mb-4" />
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="skeleton h-3 w-20 mb-2" />
                  <div className="skeleton h-6 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Cost breakdown skeleton */}
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="skeleton h-5 w-36 mb-6" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-8 w-full" />
              ))}
            </div>
          </div>

          {/* Risk flags skeleton */}
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="skeleton h-5 w-24 mb-4" />
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
