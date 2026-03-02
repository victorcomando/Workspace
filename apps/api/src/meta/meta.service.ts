import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type PackageJsonVersion = {
  name?: string;
  version?: string;
};

const DEFAULT_RELEASES_API_URL =
  'https://api.github.com/repos/victorcomando/Workspace/releases/latest';
const DEFAULT_RELEASE_PAGE_URL =
  'https://github.com/victorcomando/Workspace/releases';

@Injectable()
export class MetaService {
  private updateCache: {
    checkedAt: string;
    latestVersion: string | null;
    releaseUrl: string | null;
  } | null = null;

  private readonly updateCacheTtlMs = 5 * 60 * 1000;

  private readPackageJson(filePath: string) {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(filePath, 'utf-8')) as PackageJsonVersion;
    } catch {
      return null;
    }
  }

  private readRootPackageJson() {
    const candidates = [
      resolve(process.cwd(), 'package.json'),
      resolve(process.cwd(), '../package.json'),
      resolve(process.cwd(), '../../package.json'),
      resolve(process.cwd(), '../../../package.json'),
      resolve(__dirname, '../../../package.json'),
      resolve(__dirname, '../../../../package.json'),
      resolve(__dirname, '../../../../../package.json'),
    ];

    for (const candidate of candidates) {
      const parsed = this.readPackageJson(candidate);
      if (!parsed) {
        continue;
      }
      if (parsed.name === 'workspace-monorepo' && parsed.version) {
        return parsed;
      }
    }

    return null;
  }

  getVersion() {
    const rootPackageVersion =
      this.readRootPackageJson()?.version?.trim() || null;
    if (rootPackageVersion) {
      return { version: rootPackageVersion, source: 'root-package' as const };
    }

    return { version: 'dev', source: 'fallback' as const };
  }

  private normalizeVersion(raw: string) {
    return raw.trim().replace(/^v/i, '');
  }

  private compareVersions(currentRaw: string, latestRaw: string) {
    const current = this.normalizeVersion(currentRaw);
    const latest = this.normalizeVersion(latestRaw);

    const currentParts = current.split('.').map((part) => Number(part) || 0);
    const latestParts = latest.split('.').map((part) => Number(part) || 0);
    const maxLength = Math.max(currentParts.length, latestParts.length);

    for (let index = 0; index < maxLength; index += 1) {
      const currentPart = currentParts[index] ?? 0;
      const latestPart = latestParts[index] ?? 0;
      if (latestPart > currentPart) {
        return 1;
      }
      if (latestPart < currentPart) {
        return -1;
      }
    }

    return 0;
  }

  private async loadLatestVersionFromReleaseApi() {
    const releasesApiUrl = DEFAULT_RELEASES_API_URL;
    const releasePageUrl = DEFAULT_RELEASE_PAGE_URL;

    const response = await fetch(releasesApiUrl, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) {
      throw new Error(`release_api_status_${response.status}`);
    }

    const payload = (await response.json()) as {
      tag_name?: string;
      html_url?: string;
    };

    return {
      latestVersion: payload.tag_name
        ? this.normalizeVersion(payload.tag_name)
        : null,
      releaseUrl: payload.html_url || releasePageUrl,
    };
  }

  async getVersionWithUpdate() {
    const base = this.getVersion();
    const now = Date.now();

    if (
      this.updateCache &&
      now - new Date(this.updateCache.checkedAt).getTime() <
        this.updateCacheTtlMs
    ) {
      const hasUpdate =
        this.updateCache.latestVersion !== null
          ? this.compareVersions(base.version, this.updateCache.latestVersion) >
            0
          : false;
      return {
        ...base,
        latestVersion: this.updateCache.latestVersion,
        hasUpdate,
        releaseUrl: this.updateCache.releaseUrl,
        checkedAt: this.updateCache.checkedAt,
      };
    }

    try {
      const latest = await this.loadLatestVersionFromReleaseApi();
      const checkedAt = new Date().toISOString();
      this.updateCache = {
        checkedAt,
        latestVersion: latest.latestVersion,
        releaseUrl: latest.releaseUrl,
      };

      const hasUpdate =
        latest.latestVersion !== null
          ? this.compareVersions(base.version, latest.latestVersion) > 0
          : false;

      return {
        ...base,
        latestVersion: latest.latestVersion,
        hasUpdate,
        releaseUrl: latest.releaseUrl,
        checkedAt,
      };
    } catch {
      const checkedAt = new Date().toISOString();
      this.updateCache = {
        checkedAt,
        latestVersion: null,
        releaseUrl: DEFAULT_RELEASE_PAGE_URL,
      };

      return {
        ...base,
        latestVersion: null,
        hasUpdate: false,
        releaseUrl: this.updateCache.releaseUrl,
        checkedAt,
      };
    }
  }
}
