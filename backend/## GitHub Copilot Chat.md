## GitHub Copilot Chat

- Extension Version: 0.27.3 (prod)
- VS Code: vscode/1.100.3
- OS: Mac

## Network

User Settings:
```json
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Environment Variables:
- NO_PROXY=

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.207.73.85 (1 ms)
- DNS ipv6 Lookup: ::ffff:20.207.73.85 (1 ms)
- Proxy URL: None (0 ms)
- Electron fetch (configured): HTTP 200 (1693 ms)
- Node.js https: HTTP 200 (1788 ms)
- Node.js fetch: HTTP 200 (6860 ms)
- Helix fetch: HTTP 200 (327 ms)

Connecting to https://api.individual.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.114.22 (102 ms)
- DNS ipv6 Lookup: ::ffff:140.82.114.22 (1 ms)
- Proxy URL: None (4 ms)
- Electron fetch (configured): HTTP 200 (1374 ms)
- Node.js https: HTTP 200 (2377 ms)
- Node.js fetch: timed out after 10 seconds
- Helix fetch: HTTP 200 (5465 ms)

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).