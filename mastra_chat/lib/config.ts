export const config = {
  // White-label configuration
  appTitle: process.env.NEXT_PUBLIC_APP_TITLE || 'Árainn AI',
  appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Your AI companion powered by Seo Árainn Mhór',
  appPlaceholder: process.env.NEXT_PUBLIC_APP_PLACEHOLDER || 'Ask me about things to do in Arranmore...',
  appBgColor: process.env.NEXT_PUBLIC_APP_BG_COLOR || '#FFFFFF',
  appPrimaryColor: process.env.NEXT_PUBLIC_APP_PRIMARY_COLOR || '#1D897B',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
  appFavicon: process.env.NEXT_PUBLIC_APP_FAVICON || '/favicon.ico',
  appOgImage: process.env.NEXT_PUBLIC_APP_OG_IMAGE || '/og-image.png',

  // API configuration
  agentApiUrl: process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:4111/chat/communityAgent',

  // Debug / developer options
  showToolsOutput: process.env.NEXT_PUBLIC_SHOW_TOOLS_OUTPUT === 'true',
} as const;