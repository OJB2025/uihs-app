export function describeAuditAction(method: string, route: string) {
  const path = route.replace(/^\/api(?=\/)/, '')
  const login = path.match(/^\/auth\/(admin|staff|guardian)\/login$/)
  if (login && method === 'POST') return `Signed in to the ${login[1]} workspace.`
  if (path === '/auth/register' && method === 'POST') return 'Created a guardian profile.'
  if (path === '/admin/audit-logs' && method === 'GET') return 'Viewed the account activity history.'
  if (path === '/me' && method === 'GET') return 'Viewed the signed-in account profile.'
  if (/^\/media\/[^/]+\/download$/.test(path) && method === 'GET') return 'Downloaded a client photo or video.'
  if (/^\/media\/[^/]+\/content$/.test(path) && method === 'GET') return 'Viewed a client photo or video.'
  if (path === '/chat/staff' && method === 'GET') return 'Viewed the staff directory.'
  if (path === '/chat/staff-conversations' && method === 'POST') return 'Started a direct staff conversation.'
  if (path === '/chat/conversations' && method === 'POST') return 'Started an admin-to-staff conversation.'
  if (/^\/chat\/conversations\/[^/]+\/messages$/.test(path)) return method === 'POST' ? 'Sent a team chat message.' : 'Viewed team chat messages.'
  if (/^\/notifications\/[^/]+\/read$/.test(path) && method === 'PATCH') return 'Marked a staff notification as read.'
  if (path === '/notifications' && method === 'GET') return 'Viewed staff notifications.'
  if (/^\/children\/[^/]+\/activity-plans$/.test(path)) return method === 'POST' ? 'Added an activity to a client’s weekly or monthly plan.' : 'Viewed a client’s weekly or monthly plan.'
  if (/^\/children\/activity-plans\/[^/]+$/.test(path) && method === 'PATCH') return 'Updated a client’s activity plan.'
  if (/^\/children\/[^/]+\/activities$/.test(path)) return method === 'POST' ? 'Added a completed activity to a client’s log.' : 'Viewed a client’s completed activity log.'
  if (/^\/children\/[^/]+\/goals$/.test(path)) return method === 'POST' ? 'Added a development goal for a client.' : 'Viewed a client’s development goals.'
  if (/^\/goals\/[^/]+$/.test(path) && method === 'PATCH') return 'Updated a client’s development goal.'
  if (/^\/children\/[^/]+\/ratings$/.test(path)) return method === 'POST' ? 'Recorded a client performance rating.' : 'Viewed a client’s performance ratings.'
  if (/^\/children\/[^/]+\/media$/.test(path)) return method === 'POST' ? 'Uploaded a photo or video for a client.' : 'Viewed a client’s photo and video gallery.'
  if (/^\/children\/[^/]+\/reviews$/.test(path)) return method === 'POST' ? 'Submitted a family review for a client.' : 'Viewed family reviews for a client.'
  if (path === '/staff' && method === 'GET') return 'Viewed staff profiles.'
  if (path === '/staff' && method === 'POST') return 'Created a staff profile.'
  if (/^\/staff\/[^/]+$/.test(path)) return method === 'PATCH' ? 'Updated a staff profile.' : method === 'DELETE' ? 'Deactivated a staff account.' : 'Viewed a staff profile.'
  if (path === '/guardians' && method === 'GET') return 'Viewed guardian profiles.'
  if (path === '/guardians' && method === 'POST') return 'Created a guardian profile.'
  if (/^\/guardians\/[^/]+$/.test(path)) return method === 'PATCH' ? 'Updated a guardian profile.' : method === 'DELETE' ? 'Deactivated a guardian account.' : 'Viewed a guardian profile.'
  if (path === '/children' && method === 'GET') return 'Viewed client records.'
  if (path === '/children' && method === 'POST') return 'Created a client record.'
  if (/^\/children\/[^/]+$/.test(path)) return method === 'PATCH' ? 'Updated a client record.' : method === 'DELETE' ? 'Archived a client record.' : 'Viewed a client record.'
  if (path === '/child-guardians' && method === 'POST') return 'Linked a guardian to a client.'
  if (path === '/child-guardians' && method === 'GET') return 'Viewed guardian-to-client links.'
  if (path === '/staff-assignments' && method === 'POST') return 'Assigned a staff member to a client.'
  if (/^\/staff-assignments\/[^/]+\/end$/.test(path) && method === 'POST') return 'Ended a staff-to-client assignment.'
  if (path === '/staff-assignments' && method === 'GET') return 'Viewed staff assignments.'

  const resource = path.split('/').filter((part) => part && !part.startsWith(':')).at(-1)?.replaceAll('-', ' ') ?? 'account information'
  if (method === 'GET') return `Viewed ${resource}.`
  if (method === 'POST') return `Added a ${resource} record.`
  if (method === 'PATCH' || method === 'PUT') return `Updated a ${resource} record.`
  if (method === 'DELETE') return `Removed a ${resource} record.`
  return `Accessed ${resource}.`
}