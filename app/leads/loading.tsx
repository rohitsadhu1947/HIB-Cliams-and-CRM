import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LeadsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 flex-1 min-w-[200px]" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-10 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-4" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-10 gap-4">
                {Array.from({ length: 10 }).map((_, j) => (
                  <Skeleton key={j} className="h-8" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
