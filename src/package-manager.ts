import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import semver from "semver";
import tar from "tar";
import { dependencies } from "../package.json";
import { relative } from "./common/path";

/**
 * Light-weight package manager that wraps npm, capable of updating locally-scoped installed packages.
 */
class PackageManager {
	/**
	 * Checks for an update of the specified package.
	 * @param name Name of the package.
	 * @returns The update information; otherwise undefined.
	 */
	public async checkUpdate(name: string): Promise<PackageMetadataVersion | undefined> {
		// Check if the dependency is listed within the CLI's package.json.
		const range = name in dependencies ? dependencies[name as keyof typeof dependencies] : undefined;
		if (range === undefined) {
			throw new Error(`Package is not a dependency, ${name}`);
		}

		// Get the locally installed package, and registry entries.
		const installed = this.list(name);
		const registry = await this.search(name);

		// Get the latest version.
		const latestVersion = this.getLatestVersion(registry, range);
		if (latestVersion === undefined) {
			return;
		}

		// When there isn't an installed local version, or the latest version is greater, return the latest version.
		if (installed === undefined || semver.gt(latestVersion.version, installed.version)) {
			return latestVersion;
		}
	}

	/**
	 * Installs the specified package.
	 * @param pkg Package to install.
	 */
	public async install(pkg: PackageMetadataVersion): Promise<void> {
		const res = await fetch(pkg.dist.tarball);
		await new Promise((resolve, reject) => {
			if (res.body === null) {
				reject(`Failed to download package ${pkg.name} from ${pkg.dist.tarball}`);
				return;
			}

			// Clean the installation directory.
			const cwd = relative(`../node_modules/${pkg.name}`);
			if (existsSync(cwd)) {
				rmSync(cwd, { recursive: true });
			}

			mkdirSync(cwd, { recursive: true });

			// Decompress the contents fo the installation directory.
			const stream = Readable.fromWeb(res.body);
			stream.on("close", () => resolve(true));
			stream.on("error", (err) => reject(err));
			stream.pipe(tar.extract({ strip: 1, cwd }));
		});
	}

	/**
	 * Lists the installed local package.
	 * @param name Name of the package to list.
	 * @returns The package; otherwise undefined.
	 */
	public list(name: string): Omit<PackageMetadataVersion, "dist"> | undefined {
		const pkgPath = relative(`../node_modules/${name}`);
		if (!existsSync(pkgPath)) {
			return undefined;
		}

		const pkgJsonPath = join(pkgPath, "package.json");
		if (!existsSync(pkgJsonPath)) {
			return undefined;
		}

		return JSON.parse(readFileSync(pkgJsonPath, { encoding: "utf-8" }));
	}

	/**
	 * Searches the npm registry for specified package.
	 * @param name Package to search for.
	 * @returns The package; otherwise undefined.
	 */
	public async search(name: string): Promise<PackageMetadata> {
		const res = await fetch(`https://registry.npmjs.org/${name}`, {
			headers: {
				Accept: "application/vnd.npm.install-v1+json"
			}
		});

		if (res.status !== 200) {
			throw new Error(`Failed to read package from npm registry with status code ${res.status}`);
		}

		return (await res.json()) as PackageMetadata;
	}

	/**
	 * Gets the latest version, from the package metadata, that satisfies the {@link range}.
	 * @param pkg Package metadata whose versions should be checked.
	 * @param range Range of acceptable versions.
	 * @returns Latest version; otherwise undefined.
	 */
	private getLatestVersion(pkg: PackageMetadata, range: string): PackageMetadataVersion | undefined {
		return Object.keys(pkg.versions).reduce(
			(update, version) => {
				if (semver.satisfies(version, range) && (update === undefined || semver.gt(version, update.version))) {
					update = pkg.versions[version];
				}

				return update;
			},
			undefined as PackageMetadataVersion | undefined
		);
	}
}

/**
 * Package manager capable of updating the packages, in the scope of this package.
 */
export const packageManager = new PackageManager();

/**
 * Provides information about a package, as listed in the npm registry.
 */
export type PackageMetadata = {
	/**
	 * Name of the version.
	 */
	name: string;

	/**
	 * Date the package was last modified.
	 */
	modified: Date;

	/**
	 * Versions of the package.
	 */
	versions: Record<string, PackageMetadataVersion>;
};

/**
 * Provides information about a package version, as listed in the npm registry.
 */
export type PackageMetadataVersion = {
	/**
	 * Name of the version.
	 */
	name: string;

	/**
	 * Version.
	 */
	version: string;

	/**
	 * Information relating to the package's pack file that contains the contents of the package.
	 */
	dist: {
		/**
		 * Shasum of the tarball file.
		 */
		shasum: string;

		/**
		 * URL to the tarball file that contains the contents of the package.
		 */
		tarball: string;
	};
};
