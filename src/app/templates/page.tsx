import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CloneTemplateForm from '@/components/trips/CloneTemplateForm'

interface TemplateItem {
  day_number: number
  title: string
  item_type: string
}

interface Template {
  id: string
  name: string
  destination: string
  duration_days: number
  description: string | null
  cloned_count: number
  created_at: string
  template_items: TemplateItem[]
}

async function getTemplates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()
  const { data: templates } = await serviceSupabase
    .from('trip_templates')
    .select('*, template_items(*)')
    .eq('is_public', true)
    .order('cloned_count', { ascending: false })

  return { templates: (templates || []) as Template[], userId: user.id }
}

export default async function TemplatesPage() {
  const data = await getTemplates()
  if (!data) redirect('/auth/login')

  const { templates } = data

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">🗺️ Trip Templates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pre-built itineraries from the community. Clone one to start planning faster.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
          <p className="text-4xl mb-3">✈️</p>
          <p className="text-gray-600 font-medium">No templates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Finish a trip and publish it as a template to help others plan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-stone-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">{t.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    📍 {t.destination} · {t.duration_days} day{t.duration_days !== 1 ? 's' : ''}
                    {t.cloned_count > 0 && ` · ${t.cloned_count} clones`}
                  </p>
                  {t.description && (
                    <p className="text-sm text-gray-600 mt-2">{t.description}</p>
                  )}
                  {t.template_items.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t.template_items.length} activities
                      {t.template_items.length > 0 &&
                        ` · ${t.template_items.slice(0, 3).map((i) => i.title).join(', ')}${t.template_items.length > 3 ? '…' : ''}`
                      }
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <CloneTemplateForm
                  templateId={t.id}
                  templateName={t.name}
                  destination={t.destination}
                  durationDays={t.duration_days}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
