import { auth, signIn } from '@/server/auth'
import { db } from '@/server/db'
import { sessions } from '@/server/db/schema'
import { and, eq, gt } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates that a callback URL is localhost only for security
 */
function isValidLocalhostCallback(url: string): boolean {
	try {
		const parsed = new URL(url)
		const hostname = parsed.hostname.toLowerCase()
		return (
			(parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
			(hostname === 'localhost' || hostname === '127.0.0.1') &&
			parsed.port !== '' // Must have explicit port
		)
	} catch (error) {
		console.error('[game-auth] Invalid URL format:', url, error)
		return false
	}
}

/**
 * Returns an HTML success page for successful Discord authentication
 */
function successResponse(callbackUrl: string, token: string, userId: string) {
	// URL encode the token and userId for the callback
	const encodedToken = encodeURIComponent(token)
	const encodedUserId = encodeURIComponent(userId)
	const redirectUrl = `${callbackUrl}?token=${encodedToken}&user_id=${encodedUserId}`

	const html = `
<!DOCTYPE html>
<html>
<head>
	<title>Discord Connected</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			max-width: 600px;
			margin: 50px auto;
			padding: 20px;
			background: #1a1a1a;
			color: #e0e0e0;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 80vh;
		}
		.success-icon {
			font-size: 64px;
			margin-bottom: 20px;
		}
		h1 { 
			color: #4ade80; 
			margin: 0 0 10px 0;
			text-align: center;
		}
		.message { 
			background: #1a2a1a; 
			padding: 20px; 
			border-radius: 8px; 
			border-left: 4px solid #4ade80;
			margin-top: 20px;
			text-align: center;
		}
		.status {
			color: #86efac;
			font-size: 14px;
			margin-top: 10px;
		}
	</style>
</head>
<body>
	<div class="success-icon">✓</div>
	<h1>Discord Connected Successfully!</h1>
	<div class="message">
		<p>Your Discord account has been successfully connected.</p>
		<p><strong>Please return to Balatro to continue.</strong></p>
		<p class="status" id="status">Sending authentication to game...</p>
	</div>
</body>
<script>
	// Send token to game in the background
	(function() {
		const callbackUrl = ${JSON.stringify(callbackUrl)};
		const token = ${JSON.stringify(token)};
		const userId = ${JSON.stringify(userId)};
		const redirectUrl = callbackUrl + '?token=' + encodeURIComponent(token) + '&user_id=' + encodeURIComponent(userId);
		
		(async () => {
			try {
				const response = await fetch(redirectUrl, {
					method: 'GET',
					mode: 'no-cors'
				});
				document.getElementById('status').textContent = 'Authentication sent to game successfully!';
				document.getElementById('status').style.color = '#4ade80';
			} catch (error) {
				// no-cors mode doesn't allow reading response, but request was sent
				document.getElementById('status').textContent = 'Authentication sent to game.';
				document.getElementById('status').style.color = '#4ade80';
			}
		})();
	})();
</script>
</html>
	`
	return new NextResponse(html, {
		status: 200,
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	})
}

/**
 * Returns an HTML error page instead of JSON for browser requests
 */
function errorResponse(message: string, status: number, details?: string) {
	const html = `
<!DOCTYPE html>
<html>
<head>
	<title>Discord Auth Error</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			max-width: 600px;
			margin: 50px auto;
			padding: 20px;
			background: #1a1a1a;
			color: #e0e0e0;
		}
		h1 { color: #ff4444; }
		h2 { color: #ffaa44; margin-top: 20px; }
		.error { background: #2a1a1a; padding: 15px; border-radius: 5px; border-left: 4px solid #ff4444; }
		.details { background: #1a2a2a; padding: 10px; border-radius: 5px; margin-top: 10px; font-family: monospace; font-size: 12px; color: #aaa; }
	</style>
</head>
<body>
	<h1>Discord Authentication Error</h1>
	<div class="error">
		<p><strong>Error:</strong> ${message}</p>
		${details ? `<div class="details">${details}</div>` : ''}
	</div>
	<h2>What to do:</h2>
	<ul>
		<li>Make sure you're using the latest version of the game</li>
		<li>Try clicking "Connect with Discord" again</li>
		<li>If the problem persists, check the game logs for more details</li>
	</ul>
</body>
</html>
	`
	return new NextResponse(html, {
		status,
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	})
}

/**
 * Game auth endpoint that handles Discord OAuth flow and redirects to localhost with token
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const rawCallbackUrl = searchParams.get('callback_url')
	const callbackUrl = rawCallbackUrl || 'http://localhost:8789/callback'

	console.log('[game-auth] Request received:', {
		rawCallbackUrl,
		callbackUrl,
		url: request.url,
		userAgent: request.headers.get('user-agent'),
		referer: request.headers.get('referer'),
	})

	// Validate callback URL is localhost only
	if (!isValidLocalhostCallback(callbackUrl)) {
		const errorDetails = `Received callback URL: "${rawCallbackUrl || '(missing)'}"\n` +
			`Parsed callback URL: "${callbackUrl}"\n` +
			`Full request URL: "${request.url}"\n\n` +
			`Callback URL must:\n` +
			`- Use http:// or https:// protocol\n` +
			`- Point to localhost or 127.0.0.1\n` +
			`- Include an explicit port number`

		console.error('[game-auth] Invalid callback URL:', {
			rawCallbackUrl,
			callbackUrl,
			requestUrl: request.url,
		})

		return errorResponse(
			'Invalid callback URL. The callback URL must point to localhost with an explicit port.',
			400,
			errorDetails
		)
	}

	// Check if user is authenticated
	const session = await auth()

	console.log('[game-auth] Session check:', {
		hasSession: !!session,
		hasUser: !!session?.user,
		userId: session?.user?.id,
		discordId: session?.user?.discord_id,
	})

	if (!session?.user) {
		// Not authenticated - redirect to sign-in
		// Preserve callback_url in the callbackUrl param so we can redirect back here
		const currentUrl = new URL(request.url)

		console.log('[game-auth] Not authenticated, redirecting to sign-in:', {
			currentUrl: currentUrl.toString(),
		})

		// Use NextAuth v5 signIn function which handles the redirect properly
		return signIn('discord', {
			callbackUrl: currentUrl.toString(),
		})
	}

	// User is authenticated - get session token from database
	try {
		console.log('[game-auth] Fetching session from database for user:', session.user.id)
		const userSession = await db.query.sessions.findFirst({
			where: and(
				eq(sessions.userId, session.user.id),
				gt(sessions.expires, new Date())
			),
		})

		if (!userSession) {
			console.error('[game-auth] Session not found or expired for user:', {
				userId: session.user.id,
				discordId: session.user.discord_id,
			})
			return errorResponse(
				'Session not found or expired. Please try signing in again.',
				401,
				`User ID: ${session.user.id}\nDiscord ID: ${session.user.discord_id || '(missing)'}`
			)
		}

		const sessionToken = userSession.sessionToken
		const discordId = session.user.discord_id

		console.log('[game-auth] Session found:', {
			hasToken: !!sessionToken,
			hasDiscordId: !!discordId,
			discordId,
			tokenLength: sessionToken?.length,
		})

		if (!sessionToken || !discordId) {
			console.error('[game-auth] Missing session token or Discord ID:', {
				hasToken: !!sessionToken,
				hasDiscordId: !!discordId,
				userId: session.user.id,
				sessionToken: userSession.sessionToken,
			})
			return errorResponse(
				'Missing session token or Discord ID. This is a server configuration issue.',
				500,
				`User ID: ${session.user.id}\n` +
				`Has Token: ${!!sessionToken}\n` +
				`Has Discord ID: ${!!discordId}\n` +
				`Session Token: ${userSession.sessionToken || '(missing)'}`
			)
		}

		console.log('[game-auth] Authentication successful:', {
			hasToken: !!sessionToken,
			discordId,
			callbackUrl,
		})

		// Show success page instead of redirecting to localhost
		// The success page will send the token to localhost in the background
		return successResponse(callbackUrl, sessionToken, discordId)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		const errorStack = error instanceof Error ? error.stack : undefined

		console.error('[game-auth] Error in game-auth endpoint:', {
			error: errorMessage,
			stack: errorStack,
			callbackUrl,
		})

		return errorResponse(
			'Internal server error occurred during authentication.',
			500,
			`Error: ${errorMessage}\n${errorStack ? `\nStack:\n${errorStack}` : ''}`
		)
	}
}

