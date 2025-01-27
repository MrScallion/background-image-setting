import * as path            from "path";
import { env }              from "vscode";
import { ExtensionSetting } from "./settings/extension";
import { MainWallpaper }    from "./wallpaper/main";
import { ProcessExplorer }  from "./wallpaper/processExplorer";
import { Optional }         from "./utils/base/optional";
import { File }             from "./utils/base/file";

export function isInstallable(): void {
	let   check   = "";
	const targets = [
		path.join(...getTargetMain()),
	];

	try {
		targets.forEach(
			(target) => {
				check = target;

				File.isWritable([check]);
			}
		);
	} catch (e) {
		if (e instanceof Error) {
			throw new Error(`You don't have write permission to the file required to run this extension. Please check the permission on "${check}".`);
		}
	}
}

export function getInstance(setting: ExtensionSetting): InstallManager {
	return new InstallManager(setting);
}

function getTargetMain(): [location: string, name: string] {
	return [
		path.join(getAppRoot(), "out", "vs", "code", "electron-sandbox", "workbench"),
		"workbench.js",
	];
}

function getTargetProcessExplorer(): [location: string, name: string] {
	return [
		path.join(getAppRoot(), "out", "vs", "code", "electron-sandbox", "processExplorer"),
		"processExplorer.js",
	];
}

function getAppRoot(): string {
	return Optional.ofNullable(env.appRoot).orElseThrow(new URIError("App root not found..."));
}

export class InstallManager {
	private static extensionKey = "wallpaper-setting";

	private main:            MainWallpaper;
	private processExplorer: ProcessExplorer;

	constructor(setting: ExtensionSetting){
		this.main            = new MainWallpaper(
			path.join(...getTargetMain()),
			setting,
			InstallManager.extensionKey
		);

		this.processExplorer = new ProcessExplorer(
			path.join(...getTargetProcessExplorer()),
			setting,
			InstallManager.extensionKey
		);
	}

	public get isInstall() {
		return this.main.isInstall;
	}

	public get isReady() {
		return this.main.isReady;
	}

	public get isAutoSet() {
		return this.main.isAutoSet;
	}

	public install(): void {
		this.main.install();
	}

	public installFromSync(data: string, opacity: number): void {
		this.main.installFromSync(data, opacity);
	}

	public installAsSlide(): void {
		this.main.installAsSlide();
	}

	public installWithPrevious(): void {
		this.main.installWithPrevious();
	}

	public uninstall(): void {
		this.main.uninstall();
	}

	public holdScriptData(): void {
		this.main.holdScriptData();
	}

	public get isAddedProcessExplorerBackgroundColor(): boolean {
		return this.processExplorer.isInstall;
	}

	public addProcessExplorerBackgroundColor(colorCode: string) {
		this.processExplorer.colorCode = colorCode;
		this.processExplorer.install();
	}

	public removeProcessExplorerBackgroundColor() {
		if (this.isAddedProcessExplorerBackgroundColor) {
			this.processExplorer.uninstall();
		}
	}
}
