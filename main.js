/**
 * Delete Cloudflare DNS Record Action for GitHub
 * https://github.com/marketplace/actions/cloudflare-delete-dns-record
 */

const cp = require("child_process");

const CF_API_BASE_URL = "https://api.cloudflare.com/client/v4";
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

const api = (args) => {
  const { status, stdout } = cp.spawnSync("curl", [
    ...["--silent"],
    ...args,
    ...["--header", `Authorization: Bearer ${process.env.INPUT_TOKEN}`],
    ...["--header", "Content-Type: application/json"],
  ]);

  if (status !== 0) {
    process.exit(status);
  }

  const parsed = JSON.parse(stdout.toString());

  if (!parsed.success) {
    console.log(`::error ::${parsed.errors[0].message}`);
    process.exit(1);
  }

  return parsed;
};

/**
 * Every record in the zone. The zone is small (hundreds of records) and the
 * suffix match below cannot be expressed as an exact-name API filter, so we
 * page through once and match locally.
 */
const listAllRecords = () => {
  const records = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({ per_page: PAGE_SIZE, page });
    const { result } = api([
      `${CF_API_BASE_URL}/zones/${process.env.INPUT_ZONE}/dns_records?${params.toString()}`,
    ]);

    records.push(...result);

    if (result.length < PAGE_SIZE) {
      return records;
    }
  }

  console.log(`::warning ::Stopped paging DNS records after ${MAX_PAGES} pages`);
  return records;
};

/**
 * The hostname itself, plus — when include_prefixed is set — every
 * "<prefix>-<hostname>" companion record an app publishes alongside it
 * (live-, staging-, assets-, mcp-, idp-, …).
 *
 * Matching on the suffix rather than a hardcoded prefix list is deliberate:
 * the list drifted out of sync with the workflows that create the records
 * (www2025 cleaned live-/staging-/assets- but never mcp-), which is what
 * left orphaned CNAMEs behind in the zone.
 */
const findTargets = (records, name, includePrefixed) => {
  const wanted = name.toLowerCase();

  return records.filter((record) => {
    const candidate = record.name.toLowerCase();

    if (candidate === wanted) {
      return true;
    }

    return includePrefixed && candidate.endsWith(`-${wanted}`);
  });
};

const deleteRecord = (record) => {
  // https://api.cloudflare.com/#dns-records-for-a-zone-delete-dns-record
  api([
    ...["--request", "DELETE"],
    `${CF_API_BASE_URL}/zones/${process.env.INPUT_ZONE}/dns_records/${record.id}`,
  ]);

  console.log(`Deleted ${record.name}`);
};

if (process.env.INPUT_ID) {
  deleteRecord({ id: process.env.INPUT_ID, name: process.env.INPUT_ID });
  process.exit(0);
}

const includePrefixed = process.env.INPUT_INCLUDE_PREFIXED === "true";
const targets = findTargets(listAllRecords(), process.env.INPUT_NAME, includePrefixed);

if (targets.length === 0) {
  console.log("Record doesn't exist. Nothing to delete.");
  process.exit(0);
}

targets.forEach(deleteRecord);
