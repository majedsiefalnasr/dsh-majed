/**
 * GitHub OAuth device-authorization flow (RFC 8628) for providers that cannot
 * use the loopback redirect engine: no redirect URI, no PKCE, no client
 * secret. The user opens a verification URL and types a short code while the
 * plugin polls the token endpoint until GitHub releases the access token.
 * The management model (one attempt per provider, `isBusy`/`pending`/`cancel`)
 * mirrors {@link OAuthFlowManager} so the auth controller can treat both
 * engines uniformly.
 */
import { proxiedFetch } from '../http.js'

/** Default poll interval when the device-code response omits one. */
const DEFAULT_INTERVAL_SEC = 5

/** Default device-code lifetime when the response omits one (GitHub: 15 minutes). */
const DEFAULT_EXPIRES_IN_SEC = 900

/** Static per-provider device-flow facts. */
export interface DeviceFlowSpec {
  /** OAuth App / GitHub App client id the device code is requested for. */
  clientId: string
  /** Scope string requested at device-code time. */
  scope: string
  /** Device-code endpoint (e.g. `https://github.com/login/device/code`). */
  deviceCodeUrl: string
  /** Token polling endpoint (e.g. `https://github.com/login/oauth/access_token`). */
  tokenUrl: string
  /** Fetch implementation (injectable for tests). */
  fetchFn?: typeof fetch
}

/** One in-flight device-flow login attempt. */
export interface DeviceAttempt {
  /** URL the user opens to authorize (e.g. `https://github.com/login/device`). */
  readonly verificationUrl: string
  /** Short code the user types at the verification URL. */
  readonly userCode: string
  /**
   * Poll until GitHub releases the access token.
   * @returns the GitHub OAuth access token; rejects on timeout, denial, or cancel.
   */
  waitToken(): Promise<string>
  /** Abort the attempt; `waitToken` rejects with a cancellation error. */
  cancel(): void
}

/** Raw device-code response shape (subset). */
interface DeviceCodeWire {
  device_code?: string
  user_code?: string
  verification_uri?: string
  interval?: number
  expires_in?: number
}

/** Raw token-poll response shape (subset): success or an RFC 8628 error code. */
interface DeviceTokenWire {
  access_token?: string
  error?: string
  error_description?: string
}

/** Sleep for `ms`, rejecting early when the signal aborts. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error('aborted'))
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    timer.unref()
    const onAbort = (): void => {
      clearTimeout(timer)
      reject(signal.reason instanceof Error ? signal.reason : new Error('aborted'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Own the set of in-flight device-flow attempts, keyed by provider. One
 * attempt per provider at a time; an attempt removes itself when it settles.
 */
export class DeviceFlowManager {
  private attempts = new Map<string, DeviceAttempt>()

  /**
   * Whether a device-flow attempt is running for one provider.
   * @param provider - the provider route.
   * @returns true while an attempt is polling.
   */
  isBusy(provider: string): boolean {
    return this.attempts.has(provider)
  }

  /**
   * The pending attempt for one provider, when any.
   * @param provider - the provider route.
   * @returns the in-flight attempt, or `undefined`.
   */
  pending(provider: string): DeviceAttempt | undefined {
    return this.attempts.get(provider)
  }

