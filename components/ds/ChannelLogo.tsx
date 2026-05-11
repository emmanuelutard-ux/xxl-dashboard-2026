type Props = {
  channel: 'google' | 'meta'
  size?: number
}

export function ChannelLogo({ channel, size = 16 }: Props) {
  if (channel === 'google') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-label="Google Ads"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    )
  }

  if (channel === 'meta') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-label="Meta Ads"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ds-meta-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0064E0" />
            <stop offset="100%" stopColor="#0098FF" />
          </linearGradient>
        </defs>
        <path
          d="M12 2C6.48 2 2 6.48 2 12c0 5 3.66 9.13 8.44 9.88V14.9H7.9V12h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.9h-2.33v6.99C18.34 21.13 22 17 22 12c0-5.52-4.48-10-10-10z"
          fill="url(#ds-meta-grad)"
        />
      </svg>
    )
  }

  return null
}

export default ChannelLogo
