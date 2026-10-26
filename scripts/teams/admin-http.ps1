# Shared transport only; no credentials, state changes or retries are defined here.
function Invoke-TeamsAdminHttp {
  param([string]$Uri, [hashtable]$Headers, [string]$Body, [switch]$DirectConnection)
  if (!$DirectConnection -or (Get-Command Invoke-RestMethod).Parameters.ContainsKey('NoProxy')) {
    $options = @{}
    if ($DirectConnection) { $options.NoProxy = $true }
    return Invoke-RestMethod @options -Uri $Uri -Method Post -Headers $Headers -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($Body)) -TimeoutSec 30
  }
  # Windows PowerShell 5.1: proxy bypass is per request, never a global change.
  # Keep Windows certificate validation. Restore the process TLS setting even on failure.
  $previousTls = [Net.ServicePointManager]::SecurityProtocol
  $request = $null; $response = $null; $stream = $null; $reader = $null
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $request = [Net.HttpWebRequest]::Create($Uri)
    $request.Proxy = $null
    $request.Method = 'POST'
    $request.AllowAutoRedirect = $false
    $request.Timeout = 30000
    $request.ReadWriteTimeout = 30000
    $request.ContentType = 'application/json; charset=utf-8'
    foreach ($key in $Headers.Keys) { $request.Headers[$key] = $Headers[$key] }
    $bytes = [Text.Encoding]::UTF8.GetBytes($Body)
    $request.ContentLength = $bytes.Length
    $stream = $request.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Dispose(); $stream = $null
    $response = $request.GetResponse()
    if ([int]$response.StatusCode -lt 200 -or [int]$response.StatusCode -ge 300) {
      throw (New-Object System.Net.WebException('HTTP rejected', $null, [Net.WebExceptionStatus]::ProtocolError, $response))
    }
    $reader = New-Object IO.StreamReader($response.GetResponseStream(), [Text.Encoding]::UTF8)
    return ($reader.ReadToEnd() | ConvertFrom-Json)
  } finally {
    if ($reader) { $reader.Dispose() }
    if ($stream) { $stream.Dispose() }
    if ($response) { $response.Dispose() }
    if ($request) { $request.Abort() }
    [Net.ServicePointManager]::SecurityProtocol = $previousTls
  }
}

function Get-TeamsAdminHttpFailure {
  param([Exception]$Exception)
  $category = 'local_error'; $httpStatus = $null
  $cause = $Exception
  while ($cause) {
    if ($cause.PSObject.Properties['Response'] -and $cause.Response) {
      $httpStatus = [int]$cause.Response.StatusCode
    }
    if ($cause -is [Management.Automation.ParameterBindingException]) { $category = 'unsupported_parameter' }
    elseif ($cause -is [Net.Sockets.SocketException]) { $category = 'socket_' + $cause.SocketErrorCode }
    elseif ($cause -is [Security.Authentication.AuthenticationException]) { $category = 'tls_error' }
    elseif ($cause -is [Threading.Tasks.TaskCanceledException]) { $category = 'timeout_or_cancelled' }
    elseif ($cause -is [Net.WebException]) {
      $category = switch ($cause.Status.ToString()) {
        'NameResolutionFailure' { 'dns_failure' }
        'ProxyNameResolutionFailure' { 'proxy_dns_failure' }
        'ConnectFailure' { 'connection_failure' }
        'Timeout' { 'timeout' }
        'TrustFailure' { 'certificate_validation_failed' }
        'SecureChannelFailure' { 'tls_error' }
        'ProtocolError' { 'http_rejection' }
        default { 'transport_' + $cause.Status.ToString() }
      }
    }
    $cause = $cause.InnerException
  }
  if ($httpStatus) {
    $category = switch ($httpStatus) {
      401 { 'authentication_rejected' }
      403 { 'permission_denied' }
      407 { 'proxy_authentication_required' }
      429 { 'rate_limited' }
      default { 'http_rejection' }
    }
  }
  return [pscustomobject]@{ Category = $category; HttpStatus = $httpStatus }
}
