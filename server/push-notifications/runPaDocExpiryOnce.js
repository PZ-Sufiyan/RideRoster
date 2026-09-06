import 'dotenv/config'
import { createSupabaseAdminClient } from './supabaseClient.js'
import { runPaDocumentExpirySuspendTick } from './paDocumentExpirySuspendScheduler.js'

const supabase = createSupabaseAdminClient()
const summary = await runPaDocumentExpirySuspendTick(supabase)
console.log('PA document expiry suspend tick', summary)
process.exit(0)
