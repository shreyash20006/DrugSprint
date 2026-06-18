export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const vercelToken = process.env.VERCEL_TOKEN || process.env.VITE_VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID || process.env.VITE_VERCEL_PROJECT_ID || 'tgpcop-concil';

    if (!vercelToken || vercelToken === 'your_vercel_token') {
      // Secure Simulated Fallback logs on the server side
      const mockDeployments = [
        {
          uid: 'dep_1',
          url: 'tgpcop-concil.vercel.app',
          state: 'READY',
          created: new Date(+new Date() - 7200000).toISOString(),
          meta: {
            githubCommitRef: 'main',
            githubCommitMessage: 'feat: secure credentials protection and migrate environment variables'
          }
        },
        {
          uid: 'dep_2',
          url: 'tgpcop-concil-git-main.vercel.app',
          state: 'READY',
          created: new Date(+new Date() - 18000000).toISOString(),
          meta: {
            githubCommitRef: 'main',
            githubCommitMessage: 'bugfix: resolve unique email card overlays in council roster'
          }
        },
        {
          uid: 'dep_3',
          url: 'tgpcop-concil-failed.vercel.app',
          state: 'ERROR',
          created: new Date(+new Date() - 86400000).toISOString(),
          meta: {
            githubCommitRef: 'main',
            githubCommitMessage: 'chore: attempt deployment configuration edits'
          }
        },
        {
          uid: 'dep_4',
          url: 'tgpcop-concil-git-main.vercel.app',
          state: 'READY',
          created: new Date(+new Date() - 172800000).toISOString(),
          meta: {
            githubCommitRef: 'main',
            githubCommitMessage: 'feat: add public complaints system and mentorship connectivity'
          }
        },
        {
          uid: 'dep_5',
          url: 'tgpcop-concil-git-main.vercel.app',
          state: 'READY',
          created: new Date(+new Date() - 259200000).toISOString(),
          meta: {
            githubCommitRef: 'main',
            githubCommitMessage: 'feat: configure Brevo alert dispatch engines'
          }
        }
      ];
      return res.status(200).json({ configured: false, deployments: mockDeployments });
    }

    const response = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Vercel API returned status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json({
      configured: true,
      deployments: data.deployments || []
    });
  } catch (err) {
    console.error('Vercel API Exception:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
