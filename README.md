# Delete DNS Record Action for GitHub

Removes CloudFlare DNS record by ID or record name.

## Usage via Github Actions

```yaml
name: example
on:
  pull_request:
    type: [closed]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: kourawealthtech/cf-delete-dns-record@v1.0
        with:
          name: "review.example.com"
          token: ${{ secrets.CLOUDFLARE_TOKEN }}
          zone: ${{ secrets.CLOUDFLARE_ZONE }}
```

### Cleaning up companion hostnames

Ephemeral environments often publish secondary records alongside the primary
hostname (`live-`, `staging-`, `assets-`, `mcp-`, `idp-`, …). Set
`include_prefixed: true` to delete every `<prefix>-<name>` record in the same
call, so they cannot outlive the environment:

```yaml
      - uses: kourawealthtech/cf-delete-dns-record@master
        with:
          name: "some-host.example.com"
          include_prefixed: true
          token: ${{ secrets.CLOUDFLARE_TOKEN }}
          zone: ${{ secrets.CLOUDFLARE_ZONE }}
```

Matching is on the `-<name>` suffix, not a fixed prefix list, so a new prefix
is covered automatically. Unrelated hosts that merely start with the same
string (`...-latest-foobar` vs `...-latest-foo`) are not affected.

Default is `false`, which keeps the exact-name behaviour.


### Cleaning up companion hostnames

Ephemeral environments often publish secondary records alongside the primary
hostname (`live-`, `staging-`, `assets-`, `mcp-`, `idp-`, ...). Set
`include_prefixed: true` to delete every `<prefix>-<name>` record in the same
call, so they cannot outlive the environment:

```yaml
      - uses: kourawealthtech/cf-delete-dns-record@master
        with:
          name: "some-host.example.com"
          include_prefixed: true
          token: ${{ secrets.CLOUDFLARE_TOKEN }}
          zone: ${{ secrets.CLOUDFLARE_ZONE }}
```

Matching is on the `-<name>` suffix, not a fixed prefix list, so a new prefix
is covered automatically. Unrelated hosts that merely start with the same
string (`...-latest-foobar` vs `...-latest-foo`) are not affected.

Default is `false`, which keeps the exact-name behaviour.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
