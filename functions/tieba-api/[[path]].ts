type PagesContext = {
  request: Request
  params: Record<string, string | string[] | undefined>
}

function getUpstreamPath(params: PagesContext['params']): string {
  const raw = params.path
  if (Array.isArray(raw)) return raw.join('/')
  return raw ?? ''
}

function isAllowedPath(pathname: string): boolean {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`
  return p.startsWith('/c/') || p.startsWith('/mo/')
}

export async function onRequest({ request, params }: PagesContext): Promise<Response> {
  const url = new URL(request.url)
  const upstreamPath = getUpstreamPath(params)

  const normalizedPath = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`
  if (!isAllowedPath(normalizedPath)) {
    return new Response('Not Found', { status: 404 })
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  const upstreamUrl = `https://tieba.baidu.com${normalizedPath}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('origin')

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'follow'
  })

  const responseHeaders = new Headers(upstreamResponse.headers)
  responseHeaders.set('cache-control', 'no-store')

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders
  })
}

