import { afterEach, describe, expect, it, vi } from 'vitest'

import { loginUser, logoutUser, registerUser, restoreSession } from './auth'

const jsonResponse = (body: unknown, status = 200) =>
  ({
    headers: {
      get: () => 'application/json',
    },
    json: vi.fn().mockResolvedValue(body),
    ok: status >= 200 && status < 300,
    status,
  }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('registerUser', () => {
  it('sends the exact backend DTO with credentials enabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          access_token: 'access-token',
          user: { id: 'user-id', email: 'user@example.com' },
        },
        201,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      registerUser({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      user: { id: 'user-id', email: 'user@example.com' },
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/register')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
      }),
      credentials: 'include',
      method: 'POST',
    })
  })

  it('preserves the backend error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'email_already_exists',
              message: 'Email already exists',
            },
          },
          409,
        ),
      ),
    )

    const request = registerUser({
      email: 'user@example.com',
      password: 'password123',
    })

    await expect(request).rejects.toMatchObject({
      code: 'email_already_exists',
      status: 409,
    })
  })
})

describe('loginUser', () => {
  it('stores the backend session response and sends credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        access_token: 'access-token',
        user: { id: 'user-id', email: 'user@example.com' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loginUser({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      user: { id: 'user-id', email: 'user@example.com' },
    })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/login')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
      }),
      credentials: 'include',
      method: 'POST',
    })
  })
})

describe('restoreSession', () => {
  it('refreshes the cookie session before requesting the current user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'refreshed-access-token' }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          user: { id: 'user-id', email: 'user@example.com' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(restoreSession()).resolves.toEqual({
      accessToken: 'refreshed-access-token',
      user: { id: 'user-id', email: 'user@example.com' },
    })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/refresh')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'include',
      method: 'POST',
    })
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/me')
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      credentials: 'include',
      headers: expect.objectContaining({
        Authorization: 'Bearer refreshed-access-token',
      }),
    })
  })
})

describe('logoutUser', () => {
  it('ends the refresh-cookie session with credentials enabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      headers: {
        get: () => null,
      },
      ok: true,
      status: 204,
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    await expect(logoutUser()).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/logout')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'include',
      method: 'POST',
    })
  })
})