  /**
   * Start a device-flow attempt: request a device code, then poll the token
   * endpoint in the background of `waitToken`.
   * @param provider - the provider route (one attempt at a time).
   * @param spec - static flow facts for this provider.
   * @returns the live attempt; its `waitToken()` settles the login.
   * @throws when an attempt is already running or the device-code request fails.
   */
  async start(provider: string, spec: DeviceFlowSpec): Promise<DeviceAttempt> {
    if (this.attempts.has(provider)) {
      throw new Error(`a ${provider} login attempt is already in progress`)
    }
    const fetchFn = spec.fetchFn ?? proxiedFetch
    const controller = new AbortController()
    let resolveToken!: (token: string) => void
    let rejectToken!: (error: Error) => void
    const tokenPromise = new Promise<string>((resolve, reject) => { resolveToken = resolve; rejectToken = reject })
    tokenPromise.catch(() => undefined)
    let timer: ReturnType<typeof setTimeout>
    const settle = (error?: Error, token?: string): void => {
      if (this.attempts.get(provider) !== attempt) return
      this.attempts.delete(provider)
      clearTimeout(timer)
      if (error !== undefined) { rejectToken(error); controller.abort(error) }
      else if (token !== undefined) resolveToken(token)
    }
    const attempt: DeviceAttempt = {
      verificationUrl: '', userCode: '',
      waitToken: () => tokenPromise,
      cancel: () => settle(new Error('login cancelled')),
    }
    // Reserve before the first await: cancellation during acquisition owns this exact slot.
    this.attempts.set(provider, attempt)
    timer = setTimeout(() => settle(new Error('device-code request timed out')), 30_000)
    timer.unref()
    const bounded = <T>(work: Promise<T>): Promise<T> => new Promise((resolve, reject) => {
      const signal = controller.signal
      const abort = (): void => reject(signal.reason)
      if (signal.aborted) { abort(); return }
      signal.addEventListener('abort', abort, { once: true })
      work.then(value => {
        signal.removeEventListener('abort', abort)
        if (signal.aborted) reject(signal.reason)
        else resolve(value)
      }, error => { signal.removeEventListener('abort', abort); reject(error) })
    })
    try {
      const response = await bounded(fetchFn(spec.deviceCodeUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ client_id: spec.clientId, scope: spec.scope }).toString(),
        signal: controller.signal,
      }))
      if (!response.ok) {
        throw new Error(`${provider} device-code request failed (HTTP ${String(response.status)})`)
      }
      const wire = await bounded(response.json()) as DeviceCodeWire
      if (typeof wire.device_code !== 'string' || wire.device_code.length === 0
        || typeof wire.user_code !== 'string' || wire.user_code.length === 0
        || typeof wire.verification_uri !== 'string' || wire.verification_uri.length === 0) {
        throw new Error(`${provider} device-code response is missing device_code/user_code/verification_uri`)
      }
      const intervalSec = typeof wire.interval === 'number' && wire.interval > 0
        ? wire.interval
        : DEFAULT_INTERVAL_SEC
      const expiresInSec = typeof wire.expires_in === 'number' && wire.expires_in > 0
        ? wire.expires_in
        : DEFAULT_EXPIRES_IN_SEC

      clearTimeout(timer)
      const deadline = Date.now() + expiresInSec * 1000
      timer = setTimeout(() => settle(new Error('device code expired')), expiresInSec * 1000)
      timer.unref()
      Object.assign(attempt, { verificationUrl: wire.verification_uri, userCode: wire.user_code })

      const poll = async (): Promise<void> => {
        let intervalMs = intervalSec * 1000
        while (true) {
          await sleep(intervalMs, controller.signal)
          if (Date.now() >= deadline) {
            settle(new Error(`login timed out after ${String(Math.round(expiresInSec))}s`))
            return
          }
          const pollResponse = await bounded(fetchFn(spec.tokenUrl, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: spec.clientId,
              device_code: wire.device_code as string,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }).toString(),
            signal: controller.signal,
          }))
          const result = await bounded(pollResponse.json()) as DeviceTokenWire
          if (Date.now() >= deadline) throw new Error('device code expired')
          if (typeof result.access_token === 'string' && result.access_token.length > 0) {
            settle(undefined, result.access_token)
            return
          }
          switch (result.error) {
            case 'authorization_pending':
              break
            case 'slow_down':
              // RFC 8628 §3.5: add five seconds to the poll interval.
              intervalMs += 5000
              break
            case 'access_denied':
              settle(new Error('login declined on the GitHub authorization page'))
              return
            case 'expired_token':
              settle(new Error('the device code expired before authorization completed'))
              return
            default:
              settle(new Error(
                `${provider} device-flow polling failed (HTTP ${String(pollResponse.status)})`,
              ))
              return
          }
        }
      }

      void poll().catch((error: unknown) => {
        // Aborts land here from sleep/fetch; everything else is a transport or
        // parse failure worth surfacing as the login failure.
        settle(controller.signal.aborted ? controller.signal.reason : new Error(`${provider} device-flow polling failed`))
      })
      return attempt
    } catch (error) {
      const failure = controller.signal.aborted ? controller.signal.reason : new Error(`${provider} device-code request failed or response is missing required fields`)
      settle(failure)
      throw failure
    }
  }
}
