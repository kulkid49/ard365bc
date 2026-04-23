import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{title}</div>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Shell ready. Detailed UI spec plugs in here.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Left Card</CardTitle>
          </CardHeader>
          <CardContent className="h-44" />
        </Card>
        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Center Card</CardTitle>
          </CardHeader>
          <CardContent className="h-44" />
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Right Card</CardTitle>
          </CardHeader>
          <CardContent className="h-44" />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full-width Card</CardTitle>
        </CardHeader>
        <CardContent className="h-44" />
      </Card>
    </div>
  )
}

